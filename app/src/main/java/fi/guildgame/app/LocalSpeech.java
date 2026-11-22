package fi.guildgame.app;
import android.content.Context;
import ai.onnxruntime.*;
import org.json.*;
import java.io.*;
import java.nio.FloatBuffer;
import java.nio.LongBuffer;
import java.util.*;

/** Short, variable-length CTC recognition, and Silero speech-only endpointing. */
final class LocalSpeech implements AutoCloseable {
 private final Context context;
 private final OrtEnvironment environment=OrtEnvironment.getEnvironment();
 private OrtSession recognizer,vad;
 private String language="";
 private String[] tokens;
 private int blank;
 private float[][][] state=new float[2][1][128];
 private float[] vadContext=new float[64];
 private volatile OrtSession.RunOptions activeRun;
 LocalSpeech(Context context){this.context=context.getApplicationContext();}
 private String assetText(String name)throws IOException{
  try(InputStream input=context.getAssets().open(name);ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
   byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)bytes.write(buffer,0,count);return bytes.toString("UTF-8");
  }
 }
 private File modelFile(String asset,long size)throws IOException{
  File file=new File(context.getFilesDir(),"v022_"+asset.replace('/','_'));
  if(file.isFile() && file.length()==size)return file;
  File temp=new File(file.getAbsolutePath()+".tmp");
  try(InputStream input=context.getAssets().open(asset);OutputStream output=new FileOutputStream(temp)){
   byte[] buffer=new byte[65536];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
  }
  if(temp.length()!=size || !temp.renameTo(file))throw new IOException("Could not prepare the offline speech model");return file;
 }
 void prepare(String requested)throws Exception{
  String lang=requested.equals("fi")?"fi":"en";
  if(recognizer!=null && language.equals(lang))return;
  if(recognizer!=null){recognizer.close();recognizer=null;}
  JSONObject cfg=new JSONObject(assetText("speech/asr-"+lang+".json"));
  JSONArray chars=cfg.getJSONArray("tokens");tokens=new String[chars.length()];for(int i=0;i<chars.length();i++)tokens[i]=chars.getString(i);
  blank=cfg.getInt("blank");
  File model=modelFile("speech/asr-"+lang+".onnx",cfg.getLong("modelBytes"));
  try(OrtSession.SessionOptions options=new OrtSession.SessionOptions()){
   options.setIntraOpNumThreads(Math.max(1,Math.min(2,Runtime.getRuntime().availableProcessors())));
   options.setInterOpNumThreads(1);options.setMemoryPatternOptimization(false);
   options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
   recognizer=environment.createSession(model.getAbsolutePath(),options);
  }
  language=lang;
 }
 void resetVad()throws Exception{
  if(vad==null){
   File model=modelFile("speech/vad.onnx",2327524L);
   try(OrtSession.SessionOptions options=new OrtSession.SessionOptions()){
    options.setIntraOpNumThreads(1);options.setInterOpNumThreads(1);vad=environment.createSession(model.getAbsolutePath(),options);
   }
  }
  state=new float[2][1][128];vadContext=new float[64];
 }
 boolean isVoice(short[] pcm,int count)throws Exception{
  float[] chunk=new float[576];System.arraycopy(vadContext,0,chunk,0,64);
  for(int i=0;i<count;i++)chunk[i+64]=pcm[i]/32768f;
  System.arraycopy(chunk,512,vadContext,0,64);
  try(OnnxTensor input=OnnxTensor.createTensor(environment,FloatBuffer.wrap(chunk),new long[]{1,576});
      OnnxTensor memory=OnnxTensor.createTensor(environment,state);
      OnnxTensor rate=OnnxTensor.createTensor(environment,LongBuffer.wrap(new long[]{16000}),new long[0])){
   Map<String,OnnxTensor> inputs=new HashMap<>();inputs.put("input",input);inputs.put("state",memory);inputs.put("sr",rate);
   try(OrtSession.Result result=vad.run(inputs)){
    float probability=((float[][])result.get(0).getValue())[0][0];state=(float[][][])result.get(1).getValue();
    return Float.isFinite(probability) && probability>=0.5f;
   }
  }
 }
 String recognize(float[] pcm,String lang)throws Exception{
  prepare(lang);float[] normalized=CtcDecoder.normalise(pcm);
  try(OnnxTensor input=OnnxTensor.createTensor(environment,FloatBuffer.wrap(normalized),new long[]{1,normalized.length});
      OrtSession.RunOptions options=new OrtSession.RunOptions()){
   activeRun=options;
   try(OrtSession.Result result=recognizer.run(Collections.singletonMap("audio",input),options)){
    return CtcDecoder.decode(((float[][][])result.get(0).getValue())[0],tokens,blank);
   }finally{activeRun=null;}
  }
 }
 void cancel(){OrtSession.RunOptions run=activeRun;if(run!=null)try{run.setTerminate(true);}catch(Exception ignored){}}
 @Override public void close(){cancel();try{if(recognizer!=null)recognizer.close();}catch(Exception ignored){}try{if(vad!=null)vad.close();}catch(Exception ignored){}}
}

package fi.guildgame.app;
import java.io.*;
import java.util.*;
import javax.sound.sampled.*;
import android.content.Context;
/** Runs the production LocalSpeech class through real ONNX Runtime JNI on the host. */
public final class LocalSpeechCheck {
 static float[] readWav(File file)throws Exception{
  try(AudioInputStream stream=AudioSystem.getAudioInputStream(file)){
   if(stream.getFormat().getSampleRate()!=16000 || stream.getFormat().getChannels()!=1 || stream.getFormat().getSampleSizeInBits()!=16)throw new AssertionError("16 kHz PCM fixture required");
   byte[] bytes=stream.readAllBytes();float[] samples=new float[bytes.length/2];
   for(int i=0;i<samples.length;i++)samples[i]=(short)((bytes[i*2]&255)|(bytes[i*2+1]<<8))/32768f;
   return samples;
  }
 }
 static float[] crop(LocalSpeech engine,float[] samples)throws Exception{
  engine.resetVad();SpeechAudio gate=new SpeechAudio(false);
  float[] recording=new float[samples.length+16000];System.arraycopy(samples,0,recording,0,samples.length);
  int used=0;
  while(used<recording.length){int count=Math.min(512,recording.length-used);short[] chunk=new short[512];for(int i=0;i<count;i++)chunk[i]=(short)(recording[used+i]*32767);used+=count;gate.acceptVoice(count,engine.isVoice(chunk,count));if(gate.finished())break;}
  return gate.prepare(recording,used);
 }
 public static void main(String[] args)throws Exception{
  File root=new File(args[0]);Context context=new Context(new File(root,"app/src/main/assets"),new File(root,"build/test-speech-cache"));
  try(LocalSpeech engine=new LocalSpeech(context)){
   engine.prepare("fi");
   for(String word:new String[]{"kissa","koira"}){
    float[] ready=crop(engine,readWav(new File(root,"tests/fixtures/Fi-"+word+".wav")));
    if(ready.length==0)throw new AssertionError("Native-speaker recording rejected: "+word);
    long begin=System.nanoTime();String actual=engine.recognize(ready,"fi").toLowerCase(Locale.ROOT);long ms=(System.nanoTime()-begin)/1000000;
    if(!actual.equals(word))throw new AssertionError(word+" -> "+actual);
    System.out.println("Finnish native-speaker end-to-end: "+word+", decode="+ms+" ms (host CPU)");
   }
   float[] silence=new float[32000];if(crop(engine,silence).length!=0)throw new AssertionError("Silence accepted as speech");
   Random random=new Random(42);float[] noise=new float[32000];for(int i=0;i<noise.length;i++)noise[i]=(float)(random.nextGaussian()*.015);
   if(crop(engine,noise).length!=0)throw new AssertionError("Steady noise accepted as speech");
   System.out.println("Silence and stationary-noise checks passed");
   engine.prepare("en");float[] english=crop(engine,readWav(new File(root,"tests/fixtures/English-JFK.wav")));
   String englishText=engine.recognize(english,"en").toLowerCase(Locale.ROOT);
   if(!englishText.startsWith("and so my fellow americans"))throw new AssertionError("English native-speaker phrase: "+englishText);
   System.out.println("English native-speaker phrase check passed: "+englishText);
  }
 }
}

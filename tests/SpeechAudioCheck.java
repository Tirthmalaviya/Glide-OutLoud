package fi.guildgame.app;
public class SpeechAudioCheck {
 static void require(boolean condition,String label){if(!condition)throw new AssertionError(label);}
 static void feed(SpeechAudio gate,int count,boolean voice){for(int i=0;i<count;i++)gate.acceptVoice(1600,voice);}
 public static void main(String[] args){
  SpeechAudio silence=new SpeechAudio(false);feed(silence,40,false);require(!silence.hasSpeech(),"silence cannot become speech");require(silence.prepare(new float[64000],64000).length==0,"silence produces no recognition waveform");
  SpeechAudio blip=new SpeechAudio(false);feed(blip,1,true);feed(blip,10,false);require(!blip.hasSpeech(),"single detector blip rejected");
  SpeechAudio word=new SpeechAudio(false);feed(word,3,false);feed(word,6,true);feed(word,7,false);require(!word.finished(),"word release timing");feed(word,1,false);require(word.finished(),"word ends without full recording wait");
  SpeechAudio sentence=new SpeechAudio(true);feed(sentence,3,false);feed(sentence,6,true);feed(sentence,8,false);require(!sentence.finished(),"sentence allows longer pauses");feed(sentence,3,false);require(sentence.finished(),"sentence release timing");
  float[] raw=new float[32000];for(int i=4800;i<14400;i++)raw[i]=(float)Math.sin(i*.1)*.02f;
  float[] crop=word.prepare(raw,raw.length);require(crop.length>=19200&&crop.length<raw.length,"short clip padding and silence crop");
  float[] normal=CtcDecoder.normalise(crop);double average=0,energy=0;for(float v:normal){require(Float.isFinite(v),"finite normalisation");average+=v;energy+=v*v;}
  require(Math.abs(average/normal.length)<.00001&&energy/normal.length>.98,"model feature normalisation");
  float[] zero=CtcDecoder.normalise(new float[100]);for(float v:zero)require(v==0,"silence stays finite zero");
  String[] chars={"|","k","i","s","a","[PAD]"};int[] ids={1,1,2,3,5,3,4,5};float[][] logits=new float[ids.length][chars.length];for(int i=0;i<ids.length;i++)logits[i][ids[i]]=3;
  require(CtcDecoder.decode(logits,chars,5).equals("kissa"),"CTC preserves double consonants separated by blank");
  System.out.println("Endpoint, waveform and CTC decoder checks passed");
 }
}

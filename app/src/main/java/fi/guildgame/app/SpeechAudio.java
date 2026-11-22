package fi.guildgame.app;
import java.util.Arrays;

/** End-of-speech timing driven by the speech detector, not a room-noise threshold. */
final class SpeechAudio {
 private static final int RATE=16000;
 private final int silenceSamples;
 private int total=0,hotFrames=0,first=-1,last=0;
 private boolean voiced=false;
 SpeechAudio(boolean sentence){silenceSamples=(sentence?1100:800)*RATE/1000;}
 void acceptVoice(int count,boolean voice){
  if(count<=0)return;total+=count;
  if(voice){hotFrames++;if(first<0)first=total-count;if(hotFrames>=2)voiced=true;last=total;}
  else{hotFrames=0;if(!voiced)first=-1;}
 }
 boolean finished(){return voiced && total>=RATE && total-last>=silenceSamples;}
 boolean hasSpeech(){return voiced;}
 float[] prepare(float[] pcm,int used){
  if(!voiced)return new float[0];
  int start=Math.max(0,first-RATE/5),end=Math.min(used,last+RATE*3/10);
  int length=Math.max(0,end-start);if(length==0)return new float[0];
  // Preserve the recording. Wav2vec's feature normalisation runs once, in CtcDecoder.
  float[] result=new float[Math.max(length,RATE*6/5)];
  System.arraycopy(pcm,start,result,0,length);return result;
 }
}

package fi.guildgame.app;
import android.content.Context;
import android.os.*;
import android.speech.tts.*;
import java.util.*;

/** Uses only installed voices explicitly marked as not requiring a network. */
final class LocalVoice {
 interface Completion { void done(boolean spoken); }
 private TextToSpeech tts;
 private boolean ready=false,initializing=true;
 private long generation=0;
 private volatile long lastOutputAt=0;
 private final Handler main=new Handler(Looper.getMainLooper());
 private Completion completion;
 private String utterance;
 LocalVoice(Context context){
  tts=new TextToSpeech(context.getApplicationContext(),status->main.post(()->{ready=status==TextToSpeech.SUCCESS;initializing=false;}));
  tts.setOnUtteranceProgressListener(new UtteranceProgressListener(){
   public void onStart(String id){}
   public void onDone(String id){main.post(()->finish(id,true));}
   public void onError(String id){main.post(()->finish(id,false));}
   @Override public void onError(String id,int code){main.post(()->finish(id,false));}
   @Override public void onStop(String id,boolean interrupted){main.post(()->finish(id,true));}
  });
 }
 private Voice localVoice(String lang){
  if(!ready)return null;
  Locale locale=Locale.forLanguageTag(lang.equals("fi")?"fi-FI":"en-US");
  if(tts.isLanguageAvailable(locale)<TextToSpeech.LANG_AVAILABLE)return null;
  Set<Voice> available=tts.getVoices();if(available==null)return null;
  Voice selected=null;
  for(Voice voice:available){
   if(!voice.getLocale().getLanguage().equals(locale.getLanguage()) || voice.isNetworkConnectionRequired())continue;
   if(voice.getFeatures()!=null && voice.getFeatures().contains("notInstalled"))continue;
   if(selected==null || score(voice,locale)>score(selected,locale))selected=voice;
  }
  return selected;
 }
 private int score(Voice voice,Locale locale){return voice.getQuality()*10+(voice.getLocale().getCountry().equals(locale.getCountry())?100:0)-voice.getLatency();}
 boolean available(String lang){return localVoice(lang)!=null;}
 String engine(){return tts.getDefaultEngine();}
 void say(String text,String lang,Completion done){
  stop();completion=done;long ticket=generation;startWhenReady(text,lang,ticket,0);
 }
 private void startWhenReady(String text,String lang,long ticket,int attempts){
  if(ticket!=generation)return;
  if(initializing && attempts<20){main.postDelayed(()->startWhenReady(text,lang,ticket,attempts+1),100);return;}
  Voice voice=localVoice(lang);
  if(voice==null || tts.setVoice(voice)!=TextToSpeech.SUCCESS){Completion done=completion;completion=null;if(done!=null)done.done(false);return;}
  tts.setSpeechRate(0.9f);tts.setPitch(1.0f);utterance=UUID.randomUUID().toString();
  int result=tts.speak(text,TextToSpeech.QUEUE_FLUSH,new Bundle(),utterance);
  if(result!=TextToSpeech.SUCCESS)finish(utterance,false);
 }
 private void finish(String id,boolean spoken){if(!Objects.equals(id,utterance))return;lastOutputAt=SystemClock.elapsedRealtime();Completion done=completion;completion=null;utterance=null;if(done!=null)done.done(spoken);}
 void stop(){generation++;Completion previous=completion;completion=null;utterance=null;if(tts!=null){if(tts.isSpeaking())lastOutputAt=SystemClock.elapsedRealtime();tts.stop();}if(previous!=null)previous.done(true);}
 long quietRemaining(){return Math.max(0,180-(SystemClock.elapsedRealtime()-lastOutputAt));}
 void close(){stop();if(tts!=null)tts.shutdown();ready=false;initializing=false;}
}

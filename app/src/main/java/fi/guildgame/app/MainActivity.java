package fi.guildgame.app;

import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.media.*;
import android.net.Uri;
import android.print.PrintManager;
import android.webkit.*;
import android.view.*;
import android.widget.FrameLayout;
import org.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class MainActivity extends Activity {
 private LocalSpeech speech;
 private BackupFiles backupFiles;
 private LocalVoice voice;
 private volatile boolean finishRequested=false;
 private boolean voiceSetupShowing=false;
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private WebView web;
 private final Handler ui=new Handler(Looper.getMainLooper());
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private final AtomicBoolean audioBusy=new AtomicBoolean(false);
 private final AtomicBoolean recording=new AtomicBoolean(false);
 private volatile boolean foreground=true;
 private PermissionRequest webPermission;
 private String permissionId, permissionMethod, permissionPayload;
 private android.content.SharedPreferences prefs;

 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  prefs=getSharedPreferences("guild-local", MODE_PRIVATE);
  speech=new LocalSpeech(this);voice=new LocalVoice(this);
  backupFiles=new BackupFiles(this,prefs,this::reply);
  String warmLanguage="en";
  try{warmLanguage=new JSONObject(prefs.getString("data","{}")).optString("lang","en");}catch(Exception ignored){}
  final String initialLanguage=warmLanguage;
  worker.execute(()->{try{speech.prepare(initialLanguage);}catch(Exception ignored){}});
  getWindow().setStatusBarColor(android.graphics.Color.rgb(234,246,255));
  getWindow().setNavigationBarColor(android.graphics.Color.rgb(234,246,255));
  web=new WebView(this);
  web.setBackgroundColor(android.graphics.Color.rgb(234,246,255));
  // Insets belong to the parent container: WebView padding does not reliably
  // change the HTML viewport and left the top buttons under system touch areas.
  FrameLayout frame=new FrameLayout(this);
  frame.setBackgroundColor(android.graphics.Color.rgb(234,246,255));
  frame.addView(web,new FrameLayout.LayoutParams(-1,-1));
  setContentView(frame);
  if(Build.VERSION.SDK_INT>=30){
   getWindow().setDecorFitsSystemWindows(false);
   frame.setOnApplyWindowInsetsListener((v,insets)-> {
    android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());
    v.setPadding(bars.left,bars.top,bars.right,bars.bottom);
    return WindowInsets.CONSUMED;
   });
   WindowInsetsController barController=getWindow().getInsetsController();
   if(barController!=null)barController.setSystemBarsAppearance(
    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
   frame.post(frame::requestApplyInsets);
  }else{
   getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  }
  WebSettings s=web.getSettings();
  s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setCacheMode(WebSettings.LOAD_NO_CACHE);
  s.setAllowFileAccess(false);s.setAllowContentAccess(false);
  s.setMediaPlaybackRequiresUserGesture(false);
  s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.addJavascriptInterface(new Bridge(), "GuildNative");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
    Uri uri=req.getUrl();
    if (!"https".equals(uri.getScheme()) || !"appassets.androidplatform.net".equals(uri.getHost())) return blocked();
    String path=uri.getPath();
    if(path==null || !path.startsWith("/assets/") || path.contains(".."))return blocked();
    try {
     String name=path.substring(8);
     String mime=name.endsWith(".html")?"text/html":name.endsWith(".js")?"application/javascript":name.endsWith(".css")?"text/css":name.endsWith(".wav")?"audio/wav":name.endsWith(".json")?"application/json":name.endsWith(".svg")?"image/svg+xml":"application/octet-stream";
     return new WebResourceResponse(mime,"UTF-8",getAssets().open(name));
    }catch(IOException e){return blocked();}
   }
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){
    Uri u=req.getUrl();return !"appassets.androidplatform.net".equals(u.getHost()) || !u.getPath().startsWith("/assets/web/");
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public void onPermissionRequest(PermissionRequest request){
    ui.post(()->{
     if(!ORIGIN.equals(request.getOrigin().toString().replaceAll("/$",""))){request.deny();return;}
     if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED) request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
     else {webPermission=request;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},12);}
    });
   }
   @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
   @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setNegativeButton("Cancel",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
  });
  web.loadUrl(ORIGIN+"/assets/web/index.html");
 }
 private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 public class Bridge {
  @JavascriptInterface public String loadData(){return prefs.getString("data", "");}
  @JavascriptInterface public boolean saveData(String data){return data.length()<5000000 && prefs.edit().putString("data",data).commit();}
  @JavascriptInterface public void call(String id,String method,String payload){ui.post(()->dispatch(id,method,payload));}
 }
 private void reply(String id,Object result,String error){
  JSONObject obj=new JSONObject();try{obj.put("id",id);obj.put("result",result==null?JSONObject.NULL:result);obj.put("error",error==null?JSONObject.NULL:error);}catch(JSONException e){return;}
  ui.post(()->{if(!isDestroyed())web.evaluateJavascript("window.GuildBridge && window.GuildBridge.receive("+obj+")",null);});
 }
 private void event(String type,String value){
  ui.post(()->{if(!isDestroyed())web.evaluateJavascript("window.dispatchEvent(new CustomEvent("+JSONObject.quote(type)+",{detail:"+JSONObject.quote(value)+"}))",null);});
 }
 private void dispatch(String id,String method,String payload){
  if(backupFiles.dispatch(id,method,payload))return;
  if(method.equals("stop")){recording.set(false);speech.cancel();voice.stop();reply(id,true,null);return;}
  if(method.equals("finishSpeech")){finishRequested=true;reply(id,true,null);return;}
  if(method.equals("stopVoice")){voice.stop();reply(id,true,null);return;}
  if(method.equals("voiceSettings")){openVoiceSettings();reply(id,true,null);return;}
  if(method.equals("voiceStatus")){
   try{reply(id,new JSONObject().put("en",voice.available("en")).put("fi",voice.available("fi")),null);}catch(Exception e){reply(id,null,e.getMessage());}return;
  }
  if(method.equals("say")){
   try{
    JSONObject options=new JSONObject(payload);String lang=options.optString("lang","en"),text=options.getString("text");
    if(!foreground || text.length()>500){reply(id,null,"Voice is unavailable");return;}
    voice.say(text,lang,spoken->{try{reply(id,new JSONObject().put("spoken",spoken),null);}catch(Exception ignored){}if(!spoken && foreground)offerVoiceSetup(lang);});
   }catch(Exception e){reply(id,null,e.getMessage());}return;
  }
  if(method.equals("warm")){
   try{String lang=new JSONObject(payload).optString("lang","en");worker.execute(()->{try{speech.prepare(lang);reply(id,true,null);}catch(Exception e){reply(id,null,e.getMessage());}});}catch(Exception e){reply(id,null,e.getMessage());}return;
  }
  if(method.equals("print")){
   PrintManager pm=(PrintManager)getSystemService(PRINT_SERVICE);pm.print("Glide Game report",web.createPrintDocumentAdapter("Glide Game report"),null);reply(id,true,null);return;
  }
  if(method.equals("status")){reply(id,"offline-ctc",null);return;}
  if(!method.equals("speech") && !method.equals("meter")){reply(id,null,"Unknown operation");return;}
  if(!foreground){reply(id,null,"App is paused");return;}
  if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){
   if(permissionId!=null){reply(id,null,"Permission request already open");return;}
   permissionId=id;permissionMethod=method;permissionPayload=payload;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},11);return;
  }
  if(!audioBusy.compareAndSet(false,true)){reply(id,null,"Microphone is busy. Please wait.");return;}
  recording.set(true);finishRequested=false;voice.stop();
  worker.execute(()->capture(id,method,payload));
 }
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] grants){
  super.onRequestPermissionsResult(request,permissions,grants);
  boolean granted=grants.length>0 && grants[0]==PackageManager.PERMISSION_GRANTED;
  if(request==12 && webPermission!=null){if(granted)webPermission.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else webPermission.deny();webPermission=null;}
  if(request==11 && permissionId!=null){String id=permissionId,m=permissionMethod,p=permissionPayload;permissionId=null;if(granted)dispatch(id,m,p);else reply(id,null,"Microphone permission denied. Allow it in Android Settings > Apps > Glide Game > Permissions.");}
 }
 private void capture(String id,String method,String payload){
  AudioRecord rec=null;
  try {
   JSONObject options=new JSONObject(payload);
   boolean meter=method.equals("meter");
   int seconds=Math.min(10,Math.max(2,options.optInt("seconds",4)));
   if(!meter){speech.resetVad();long quiet=voice.quietRemaining();if(quiet>0)SystemClock.sleep(quiet);if(!foreground || !recording.get())throw new IOException("Recording cancelled");}
   int min=AudioRecord.getMinBufferSize(16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT);
   rec=new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,16000,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,Math.max(min,4096));
   if(rec.getState()!=AudioRecord.STATE_INITIALIZED)throw new IOException("Microphone could not start");
   rec.startRecording();
   if(!meter)event("guild-listening",id);
   short[] chunk=new short[meter?1600:512];float[] pcm=new float[seconds*16000];int used=0;
   SpeechAudio gate=new SpeechAudio(seconds>=6);
   long start=System.currentTimeMillis();
   if(meter)reply(id,true,null);
   while(recording.get() && foreground && (meter || !finishRequested) && (meter?System.currentTimeMillis()-start<300000:used<pcm.length)){
    int count=rec.read(chunk,0,Math.min(chunk.length,meter?chunk.length:pcm.length-used));
    if(count<0)throw new IOException("Microphone read failed");
    if(count==0)continue;
    double sum=0;
    for(int i=0;i<count;i++){float f=chunk[i]/32768f;sum+=f*f;if(!meter)pcm[used++]=f;}
    if(!meter){gate.acceptVoice(count,speech.isVoice(chunk,count));if(gate.finished())break;}
    if(meter)event("guild-meter",String.valueOf(Math.sqrt(sum/count)));
   }
   rec.stop();rec.release();rec=null;
   if(meter){event("guild-meter","0");return;}
   if(!recording.get() || !foreground)throw new IOException("Recording cancelled");
   event("guild-recorded",id);
   float[] ready=gate.prepare(pcm,used);
   if(ready.length==0){reply(id,new JSONObject().put("heard",""),null);return;}
   String language=options.optString("lang","en");
   event("guild-processing",id);
   long decodingStarted=SystemClock.elapsedRealtime();
   String heard=speech.recognize(ready,language);
   android.util.Log.i("GuildSpeech","recordedMs="+(used*1000/16000)+" decodeMs="+(SystemClock.elapsedRealtime()-decodingStarted));
   if(!foreground)throw new IOException("App is paused");
   reply(id,new JSONObject().put("heard",heard.trim()),null);
  }catch(Exception e){reply(id,null,e.getMessage()==null?"Audio failed":e.getMessage());if(method.equals("meter"))event("guild-meter-error","Microphone stopped");}
  finally{if(rec!=null){try{rec.stop();}catch(Exception ignored){}rec.release();}recording.set(false);audioBusy.set(false);}
 }
 private void offerVoiceSetup(String lang){
  if(voiceSetupShowing || isFinishing())return;voiceSetupShowing=true;
  boolean fi=lang.equals("fi");
  new AlertDialog.Builder(this).setTitle(fi?"Offline-puheääni puuttuu":"Offline voice needed")
   .setMessage(fi?"Asenna suomen offline-puheääni Androidin puheasetuksista. Latauksen jälkeen ääni toimii ilman internetiä. Sovellus ei käytä tarkistamattomia synteettisiä tallenteita.":"Install the English offline voice in Android's speech settings. After this one-time download, it works without internet. The app will not play unverified pronunciation recordings.")
   .setPositiveButton(fi?"Avaa puheasetukset":"Open voice settings",(d,w)->openVoiceSettings())
   .setNegativeButton(fi?"Myöhemmin":"Later",null).setOnDismissListener(d->voiceSetupShowing=false).show();
 }
 private void openVoiceSettings(){
  try{Intent intent=new Intent(android.speech.tts.TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);String engine=voice.engine();if(engine!=null)intent.setPackage(engine);startActivity(intent);}
  catch(Exception e){try{startActivity(new Intent("com.android.settings.TTS_SETTINGS"));}catch(Exception ignored){new AlertDialog.Builder(this).setMessage("Open Android Settings > System > Languages > Text-to-speech output > Voice data. Install Finnish and English offline voices.").setPositiveButton("OK",null).show();}}
 }
 @Override protected void onPause(){foreground=false;recording.set(false);speech.cancel();voice.stop();event("guild-paused","");super.onPause();}
 @Override protected void onResume(){super.onResume();foreground=true;event("guild-resumed","");}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);backupFiles.result(request,result,data);}
 @Override public void onBackPressed(){
  recording.set(false);speech.cancel();voice.stop();
  web.evaluateJavascript("typeof window.GuildPracticeGuard === 'function'",result->{
   if("true".equals(result))web.evaluateJavascript("window.GuildPracticeGuard()",null);
   else {web.evaluateJavascript("window.dispatchEvent(new Event('guild-leaving'))",null);if(web.canGoBack())web.goBack();else MainActivity.super.onBackPressed();}
  });
 }
 @Override protected void onDestroy(){recording.set(false);speech.cancel();voice.close();worker.execute(speech::close);worker.shutdown();web.removeJavascriptInterface("GuildNative");web.destroy();super.onDestroy();}
}

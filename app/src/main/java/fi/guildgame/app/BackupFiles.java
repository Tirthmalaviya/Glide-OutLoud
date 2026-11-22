package fi.guildgame.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** User-selected document backup. No network or broad storage permission. */
final class BackupFiles {
 interface Reply { void send(String id,Object value,String error); }
 private static final int EXPORT=7301,IMPORT=7302,MAX=4000000;
 private final Activity activity;
 private final SharedPreferences prefs;
 private final Reply reply;
 private String requestId,exportJson;
 BackupFiles(Activity activity,SharedPreferences prefs,Reply reply){this.activity=activity;this.prefs=prefs;this.reply=reply;}
 boolean dispatch(String id,String method,String payload){
  if(!method.equals("exportBackup")&&!method.equals("importBackup")&&!method.equals("saveRecovery")&&!method.equals("loadRecovery"))return false;
  try{
   if(method.equals("loadRecovery")){reply.send(id,prefs.getString("recovery",null),null);return true;}
   if(method.equals("saveRecovery")){String json=new JSONObject(payload).getString("json");validate(json);if(!prefs.edit().putString("recovery",json).commit())throw new IOException("Recovery copy could not be saved");reply.send(id,true,null);return true;}
   if(requestId!=null)throw new IOException("A file picker is already open");
   Intent intent;
   if(method.equals("exportBackup")){
    exportJson=new JSONObject(payload).getString("json");validate(exportJson);
    intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE,"Glide_Game_Backup_"+new java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.ROOT).format(new java.util.Date())+".json");
   }else intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*").putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});
   requestId=id;activity.startActivityForResult(intent,method.equals("exportBackup")?EXPORT:IMPORT);
  }catch(Exception e){if(id.equals(requestId)){requestId=null;exportJson=null;}reply.send(id,null,e.getMessage());}
  return true;
 }
 private void validate(String json)throws Exception{
  if(json==null||json.getBytes(StandardCharsets.UTF_8).length>MAX)throw new IOException("Backup is too large (maximum 4 MB)");
  JSONObject root=new JSONObject(json);
  if(!root.optString("format").equals("guild-game-backup")||root.optInt("version")!=1||!root.has("data"))throw new IOException("Not a Glide Game backup");
 }
 boolean result(int request,int result,Intent data){
  if(request!=EXPORT&&request!=IMPORT)return false;
  String id=requestId,json=exportJson;requestId=null;exportJson=null;if(id==null)return true;
  if(result!=Activity.RESULT_OK||data==null||data.getData()==null){reply.send(id,null,"Cancelled. App data was not changed.");return true;}
  Uri uri=data.getData();
  try{
   if(request==EXPORT){
    try(OutputStream output=activity.getContentResolver().openOutputStream(uri,"wt")){if(output==null)throw new IOException("Could not open file");output.write(json.getBytes(StandardCharsets.UTF_8));output.flush();}
    reply.send(id,true,null);
   }else{
    ByteArrayOutputStream bytes=new ByteArrayOutputStream();
    try(InputStream input=activity.getContentResolver().openInputStream(uri)){if(input==null)throw new IOException("Could not open backup");byte[] buffer=new byte[8192];int count;while((count=input.read(buffer))!=-1){if(bytes.size()+count>MAX)throw new IOException("Backup is too large (maximum 4 MB)");bytes.write(buffer,0,count);}}
    String content=StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes.toByteArray())).toString();validate(content);reply.send(id,content,null);
   }
  }catch(Exception e){reply.send(id,null,e.getMessage()==null?"File operation failed":e.getMessage());}
  return true;
 }
}

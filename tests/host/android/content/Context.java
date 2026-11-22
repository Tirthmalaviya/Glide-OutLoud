package android.content;
import java.io.File;
import android.content.res.AssetManager;
/** Host-only asset adapter. Not included in Android application sources. */
public final class Context {
 private final AssetManager assets;private final File cache;
 public Context(File root,File cache){assets=new AssetManager(root);this.cache=cache;cache.mkdirs();}
 public Context getApplicationContext(){return this;}
 public AssetManager getAssets(){return assets;}
 public File getFilesDir(){return cache;}
}

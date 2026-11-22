#!/usr/bin/env python3
"""Package compiled SDK output with web/assets and frozen ONNX native libraries.
Normal development builds should use ./gradlew assembleDebug instead.
This helper expects resources.apk and dex/classes.dex in build/ and a supplied
0.2.2 APK as the verified source of the unchanged native runtime libraries.
Use zipalign and apksigner after generating build/unsigned.apk.
"""
import argparse,pathlib,zipfile
p=argparse.ArgumentParser();p.add_argument('--baseline',type=pathlib.Path,required=True);a=p.parse_args()
r=pathlib.Path(__file__).resolve().parent.parent
with zipfile.ZipFile(r/'build/unsigned.apk','w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as out:
 with zipfile.ZipFile(r/'build/resources.apk') as source:
  for name in source.namelist():out.writestr(name,source.read(name),compress_type=zipfile.ZIP_STORED if name=='resources.arsc' else zipfile.ZIP_DEFLATED)
 out.write(r/'build/dex/classes.dex','classes.dex')
 for folder,prefix in [('web','assets/web'),('licenses','assets/licenses'),('app/src/main/assets/speech','assets/speech')]:
  for f in (r/folder).rglob('*'):
   if f.is_file():out.write(f,prefix+'/'+f.relative_to(r/folder).as_posix())
 with zipfile.ZipFile(a.baseline) as source:
  for n in source.namelist():
   if n.startswith('lib/') and n.endswith('.so'):out.writestr(n,source.read(n),compress_type=zipfile.ZIP_STORED)
print(r/'build/unsigned.apk')

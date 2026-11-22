#!/usr/bin/env python3
"""Verify frozen speech assets/source and, optionally, a packaged APK."""
import argparse,hashlib,json,pathlib,struct,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--apk',type=pathlib.Path);args=p.parse_args()
freeze=json.loads((root/'SPEECH_FREEZE.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for name,digest in freeze['files'].items():assert sha((root/name).read_bytes())==digest,name
s=(root/'app/src/main/java/fi/guildgame/app/MainActivity.java').read_text();capture=s[s.index(' private void capture('):s.index(' private void offerVoiceSetup(')];assert sha(capture.encode())==freeze['captureSha256'],'Capture pipeline'
if args.apk:
 with zipfile.ZipFile(args.apk) as z:
  assert z.testzip() is None,'CRC error'
  for name,digest in freeze['nativeLibraries'].items():assert sha(z.read(name))==digest,name
  for item in json.loads((root/'MODEL_ARTIFACTS.json').read_text()):assert sha(z.read('assets/speech/'+item['file']))==item['sha256'],item['file']
  for f in (root/'web').rglob('*'):
   if f.is_file():assert z.read('assets/web/'+f.relative_to(root/'web').as_posix())==f.read_bytes(),str(f)
  for i in z.infolist():
   if i.filename=='resources.arsc' or i.filename.endswith('.so'):
    with args.apk.open('rb') as stream:stream.seek(i.header_offset);header=stream.read(30)
    offset=i.header_offset+30+sum(struct.unpack_from('<HH',header,26));assert i.compress_type==0,i.filename;assert offset%(16384 if i.filename.endswith('.so') else 4)==0,i.filename
print('Frozen speech source, capture and model checks passed'+('; APK assets/native libraries/alignment/CRCs passed' if args.apk else ''))

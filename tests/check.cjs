/* Node 18+; tests real game scripts with a small DOM stub, not a rendering test. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const web=path.join(__dirname,'../web');let checks=0;
function ok(test,label){assert.ok(test,label);checks++;}
function context(page,lang='en',age=6){
 const store=new Map(),elements=new Map(),timers=new Map();let seq=0;
 function el(){return {style:{},dataset:{},children:[],value:'',options:[{}],disabled:false,hidden:false,classList:{add(){},remove(){}},setAttribute(){},appendChild(x){this.children.push(x)},getAttribute(){return ''},querySelectorAll(){return []},closest(){return el()},focus(){},select(){},addEventListener(){},setPointerCapture(){}};}
 const data={lang,playerId:'p1',players:[{id:'p1',name:'Player 1',age,xp:0,badges:[]}],sessions:[],settings:{hold:'auto',targetSound:'',checkSpeech:true}};
 let saved=JSON.stringify(data),heard='',held=false,lastSpeechId=null;const calls=[],listeners=new Map();
 const c={console,Map,Set,Date,Math,JSON,Promise,Number,String,Array,Error,CustomEvent:function(){},requestAnimationFrame(){},location:{href:''},navigator:{},alert(){},confirm:()=>true,fetch:async()=>({json:async()=>({})}),Audio:function(){this.play=()=>Promise.resolve();this.pause=()=>{};},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{documentElement:{},querySelectorAll:()=>[],createElement:el,getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);}},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)}};
 c.window=c;
 function completeSpeech(id){c.dispatchEvent({type:'guild-recorded',detail:id});c.GuildBridge.receive({id,result:{heard}});}
 c.GuildNative={loadData:()=>saved,saveData:v=>saved=v,call(id,method,payload){
  calls.push({method,options:JSON.parse(payload)});
  if(method==='speech'){lastSpeechId=id;queueMicrotask(()=>{c.dispatchEvent({type:'guild-listening',detail:id});if(!held)completeSpeech(id);});return;}
  if(method==='finishSpeech')queueMicrotask(()=>completeSpeech(lastSpeechId));
  queueMicrotask(()=>c.GuildBridge.receive({id,result:method==='say'?{spoken:true}:true}));
 }};
 vm.createContext(c);
 for(const f of ['native.js','app.js','content.js','practice.js','api.js'])vm.runInContext(fs.readFileSync(path.join(web,'js',f),'utf8'),c,{filename:f});
 if(page){const html=fs.readFileSync(path.join(web,page),'utf8');for(const m of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c,{filename:page});}
 return {c,calls,hold:value=>held=value,get:id=>c.document.getElementById(id),run:s=>vm.runInContext(s,c),heard:v=>heard=v,saved:()=>saved,advance(){for(const [id,t] of [...timers])if(t.ms<10000){timers.delete(id);t.fn();}}};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
(async()=>{
 for(const f of fs.readdirSync(web).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(path.join(web,f),'utf8');for(const m of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:f});ok(!/(?:src|href)=["']https?:/.test(html),f+' has no remote assets');}
 const base=context();ok(base.run('GG.matches({en:["cat"]},["Cat!"])'),'case/punctuation');ok(!base.run('GG.matches({en:["cat"]},["caterpillar"])'),'reject substring');ok(!base.run('GG.matches({en:["the cat sleeps"]},["cat"])'),'reject partial sentence');ok(!base.run('GG.matches({en:["cat"]},[""])'),'reject silence');
 for(const lang of ['en','fi'])for(const age of [4,6,9]){
  const h=context('say-word.html',lang,age);await flush();for(let i=0;i<5;i++){h.get('ok').onclick();h.get('ok').onclick();h.advance();}ok(h.run('GG.data.sessions.length')===1,'one session despite double tap');ok(h.run('GG.data.sessions[0].items.length')===5,'five speech items');ok(h.run('GG.player().xp')===55,'XP correct');ok(!h.run('GG.player().badges.includes("perfect")'),'adult marks not automatic perfect');ok(h.c.location.href==='reward.html','speech reward navigation');ok(JSON.parse(h.saved()).sessions.length===1,'native persistence');
 }
 const skip=context('say-word.html');await flush();for(let i=0;i<5;i++)skip.get('skip').onclick();ok(skip.run('GG.data.sessions[0].stars')===0,'skip gives no stars');
 const success=context('say-word.html');await flush();success.heard(success.get('word').textContent);await success.get('mic').onclick();ok(success.run('results[0].result')==='heard','native transcript success');success.advance();
 const fail=context('say-word.html');await flush();fail.heard('unrelated answer');for(let i=0;i<3;i++)await fail.get('mic').onclick();ok(fail.run('results[0].result')==='helped','retry limit');ok(fail.run('stars')===0,'incorrect speech gives no stars');
 for(const lang of ['en','fi'])for(const age of [4,6,9]){
  const find=context('find-it.html',lang,age);await flush();for(let r=0;r<5;r++){find.run('pick(targets[0],document.createElement("button"))');if(age===9)find.run('pick(targets[1],document.createElement("button"))');find.advance();}ok(find.run('GG.data.sessions[0].stars')===5,'find full session');
 }
 const retry=context('find-it.html');retry.run('pick(opts.find(o=>o!==targets[0]),document.createElement("button"));pick(targets[0],document.createElement("button"))');retry.advance();ok(retry.run('results[0].result')==='wrong','find retry tracked');
 const ball=context('balloon.html');for(let r=0;r<3;r++){ball.run('holdDown=true;assisted=true;fill=0.999;last=1;loop(50)');ball.advance();}ok(ball.run('GG.data.sessions[0].items.every(i=>i.assisted)'),'balloon assistance tracked');ok(ball.c.location.href==='reward.html','balloon reward');
 const manual=context('say-word.html');await flush();manual.hold(true);manual.heard(manual.get('word').textContent);
 const pending=manual.get('mic').onclick();await flush();
 ok(manual.run('recordingNow')===true&&!manual.get('mic').disabled,'microphone enables manual finish only after native listening event');
 await manual.get('mic').onclick();await pending;
 ok(manual.calls.some(x=>x.method==='finishSpeech'),'second microphone tap ends recording');
 ok(manual.run('results[0].result')==='heard','manual-finish result recorded');
 // Speech requests must pass the actual written prompt and its locale to native Android.
 for(const lang of ['en','fi']){
  const voice=context(null,lang);
  for(const item of voice.run('[...GG.WORDS,...GG.SENTENCES]')){
   const text=typeof item[lang]==='string'?item[lang]:item[lang][0];
   ok(typeof text==='string'&&text.length>0,'written prompt present');
   await voice.run('GG.speak('+JSON.stringify(text)+')');
   const call=voice.calls.filter(x=>x.method==='say').at(-1);
   ok(call.options.lang===lang&&call.options.text===text,'native voice gets exact prompt and correct language');
  }
 }
 console.log(`${checks} checks passed. DOM stub tests do not verify visual layout, Android lifecycle, microphone hardware or speech accuracy.`);
})().catch(e=>{console.error(e);process.exit(1)});

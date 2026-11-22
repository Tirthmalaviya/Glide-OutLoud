/* Data-model and selection tests; no audio model or Android emulation. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');let checks=0;
const ok=(v,n)=>{assert.ok(v,n);checks++;};
function load(data){let persisted=JSON.stringify(data);const c={console,Date,Math,JSON,Map,Set,Array,Number,String,Error,setTimeout,clearTimeout,location:{},document:{querySelectorAll:()=>[],documentElement:{}},sessionStorage:{setItem(){},removeItem(){}},localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},GuildBridge:{native:true,call:async()=>true},GuildNative:{loadData:()=>persisted,saveData:s=>persisted=s}};c.window=c;vm.createContext(c);for(const f of ['app.js','content.js','practice.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../web/js',f),'utf8'),c);return {run:s=>vm.runInContext(s,c),saved:()=>JSON.parse(persisted)};}
const old={lang:'fi',playerId:'one',players:[{id:'one',name:'Sam',age:9,xp:55,badges:['first-quest']},{id:'two',name:'Alex',age:6,xp:0,badges:[]}],settings:{targetSound:'p,m,',hold:'8',checkSpeech:false},sessions:[{playerId:'one',game:'say',lang:'fi',level:2,items:[{target:'Kissa nukkuu',heard:'kissa nukkuu',tries:1,result:'heard'}],stars:1,total:1,xp:15,date:'2026-11-01T12:00:00Z'}]};
const h=load(old);
ok(h.run('GG.data.schemaVersion')===3,'schema migration');ok(h.run('GG.settings().hold')==='8','old hold retained');ok(h.run('GG.settings().targetSound')==='','invalid comma target cleared');ok(h.run('GG.data.sessions.length')===1,'history retained');ok(h.run('GG.player().xp')===55,'XP retained');
h.run("GG.settings().hold='2';GG.settings().targetSound='s';GG.settings().checkSpeech=true;GG.save();GG.selectPlayer('two')");ok(h.run('GG.settings().hold')==='8','hold isolated');ok(h.run('GG.settings().targetSound')==='','focus isolated');ok(h.run('GG.settings().checkSpeech')===false,'checking isolated');h.run("GG.setLang('en');GG.selectPlayer('one')");ok(h.run('GG.data.lang')==='fi','language restored on selection');
for(const lang of ['en','fi']){
 h.run(`GG.setLang('${lang}')`);
 for(const age of [4,6,9]){
  h.run(`GG.player().age=${age};GG.settings().targetSound=''`);
  const bank=h.run('Practice.pool()');ok(bank.length>=8,'large enough age pool');ok(new Set(bank.map(i=>i.id)).size===bank.length,'unique content IDs');
  for(const sound of h.run(`Content.sounds('${lang}')`)){
   h.run(`GG.settings().targetSound='${sound}'`);const pool=h.run('Practice.pool()');ok(pool.every(i=>i.sounds.includes(sound)),'no silent fallback');
   const chosen=h.run("Practice.choose(Practice.pool(),8,'say')");ok(chosen.length===Math.min(8,pool.length),'requested item count capped to available focus');ok(new Set(chosen.map(i=>i.id)).size===chosen.length,'no repetition within say quest');
  }
 }
 ok(h.run(`new Set(Content.words('${lang}').map(i=>i.pic)).size===Content.words('${lang}').length`),'distinct pictures within a language');
 for(const i of h.run(`Content.words('${lang}')`)){ok(i[lang].length>0&&i.sounds.length>0,'word has accepted answers and sound metadata');ok(i.lv===0||i.lv===1,'language-specific age band');}
}
h.run("GG.setLang('fi');GG.player().age=9;GG.settings().targetSound='';GG.data.sessions=[];const target=Practice.pool()[0];GG.data.sessions.push({playerId:GG.player().id,lang:'fi',game:'say',items:[{id:target.id,target:GG.shown(target),result:'helped',tries:3}]});");ok(h.run("Practice.choose(Practice.pool(),5,'say').every(i=>i.id!==target.id)"),'recent items avoided when alternatives exist');
h.run("GG.data.sessions.push({playerId:GG.player().id,lang:'fi',game:'say',items:[]},{playerId:GG.player().id,lang:'fi',game:'say',items:[]})");ok(h.run("Practice.choose(Practice.pool(),5,'say')[0].id===target.id"),'difficult item revisited after recent window');
h.run("GG.setLang('en');GG.player().age=4;GG.settings().targetSound='d'");ok(!h.run("Practice.pool().find(w=>w.en[0]==='dog').en.includes('puppy')"),'focus excludes synonyms with a different initial sound');
const m=h.run("Practice.sessionMetrics({game:'say',items:[{result:'heard',tries:1},{result:'heard',tries:2},{result:'adult',tries:1},{result:'helped',tries:3},{result:'skip',tries:0}]})");ok(m.matches===2&&m.adult===1&&m.first===1&&m.retries===2&&m.skipped===1&&m.practised===4,'statistics separate outcomes');ok(h.run("Practice.sessionMetrics({game:'balloon',items:[{result:'correct',assisted:true},{result:'correct',assisted:false}]}).matches")===0,'balloons cannot count as speech matches');
const b=load(old);const raw=b.run('Practice.backup()');const valid=b.run('Practice.validateBackup('+JSON.stringify(raw)+')');ok(valid.players.length===2&&valid.sessions.length===1,'backup round trip validates');b.run('Practice.installBackup(Practice.validateBackup('+JSON.stringify(raw)+'))');ok(b.saved().players[0].xp===55,'restore retains XP');ok(b.run('GG.settings().hold')==='8','restore retains personal settings');
for(const mutation of [o=>o.format='other',o=>o.version=9,o=>o.data.players.push(o.data.players[0]),o=>o.data.sessions[0].playerId='unknown',o=>o.data.sessions[0].items[0].result='perfect',o=>o.data.sessions[0].total=100,o=>o.data.players[0].xp=-1]){let o=JSON.parse(raw);mutation(o);assert.throws(()=>b.run('Practice.validateBackup('+JSON.stringify(JSON.stringify(o))+')'));checks++;}
assert.throws(()=>b.run('Practice.validateBackup("not json")'));checks++;
b.run("Practice.checkpoint('say',{tries:1});");ok(b.run("Practice.draft('say',{tries:0}).tries")===1,'quest resume');b.run("GG.selectPlayer('two')");ok(b.run("Practice.draft('say',{tries:0}).tries")===0,'draft isolation');b.run("GG.selectPlayer('one');GG.settings().hold='2'");ok(b.run("Practice.draft('say',{tries:0}).tries")===0,'changed plan invalidates draft');
const counted=load(old);counted.run("GG.finishSession({id:'once',game:'say',lang:'fi',level:2,items:[{target:'Kissa nukkuu',heard:'',tries:1,result:'adult'}],stars:1,total:1});GG.finishSession({id:'once',game:'say',lang:'fi',level:2,items:[],stars:1,total:1})");ok(counted.run('GG.player().xp')===70,'idempotent completion prevents duplicate XP');
console.log(`${checks} migration, isolation, content, scheduling, metrics and backup checks passed.`);

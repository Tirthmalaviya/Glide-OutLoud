/* Personal practice plans, legacy migration, transparent selection and reporting.
   Speech playback, microphone capture, CTC models and answer matching are unchanged. */
window.Practice=(()=>{
 const fi=()=>GG.data.lang==='fi';
 const text=(en,finnish)=>fi()?finnish:en;
 const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
 const defaults=()=>({lang:'en',hold:'auto',targetSound:'',checkSpeech:true,quest:'auto',rounds:5});
 function cleanSettings(s={},lang='en'){
  const l=s.lang==='fi'?'fi':s.lang==='en'?'en':lang==='fi'?'fi':'en';
  return {lang:l,hold:['auto','2','3','4','6','8'].includes(String(s.hold))?String(s.hold):'auto',targetSound:Content.sounds(l).includes(s.targetSound)?s.targetSound:'',checkSpeech:s.checkSpeech!==false,quest:['auto','say','find','balloon'].includes(s.quest)?s.quest:'auto',rounds:[3,5,8].includes(Number(s.rounds))?Number(s.rounds):5};
 }
 function migrate(){
  const d=GG.data,legacy=d.settings||{};
  for(const p of d.players){p.settings=cleanSettings(p.settings||{...legacy,lang:d.lang},d.lang);p.drafts=p.drafts||{};}
  delete d.settings;d.schemaVersion=3;d.lang=GG.player().settings.lang;
 }
 migrate();
 const settings=()=>GG.player().settings;
 GG.settings=settings;
 const baseSave=GG.save;
 GG.save=()=>{if(JSON.stringify(GG.data).length>4000000)throw Error(text('Storage is almost full. Export a backup before deleting old results.','Tallennustila on lähes täynnä. Vie varmuuskopio ennen vanhojen tulosten poistamista.'));if(GuildBridge.native){if(GuildNative.saveData(JSON.stringify(GG.data))===false)throw Error(text('Progress could not be saved. Check available device storage.','Tallennus epäonnistui. Tarkista laitteen vapaa tallennustila.'));}else baseSave();};
 GG.selectPlayer=id=>{if(!GG.data.players.some(p=>p.id===id))return;GG.data.playerId=id;GG.data.lang=settings().lang;GG.save();if(GuildBridge.native)GuildBridge.call('warm',{lang:GG.data.lang}).catch(()=>{});};
 const oldLang=GG.setLang;
 GG.setLang=lang=>{GG.player().drafts={};settings().lang=lang==='fi'?'fi':'en';if(!Content.sounds(settings().lang).includes(settings().targetSound))settings().targetSound='';oldLang(settings().lang);};
 const pool=(lang=settings().lang,age=GG.player().age,focus=settings().targetSound)=>{
  const lv=GG.levelOfAge(age),items=lv===2?Content.sentences(lang):Content.words(lang).filter(w=>w.lv===lv);
  return focus?items.filter(w=>w.sounds.includes(focus)).map(w=>Array.isArray(w[lang])?{...w,[lang]:w[lang].filter(a=>w.aliasSounds[a]===focus)}:w):items;
 };
 function choose(items,count,game,avoid=[]){
  const history=GG.data.sessions.filter(s=>s.playerId===GG.player().id&&s.lang===GG.data.lang&&s.game===game);
  const key=i=>i.id||i.target;
  const recent=new Set(history.slice(-2).flatMap(s=>s.items.map(key)).concat(avoid));
  const latest=new Map();for(const s of history)for(const i of s.items)latest.set(key(i),i);
  const rank=i=>{const k=i.id,old=latest.get(k)||latest.get(GG.shown(i));return (old&&(old.result==='helped'||old.result==='skip'||old.result==='wrong'||old.tries>1)?0:1)+(recent.has(k)||recent.has(GG.shown(i))?2:0);};
  // Difficult items return first once outside the recent window; all eligible
  // content remains reachable. Shuffle breaks ties without repeating an item.
  return GG.shuffle(items).sort((a,b)=>rank(a)-rank(b)).slice(0,count);
 }
 const suggested=()=>settings().quest!=='auto'?settings().quest:(()=>{const h=GG.data.sessions.filter(s=>s.playerId===GG.player().id);if(!h.length)return 'say';const last=h.at(-1);if(last.game==='say'&&last.items.some(i=>i.result==='helped'))return 'find';return {say:'find',find:'balloon',balloon:'say'}[last.game]||'say';})();
 const gameName=g=>GG.t({say:'g1',find:'g2',balloon:'g3'}[g]);
 const language=l=>l==='fi'?'Suomi':'English';
 const summary=()=>`${GG.player().name} · ${language(settings().lang)} · ${text('up to','enintään')} ${settings().rounds} ${text('activities','tehtävää')}`;
 const sessionMetrics=s=>{
  const items=s.items||[],say=s.game==='say',find=s.game==='find',ball=s.game==='balloon';
  return {entries:items.length,practised:items.filter(i=>i.result!=='skip').length,matches:say?items.filter(i=>i.result==='heard').length:0,adult:say?items.filter(i=>i.result==='adult').length:0,first:items.filter(i=>say?i.result==='heard'&&i.tries===1:find&&i.result==='correct').length,retries:items.filter(i=>i.tries>1||i.result==='wrong').length,skipped:items.filter(i=>i.result==='skip').length,review:items.filter(i=>i.result==='helped').length,balloons:ball?items.filter(i=>!i.assisted&&i.result==='correct').length:0,assisted:ball?items.filter(i=>i.assisted).length:0};
 };
 const originalFinish=GG.finishSession;
 GG.finishSession=s=>{
  if(s.id&&GG.data.sessions.some(x=>x.id===s.id))return null;
  s.id=s.id||uid();s.settings={...settings()};s.contentVersion='1.0';
  delete GG.player().drafts[s.game];return originalFinish(s);
 };
 function draft(game,initial){
  const saved=GG.player().drafts[game];
  if(saved&&saved.lang===GG.data.lang&&saved.level===GG.ageLevel()&&JSON.stringify(saved.settings)===JSON.stringify(settings()))return saved.state;
  delete GG.player().drafts[game];return initial;
 }
 function checkpoint(game,state){GG.player().drafts[game]={lang:GG.data.lang,level:GG.ageLevel(),settings:{...settings()},state,updated:new Date().toISOString()};GG.save();}
 function banner(){const el=document.getElementById('practiceIdentity');if(el)el.textContent=`${GG.player().name} · ${language(GG.data.lang)}`;}
 function toast(message){let el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3000);}
 function guard(hasProgress,save){
  let leaving=false;
  const leave=href=>{if(leaving)return;save();GG.stopSpeaking();GuildBridge.stop();window.dispatchEvent(new Event('guild-paused'));if(!hasProgress()){leaving=true;location.href=href;return;}
   let dialog=document.getElementById('leaveDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='leaveDialog';dialog.innerHTML=`<h2>${text('Pause practice?','Keskeytetäänkö harjoitus?')}</h2><p>${text('Your progress is saved. You can continue this quest later.','Edistymisesi tallennetaan. Voit jatkaa tehtävää myöhemmin.')}</p><div class="dialog-actions"><button class="btn btn-primary" id="stayPractice">${text('Continue practice','Jatka harjoitusta')}</button><button class="btn btn-ghost" id="leavePractice">${text('Save and leave','Tallenna ja poistu')}</button></div>`;document.body.appendChild(dialog);}
   dialog.querySelector('#stayPractice').onclick=()=>dialog.close();dialog.querySelector('#leavePractice').onclick=()=>{leaving=true;location.href=href;};if(!dialog.open)dialog.showModal();};
  document.querySelectorAll('a[href="games.html"],a[href="index.html"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();leave(a.getAttribute('href'));}));
  window.GuildPracticeGuard=()=>leave('games.html');
  window.addEventListener('pagehide',save);window.addEventListener('guild-paused',save);
 }
 function resultLabel(i){return i.assisted?text('Touch assisted','Painikkeella autettu'):i.result==='heard'?text('Recognizer matched','Puheentunnistus vastasi'):i.result==='adult'?text('Adult approved','Aikuisen hyväksymä'):i.result==='correct'?text('Completed first time','Valmis ensi yrityksellä'):i.result==='wrong'?text('Completed after retry','Valmis uusintayrityksellä'):i.result==='helped'?text('Practise again','Harjoittele uudelleen'):text('Skipped','Ohitettu');}
 function validateBackup(raw){
  if(typeof raw!=='string'||raw.length>4000000)throw Error('Backup is too large');
  const obj=JSON.parse(raw);if(obj.format!=='guild-game-backup'||obj.version!==1)throw Error('Unsupported backup format');
  const d=obj.data;if(!d||!Array.isArray(d.players)||!d.players.length||d.players.length>200||!Array.isArray(d.sessions)||d.sessions.length>10000)throw Error('Invalid players or sessions');
  const ids=new Set();const players=d.players.map(p=>{if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>24||!Number.isInteger(p.age)||p.age<3||p.age>10||!Number.isFinite(p.xp)||p.xp<0||p.xp>100000000)throw Error('Invalid player');ids.add(p.id);return {id:p.id,name:p.name,age:p.age,xp:p.xp,badges:Array.isArray(p.badges)?p.badges.filter(x=>GG.BADGES.some(b=>b.id===x)):[],settings:cleanSettings(p.settings,d.lang),drafts:{}};});
  const sessionIds=new Set();const sessions=d.sessions.map(s=>{if(!s||!ids.has(s.playerId)||!['say','find','balloon'].includes(s.game)||!['en','fi'].includes(s.lang)||!Array.isArray(s.items)||s.items.length<1||s.items.length>100||!Number.isFinite(Date.parse(s.date))||!Number.isInteger(s.total)||s.total!==s.items.length||!Number.isInteger(s.stars)||s.stars<0||s.stars>s.total)throw Error('Invalid session');
   const id=typeof s.id==='string'&&s.id.length<=100?s.id:uid();if(sessionIds.has(id))throw Error('Duplicate session');sessionIds.add(id);
   const items=s.items.map(i=>{if(!i||typeof i.target!=='string'||i.target.length>500||typeof(i.heard||'')!=='string'||(i.heard||'').length>2000||!Number.isInteger(i.tries)||i.tries<0||i.tries>10000||!['heard','adult','correct','wrong','helped','skip'].includes(i.result))throw Error('Invalid exercise result');const item={target:i.target,heard:i.heard||'',tries:i.tries,result:i.result};if(typeof i.id==='string'&&i.id.length<100)item.id=i.id;if(typeof i.assisted==='boolean')item.assisted=i.assisted;if(Number.isFinite(i.seconds)&&i.seconds>0&&i.seconds<=60)item.seconds=i.seconds;return item;});
   return {id,playerId:s.playerId,game:s.game,lang:s.lang,level:[0,1,2].includes(s.level)?s.level:0,date:s.date,stars:s.stars,total:s.total,items,xp:Number.isFinite(s.xp)?Math.max(0,s.xp):0,...(s.settings?{settings:cleanSettings(s.settings,s.lang)}:{})};});
  // Drafts are intentionally not restored: completed records are portable,
  // unfinished recordings/exercise state are device-local.
  return {schemaVersion:3,playerId:ids.has(d.playerId)?d.playerId:players[0].id,lang:players.find(p=>p.id===(ids.has(d.playerId)?d.playerId:players[0].id)).settings.lang,players,sessions,settings:{}};
 }
 const backup=()=>JSON.stringify({format:'guild-game-backup',version:1,exportedAt:new Date().toISOString(),data:{...GG.data,players:GG.data.players.map(p=>({...p,drafts:{}}))}},null,2);
 function installBackup(valid){const d=GG.data;for(const k of Object.keys(d))delete d[k];Object.assign(d,valid);migrate();GG.save();sessionStorage.removeItem('gg-last');}
 GG.save();
 return {text,uid,settings,defaults,cleanSettings,pool,choose,suggested,gameName,language,summary,sessionMetrics,draft,checkpoint,banner,toast,guard,resultLabel,validateBackup,backup,installBackup};
})();

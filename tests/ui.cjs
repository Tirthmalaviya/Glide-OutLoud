/* Real Chromium DOM and layout tests with a simulated native bridge.
   This is not Android microphone/TTS/file-picker testing. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../web'),shots=path.resolve(__dirname,'../build/qa');fs.mkdirSync(shots,{recursive:true});let checks=0;
const ok=(v,n)=>{assert.ok(v,n);checks++;};
const fixture={lang:'fi',playerId:'p1',players:[{id:'p1',name:'Sam',age:9,xp:55,badges:['first-quest']},{id:'p2',name:'Alex',age:6,xp:0,badges:[]}],settings:{hold:'8',targetSound:'p,m,',checkSpeech:false},sessions:[{playerId:'p1',game:'say',lang:'fi',level:2,date:'2026-10-31T10:00:00Z',stars:2,total:3,xp:25,items:[{target:'Kissa nukkuu',heard:'kissa nukkuu',tries:1,result:'heard'},{target:'Lintu lentää korkealla',heard:'',tries:1,result:'adult'},{target:'Koira juoksee nopeasti',heard:'',tries:0,result:'skip'}]}]};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM,headless:true,args:['--no-sandbox','--single-process','--no-zygote','--in-process-gpu']});
 const context=await browser.newContext({viewport:{width:393,height:780}});
 await context.route('https://guild.test/**',async route=>{const rel=new URL(route.request().url()).pathname.slice(1)||'index.html';if(rel.includes('..'))return route.abort();const file=path.join(root,rel);if(!fs.existsSync(file))return route.fulfill({status:404,body:''});const ext=path.extname(file);await route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[ext]||'application/octet-stream'});});
 await context.addInitScript(data=>{
  if(!localStorage.getItem('guild-game-v1'))localStorage.setItem('guild-game-v1',JSON.stringify(data));window.nativeCalls=[];
  window.GuildNative={loadData:()=>localStorage.getItem('guild-game-v1'),saveData:s=>localStorage.setItem('guild-game-v1',s),call:(id,method,payload)=>{
   const o=JSON.parse(payload);window.nativeCalls.push({method,...o});
   let result=true,error=null;
   if(method==='voiceStatus')result={en:true,fi:true};if(method==='say')result={spoken:true};
   if(method==='speech'){
    window.lastSpeechId=id;setTimeout(()=>window.dispatchEvent(new CustomEvent('guild-listening',{detail:id})),20);
    if(window.holdSpeech)return;
    result={heard:window.mockHeard||document.getElementById('word').textContent};
    setTimeout(()=>{window.dispatchEvent(new CustomEvent('guild-recorded',{detail:id}));GuildBridge.receive({id,result});},70);return;
   }
   if(method==='finishSpeech')setTimeout(()=>{const sid=window.lastSpeechId;window.dispatchEvent(new CustomEvent('guild-recorded',{detail:sid}));GuildBridge.receive({id:sid,result:{heard:document.getElementById('word').textContent}});},20);
   if(method==='exportBackup')localStorage.setItem('mock_export',o.json);
   if(method==='importBackup')result=localStorage.getItem('mock_import')||'invalid';
   if(method==='saveRecovery')localStorage.setItem('mock_recovery',o.json);
   if(method==='loadRecovery')result=localStorage.getItem('mock_recovery');
   setTimeout(()=>GuildBridge.receive({id,result,error}),10);
  }};
 },fixture);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const go=async file=>{await page.goto('https://guild.test/'+file);await page.waitForTimeout(100);if(file==='therapist.html'&&page.url().includes('parent-gate')){const nums=(await page.locator('#question').textContent()).match(/\d+/g).map(Number);await page.fill('#answer',String(nums[0]+nums[1]));await page.click('#enter');await page.waitForURL('**/therapist.html');await page.waitForTimeout(100);}};
 await go('therapist.html');await page.click('#tab-practice');
 ok(await page.inputValue('#sHold')==='8','migration hold rendered');ok(await page.inputValue('#sSound')==='','invalid legacy focus not misleading');
 await page.fill('#pName','Sam');await page.selectOption('#sLang','en');await page.selectOption('#sHold','2');await page.selectOption('#sSound','s');await page.check('#sCheck');await page.selectOption('#sRounds','3');await page.click('#saveBtn');
 ok(await page.locator('#saveStatus').textContent()==='Saved for this player','nonblocking saved feedback');
 await page.click('[data-player="p2"]');await page.click('#tab-practice');ok(await page.inputValue('#sHold')==='8','UI settings isolated');ok(await page.inputValue('#sLang')==='fi','language isolated');
 await page.click('[data-player="p1"]');await page.click('#tab-practice');ok(await page.inputValue('#sHold')==='2','return to own settings');ok(await page.inputValue('#sLang')==='en','return to own language');
 await page.click('#tab-results');ok((await page.locator('#stats').textContent()).includes('Recognizer matches'),'honest metrics');await page.click('[data-session]');ok((await page.locator('#detail').textContent()).includes('Kissa nukkuu'),'legacy session review');
 await page.click('#tab-backup');await page.click('#backupBtn');const exported=await page.evaluate(()=>localStorage.getItem('mock_export'));ok(JSON.parse(exported).data.players.length===2,'backup includes all profiles');
 await page.click('#restoreBtn');await page.waitForTimeout(80);ok((await page.locator('#backupStatus').textContent()).includes('Could not open'),'invalid import rejected');
 await page.evaluate(raw=>localStorage.setItem('mock_import',raw),exported);await page.click('#restoreBtn');await page.waitForSelector('#restoreDialog[open]');await page.click('#cancelRestore');ok(await page.locator('#title').textContent()==='Sam','cancelled restore unchanged');
 await page.click('#restoreBtn');await page.click('#confirmRestore');await page.waitForTimeout(100);ok(await page.locator('#title').textContent()==='Sam','restore succeeds');ok(await page.evaluate(()=>!!localStorage.getItem('mock_recovery')),'recovery saved before restore');
 await page.click('#startSession');await page.waitForURL('**/games.html');ok(await page.locator('#practiceIdentity').textContent()==='Sam · English','active player visible');
 await go('say-word.html');ok(await page.locator('#adultHelp').getAttribute('open')===null,'adult controls collapsed');ok((await page.locator('#word').textContent()).length>0,'content appears');
 await page.evaluate(()=>window.holdSpeech=true);await page.click('#mic');await page.waitForTimeout(70);ok((await page.locator('#micLabel').textContent())==='Finish recording','finish recording visible');await page.click('#mic');await page.waitForTimeout(130);ok((await page.locator('#msg').textContent()).includes('Great job'),'speech unchanged success flow');
 await page.waitForTimeout(1500);const nextWord=await page.locator('#word').textContent();await page.click('a[href="games.html"]');await page.waitForSelector('#leaveDialog[open]');await page.click('#leavePractice');await page.waitForURL('**/games.html');ok((await page.locator('.quest-hint').first().textContent()).includes('Continue'),'saved quest shown');await go('say-word.html');ok(await page.locator('#word').textContent()===nextWord,'resume at next item');
 await page.evaluate(()=>window.mockHeard='wrong answer');for(let i=0;i<3;i++){await page.click('#mic');await page.waitForTimeout(130);}await page.waitForTimeout(2700);await page.click('#adultHelp summary');await page.click('#ok');await page.waitForURL('**/reward.html');ok((await page.locator('h1').textContent()).includes('Practice complete'),'effort-focused reward');ok(await page.locator('#nextQuest').getAttribute('href')==='find-it.html','suggestion responds to difficult speech');
 await go('find-it.html');await page.waitForTimeout(1000);const spoken=await page.evaluate(()=>nativeCalls.filter(x=>x.method==='say').map(x=>x.text));ok(spoken[0].startsWith('First the ')&&spoken[1].startsWith('then the '),'ordered audio cues');
 await page.evaluate(()=>{pick(targets[0],document.querySelector('.tile'));});await go('find-it.html');ok(await page.evaluate(()=>step)===1,'sequence step resumes');
 await go('balloon.html');await page.click('#startMic');await page.waitForTimeout(1300);ok((await page.locator('#msg').textContent()).includes('Now say'),'microphone check');await page.evaluate(()=>window.dispatchEvent(new CustomEvent('guild-meter',{detail:'0.1'})));await page.waitForTimeout(300);ok((await page.locator('#note').textContent()).includes('Microphone ready'),'microphone check detects sound');
 // Responsive screens in both languages, including long Finnish words and names.
 for(const lang of ['en','fi'])for(const [w,h] of [[360,740],[393,780],[800,1280],[1024,600],[667,375]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(l=>{GG.player().name='Alexandria Alexandra';GG.setLang(l);GG.player().settings.targetSound='';GG.save();},lang);
  for(const file of ['index.html','games.html','say-word.html','find-it.html','balloon.html','therapist.html']){
   await go(file);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);ok(!overflow,`${lang} ${file} page fits ${w}x${h}`);
   const small=await page.locator('button:visible,a[href]:visible').evaluateAll(els=>els.filter(e=>{const b=e.getBoundingClientRect();return b.height>0&&b.height<40;}).map(e=>e.id||e.textContent.trim().slice(0,20)));ok(small.length===0,`touch targets ${lang} ${file} ${small}`);
   if(w===393&&h===780&&lang==='fi')await page.screenshot({path:path.join(shots,file.replace('.html','.png')),fullPage:true});
  }
  await page.click('#tab-practice');ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),'practice form fits');
  if(w===393&&lang==='fi')await page.screenshot({path:path.join(shots,'settings-fi.png'),fullPage:true});
 }
 ok(errors.length===0,'no browser runtime errors: '+errors.join('; '));console.log(`${checks} real-browser workflow/layout checks passed. Native services were simulated.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

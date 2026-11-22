/* All speech stays on the Android device. Browser previews use adult marking. */
const API = (() => {
 async function available(){return GuildBridge.native;}
 async function speechMode(){return GG.settings().checkSpeech && GuildBridge.native ? 'local' : 'adult';}
 async function checkSpeech(accepted,seconds=4,onRecorded,onListening){
  const res=await GuildBridge.call('speech',{lang:GG.data.lang,seconds},onRecorded,onListening);
  return {mode:'local',heard:[res.heard || ''],correct:GG.matches({[GG.data.lang]:accepted},[res.heard || ''])};
 }
 async function saveSession(){return true;}
 async function words(){return null;}
 function reset(){}
 return {available,speechMode,checkSpeech,saveSession,words,reset};
})();

/* Native Android bridge. No network speech fallback in the installed app. */
window.GuildBridge = (() => {
 const native = typeof window.GuildNative !== 'undefined';
 const pending = new Map(); let serial = 0; const prefix = Date.now().toString(36) + Math.random().toString(36).slice(2) + '-';
 function call(method, options = {}, onRecorded, onListening) {
  if (!native) return Promise.reject(new Error('Open the installed Android app for offline speech.'));
  const id = prefix + (++serial);
  return new Promise((resolve,reject) => {
   const timer=setTimeout(()=>{pending.delete(id);if(['speech','meter'].includes(method))window.GuildNative.call(prefix+(++serial),'stop','{}');reject(new Error('The operation took too long. Please try again.'));},['importBackup','exportBackup'].includes(method)?300000:['speech','meter'].includes(method)?45000:15000);
   pending.set(id,{resolve,reject,timer,onRecorded,onListening});
   window.GuildNative.call(id,method,JSON.stringify(options));
  });
 }
 function receive(message){const p=pending.get(message.id);if(!p)return;clearTimeout(p.timer);pending.delete(message.id);if(message.error)p.reject(new Error(message.error));else p.resolve(message.result);}
 window.addEventListener('guild-listening',e=>{const p=pending.get(e.detail);if(p?.onListening)p.onListening();});
 window.addEventListener('guild-recorded',e=>{const p=pending.get(e.detail);if(p?.onRecorded)p.onRecorded();});
 function stop(){if(native)call('stop').catch(()=>{});}
 window.addEventListener('pagehide',stop);
 window.addEventListener('guild-leaving',stop);
 return {native,call,receive,stop};
})();

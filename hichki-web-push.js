/* Optional browser Web Push registration. Requires a VAPID public key supplied by deployment configuration. */
(() => {
  'use strict';
  const meta=()=>document.querySelector('meta[name="hichki-vapid-public-key"]')?.content||'';
  const base64ToBytes=input=>{const pad='='.repeat((4-input.length%4)%4);const raw=atob((input+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))};
  async function enable(){if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw Error('web_push_unsupported');const key=meta();if(!key)throw Error('vapid_public_key_missing');const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('notification_permission_denied');const registration=await navigator.serviceWorker.ready;let sub=await registration.pushManager.getSubscription();if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(key)});const rt=window.HichkiRealtime;if(!rt)throw Error('realtime_bridge_missing');await rt.registerPushToken(JSON.stringify(sub.toJSON()),'web',localStorage.getItem('hichki.deviceId')||crypto.randomUUID());return sub}
  window.HichkiWebPush={enable};
})();

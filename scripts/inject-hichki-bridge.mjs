import { readFile, writeFile } from 'node:fs/promises';

const path = 'index.html';
let html = await readFile(path, 'utf8');
const marker = 'HICHKI_REALTIME_BRIDGE_V2';

if (!html.includes(marker)) {
  const bridge = `
<!-- ${marker} -->
<script src="/hichki-realtime.js" defer></script>
<script src="/hichki-offline-queue.js" defer></script>
<script>
(() => {
  const register = async (token) => {
    if (!token || !window.HichkiRealtime) return;
    try {
      let deviceId = localStorage.getItem('hichki.deviceId');
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('hichki.deviceId', deviceId); }
      const platform = /Android/i.test(navigator.userAgent) ? 'android' : /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'web';
      await window.HichkiRealtime.registerPushToken(token, platform, deviceId);
    } catch (error) { console.warn('Hichki push token sync:', error); }
  };
  window.addEventListener('hichki:native-push-token', event => register(event.detail));
  window.HichkiRegisterPushToken = register;
  window.addEventListener('hichki:auth-ready', () => window.HichkiOfflineQueue?.flush());
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Hichki service worker:', error));
})();
</script>
`;
  html = html.replace('</body>', `${bridge}</body>`);
}

const sw = `const CACHE='hichki-shell-v3';
const STATIC=['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png','/icon-512-maskable.png','/apple-touch-icon.png','/hichki-realtime.js','/hichki-offline-queue.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{};}catch{data={body:event.data?.text()||'New message'};}const title=data.title||'Hichki';const options={body:data.body||'New message',icon:'/icon-192.png',badge:'/icon-192.png',data:data.data||{}};event.waitUntil(self.registration.showNotification(title,options));});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=event.notification.data?.url||'/';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client){client.navigate(target);return client.focus();}}return clients.openWindow(target);}));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy)).catch(()=>{});return response;}).catch(()=>caches.match('/index.html')));return;}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});return response;})));});
`;
await writeFile('public/sw.js', sw, 'utf8');
await writeFile(path, html, 'utf8');
console.log('Hichki realtime bridge injected');

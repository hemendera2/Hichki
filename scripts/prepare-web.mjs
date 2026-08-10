import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const base = 'https://hichki.netlify.app';
const requiredRemoteFiles = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
];

// sw.js is intentionally NOT fetched from the deployed Netlify site.
// The deployment may not expose the service worker even though the app itself does.
// Native builds must be self-contained and must never fail because of a missing
// optional web-host asset.
const fallbackServiceWorker = `const CACHE = 'hichki-native-v1';
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
`;

await mkdir('public', { recursive: true });

for (const file of requiredRemoteFiles) {
  const res = await fetch(`${base}/${file}`);
  if (!res.ok) throw new Error(`Unable to fetch required app asset ${file}: ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  await writeFile(file === 'index.html' ? 'index.html' : `public/${file}`, body);
}

// Always provide a local service worker for PWA compatibility. This removes the
// previous hard dependency on https://hichki.netlify.app/sw.js (which can be 404).
await writeFile('public/sw.js', fallbackServiceWorker, 'utf8');

let html = await (await import('node:fs/promises')).readFile('index.html', 'utf8');
const marker = 'HICHKI_NATIVE_GESTURES_V1';
if (!html.includes(marker)) {
  const gesture = `\n<script>/* ${marker} */
(()=>{let sx=0,sy=0,st=0,moved=false,target=null;const EDGE=34,MIN=72;const interactive=e=>!!e?.closest?.('button,a,input,textarea,select,[contenteditable="true"],[role="button"]');document.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();moved=false;target=e.target},{passive:true});document.addEventListener('touchmove',e=>{if(e.touches.length===1){const t=e.touches[0];moved=Math.abs(t.clientX-sx)>18||Math.abs(t.clientY-sy)>18}},{passive:true});document.addEventListener('touchend',e=>{if(!moved||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;if(dt>650)return;const active=document.activeElement;if(active&&/INPUT|TEXTAREA/.test(active.tagName)&&dy>55&&Math.abs(dy)>Math.abs(dx)*1.15){active.blur();return}if(dx>MIN&&sx<=EDGE&&Math.abs(dx)>Math.abs(dy)*1.25){if(interactive(target)&&sx>10)return;if(typeof window.goBack==='function')window.goBack();else if(typeof window.go==='function')window.go('h');else if(history.length>1)history.back();return}if(dy<-MIN&&Math.abs(dy)>Math.abs(dx)*1.25){const input=document.getElementById('inp')||document.querySelector('textarea');if(input){input.focus({preventScroll:true});input.scrollIntoView({block:'nearest',behavior:'smooth'})}}},{passive:true});})();</script>\n`;
  html = html.replace('</body>', `${gesture}</body>`);
  await writeFile('index.html', html);
}

if (existsSync('native.js')) await copyFile('native.js', 'public/native.js');

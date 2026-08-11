import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const base = 'https://hichki.netlify.app';
const requiredRemoteFiles = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
];

const fallbackServiceWorker = `const CACHE = 'hichki-native-v1';
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
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

// Netlify does not currently publish a separate maskable icon. Reuse the
// canonical 512px artwork rather than making production builds depend on a
// nonexistent remote asset. The manifest still advertises it as any/maskable.
await copyFile('public/icon-512.png', 'public/icon-512-maskable.png');

await writeFile('public/sw.js', fallbackServiceWorker, 'utf8');

let html = await (await import('node:fs/promises')).readFile('index.html', 'utf8');

const premiumMarker = 'HICHKI_PREMIUM_POLISH_V2';
if (!html.includes(premiumMarker)) {
  const polish = `
<style id="${premiumMarker}">
:root{
  --hk-bg:#0b0b0d;--hk-surface:#141417;--hk-surface-2:#1a1a1f;--hk-text:#f5f2e9;--hk-muted:#a8a4a0;--hk-accent:#f4c542;--hk-accent-soft:rgba(244,197,66,.14);--hk-line:rgba(255,255,255,.09);--hk-shadow:0 18px 55px rgba(0,0,0,.34);
}
html{font-family:Inter,"DM Sans","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{overscroll-behavior:none;touch-action:pan-x pan-y;}
button,[role="button"],a,input,textarea,select{font:inherit;-webkit-tap-highlight-color:transparent}
button,[role="button"]{transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .18s ease,box-shadow .22s ease,background-color .22s ease,border-color .22s ease}
button:active,[role="button"]:active{transform:scale(.975)}
input,textarea,select{transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}
input:focus,textarea:focus,select:focus{outline:none;box-shadow:0 0 0 3px var(--hk-accent-soft),0 8px 28px rgba(0,0,0,.12)}

/* Native-feeling sheets/dialogs: animate without changing the app's existing DOM logic. */
[class*="modal"],[class*="dialog"],[class*="popup"],[class*="sheet"],[class*="overlay"]{
  transition:opacity .22s ease,visibility .22s ease,transform .28s cubic-bezier(.22,1,.36,1),filter .22s ease;
}
[class*="modal"]>*:first-child,[class*="dialog"]>*:first-child,[class*="popup"]>*:first-child,[class*="sheet"]>*:first-child{
  transition:transform .28s cubic-bezier(.22,1,.36,1),opacity .2s ease;
}
.hk-modal-open{animation:hkFadeIn .2s ease both}.hk-sheet-open{animation:hkSheetIn .3s cubic-bezier(.22,1,.36,1) both}
@keyframes hkFadeIn{from{opacity:0}to{opacity:1}}
@keyframes hkSheetIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
@keyframes hkPop{0%{transform:scale(.96);opacity:0}100%{transform:none;opacity:1}}
@keyframes hkPulse{0%,100%{box-shadow:0 0 0 0 rgba(244,197,66,0)}50%{box-shadow:0 0 0 7px rgba(244,197,66,.10)}}
.hk-live-pulse{animation:hkPulse 2.2s ease-in-out infinite}

/* Safer touch targets around edge controls / notches. */
button,.hk-theme-chip{min-height:42px;min-width:42px}
@supports(padding:max(0px)){body{padding-bottom:max(0px,env(safe-area-inset-bottom))}}

/* Premium theme palette. The original app remains the source of truth; these variables are additive. */
body[data-hk-theme="obsidian-gold"]{--hk-bg:#0b0b0d;--hk-surface:#141417;--hk-surface-2:#1b1b20;--hk-text:#f5f2e9;--hk-muted:#a8a4a0;--hk-accent:#f4c542;--hk-accent-soft:rgba(244,197,66,.14);--hk-line:rgba(255,255,255,.09)}
body[data-hk-theme="midnight-lilac"]{--hk-bg:#0b0b12;--hk-surface:#14131c;--hk-surface-2:#1b1925;--hk-text:#f4f1ff;--hk-muted:#aaa5bd;--hk-accent:#b7a3ff;--hk-accent-soft:rgba(183,163,255,.15);--hk-line:rgba(214,205,255,.11)}
body[data-hk-theme="forest-mint"]{--hk-bg:#08110e;--hk-surface:#101a17;--hk-surface-2:#16231f;--hk-text:#edf7f2;--hk-muted:#9eb5ab;--hk-accent:#7fe0bd;--hk-accent-soft:rgba(127,224,189,.14);--hk-line:rgba(197,242,225,.10)}
body[data-hk-theme="rose-ember"]{--hk-bg:#120b0c;--hk-surface:#1b1214;--hk-surface-2:#24181b;--hk-text:#fff1f0;--hk-muted:#c2a8aa;--hk-accent:#ff9a86;--hk-accent-soft:rgba(255,154,134,.14);--hk-line:rgba(255,220,215,.10)}
.hk-theme-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0 4px}
.hk-theme-chip{border:1px solid var(--hk-line);border-radius:14px;background:var(--hk-surface);color:var(--hk-text);padding:10px 7px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;box-shadow:0 7px 24px rgba(0,0,0,.10)}
.hk-theme-chip:hover{transform:translateY(-1px)}.hk-theme-chip.is-active{border-color:var(--hk-accent);box-shadow:0 0 0 2px var(--hk-accent-soft),0 10px 28px rgba(0,0,0,.18)}
.hk-theme-swatch{width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.16)}.hk-theme-name{font-size:10px;line-height:1.1;opacity:.86;text-align:center}

/* Prevent accidental text selection while performing swipe gestures. */
.hk-swipe-active{user-select:none!important;-webkit-user-select:none!important}
</style>
<script>/* ${premiumMarker} */
(()=>{
  const THEME_KEY='hichki.ui.theme';
  const themes={
    'obsidian-gold':{name:'Obsidian Gold',swatch:'#f4c542'},
    'midnight-lilac':{name:'Midnight Lilac',swatch:'#b7a3ff'},
    'forest-mint':{name:'Forest Mint',swatch:'#7fe0bd'},
    'rose-ember':{name:'Rose Ember',swatch:'#ff9a86'}
  };
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const applyTheme=(name)=>{
    if(!themes[name])name='obsidian-gold';
    document.body.dataset.hkTheme=name;
    try{localStorage.setItem(THEME_KEY,name)}catch{}
    qsa('.hk-theme-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.theme===name));
  };
  const closeCandidate=(el)=>{
    if(!el)return false;
    const close=qs('[data-close],.close,.modal-close,.sheet-close,.popup-close,button[aria-label*="close" i],button[aria-label*="cancel" i]',el);
    if(close){close.click();return true}
    el.classList.remove('open','active','show','visible');
    el.setAttribute('aria-hidden','true');
    if(el.style.display==='block')el.style.display='none';
    return true;
  };
  const looksLikeLayer=(el)=>{
    if(!(el instanceof HTMLElement))return false;
    const c=(el.className||'').toString().toLowerCase();
    return /(modal|dialog|popup|sheet|overlay|backdrop|context-menu|reaction|share-panel)/.test(c)||el.getAttribute('role')==='dialog';
  };
  const closeOnOutside=(e)=>{
    const t=e.target;
    if(!(t instanceof Element))return;
    let layer=t;
    while(layer&&layer!==document.body&&!looksLikeLayer(layer))layer=layer.parentElement;
    if(!layer||layer===document.body)return;
    /* Only the backdrop itself closes it. A tap inside the panel must remain usable. */
    if(t===layer||t.matches('.backdrop,.overlay,.modal-backdrop,.sheet-backdrop'))closeCandidate(layer);
  };
  document.addEventListener('click',closeOnOutside,true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){
    const layers=qsa('[role="dialog"],.modal.open,.modal.active,.sheet.open,.sheet.active,.popup.open,.popup.active');
    if(layers.length)closeCandidate(layers[layers.length-1]);
  }});

  const addThemeUI=()=>{
    if(document.querySelector('.hk-theme-bar'))return;
    const headings=qsa('h1,h2,h3,h4,h5,h6,div,span').filter(el=>/settings/i.test((el.textContent||'').trim()));
    let host=headings.find(el=>/settings/i.test((el.textContent||'').trim())&&el.children.length===0);
    host=host?.closest('section,article,.screen,.page,.panel,.view')||document.body;
    const bar=document.createElement('div');bar.className='hk-theme-bar';bar.setAttribute('aria-label','App themes');
    Object.entries(themes).forEach(([id,t])=>{const b=document.createElement('button');b.type='button';b.className='hk-theme-chip';b.dataset.theme=id;b.innerHTML='<span class="hk-theme-swatch" style="background:'+t.swatch+'"></span><span class="hk-theme-name">'+t.name+'</span>';b.addEventListener('click',()=>applyTheme(id));bar.appendChild(b)});
    const label=document.createElement('div');label.textContent='Appearance';label.style.cssText='font-size:12px;opacity:.72;margin-top:16px;letter-spacing:.02em';
    const marker=document.createElement('div');marker.append(label,bar);
    const reset=qsa('button').find(b=>/reset all data/i.test(b.textContent||''));
    if(reset?.parentElement)reset.parentElement.before(marker);else host.appendChild(marker);
  };
  const boot=()=>{
    let saved='obsidian-gold';try{saved=localStorage.getItem(THEME_KEY)||saved}catch{}
    applyTheme(saved);addThemeUI();
    /* Make every obvious live indicator breathe subtly without changing its meaning. */
    qsa('[class*="live" i],[class*="online" i]').forEach(el=>el.classList.add('hk-live-pulse'));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(()=>{addThemeUI()}).observe(document.documentElement,{childList:true,subtree:true});
})();</script>
`;
  html = html.replace('</head>', `${polish}</head>`);
}

// Keep Android/iOS launch icons explicit and avoid a squeezed browser favicon being selected.
const iconLinks = `
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512-maskable.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0b0b0d">
`;
if (!html.includes('HICHKI_ICON_LINKS_V2')) {
  html = html.replace('</head>', `<!-- HICHKI_ICON_LINKS_V2 -->${iconLinks}</head>`);
}

const gestureMarker = 'HICHKI_NATIVE_GESTURES_V2';
if (!html.includes(gestureMarker)) {
  const gesture = `
<script>/* ${gestureMarker} */
(()=>{let sx=0,sy=0,st=0,moved=false,target=null;const EDGE=38,MIN=72;const interactive=e=>!!e?.closest?.('button,a,input,textarea,select,[contenteditable="true"],[role="button"]');document.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();moved=false;target=e.target},{passive:true});document.addEventListener('touchmove',e=>{if(e.touches.length===1){const t=e.touches[0];moved=Math.abs(t.clientX-sx)>18||Math.abs(t.clientY-sy)>18}},{passive:true});document.addEventListener('touchend',e=>{if(!moved||!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;if(dt>700)return;const active=document.activeElement;if(active&&/INPUT|TEXTAREA/.test(active.tagName)&&dy>55&&Math.abs(dy)>Math.abs(dx)*1.15){active.blur();return}if(dx>MIN&&sx<=EDGE&&Math.abs(dx)>Math.abs(dy)*1.25){if(interactive(target)&&sx>12)return;if(typeof window.goBack==='function')window.goBack();else if(typeof window.go==='function')window.go('h');else if(history.length>1)history.back();return}if(dy<-MIN&&Math.abs(dy)>Math.abs(dx)*1.25){const input=document.getElementById('inp')||document.querySelector('textarea,input[type="text"]');if(input){input.focus({preventScroll:true});input.scrollIntoView({block:'nearest',behavior:'smooth'})}}},{passive:true});})();</script>
`;
  html = html.replace('</body>', `${gesture}</body>`);
}

await writeFile('index.html', html);

// Manifest may already point at these assets; normalize it for Android maskable handling.
try {
  const manifestPath='public/manifest.webmanifest';
  const manifest=JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath,'utf8'));
  if(Array.isArray(manifest.icons)){
    manifest.icons=manifest.icons.map(icon=>icon.src?.includes('512')?{...icon,src:'/icon-512-maskable.png',purpose:'any maskable'}:icon);
  }
  await writeFile(manifestPath,JSON.stringify(manifest,null,2),'utf8');
} catch {}

if (existsSync('native.js')) await copyFile('native.js', 'public/native.js');

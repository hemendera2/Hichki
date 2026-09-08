import { readFile, writeFile } from 'node:fs/promises';

const htmlPath = 'index.html';
let html = await readFile(htmlPath, 'utf8');
const marker = 'HICHKI_LIBRARY_SOCKET_BRIDGE_V2';
const socketUrl = String(process.env.HICHKI_SOCKET_URL || '').trim().replace(/\/$/, '');
const esc = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

if (socketUrl && !html.includes('hichki-socket-url')) {
  html = html.replace('</head>', `<meta name="hichki-socket-url" content="${esc(socketUrl)}"></head>`);
}
if (!html.includes('/hichki-library-ui.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/hichki-library-ui.css"></head>');
if (!html.includes(marker)) {
  html = html.replace('</body>', `<!-- ${marker} --><script src="/hichki-library.js" defer></script><script src="/hichki-library-ui.js" defer></script></body>`);
}
await writeFile(htmlPath, html, 'utf8');

const manifestPath = 'public/manifest.webmanifest';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.share_target = { action: '/?hichki_share=1', method: 'GET', enctype: 'application/x-www-form-urlencoded', params: { title: 'title', text: 'text', url: 'url' } };
manifest.prefer_related_applications = false;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const swPath = 'public/sw.js';
let sw = await readFile(swPath, 'utf8');
for (const asset of ['/hichki-library.js','/hichki-library-ui.js','/hichki-library-ui.css']) {
  if (!sw.includes(asset)) {
    const anchor = "'/hichki-music.js'";
    if (!sw.includes(anchor)) throw new Error('Unable to extend service-worker runtime asset list');
    sw = sw.replace(anchor, `${anchor},'${asset}'`);
  }
}
await writeFile(swPath, sw, 'utf8');
console.log(`Hichki library UI/share target enabled; Socket.IO ${socketUrl ? 'configured' : 'fallback-only'}.`);

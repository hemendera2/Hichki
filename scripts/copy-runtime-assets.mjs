import { mkdir, copyFile } from 'node:fs/promises';

const assets = [
  'hichki-realtime.js',
  'hichki-chat-api.js',
  'hichki-offline-queue.js',
  'hichki-music.js',
  'hichki-web-push.js',
  'hichki-push-bridge.js',
  'hichki-ux-polish.css',
];

await mkdir('public', { recursive: true });

for (const asset of assets) {
  await copyFile(asset, `public/${asset}`);
}

console.log(`Copied ${assets.length} Hichki runtime assets into public/.`);

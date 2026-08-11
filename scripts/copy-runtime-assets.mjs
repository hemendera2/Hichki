import { mkdir, copyFile, stat } from 'node:fs/promises';

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
  const source = await stat(asset).catch(() => null);
  if (!source?.isFile() || source.size === 0) {
    throw new Error(`Required runtime asset is missing or empty: ${asset}`);
  }

  const destination = `public/${asset}`;
  await copyFile(asset, destination);

  const copied = await stat(destination);
  if (!copied.isFile() || copied.size !== source.size || copied.size === 0) {
    throw new Error(`Runtime asset copy verification failed: ${asset}`);
  }

  console.log(`Verified runtime asset: ${asset} (${copied.size} bytes)`);
}

console.log(`Copied and verified ${assets.length} Hichki runtime assets into public/.`);

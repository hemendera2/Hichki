import { mkdir, copyFile, stat } from 'node:fs/promises';

const assets = [
  'hichki-realtime.js',
  'hichki-chat-api.js',
  'hichki-offline-queue.js',
  'hichki-music.js',
  'hichki-web-push.js',
  'hichki-push-bridge.js',
  'hichki-ux-polish.css',
  'icon-512-maskable.png',
];

await mkdir('dist', { recursive: true });

for (const asset of assets) {
  const source = await stat(`public/${asset}`).catch(() => null);
  if (!source?.isFile() || source.size === 0) {
    throw new Error(`Required public runtime asset is missing or empty: public/${asset}`);
  }

  const destination = `dist/${asset}`;
  const current = await stat(destination).catch(() => null);

  // Vite normally copies public/ into dist/. Keep an explicit post-build
  // contract so these runtime bridges cannot silently disappear from output.
  if (!current?.isFile() || current.size !== source.size || current.size === 0) {
    await copyFile(`public/${asset}`, destination);
  }

  const copied = await stat(destination);
  if (!copied.isFile() || copied.size !== source.size || copied.size === 0) {
    throw new Error(`Post-build runtime asset verification failed: ${asset}`);
  }

  console.log(`Verified dist runtime asset: ${asset} (${copied.size} bytes)`);
}

console.log(`Verified ${assets.length} required Hichki runtime assets in dist/.`);

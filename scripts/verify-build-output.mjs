import { access, stat, readdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const required = [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/sw.js',
  'dist/hichki-realtime.js',
  'dist/hichki-chat-api.js',
  'dist/hichki-offline-queue.js',
  'dist/hichki-music.js',
  'dist/hichki-web-push.js',
  'dist/hichki-push-bridge.js',
  'dist/hichki-ux-polish.css',
  'dist/icon-512-maskable.png',
];

let failed = false;

console.log('HICHKI_BUILD_VERIFIER=V4');
console.log(`GITHUB_SHA=${process.env.GITHUB_SHA || 'local'}`);
console.log(`GITHUB_WORKFLOW=${process.env.GITHUB_WORKFLOW || 'local'}`);
console.log(`GITHUB_RUN_ID=${process.env.GITHUB_RUN_ID || 'local'}`);

for (const file of required) {
  try {
    await access(file, constants.R_OK);
    const info = await stat(file);
    if (!info.isFile() || info.size === 0) throw new Error('empty or not a regular file');
    console.log(`verified: ${file} (${info.size} bytes)`);
  } catch (error) {
    failed = true;
    console.error(`MISSING_OR_EMPTY_BUILD_OUTPUT: ${file}: ${error.message}`);
  }
}

try {
  const html = await readFile('dist/index.html', 'utf8');
  const requiredHtmlFragments = [
    'HICHKI_REALTIME_BRIDGE_V7',
    '/hichki-realtime.js',
    '/hichki-chat-api.js',
    '/hichki-offline-queue.js',
    '/hichki-music.js',
    '/hichki-web-push.js',
    '/hichki-push-bridge.js',
    '/hichki-ux-polish.css',
    '/sw.js',
  ];
  for (const fragment of requiredHtmlFragments) {
    if (!html.includes(fragment)) {
      failed = true;
      console.error(`MISSING_RUNTIME_WIRING: dist/index.html does not contain ${fragment}`);
    } else {
      console.log(`runtime wiring verified: ${fragment}`);
    }
  }
} catch (error) {
  failed = true;
  console.error(`BUILD_INDEX_READ_ERROR: ${error.message}`);
}

try {
  const sw = await readFile('dist/sw.js', 'utf8');
  for (const asset of ['/hichki-realtime.js', '/hichki-chat-api.js', '/hichki-offline-queue.js', '/hichki-music.js', '/hichki-web-push.js', '/hichki-push-bridge.js', '/hichki-ux-polish.css']) {
    if (!sw.includes(asset)) {
      failed = true;
      console.error(`MISSING_SW_CACHE_ASSET: dist/sw.js does not reference ${asset}`);
    }
  }
  if (!sw.includes('notificationclick')) {
    failed = true;
    console.error('MISSING_SW_NOTIFICATION_HANDLER: dist/sw.js has no notificationclick handler');
  }
} catch (error) {
  failed = true;
  console.error(`BUILD_SW_READ_ERROR: ${error.message}`);
}

try {
  const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const iconSrcs = new Set(icons.map((icon) => icon?.src));
  for (const src of ['/icon-192.png', '/icon-512.png', '/icon-512-maskable.png']) {
    if (!iconSrcs.has(src)) {
      failed = true;
      console.error(`MISSING_MANIFEST_ICON: ${src}`);
    }
  }
  console.log(`manifest verified: ${icons.length} icon entries`);
} catch (error) {
  failed = true;
  console.error(`MANIFEST_VALIDATION_ERROR: ${error.message}`);
}

try {
  const entries = await readdir('dist', { withFileTypes: true });
  console.log('--- dist root listing ---');
  for (const entry of entries.filter((item) => item.isFile()).sort((a, b) => a.name.localeCompare(b.name))) {
    const info = await stat(`dist/${entry.name}`);
    console.log(`${entry.name} ${info.size} bytes`);
  }
} catch (error) {
  failed = true;
  console.error(`BUILD_OUTPUT_DIRECTORY_ERROR: ${error.message}`);
}

if (failed) process.exitCode = 1;

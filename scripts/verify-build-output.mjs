import { access, stat, readdir } from 'node:fs/promises';
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

console.log('HICHKI_BUILD_VERIFIER=V3');
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

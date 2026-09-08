import { readFile, writeFile } from 'node:fs/promises';

const path = 'index.html';
let html = await readFile(path, 'utf8');

const syncMarker = 'SUPABASE LIVE SYNC — Clean, Non-blocking, Safe';
const syncEndToken = 'setTimeout(initSupabase, 1500);';
let syncRemoved = 0;

while (html.includes(syncMarker)) {
  const markerAt = html.indexOf(syncMarker);
  const start = html.lastIndexOf('/*', markerAt);
  const endAt = html.indexOf(syncEndToken, markerAt);
  if (start < 0 || endAt < 0) throw new Error('Legacy Supabase sync block boundary not found');
  const end = endAt + syncEndToken.length;
  html = `${html.slice(0, start)}${html.slice(end)}`;
  syncRemoved += 1;
}

if (syncRemoved !== 2) {
  throw new Error(`Expected to retire exactly 2 legacy Supabase sync blocks, retired ${syncRemoved}`);
}

const pwaMarker = '/* ------------------------------ PWA REGISTRATION ------------------------------ */';
const pwaStart = html.indexOf(pwaMarker);
if (pwaStart < 0) throw new Error('Legacy blob service-worker marker not found');
const pwaEndToken = 'URL.revokeObjectURL(swUrl); }); }';
const pwaEndAt = html.indexOf(pwaEndToken, pwaStart);
if (pwaEndAt < 0) throw new Error('Legacy blob service-worker boundary not found');
html = `${html.slice(0, pwaStart)}${html.slice(pwaEndAt + pwaEndToken.length)}`;

const copyUpdates = new Map([
  ['No read receipts, no online dots.', 'Quiet presence, clear delivery.'],
  ['Zero surveillance, zero anxiety.', 'Private by design, calm by default.'],
  ['Everything stays on your device.', 'Local-first, synced when you choose.'],
  ['No accounts. No cloud. Just you.', 'Your account protects private chat and sync.'],
  ['Just for your circle. Nothing leaves this device.', 'Just for your circle. Your private space stays yours.'],
  ['Stored on this device. Nothing uploads in this prototype.', 'Local-first. Connected chats can share privately and sync securely.'],
]);

for (const [from, to] of copyUpdates) {
  if (!html.includes(from)) throw new Error(`Expected legacy copy not found: ${from}`);
  html = html.replaceAll(from, to);
}

for (const forbidden of [
  syncMarker,
  "sb.from('messages')",
  'syncCode',
  'npSync',
  'profSync',
  "navigator.serviceWorker.register(swUrl)",
]) {
  if (html.includes(forbidden)) throw new Error(`Legacy runtime survived retirement: ${forbidden}`);
}

await writeFile(path, html, 'utf8');
console.log(`HICHKI_LEGACY_RUNTIME_RETIRED=V1 syncBlocks=${syncRemoved} blobServiceWorker=1`);

import { readFile } from 'node:fs/promises';
import { HICHKI_PUBLIC_RUNTIME_CONFIG } from './public-runtime-config.mjs';

const resolved = new Map([
  ['HICHKI_SUPABASE_URL', String(process.env.HICHKI_SUPABASE_URL || process.env.SUPABASE_URL || HICHKI_PUBLIC_RUNTIME_CONFIG.supabaseUrl || '').trim()],
  ['HICHKI_SUPABASE_ANON_KEY', String(process.env.HICHKI_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || HICHKI_PUBLIC_RUNTIME_CONFIG.supabasePublishableKey || '').trim()],
  ['HICHKI_SOCKET_URL', String(process.env.HICHKI_SOCKET_URL || HICHKI_PUBLIC_RUNTIME_CONFIG.socketUrl || '').trim()],
]);

let failed = false;

for (const [key, value] of resolved) {
  if (!value) {
    failed = true;
    console.error(`MISSING_RELEASE_CONFIG: ${key}`);
  } else {
    console.log(`release config present: ${key}`);
  }
}

for (const key of ['HICHKI_SUPABASE_URL', 'HICHKI_SOCKET_URL']) {
  const value = resolved.get(key);
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('must use https');
    if (!url.hostname) throw new Error('hostname missing');
    console.log(`release URL valid: ${key}`);
  } catch (error) {
    failed = true;
    console.error(`INVALID_RELEASE_CONFIG: ${key}: ${error.message}`);
  }
}

const browserKey = resolved.get('HICHKI_SUPABASE_ANON_KEY') || '';
if (browserKey && !browserKey.startsWith('sb_publishable_') && browserKey.split('.').length !== 3) {
  failed = true;
  console.error('INVALID_RELEASE_CONFIG: HICHKI_SUPABASE_ANON_KEY is not a publishable/anon client key');
}

const htmlPath = process.argv[2];
if (htmlPath) {
  try {
    const html = await readFile(htmlPath, 'utf8');
    const markers = [
      'meta name="hichki-supabase-url"',
      'meta name="hichki-supabase-anon-key"',
      'meta name="hichki-socket-url"',
    ];
    for (const marker of markers) {
      if (!html.includes(marker)) {
        failed = true;
        console.error(`MISSING_BUILT_RUNTIME_CONFIG: ${marker}`);
      } else {
        console.log(`built runtime config verified: ${marker}`);
      }
    }
  } catch (error) {
    failed = true;
    console.error(`RELEASE_CONFIG_HTML_READ_ERROR: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;

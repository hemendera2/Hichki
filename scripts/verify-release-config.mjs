import { readFile } from 'node:fs/promises';

const required = [
  'HICHKI_SUPABASE_URL',
  'HICHKI_SUPABASE_ANON_KEY',
  'HICHKI_SOCKET_URL',
];

let failed = false;
const values = new Map();

for (const key of required) {
  const value = String(process.env[key] || '').trim();
  if (!value) {
    failed = true;
    console.error(`MISSING_RELEASE_CONFIG: ${key}`);
  } else {
    values.set(key, value);
    console.log(`release config present: ${key}`);
  }
}

for (const key of ['HICHKI_SUPABASE_URL', 'HICHKI_SOCKET_URL']) {
  const value = values.get(key);
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

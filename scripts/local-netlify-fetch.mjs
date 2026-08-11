import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'hichki-web');
const remoteHost = 'hichki.netlify.app';
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== remoteHost || !existsSync(path.join(root, 'index.html'))) {
    return originalFetch(input, init);
  }

  const relative = decodeURIComponent(url.pathname.replace(/^\/+/, '')) || 'index.html';
  const candidate = path.resolve(root, relative);
  if (!candidate.startsWith(`${root}${path.sep}`) && candidate !== path.resolve(root, 'index.html')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const body = await readFile(candidate);
    const type = contentTypes[path.extname(candidate).toLowerCase()] || 'application/octet-stream';
    return new Response(body, { status: 200, headers: { 'content-type': type } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};

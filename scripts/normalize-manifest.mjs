import { readFile, writeFile } from 'node:fs/promises';

const manifestPath = 'public/manifest.webmanifest';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const normalizeSrc = (src = '') => {
  const value = String(src).trim();
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`;
};

const canonical = [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
];

const canonicalSrcs = new Set(canonical.map((icon) => icon.src));
const existing = Array.isArray(manifest.icons) ? manifest.icons : [];
const preserved = existing
  .map((icon) => ({ ...icon, src: normalizeSrc(icon?.src) }))
  .filter((icon) => icon.src && !canonicalSrcs.has(icon.src));

manifest.icons = [...preserved, ...canonical];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log('Hichki manifest icons normalized: 192, 512 and maskable 512 declared.');

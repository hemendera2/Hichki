import { cp, copyFile, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const root='vendor/hichki-web';
const index=`${root}/index.html`;

if (!existsSync(index)) {
  console.log('No vendored Hichki source; retaining prepare-web remote source.');
  process.exit(0);
}

await mkdir('public',{recursive:true});
await cp(root,'public',{recursive:true,force:true});
await copyFile(index,'index.html');
console.log('Vendored Hichki source copied into build inputs.');

// The vendor copy can overwrite files that prepare-web.mjs already normalised
// (manifest icons, maskable icon). Re-apply those normalisations so the
// downstream verifier sees the expected build contract.

// 1. Ensure public/icon-512-maskable.png exists.
const maskable = 'public/icon-512-maskable.png';
const maskableInfo = await stat(maskable).catch(() => null);
if (!maskableInfo?.isFile() || maskableInfo.size === 0) {
  const source512 = 'public/icon-512.png';
  const source512Info = await stat(source512).catch(() => null);
  if (source512Info?.isFile() && source512Info.size > 0) {
    await copyFile(source512, maskable);
    console.log('Re-created public/icon-512-maskable.png after vendor copy.');
  }
}

// 2. Normalise the manifest so it references /icon-192.png, /icon-512.png,
//    and /icon-512-maskable.png with leading slashes (matching the verifier
//    contract) regardless of how the vendored manifest was authored.
try {
  const manifestPath = 'public/manifest.webmanifest';
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (Array.isArray(manifest.icons)) {
    const requiredIcons = [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ];
    // Preserve any additional icons that don't overlap with the required set.
    const requiredSrcs = new Set(requiredIcons.map(i => i.src));
    const extras = manifest.icons.filter(icon => {
      const normalised = icon?.src?.startsWith('/') ? icon.src : `/${icon?.src}`;
      return !requiredSrcs.has(normalised) && !icon?.src?.includes('192') && !icon?.src?.includes('512');
    });
    manifest.icons = [...requiredIcons, ...extras];
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Normalised manifest icons after vendor copy.');
  }
} catch (error) {
  console.error('Warning: could not normalise manifest after vendor copy:', error.message);
}

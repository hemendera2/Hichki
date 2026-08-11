import { cp, copyFile, mkdir } from 'node:fs/promises';
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

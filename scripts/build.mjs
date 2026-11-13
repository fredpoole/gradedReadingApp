import { rm, mkdir, cp } from 'node:fs/promises';
const output=new URL('../dist/',import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(new URL('../public/',import.meta.url),output,{recursive:true});
await cp(new URL('../reading.mjs',import.meta.url),new URL('reading.mjs',output));
console.log('Built static app in dist/ (server code and secrets excluded).');

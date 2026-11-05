import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
let checked=0;
async function checkLink(file,value){
 if(!value||/^(?:https?:|mailto:|data:)/i.test(value))return;
 const [raw,fragment]=value.split('#'),target=path.resolve(path.dirname(file),decodeURIComponent(raw.split('?')[0]||path.basename(file)));
 assert.ok(target.startsWith(root+path.sep),'Link escapes project: '+value);
 assert.ok((await stat(target)).isFile(),'Missing file: '+value);
 if(fragment&&path.extname(target)==='.html')assert.ok((await readFile(target,'utf8')).includes('id="'+fragment+'"'),'Missing HTML anchor: '+value);
 checked++;
}
const page=path.join(root,'dist/project.html'),html=await readFile(page,'utf8');
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g))await checkLink(page,m[1]);
const readme=path.join(root,'README.md');
for(const m of (await readFile(readme,'utf8')).matchAll(/\]\(([^)]+)\)/g))await checkLink(readme,m[1]);
assert.equal((html.match(/<h1[ >]/g)||[]).length,1,'Project page needs one main heading.');
assert.ok(html.includes('prefers-reduced-motion')||(await readFile(path.join(root,'dist/project.css'),'utf8')).includes('prefers-reduced-motion'));
console.log('Project/README links and page structure: '+checked+' local references passed.');

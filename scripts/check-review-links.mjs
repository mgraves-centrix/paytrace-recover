import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const files=['README.md','docs/JUDGE-TESTING.md','docs/DEVPOST-SUBMISSION.md','docs/VIDEO-RECORDING.md','docs/FEATURE-ACCEPTANCE.md','dist/judge.html','dist/digital-orders.html'];
let checked=0;
for(const relative of files){
 const file=path.join(root,relative),content=await readFile(file,'utf8');
 const links=[...content.matchAll(/\]\(([^)]+)\)/g)].map(match=>match[1]);
 if(relative.endsWith('.html')||relative==='README.md')links.push(...[...content.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]));
 for(const link of links){
  if(/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link))continue;
  const [raw,fragment]=link.split('#');
  const target=path.resolve(path.dirname(file),decodeURIComponent((raw||path.basename(file)).split('?')[0]));
  assert.ok(target===root||target.startsWith(root+path.sep),`Link escapes repository: ${relative} -> ${link}`);
  assert.ok((await stat(target)).isFile(),`Missing file: ${relative} -> ${link}`);
  if(fragment&&path.extname(target)==='.html')assert.ok((await readFile(target,'utf8')).includes(`id="${fragment}"`),`Missing anchor: ${relative} -> ${link}`);
  checked++;
 }
}
console.log(`Review links: ${checked} local targets passed.`);

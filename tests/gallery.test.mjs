import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {createApp} from '../server/index.mjs';
import {openStore} from '../server/store.mjs';

test('gallery JPEG assets are served as browser images with nosniff enabled',async t=>{
 const store=openStore(':memory:'),{server}=createApp({PUBLIC_URL:'http://localhost'},store);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{store.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port;
 const page=await fetch(base+'/gallery.html');assert.equal(page.status,200);
 assert.match(await page.text(),/fictional local demo cases/);
 const files=(await readdir(new URL('../dist/assets/screenshots/',import.meta.url))).filter(f=>f.endsWith('.jpg'));
 assert.equal(files.length,15);
 for(const file of files){
  const response=await fetch(base+'/assets/screenshots/'+file);
  assert.equal(response.status,200,file);assert.equal(response.headers.get('content-type'),'image/jpeg');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  const bytes=new Uint8Array(await response.arrayBuffer());assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 }
});

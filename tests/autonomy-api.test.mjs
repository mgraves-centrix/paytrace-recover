import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

test('autonomy API simulates policy without saving it or making a grant',async t=>{
 const db=openStore(':memory:'),{server}=createApp({PUBLIC_URL:'http://localhost'},db);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{db.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port;
 const state=await fetch(base+'/api/state');const cookie=state.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
 const get=path=>fetch(base+path,{headers:{Cookie:cookie}});
 const saved=await(await get('/api/autonomy')).json();assert.equal(saved.policy.enabled,false);
 const dry=await(await get('/api/autonomy?simulate=1&enabled=true&maxAmountCents=15000&dailyLimit=2')).json();
 assert.equal(dry.simulated,true);assert.equal(dry.policy.enabled,true);
 assert.equal((await(await get('/api/autonomy')).json()).policy.enabled,false);
 const invalid=await get('/api/autonomy?simulate=1&enabled=true&maxAmountCents=50001&dailyLimit=2');assert.equal(invalid.status,400);
});

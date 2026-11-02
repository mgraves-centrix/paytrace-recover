import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

test('health reports database integrity failure instead of claiming a healthy app',async t=>{
 const store=openStore(':memory:'),{server}=createApp({PUBLIC_URL:'http://localhost'},store);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{store.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(base+'/health')).status,200);
 store.databaseCheck=()=>false;
 const unhealthy=await fetch(base+'/health');assert.equal(unhealthy.status,503);assert.deepEqual(await unhealthy.json(),{ok:false});
 store.databaseCheck=()=>{throw Error('database disk image is malformed');};
 const failure=await fetch(base+'/health');assert.equal(failure.status,503);assert.deepEqual(await failure.json(),{ok:false,error:'Database integrity check failed.'});
});

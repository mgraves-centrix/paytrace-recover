import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

test('intelligence desk requires merchant access and customer check requires a private case session',async()=>{
 const db=openStore(':memory:'),app=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key'},db);
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 const post=(path,body,cookie='')=>fetch(base+path,{method:'POST',headers:{Cookie:cookie,Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/intelligence.html')).status,200);
  assert.equal((await fetch(base+'/intelligence.mjs')).status,200);
  const first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0],state=(await first.json()).state;
  assert.equal((await fetch(base+'/api/intelligence',{headers:{Cookie:cookie}})).status,403);
  assert.equal((await fetch(base+'/api/intelligence/packet?caseId='+state.id,{headers:{Cookie:cookie}})).status,403);
  assert.equal((await post('/api/customer/self-check',{caseId:state.id})).status,401);
  assert.equal((await post('/api/operator',{key:'test-key'},cookie)).status,200);
  const summary=await(await fetch(base+'/api/intelligence',{headers:{Cookie:cookie}})).json();
  assert.equal(summary.incident.active,false);assert.ok(summary.caseOptions.some(x=>x.id===state.id));
  const packet=await(await fetch(base+'/api/intelligence/packet?caseId='+state.id,{headers:{Cookie:cookie}})).json();assert.equal(packet.caseId,state.id);
  const customerToken=db.support.exchange(db.support.mint(cookie.slice(11),state.id)),customerCookie='pt_customer='+customerToken;
  const check=await post('/api/customer/self-check',{caseId:state.id},customerCookie);assert.equal(check.status,200);assert.equal((await check.json()).state,'sample');
  assert.equal((await post('/api/customer/self-check',{caseId:'CL-OTHER'},customerCookie)).status,409);
 }finally{await new Promise(resolve=>app.server.close(resolve));db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

test('trusted store intake creates one sandbox case only after a fresh exact capture',async()=>{
 const db=openStore(':memory:');let reads=0;
 const paypal={refresh:async s=>{reads++;return {id:'CAPTURE-12345',orderId:s.order.id,userId:s.order.userId,courseId:s.order.courseId,amount:s.order.amount,currency:s.order.currency,status:'COMPLETED',source:'paypal-sandbox'};}};
 const {server}=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key'},db,{paypal});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0],owner=cookie.slice('cl_session='.length);
  const merchant=(path,body)=>fetch(base+path,{method:'POST',headers:{Cookie:cookie,Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await merchant('/api/intake/key',{})).status,403);
  assert.equal((await merchant('/api/operator',{key:'test-key'})).status,200);
  const key=(await(await merchant('/api/intake/key',{})).json()).key;
  const purchase={caseId:'CL-STORE-12345',purchaseId:'STORE-12345',paypalOrderId:'PAYPAL-12345',learnerId:'learner-12345',customerName:'Fictional Buyer',email:'buyer@example.test',courseId:'course-light',amount:12800,currency:'USD'};
  const intake=(body,token=key,origin=null)=>fetch(base+'/api/intake/purchase',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
  assert.equal((await intake(purchase,'wrong')).status,401);
  assert.equal((await intake(purchase,key,'https://other.example')).status,403);
  assert.equal((await intake({...purchase,amount:1})).status,400);
  const created=await intake(purchase);assert.equal(created.status,201);assert.deepEqual(await created.json(),{status:'created',caseId:purchase.caseId,payment:'matched',accessChange:false});
  assert.equal((await intake(purchase)).status,200);
  assert.equal((await intake({...purchase,learnerId:'learner-other'})).status,409);
  const s=db.caseById(owner,purchase.caseId);assert.equal(s.writes,0);assert.equal(s.capture.source,'paypal-sandbox');assert.equal(s.order.userId,purchase.learnerId);assert.equal(db.support.view(owner,s.id,true).email,purchase.email);assert.equal(db.listCases(owner).filter(item=>item.id===s.id).length,1);assert.equal(reads,1);
  const newKey=(await(await merchant('/api/intake/key',{})).json()).key;assert.notEqual(newKey,key);assert.equal((await intake({...purchase,caseId:'CL-STORE-67890',purchaseId:'STORE-67890'},key)).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('trusted store intake rejects a mismatched PayPal capture without creating a case',async()=>{
 const db=openStore(':memory:');const owner=db.create().id;
 try{const {createService}=await import('../server/service.mjs');const service=createService(db,{}, {paypal:{refresh:async s=>({id:'CAPTURE-12345',orderId:'CL-WRONG',userId:s.order.userId,courseId:s.order.courseId,amount:s.order.amount,currency:s.order.currency,status:'COMPLETED',source:'paypal-sandbox'})}});
  await assert.rejects(service.intakePurchase(owner,{caseId:'CL-STORE-12345',purchaseId:'STORE-12345',paypalOrderId:'PAYPAL-12345',learnerId:'learner-12345',customerName:'Fictional Buyer',email:'buyer@example.test',courseId:'course-light',amount:12800,currency:'USD'}),/Fresh PayPal/);
  assert.equal(db.listCases(owner).some(s=>s.id==='CL-STORE-12345'),false);
 }finally{db.close();}
});

test('one completed PayPal capture cannot be claimed by two workspaces',async()=>{
 const db=openStore(':memory:');try{
  const {createService}=await import('../server/service.mjs');
  const service=createService(db,{}, {paypal:{refresh:async s=>({id:'CAPTURE-SHARED',orderId:s.order.id,userId:s.order.userId,courseId:s.order.courseId,amount:s.order.amount,currency:s.order.currency,status:'COMPLETED',source:'paypal-sandbox'})}});
  const a=db.createWorkspace(),b=db.createWorkspace();
  const purchase={caseId:'CL-STORE-SHARED',purchaseId:'STORE-FIRST',paypalOrderId:'PAYPAL-SHARED',learnerId:'learner-first',customerName:'Fictional Buyer',email:'first@example.test',courseId:'course-light',amount:12800,currency:'USD'};
  const results=await Promise.allSettled([service.intakePurchase(a,purchase),service.intakePurchase(b,{...purchase,purchaseId:'STORE-SECOND',learnerId:'learner-second',email:'second@example.test'})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.status===409).length,1);
  assert.equal(db.listCases(a).length+db.listCases(b).length,1);
  assert.equal(db.findByPaypalOrder('PAYPAL-SHARED').length,1);
 }finally{db.close();}
});

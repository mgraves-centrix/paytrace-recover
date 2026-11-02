import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

test('demo storefront captures a sandbox order, sends one trusted mapping, and creates one case',async()=>{
 const db=openStore(':memory:');let creates=0,captures=0,reads=0;
 const paypal={
  create:async s=>{creates++;return 'PAYPAL-'+s.id;},
  capture:async s=>{captures++;return {id:'CAPTURE-'+s.id,orderId:s.id,userId:s.order.userId,courseId:s.order.courseId,amount:s.order.amount,currency:s.order.currency,status:'COMPLETED',source:'paypal-sandbox'};},
  refresh:async s=>{reads++;return {id:'CAPTURE-'+s.id,orderId:s.id,userId:s.order.userId,courseId:s.order.courseId,amount:s.order.amount,currency:s.order.currency,status:'COMPLETED',source:'paypal-sandbox'};}
 };
 const {server}=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key',PAYPAL_CLIENT_ID:'sandbox-id',PAYPAL_CLIENT_SECRET:'sandbox-secret'},db,{paypal});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port,first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0],owner=cookie.slice('cl_session='.length);
  const post=(path,body)=>fetch(base+path,{method:'POST',headers:{Cookie:cookie,Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify(body)});
  const body={requestId:'11111111-1111-4111-8111-111111111111',customerName:'Sandbox Buyer',email:'buyer@example.test'};
  assert.equal((await post('/api/demo-store/start',body)).status,403);
  assert.equal((await post('/api/operator',{key:'test-key'})).status,200);
  const firstStart=await(await post('/api/demo-store/start',body)).json();assert.equal(firstStart.status,'awaiting-buyer');assert.match(firstStart.orderId,/^PAYPAL-CL-STORE-/);
  const repeated=await(await post('/api/demo-store/start',body)).json();assert.equal(repeated.orderId,firstStart.orderId);assert.equal(creates,1);
  assert.equal((await post('/api/demo-store/start',{...body,email:'other@example.test'})).status,409);
  assert.equal((await post('/api/demo-store/complete',{requestId:body.requestId,orderId:'WRONG'})).status,409);
  assert.equal(db.listCases(owner).some(s=>s.id===firstStart.caseId),false);
  const finished=await(await post('/api/demo-store/complete',{requestId:body.requestId,orderId:firstStart.orderId})).json();assert.equal(finished.status,'case-created');assert.equal(finished.intake,'created');
  const s=db.caseById(owner,firstStart.caseId);assert.equal(s.capture.source,'paypal-sandbox');assert.equal(s.writes,0);assert.equal(s.order.userId,'learner-'+firstStart.caseId.slice('CL-STORE-'.length));assert.equal(db.support.view(owner,s.id,true).email,body.email);
  const again=await(await post('/api/demo-store/complete',{requestId:body.requestId,orderId:firstStart.orderId})).json();assert.equal(again.intake,'duplicate');assert.equal(captures,1);assert.equal(reads,1);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('demo storefront does not create a case before completed capture',async()=>{
 const db=openStore(':memory:');const owner=db.create().id;db.authorize(owner);
 try{
  const {demoStore}=await import('../server/demo-store.mjs');const service={intakePurchase:async()=>{throw Error('Intake must not run.');}};
  const store=demoStore(db,{create:async()=> 'ORDER-12345',capture:async()=>({status:'PENDING'})},service);
  const body={requestId:'22222222-2222-4222-8222-222222222222',customerName:'Sandbox Buyer',email:'buyer@example.test'};
  const started=await store.start(owner,body);await assert.rejects(store.complete(owner,{requestId:body.requestId,orderId:started.orderId}),/not completed/);
  assert.equal(db.listCases(owner).some(s=>s.id===started.caseId),false);
 }finally{db.close();}
});

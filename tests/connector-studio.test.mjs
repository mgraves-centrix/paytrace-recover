import test from 'node:test';
import assert from 'node:assert/strict';
import {eventPaths,mapStoreEvent,suggestMapping,validateMapping} from '../server/connector-studio.mjs';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

const sample={purchase:{case_id:'CL-STORE-10001',purchase_id:'store-10001',paypal_order_id:'ORDER-10001',learner:{id:'learner-10001',name:'Alex Rivera',email:'alex@example.test'},product:{course_id:'course-light',amount_cents:12800,currency:'USD'}}};
const mapping={fields:{caseId:'purchase.case_id',purchaseId:'purchase.purchase_id',paypalOrderId:'purchase.paypal_order_id',learnerId:'purchase.learner.id',customerName:'purchase.learner.name',email:'purchase.learner.email',courseId:'purchase.product.course_id',amount:'purchase.product.amount_cents',currency:'purchase.product.currency'},amountMode:'cents'};

test('mapping traverses only explicit fields and validates exact product and amount',()=>{
 assert.equal(eventPaths(sample).length,9);
 assert.deepEqual(mapStoreEvent(sample,mapping),{caseId:'CL-STORE-10001',purchaseId:'store-10001',paypalOrderId:'ORDER-10001',learnerId:'learner-10001',customerName:'Alex Rivera',email:'alex@example.test',courseId:'course-light',amount:12800,currency:'USD'});
 assert.throws(()=>mapStoreEvent({...sample,purchase:{...sample.purchase,product:{...sample.purchase.product,amount_cents:1}}},mapping),/configured reference course/);
 assert.throws(()=>validateMapping({...mapping,fields:{...mapping.fields,email:'__proto__.email'}}),/valid source/);
 assert.throws(()=>mapStoreEvent(sample,{...mapping,fields:{...mapping.fields,caseId:'missing.path'}}),/case ID/);
 const dollars={...mapping,amountMode:'dollars'},dollarSample=structuredClone(sample);dollarSample.purchase.product.amount_cents=128;
 assert.equal(mapStoreEvent(dollarSample,dollars).amount,12800);
});

test('AI field suggestion receives paths and types, never event values',async()=>{
 let request;const fetcher=async(_url,options)=>{request=JSON.parse(options.body);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(mapping)}]}]});};
 const result=await suggestMapping(sample,{OPENAI_API_KEY:'test',OPENAI_MODEL:'test-model'},fetcher);
 assert.equal(result.mode,'ai');assert.deepEqual(result.mapping,mapping);
 assert.doesNotMatch(JSON.stringify(request),/Alex Rivera|alex@example|ORDER-10001|learner-10001/);
 assert.match(JSON.stringify(request),/purchase\.learner\.email/);
});

test('connector activation requires a matching fresh capture, then raw events use saved mapping',async t=>{
 const db=openStore(':memory:');let mismatch=false,reads=0;
 const paypal={refresh:async s=>{reads++;return {source:'paypal-sandbox',status:'COMPLETED',orderId:s.order.id,userId:s.order.userId,courseId:s.order.courseId,amount:mismatch?1:s.order.amount,currency:s.order.currency,id:'CAP-10001'};}};
 const {server}=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key'},db,{paypal});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{db.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port,first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0],owner=cookie.slice('cl_session='.length);
 const merchant=(route,body)=>fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:'http://localhost',...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal((await merchant('connector/mapping')).status,403);
 assert.equal((await merchant('operator',{key:'test-key'})).status,200);
 const key=(await(await merchant('intake/key',{})).json()).key;
 const intake=event=>fetch(base+'/api/intake/event',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(event)});
 assert.equal((await intake(sample)).status,400);
 const suggestion=await(await merchant('connector/suggest',{sample})).json();assert.equal(suggestion.mode,'field-name');
 const draft=await(await merchant('connector/mapping',{sample,mapping,expectedRevision:0})).json();assert.equal(draft.active,false);assert.equal(draft.revision,1);
 mismatch=true;assert.equal((await merchant('connector/activate',{sample,expectedRevision:1})).status,409);assert.equal(db.connectorMapping(owner).active,false);assert.equal(db.listCases(owner).some(s=>s.id==='CL-STORE-10001'),false);
 mismatch=false;const active=await(await merchant('connector/activate',{sample,expectedRevision:1})).json();assert.equal(active.active,true);assert.equal(active.payment.matched,true);
 assert.equal((await intake(sample)).status,201);assert.equal((await intake(sample)).status,200);const s=db.caseById(owner,'CL-STORE-10001');assert.equal(s.writes,0);assert.equal(s.capture.source,'paypal-sandbox');assert.equal(s.externalIntake.channel,'mapped-event');assert.equal(s.externalIntake.connectorRevision,1);assert.equal(reads,3);
 const changed=await(await merchant('connector/mapping',{sample,mapping,expectedRevision:1})).json();assert.equal(changed.active,false);assert.equal((await intake({...sample,purchase:{...sample.purchase,case_id:'CL-STORE-10002'}})).status,400);
});

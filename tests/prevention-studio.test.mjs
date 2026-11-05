import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment} from '../dist/core.mjs';
import {preventionPatterns,replayMapping} from '../server/prevention-studio.mjs';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

const sample={purchase:{case_id:'CL-STORE-10001',purchase_id:'store-10001',paypal_order_id:'ORDER-10001',learner:{id:'learner-10001',name:'Alex Rivera',email:'alex@example.test'},product:{course_id:'course-light',amount_cents:12800,currency:'USD'}}};
const mapping={fields:{caseId:'purchase.case_id',purchaseId:'purchase.purchase_id',paypalOrderId:'purchase.paypal_order_id',learnerId:'purchase.learner.id',customerName:'purchase.learner.name',email:'purchase.learner.email',courseId:'purchase.product.course_id',amount:'purchase.product.amount_cents',currency:'purchase.product.currency'},amountMode:'cents'};
function paid(id,source='paypal-sandbox'){
 const s=simulatePayment(createCase('match',id));s.capture.source=source;s.paidAt=new Date().toISOString();s.fulfillment={code:'ENROLLMENT_TIMEOUT',cause:'unknown'};return s;
}

test('prevention groups historical outcomes by symptom and source without claiming a root cause',()=>{
 const a=paid('CL-A'),b=paid('CL-B'),c=paid('CL-C','sample'),d=paid('CL-D','sample');
 a.firstVerifiedAt=new Date().toISOString();c.firstVerifiedAt=new Date().toISOString();
 const before=structuredClone([a,b,c,d]);const report=preventionPatterns([a,b,c,d]);
 assert.equal(report.patterns.length,2);
 assert.deepEqual(report.patterns.find(p=>p.source==='paypal-sandbox').caseIds,['CL-A','CL-B']);
 assert.equal(report.patterns.find(p=>p.source==='paypal-sandbox').verified,1);
 assert.match(report.definition,/not proof of a shared root cause/i);
 assert.deepEqual([a,b,c,d],before);
});

test('prevention excludes unsupported payment evidence and old or single cases',()=>{
 const old=paid('CL-OLD'),held=paid('CL-HOLD'),single=paid('CL-ONE');
 old.paidAt=new Date(Date.now()-40*86400000).toISOString();old.firstVerifiedAt=new Date().toISOString();
 held.paymentHold={reason:'refund'};held.firstVerifiedAt=new Date().toISOString();
 assert.equal(preventionPatterns([old,held,single]).patterns.length,0);
});

test('mapping replay reports only validity and changed field names without provider calls or personal data',()=>{
 const proposed={...mapping,fields:{...mapping.fields,learnerId:'purchase.learner.id'}};
 const bad={...sample,purchase:{...sample.purchase,product:{...sample.purchase.product,amount_cents:1}}};
 const report=replayMapping([sample,bad],proposed,mapping);
 assert.deepEqual(report.rows.map(r=>r.proposedValid),[true,false]);
 assert.equal(report.accessChange,false);assert.equal(report.paymentChecked,false);assert.equal(report.saved,false);
 assert.doesNotMatch(JSON.stringify(report),/Alex Rivera|alex@example|ORDER-10001|learner-10001/);
 assert.throws(()=>replayMapping(Array(11).fill(sample),mapping),/1 to 10/);
});

test('prevention API requires merchant controls and replay makes no case, mapping, or access change',async t=>{
 const db=openStore(':memory:'),{server}=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key'},db);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{db.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port,first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0],owner=cookie.slice('cl_session='.length);
 const call=(route,body)=>fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:'http://localhost',...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal((await call('prevention')).status,403);
 assert.equal((await call('prevention/fix-watch')).status,403);
 assert.equal((await call('prevention/replay',{events:[sample],mapping})).status,403);
 assert.equal((await call('operator',{key:'test-key'})).status,200);
 assert.equal((await call('prevention')).status,200);
 const watch=await(await call('prevention/fix-watch')).json();assert.equal(watch.state,'inactive');
 const before=db.listCases(owner).map(s=>({id:s.id,writes:s.writes})),result=await(await call('prevention/replay',{events:[sample],mapping})).json();
 assert.equal(result.proposedValid,1);assert.equal(result.paymentChecked,false);
 assert.deepEqual(db.listCases(owner).map(s=>({id:s.id,writes:s.writes})),before);
 assert.equal(db.connectorMapping(owner).mapping,null);
});

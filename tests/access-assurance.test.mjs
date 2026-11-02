import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {accessPromise,incidentDetective} from '../dist/access-assurance.mjs';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';
import {analyzeIncident} from '../server/incident-analysis.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const sandbox=(id,minutes=10)=>{const s=simulatePayment(createCase('match',id));s.intakeMode='sandbox';s.paypalOrderId='PAYPAL-ORDER-'+id;s.capture.source='paypal-sandbox';s.paidAt=new Date(Date.now()-minutes*60000).toISOString();return s;};

test('payment-to-access promise separates overdue, mismatch, service proof, browser receipt and confirmation',()=>{
 const s=sandbox('CL-PROMISE');
 assert.equal(accessPromise(s,{graceMinutes:5}).state,'overdue');
 assert.equal(accessPromise(s,{graceMinutes:15}).state,'within-window');
 s.capture.amount=1;assert.equal(accessPromise(s).state,'identity-review');s.capture.amount=s.order.amount;
 investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);
 assert.equal(accessPromise(s).state,'technical-proof');
 assert.equal(accessPromise(s,{browserProofAt:new Date().toISOString()}).state,'buyer-browser-reached');
 assert.equal(accessPromise(s,{customerConfirmedAt:new Date().toISOString()}).state,'customer-confirmed');
 s.paymentHold={status:'REFUNDED'};assert.equal(accessPromise(s).state,'payment-hold');
 assert.equal(accessPromise(simulatePayment(createCase('match','CL-SAMPLE'))).state,'sample');
 const awaiting=createCase('match','CL-AWAITING');awaiting.intakeMode='sandbox';assert.equal(accessPromise(awaiting).state,'payment-review');
});

test('buyer browser proof is one-time, private, tied to current lesson proof and never confirms for the buyer',()=>{
 const db=openStore(':memory:');try{const {id}=db.create(),s=db.get(id).state;investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);db.grant(id,s);
  const body='Protected lesson content with enough bytes to check.';
  const token=db.support.issueBrowserChallenge(id,s.id,body,'private-session');
  assert.equal(db.support.view(id,s.id).browserProofAt,null);
  assert.throws(()=>db.support.acknowledgeBrowserLesson(id,s.id,token,digest('wrong body'),'private-session'));
  assert.throws(()=>db.support.acknowledgeBrowserLesson(id,s.id,token,digest(body),'other-session'));
  const receipt=db.support.acknowledgeBrowserLesson(id,s.id,token,digest(body),'private-session');assert.equal(receipt.state,'browser-reached');
  assert.ok(db.support.view(id,s.id).browserProofAt);assert.equal(db.support.view(id,s.id).confirmedAt,null);
  assert.throws(()=>db.support.acknowledgeBrowserLesson(id,s.id,token,digest(body),'private-session'));
  s.proof.at=new Date(Date.now()+1000).toISOString();db.save(id,s);assert.equal(db.support.view(id,s.id).browserProofAt,null);
  const second=db.support.issueBrowserChallenge(id,s.id,body,'private-session');s.capture.amount=1;db.save(id,s);
  assert.throws(()=>db.support.acknowledgeBrowserLesson(id,s.id,second,digest(body),'private-session'));
 }finally{db.close();}
});

test('incident detective labels hypotheses as signals, contradictions or untested, never as diagnosis',()=>{
 const incident={active:true};const report=incidentDetective(incident,[{caseId:'A',state:'missing-access'},{caseId:'B',state:'missing-access'},{caseId:'C',state:'payment-review'}]);
 assert.equal(report.hypotheses.find(h=>h.id==='course-delivery').status,'supported-signal');
 assert.equal(report.hypotheses.find(h=>h.id==='payment-identity').status,'supported-signal');
 assert.equal(report.hypotheses.find(h=>h.id==='buyer-last-mile').status,'untested');
 assert.deepEqual(report.results.map(r=>Object.keys(r)),[['caseId','state'],['caseId','state'],['caseId','state']]);
});

test('incident AI readout receives only pseudonymous probe states and cannot change deterministic status',async()=>{
 const report=incidentDetective({active:true},[{caseId:'CL-A',state:'missing-access'},{caseId:'CL-B',state:'checking'}]);
 let sent;
 const rows=report.hypotheses.map(h=>({id:h.id,explanation:'The saved checks support further review.',unknown:'Root cause is not established.',caseIds:['CL-A']}));
 const fetcher=async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({perspectives:rows})}]}]})};};
 const result=await analyzeIncident(report,{OPENAI_API_KEY:'test',OPENAI_MODEL:'test'},fetcher);
 assert.equal(result.mode,'AI-assisted read-only');assert.deepEqual(result.hypotheses.map(h=>h.status),report.hypotheses.map(h=>h.status));
 assert.ok(!sent.input.includes('buyer@example.com'));assert.ok(!sent.input.includes('PAYPAL-ORDER'));
 rows[0].caseIds=['OTHER'];await assert.rejects(()=>analyzeIncident(report,{OPENAI_API_KEY:'test',OPENAI_MODEL:'test'},fetcher),/validation/);
});

test('private lesson route issues a browser challenge and accepts only the matching same-origin receipt',async()=>{
 const db=openStore(':memory:');const {id}=db.create(),s=db.get(id).state;investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);db.grant(id,s);
 const app=createApp({PUBLIC_URL:'http://localhost'},db);await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 try{const token=db.support.exchange(db.support.mint(id,s.id)),cookie='pt_customer='+token;
  assert.equal((await fetch(base+'/api/customer/lesson?caseId='+s.id)).status,401);
  const lessonResponse=await fetch(base+'/api/customer/lesson?caseId='+s.id,{headers:{Cookie:cookie}});assert.equal(lessonResponse.status,200);const lesson=await lessonResponse.json();assert.ok(lesson.body.length>20);assert.match(lesson.browserChallenge,/^[a-f0-9]{64}$/);
  const post=(body,origin='http://localhost')=>fetch(base+'/api/customer/browser-proof',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const body={caseId:s.id,token:lesson.browserChallenge,digest:digest(lesson.body)};
  assert.equal((await post(body,'https://wrong.example')).status,403);
  assert.equal((await post({...body,caseId:'OTHER'})).status,409);
  assert.equal((await post(body)).status,200);
  assert.equal((await post(body)).status,400);
  const view=await(await fetch(base+'/api/customer/case?caseId='+s.id,{headers:{Cookie:cookie}})).json();assert.ok(view.browserProofAt);assert.equal(view.confirmedAt,null);assert.equal(view.accessPromise.state,'sample');assert.equal(view.browserChallenge,undefined);
 }finally{await new Promise(resolve=>app.server.close(resolve));db.close();}
});

test('incident probes require merchant access, reread only qualifying sandbox cases and never grant',async()=>{
 const db=openStore(':memory:');const {id}=db.create();for(let i=0;i<3;i++)db.save(id,sandbox('CL-PROBE-'+i,10-i));let grants=0;
 const app=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key'},db,{paypal:{refresh:async s=>s.capture},course:{check:async s=>({active:false,userId:s.order.userId,courseId:s.order.courseId}),grant:async()=>{grants++;throw Error('No grant');}}});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 const post=(path,body,cookie='',origin='http://localhost')=>fetch(base+path,{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{const cookie='cl_session='+id;assert.equal((await fetch(base+'/api/state',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await post('/api/intelligence/incident/probe',{},cookie)).status,403);
  assert.equal((await post('/api/operator',{key:'test-key'},cookie)).status,200);
  assert.equal((await post('/api/intelligence/incident/probe',{},cookie,'https://evil.example')).status,403);
  const response=await post('/api/intelligence/incident/probe',{},cookie);assert.equal(response.status,200,await response.clone().text());const report=await response.json();assert.equal(report.results.length,3);assert.ok(report.results.every(r=>r.state==='missing-access'));assert.equal(report.hypotheses[0].status,'supported-signal');
  assert.equal((await post('/api/intelligence/incident/probe',{},cookie)).status,429);
  assert.equal(grants,0);assert.ok(db.listCases(id).filter(s=>s.id.startsWith('CL-PROBE')).every(s=>s.writes===0));
 }finally{await new Promise(resolve=>app.server.close(resolve));db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {buildRecoveryPassport} from '../dist/recovery-passport.mjs';
import {passportMarkup} from '../dist/recovery-passport-ui.mjs';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

function restored(){const s=simulatePayment(createCase());investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);return s;}

test('passport separates saved correction, current lesson proof, browser receipt, and customer confirmation',()=>{
 const s=restored(),now=new Date().toISOString();s.job={kind:'recover',runId:'render-run-1',startedAt:now,pending:false,completed:{repair:{writes:1},verify:{verified:true}}};
 const merchant=buildRecoveryPassport(s,{backend:true,confirmedAt:now,browserProofAt:now});
 assert.equal(merchant.state,'customer-confirmed');
 assert.equal(merchant.steps.find(step=>step.id==='correction').status,'recorded');
 assert.equal(merchant.steps.find(step=>step.id==='browser').status,'passed');
 assert.equal(merchant.steps.find(step=>step.id==='customer').status,'passed');
 assert.deepEqual(merchant.workflow.stages.map(stage=>stage.status),['complete','complete']);
 assert.match(passportMarkup(merchant),/Render recover run/);
 const buyer=buildRecoveryPassport(s,{backend:true,customer:true,confirmedAt:now,browserProofAt:now});
 assert.equal(buyer.steps.some(step=>Object.hasOwn(step,'reference')),false);
 assert.equal(buyer.workflow,null);
 assert.match(passportMarkup(buyer,{customer:true}),/<details class="passport passport-customer"/);
 assert.doesNotMatch(JSON.stringify(buyer),/render-run|capture-id/);
 s.revision++;
 const stale=buildRecoveryPassport(s,{backend:true,customer:true,confirmedAt:now,browserProofAt:now});
 assert.equal(stale.steps.find(step=>step.id==='browser').status,'pending');
 assert.equal(stale.steps.find(step=>step.id==='customer').status,'pending');
 assert.notEqual(stale.state,'customer-confirmed');
});

test('customer help reopens the passport and markup escapes saved references',()=>{
 const s=restored(),now=new Date().toISOString();
 const passport=buildRecoveryPassport(s,{backend:true,confirmedAt:now,help:true});
 assert.equal(passport.state,'needs-help');
 assert.equal(passport.steps.find(step=>step.id==='customer').status,'needs-help');
 passport.steps[0].reference='<img src=x onerror=alert(1)>';
 const html=passportMarkup(passport);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/&lt;img/);
});

test('merchant passport route is session-scoped and customer view omits source references',async t=>{
 const db=openStore(':memory:'),{server}=createApp({PUBLIC_URL:'http://localhost'},db);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(()=>{db.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port,start=await fetch(base+'/api/state'),cookie=start.headers.get('set-cookie').split(';')[0],state=(await start.json()).state;
 const response=await fetch(base+'/api/passport?caseId='+encodeURIComponent(state.id),{headers:{Cookie:cookie}});
 assert.equal(response.status,200);assert.equal((await response.json()).caseId,state.id);
 assert.equal((await fetch(base+'/api/passport?caseId=another',{headers:{Cookie:cookie}})).status,409);
 assert.equal((await fetch(base+'/api/passport')).status,401);
 const page=await fetch(base+'/passport.html');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);
});

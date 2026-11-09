import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {recoveryReadiness,readinessMarkup,outcomeSummaryMarkup} from '../dist/focus-case-design.mjs';
import {customerNextMarkup} from '../dist/customer-clarity.mjs';

test('readiness follows the saved purchase, review, exact preview and approval',()=>{
 const s=createCase();
 assert.equal(recoveryReadiness(s).filter(step=>step.ok).length,1);
 simulatePayment(s);
 assert.equal(recoveryReadiness(s).filter(step=>step.ok).length,2);
 investigate(s);
 assert.equal(recoveryReadiness(s).filter(step=>step.ok).length,3);
 rehearse(s);
 assert.equal(recoveryReadiness(s).filter(step=>step.ok).length,4);
 approve(s,s.rehearsal.id);
 assert.equal(recoveryReadiness(s).filter(step=>step.ok).length,5);
 assert.match(readinessMarkup(s),/Authorization recorded · final checks remain/);
 s.approval.mode='policy';
 assert.match(readinessMarkup(s),/Authorized by the enabled merchant policy/);
 assert.match(readinessMarkup(s,{backend:true}),/Illustrative case · not connected/);
 assert.equal(recoveryReadiness(s,{uncertain:true}).filter(step=>step.ok).length,0);
 assert.equal(recoveryReadiness(s,{backend:true})[2].ok,false,'scripted sample review cannot count as a model review');
});

test('compact outcome shows technical proof without claiming buyer confirmation',()=>{
 const s=simulatePayment(createCase());investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);
 const html=outcomeSummaryMarkup(s);
 assert.match(html,/One write recorded/);
 assert.match(html,/confirmation remains separate/);
 assert.match(outcomeSummaryMarkup(s,{uncertain:true}),/verification pending/);
 s.revision++;
 assert.match(outcomeSummaryMarkup(s),/verification pending/);
});

test('customer summary shows only the latest merchant reply and escapes it',()=>{
 const html=customerNextMarkup({status:1,next:'We are checking.',messages:[
  {role:'merchant',text:'We checked the payment <script>bad</script>',at:'2026-11-05T12:00:00Z'},
  {role:'customer',text:'Any update?',at:'2026-11-05T13:00:00Z'}
 ]});
 assert.match(html,/Latest merchant update/);
 assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/href="#customer-conversation"/);
});

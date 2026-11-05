import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {decisionCardMarkup} from '../dist/decision-card.mjs';
import {customerProgressDraft} from '../dist/customer-update-draft.mjs';
import {failureReplay} from '../dist/failure-replay-model.mjs';

test('decision card names the failed exact check and does not imply approval',()=>{
 const s=simulatePayment(createCase('match'));s.capture.userId='learner-other';investigate(s);
 const html=decisionCardMarkup(s);
 assert.match(html,/Correct learner does not match/);
 assert.match(html,/What could stop the repair/);
 assert.match(html,/Nothing changes until a current preview is approved/);
 assert.doesNotMatch(html,/No open mismatch is shown/);
});

test('customer draft claims lesson success only after current case and support proof',()=>{
 const s=simulatePayment(createCase('match'));investigate(s);
 let draft=customerProgressDraft(s,{verified:false});
 assert.doesNotMatch(draft.text,/confirmed that the first lesson opens/);
 const preview=rehearse(s);approve(s,preview.rehearsal.id);applyRepair(s);
 draft=customerProgressDraft(s,{verified:false});
 assert.match(draft.text,/checking that the course and first lesson actually open/);
 verify(s);
 assert.doesNotMatch(customerProgressDraft(s,{verified:false}).text,/confirmed that the first lesson opens/);
 assert.match(customerProgressDraft(s,{verified:true}).text,/confirmed that the first lesson opens/);
 assert.doesNotMatch(customerProgressDraft(s,{verified:true},{uncertain:true}).text,/confirmed that the first lesson opens/);
});

test('fictional failure replay never authorizes a payment or access change',()=>{
 const match=failureReplay('match'),wrong=failureReplay('learner'),offline=failureReplay('service');
 assert.equal(match.tone,'ready');
 assert.equal(wrong.tone,'hold');
 assert.equal(offline.tone,'hold');
 for(const scenario of [match,wrong,offline]){
  assert.equal(scenario.fictional,true);
  assert.equal(scenario.writes,0);
  assert.equal(scenario.approval,null);
 }
 assert.match(offline.decision,/Do not infer/);
});

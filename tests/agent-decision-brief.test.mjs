import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair} from '../dist/core.mjs';
import {agentDecisionBrief} from '../dist/focus-agent-brief.mjs';
import {caseReplayMarkup} from '../dist/focus-case-replay.mjs';

test('decision brief names support, counterevidence, and the next safe action',()=>{
 const s=simulatePayment(createCase());investigate(s);
 const brief=agentDecisionBrief(s);
 assert.equal(brief.state,'ready');
 assert.match(brief.challenge,/changed payment match|existing entitlement/);
 assert.match(brief.next,/Merchant approval/);
 assert.match(caseReplayMarkup(s),/What could change it/);
 s.order.amount=9900;
 assert.equal(agentDecisionBrief(s).state,'stale');
});

test('missing and conflicting payment evidence hold the correction',()=>{
 const missing=simulatePayment(createCase('missing'));investigate(missing);
 assert.equal(agentDecisionBrief(missing).state,'hold');
 assert.match(agentDecisionBrief(missing).next,/Make no access grant/);
 const conflict=simulatePayment(createCase('conflict'));investigate(conflict);
 assert.equal(agentDecisionBrief(conflict).state,'hold');
 assert.match(agentDecisionBrief(conflict).challenge,/Correct order/);
});

test('open model challenge and completed write have distinct next checks',()=>{
 const s=simulatePayment(createCase());investigate(s);
 s.review.objections.push({status:'open',question:'<check this record>',sources:['payment','store']});
 assert.equal(agentDecisionBrief(s).state,'hold');
 assert.match(caseReplayMarkup(s),/&lt;check this record&gt;/);
 s.review.objections.pop();
 rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);
 const brief=agentDecisionBrief(s);
 assert.equal(brief.state,'historical');
 assert.match(brief.next,/protected-lesson/);
});

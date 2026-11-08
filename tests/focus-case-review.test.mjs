import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate} from '../dist/core.mjs';
import {caseAgentSummary} from '../dist/focus-case-review.mjs';

test('case review distinguishes pending specialists from a saved scripted review',()=>{
 const state=createCase('match');
 const pending=caseAgentSummary(state);
 assert.match(pending,/No agent finding or confidence is recorded/);
 assert.doesNotMatch(pending,/Evidence support · Strong match/);
 simulatePayment(state);investigate(state);
 const html=caseAgentSummary(state);
 assert.match(html,/SCRIPTED SAMPLE REVIEW/);
 assert.equal((html.match(/class="case-agent-item"/g)||[]).length,4);
 assert.match(html,/Evidence support · Strong match/);
 assert.match(html,/Signal only/);
 assert.match(html,/not a model probability/);
 assert.doesNotMatch(html,/\d+%/);
});

test('changed evidence makes the saved agent readout visibly stale',()=>{
 const state=createCase('match');simulatePayment(state);investigate(state);
 state.order.amount=9900;
 const html=caseAgentSummary(state);
 assert.match(html,/Earlier review · refresh required/);
 assert.equal((html.match(/Evidence support · Stale/g)||[]).length,4);
});

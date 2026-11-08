import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate} from '../dist/core.mjs';
import {caseAgentSummary} from '../dist/focus-case-review.mjs';

test('case review distinguishes pending specialists from a saved scripted review',()=>{
 const state=createCase('match');
 const pending=caseAgentSummary(state);
 assert.match(pending,/No investigation recorded/);
 assert.doesNotMatch(pending,/AI model running|AI investigation recorded/);
 simulatePayment(state);investigate(state);
 const html=caseAgentSummary(state);
 assert.match(html,/Sample investigation recorded/);
 assert.match(html,/not a live AI call/);
 assert.equal((html.match(/class="case-agent-item"/g)||[]).length,4);
 assert.match(html,/Strong match/);
 assert.match(html,/Signal only/);
 assert.match(html,/not a model confidence score/);
 assert.match(html,/A completed payment is recorded/);
 assert.doesNotMatch(html,/\d+%/);
});

test('changed evidence makes the saved agent readout visibly stale',()=>{
 const state=createCase('match');simulatePayment(state);investigate(state);
 state.order.amount=9900;
 const html=caseAgentSummary(state);
 assert.match(html,/Review out of date/);
 assert.equal((html.match(/case-agent-support">Stale/g)||[]).length,4);
});

test('saved model progress identifies each recorded, working, and waiting specialist',()=>{
 const state=simulatePayment(createCase('match'));
 state.agentRun={mode:'model',status:'running',step:'finding-1',agent:1,completed:['finding-0']};
 const html=caseAgentSummary(state);
 assert.match(html,/Relay is reviewing the case/);
 assert.match(html,/AI model running/);
 assert.equal((html.match(/<li class="recorded">/g)||[]).length,1);
 assert.equal((html.match(/<li class="working">/g)||[]).length,1);
 assert.equal((html.match(/<li class="waiting">/g)||[]).length,2);
 assert.doesNotMatch(html,/Sample investigation recorded|\d+%/);
 state.agentRun.status='failed';state.phase='review-failed';
 assert.match(caseAgentSummary(state),/Investigation stopped/);
});

test('a saved model review never substitutes scripted findings when model findings are missing',()=>{
 const state=simulatePayment(createCase('match'));investigate(state);state.review.mode='model';state.analysis=null;
 const html=caseAgentSummary(state);
 assert.match(html,/saved model findings are unavailable/);
 assert.doesNotMatch(html,/A completed payment is recorded/);
});

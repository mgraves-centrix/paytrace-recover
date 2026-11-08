import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {caseReplayMarkup,replayAgents} from '../dist/focus-case-replay.mjs';

test('replay follows purchase to verified outcome without claiming a demo is connected',()=>{
 const state=simulatePayment(createCase());
 assert.match(caseReplayMarkup(state),/ILLUSTRATIVE SAMPLE/);
 assert.match(caseReplayMarkup(state),/Outcome<\/strong><span class="case-replay-state">Not verified/);
 investigate(state);
 const agents=replayAgents(state);
 assert.equal(agents.length,4);
 assert.equal(agents[0].confidence,'Strong');
 assert.equal(agents[1].confidence,'Moderate');
 assert.match(caseReplayMarkup(state),/not a model probability/);
 rehearse(state);approve(state,state.rehearsal.id);applyRepair(state);
 assert.match(caseReplayMarkup(state),/An access write is recorded; fresh verification is still required/);
 verify(state);
 assert.match(caseReplayMarkup(state),/fresh payment, entitlement, and protected lesson check passed/);
 assert.match(caseReplayMarkup(state),/Decision recorded/);
 assert.ok(replayAgents(state).every(agent=>agent.scope==='at decision'));
});

test('replay marks missing or changed evidence as low confidence and escapes findings',()=>{
 const state=simulatePayment(createCase());investigate(state);
 state.order.amount=9900;
 assert.ok(replayAgents(state).every(agent=>agent.confidence==='Out of date'));
 state.order.amount=12800;
 state.evidenceAvailable=false;
 assert.ok(replayAgents(state).every(agent=>agent.confidence==='Out of date'));
 const fresh=simulatePayment(createCase());investigate(fresh);
 fresh.review.mode='model';fresh.analysis={mode:'model',findings:[{agent:0,summary:'<script>alert(1)</script>',unknown:'<img src=x>',sources:['payment']}]};
 const html=caseReplayMarkup(fresh);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;img/);
});

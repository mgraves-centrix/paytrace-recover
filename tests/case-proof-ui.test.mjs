import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {purchaseFactsMarkup,agentConsensusMarkup,outcomeProofMarkup} from '../dist/focus-case-proof.mjs';

test('each purchase fact opens its own saved record, comparison, and check time',()=>{
 const s=simulatePayment(createCase());s.sources={payment:{status:'available',checkedAt:'2026-11-08T20:00:00Z'},access:{status:'available',checkedAt:'2026-11-08T20:01:00Z'}};
 const html=purchaseFactsMarkup(s);
 assert.equal((html.match(/class="case-fact case-fact-/g)||[]).length,3);
 assert.match(html,/CAP-CL-1048/);
 assert.match(html,/Exact purchase comparison/);
 assert.match(html,/Capture.*Order.*Result/s);
 assert.match(html,/11\/8\/2026/);
 assert.match(html,/matching active access is not established/);
 s.sources.access.status='unavailable';
 assert.match(purchaseFactsMarkup(s),/absence cannot be inferred/);
 s.capture.orderId='OTHER';
 assert.match(purchaseFactsMarkup(s),/Differs/);
 assert.doesNotMatch(purchaseFactsMarkup(s),/Exact fields agree/);
});

test('compact agent summary exposes cited snapshot and qualitative uncertainty',()=>{
 const s=simulatePayment(createCase());assert.equal(agentConsensusMarkup(s),'');investigate(s);
 const html=agentConsensusMarkup(s);
 assert.equal((html.match(/class="case-agent-compact"/g)||[]).length,4);
 assert.match(html,/SCRIPTED SAMPLE SPECIALISTS/);
 assert.match(html,/Recommended action/);
 assert.match(html,/Still uncertain/);
 assert.match(html,/Cited records/);
 assert.match(html,/Evidence confidence current evidence/);
 assert.doesNotMatch(html,/\d+% confidence/);
 s.order.amount=9900;
 assert.match(agentConsensusMarkup(s),/Review out of date/);
});

test('approved outcome distinguishes authorization, write, fresh proof, and buyer confirmation',()=>{
 const s=simulatePayment(createCase());investigate(s);rehearse(s);
 assert.equal(outcomeProofMarkup(s),'');
 approve(s,s.rehearsal.id);
 assert.match(outcomeProofMarkup(s),/Approved; access change pending/);
 applyRepair(s);
 assert.match(outcomeProofMarkup(s),/Access changed; verification pending/);
 verify(s);
 const html=outcomeProofMarkup(s);
 assert.match(html,/Access verified with fresh proof/);
 assert.equal((html.match(/class="case-outcome-stage"/g)||[]).length,3);
 assert.match(html,/Protected lesson opened/);
 assert.match(html,/Buyer confirmation remains separate/);
 assert.match(outcomeProofMarkup(s,{uncertain:true}),/verification pending/);
});

test('already restored access shows verification without inventing a grant',()=>{
 const s=simulatePayment(createCase('restored'));investigate(s);verify(s);
 const html=outcomeProofMarkup(s);
 assert.match(html,/Access verified with fresh proof/);
 assert.match(html,/Already active · no grant needed/);
 assert.match(html,/No grant needed/);
 assert.doesNotMatch(html,/One write recorded/);
});

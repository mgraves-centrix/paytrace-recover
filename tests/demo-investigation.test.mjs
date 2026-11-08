import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate} from '../dist/core.mjs';
import {investigationView} from '../dist/demo-investigation.mjs';

test('scripted investigation presents exact evidence, agent limits, and no invented model probability',()=>{
 const state=createCase('match');simulatePayment(state);investigate(state);
 const html=investigationView(state);
 assert.match(html,/6 of 6 exact checks pass/);
 assert.match(html,/Strongly supported/);
 assert.match(html,/CAUSE CERTAINTY[\s\S]*?Limited/);
 assert.match(html,/NO LIVE MODEL CALL/);
 assert.match(html,/not a measured AI probability/);
 assert.match(html,/no access has changed/);
 for(const name of ['Ledger','Relay','Patch','Prism'])assert.match(html,new RegExp(name));
 for(const label of ['High for payment match','Low for root cause','Conditional','High for safety checks'])assert.match(html,new RegExp(label));
 assert.equal((html.match(/Confidence · /g)||[]).length,4);
 assert.match(html,/Evidence used/);
 assert.doesNotMatch(html,/\d+%/);
});

test('a mismatched sample remains on hold even when its payment completed',()=>{
 const state=createCase('conflict');simulatePayment(state);investigate(state);
 const html=investigationView(state);
 assert.match(html,/On hold/);
 assert.match(html,/Open:/);
 assert.doesNotMatch(html,/Strongly supported/);
});

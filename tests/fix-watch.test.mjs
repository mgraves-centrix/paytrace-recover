import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment} from '../dist/core.mjs';
import {fixWatch} from '../server/fix-watch.mjs';

const now=Date.parse('2026-11-03T12:00:00.000Z');
function purchase(id,revision,{gap=false,source='paypal-sandbox',channel='mapped-event',minutesAgo=20,proof=false}={}){
 const s=simulatePayment(createCase('match',id));
 s.capture.source=source;s.paidAt=new Date(now-minutesAgo*60000).toISOString();
 s.externalIntake={channel,connectorRevision:revision};
 if(gap)s.monitor={detectedAt:new Date(now-10*60000).toISOString()};
 else s.entitlement={...s.entitlement,active:true,captureId:s.capture.id};
 if(proof)s.firstVerifiedAt=new Date(Date.parse(s.paidAt)+4*60000).toISOString();
 return s;
}
const connector={active:true,revision:2,activatedAt:'2026-11-03T11:00:00.000Z'};

test('Fix Watch compares only exact completed mapped sandbox purchases by revision',()=>{
 const cases=[purchase('P1',1,{gap:true}),purchase('P2',1,{gap:true}),purchase('P3',1,{proof:true}),purchase('C1',2,{proof:true}),purchase('C2',2),purchase('C3',2),purchase('SAMPLE',2,{source:'sample',gap:true}),purchase('DIRECT',2,{channel:'direct-purchase',gap:true}),purchase('WAIT',2,{minutesAgo:1,gap:true})];
 const mismatched=purchase('WRONG',2,{gap:true});mismatched.capture.currency='EUR';cases.push(mismatched);
 const before=structuredClone(cases),result=fixWatch(cases,connector,{now,graceMinutes:5});
 assert.equal(result.state,'promising');
 assert.equal(result.previous.settled,3);assert.equal(result.previous.deliveryGaps,2);
 assert.equal(result.current.total,4);assert.equal(result.current.settled,3);assert.equal(result.current.deliveryGaps,0);
 assert.equal(result.current.pendingWindow,1);assert.equal(result.current.historicallyVerified,1);assert.equal(result.current.medianMinutesToProof,4);
 assert.deepEqual(result.current.caseIds,['C1','C2','C3']);
 assert.deepEqual(cases,before);
});

test('Fix Watch calls for review on worse outcomes and collects a small cohort',()=>{
 const prior=[purchase('P1',1),purchase('P2',1),purchase('P3',1)];
 const current=[purchase('C1',2,{gap:true}),purchase('C2',2,{gap:true}),purchase('C3',2)];
 assert.equal(fixWatch([...prior,...current],connector,{now}).state,'review');
 assert.match(fixWatch([...prior,...current],connector,{now}).recommendation,/no automatic rollback/i);
 assert.equal(fixWatch([current[0]],connector,{now}).state,'collecting');
 assert.equal(fixWatch([], {active:false,revision:2},{now}).state,'inactive');
});

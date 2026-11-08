import test from 'node:test';
import assert from 'node:assert/strict';
import {licenseSample,licenseChecks,licenseAgents,advanceLicenseSample} from '../dist/digital-order-model.mjs';

test('license sample requires evidence, exact approval, one assignment, and separate activation proof',()=>{
 let s=licenseSample();
 assert.equal(s.writes,0);
 assert.equal(licenseChecks(s).every(item=>item.ok),true);
 s=advanceLicenseSample(s);
 assert.equal(s.review.mode,'scripted');
 assert.equal(licenseAgents(s).length,4);
 s=advanceLicenseSample(s);
 assert.equal(s.preview.sku,s.order.sku);
 assert.equal(s.writes,0);
 s=advanceLicenseSample(s);
 assert.equal(s.approval.account,s.order.account);
 s=advanceLicenseSample(s);
 assert.equal(s.writes,1);
 assert.equal(s.proof,null);
 s=advanceLicenseSample(s);
 assert.equal(s.phase,'verified');
 assert.deepEqual(s.proof,{payment:true,assignment:true,activation:true});
 assert.equal(advanceLicenseSample(s).writes,1);
});

test('license sample holds mismatches and rejects stale preview or approval',()=>{
 let s=licenseSample();s.payment.sku='OTHER';
 s=advanceLicenseSample(s);
 assert.equal(s.phase,'held');
 assert.equal(s.writes,0);
 assert.throws(()=>advanceLicenseSample(s),/cannot be bypassed/);
 let p=advanceLicenseSample(licenseSample());p=advanceLicenseSample(p);
 p.preview.account='other@example.test';
 assert.throws(()=>advanceLicenseSample(p),/preview changed/);
 let a=advanceLicenseSample(advanceLicenseSample(advanceLicenseSample(licenseSample())));
 a.approval.sku='OTHER';
 assert.throws(()=>advanceLicenseSample(a),/Approval no longer matches/);
 assert.equal(a.writes,0);
});

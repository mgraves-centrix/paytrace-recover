import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate} from '../dist/core.mjs';
import {detectIncident,rehearseAutopilot,disputePacket} from '../dist/intelligence-lab.mjs';

function sandbox(id,minutesAgo=10){const s=simulatePayment(createCase('match',id));s.intakeMode='sandbox';s.capture.source='paypal-sandbox';s.paidAt=new Date(Date.now()-minutesAgo*60000).toISOString();investigate(s);return s;}

test('incident mode requires three paid sandbox cases for one course in one window',()=>{
 const rows=[sandbox('CL-A',15),sandbox('CL-B',12),sandbox('CL-C',9)];
 const incident=detectIncident(rows);assert.equal(incident.active,true);assert.equal(incident.autopilotPaused,true);assert.equal(incident.count,3);
 rows[2].capture.source='sample';assert.equal(detectIncident(rows).active,false);
 rows[2].capture.source='paypal-sandbox';rows[2].paidAt=new Date(Date.now()-100*60000).toISOString();assert.equal(detectIncident(rows).active,false);
});

test('policy rehearsal separates eligible, model-pending, held, and sample cases without mutation',()=>{
 const eligible=sandbox('CL-ELIGIBLE'),pending=sandbox('CL-PENDING'),held=sandbox('CL-HELD'),sample=simulatePayment(createCase());
 eligible.review.mode='model';eligible.analysis={mode:'model'};
 held.capture.amount=100;
 const rows=[eligible,pending,held,sample],before=structuredClone(rows),result=rehearseAutopilot(rows,{courseId:'course-light',maxAmountCents:15000,dailyLimit:1});
 assert.deepEqual(result.counts,{wouldRecover:1,needsReview:1,held:1,alreadyAccess:0,excluded:1});
 assert.equal(result.wouldRecover[0].caseId,eligible.id);assert.deepEqual(rows,before);
});

test('merchant packet records outcome evidence but omits customer message content and email',()=>{
 const s=sandbox('CL-PACKET');const packet=disputePacket(s,{messages:[{at:new Date().toISOString(),role:'customer',kind:'message',text:'My private password is secret'}],email:'buyer@example.com',confirmedAt:null,help:true});
 assert.equal(packet.purpose,'Merchant review packet; not a PayPal dispute submission.');
 assert.equal(packet.payment.status,'COMPLETED');assert.equal(packet.customer.needsMoreHelp,true);
 const serialized=JSON.stringify(packet);assert.doesNotMatch(serialized,/private password|buyer@example.com/);
 s.evidenceAvailable=false;const unavailable=disputePacket(s,{});assert.equal(unavailable.payment.recordAvailable,false);assert.ok(unavailable.purchaseChecks.every(c=>!c.passed));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment} from '../dist/core.mjs';
import {autonomyOverview} from '../server/autonomy-overview.mjs';

const policy={enabled:true,courseId:'course-light',maxAmountCents:15000,dailyLimit:2};
const caseFor=id=>{const s=simulatePayment(createCase('match',id));s.capture.source='paypal-sandbox';s.intakeMode='sandbox';return s;};

test('autonomy preview explains holds and never presents them as repair candidates',()=>{
 const hold=caseFor('hold'),written=caseFor('written'),outside=caseFor('outside');
 hold.paymentHold={reason:'refund'};written.writes=1;outside.order.amount=25000;
 const before=structuredClone([hold,written,outside]);
 const result=autonomyOverview([hold,written,outside],policy,{ready:true,database:true});
 assert.deepEqual(result.items.map(i=>i.status),['paused','verification','manual']);
 assert.match(result.items[1].next,/never repeat the grant/i);
 assert.deepEqual([hold,written,outside],before);
});

test('simulated policy changes classification without changing stored case',()=>{
 const s=caseFor('policy');s.monitor={status:'attention'};
 const before=structuredClone(s);
 assert.equal(autonomyOverview([s],policy,{ready:true}).items[0].status,'investigate');
 assert.equal(autonomyOverview([s],{...policy,maxAmountCents:10000},{ready:true}).items[0].status,'manual');
 assert.equal(autonomyOverview([s],{...policy,enabled:false},{ready:true}).items[0].status,'review');
 assert.deepEqual(s,before);
});

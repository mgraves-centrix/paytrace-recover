import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {disagreementModel,flightRecorderModel,incidentScope} from '../dist/case-intelligence.mjs';

test('challenge room distinguishes an open contradiction from a stale or answered review',()=>{
 const blocked=investigate(simulatePayment(createCase('conflict','CL-CONFLICT')));
 const open=disagreementModel(blocked);
 assert.equal(open.current,true);
 assert.equal(open.outcome,'blocked');
 assert.ok(open.open.some(item=>item.id==='identity'));
 assert.match(open.next,/No access change/);
 const safe=investigate(simulatePayment(createCase('match','CL-SAFE')));
 assert.equal(disagreementModel(safe).open.length,0);
 assert.match(disagreementModel(safe).next,/merchant approval/);
 safe.capture.amount=1;
 const stale=disagreementModel(safe);
 assert.equal(stale.current,false);
 assert.equal(stale.exchanges.length,0);
 assert.match(stale.next,/new investigation/);
});

test('flight recorder keeps payment, write, proof, and customer confirmation separate',()=>{
 const s=simulatePayment(createCase('match','CL-FLIGHT'));
 let flight=flightRecorderModel(s);
 assert.equal(flight.sample,true);
 assert.equal(flight.steps[0].state,'complete');
 assert.equal(flight.steps[4].state,'waiting');
 investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);
 flight=flightRecorderModel(s);
 assert.equal(flight.steps[4].state,'complete');
 assert.equal(flight.steps[5].state,'waiting');
 verify(s);
 flight=flightRecorderModel(s,{confirmedAt:null,help:false});
 assert.equal(flight.steps[5].state,'complete');
 assert.equal(flight.steps[6].state,'waiting');
 assert.equal(flightRecorderModel(s,{confirmedAt:new Date().toISOString(),help:false}).steps[6].state,'complete');
 assert.equal(flightRecorderModel(s,{confirmedAt:new Date().toISOString(),help:true}).steps[6].state,'hold');
});

test('incident scope lists only the qualifying sandbox cluster as a warning',()=>{
 const now=Date.now();
 const cases=[0,1,2].map(i=>{const s=simulatePayment(createCase('match','CL-INC-'+i));s.capture.source='paypal-sandbox';s.intakeMode='sandbox';s.paidAt=new Date(now-(12-i*3)*60000).toISOString();return s;});
 const sample=simulatePayment(createCase('match','CL-SAMPLE'));
 const scope=incidentScope([...cases,sample],now);
 assert.equal(scope.active,true);
 assert.equal(scope.autopilotPaused,true);
 assert.deepEqual(scope.rows.map(row=>row.caseId),cases.map(s=>s.id));
 assert.ok(scope.rows.every(row=>row.writes===0&&row.access==='missing'));
 assert.equal(incidentScope([cases[0],cases[1],sample],now).active,false);
});

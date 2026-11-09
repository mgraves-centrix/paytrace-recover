import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment} from '../dist/core.mjs';
import {caseOrigin,merchantCases} from '../dist/focus-model.mjs';
import {workspaceOverview} from '../dist/workspace-model.mjs';
import {workspaceView} from '../dist/focus-workspace.mjs';
import {todayMarkup} from '../dist/today-view.mjs';

test('case origin distinguishes a completed PayPal sandbox capture from samples and pending checkout',()=>{
 const sample=simulatePayment(createCase('match','CL-SAMPLE-ORIGIN'));
 const connected=simulatePayment(createCase('match','CL-CONNECTED-ORIGIN'));
 connected.intakeMode='sandbox';connected.capture.source='paypal-sandbox';
 const pending=createCase('match','CL-PENDING-ORIGIN');pending.intakeMode='sandbox';
 assert.equal(caseOrigin(sample,{backend:true}).kind,'sample');
 assert.equal(caseOrigin(connected,{backend:true}).kind,'connected');
 assert.match(caseOrigin(connected,{backend:true}).detail,/Checkout complete/);
 assert.equal(caseOrigin(pending,{backend:true}).kind,'pending');
 assert.equal(caseOrigin(connected,{backend:false}).kind,'sample');

 const cases=merchantCases([sample,connected,pending]);
 const overview=workspaceOverview(cases,{backend:true});
 const pulse=todayMarkup(overview,{backend:true});
 const queue=workspaceView({cases,queue:'attention',search:'',sort:'customer',backend:true,busy:false,screen:'cases'});
 for(const html of [pulse,queue]){
  assert.match(html,/Sandbox payment captured/);
  assert.doesNotMatch(html,/Fictional sample case/);
  assert.match(html,/Sandbox checkout pending/);
 }
});

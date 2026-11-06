import test from 'node:test';
import assert from 'node:assert/strict';
import {todayGroups,todayMarkup} from '../dist/today-view.mjs';
import {journeyAt,journeyChapters} from '../dist/demo-journey-model.mjs';
import {decisionCardMarkup} from '../dist/decision-card.mjs';
import {createCase,simulatePayment,investigate,rehearse} from '../dist/core.mjs';

test('Today gives each case one clear group without changing case data',()=>{
 const data={checkedAt:new Date().toISOString(),counts:{total:4,verified:1,followupsDue:1,customerWaiting:1,verificationNeeded:1,overdueAccess:0,sourceIssues:0,workflowIssues:0},rows:[
  {caseId:'A',customerName:'Alex',actionable:true,reasons:['Preview awaits your approval'],nextStep:'Approve'},
  {caseId:'B',customerName:'Bri',actionable:false,workflowPending:true,reasons:[],nextStep:'Wait'},
  {caseId:'C',customerName:'Cai',actionable:false,verified:true,reasons:[],nextStep:'Done'},
  {caseId:'D',customerName:'Dee',actionable:true,verified:true,reasons:['Customer replied'],nextStep:'Reply'}
 ]};
 const before=structuredClone(data),groups=todayGroups(data);
 assert.deepEqual(groups.map(g=>g.rows.map(r=>r.caseId)),[['A','D'],['B'],['C']]);
 assert.deepEqual(data,before);
 const html=todayMarkup(data,{operator:true});assert.match(html,/Know what needs you next/);assert.match(html,/Export queue CSV/);
});

test('Today escapes customer names and keeps detailed metrics behind a disclosure',()=>{
 const data={checkedAt:new Date().toISOString(),counts:{total:1,verified:0,followupsDue:0,customerWaiting:0,verificationNeeded:0,overdueAccess:0,sourceIssues:0,workflowIssues:0},rows:[{caseId:'A',customerName:'<img src=x>',actionable:true,reasons:['Review evidence'],nextStep:'Review'}]};
 const html=todayMarkup(data);assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);assert.match(html,/<details class="today-details">/);
});

test('decision brief never calls a sample grant verified before proof',()=>{
 const s=simulatePayment(createCase());investigate(s);rehearse(s);
 let html=decisionCardMarkup(s);assert.match(html,/Your decision/);assert.match(html,/What changes/);assert.match(html,/Lesson proof/);assert.doesNotMatch(html,/Verified outcome/);
 s.evidenceAvailable=false;html=decisionCardMarkup(s);assert.match(html,/Exact purchase/);assert.doesNotMatch(html,/class="pass"><b>✓<\/b> Exact purchase/);
});

test('walkthrough requires sample merchant approval before a grant and separate verification before confirmation',()=>{
 assert.equal(journeyChapters.length,8);
 for(let step=0;step<=4;step++){const result=journeyAt(step);assert.equal(result.state.writes,0);assert.equal(result.verified,false);}
 const grant=journeyAt(5);assert.equal(grant.state.writes,1);assert.equal(grant.verified,false);assert.ok(grant.state.approval);
 const proof=journeyAt(6);assert.equal(proof.state.writes,1);assert.equal(proof.verified,true);assert.equal(proof.confirmed,false);
 const confirmed=journeyAt(7);assert.equal(confirmed.state.writes,1);assert.equal(confirmed.confirmed,true);
});

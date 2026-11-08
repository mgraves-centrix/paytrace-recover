import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationCaseHref,notificationGroups,notificationLabel,notificationNextStep} from '../dist/recovery-notifications.mjs';

test('notification handoff opens the selected case and preserves its exact ID',()=>{
 assert.equal(notificationCaseHref('CL-123-A&B'),'focus.html?caseId=CL-123-A%26B');
 assert.match(notificationNextStep('customer-update-due'),/Post the promised/);
});

test('related alerts group without losing per-case actions or unread counts',()=>{
 const items=[
  {id:'a',kind:'overdue',caseId:'A',readAt:null},
  {id:'b',kind:'customer-response',caseId:'B',readAt:null},
  {id:'c',kind:'overdue',caseId:'A',readAt:'2026-11-08T00:00:00Z'},
  {id:'d',kind:'overdue',caseId:'C',readAt:null}
 ];
 const groups=notificationGroups(items);
 assert.equal(groups[0].kind,'customer-response');
 assert.deepEqual(groups[1],{kind:'overdue',alerts:[items[0],items[2],items[3]],caseCount:2,unread:2});
 assert.equal(notificationLabel('overdue'),'Paid access overdue');
 assert.equal(items.length,groups.reduce((total,group)=>total+group.alerts.length,0));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {emailStatus,emailActivityGuidance,resolutionSteps,replyTemplates} from '../dist/support-polish.mjs';
import {updatePromiseState} from '../dist/focus-support.mjs';

test('resolution distinguishes active access from verification and reopened customer help',()=>{
 const state={entitlement:{active:true}};
 assert.deepEqual(resolutionSteps(state,{verified:false,confirmedAt:'old'}).map(s=>s.done),[true,false,false]);
 assert.deepEqual(resolutionSteps(state,{verified:true,confirmedAt:'now',help:true}).map(s=>s.done),[true,true,false]);
 assert.deepEqual(resolutionSteps(state,{verified:true,confirmedAt:'now',help:false}).map(s=>s.done),[true,true,true]);
});
test('email labels and suggested replies do not overstate delivery or access',()=>{
 assert.match(emailStatus('accepted-by-provider')[1],/does not prove/);
 assert.match(emailStatus('delivery-unknown')[0],/unconfirmed/);
 assert.match(emailStatus('not-configured')[0],/setup needed/);
 assert.match(emailStatus('not-configured')[1],/retried/);
 assert.match(emailStatus('retry-pending')[0],/Retry scheduled/);
 assert.match(emailStatus('needs-manual-review')[1],/retries stopped/);
 assert.match(replyTemplates({verified:false})[0][1],/still open/);
 assert.doesNotMatch(replyTemplates({verified:false})[0][1],/check has passed/);
 assert.match(replyTemplates({verified:true})[0][1],/let us know whether it works/);
});
test('email activity guidance distinguishes automatic retries from terminal states',()=>{
 assert.match(emailActivityGuidance([{state:'not-configured'}]),/retried/);
 assert.match(emailActivityGuidance([{state:'retry-pending'}]),/same request ID/);
 assert.match(emailActivityGuidance([{state:'delivery-unknown'}]),/check provider activity/);
 assert.match(emailActivityGuidance([{state:'failed'}]),/fresh invitation/);
 assert.match(emailActivityGuidance([{state:'needs-manual-review'}]),/Automatic retries stopped/);
});
test('customer update timing and email attempt remain separate facts',()=>{
 const now=Date.parse('2026-11-01T15:00:00Z');
 assert.equal(updatePromiseState('2026-11-01T14:00:00Z',[],now).timing,'overdue');
 assert.equal(updatePromiseState('2026-11-01T16:00:00Z',[],now).timing,'scheduled');
 assert.equal(updatePromiseState(null,[],now).email,'No email attempt recorded');
 const state=updatePromiseState('2026-11-01T16:00:00Z',[{state:'accepted-by-provider',at:'2026-11-01T14:00:00Z'}],now);
 assert.equal(state.email,'Accepted by email provider');
 assert.equal(state.timing,'scheduled');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {openStore} from '../server/store.mjs';

test('a due customer update creates one merchant reminder and one honest email attempt',async()=>{
 const db=openStore(':memory:');
 try{
  const workspace=db.create(),owner=workspace.id,caseId=workspace.state.id;
  db.support.contact(owner,caseId,'buyer@example.test');
  const before=db.support.view(owner,caseId,true).notifications.length;
  const dueAt=new Date(Date.now()+100).toISOString();
  db.support.updatePromise(owner,caseId,dueAt);
  await wait(130);
  db.center.tick(owner);
  db.center.tick(owner);
  assert.equal(db.center.notifications(owner).filter(n=>n.caseId===caseId&&n.kind==='customer-update-due').length,1);
  assert.equal(db.support.view(owner,caseId,true).notifications.length,before+1);
  let sent=0;
  await db.support.flush({RESEND_API_KEY:'test',EMAIL_FROM:'updates@example.test'},'https://example.test',async(_url,options)=>{sent++;const message=JSON.parse(options.body);assert.match(message.text,/merchant has been reminded/i);assert.doesNotMatch(message.text,/access restored|problem solved/i);return {ok:true,status:200};});
  assert.equal(sent,1);
  assert.equal(db.support.view(owner,caseId,true).notifications.at(-1).state,'accepted-by-provider');
 }finally{db.close();}
});

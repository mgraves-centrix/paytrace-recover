import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';
import {createService} from '../server/service.mjs';

test('private customer self-check rereads payment and course without granting access',async()=>{
 const db=openStore(':memory:');try{
  const {id}=db.create(),s=db.get(id).state;s.intakeMode='sandbox';s.paypalOrderId='PAYPAL-ORDER';s.capture.source='paypal-sandbox';db.save(id,s);
  let active=false,mismatch=false,grants=0;
  const paypal={refresh:async state=>({...state.capture,amount:mismatch?1:state.order.amount})};
  const course={check:async state=>({active,userId:state.order.userId,courseId:state.order.courseId,captureId:active?state.capture.id:null}),probe:async state=>({accessible:true,userId:state.order.userId,courseId:state.order.courseId,captureId:state.capture.id,contentId:'light-lesson-01',body:'Protected lesson content is visible here.'}),grant:async()=>{grants++;throw Error('Grant must not run');}};
  const service=createService(db,{}, {paypal,course});
  let result=await service.customerSelfCheck(id,s.id);assert.equal(result.state,'missing-access');assert.equal(result.accessChanged,false);
  active=true;result=await service.customerSelfCheck(id,s.id);assert.equal(result.state,'access-available');
  mismatch=true;result=await service.customerSelfCheck(id,s.id);assert.equal(result.state,'payment-review');
  const disconnected=createService(db,{}, {paypal,course:null});assert.equal((await disconnected.customerSelfCheck(id,s.id)).state,'unavailable');
  assert.equal(grants,0);assert.equal(db.get(id).state.writes,0);
 }finally{db.close();}
});

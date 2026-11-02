import {buildRunReport} from './run-report.mjs';
import {proofIsCurrent} from './operations.mjs';

// A presentation of saved case evidence. It never refreshes a provider or grants access.
export function buildRecoveryPassport(s,{backend=false,customer=false,confirmedAt=null,browserProofAt=null,help=false}={}){
 const report=buildRunReport(s,{backend}),byId=id=>report.checks.find(check=>check.id===id);
 const lesson=byId('verification'),current=!s.paymentHold&&proofIsCurrent(s)&&s.evidenceAvailable!==false&&!Object.values(s.sources||{}).some(source=>source?.status==='unavailable');
 const steps=[
  {id:'payment',title:'Payment confirmed',status:byId('payment').status,at:byId('payment').checkedAt,source:s.capture?.source==='paypal-sandbox'?'PayPal sandbox':'Sample purchase',detail:byId('payment').detail,reference:byId('payment').reference},
  {id:'review',title:'Cause investigated',status:byId('agents').status,at:byId('agents').checkedAt,source:byId('agents').status==='passed'?'AI specialists':byId('agents').status==='demo'?'Scripted specialists':'Merchant case',detail:byId('agents').detail,reference:byId('agents').reference,sourceIds:byId('agents').sourceIds||[]},
  {id:'decision',title:'Correction authorized',status:byId('approval').status,at:byId('approval').checkedAt,source:s.approval?.mode==='policy'?'Merchant policy':'Merchant decision',detail:byId('approval').detail,reference:byId('approval').reference},
  {id:'correction',title:'Access correction',status:s.writes===1?'recorded':current?'not-needed':s.job?.pending&&s.job.kind==='recover'?'running':'pending',at:s.job?.completed?.repair?.at||null,source:s.job?.kind==='recover'&&s.job.runId?'Render workflow':'PayTrace recovery service',detail:s.writes===1?'One access grant was recorded; lesson verification is a separate step.':current?'Existing access was verified; PayTrace made no access write.':'No access correction has been recorded.',reference:s.job?.kind==='recover'?s.job.runId||null:null},
  {id:'lesson',title:'Protected lesson checked',status:lesson.status,at:lesson.checkedAt,source:s.proof?.transport==='external-course-service'?'Separate course service':'Demo course',detail:lesson.detail,reference:lesson.reference},
  {id:'browser',title:'Customer browser reached lesson',status:current&&browserProofAt?'passed':'pending',at:current?browserProofAt:null,source:'Private customer session',detail:current&&browserProofAt?'Protected lesson content reached the private browser session. This is not the customer’s confirmation.':'No current browser receipt has been recorded.',reference:null},
  {id:'customer',title:'Customer confirmed access',status:current&&confirmedAt&&!help?'passed':help?'needs-help':'pending',at:current&&!help?confirmedAt:null,source:'Customer response',detail:help?'The customer asked for more help. The case remains open.':current&&confirmedAt?'The customer separately confirmed access.':'Customer confirmation has not been recorded.',reference:null}
 ];
 const state=help?'needs-help':current&&confirmedAt?'customer-confirmed':current&&browserProofAt?'browser-reached':current?'technically-verified':s.paymentHold?'payment-hold':s.writes?'verification-needed':'in-progress';
 const stages=s.job?.kind==='investigate'?['gather','analyze','record']:s.job?.kind==='recover'?['repair','verify']:[];
 const workflow=!customer&&s.job?{kind:s.job.kind,runId:s.job.runId||null,startedAt:s.job.startedAt||null,error:s.job.error||null,stages:stages.map((name,index)=>({name,status:Object.hasOwn(s.job.completed||{},name)?'complete':s.job.error&&stages.findIndex(stage=>!Object.hasOwn(s.job.completed||{},stage))===index?'failed':s.job.pending&&stages.findIndex(stage=>!Object.hasOwn(s.job.completed||{},stage))===index?'running':'waiting'}))}:null;
 const headline={
  'needs-help':'The customer still needs help.','customer-confirmed':'Access works, confirmed by the customer.','browser-reached':'The lesson reached the customer browser.','technically-verified':'The protected lesson check passed.','payment-hold':'A payment change needs review.','verification-needed':'Access changed; verification is still needed.','in-progress':'Recovery is in progress.'
 }[state];
 return {schema:1,caseId:s.id,generatedAt:new Date().toISOString(),scope:report.scope,state,headline,steps:customer?steps.map(({reference,sourceIds,...step})=>step):steps,workflow,note:'This passport describes saved evidence at the stated times. It is not a live guarantee of access, delivery, or customer satisfaction.'};
}

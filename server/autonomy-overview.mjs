import {proofIsCurrent} from '../dist/operations.mjs';
import {detectIncident} from '../dist/intelligence-lab.mjs';
import {reviewIsCurrent} from '../dist/core.mjs';

// A read-only explanation. The service refreshes provider evidence and applies its
// stricter, authoritative gates before any access write.
export function autonomyOverview(cases, policy, {ready=false, workflows=false, backup=null, database=true, worker=false}={}) {
 const incident=detectIncident(cases);
 const items=cases.map(s=>{
  const paymentConfirmed=s.capture?.source==='paypal-sandbox'&&s.capture?.status==='COMPLETED'&&!s.paymentHold;
  const currentReview=s.review?.mode==='model'&&reviewIsCurrent(s);
  const path=[
   {label:'Payment',state:s.paymentHold?'blocked':paymentConfirmed?'done':'waiting'},
   {label:'Delivery watch',state:['attention','access_present'].includes(s.monitor?.status)?'done':'waiting'},
   {label:'AI review',state:currentReview?'done':s.agentRun?.status==='running'?'active':'waiting'},
   {label:'Authorization',state:s.approval?.mode==='policy'?'policy':s.approval?'merchant':'waiting'},
   {label:'Access',state:s.writes>0?'grant':s.entitlement?.active?'present':'waiting'},
   {label:'Lesson proof',state:proofIsCurrent(s)?'done':s.writes>0||s.entitlement?.active?'active':'waiting'}
  ];
  let status,reason,next;
  if(s.paymentHold){status='paused';reason='Payment changed or is disputed.';next='Merchant reviews the payment hold.';}
  else if(proofIsCurrent(s)){status='verified';reason='Current payment, access, and lesson proof passed.';next='Customer confirms the purchase opens.';}
  else if(s.writes>0){status='verification';reason='An access write was recorded but current proof has not passed.';next='Retry read-only verification; never repeat the grant.';}
  else if(s.job?.pending){status='running';reason='An investigation or recovery job is active.';next='Wait for the job outcome.';}
  else if(s.capture?.source!=='paypal-sandbox'){status='manual';reason='Illustrative or non-sandbox payment evidence.';next='Use a completed PayPal sandbox purchase.';}
  else if(s.monitor?.status==='access_present'){status='verify';reason='Access appears present but needs current proof.';next='Check payment, access, and protected lesson without a write.';}
  else if(incident.active){status='paused';reason='A shared incident is active.';next='Investigate the incident before any automatic grant.';}
  else if(!ready){status='setup';reason='A required PayPal, course, or AI connection is unavailable.';next='Complete the connections, then refresh evidence.';}
  else if(!policy.enabled){status='review';reason='Automatic repair is off for this workspace.';next='Investigate and request merchant approval.';}
  else if(s.order?.courseId!==policy.courseId||s.order?.currency!=='USD'||s.order?.amount>policy.maxAmountCents){status='manual';reason='Purchase is outside the merchant policy.';next='Merchant reviews this case.';}
  else if(s.automation?.status==='needs-attention'){status='manual';reason='An earlier automatic attempt stopped.';next='Merchant reviews current evidence before another action.';}
  else if(s.review?.mode==='model'&&s.review?.outcome==='ready'&&reviewIsCurrent(s)&&s.phase==='investigated'){status='candidate';reason='Current model review appears ready within the selected policy.';next='Service must refresh payment and access, check all gates, preview, reserve the daily limit, and verify.';}
  else if(s.monitor?.status==='attention'){status='investigate';reason='Delivery window passed and access appears missing.';next='Fetch fresh evidence and run specialist analysis.';}
  else {status='watching';reason='No overdue missing-access signal yet.';next='Watch for payment, course, or delivery-window changes.';}
  return {caseId:s.id,status,reason,next,path,automationStatus:s.automation?.status||null};
 });
 const counts=Object.fromEntries(['candidate','investigate','verify','verification','manual','paused','running','verified','review','setup','watching'].map(k=>[k,items.filter(x=>x.status===k).length]));
 return {advisory:true,policy:{enabled:!!policy.enabled,maxAmountCents:policy.maxAmountCents,dailyLimit:policy.dailyLimit,courseId:policy.courseId},readiness:{connections:ready,workflows,worker,database,backupConfigured:!!backup,restoreVerified:!!backup?.restoreVerified,incident:incident.active},counts,items};
}

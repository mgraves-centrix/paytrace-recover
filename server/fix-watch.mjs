import {deliveryCheck} from '../dist/diagnosis.mjs';

const MIN_COHORT=3;
const median=values=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),half=Math.floor(sorted.length/2);return sorted.length%2?sorted[half]:(sorted[half-1]+sorted[half])/2;};

function cohort(cases,revision,now,graceMinutes){
 const rows=cases.filter(s=>s.externalIntake?.channel==='mapped-event'&&s.externalIntake.connectorRevision===revision&&s.capture?.source==='paypal-sandbox'&&s.capture.status==='COMPLETED'&&s.capture.orderId===s.order?.id&&s.capture.userId===s.order?.userId&&s.capture.courseId===s.order?.courseId&&s.capture.amount===s.order?.amount&&s.capture.currency===s.order?.currency);
 const settled=rows.filter(s=>!s.paymentHold&&Number.isFinite(Date.parse(s.paidAt))&&now-Date.parse(s.paidAt)>=graceMinutes*60000);
 const gaps=settled.filter(s=>s.monitor?.detectedAt||deliveryCheck(s,{now,graceMinutes}).status==='attention');
 const times=settled.map(s=>{const start=Date.parse(s.paidAt),end=Date.parse(s.firstVerifiedAt||s.lastPassingVerification?.at||'');return Number.isFinite(end)&&end>=start?(end-start)/60000:null}).filter(Number.isFinite);
 return {revision,total:rows.length,settled:settled.length,deliveryGaps:gaps.length,gapRate:settled.length?gaps.length/settled.length:null,historicallyVerified:times.length,medianMinutesToProof:median(times),paymentHolds:rows.filter(s=>!!s.paymentHold).length,pendingWindow:rows.length-settled.length-rows.filter(s=>!!s.paymentHold).length,caseIds:settled.map(s=>s.id).sort()};
}

// Compare only mapped store events with exact PayPal sandbox captures. This is
// observational monitoring, not a causal estimate or an automated rollback.
export function fixWatch(cases,connector,{now=Date.now(),graceMinutes=5}={}){
 if(!connector?.active||!Number.isInteger(connector.revision)||connector.revision<1)return {state:'inactive',current:null,previous:null,notice:'Activate a mapping with a fresh matching PayPal sandbox capture before monitoring its outcomes. No connector change is made here.'};
 const revisions=[...new Set(cases.filter(s=>s.externalIntake?.channel==='mapped-event'&&Number.isInteger(s.externalIntake.connectorRevision)&&s.externalIntake.connectorRevision<connector.revision).map(s=>s.externalIntake.connectorRevision))].sort((a,b)=>b-a);
 const current=cohort(cases,connector.revision,now,graceMinutes),previous=revisions.length?cohort(cases,revisions[0],now,graceMinutes):null;
 let state='collecting',recommendation='Watch more completed mapped purchases before judging this change.';
 if(previous?.settled>=MIN_COHORT&&current.settled>=MIN_COHORT){
  const delta=current.gapRate-previous.gapRate;
  if(delta>=0.2){state='review';recommendation='The observed delivery-gap rate is higher than the prior mapped cohort. Review both cohorts and consider reverting the mapping; no automatic rollback occurs.';}
  else if(delta<=-0.2){state='promising';recommendation='Fewer mapped purchases missed the delivery window in this cohort. Continue watching; this comparison does not prove the mapping caused the change.';}
  else {state='mixed';recommendation='The observed gap rates are close. Keep monitoring and inspect individual cases before drawing a conclusion.';}
 }
 else if(current.settled>=MIN_COHORT&&current.deliveryGaps>=2){state='review';recommendation='Several purchases still missed the delivery window. Review the connector and consider reverting the mapping after checking each case; no automatic rollback occurs.';}
 return {state,current,previous,minimumCohort:MIN_COHORT,activatedAt:connector.activatedAt||null,recommendation,notice:'Read-only cohort comparison of saved mapped store events with completed PayPal sandbox captures. Drafts, direct intake, fictional samples, and purchases still inside the delivery window are not treated as settled outcomes. A recorded protected-lesson proof is distinct from customer confirmation. This does not establish causation or change the connector.'};
}

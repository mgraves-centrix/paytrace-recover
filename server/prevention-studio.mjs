import {mapStoreEvent,validateMapping,CONNECTOR_FIELDS} from './connector-studio.mjs';

const DAY=86400000;
const failureName=code=>code==='ENROLLMENT_TIMEOUT'?'Enrollment update timed out':'Paid access was not delivered';

// Historical correlation only. A shared symptom cannot establish a shared cause.
export function preventionPatterns(cases,{now=Date.now(),days=30}={}){
 const start=now-days*DAY,groups=new Map();
 for(const s of cases){
  const source=s.capture?.source==='paypal-sandbox'?'paypal-sandbox':'sample';
  const at=Date.parse(s.paidAt||s.createdAt||'');
  if(!Number.isFinite(at)||at<start||at>now||s.capture?.status!=='COMPLETED'||s.paymentHold||!s.order?.courseId)continue;
  const code=s.fulfillment?.code||'MISSING_ACCESS',key=JSON.stringify([source,s.order.courseId,code]);
  if(!groups.has(key))groups.set(key,{source,courseId:s.order.courseId,code,cases:[]});
  groups.get(key).cases.push(s);
 }
 const patterns=[];
 for(const group of groups.values()){
  const verified=group.cases.filter(s=>!!s.firstVerifiedAt||!!s.lastPassingVerification?.at||s.proof?.passed===true);
  if(group.cases.length<2||verified.length<1)continue;
  const open=group.cases.filter(s=>!s.proof?.passed||s.phase!=='verified');
  patterns.push({id:`${group.source}:${group.courseId}:${group.code}`,source:group.source,courseId:group.courseId,symptom:failureName(group.code),count:group.cases.length,verified:verified.length,open:open.length,caseIds:group.cases.map(s=>s.id).sort(),earliestAt:group.cases.map(s=>s.paidAt||s.createdAt).sort()[0],latestAt:group.cases.map(s=>s.paidAt||s.createdAt).sort().at(-1),hypothesis:group.code==='ENROLLMENT_TIMEOUT'?'Inspect the store-to-course handoff and retry behavior. Compare the learner and course mapping before changing it.':'Compare the store event mapping and course access records. The shared cause is not established.',next:'Rehearse a proposed mapping against sample events, then verify a sandbox purchase before activating any change.'});
 }
 patterns.sort((a,b)=>b.count-a.count||b.latestAt.localeCompare(a.latestAt));
 return {windowDays:days,patterns,definition:'Read-only grouping of saved completed purchases by source, course, and fulfillment symptom. Historical verification is evidence of recovery, not proof of a shared root cause. Sample and PayPal sandbox cases are never combined.',generatedAt:new Date(now).toISOString()};
}

// Never return sample values, learner identities, PayPal references, or raw errors.
export function replayMapping(events,proposed,current=null){
 if(!Array.isArray(events)||events.length<1||events.length>10||events.some(e=>!e||typeof e!=='object'||Array.isArray(e)))throw Error('Provide 1 to 10 store event objects.');
 const next=validateMapping(proposed),saved=current?validateMapping(current):null;
 const changes=saved?CONNECTOR_FIELDS.filter(field=>saved.fields[field]!==next.fields[field]):CONNECTOR_FIELDS;
 if(saved&&saved.amountMode!==next.amountMode)changes.push('amountMode');
 const rows=events.map((event,index)=>{
  let proposedValid=false,currentValid=null;
  try{mapStoreEvent(event,next);proposedValid=true}catch{}
  if(saved){try{mapStoreEvent(event,saved);currentValid=true}catch{currentValid=false}}
  return {sample:index+1,currentValid,proposedValid,changedFields:changes};
 });
 return {rows,proposedValid:rows.filter(r=>r.proposedValid).length,currentValid:saved?rows.filter(r=>r.currentValid).length:null,accessChange:false,saved:false,paymentChecked:false,notice:'Structural mapping rehearsal only. No PayPal read, case creation, connector change, or access grant occurred. A valid mapping still needs merchant review and a fresh matching sandbox capture before activation.'};
}

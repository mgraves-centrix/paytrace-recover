import {nextStep} from './focus-model.mjs';
import {proofIsCurrent,diagnose} from './operations.mjs';
import {deliveryCheck} from './diagnosis.mjs';
import {buildRunReport} from './run-report.mjs';

const hasUnavailable=s=>Object.values(s.sources||{}).some(x=>x?.status!=='available');
export const currentOutcome=s=>!s.paymentHold&&proofIsCurrent(s)&&s.evidenceAvailable!==false&&!hasUnavailable(s);

export function workspaceOverview(cases,{preferences=[],reminders=[],followups=[],promises=[],graceMinutes=5,now=Date.now(),backend=false}={}){
 const prefs=new Map(preferences.map(p=>[p.caseId,p])),due=new Map(reminders.map(r=>[r.caseId,r])),replies=new Map(followups.map(r=>[r.caseId,r])),updates=new Map(promises.map(p=>[p.caseId,p]));
 const counts={total:cases.length,verified:0,overdueAccess:0,verificationNeeded:0,followupsDue:0,customerWaiting:0,updatesDue:0,paymentHolds:0,sourceIssues:0,workflowIssues:0,workflowRunning:0,notChecked:0};
 let connectedResult=null;
 const rows=cases.map(s=>{
  const d=diagnose(s,now),verified=currentOutcome(s),preference=prefs.get(s.id)||{priority:'normal',revision:0,updatedAt:null},reminder=due.get(s.id),reply=replies.get(s.id),promise=updates.get(s.id);
  if(backend&&verified){const report=buildRunReport(s,{backend:true});if(report.connectedSandboxProof&&(!connectedResult||Date.parse(s.proof.at)>Date.parse(connectedResult.verifiedAt)))connectedResult={caseId:s.id,customerName:s.customerName,verifiedAt:s.proof.at,checksPassed:report.passed,checksTotal:report.total};}
  const dueNow=!!reminder&&Date.parse(reminder.dueAt)<=now,unavailable=s.evidenceAvailable===false||hasUnavailable(s),verification=!!(s.writes||s.proof?.passed)&&!verified,overdue=deliveryCheck(s,{now,graceMinutes}).status==='attention',workflowIssue=!!s.job?.error&&!verified;
  const updateSoon=!!promise&&Date.parse(promise.dueAt)<=now+24*3600000,updateOverdue=!!promise&&Date.parse(promise.dueAt)<=now;
  if(verified)counts.verified++;if(overdue)counts.overdueAccess++;if(verification)counts.verificationNeeded++;if(dueNow)counts.followupsDue++;if(reply)counts.customerWaiting++;if(updateSoon)counts.updatesDue++;if(s.paymentHold)counts.paymentHolds++;if(unavailable)counts.sourceIssues++;if(workflowIssue)counts.workflowIssues++;if(s.job?.pending)counts.workflowRunning++;if(!s.sources)counts.notChecked++;
  const reasons=[];let score=0;
  if(dueNow){reasons.push('Follow-up is due');score+=100;}
  if(updateSoon){reasons.push(updateOverdue?'Customer update overdue':'Customer update due within 24 hours');score+=updateOverdue?105:75;}
  if(s.paymentHold){reasons.push('Payment change needs merchant review');score+=95;}
  if(reply){reasons.push(reply.kind==='help'?'Customer still needs help':'Customer replied');score+=reply.kind==='help'?90:70;}
  if(verification){reasons.push('Verify access without another grant');score+=80;}
  if(workflowIssue){reasons.push('Workflow needs attention');score+=60;}
  if(unavailable){reasons.push('Source check unavailable');score+=50;}
  if(s.phase==='rehearsed'){reasons.push('Preview awaits your approval');score+=40;}
  if(overdue){reasons.push('Purchased access is overdue');score+=30;}
  if(preference.priority==='high'&&(!verified||reply||dueNow)){reasons.push('Marked high priority');score+=25;}
  if(preference.priority==='low')score-=10;
  if(!reasons.length&&!verified&&!s.job?.pending){reasons.push(nextStep(s)[1]);score+=5;}
  const actionable=reasons.length>0;
  return {caseId:s.id,customerName:s.customerName,diagnosis:d.title,nextStep:d.next,priority:preference.priority,preference,verified,phase:s.phase,paymentStatus:s.capture?.status||'NOT_CAPTURED',amount:s.order.amount,currency:s.order.currency,followupAt:reminder?.dueAt||null,updatePromiseAt:promise?.dueAt||null,dueNow,workflowPending:!!s.job?.pending,workflowError:workflowIssue?s.job.error:null,sourceStatus:unavailable?'unavailable':s.sources?'checked':'not-checked',reasons,score,actionable};
 });
 rows.sort((a,b)=>Number(b.actionable)-Number(a.actionable)||b.score-a.score||(a.followupAt||'9999').localeCompare(b.followupAt||'9999')||a.caseId.localeCompare(b.caseId));
 return {checkedAt:new Date(now).toISOString(),counts,rows,connectedResult,urgent:rows.filter(r=>r.actionable).slice(0,5)};
}

function csvCell(value){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function workspaceCsv(overview){
 const columns=['Case','Customer','Priority','Diagnosis','Phase','Payment status','Amount (minor units)','Currency','Verified current outcome','Follow-up (UTC)','Customer update promised (UTC)','Source status','Workflow error'];
 const rows=overview.rows.map(r=>[r.caseId,r.customerName,r.priority,r.diagnosis,r.phase,r.paymentStatus,r.amount,r.currency,r.verified?'yes':'no',r.followupAt,r.updatePromiseAt,r.sourceStatus,r.workflowError]);
 return '\ufeff'+[columns,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}

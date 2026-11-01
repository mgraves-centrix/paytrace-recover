import {checks,reviewIsCurrent} from './core.mjs';
import {proofIsCurrent} from './operations.mjs';

const paid=s=>s.capture?.source==='paypal-sandbox'&&s.capture.status==='COMPLETED'&&!s.paymentHold;
const missing=s=>paid(s)&&!s.entitlement?.active&&!proofIsCurrent(s);

// A cluster is a warning about a possible shared incident, never a diagnosis.
export function detectIncident(cases,now=Date.now()){
 const candidates=cases.filter(s=>missing(s)&&Number.isFinite(Date.parse(s.paidAt))&&now-Date.parse(s.paidAt)>=0&&now-Date.parse(s.paidAt)<=24*3600000).sort((a,b)=>Date.parse(a.paidAt)-Date.parse(b.paidAt));
 let best=[];
 for(let i=0;i<candidates.length;i++){
  const start=candidates[i],window=candidates.filter(s=>s.order.courseId===start.order.courseId&&Date.parse(s.paidAt)>=Date.parse(start.paidAt)&&Date.parse(s.paidAt)-Date.parse(start.paidAt)<=30*60000);
  if(window.length>best.length)best=window;
 }
 if(best.length<3)return {active:false,count:0,courseId:null,caseIds:[],autopilotPaused:false,reason:'No three-case sandbox cluster in a 30-minute payment window.'};
 return {active:true,count:best.length,courseId:best[0].order.courseId,caseIds:best.map(s=>s.id),from:best[0].paidAt,to:best.at(-1).paidAt,autopilotPaused:true,reason:'Multiple completed sandbox payments lack access for the same course. Investigate a possible shared incident before automatic grants.'};
}

export function rehearseAutopilot(cases,policy){
 const result={wouldRecover:[],needsReview:[],held:[],alreadyAccess:[],excluded:[],definition:'Read-only policy rehearsal on saved cases. No provider reads, AI calls, reservations, approvals, or access writes occur. A future run must recheck every source.'};
 for(const s of cases){
  if(s.capture?.source!=='paypal-sandbox'||s.intakeMode!=='sandbox'){result.excluded.push({caseId:s.id,reason:'Sample or unsupported purchase.'});continue;}
  if(s.entitlement?.active||proofIsCurrent(s)){result.alreadyAccess.push({caseId:s.id,reason:'Access is present or already verified.'});continue;}
  if(!paid(s)||s.order.courseId!==policy.courseId||s.order.amount>policy.maxAmountCents||s.order.currency!=='USD'||s.order.userId!==s.currentAccountId||!checks(s).every(x=>x.ok)||s.evidenceAvailable===false){result.held.push({caseId:s.id,reason:'Payment, identity, access term, or policy limit does not match.'});continue;}
  if(s.review?.mode==='model'&&s.analysis?.mode==='model'&&reviewIsCurrent(s)&&s.review.outcome==='ready'&&s.review.objections.every(o=>o.status==='resolved')&&s.phase==='investigated'&&s.writes===0){result.wouldRecover.push({caseId:s.id,reason:'Current saved evidence and model review fit this policy; fresh checks would still be required.'});continue;}
  result.needsReview.push({caseId:s.id,reason:'Needs a current model-backed review before policy eligibility can be known.'});
 }
 const byId=new Map(cases.map(s=>[s.id,s]));
 result.wouldRecover.sort((a,b)=>Date.parse(byId.get(a.caseId)?.paidAt||0)-Date.parse(byId.get(b.caseId)?.paidAt||0));
 for(const overflow of result.wouldRecover.splice(policy.dailyLimit))result.held.push({...overflow,reason:'Beyond the proposed daily recovery limit.'});
 return {...result,counts:Object.fromEntries(['wouldRecover','needsReview','held','alreadyAccess','excluded'].map(key=>[key,result[key].length]))};
}

export function disputePacket(s,customer){
 const merchantEvents=(s.events||[]).map(e=>({at:e.at,description:e.what}));
 const communication=(customer?.messages||[]).map(m=>({at:m.at,role:m.role,kind:m.kind||'message'}));
 return {version:1,caseId:s.id,generatedAt:new Date().toISOString(),purpose:'Merchant review packet; not a PayPal dispute submission.',source:s.capture?.source==='paypal-sandbox'?'paypal-sandbox':'sample',payment:{status:s.capture?.status||'not-captured',recordAvailable:s.evidenceAvailable!==false,orderReference:s.order?.id||null,captureReference:s.capture?.id||null,amountMinor:s.order?.amount||null,currency:s.order?.currency||null},purchaseChecks:checks(s).map(c=>({id:c.id,label:c.label,passed:s.evidenceAvailable!==false&&!!c.ok})),repair:{accessWrites:s.writes||0,approvedAt:s.approval?.at||null,approvalMode:s.approval?.mode||null,planId:s.approval?.planId||null},verification:{current:proofIsCurrent(s),checkedAt:s.proof?.at||null,passed:!!s.proof?.passed,checks:(s.proof?.checks||[]).map(c=>({label:c.label,passed:!!c.ok}))},customer:{confirmedAt:customer?.confirmedAt||null,needsMoreHelp:!!customer?.help,contactEvents:communication},caseEvents:merchantEvents,limitations:['This packet is a saved case snapshot, not a fresh provider read.','A payment event alone does not prove access or a shared root cause.','Customer message content and contact details are intentionally omitted.','A merchant must review this packet before using it in any dispute process.']};
}

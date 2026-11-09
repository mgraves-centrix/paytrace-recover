import {proofIsCurrent,diagnose} from './operations.mjs';
export function queueFor(s){if(proofIsCurrent(s))return 'resolved';if(s.job?.pending||s.phase==='reviewing')return 'investigating';return 'attention';}
export const isSandboxCase=s=>s?.intakeMode==='sandbox'||s?.capture?.source==='paypal-sandbox';
export const merchantCases=cases=>cases.filter(isSandboxCase);
export const historicalProofAt=s=>s?.lastPassingVerification?.at||s?.firstVerifiedAt||(s?.proof?.passed?s.proof.at:null);
export function caseProgress(s,{current=proofIsCurrent(s)}={}){
 const stage=current||s.writes||['approved','verifying','unverified','verify-only','verified'].includes(s.phase)?3:s.phase==='rehearsed'?2:s.phase==='investigated'?1:0;
 return {stage,complete:current,previouslyVerified:!current&&!!historicalProofAt(s)};
}
export function caseOrigin(s,{backend=false}={}){
 if(backend&&s.capture?.source==='paypal-sandbox'&&s.capture.status==='COMPLETED')return {kind:'connected',label:'Sandbox payment captured',detail:'Checkout complete · recovery and lesson proof tracked separately · no live charge'};
 if(backend&&s.intakeMode==='sandbox')return {kind:'pending',label:'Sandbox checkout pending',detail:'No completed PayPal capture recorded yet'};
 return {kind:'sample',label:'Fictional sample case',detail:'Scripted records · no provider payment'};
}
export function nextStep(s){if(!s.capture&&s.intakeMode==='sandbox')return ['checkout','Open sandbox checkout'];if(s.phase==='verified'&&!proofIsCurrent(s))return ['verify','Recheck changed evidence'];if(s.job?.pending)return ['refresh','Refresh workflow status'];return ({paid:['investigate','Review purchase evidence'],unpaid:['pay','Create sample payment'],reviewing:['investigate','Retry investigation'],'review-failed':['investigate','Retry agent review'],investigated:['rehearse','Preview correction'],rehearsed:['approve','Approve this access grant'],approved:['repair','Apply & verify access'],unverified:['verify','Retry verification only'],verifying:['verify','Check verification'], 'verify-only':['verify','Verify existing access'],stale:['investigate','Review changed evidence'],'needs-evidence':['investigate','Check evidence again'],blocked:['investigate','Recheck evidence'],verified:['receipt','Download recovery receipt']})[s.phase]||['investigate','Review evidence'];}
export function caseLabel(s){if(s.paymentHold)return 'Payment changed · review needed';if(proofIsCurrent(s))return s.automation?.status==='verified-existing'?'Access verified · no repair needed':'Recovery verified · lesson opened';if(historicalProofAt(s))return 'Previously verified · recheck due';if(s.phase==='review-failed')return 'Agent review interrupted';if(s.phase==='approved')return 'Approved · ready to apply';if(s.phase==='rehearsed')return 'Preview ready for approval';if(['unverified','verifying'].includes(s.phase))return s.writes?'Access updated · verification needed':'Access found · verification needed';if(s.phase==='investigated')return 'Ready to preview';if(s.capture?.source==='paypal-sandbox'&&s.capture.status==='COMPLETED')return 'Checkout complete · recovery open';return diagnose(s).title;}

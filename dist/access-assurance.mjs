import {diagnose,validateGrace} from './diagnosis.mjs';
import {proofIsCurrent} from './operations.mjs';

// A delivery target is a merchant-facing monitor, never a payment guarantee or grant authorization.
export function accessPromise(s,{graceMinutes=5,now=Date.now(),browserProofAt=null,customerConfirmedAt=null}={}){
 validateGrace(graceMinutes);
 const sample=s.capture?.source==='sample'||(s.intakeMode!=='sandbox'&&s.capture?.source!=='paypal-sandbox');
 const paidAt=Date.parse(s.paidAt||s.capture?.createdAt||'');
 const deadlineAt=!sample&&Number.isFinite(paidAt)?new Date(paidAt+graceMinutes*60000).toISOString():null;
 const diagnosis=diagnose(s,now);
 let state='payment-review';
 if(sample)state='sample';
 else if(s.paymentHold)state='payment-hold';
 else if(!s.capture||s.capture.status!=='COMPLETED')state='payment-review';
 else if(['purchase_mismatch','wrong_account','entitlement_conflict','expired_access','missing_evidence'].includes(diagnosis.code))state='identity-review';
 else if(proofIsCurrent(s))state=customerConfirmedAt?'customer-confirmed':browserProofAt?'buyer-browser-reached':'technical-proof';
 else if(diagnosis.code==='access_present')state='verification-needed';
 else if(diagnosis.code==='missing_enrollment')state=deadlineAt&&now>=Date.parse(deadlineAt)?'overdue':'within-window';
 return {state,deadlineAt,graceMinutes,source:sample?'sample':'paypal-sandbox',technicalProofAt:proofIsCurrent(s)?s.proof.at:null,browserProofAt:proofIsCurrent(s)?browserProofAt:null,customerConfirmedAt:proofIsCurrent(s)?customerConfirmedAt:null,automatedGrantAuthorized:false,
  explanation:{sample:'Sample purchase. No PayPal delivery target is claimed.','payment-hold':'Payment change under review. Access is paused.','payment-review':'A completed matching PayPal capture has not been established.','identity-review':'Purchase or account evidence needs merchant review. No access change is supported.','within-window':'Paid access is still missing inside the merchant’s delivery window.','overdue':'Paid access is missing beyond the merchant’s delivery window.','verification-needed':'Access is present, but a current protected-lesson proof is still needed.','technical-proof':'The service check passed. The customer has not yet proved the lesson reached their browser.','buyer-browser-reached':'Protected lesson content reached the customer’s private browser session. Customer confirmation is separate.','customer-confirmed':'The technical check passed and the customer separately confirmed access.'}[state]};
}

// Competing explanations use only fixed, pseudonymous read-only probe outcomes.
export function incidentDetective(incident,results){
 if(!incident?.active)return {active:false,mode:'read-only',hypotheses:[],results:[]};
 const states=results.map(r=>r.state),count=states.length;
 const hypothesis=(id,agent,title,status,evidence,next)=>({id,agent,title,status,evidence,next});
 return {active:true,mode:'read-only',checkedAt:new Date().toISOString(),results:results.map(({caseId,state})=>({caseId,state})),hypotheses:[
  hypothesis('course-delivery','Relay','Shared course delivery failure',states.filter(x=>x==='missing-access'||x==='checking').length>=2?'supported-signal':count&&states.every(x=>x==='access-available')?'contradicted':'untested',`${states.filter(x=>x==='missing-access'||x==='checking').length} of ${count} fresh checks still cannot confirm the purchased lesson.`,'Inspect course connector and fulfillment logs; timing alone does not prove an outage.'),
  hypothesis('payment-identity','Ledger','Payment or purchase mismatch',states.includes('payment-review')?'supported-signal':count&&states.every(x=>['missing-access','access-available','checking'].includes(x))?'contradicted':'untested',`${states.filter(x=>x==='payment-review').length} of ${count} fresh checks need payment review.`,'Inspect the exact capture, order, learner, course, amount, and currency for each case.'),
  hypothesis('buyer-last-mile','Prism','Buyer browser still blocked', 'untested','Server-side source checks cannot establish what the customer browser received.','Ask affected buyers to run their private browser access check.'),
  hypothesis('safe-repair','Patch','Narrow repair eligibility','untested','A cluster never authorizes a batch grant.','Review each case separately with current evidence, exact preview, and merchant authorization.')
 ]};
}

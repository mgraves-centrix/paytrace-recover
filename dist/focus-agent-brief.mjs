import {checks,reviewIsCurrent} from './core.mjs';

const nextForCheck={
 payment:'Refresh the completed capture before considering a correction.',
 order:'Compare the capture order reference with this exact saved order.',
 learner:'Confirm that the capture belongs to the purchased learner account.',
 course:'Confirm that the capture names the purchased course.',
 amount:'Recheck the captured amount and currency against the saved order.',
 policy:'Inspect the current learner account and access term.'
};

// This is a rules-based reading of saved evidence, not a model probability or diagnosis.
export function agentDecisionBrief(s,{uncertain=false}={}){
 if(!s.review)return null;
 const review=s.review;
 if(uncertain||(!reviewIsCurrent(s)&&s.writes===0))return {
  state:'stale',title:'The decision needs fresh evidence.',
  support:'The prior specialist review describes an older case snapshot.',
  challenge:'Payment, account, or access records may have changed since that review.',
  next:'Refresh the case and run a new investigation before previewing a change.'
 };
 if(s.writes>0)return {
  state:'historical',title:'The decision is recorded. Prove the outcome.',
  support:'The saved review and exact approval preceded one access write.',
  challenge:'A successful write does not establish that the purchased lesson opens now.',
  next:'Use fresh payment, entitlement, and protected-lesson checks. Keep buyer confirmation separate.'
 };
 if(s.evidenceAvailable===false||!review.snapshot?.payment)return {
  state:'hold',title:'Payment evidence is missing.',
  support:'The saved order identifies the expected learner, course, and price.',
  challenge:'There is no readable completed capture to match to that order.',
  next:'Refresh the payment record, then rerun the specialist review. Make no access grant.'
 };
 const failed=checks(s).find(check=>!check.ok);
 if(failed)return {
  state:'hold',title:'A required purchase check conflicts.',
  support:'The available records identify the specific purchase under review.',
  challenge:`${failed.label}: ${failed.detail}`,
  next:nextForCheck[failed.id]||'Resolve the conflicting source record and investigate again.'
 };
 const objection=review.objections?.find(item=>item.status==='open');
 if(objection)return {
  state:'hold',title:'A specialist challenge remains open.',
  support:'The required purchase checks pass on the saved snapshot.',
  challenge:objection.question,
  next:`Inspect ${objection.sources?.join(' and ')||'the cited'} records, answer the challenge, and rerun the review before any correction.`
 };
 if(review.outcome==='verify-only')return {
  state:'verify',title:'Access is already present.',
  support:'The current entitlement belongs to this learner and purchase.',
  challenge:'A duplicate grant would not help, and recorded access is not lesson proof.',
  next:'Make no access change. Check the protected lesson and ask the buyer to confirm separately.'
 };
 if(review.outcome==='ready')return {
  state:'ready',title:'One narrow correction can be previewed.',
  support:'The completed capture matches the saved order, learner, course, amount, and currency; current access is missing.',
  challenge:'A changed payment match or an existing entitlement would invalidate this decision.',
  next:'Preview one grant for this learner and course. Merchant approval and fresh outcome checks still follow.'
 };
 return {
  state:'hold',title:'The review does not support a grant.',
  support:'The specialists saved their findings and source references.',
  challenge:'The current review did not reach a supported correction.',
  next:'Inspect the source records and unresolved objections before rerunning the review.'
 };
}

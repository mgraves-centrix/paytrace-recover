import {proofIsCurrent} from './operations.mjs';

// A merchant-editable draft from saved case facts. It is never sent automatically.
export function customerProgressDraft(s,support,{uncertain=false}={}){
 const verified=!uncertain&&support?.verified===true&&proofIsCurrent(s);
 const basis=[];
 let text;
 if(verified){
  basis.push('current protected-lesson check','matching purchase and access');
  text='We checked your purchase and confirmed that the first lesson opens for the account linked to it. Please try opening your course. If it still does not work on your device, reply here and we will keep helping.';
 }else if(uncertain||s?.sources?.payment?.status==='unavailable'||s?.sources?.access?.status==='unavailable'){
  basis.push('latest provider status not confirmed');
  text='We are checking the latest payment and course-access records for your purchase. We have not confirmed that access is restored. We will update you when the checks finish. You do not need to place another order while we investigate.';
 }else if(s?.paymentHold){
  basis.push('payment change requires review');
  text='A change to the payment record needs a closer review. We have paused the access decision and will update you when the purchase details are confirmed. We have not confirmed that access is restored.';
 }else if(s?.capture?.status!=='COMPLETED'){
  basis.push('completed payment not confirmed');
  text='We are checking the payment status for your purchase. We cannot confirm course access until the payment record is complete. Please contact us here if you have questions about the order.';
 }else if(s?.writes>0){
  basis.push('access update recorded','lesson verification pending');
  text='We made an access update for your purchase. We are checking that the course and first lesson actually open before calling this resolved. We will update you when verification finishes.';
 }else if(s?.job?.pending){
  basis.push('investigation in progress','no access change confirmed');
  text='Our team is reviewing your completed purchase and missing course access. No access change has been confirmed yet. We will share the next step after the review.';
 }else{
  basis.push('completed payment recorded','access not yet verified');
  text='We can see a completed payment for your purchase, but course access has not yet been verified. We are reviewing the purchase and will update you with the next step. Please do not pay again while we investigate.';
 }
 return {text,basis,verified,method:'Case-fact draft · merchant review required'};
}

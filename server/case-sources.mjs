import {fingerprint} from '../dist/core.mjs';
// Reads are independent: an outage must not masquerade as an inactive entitlement.
export async function readCaseSources(s,owner,{paypal,access,accessSystem='Course access service'}){
 const before=fingerprint(s),previous=s.sources||{},at=new Date().toISOString();
 const results=await Promise.allSettled([
  Promise.resolve().then(async()=>{if(s.capture?.source==='paypal-sandbox')return paypal.refresh(s);if(!s.capture&&s.paypalOrderId&&typeof paypal.inspect==='function'){const recovered=await paypal.inspect(s);if(recovered&&(recovered.orderId!==s.order.id||recovered.userId!==s.order.userId||recovered.courseId!==s.order.courseId||recovered.amount!==s.order.amount||recovered.currency!==s.order.currency))throw Error('PayPal capture does not match the saved purchase.');return recovered;}if(s.scenario==='missing'&&s.evidenceAvailable===false)throw Error('Missing sample record');return s.capture;}),
  Promise.resolve().then(()=>access(owner,s)).then(value=>{if(!value||typeof value.active!=='boolean'||typeof value.userId!=='string'||typeof value.courseId!=='string')throw Error('Invalid access response');return value;})
 ]);
 const names=['payment','access'];s.sources={};
 results.forEach((result,i)=>{const key=names[i],ok=result.status==='fulfilled';s.sources[key]={status:ok?'available':'unavailable',checkedAt:at,lastSuccessAt:ok?at:previous[key]?.lastSuccessAt||null,system:i===0?(s.capture?.source==='paypal-sandbox'||s.paypalOrderId?'PayPal sandbox':'Sample payment records'):accessSystem,detail:ok?(i===0&&!result.value?'No completed capture found for this order.':'Current record retrieved.'):'Unable to retrieve a current record. Last known values are retained.'};
  if(ok){if(i===0){if(!s.capture&&result.value?.source==='paypal-sandbox'&&result.value.status==='COMPLETED'){s.paidAt=at;s.phase='paid';s.revision++;}s.capture=result.value;s.evidenceAvailable=!!result.value;}else{s.entitlement=result.value;}}else if(i===0)s.evidenceAvailable=false;
 });
 const available=results.every(r=>r.status==='fulfilled');
 if((before!==fingerprint(s)||!available)&&(s.review||s.proof||s.approval)){s.review=null;s.rehearsal=null;s.approval=null;s.proof=null;s.phase=s.writes?'unverified':available?'stale':'needs-evidence';}
 if(!available)s.phase=s.writes?'unverified':'needs-evidence';
 return available;
}

// A browser-only license example. Connected course recovery remains the sole
// grant path until a license provider can supply current entitlement proof.
export function licenseSample(){
 return {kind:'software-license',phase:'paid',writes:0,order:{id:'SO-1042',buyer:'Morgan Lee',account:'morgan@example.test',sku:'STUDIO-PRO-YEARLY',product:'Studio Pro · annual license',amount:7900,currency:'USD'},payment:{status:'COMPLETED',orderId:'SO-1042',account:'morgan@example.test',sku:'STUDIO-PRO-YEARLY',amount:7900,currency:'USD',source:'fictional sample'},delivery:{event:'Fulfillment request recorded',assignment:'missing',activation:'not checked'},review:null,preview:null,approval:null,proof:null,events:['Sample payment recorded; license assignment missing.']};
}

export function licenseChecks(s){
 const p=s.payment,o=s.order;
 return [
  {label:'Completed payment',ok:p?.status==='COMPLETED'},
  {label:'Exact order',ok:p?.orderId===o.id},
  {label:'Buyer account',ok:p?.account===o.account},
  {label:'Purchased license',ok:p?.sku===o.sku},
  {label:'Amount and currency',ok:p?.amount===o.amount&&p?.currency===o.currency},
  {label:s.writes===0?'No existing assignment':'One matching assignment',ok:s.writes===0?s.delivery.assignment==='missing':s.writes===1&&s.delivery.assignment==='active'}
 ];
}

export function licenseAgents(s){
 const checks=licenseChecks(s),matched=checks.slice(0,5).every(item=>item.ok),missing=s.delivery.assignment==='missing';
 return [
  {name:'Ledger',role:'Payment analyst',confidence:matched?'Strong':'Needs review',finding:matched?'The fictional capture matches the order, buyer account, license SKU, amount, and currency.':'The payment does not match every saved purchase field.',sources:['Payment record','Saved order'],limit:'A payment record cannot prove delivery.'},
  {name:'Relay',role:'Delivery investigator',confidence:missing?'Moderate':'Needs review',finding:missing?'A fulfillment request is recorded, but the saved license assignment is missing.':'The assignment state needs a fresh read before any correction.',sources:['Fulfillment event','License assignment'],limit:'This trail does not establish the underlying failure.'},
  {name:'Patch',role:'Repair planner',confidence:matched&&missing?'Moderate':'On hold',finding:matched&&missing?'Preview one assignment of the purchased SKU to the same buyer account.':'Do not propose an assignment while evidence disagrees.',sources:['Saved order','License assignment'],limit:'A preview does not prove a provider write will succeed.'},
  {name:'Prism',role:'Independent reviewer',confidence:matched&&missing?'Strong':'On hold',finding:matched&&missing?'Require approval of that exact assignment, then check the license service and activation separately.':'Hold the case until the mismatch or existing assignment is resolved.',sources:['Payment record','License assignment'],limit:'A write is not proof that the buyer can activate the product.'}
 ];
}

export function advanceLicenseSample(input){
 const s=structuredClone(input),matched=licenseChecks(s).every(item=>item.ok);
 if(s.phase==='paid'){
  s.review={mode:'scripted',outcome:matched?'ready':'hold',agents:licenseAgents(s)};
  s.phase=matched?'reviewed':'held';s.events.push(matched?'Four scripted specialists reviewed the saved records.':'Review held: purchase evidence does not support an assignment.');return s;
 }
 if(s.phase==='held')throw Error('The evidence hold cannot be bypassed. Reset this sample.');
 if(!matched&&s.writes===0)throw Error('Purchase evidence changed. No license assignment was made.');
 if(s.phase==='reviewed'){
  s.preview={account:s.order.account,sku:s.order.sku,before:'No assignment',after:'One active annual license'};s.phase='previewed';s.events.push('Exact license assignment previewed; no change made.');return s;
 }
 if(s.phase==='previewed'){
  if(!s.preview||s.preview.account!==s.order.account||s.preview.sku!==s.order.sku)throw Error('The exact preview changed.');
  s.approval={scope:'one sample assignment',orderId:s.order.id,account:s.order.account,sku:s.order.sku};s.phase='approved';s.events.push('Merchant approved the fictional preview.');return s;
 }
 if(s.phase==='approved'){
  if(!s.approval||s.approval.orderId!==s.order.id||s.approval.account!==s.order.account||s.approval.sku!==s.order.sku||s.writes!==0||s.delivery.assignment!=='missing')throw Error('Approval no longer matches the exact purchase.');
  s.delivery.assignment='active';s.writes=1;s.phase='applied';s.events.push('One fictional license assignment recorded; activation still unverified.');return s;
 }
 if(s.phase==='applied'){
  s.delivery.activation=s.delivery.assignment==='active'?'accessible':'not accessible';
  s.proof={payment:licenseChecks(s).slice(0,5).every(item=>item.ok),assignment:s.delivery.assignment==='active',activation:s.delivery.activation==='accessible'};
  s.phase=Object.values(s.proof).every(Boolean)?'verified':'unverified';s.events.push(s.phase==='verified'?'Sample checks agree: payment, assignment, and activation.':'Activation could not be verified; case remains open.');return s;
 }
 return s;
}

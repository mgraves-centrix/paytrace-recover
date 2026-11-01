const BASE='https://api-m.sandbox.paypal.com';

// Reporting is a backfill aid. Its rows are candidates, not proof that a
// particular learner bought a particular course.
export async function discoverPurchases(cases,env=process.env,fetcher=fetch,now=Date.now()){
 if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET)return {state:'not-configured',items:[],detail:'Connect the PayPal sandbox app first.'};
 const basic=Buffer.from(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET).toString('base64');
 let token;
 try{
  const oauth=await fetcher(BASE+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+basic,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
  if(!oauth.ok)return {state:'unavailable',items:[],detail:'PayPal sandbox authentication was not accepted.'};
  token=(await oauth.json()).access_token;
  if(!token)return {state:'unavailable',items:[],detail:'PayPal sandbox did not return an access token.'};
  const query=new URLSearchParams({start_date:new Date(now-24*3600000).toISOString(),end_date:new Date(now).toISOString(),fields:'transaction_info',page_size:'100',page:'1'});
  const response=await fetcher(BASE+'/v1/reporting/transactions?'+query,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(response.status===403)return {state:'permission-needed',items:[],detail:'Transaction Search is not available to this sandbox app. Enable reporting access in PayPal Developer before scanning.'};
  if(!response.ok)return {state:'unavailable',items:[],detail:'PayPal transaction reporting is unavailable. No case was changed.'};
  const payload=await response.json();
  const known=new Map(cases.filter(s=>s.capture?.id).map(s=>[s.capture.id,s.id]));
  const items=(Array.isArray(payload.transaction_details)?payload.transaction_details:[]).slice(0,100).map(row=>row.transaction_info||{}).filter(info=>typeof info.transaction_id==='string'&&info.transaction_id.length<=128).map(info=>({transactionId:info.transaction_id,reportedStatus:info.transaction_status||'unknown',amount:info.transaction_amount?.value||null,currency:info.transaction_amount?.currency_code||null,at:info.transaction_initiation_date||null,caseId:known.get(info.transaction_id)||null,matchState:known.has(info.transaction_id)?'linked':'merchant-match-needed'}));
  return {state:'connected',items,checkedAt:new Date(now).toISOString(),truncated:payload.total_pages>1,detail:'Read-only 24-hour PayPal reporting scan. Results may arrive hours after payment. Unlinked rows require merchant identification of the learner and course; no case, grant, or approval is created.'};
 }catch{return {state:'unavailable',items:[],detail:'PayPal transaction reporting could not be reached. No case was changed.'};}
}

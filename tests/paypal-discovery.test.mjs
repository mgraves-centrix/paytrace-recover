import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverPurchases} from '../server/paypal-discovery.mjs';
import {openStore} from '../server/store.mjs';
import {createApp} from '../server/index.mjs';

const env={PAYPAL_CLIENT_ID:'sandbox-id',PAYPAL_CLIENT_SECRET:'sandbox-secret'};
test('reporting scan links known capture IDs and omits payer information',async()=>{
 let requested='';const fetcher=async(url)=>{
  if(url.includes('oauth2'))return Response.json({access_token:'test-token'});
  requested=url;return Response.json({total_pages:1,transaction_details:[
   {transaction_info:{transaction_id:'CAP-KNOWN',transaction_status:'S',transaction_amount:{value:'128.00',currency_code:'USD'},transaction_initiation_date:'2026-11-01T10:00:00Z'},payer_info:{email_address:'private@example.com'}},
   {transaction_info:{transaction_id:'CAP-UNKNOWN',transaction_status:'S',transaction_amount:{value:'128.00',currency_code:'USD'}}}
  ]});
 };
 const result=await discoverPurchases([{id:'CL-KNOWN',capture:{id:'CAP-KNOWN'}}],env,fetcher,Date.parse('2026-11-01T12:00:00Z'));
 assert.equal(result.state,'connected');assert.equal(result.items[0].caseId,'CL-KNOWN');assert.equal(result.items[1].matchState,'merchant-match-needed');
 assert.match(requested,/\/v1\/reporting\/transactions\?/);assert.doesNotMatch(JSON.stringify(result),/private@example.com/);
});

test('reporting permission failure is explicit and creates no candidate',async()=>{
 const result=await discoverPurchases([],env,async url=>url.includes('oauth2')?Response.json({access_token:'test-token'}):new Response('',{status:403}));
 assert.equal(result.state,'permission-needed');assert.deepEqual(result.items,[]);
});

test('shared-account reporting route exposes no foreign transactions or provider request',async t=>{
 const db=openStore(':memory:');let providerCalls=0;
 const {server}=createApp({PUBLIC_URL:'http://localhost',DEMO_OPERATOR_KEY:'test-key',PAYPAL_CLIENT_ID:'shared',PAYPAL_CLIENT_SECRET:'shared-secret'},db,{fetcher:async()=>{providerCalls++;throw Error('Provider should not be queried');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(()=>{db.close();resolve();})));
 const base='http://127.0.0.1:'+server.address().port,first=await fetch(base+'/api/state'),cookie=first.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(base+'/api/operator',{method:'POST',headers:{Cookie:cookie,Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify({key:'test-key'})})).status,200);
 const response=await fetch(base+'/api/intelligence/discover',{headers:{Cookie:cookie}}),result=await response.json();
 assert.equal(response.status,200);assert.equal(result.state,'disabled');assert.deepEqual(result.items,[]);assert.equal(providerCalls,0);
});

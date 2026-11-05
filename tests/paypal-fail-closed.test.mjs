import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase} from '../dist/core.mjs';
import {normalize,paypalClient} from '../server/paypal.mjs';

const env={PAYPAL_CLIENT_ID:'sandbox-client',PAYPAL_CLIENT_SECRET:'sandbox-secret',PAYPAL_WEBHOOK_ID:'webhook-id'};
const state=()=>{const s=createCase();s.paypalOrderId='ORDER-123';return s;};
const order=s=>({id:s.paypalOrderId,status:'COMPLETED',purchase_units:[{custom_id:s.id,payments:{captures:[{id:'CAPTURE-123',status:'COMPLETED',amount:{value:'128.00',currency_code:'USD'}}]}}]});

test('PayPal refuses absent credentials, failed OAuth, and a missing access token',async()=>{
 const s=state();await assert.rejects(paypalClient({},async()=>{throw Error('must not call')}).create(s),/credentials/);
 await assert.rejects(paypalClient(env,async()=>new Response('',{status:401})).create(s),/authentication failed/);
 await assert.rejects(paypalClient(env,async()=>Response.json({expires_in:3600})).create(s),/access token/);
});

test('PayPal refuses a provider error, missing order ID, and capture before order creation',async()=>{
 const s=state();await assert.rejects(paypalClient(env,async url=>url.endsWith('/token')?Response.json({access_token:'test',expires_in:3600}):new Response('',{status:503})).create(s),/request failed \(503\)/);
 await assert.rejects(paypalClient(env,async url=>url.endsWith('/token')?Response.json({access_token:'test',expires_in:3600}):Response.json({})).create(s),/order ID/);
 const noOrder=createCase();await assert.rejects(paypalClient(env,async()=>{throw Error('must not call')}).capture(noOrder),/Create a sandbox order/);
});

test('PayPal rejects malformed or ambiguous capture evidence before it reaches a case',()=>{
 const s=state(),valid=order(s);
 for(const changed of [
  {...valid,id:'OTHER-ORDER'},
  {...valid,purchase_units:[{...valid.purchase_units[0],payments:{captures:[]}}]},
  {...valid,purchase_units:[{...valid.purchase_units[0],payments:{captures:[{...valid.purchase_units[0].payments.captures[0],id:''}]}}]},
  {...valid,purchase_units:[{...valid.purchase_units[0],payments:{captures:[{...valid.purchase_units[0].payments.captures[0],amount:{value:'128',currency_code:'USD'}}]}}]}
 ])assert.throws(()=>normalize(s,changed));
});

test('PayPal fresh read refuses a capture ID that changes between order and capture endpoints',async()=>{
 const s=state(),client=paypalClient(env,async url=>url.endsWith('/token')?Response.json({access_token:'test',expires_in:3600}):url.includes('/payments/captures/')?Response.json({id:'OTHER-CAPTURE',status:'COMPLETED',amount:{value:'128.00',currency_code:'USD'}}):Response.json(order(s)));
 await assert.rejects(client.refresh(s),/Capture reference changed/);
});

test('uncertain checkout inspection uses only provider reads and requires a completed capture',async()=>{
 const s=state(),calls=[];let captured=false;
 const client=paypalClient(env,async(url,options)=>{calls.push([url,options.method]);if(url.endsWith('/token'))return Response.json({access_token:'test',expires_in:3600});if(url.includes('/payments/captures/'))return Response.json({id:'CAPTURE-123',status:'COMPLETED',amount:{value:'128.00',currency_code:'USD'}});const value=order(s);if(!captured)value.purchase_units[0].payments.captures=[];return Response.json(value);});
 assert.equal(await client.inspect(s),null);captured=true;assert.equal((await client.inspect(s)).id,'CAPTURE-123');
 assert.equal(calls.filter(([url,method])=>url.includes('/checkout/orders/')&&method==='POST').length,0);
});

test('PayPal webhook verification requires complete signature metadata and an explicit success result',async()=>{
 const s=state(),calls=[],client=paypalClient(env,async(url,options)=>{calls.push(url);return url.endsWith('/token')?Response.json({access_token:'test',expires_in:3600}):Response.json({verification_status:'FAILURE'});});
 await assert.rejects(client.verifyWebhook('{}',{}),/signature headers/);
 assert.equal(calls.length,0);
 const headers=Object.fromEntries(['paypal-transmission-id','paypal-transmission-time','paypal-cert-url','paypal-auth-algo','paypal-transmission-sig'].map(name=>[name,'test']));
 assert.equal(await client.verifyWebhook(JSON.stringify({id:s.id}),headers),false);
 assert.equal(calls.at(-1).endsWith('/verify-webhook-signature'),true);
 await assert.rejects(paypalClient({...env,PAYPAL_WEBHOOK_ID:''},async()=>{throw Error('must not call')}).verifyWebhook('{}',headers),/webhook ID/);
});

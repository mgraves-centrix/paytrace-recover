import {randomUUID} from 'node:crypto';
import {COURSE} from '../dist/core.mjs';
import {validatePurchaseIntent,trustedPurchaseDigest} from './trusted-intake.mjs';
import {sandboxScenario} from '../dist/sandbox-scenarios.mjs';

// A merchant-operated sandbox storefront. It uses the same validated intake
// service as /api/intake/purchase, without pretending to be an external store.
export function demoStore(store,paypal,service){
 function draft(owner,requestId){if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(requestId))throw Error('A stable checkout request ID is required.');return store.demoCheckout(owner,requestId);}
 function publicDraft(row){return {requestId:row.requestId,caseId:row.caseId,orderId:row.orderId||null,customerName:row.customerName,email:row.email,scenario:row.scenario||'missing-access',status:row.status};}
 async function start(owner,body){const {requestId,customerName,email,scenario='missing-access'}=body||{};draft(owner,requestId);
  if(!sandboxScenario(scenario))throw Error('Choose a supported sandbox scenario.');
  if(typeof customerName!=='string'||!customerName.trim()||customerName.length>80||/[\x00-\x1f<>]/.test(customerName))throw Error('Enter a customer display name.');
  if(typeof email!=='string'||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a test purchase email.');
  return store.lock(owner,async()=>{
   let row=store.demoCheckout(owner,requestId);const normalizedEmail=email.trim().toLowerCase(),name=customerName.trim();
   if(row&&(row.customerName!==name||row.email!==normalizedEmail||(row.scenario||'missing-access')!==scenario)){const error=Error('This checkout request belongs to different purchase details or scenario.');error.status=409;throw error;}
   if(!row){const suffix=randomUUID().replaceAll('-','').slice(0,16).toUpperCase();row={requestId,caseId:'CL-STORE-'+suffix,purchaseId:'store-'+suffix,learnerId:'learner-'+suffix,customerName:name,email:normalizedEmail,scenario,orderId:null,status:'started',createdAt:new Date().toISOString()};store.saveDemoCheckout(owner,requestId,row);}
   if(row.orderId&&!row.paypalCustomId)throw Error('This checkout predates purchase binding. Start a new checkout.');
   if(!row.paypalCustomId){const fields=validatePurchaseIntent({caseId:row.caseId,purchaseId:row.purchaseId,learnerId:row.learnerId,customerName:row.customerName,email:row.email,courseId:COURSE.id,amount:COURSE.price,currency:COURSE.currency});const intent=store.savePurchaseIntent(owner,fields,trustedPurchaseDigest(fields));row={...row,paypalCustomId:intent.paypalCustomId};store.saveDemoCheckout(owner,requestId,row);}
   if(!row.orderId){const orderId=await paypal.create({id:row.caseId,paypalCustomId:row.paypalCustomId});row={...row,orderId,status:'awaiting-buyer'};store.saveDemoCheckout(owner,requestId,row);}
   return publicDraft(row);
  });
 }
 async function complete(owner,body){const {requestId,orderId}=body||{};const row=draft(owner,requestId);if(!row||!row.orderId||orderId!==row.orderId){const error=Error('Checkout order does not match this store purchase.');error.status=409;throw error;}
  if(row.status==='case-created')return {...publicDraft(row),intake:'duplicate'};
  const payment={id:row.caseId,paypalOrderId:row.orderId,paypalCustomId:row.paypalCustomId,order:{id:row.caseId,userId:row.learnerId,courseId:COURSE.id,amount:COURSE.price,currency:COURSE.currency}};
  const capture=await paypal.capture(payment);if(capture.status!=='COMPLETED')throw Error('Sandbox payment is not completed. No recovery case was created.');
  const intake=await service.intakePurchase(owner,{caseId:row.caseId,purchaseId:row.purchaseId,paypalOrderId:row.orderId,learnerId:row.learnerId,customerName:row.customerName,email:row.email,courseId:COURSE.id,amount:COURSE.price,currency:COURSE.currency},{sandboxScenario:row.scenario||'missing-access'});
  const updated={...row,status:'case-created',completedAt:new Date().toISOString()};store.saveDemoCheckout(owner,requestId,updated);
  return {...publicDraft(updated),intake:intake.status};
 }
 function status(owner,requestId){const row=draft(owner,requestId);return row?publicDraft(row):{requestId,status:'not-found'};}
 return {start,complete,status};
}

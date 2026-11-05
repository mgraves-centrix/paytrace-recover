import {createHash} from 'node:crypto';
import {COURSE} from '../dist/core.mjs';

// The store connector supplies the purchase-to-learner mapping. PayPal is
// reread separately; neither an unsigned report row nor this body is payment proof.
export function validateTrustedPurchase(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('A purchase object is required.');
 const {caseId,purchaseId,paypalOrderId,learnerId,customerName,email,courseId,amount,currency}=input;
 if(typeof caseId!=='string'||!/^CL-[A-Za-z0-9-]{5,80}$/.test(caseId))throw Error('Use a unique PayTrace case ID in the PayPal order custom ID.');
 if(typeof purchaseId!=='string'||!/^[A-Za-z0-9_-]{5,128}$/.test(purchaseId))throw Error('A trusted store purchase ID is required.');
 if(typeof paypalOrderId!=='string'||!/^[A-Za-z0-9-]{5,128}$/.test(paypalOrderId))throw Error('A PayPal sandbox order ID is required.');
 if(typeof learnerId!=='string'||!/^[A-Za-z0-9_-]{3,128}$/.test(learnerId))throw Error('A stable learner ID is required.');
 if(typeof customerName!=='string'||!customerName.trim()||customerName.length>80||/[\x00-\x1f<>]/.test(customerName))throw Error('A customer display name is required.');
 const normalizedEmail=typeof email==='string'?email.trim():'';
 if(normalizedEmail.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))throw Error('A verified purchase email is required.');
 if(courseId!==COURSE.id||amount!==COURSE.price||currency!==COURSE.currency)throw Error('This connector accepts only the configured reference course and exact amount.');
 return {caseId,purchaseId,paypalOrderId,learnerId,customerName:customerName.trim(),email:normalizedEmail.toLowerCase(),courseId,amount,currency};
}

export function trustedPurchaseDigest(purchase){return createHash('sha256').update(JSON.stringify(purchase)).digest('hex');}

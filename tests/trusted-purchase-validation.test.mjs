import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSE} from '../dist/core.mjs';
import {validateTrustedPurchase,trustedPurchaseDigest} from '../server/trusted-intake.mjs';

const valid={caseId:'CL-STORE-12345',purchaseId:'STORE-12345',paypalOrderId:'PAYPAL-12345',learnerId:'learner-12345',customerName:'Fictional Buyer',email:'buyer@example.test',courseId:COURSE.id,amount:COURSE.price,currency:COURSE.currency};

test('trusted purchase intake rejects malformed ownership, identity, amount, and contact fields',()=>{
 for(const input of [null,[],
  {...valid,caseId:'WRONG-CASE'}, {...valid,purchaseId:'x'}, {...valid,paypalOrderId:'bad order'},
  {...valid,learnerId:'x'}, {...valid,customerName:'<script>'}, {...valid,customerName:'   '},
  {...valid,email:'not-an-email'}, {...valid,courseId:'other-course'}, {...valid,amount:COURSE.price+1}, {...valid,currency:'EUR'}
 ])assert.throws(()=>validateTrustedPurchase(input));
});

test('trusted purchase normalization is stable and excludes whitespace differences from the signed identity',()=>{
 const a=validateTrustedPurchase({...valid,customerName:' Fictional Buyer ',email:' Buyer@Example.Test '});
 const b=validateTrustedPurchase({...valid,email:'buyer@example.test'});
 assert.deepEqual(a,b);assert.equal(trustedPurchaseDigest(a),trustedPurchaseDigest(b));
 assert.equal(a.email,'buyer@example.test');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';

test('expired anonymous demos release capacity and remove their case data',()=>{
 const db=openStore(':memory:'),original=Date.now;let now=original();Date.now=()=>now;
 try{const a=db.createPublicDemo('address-a',2),b=db.createPublicDemo('address-b',2);assert.throws(()=>db.createPublicDemo('address-c',2),{status:429});assert.ok(db.listCases(a.id).length>0);now+=49*3600000;const c=db.createPublicDemo('address-c',2);assert.ok(c.id);assert.equal(db.get(a.id),null);assert.equal(db.get(b.id),null);assert.throws(()=>db.caseById(a.id,a.state.id));}
 finally{Date.now=original;db.close();}
});

test('recently active demo is retained while idle capacity is reclaimed',()=>{
 const db=openStore(':memory:'),original=Date.now;let now=original();Date.now=()=>now;
 try{const active=db.createPublicDemo('active',2),idle=db.createPublicDemo('idle',2);now+=36*3600000;db.save(active.id,active.state);now+=13*3600000;const newcomer=db.createPublicDemo('new',2);assert.ok(newcomer.id);assert.ok(db.get(active.id));assert.equal(db.get(idle.id),null);assert.ok(db.listCases(active.id).length>0);}
 finally{Date.now=original;db.close();}
});

test('expiring an idle demo preserves its PayPal ownership claim',()=>{
 const db=openStore(':memory:'),original=Date.now;let now=original();Date.now=()=>now;
 try{const old=db.createPublicDemo('old-address',1),paid={...old.state,id:'CL-BOUND-FIRST',intakeMode:'sandbox',paypalOrderId:'PAYPAL-BOUND-ONE',capture:{id:'CAP-BOUND-ONE',source:'paypal-sandbox',status:'COMPLETED'},externalIntake:{purchaseId:'STORE-BOUND-ONE'}};
  db.saveCase(old.id,paid);now+=49*3600000;db.createPublicDemo('new-address',1);
  assert.equal(db.get(old.id),null);
  const other=db.createWorkspace();assert.throws(()=>db.saveCase(other,{...paid,id:'CL-BOUND-SECOND',externalIntake:{purchaseId:'STORE-BOUND-TWO'}}),{status:409});
 }finally{Date.now=original;db.close();}
});

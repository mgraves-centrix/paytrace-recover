import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.mjs';

test('expired anonymous demos release capacity and remove their case data',()=>{
 const db=openStore(':memory:'),original=Date.now;let now=original();Date.now=()=>now;
 try{const a=db.createPublicDemo('address-a',2),b=db.createPublicDemo('address-b',2);assert.throws(()=>db.createPublicDemo('address-c',2),{status:429});assert.ok(db.listCases(a.id).length>0);now+=31*86400000;const c=db.createPublicDemo('address-c',2);assert.ok(c.id);assert.equal(db.get(a.id),null);assert.equal(db.get(b.id),null);assert.throws(()=>db.caseById(a.id,a.state.id));}
 finally{Date.now=original;db.close();}
});

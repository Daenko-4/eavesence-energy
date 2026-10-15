import test from 'node:test';
import assert from 'node:assert/strict';
import {writeHomeStorage,recoverHomeStorage,HOME_TRANSACTION_KEY} from '../src/lib/homeStorage.ts';
const profile='eavesence-home-profile-v1',costs='eavesence-home-costs-v1';
function fixture(){
 const values=new Map([[profile,'original']]);
 const api={getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};
 return {values,api};
}
test('a failed website import restores changed keys and previously absent values',()=>{
 const {values,api}=fixture(),set=api.setItem;
 api.setItem=(key,value)=>{if(key===costs&&value==='new costs')throw new Error('Storage full');set(key,value);};
 assert.throws(()=>writeHomeStorage(api,[[profile,'replacement'],[costs,'new costs']]),/Storage full/);
 assert.equal(values.get(profile),'original');assert.equal(values.has(costs),false);assert.equal(values.has(HOME_TRANSACTION_KEY),false);
});
test('interrupted website import recovers before loading and never touches other browser data',()=>{
 const {values,api}=fixture();values.set('unrelated','keep');
 values.set(profile,'partial');values.set(costs,'partial costs');
 values.set(HOME_TRANSACTION_KEY,JSON.stringify([[profile,'original'],[costs,null]]));
 recoverHomeStorage(api);
 assert.equal(values.get(profile),'original');assert.equal(values.has(costs),false);assert.equal(values.get('unrelated'),'keep');
 values.set(HOME_TRANSACTION_KEY,JSON.stringify([['unrelated','overwrite']]));
 assert.throws(()=>recoverHomeStorage(api),/Invalid home transaction/);
 assert.equal(values.get('unrelated'),'keep');
});
test('a failed rollback retains recovery data; a later retry restores the original home',()=>{
 const {values,api}=fixture(),set=api.setItem;
 api.setItem=(key,value)=>{if(key===costs||(key===profile&&value==='original'))throw new Error('Device unavailable');set(key,value);};
 assert.throws(()=>writeHomeStorage(api,[[profile,'replacement'],[costs,'new costs']]));
 assert.equal(values.get(profile),'replacement');assert.ok(values.has(HOME_TRANSACTION_KEY));
 assert.throws(()=>recoverHomeStorage(api));
 api.setItem=set;recoverHomeStorage(api);
 assert.equal(values.get(profile),'original');assert.equal(values.has(costs),false);assert.equal(values.has(HOME_TRANSACTION_KEY),false);
});
test('reset rolls back deletions if one key cannot be removed',()=>{
 const {values,api}=fixture(),remove=api.removeItem;values.set(costs,'original costs');
 api.removeItem=key=>{if(key===costs)throw new Error('Cannot remove');remove(key);};
 assert.throws(()=>writeHomeStorage(api,[[profile,null],[costs,null]]));
 assert.equal(values.get(profile),'original');assert.equal(values.get(costs),'original costs');
});

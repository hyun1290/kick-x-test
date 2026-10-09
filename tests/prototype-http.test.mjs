import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const validation=loadTs('../lib/kickx/validation.ts');
const http=loadTs('../server/kickx/http.ts',{'server-only':{},'@/lib/kickx/validation':validation,'./config':{},'./supabase':{}});
const prototype=loadTs('../server/kickx/prototype.ts',{'server-only':{},'./http':http});
const req=(data,origin='https://kickx.invalid')=>new Request('https://kickx.invalid/api/kickx',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('trade quote and settlement ignore client price, quantity, user and policy fields',async()=>{
 const calls=[];const injected={...http,authenticatedClient:async()=>({user:{id:'verified'},client:{rpc:async(name,args)=>{calls.push({name,args});return {data:{id:'result'},error:null};}}})};
 const quote=loadTs('../app/api/kickx/trades/quote/route.ts',{'@/server/kickx/http':injected,'@/server/kickx/prototype':prototype});
 const trade=loadTs('../app/api/kickx/trades/route.ts',{'@/server/kickx/http':injected,'@/server/kickx/prototype':prototype});
 const body={playerId:'bsd-1',side:'buy',price:1,fee:0,quantity:999,userId:'forged',policyVersion:'forged'};
 assert.equal((await quote.POST(req(body))).status,200);assert.deepEqual(calls[0],{name:'kickx_quote',args:{p_player:'bsd-1',p_side:'buy'}});
 const id='11111111-1111-1111-1111-111111111111';assert.equal((await trade.POST(req({...body,quoteId:id,requestId:id}))).status,200);assert.deepEqual(calls[1].args,{p_quote:id,p_request:id});
 assert.equal((await trade.POST(req({...body,quoteId:'bad',requestId:id}))).status,400);assert.equal(calls.length,2);
});
test('all new writes reject foreign origins and missing authentication before database mutation',async()=>{
 for(const [path,method] of [['trades/quote','POST'],['trades','POST'],['squad','PUT'],['community','POST'],['admin/prototype','POST']]){
  let calls=0,denied=true;
  const authenticatedClient=async()=>{if(denied)throw new http.HttpError(401,'로그인 필요');return {user:{id:'verified'},client:{rpc:async()=>{calls++;return {data:{},error:null};}}};};
  const route=loadTs(`../app/api/kickx/${path}/route.ts`,{'@/server/kickx/http':{...http,authenticatedClient},'@/server/kickx/prototype':prototype,'@/server/kickx/config':{},'@/server/kickx/supabase':{},'@/lib/kickx/validation':validation,'@/server/kickx/admin-db':{requireAdmin:async()=>{throw new http.HttpError(401,'로그인 필요');},createAdminDatabase:()=>{calls++;}},'@/server/kickx/engine/service':{calculatePlayer:()=>{calls++;}}});
  assert.equal((await route[method](req({}))).status,401);denied=false;
  assert.equal((await route[method](req({},'https://foreign.invalid'))).status,403);assert.equal(calls,0);
 }
});
test('database error mapping exposes known conflicts but redacts unknown private details',()=>{
 assert.throws(()=>prototype.checkDatabase({message:'ALREADY_OWNED'}),e=>e.status===409);
 assert.throws(()=>prototype.checkDatabase({code:'42P01',message:'private schema'}),e=>e.status===503&&!e.message.includes('private'));
 assert.throws(()=>prototype.checkDatabase({code:'XX000',message:'private credentials or content'}),e=>!e.message.includes('private'));
});

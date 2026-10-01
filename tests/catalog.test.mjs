import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const data = loadTs("../lib/kickx/data.ts");
const { readCatalog, readRows } = loadTs("../server/kickx/catalog.ts", {"server-only": {}, "@/lib/kickx/data":data});
function clientFor(tables, calls = []) {
  return {from(table) {
    let start=0,end=499;
    const query={
      select(){return query;},order(){return query;},gte(){return query;},
      range(a,b){start=a;end=b;return query;},limit(n){end=n-1;return query;},
      then(resolve){calls.push([table,start,end]);return Promise.resolve(tables[table] instanceof Error ? {data:null,error:tables[table]} : {data:(tables[table]||[]).slice(start,end+1),error:null,count:(tables[table]||[]).length}).then(resolve);}
    };
    return query;
  }};
}
test("catalog reader pages beyond the provider's first response",async()=>{
  const rows=Array.from({length:1105},(_,i)=>({id:String(i)})),calls=[];
  assert.equal((await readRows(clientFor({players:rows},calls),"players","id")).length,1105);
  assert.deepEqual(calls.map(c=>c[1]),[0,500,1000]);
});
test("catalog failures stay failures instead of fabricated empty data",async()=>{
  await assert.rejects(readCatalog(clientFor({player_catalog:new Error("database unavailable")})),/database unavailable/);
});
test("real zero values survive while missing market data remains unknown",async()=>{
  const catalog=await readCatalog(clientFor({
    player_catalog:[{id:"test-1",name:"Test-only player",team_id:null,price:0,change_percent:"0",performance:0,goals:0,assists:0,minutes:0,volume:0},{id:"test-2",name:"Test-only unknown"}],
    fixtures:[{id:"fixture",home_team_id:"h",away_team_id:"a",starts_at:"2026-10-01T12:00:00Z",status:"FT",home_score:0,away_score:0}]
  }));
  assert.equal(catalog.players[0].price,0);
  assert.equal(catalog.players[0].performance,0);
  assert.equal(catalog.players[1].price,null);
  assert.deepEqual(catalog.players[1].history,[]);
  assert.equal(catalog.fixtures[0].homeScore,0);
  assert.equal(catalog.market,null);
  assert.deepEqual(catalog.posts,[]);
});
test("catalog adapter does not invent player, team or match rows for an empty database",async()=>{
  assert.deepEqual(await readCatalog(clientFor({})),{...data.emptyPublicData(),playerTotal:0});
});

test("large bootstrap catalogs stay bounded and never read every price history or match record",async()=>{
 const calls=[],rows=Array.from({length:1800},(_,i)=>({id:"test-"+i,name:"Test-only "+i}));
 const result=await readCatalog(clientFor({players:rows,player_catalog:rows},calls));
 assert.equal(result.playerTotal,1800);assert.equal(result.players.length,24);
 assert.equal(calls.some(c=>["price_history","player_match_records","player_analyses"].includes(c[0])),false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",NEXT_PUBLIC_SUPABASE_ANON_KEY:"",SUPABASE_SERVICE_ROLE_KEY:"",BSD_API_KEY:"",KICKX_DATABASE_ENABLED:"false"};
test("connection CLI starts and reports missing configuration without leaking secrets",()=>{
 const result=spawnSync(process.execPath,["scripts/check-connection.mjs"],{env,encoding:"utf8"});
 assert.equal(result.status,1);assert.deepEqual(JSON.parse(result.stdout).checks,[]);assert.equal(JSON.parse(result.stdout).publicConfig,false);
});
test("sync CLI starts and refuses absent API key before using quota",()=>{
 const result=spawnSync(process.execPath,["scripts/sync-football.mjs","players","--league=39","--season-id=123","--team=1","--dry-run"],{env,encoding:"utf8"});
 assert.equal(result.status,1);assert.equal(JSON.parse(result.stderr).error,"MISSING_API_KEY");assert.equal(JSON.parse(result.stderr).requests,0);
});

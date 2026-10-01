import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { createFootballClient, externalId, normalizeBatch, parseSyncArgs, SyncError } from "./lib/football.mjs";
nextEnv.loadEnvConfig(process.cwd());
let client,jobId,api,nextPage=null,written=0;
const check=result=>{if(result.error) throw new SyncError("DATABASE_WRITE_FAILED");return result.data;};
try {
  const options=parseSyncArgs(process.argv.slice(2));
  const key=process.env.API_FOOTBALL_KEY?.trim();
  if(!key) throw new SyncError("MISSING_API_KEY");
  if(!options.dryRun) {
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url || !key || new URL(url).protocol !== "https:") throw new SyncError("MISSING_INGESTION_DATABASE_CONFIG");
    client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const job=check(await client.from("football_sync_jobs").insert({task:options.task,target:`league=${options.league},season=${options.season}${options.teamId ? ",team="+options.teamId : ""}${options.fixtureId ? ",fixture="+options.fixtureId : ""}${options.from ? ",from="+options.from+",to="+options.to : ""}`,status:"running",next_page:options.page}).select("id").single());
    jobId=job.id;
  }
  api=createFootballClient({key,budget:options.budget});
  const context=await api.get("/leagues",{id:options.league,season:options.season});
  const leagueBatch=normalizeBatch("leagues",context.response,options);
  const coverage=leagueBatch.coverage[0].coverage;
  if(options.task === "players" && coverage.players !== true) throw new SyncError("PLAYER_COVERAGE_UNAVAILABLE");
  if(options.task === "matches" && coverage.fixtures?.statistics_players !== true) throw new SyncError("MATCH_PLAYER_COVERAGE_UNAVAILABLE");
  const save=async payload=>{
    if(client) written+=check(await client.rpc("apply_football_batch",{payload}));
    else written+=Object.values(payload).reduce((n,rows)=>n+rows.length,0);
  };
  await save(leagueBatch);
  if(options.task !== "leagues") {
    if(options.task === "squads") {
      const teams=await api.get("/teams",{league:options.league,season:options.season});
      if(!teams.response.some(item=>item.team?.id === options.teamId)) throw new SyncError("TEAM_NOT_IN_LEAGUE_SEASON");
      await save(normalizeBatch("teams",teams.response,options));
    }
    if(options.task === "matches") {
      let fixture;
      if(client) {
        const result=await client.from("fixtures").select("league_id,home_team_id,away_team_id,season").eq("id",externalId(options.fixtureId)).maybeSingle();
        fixture=check(result);
      } else {
        const response=await api.get("/fixtures",{id:options.fixtureId});
        const payload=normalizeBatch("fixtures",response.response,options);
        fixture=payload.fixtures.find(row=>row.id===externalId(options.fixtureId));
      }
      if(!fixture || (fixture.league_id !== externalId(options.league) || fixture.season !== options.season)) throw new SyncError("IMPORT_FIXTURE_FIRST");

      options.fixtureTeams=[fixture.home_team_id,fixture.away_team_id];
    }
    const endpoints={teams:"/teams",players:"/players",squads:"/players/squads",fixtures:"/fixtures",matches:"/fixtures/players"};
    for(let page=options.page;page<options.page+options.pages;page++) {
      nextPage=page;
      const params=options.task === "squads" ? {team:options.teamId} : options.task === "matches" ? {fixture:options.fixtureId} : {league:options.league,season:options.season};
      if(options.task === "players") params.page=page;
      if(options.task === "fixtures") Object.assign(params,{from:options.from,to:options.to,timezone:"UTC"});
      const response=await api.get(endpoints[options.task],params);
      if(response.paging.current !== page || (options.task !== "players" && response.paging.total!==1)) throw new SyncError("UNEXPECTED_PROVIDER_PAGE");
      const payload=normalizeBatch(options.task,response.response,options);
      if(options.fixtureTeams && payload.matches.some(row=>!options.fixtureTeams.includes(row.team_id))) throw new SyncError("UNEXPECTED_FIXTURE_TEAM");
      await save(payload);
      nextPage=page<response.paging.total ? page+1 : null;
      if(client) check(await client.from("football_sync_jobs").update({requests:api.requests,rows_written:written,next_page:nextPage}).eq("id",jobId));
      console.log(JSON.stringify({task:options.task,page,pages:response.paging.total,rows:written,requests:api.requests,remaining:api.remaining,dryRun:options.dryRun,nextPage}));
      if(nextPage == null) break;
    }
  }
  if(client) check(await client.from("football_sync_jobs").update({status:nextPage ? "paused" : "completed",finished_at:new Date().toISOString(),requests:api.requests,rows_written:written,next_page:nextPage}).eq("id",jobId));
  console.log(JSON.stringify({status:nextPage ? "paused" : "completed",jobId,requests:api.requests,rows:written,nextPage,dryRun:options.dryRun}));
} catch(error) {
  // Never print provider bodies, URLs with credentials, fetch internals or database errors.
  const code=error instanceof SyncError ? error.code : "SYNC_FAILED";
  if(client && jobId) {
    const result=await client.from("football_sync_jobs").update({status:code === "RUN_BUDGET_REACHED" || code === "DAILY_QUOTA_REACHED" ? "paused" : "failed",finished_at:new Date().toISOString(),requests:api?.requests ?? 0,rows_written:written,next_page:nextPage,error_code:code}).eq("id",jobId);
    if(result.error) console.error(JSON.stringify({error:"JOB_STATUS_WRITE_FAILED",jobId}));
  }
  console.error(JSON.stringify({error:code,jobId,requests:api?.requests ?? 0,nextPage}));
  process.exitCode=1;
}

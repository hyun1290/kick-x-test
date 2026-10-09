import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculatePerformance, RULE_VERSION } from "./performance";
import { HttpError } from "../http";
import { checkDatabase } from "../prototype";
export async function calculatePlayer(db: SupabaseClient, playerId: string, actor: string, preview=false) {
 const stats=[];
 for(let offset=0;;offset+=500){
  const r=await db.from("football_match_stats").select("*,fixtures!inner(*,football_event_sources(*))").eq("player_id",playerId).order("fixture_id").range(offset,offset+499);
  checkDatabase(r.error);stats.push(...(r.data??[]));if((r.data?.length??0)<500)break;if(offset>=9500)throw new HttpError(422,"선수 기록 범위가 너무 큽니다.");
 }
 const expected=stats.map(m=>({fixture:m.fixture_id,statsAt:m.updated_at,sourceAt:m.fixtures.football_event_sources?.updated_at??null,fixtureAt:m.fixtures.updated_at}));
 const results=stats.sort((a,b)=>a.fixtures.starts_at.localeCompare(b.fixtures.starts_at)||a.fixture_id.localeCompare(b.fixture_id)).map(m=>calculatePerformance({fixtureId:m.fixture_id,playerId,teamId:m.team_id,status:m.fixtures.status,homeTeam:m.fixtures.home_team_id,awayTeam:m.fixtures.away_team_id,homeScore:m.fixtures.home_score,awayScore:m.fixtures.away_score,stats:m.stats,legacy:m.legacy_stats,source:m.fixtures.football_event_sources??{}}));
 const hash=createHash("sha256").update(JSON.stringify({version:RULE_VERSION,results})).digest("hex");
 if(preview)return {playerId,results,hash};
 const saved=await db.rpc("kickx_publish_calculation",{p_actor:actor,p_player:playerId,p_hash:hash,p_expected:expected,p_results:results});checkDatabase(saved.error);
 return {playerId,results:results.map(r=>({fixtureId:r.fixtureId,status:r.status,warnings:r.warnings})),...saved.data};
}

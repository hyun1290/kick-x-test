import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminData, IngestionState } from "@/lib/kickx/types";
import { emptyAdminData } from "@/lib/kickx/data";
import {prototypeAvailable,checkDatabase} from "./prototype";
import { createAdminDatabase } from "./admin-db";
import { readBulkState } from "@/scripts/lib/bulk-sync.mjs";

const labels: Record<string, string> = { completed: "완료", running: "진행 중", paused: "일시 중지", failed: "실패", cancelled: "취소" };
export async function ingestionState(db: SupabaseClient): Promise<IngestionState> {
  try {
    const state = await readBulkState(db);
    return { enabled: !!process.env.BSD_API_KEY?.trim(), reason: process.env.BSD_API_KEY?.trim() ? null : "서버의 BSD_API_KEY를 설정해 주세요.", ...state };
  } catch {
    return { enabled: false, reason: "수집 작업 DB를 확인해 주세요. 새 수동 갱신 SQL 적용이 필요할 수 있습니다.", latest: null, current: null, warnings: [], runs: [] };
  }
}
export async function readOperations(): Promise<AdminData> {
  const empty = emptyAdminData();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return { ...empty, ingestion: { enabled: false, reason: "서버의 SUPABASE_SERVICE_ROLE_KEY와 BSD_API_KEY를 설정해 주세요.", latest: null, current: null, warnings: [], runs: [] } };
  const db = createAdminDatabase();
  const [ingestion, players, jobs] = await Promise.all([
    ingestionState(db), db.from("players").select("id", { count: "exact", head: true }),
    db.from("football_sync_jobs").select("id,task,target,started_at,status,requests,rows_written,error_code").order("started_at", { ascending: false }).limit(30),
  ]);
  if (players.error || jobs.error) throw new Error("ADMIN_READ_FAILED");
  const legacy = (jobs.data ?? []).map(j => ({ id: j.id as string, name: `BSD ${j.task}`, kind: "collect", target: j.target as string, time: j.started_at as string, status: labels[j.status] || j.status, success: j.rows_written as number, fail: j.status === "failed" ? 1 : 0, error: j.error_code as string | null }));
  const bulk = ingestion.runs.map(j => ({ id: j.id, name: "5대 리그 데이터 수집", kind: "collect", target: `${j.completed_tasks}/${j.total_tasks} 작업 · ${j.requests}회 호출`, time: j.started_at, status: labels[j.status] || j.status, success: j.rows_written, fail: j.error_code ? 1 : 0, error: j.error_code }));
  const all = [...bulk, ...legacy].sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const ready=await prototypeAvailable(db);
  let extra:Partial<AdminData>={prototypeReady:ready};let pendingReports:number|null=null;
  if(ready){
    const [trades,reports,audit,issues,pending]=await Promise.all([
      db.from("trades").select("*").order("created_at",{ascending:false}).limit(200),
      db.from("community_reports").select("*,community_posts(title,body),community_comments(body)").order("created_at",{ascending:false}).limit(200),
      db.from("operation_audit").select("*").order("created_at",{ascending:false}).limit(100),
      db.from("performance_results").select("player_id,fixture_id,status,warnings").eq("status","blocked").order("calculated_at",{ascending:false}).limit(50),
      db.from("community_reports").select("id",{count:"exact",head:true}).eq("status","open"),
    ]);
    for(const r of [trades,reports,audit,issues,pending])checkDatabase(r.error);pendingReports=pending.count;
    extra={...extra,trades:(trades.data??[]).map(t=>({id:t.id,userId:t.user_id,playerId:t.player_id,playerName:t.player_name,type:t.side,quantity:1,price:t.price,fee:t.fee,net:t.net,date:t.created_at,status:"체결"})),
    reports:(reports.data??[]).map(r=>({id:r.id,postId:r.post_id,commentId:r.comment_id,title:r.community_posts?.title??"삭제된 글",content:r.comment_id?r.community_comments?.body:r.community_posts?.body,reason:r.reason,status:({open:"접수",hidden:"숨김",dismissed:"기각",restored:"복원"} as Record<string,string>)[r.status],date:r.created_at})),
    audit:(audit.data??[]).map(a=>({id:a.id,description:`${a.action} · ${a.target??""} · ${JSON.stringify(a.detail)}`,date:a.created_at})),calculationIssues:issues.data??[]};
    all.push(...(audit.data??[]).filter(a=>a.action.startsWith("calculation.")).map(a=>({id:a.id,name:"Performance·가치 산정",kind:"performance",target:a.target??"",time:a.created_at,status:a.action.endsWith("withheld")?"실패":"완료",success:a.detail.results??null,fail:a.action.endsWith("withheld")?1:0,error:a.detail.reason??null})));
    all.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
  }
  return { ...empty, ingestion, jobs: all, summary: { players: players.count, completedJobs: all.filter(j => j.status === "완료").length, failedJobs: all.filter(j => j.error).length, pendingReports }, audit: bulk.map(j => ({ id: j.id, description: `${j.name} · ${j.status}`, date: j.time })), ...extra };
}

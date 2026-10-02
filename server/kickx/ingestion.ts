import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminData, IngestionState } from "@/lib/kickx/types";
import { emptyAdminData } from "@/lib/kickx/data";
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
  return { ...empty, ingestion, jobs: all, summary: { players: players.count, completedJobs: all.filter(j => j.status === "완료").length, failedJobs: all.filter(j => j.error).length, pendingReports: null }, audit: bulk.map(j => ({ id: j.id, description: `${j.name} · ${j.status}`, date: j.time })) };
}

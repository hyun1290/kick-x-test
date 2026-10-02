import { createFootballClient, SyncError } from "./football.mjs";
import { initialTasks, processBulkTask } from "./bulk-plan.mjs";

const check = response => {
  if (response.error) throw new SyncError(response.error.code === "PGRST202" || response.error.code === "42P01" ? "BULK_MIGRATION_REQUIRED" : "BULK_DATABASE_ERROR");
  return response.data;
};
/** @param {import("@supabase/supabase-js").SupabaseClient} db @param {string | null} actor */
export async function startBulkRun(db, actor = null) {
  return check(await db.rpc("start_football_bulk", { actor, tasks: initialTasks() }));
}
export async function controlBulkRun(db, run, action) {
  return check(await db.rpc("control_football_bulk", { run, action }));
}
export async function stepBulkRun(db, run, key, options = {}) {
  const claim = check(await db.rpc("claim_football_bulk", { run }));
  if (claim.state !== "claimed") return { state: claim.state };
  const api = createFootballClient({ key, budget: 3, timeoutMs: 8000, ...options });
  try {
    const outcome = await processBulkTask(api, claim.task, claim.today);
    check(await db.rpc("finish_football_bulk", { run, token: claim.token, outcome, request_count: api.requests, quota_remaining: api.remaining }));
    return { state: "progress", label: claim.task.label, requests: api.requests };
  } catch (error) {
    const code = error instanceof SyncError ? error.code : "BULK_PROCESSING_ERROR";
    const retry = Number.isSafeInteger(error.retryAfterSeconds) ? Math.min(86400, Math.max(1, error.retryAfterSeconds)) : code === "PROVIDER_RATE_LIMIT" ? 60 : null;
    check(await db.rpc("fail_football_bulk", { run, token: claim.token, error_code: code, request_count: api.requests, retry_seconds: retry }));
    return { state: "paused", error: code };
  }
}

const runColumns = "id,status,started_at,updated_at,finished_at,total_tasks,completed_tasks,warnings,requests,rows_written,error_code,retry_at,remaining,lease_until";
export async function readBulkState(db) {
  const runs = check(await db.from("football_bulk_runs").select(runColumns).order("started_at", { ascending: false }).limit(10));
  const latest = runs[0] ?? null;
  let current = null, warnings = [];
  if (latest) {
    current = check(await db.from("football_bulk_tasks").select("label,kind").eq("run_id", latest.id).eq("completed", false).order("priority").order("id").limit(1))[0] ?? null;
    warnings = check(await db.from("football_bulk_tasks").select("label,warning").eq("run_id", latest.id).not("warning", "is", null).order("id").limit(20));
  }
  return { latest, current, warnings, runs };
}

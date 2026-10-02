import { requireAdmin, createAdminDatabase } from "@/server/kickx/admin-db";
import { failure, HttpError, json, readJson, requireOrigin } from "@/server/kickx/http";
import { ingestionState } from "@/server/kickx/ingestion";
import { controlBulkRun, startBulkRun, stepBulkRun } from "@/scripts/lib/bulk-sync.mjs";
import { SyncError } from "@/scripts/lib/football.mjs";

export const maxDuration = 60;
export async function GET() {
  try { await requireAdmin(); return json(await ingestionState(createAdminDatabase())); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const user = await requireAdmin();
    const input = await readJson(request) as { action?: string; runId?: string } | null;
    if (!input || !["start", "step", "pause", "resume", "cancel"].includes(input.action ?? "")) throw new HttpError(400, "수집 작업을 확인해 주세요.");
    if (input.action !== "start" && (typeof input.runId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.runId))) throw new HttpError(400, "수집 작업 ID가 올바르지 않습니다.");
    const key = process.env.BSD_API_KEY?.trim();
    if (!key && !["pause", "cancel"].includes(input.action!)) throw new HttpError(503, "서버의 BSD_API_KEY를 설정해 주세요.");
    const db = createAdminDatabase();
    const run = input.action === "start" ? await startBulkRun(db, user.id) : input.runId!;
    let actionState = "started";
    if (input.action === "step") actionState = (await stepBulkRun(db, run, key)).state;
    else if (["pause", "resume", "cancel"].includes(input.action!)) actionState = await controlBulkRun(db, run, input.action);
    return json({ ...(await ingestionState(db)), actionState });
  } catch (error) {
    if (error instanceof SyncError && error.code === "BULK_MIGRATION_REQUIRED") return failure(new HttpError(503, "새 수동 갱신 SQL을 먼저 적용해 주세요."));
    return failure(error);
  }
}

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { startBulkRun, controlBulkRun, stepBulkRun, readBulkState } from "./lib/bulk-sync.mjs";
import { SyncError } from "./lib/football.mjs";

nextEnv.loadEnvConfig(process.cwd());
try {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--status", "--resume"].includes(arg)) || args.length > 1) throw new SyncError("USAGE_ALL_STATUS_OR_RESUME");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const key = process.env.BSD_API_KEY?.trim();
  if (!url || !secret || new URL(url).protocol !== "https:") throw new SyncError("MISSING_INGESTION_DATABASE_CONFIG");
  if (!key && !args.includes("--status")) throw new SyncError("MISSING_API_KEY");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  if (args.includes("--status")) console.log(JSON.stringify(await readBulkState(db)));
  else {
    const run = await startBulkRun(db);
    if (args.includes("--resume")) await controlBulkRun(db, run, "resume");
    let stopped = false;
    process.once("SIGINT", () => { stopped = true; });
    console.log(JSON.stringify({ run, scope: "big-five-current-season", manual: true }));
    while (!stopped) {
      const result = await stepBulkRun(db, run, key);
      if (result.state !== "wait") console.log(JSON.stringify({ run, ...result }));
      if (["completed", "paused", "cancelled", "busy"].includes(result.state)) break;
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    if (stopped) await controlBulkRun(db, run, "pause");
    const state = await readBulkState(db);
    console.log(JSON.stringify(state));
    if (state.latest?.status !== "completed") process.exitCode = 2;
  }
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof SyncError ? error.code : "BULK_SYNC_FAILED" }));
  process.exitCode = 1;
}

import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
import { SyncError } from "../scripts/lib/football.mjs";
const validation = loadTs("../lib/kickx/validation.ts");
const http = loadTs("../server/kickx/http.ts", { "server-only": {}, "@/lib/kickx/validation": validation, "./config": {}, "./supabase": {} });
const request = (data, origin = "https://kickx.invalid") => new Request("https://kickx.invalid/api/kickx/admin/ingestion", {
  method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(data),
});
test("admin role is read for the verified user, never accepted from request metadata", async () => {
  let role = "member", error = null;
  const { requireAdmin } = loadTs("../server/kickx/admin-db.ts", {
    "server-only": {}, "@supabase/supabase-js": {}, "./http": { ...http, authenticatedClient: async () => ({
      user: { id: "verified-account" }, client: { from: table => {
        assert.equal(table, "user_roles");
        return { select: () => ({ eq: (field, id) => { assert.equal(field, "user_id"); assert.equal(id, "verified-account"); return { maybeSingle: async () => ({ data: { role }, error }) }; } }) };
      } },
    }) },
  });
  await assert.rejects(requireAdmin(), e => e.status === 403);
  role = "admin"; assert.equal((await requireAdmin()).id, "verified-account");
  error = new Error("private DB details"); await assert.rejects(requireAdmin(), e => e.status === 503 && !e.message.includes("private"));
});
test("ingestion routes block guests, members, foreign origins and malformed actions before service access", async () => {
  let status = 401, dbCalls = 0, startCalls = 0;
  const snapshot = { enabled: true, latest: null, runs: [], warnings: [], current: null, reason: null };
  const { GET, POST } = loadTs("../app/api/kickx/admin/ingestion/route.ts", {
    "@/server/kickx/admin-db": { requireAdmin: async () => { if (status) throw new http.HttpError(status, "blocked"); return { id: "verified-admin" }; }, createAdminDatabase: () => { dbCalls++; return {}; } },
    "@/server/kickx/http": http,
    "@/server/kickx/ingestion": { ingestionState: async () => snapshot },
    "@/scripts/lib/football.mjs": { SyncError },
    "@/scripts/lib/bulk-sync.mjs": {
      startBulkRun: async (_, actor) => { startCalls++; assert.equal(actor, "verified-admin"); return "run"; },
      controlBulkRun: async (_, id, action) => { assert.match(id, /^[a-f0-9-]+$/); return action === "cancel" ? "cancelled" : "running"; },
    },
  });
  for (status of [401, 403]) {
    assert.equal((await GET()).status, status);
    assert.equal((await POST(request({ action: "start", role: "admin" }))).status, status);
  }
  status = 0;
  assert.equal((await POST(request({ action: "start" }, "https://foreign.invalid"))).status, 403);
  for (const input of [null, {}, { action: "unknown" }, { action: "step", runId: "invalid" }]) assert.equal((await POST(request(input))).status, 400);
  assert.equal(dbCalls, 0);
  const old = process.env.BSD_API_KEY;
  try {
    process.env.BSD_API_KEY = "";
    assert.equal((await POST(request({ action: "start" }))).status, 503);
    assert.equal((await POST(request({ action: "cancel", runId: "00000000-0000-0000-0000-000000000001" }))).status, 200);
    process.env.BSD_API_KEY = "test-private-key";
    const result = await POST(request({ action: "start", userId: "forged-id" }));
    assert.equal(result.status, 200); assert.equal(startCalls, 1);
    assert.equal((await result.text()).includes("test-private-key"), false);
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
  } finally { if (old === undefined) delete process.env.BSD_API_KEY; else process.env.BSD_API_KEY = old; }
});

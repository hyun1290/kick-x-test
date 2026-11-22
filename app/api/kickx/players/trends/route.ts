import { createRequestClient } from "@/server/kickx/supabase";
import { getSupabaseConfig } from "@/server/kickx/config";
import { checkDatabase, migrationMissing } from "@/server/kickx/prototype";
import { failure, HttpError } from "@/server/kickx/http";

/** 30-day price trend for the players shown on a list page (at most 60 ids). Public data only. */
export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("ids") ?? "";
    const ids = [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))];
    if (ids.length > 60 || ids.some((id) => !/^[A-Za-z0-9_.-]{1,64}$/.test(id))) throw new HttpError(400, "선수 목록을 확인해 주세요.");
    if (!ids.length || !getSupabaseConfig()) return Response.json({ status: "ready", data: {} });
    const client = await createRequestClient();
    const r = await client.rpc("kickx_player_trends", { p_players: ids });
    if (migrationMissing(r.error)) return Response.json({ status: "ready", data: {} });
    checkDatabase(r.error);
    return Response.json({ status: "ready", data: r.data ?? {} }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  } catch (error) { return failure(error); }
}

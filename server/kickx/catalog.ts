import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicData, Player, Position, SeriesPoint, PlayerRecord } from "@/lib/kickx/types";
import { emptyPublicData } from "@/lib/kickx/data";
type Row = Record<string, unknown>;
const text = (v: unknown) => typeof v === "string" ? v : null;
const number = (v: unknown) => v != null && (typeof v === "number" || typeof v === "string") && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null;
function required(v: unknown) { const s = text(v); if (!s) throw new Error("Invalid catalog identity"); return s; }
/** Explicit paging avoids Supabase's default row cap silently truncating the catalog.
 * This bootstrap reader is bounded. Split into page/detail endpoints before a large import.
 */
export async function readRows(client: SupabaseClient, table: string, columns: string, since?: { column: string; at: string }) {
  const rows: Row[] = [];
  for (let offset = 0; offset < 20000; offset += 500) {
    let query = client.from(table).select(columns).order("id").range(offset, offset + 499);
    if (since) query = query.gte(since.column, since.at);
    const { data, error } = await query;
    if (error) throw error;
    if (!data) throw new Error("Missing catalog result");
    rows.push(...(data as unknown as Row[]));
    if (data.length < 500) return rows;
  }
  throw new Error("Catalog bootstrap limit reached; use dedicated paginated endpoints");
}
function ageAt(birthDate: unknown, now: Date) {
  const value = text(birthDate);
  if (!value) return null;
  const birth = new Date(value);
  if (!Number.isFinite(birth.getTime()) || birth > now) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}
export async function readCatalog(client: SupabaseClient): Promise<PublicData> {
  const now = new Date();
  const since = new Date(now.getTime() - 31 * 86400000).toISOString();
  const [leagues, teams, players, snapshots, fixtures, history, records, analyses] = await Promise.all([
    readRows(client, "leagues", "id,name"),
    readRows(client, "teams", "id,name,english,code,color,league_id"),
    readRows(client, "players", "id,name,english,short_name,team_id,position,shirt_number,country,birth_date,trade_status,updated_at"),
    readRows(client, "player_market_snapshots", "id,price,change_percent,performance,volume,goals,assists,minutes,updated_at"),
    readRows(client, "fixtures", "id,league_id,home_team_id,away_team_id,starts_at,status,home_score,away_score", { column: "starts_at", at: since }),
    readRows(client, "price_history", "id,player_id,recorded_at,value", { column: "recorded_at", at: since }),
    readRows(client, "player_match_records", "id,player_id,played_at,opponent,result,minutes,goals,assists,performance", { column: "played_at", at: since }),
    readRows(client, "player_analyses", "id,body"),
  ]);
  const metrics = new Map(snapshots.map(row => [required(row.id), row]));
  const analysis = new Map(analyses.map(row => [required(row.id), text(row.body)]));
  const histories = new Map<string, SeriesPoint[]>();
  const matches = new Map<string, PlayerRecord[]>();
  for (const row of history) {
    const playerId = required(row.player_id), at = required(row.recorded_at), value = number(row.value);
    if (value == null) throw new Error("Invalid price history");
    histories.set(playerId, [...(histories.get(playerId) || []), { at, value }]);
  }
  for (const row of records) {
    const playerId = required(row.player_id);
    matches.set(playerId, [...(matches.get(playerId) || []), {
      id: required(row.id), playedAt: required(row.played_at), opponent: required(row.opponent),
      result: text(row.result), minutes: number(row.minutes), goals: number(row.goals),
      assists: number(row.assists), performance: number(row.performance),
    }]);
  }
  const mapped: Player[] = players.map(row => {
    const id = required(row.id), snapshot = metrics.get(id);
    const position = ["GK","DF","MF","FW"].includes(String(row.position)) ? row.position as Position : null;
    return {
      id, name: required(row.name), english: text(row.english), short: text(row.short_name),
      team: text(row.team_id), position, number: number(row.shirt_number),
      country: text(row.country), age: ageAt(row.birth_date, now),
      price: number(snapshot?.price), change: number(snapshot?.change_percent),
      performance: number(snapshot?.performance), volume: number(snapshot?.volume),
      goals: number(snapshot?.goals), assists: number(snapshot?.assists), minutes: number(snapshot?.minutes),
      history: (histories.get(id) || []).sort((a,b) => Date.parse(a.at) - Date.parse(b.at)),
      records: (matches.get(id) || []).sort((a,b) => Date.parse(b.playedAt) - Date.parse(a.playedAt)),
      analysis: analysis.get(id) || null, updatedAt: text(snapshot?.updated_at), status: text(row.trade_status),
    };
  });
  const updatedAt = mapped.map(p => p.updatedAt).filter((v): v is string => !!v && Number.isFinite(Date.parse(v))).sort((a,b) => Date.parse(b) - Date.parse(a))[0] || null;
  return {
    ...emptyPublicData(),
    leagues: leagues.map(row => ({ id: required(row.id), name: required(row.name) })),
    teams: teams.map(row => ({ id: required(row.id), name: required(row.name), english: text(row.english), code: text(row.code), color: text(row.color), leagueId: text(row.league_id) })),
    players: mapped,
    fixtures: fixtures.map(row => ({ id: required(row.id), leagueId: text(row.league_id), home: required(row.home_team_id), away: required(row.away_team_id), startsAt: required(row.starts_at), status: required(row.status), homeScore: number(row.home_score), awayScore: number(row.away_score) })).sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    updatedAt,
  };
}

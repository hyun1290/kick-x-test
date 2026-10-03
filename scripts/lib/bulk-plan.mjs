import { externalId, normalizeBatch, normalizeMatchBundle, normalizeStatus, SyncError } from "./football.mjs";

// BSD IDs verified by discovery. Seasons are resolved on every manual run, never hard-coded.
export const BIG_FIVE = [
  { id: 1, name: "프리미어리그" }, { id: 3, name: "라리가" },
  { id: 4, name: "세리에 A" }, { id: 5, name: "분데스리가" }, { id: 6, name: "리그 1" },
];
const task = (key, kind, priority, payload, label) => ({ key, kind, priority, payload, label });
export const initialTasks = () => BIG_FIVE.map(l => task(`league:${l.id}`, "league", 0, { league: l.id, phase: "detail" }, l.name));
const ended = status => ["FT", "AET", "PEN"].includes(normalizeStatus(status));
const assertId = (value, expected, code = "UNEXPECTED_EVENT") => { if (value !== expected) throw new SyncError(code); };
export function seasonWindows(start, end) {
  for (const value of [start, end]) if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new SyncError("INVALID_SEASON_DATES");
  const first = Date.parse(start), last = Date.parse(end), day = 86400000;
  if (last < first || last - first > 400 * day) throw new SyncError("INVALID_SEASON_DATES");
  const windows = [];
  for (let from = first; from <= last; from += 30 * day) windows.push({ from: new Date(from).toISOString().slice(0, 10), to: new Date(Math.min(from + 29 * day, last)).toISOString().slice(0, 10) });
  return windows;
}
const source = (kind, id, raw) => ({ kind, external_id: id, raw });
const result = (batch = null, children = [], extra = {}) => ({ done: true, batch, children, ...extra });
const advance = payload => ({ done: false, payload, children: [], batch: null });
function fixtureTask(context, window, offset = 0) {
  return task(`fixtures:${context.league}:${context.seasonId}:${window.from}:${offset}`, "fixtures", 30, { context, ...window, offset }, `${context.leagueName} ${window.from}~${window.to}`);
}
function profileTask(context, teamId, offset = 0) {
  return task(`players:${teamId}:${offset}`, "players", 25, { context, teamId, offset }, `선수 기본정보 · 구단 ${teamId}`);
}

/** One bounded provider call (up to three transport attempts) per checkpoint. No timers/scheduler. */
export async function processBulkTask(api, job, today) {
  const p = job.payload;
  if (job.kind === "league") {
    if (p.phase === "detail") {
      const detail = await api.get(`/api/v2/leagues/${p.league}/`);
      assertId(detail.id, p.league, "UNEXPECTED_LEAGUE");
      return advance({ ...p, detail, phase: "seasons" });
    }
    // OpenAPI CurrentSeasonV2Schema wraps the active season and echoes the league ID.
    const currentSeason = await api.get(`/api/v2/leagues/${p.league}/season/`);
    assertId(currentSeason?.league_id, p.league, "UNEXPECTED_LEAGUE");
    const selected = currentSeason.season;
    if (selected === null) throw new SyncError("CURRENT_SEASON_UNAVAILABLE");
    if (!selected || typeof selected !== "object" || Array.isArray(selected)) throw new SyncError("INVALID_CURRENT_SEASON_RESPONSE");
    externalId(selected.id);
    const windows = seasonWindows(selected.start_date, selected.end_date);
    if (selected.is_current !== true || selected.start_date > today || selected.end_date < today) throw new SyncError("CURRENT_SEASON_UNAVAILABLE");
    const seasons = { league_id: p.league, seasons: [selected] };
    const context = { league: p.league, seasonId: selected.id, seasonYear: selected.year, leagueName: p.detail.name };
    const batch = normalizeBatch("leagues", { ...p.detail, season: seasons }, context);
    return result(batch, [task(`teams:${p.league}:0`, "teams", 10, { context, offset: 0, seen: [] }, `${p.detail.name} 구단`), ...windows.map(w => fixtureTask(context, w))], {
      entities: [source("league", p.league, { detail: p.detail, currentSeason, seasons })],
    });
  }
  const c = p.context;
  if (job.kind === "teams") {
    const page = await api.page("/api/v2/teams/", { league_id: c.league, season_id: c.seasonId, limit: 200, offset: p.offset });
    if (!page.results.length) throw new SyncError("EMPTY_TEAM_LIST");
    const batch = normalizeBatch("teams", page.results, c);
    const seen = [...new Set([...p.seen, ...page.results.map(t => t.id)])];
    const children = page.results.map(t => task(`squad:${t.id}`, "squad", 20, { context: c, teamId: t.id }, `${t.name} 선수단`));
    if (page.next != null) children.push(task(`teams:${c.league}:${page.next}`, "teams", 10, { context: c, offset: page.next, seen }, job.label));
    return result(batch, children, { entities: page.results.map(t => source("team", t.id, t)), leagueMembership: page.next == null ? { leagueId: externalId(c.league), teamIds: seen.map(externalId) } : null });
  }
  if (job.kind === "squad") {
    const raw = await api.get(`/api/v2/teams/${p.teamId}/squad/`);
    const batch = normalizeBatch("squads", raw, { ...c, teamId: p.teamId });
    if (!batch.players.length) throw new SyncError("EMPTY_SQUAD");
    return result(batch, [profileTask(c, p.teamId)], { entities: [source("squad", p.teamId, raw)], squadMembership: { teamId: externalId(p.teamId), playerIds: batch.players.map(x => x.id) } });
  }
  if (job.kind === "players") {
    const page = await api.page("/api/v2/players/", { team_id: p.teamId, limit: 200, offset: p.offset });
    const batch = normalizeBatch("players", page.results, { ...c, teamId: p.teamId });
    return result(batch, page.next == null ? [] : [profileTask(c, p.teamId, page.next)], { entities: page.results.map(row => source("player", row.id, row)) });
  }
  if (job.kind === "fixtures") {
    const page = await api.page("/api/v2/events/", { league_id: c.league, season_id: c.seasonId, date_from: p.from, date_to: p.to, limit: 200, offset: p.offset });
    const batch = normalizeBatch("fixtures", page.results, c);
    const children = page.results.filter(f => ended(f.status)).map(f => task(`match:${f.id}`, "match", 40, { context: c, eventId: f.id, phase: "detail" }, `${f.home_team} · ${f.away_team}`));
    if (page.next != null) children.push(fixtureTask(c, p, page.next));
    return result(batch, children);
  }
  if (job.kind !== "match") throw new SyncError("UNKNOWN_BULK_TASK");
  const base = `/api/v2/events/${p.eventId}/`;
  if (p.phase === "detail") {
    const detail = await api.get(base);
    assertId(detail.id, p.eventId);
    const batch = normalizeBatch("fixtures", [detail], c);
    // A correction to postponed/cancelled is saved without inventing player statistics.
    if (!ended(detail.status)) return result(batch, [], { warning: "MATCH_NO_LONGER_FINISHED" });
    return advance({ ...p, phase: "stats", detail });
  }
  if (["stats", "lineups", "incidents"].includes(p.phase)) {
    const endpoint = { stats: "player-stats/", lineups: "lineups/", incidents: "incidents/" }[p.phase];
    const value = await api.get(base + endpoint);
    assertId(value.event_id, p.eventId);
    if (p.phase === "stats" && (!Array.isArray(value.player_stats) || value.count !== value.player_stats.length)) throw new SyncError("INVALID_MATCH_STATISTICS");
    if (p.phase === "stats" && !value.count) return result(null, [], { warning: "MATCH_STATS_UNAVAILABLE" });
    const phase = { stats: "lineups", lineups: "incidents", incidents: "legacy" }[p.phase];
    return advance({ ...p, [p.phase]: value, phase, ...(phase === "legacy" ? { legacy: [], page: 1 } : {}) });
  }
  if (p.phase === "legacy") {
    const page = await api.page("/api/player-stats/", { event: p.eventId, page: p.page }, "v1");
    const legacy = [...p.legacy, ...page.results];
    if (legacy.length > 250 || p.page > 20) throw new SyncError("INVALID_LEGACY_STATISTICS");
    if (page.next != null) return advance({ ...p, legacy, page: page.next });
    const known = new Set();
    if (p.lineups.lineup_status === "confirmed") for (const side of Object.values(p.lineups.lineups ?? {})) for (const player of [...(side.players ?? []), ...(side.substitutes ?? [])]) known.add(player.id);
    const missing = [...new Set(p.stats.player_stats.map(row => row.player_id))].filter(id => !known.has(id));
    const ready = { ...p, legacy, missing, profiles: [], phase: "profiles" };
    return missing.length ? advance(ready) : result(normalizeMatchBundle(ready, c));
  }
  if (p.phase === "profiles") {
    const id = p.missing[0];
    const profile = await api.get(`/api/v2/players/${id}/`);
    assertId(profile.id, id, "UNEXPECTED_PLAYER");
    const ready = { ...p, missing: p.missing.slice(1), profiles: [...p.profiles, profile] };
    return ready.missing.length ? advance(ready) : result(normalizeMatchBundle(ready, c));
  }
  throw new SyncError("UNKNOWN_BULK_PHASE");
}

"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { usePlatform } from "./provider";
import { useCatalogPage } from "./catalog";
import type { Fixture } from "@/lib/kickx/types";
import { DataEmpty, PageHeading, Tabs, TeamBadge } from "./ui";
import { dateText } from "@/lib/kickx/data";
import { fixtureGroup, fixtureStatus, koreanDay } from "@/lib/kickx/fixtures";

const STATES: [string, string][] = [["all", "전체"], ["live", "진행 중"], ["scheduled", "예정"], ["finished", "종료"], ["other", "연기·기타"]];
export function FixturesScreen() {
  const { data, status:platformStatus, getTeam, getLeague } = usePlatform();
  const [league, setLeague] = useState("all"), [state, setState] = useState("all");
  const [day, setDay] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1);
  const results = useMemo(() => data.fixtures.filter((fixture) => {
    const home = data.teams.find((t) => t.id === fixture.home), away = data.teams.find((t) => t.id === fixture.away);
    return (league === "all" || fixture.leagueId === league) && (state === "all" || fixtureGroup(fixture.status) === state)
      && (!day || koreanDay(fixture.startsAt) === day)
      && (!query.trim() || [home?.name, home?.english, away?.name, away?.english].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  }).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [data.fixtures, data.teams, league, state, day, query]);
  const remote=useCatalogPage<Fixture>("fixtures",{league,state,day,q:query,page,size:20});
  const status=remote.enabled ? remote.status : platformStatus;
  const total=remote.enabled ? remote.data.total : results.length;
  const count=Math.max(1,Math.ceil(total/20)),current=remote.enabled ? page : Math.min(page,count);
  const visible=remote.enabled ? (status === "ready" ? remote.data.items : []) : results.slice((current-1)*20,current*20);
  const groups = new Map<string, typeof results>();
  for (const fixture of visible) {
    const key = koreanDay(fixture.startsAt);
    groups.set(key, [...(groups.get(key) || []), fixture]);
  }
  const today = koreanDay(new Date().toISOString());
  const filtered = league !== "all" || state !== "all" || !!day || !!query;
  const reset = () => { setLeague("all"); setState("all"); setDay(""); setQuery(""); setPage(1); };
  const stateLabel = STATES.find(([value]) => value === state)?.[1] ?? "전체";
  return (
    <>
      <PageHeading
        eyebrow="MATCH CENTRE"
        title="경기 일정"
        description="다음 킥오프부터 경기 결과까지. 경기 결과는 선수 Performance와 가치에 반영됩니다."
        action={<span className="tag outline"><CalendarDays size={14} />대한민국 시간 · KST</span>}
      />
      <section className="panel flush">
        <div className="panel-head">
          <Tabs items={STATES.map(([, label]) => label)} value={stateLabel} onChange={(label) => { setState(STATES.find(([, l]) => l === label)?.[0] ?? "all"); setPage(1); }} label="경기 상태" />
        </div>
        <div className="toolbar fixture-tools">
          <label className="input-search"><Search size={17} /><input aria-label="경기 구단 검색" placeholder="구단 이름 검색" maxLength={100} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></label>
          <select aria-label="경기 리그" value={league} onChange={(e) => { setLeague(e.target.value); setPage(1); }}>
            <option value="all">모든 리그</option>
            {data.leagues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input type="date" aria-label="경기 날짜 (대한민국 시간)" value={day} onChange={(e) => { setDay(e.target.value); setPage(1); }} />
          <button className="button secondary" disabled={!filtered} onClick={reset}><RotateCcw size={15} />초기화</button>
        </div>
        <p className="fixture-summary" role="status">
          {status === "ready" ? <><b className="num">{total}</b>경기</> : "경기 정보를 준비하고 있습니다."}
          <span>진행 상태는 마지막 수집 기록을 기준으로 표시합니다.</span>
        </p>
        {[...groups].map(([date, fixtures]) => (
          <section className="match-day" key={date}>
            <h2>
              {date.replaceAll("-", ". ")}
              {date === today && <span className="tag yellow">오늘</span>}
              <small className="num">{fixtures.length}경기</small>
            </h2>
            <ul>
              {fixtures.map((fixture) => {
                const group = fixtureGroup(fixture.status);
                const scored = fixture.homeScore != null && fixture.awayScore != null;
                const homeWin = scored && fixture.homeScore! > fixture.awayScore!, awayWin = scored && fixture.awayScore! > fixture.homeScore!;
                return (
                  <li className={`match-row ${group}`} key={fixture.id}>
                    <div className="match-meta">
                      <time dateTime={fixture.startsAt} className="num">{dateText(fixture.startsAt).split(" ").slice(-1).join(" ")}</time>
                      <span>{getLeague(fixture.leagueId)?.name || "리그 정보 없음"}</span>
                    </div>
                    <Link href={"/community/clubs/" + fixture.home} className={`match-team home ${awayWin ? "lost" : ""}`}>
                      <span>{getTeam(fixture.home)?.name || "구단 정보 없음"}</span>
                      <TeamBadge id={fixture.home} />
                    </Link>
                    <div className="match-score">
                      <strong className="num">{scored ? `${fixture.homeScore} : ${fixture.awayScore}` : "VS"}</strong>
                      <span className={`match-status ${group}`}>{fixtureStatus(fixture.status)}</span>
                    </div>
                    <Link href={"/community/clubs/" + fixture.away} className={`match-team ${homeWin ? "lost" : ""}`}>
                      <TeamBadge id={fixture.away} />
                      <span>{getTeam(fixture.away)?.name || "구단 정보 없음"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {!visible.length && <DataEmpty entity="경기 일정" status={status} retry={remote.enabled ? remote.reload : undefined} filtered={filtered} />}
        {total > 0 && (
          <div className="panel-foot pagination">
            <span>{`${(current - 1) * 20 + 1}–${Math.min(current * 20, total)} / ${total}`}</span>
            <div>
              <button aria-label="이전 경기 페이지" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={17} /></button>
              <span className="num">{current} / {count}</span>
              <button aria-label="다음 경기 페이지" disabled={current === count} onClick={() => setPage(current + 1)}><ChevronRight size={17} /></button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

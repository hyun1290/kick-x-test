"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { usePlatform } from "./provider";
import { DataEmpty, PageHeading, TeamBadge } from "./ui";
import { dateText } from "@/lib/kickx/data";
import { fixtureGroup, fixtureStatus, koreanDay } from "@/lib/kickx/fixtures";
export function FixturesScreen() {
  const { data, status, getTeam, getLeague } = usePlatform();
  const [league, setLeague] = useState("all"), [state, setState] = useState("all");
  const [day, setDay] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1);
  const results = useMemo(() => data.fixtures.filter(fixture => {
    const home = data.teams.find(t => t.id === fixture.home), away = data.teams.find(t => t.id === fixture.away);
    return (league === "all" || fixture.leagueId === league) && (state === "all" || fixtureGroup(fixture.status) === state)
      && (!day || koreanDay(fixture.startsAt) === day)
      && (!query.trim() || [home?.name,home?.english,away?.name,away?.english].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  }).sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [data.fixtures,data.teams,league,state,day,query]);
  const count = Math.max(1,Math.ceil(results.length/20)), current = Math.min(page,count);
  const groups = new Map<string, typeof results>();
  for (const fixture of results.slice((current-1)*20,current*20)) {
    const key = koreanDay(fixture.startsAt);
    groups.set(key,[...(groups.get(key)||[]),fixture]);
  }
  const filtered = league !== "all" || state !== "all" || !!day || !!query;
  const reset = () => {setLeague("all");setState("all");setDay("");setQuery("");setPage(1);};
  return <><PageHeading eyebrow="MATCH CENTRE" title="경기 일정" description="다음 킥오프부터 경기 결과까지, 축구의 흐름을 한눈에." action={<span className="kx-timezone"><CalendarDays size={16}/>대한민국 시간 · KST</span>}/>
    <section className="panel kx-fixture-browser">
      <div className="kx-fixture-filters">
        <label className="input-search"><Search size={17}/><input aria-label="경기 구단 검색" placeholder="구단 이름 검색" value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}}/></label>
        <select aria-label="경기 리그" value={league} onChange={event=>{setLeague(event.target.value);setPage(1);}}><option value="all">모든 리그</option>{data.leagues.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label="경기 상태" value={state} onChange={event=>{setState(event.target.value);setPage(1);}}><option value="all">모든 경기</option><option value="scheduled">예정</option><option value="live">진행 중</option><option value="finished">종료</option><option value="other">연기·기타</option></select>
        <input type="date" aria-label="경기 날짜 (대한민국 시간)" value={day} onChange={event=>{setDay(event.target.value);setPage(1);}}/>
        <button className="button secondary" disabled={!filtered} onClick={reset}><RotateCcw size={15}/>초기화</button>
      </div>
      <p className="kx-result-summary" role="status">{status === "ready" ? `조회된 경기 ${results.length}개` : "경기 정보를 준비하고 있습니다."}<span>진행 상태는 마지막 수집 기록을 기준으로 표시합니다.</span></p>
      {[...groups].map(([date,fixtures])=><section className="kx-match-day" key={date}><h2>{date.replaceAll("-",". ")}<span>{fixtures.length}경기</span></h2>{fixtures.map(fixture=><article className="kx-match-row" key={fixture.id}><div className="kx-match-meta"><span>{getLeague(fixture.leagueId)?.name || "리그 정보 없음"}</span><time dateTime={fixture.startsAt}>{dateText(fixture.startsAt).split(" ").slice(-1).join(" ")}</time></div><Link href={"/community/clubs/"+fixture.home} className="kx-match-team home"><span>{getTeam(fixture.home)?.name || "구단 정보 없음"}</span><TeamBadge id={fixture.home} size="small"/></Link><div className="kx-match-score"><strong>{fixture.homeScore == null || fixture.awayScore == null ? "VS" : fixture.homeScore + " : " + fixture.awayScore}</strong><span className={"kx-match-status "+fixtureGroup(fixture.status)}>{fixtureStatus(fixture.status)}</span></div><Link href={"/community/clubs/"+fixture.away} className="kx-match-team"><TeamBadge id={fixture.away} size="small"/><span>{getTeam(fixture.away)?.name || "구단 정보 없음"}</span></Link></article>)}</section>)}
      {!results.length&&<DataEmpty entity="경기 일정" filtered={filtered}/>}
      <div className="pagination"><span>{results.length ? `${(current-1)*20+1}–${Math.min(current*20,results.length)} / ${results.length}` : "—"}</span><div><button aria-label="이전 경기 페이지" disabled={current===1||!results.length} onClick={()=>setPage(current-1)}><ChevronLeft size={17}/></button><span>{results.length ? current+" / "+count : "—"}</span><button aria-label="다음 경기 페이지" disabled={current===count||!results.length} onClick={()=>setPage(current+1)}><ChevronRight size={17}/></button></div></div>
    </section></>;
}

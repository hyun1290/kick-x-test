"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search, Shield, Shirt, Star, X } from "lucide-react";
import { dateText, money } from "@/lib/kickx/data";
import { usePlatform } from "./provider";
import { DataEmpty, DataNotice, Modal, PlayerAvatar, PlayerIdentity, PositionBadge, WatchButton } from "./ui";
import { Pitch } from "./squad";
import { PlaybookArt } from "./playbook-art";

function SectionLink({ title, href, label }: { title: string; href: string; label?: string }) {
  return <div className="yb-panel-heading"><h2>{title}</h2><Link href={href} aria-label={`${title} ${label || "보기"}`}>{label && <span>{label}</span>}<ArrowRight size={24} /></Link></div>;
}
/** An unselected pitch illustration, not a configured/default formation. */
function EmptyPitch() {
  const spots = [[27,22],[50,15],[73,22],[24,49],[50,49],[76,49],[13,73],[38,73],[62,73],[87,73],[50,92]];
  return <Link href="/squad" className="yb-empty-pitch" aria-label="스쿼드 구성하기"><svg viewBox="0 0 360 280" preserveAspectRatio="none" aria-hidden="true"><path d="M36 8H324L357 274H3Z M21 140H339 M114 8L109 61H251L246 8 M141 8L139 29H221L219 8 M90 274L94 227H266L270 274 M137 274L138 254H222L223 274" /><ellipse cx="180" cy="140" rx="39" ry="23" /></svg>{spots.map(([x,y],i)=><Shirt aria-hidden="true" key={i} style={{left:`${x}%`,top:`${y}%`}} />)}</Link>;
}
export function HomeScreen() {
  const { data, status, reload, getTeam } = usePlatform();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("all");
  const [team, setTeam] = useState("all");
  const [sort, setSort] = useState("default");
  const [all, setAll] = useState(false);
  const [fixturesOpen, setFixturesOpen] = useState(false);
  const member = data.member;
  const filtered = !!search || position !== "all" || team !== "all";
  const results = useMemo(() => data.players.filter(player => {
    const club = data.teams.find(item => item.id === player.team);
    return `${player.name} ${player.english || ""} ${club?.name || ""}`.toLowerCase().includes(search.trim().toLowerCase()) && (position === "all" || player.position === position) && (team === "all" || player.team === team);
  }).sort((a,b) => {
    if (sort === "default") return 0;
    const left = sort === "performance" ? a.performance : a.price;
    const right = sort === "performance" ? b.performance : b.price;
    if (left == null) return right == null ? 0 : 1;
    if (right == null) return -1;
    return sort === "low" ? left - right : right - left;
  }), [data.players,data.teams,search,position,team,sort]);
  const watched = data.players.filter(player => member?.watchlist.includes(player.id));
  const formation = data.formations.find(item => item.id === member?.squad?.formationId);
  const reset = () => {setQuery("");setSearch("");setPosition("all");setTeam("all");setSort("default");setAll(false);};
  return (
    <><div className="yb-dashboard">
      <section className="yb-market" aria-labelledby="yb-market-title">
        <div className="yb-hero"><PlaybookArt variant="hero" className="yb-hero-art" /><div className="yb-hero-copy"><p>선수 시장</p><h1 id="yb-market-title">다음 선수를 찾아라.</h1><span>발견하고, 분석하고, 당신의 스쿼드를 완성하세요.</span></div></div>
        <form className="yb-search" onSubmit={event=>{event.preventDefault();setSearch(query);setAll(true);}}>
          <label className="yb-search-field"><Search size={25}/><input aria-label="선수 이름 검색" placeholder="선수 이름을 검색하세요." value={query} onChange={event=>setQuery(event.target.value)} />{query&&<button aria-label="검색어 지우기" type="button" onClick={()=>{setQuery("");setSearch("");}}><X size={15}/></button>}</label>
          <select aria-label="포지션" value={position} onChange={event=>setPosition(event.target.value)}><option value="all">포지션 전체</option>{["FW","MF","DF","GK"].map(value=><option key={value}>{value}</option>)}</select>
          <select aria-label="소속 구단" value={team} onChange={event=>setTeam(event.target.value)}><option value="all">소속 구단 전체</option>{data.teams.map(club=><option key={club.id} value={club.id}>{club.name}</option>)}</select>
          <select aria-label="정렬 기준" value={sort} onChange={event=>setSort(event.target.value)}><option value="default">정렬 기준</option><option value="high">가치 높은 순</option><option value="low">가치 낮은 순</option><option value="performance">Performance 순</option></select>
          <button type="submit" className="yb-search-button">검색</button>
        </form>
        {filtered && <div className="yb-filter-result" role="status"><span>검색 결과 <strong>{results.length}명</strong></span><button onClick={reset}>필터 초기화 <X size={13}/></button></div>}
        <div className="yb-table-wrap"><table className="yb-player-table"><caption className="sr-only">선수 시장 목록</caption><thead><tr><th>선수</th><th>포지션</th><th className="yb-club-column">소속 구단</th><th>현재 가치</th><th className="yb-performance-column">Performance</th><th>관심</th></tr></thead><tbody>{(all?results:results.slice(0,8)).map((player,index)=><tr key={player.id} style={{animationDelay:`${index%8*35}ms`}}><td><PlayerIdentity player={player}/></td><td><PositionBadge position={player.position}/></td><td className="yb-club-column">{getTeam(player.team)?.name || "—"}</td><td className="yb-price">{money(player.price)}{player.price != null && <small> P</small>}</td><td className="yb-performance-column">{player.performance ?? "—"}</td><td><WatchButton id={player.id}/></td></tr>)}</tbody></table>
          {!results.length && <div className="yb-market-empty"><DataEmpty entity="선수" filtered={filtered}/></div>}
        </div>
        {results.length>8&&!all&&<button className="yb-load-more" onClick={()=>setAll(true)}>선수 더 보기</button>}
        <div className="yb-data-status"><DataNotice status={status} reload={reload}/>{data.updatedAt&&<p>최근 갱신 {dateText(data.updatedAt)}</p>}</div>
      </section>
      <aside className="yb-sidebar" aria-label="나의 축구 대시보드">
        <section className="yb-panel yb-assets"><SectionLink title="내 자산" href="/portfolio"/><div className="yb-asset-stats"><div><span>현재 가치</span><strong>{money(member?.totalAssets)}{member?.totalAssets != null && <small> P</small>}</strong></div><div><span>보유 선수</span><strong>{member ? new Set(member.holdings.map(item=>item.playerId)).size : "—"}{member&&<small>명</small>}</strong></div><div><span>평가 손익</span><strong>{money(member?.profit)}{member?.profit != null&&<small> P</small>}</strong></div></div></section>
        <section className="yb-panel yb-squad"><SectionLink title="내 스쿼드" href="/squad" label="스쿼드 관리"/><div className="yb-squad-layout">{formation&&member?.squad?<Pitch slots={member.squad.slots} formation={formation.id} compact/>:<EmptyPitch/>}<div className="yb-squad-options"><Link href="/squad"><span>포메이션</span><strong>{formation?.name||"—"}<ChevronDown size={16}/></strong></Link><div><span>주요 전술</span><strong>—</strong></div><Link href="/squad" className="yb-black-button">스쿼드 편집</Link></div></div></section>
        <section className="yb-panel yb-fixtures"><div className="yb-panel-heading"><h2>주요 경기</h2><button aria-label="경기 일정 보기" onClick={()=>setFixturesOpen(true)}><ArrowRight size={24}/></button></div>{data.fixtures.length?<div className="yb-fixture-list">{data.fixtures.slice(0,3).map(fixture=><div className="yb-fixture" key={fixture.id}><Link href={`/community/clubs/${fixture.home}`}><Shield size={21}/><span>{getTeam(fixture.home)?.name||"—"}</span></Link><span>VS</span><Link href={`/community/clubs/${fixture.away}`}><span>{getTeam(fixture.away)?.name||"—"}</span><Shield size={21}/></Link><time title={dateText(fixture.startsAt)}>{Number.isFinite(Date.parse(fixture.startsAt))?new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(fixture.startsAt)):"—"}</time></div>)}</div>:<div className="yb-fixtures-empty"><Shield size={25}/><p>{status==="loading"?"경기 일정을 불러오는 중입니다.":status==="error"?"경기 일정을 불러오지 못했습니다.":"경기 일정이 준비되면 표시됩니다."}</p></div>}</section>
        <section className="yb-panel yb-watchlist"><SectionLink title="관심 선수" href="/players?watchlist=1"/><div className="yb-watch-grid">{watched.slice(0,4).map(player=><article key={player.id}><Link href={`/players/${player.id}`}><PlayerAvatar player={player}/><strong>{player.name}</strong><small>{getTeam(player.team)?.name||"소속 정보 없음"}</small></Link><WatchButton id={player.id}/></article>)}</div>{!watched.length&&<div className="yb-watch-empty"><Star size={25}/><p>{data.session?"등록된 관심 선수가 없습니다.":"로그인 후 관심 선수를 확인하세요."}</p><Link href={data.session?"/players":"/login"}>{data.session?"선수 탐색":"로그인"}</Link></div>}</section>
      </aside>
    </div>{fixturesOpen&&<Modal title="주요 경기 일정" onClose={()=>setFixturesOpen(false)}>{data.fixtures.map(fixture=><article className="yb-schedule-item" key={fixture.id}><strong>{getTeam(fixture.home)?.name||"—"}<small>VS</small>{getTeam(fixture.away)?.name||"—"}</strong><time>{dateText(fixture.startsAt)} · KST</time><span>{fixture.status}</span></article>)}{!data.fixtures.length&&<DataEmpty entity="경기 일정"/>}</Modal>}</>
  );
}

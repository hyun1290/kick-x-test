"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, LayoutGrid, List, MessageCircle, RotateCcw, Search, Sparkles } from "lucide-react";
import { dateText, money, seriesForDays } from "@/lib/kickx/data";
import type { Player } from "@/lib/kickx/types";
import { usePlatform } from "./provider";
import {
  BackLink,
  Change,
  DataEmpty,
  Empty,
  PageHeading,
  PlayerIdentity,
  PlayerPortrait,
  PositionBadge,
  PriceChart,
  SectionTitle,
  Sparkline,
  StatCard,
  Tabs,
  TeamBadge,
  TradeButton,
  WatchButton,
} from "./ui";

const PAGE = 12;
function compareNumber(a: number | null, b: number | null, ascending = false) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return ascending ? a - b : b - a;
}
function PlayerCard({ player }: { player: Player }) {
  const { data, getTeam } = usePlatform();
  const owned = data.member?.holdings.some((h) => h.playerId === player.id);
  return (
    <article className="player-card">
      <Link href={`/players/${player.id}`} className="player-card-photo" aria-label={`${player.name} 상세 보기`}>
        <PlayerPortrait player={player} size="xl" />
        <span className="player-card-badges">
          <PositionBadge position={player.position} />
          {owned && <span className="tag ink">보유</span>}
        </span>
      </Link>
      <span className="player-card-watch"><WatchButton id={player.id} /></span>
      <div className="player-card-body">
        <Link href={`/players/${player.id}`}><h3>{player.name}</h3></Link>
        <p><TeamBadge id={player.team} size="small" />{getTeam(player.team)?.name || "소속 정보 없음"}</p>
        <div className="player-card-price">
          <strong className="num">{money(player.price)}<span className="unit">P</span></strong>
          <Change value={player.change} />
        </div>
        <div className="player-card-foot">
          <span>Performance <b className="num">{money(player.performance)}</b></span>
          <Sparkline values={player.history.slice(-14).map((v) => v.value)} down={(player.change ?? 0) < 0} />
        </div>
      </div>
    </article>
  );
}
export function PlayerList({ market = false }: { market?: boolean }) {
  const sp = useSearchParams();
  const { data, status, getTeam, getLeague } = usePlatform();
  const [q, setQ] = useState(sp.get("q") || ""),
    [league, setLeague] = useState("all"),
    [team, setTeam] = useState("all"),
    [pos, setPos] = useState("전체");
  const [sort, setSort] = useState(market ? "volume" : "price"),
    [view, setView] = useState(market ? "list" : "grid"),
    [tab, setTab] = useState(sp.get("watchlist") === "1" ? "관심 선수" : "전체 선수"),
    [page, setPage] = useState(1);
  useEffect(() => {
    setQ(sp.get("q") || "");
    setTab(sp.get("watchlist") === "1" ? "관심 선수" : "전체 선수");
    setPage(1);
  }, [sp]);
  const results = data.players
    .filter((p) => {
      const t = getTeam(p.team),
        l = getLeague(t?.leagueId);
      return (
        `${p.name} ${p.english || ""} ${t?.name || ""} ${t?.english || ""} ${l?.name || ""}`.toLowerCase().includes(q.trim().toLowerCase()) &&
        (league === "all" || t?.leagueId === league) &&
        (team === "all" || p.team === team) &&
        (pos === "전체" || p.position === pos) &&
        (tab !== "관심 선수" || data.member?.watchlist.includes(p.id)) &&
        (tab !== "상승 선수" || (p.change != null && p.change > 0)) &&
        (tab !== "하락 선수" || (p.change != null && p.change < 0)) &&
        (tab !== "보유 선수" || data.member?.holdings.some((h) => h.playerId === p.id))
      );
    })
    .sort((a, b) => {
      const key = (sort === "price-asc" ? "price" : sort) as "price" | "change" | "performance" | "volume";
      return compareNumber(a[key], b[key], sort === "price-asc");
    });
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE)),
    current = Math.min(page, pageCount),
    visible = results.slice((current - 1) * PAGE, current * PAGE);
  const filtered = !!q || league !== "all" || team !== "all" || pos !== "전체" || tab !== "전체 선수";
  const reset = () => {
    setQ("");
    setLeague("all");
    setTeam("all");
    setPos("전체");
    setTab("전체 선수");
    setPage(1);
  };
  const movers = [...data.players].filter((p) => p.change != null).sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!)).slice(0, 4);
  return (
    <>
      <PageHeading
        eyebrow={market ? "PLAYER EXCHANGE" : "DISCOVER YOUR NEXT PLAYER"}
        title={market ? "선수 시장" : "선수 탐색"}
        description={market ? "경기의 흐름을 읽고, 가치가 움직이는 순간을 잡으세요." : "리그·구단·포지션으로 나에게 맞는 선수를 찾아보세요."}
        action={<span className="updated-at">최근 갱신 <b>{dateText(data.updatedAt)}</b></span>}
      />
      {market && (
        <>
          <div className="stat-grid market-stats">
            <StatCard label="전체 거래량" value={money(data.market?.volume)} unit="건" hint={data.market?.calculatedAt ? `${dateText(data.market.calculatedAt)} 집계` : "집계 대기"} />
            <StatCard label="상승 선수" value={<span className="up">{money(data.market?.rising)}</span>} unit="명" hint="직전 갱신 대비" />
            <StatCard label="하락 선수" value={<span className="down">{money(data.market?.falling)}</span>} unit="명" hint="직전 갱신 대비" />
            <StatCard label="거래 가능 선수" value={money(data.players.filter((p) => !p.status && p.price != null).length || null)} unit="명" hint={`전체 ${data.players.length}명`} tone="yellow" />
          </div>
          {movers.length > 0 && (
            <section className="market-movers" aria-labelledby="market-movers">
              <SectionTitle title="오늘의 움직임" meta="변동폭 상위" />
              <div className="mover-cards">
                {movers.map((p) => (
                  <Link key={p.id} href={`/players/${p.id}`} className="mover-card hover-lift">
                    <PlayerPortrait player={p} size="md" />
                    <span className="mover-card-text">
                      <strong>{p.name}</strong>
                      <span>{getTeam(p.team)?.name}</span>
                    </span>
                    <span className="mover-card-value">
                      <b className="num">{money(p.price)}<span className="unit">P</span></b>
                      <Change value={p.change} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <section className="browser">
        <div className="browser-top">
          <Tabs
            items={market ? ["전체 선수", "상승 선수", "하락 선수", "관심 선수"] : ["전체 선수", "관심 선수", "보유 선수"]}
            value={tab}
            onChange={(v) => { setTab(v); setPage(1); }}
            label="선수 목록 보기"
          />
          <div className="view-switch" role="group" aria-label="보기 방식">
            <button aria-label="카드 보기" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={view === "grid" ? "active" : ""}><LayoutGrid size={17} /></button>
            <button aria-label="목록 보기" aria-pressed={view === "list"} onClick={() => setView("list")} className={view === "list" ? "active" : ""}><List size={17} /></button>
          </div>
        </div>
        <div className="toolbar browser-filters">
          <label className="input-search">
            <Search size={17} />
            <input aria-label="선수 검색" placeholder="선수 · 구단 · 리그 검색" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </label>
          <select aria-label="리그 필터" value={league} onChange={(e) => { setLeague(e.target.value); setTeam("all"); setPage(1); }}>
            <option value="all">모든 리그</option>
            {data.leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select aria-label="구단 필터" value={team} onChange={(e) => { setTeam(e.target.value); setPage(1); }}>
            <option value="all">모든 구단</option>
            {data.teams.filter((t) => league === "all" || t.leagueId === league).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select aria-label="선수 정렬" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="price">가치 높은 순</option>
            <option value="price-asc">가치 낮은 순</option>
            <option value="change">상승률 순</option>
            <option value="performance">Performance 순</option>
            <option value="volume">거래량 순</option>
          </select>
        </div>
        <div className="result-line">
          <div className="chips" role="group" aria-label="포지션 필터">
            {["전체", "FW", "MF", "DF", "GK"].map((p) => (
              <button key={p} type="button" aria-pressed={p === pos} onClick={() => { setPos(p); setPage(1); }} className={`chip ${p === pos ? "active" : ""}`}>{p}</button>
            ))}
          </div>
          <span className="result-count">
            {status === "ready" ? <><strong className="num">{results.length}</strong>명의 선수</> : "—"}
            {filtered && <button type="button" className="text-link" onClick={reset}><RotateCcw size={13} />필터 초기화</button>}
          </span>
        </div>
        {view === "grid" && visible.length > 0 ? (
          <div className="player-grid">{visible.map((p) => <PlayerCard key={p.id} player={p} />)}</div>
        ) : view === "list" && visible.length > 0 ? (
          <div className="table-scroll">
            <table className="data-table market-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th className="hide-sm">포지션</th>
                  <th className="numeric">현재 가치</th>
                  <th className="numeric hide-sm">변동</th>
                  <th className="hide-md">30일 추이</th>
                  <th className="numeric hide-sm">Performance</th>
                  <th className="numeric hide-md">거래량</th>
                  <th className="cell-actions hide-sm">거래</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const owned = data.member?.holdings.some((h) => h.playerId === p.id);
                  return (
                    <tr key={p.id}>
                      <td><span className="row-identity"><WatchButton id={p.id} /><PlayerIdentity player={p} /></span></td>
                      <td className="hide-sm"><PositionBadge position={p.position} /></td>
                      <td className="numeric strong">{money(p.price)}<span className="unit">P</span><span className="only-sm"><Change value={p.change} /></span></td>
                      <td className="numeric hide-sm"><Change value={p.change} /></td>
                      <td className="hide-md"><Sparkline values={p.history.map((v) => v.value)} down={(p.change ?? 0) < 0} /></td>
                      <td className="numeric hide-sm">{money(p.performance)}</td>
                      <td className="numeric hide-md">{money(p.volume)}</td>
                      <td className="cell-actions hide-sm"><TradeButton player={p} side={owned ? "sell" : "buy"} className={`button small ${owned ? "secondary" : "primary"}`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {!visible.length && <DataEmpty entity="선수" filtered={data.players.length > 0} rows={6} />}
        {results.length > 0 && (
          <div className="pagination">
            <span>{(current - 1) * PAGE + 1}–{Math.min(current * PAGE, results.length)} / 총 {results.length}명</span>
            <div>
              <button aria-label="이전 페이지" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button>
              <span className="num">{current} / {pageCount}</span>
              <button aria-label="다음 페이지" disabled={current === pageCount} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
function PerformanceBars({ player }: { player: Player }) {
  const records = [...player.records].sort((a, b) => Date.parse(a.playedAt) - Date.parse(b.playedAt)).slice(-6);
  if (!records.length) return <p className="muted perf-empty">최근 경기 기록이 없습니다.</p>;
  return (
    <div className="perf-bars" role="img" aria-label={`최근 ${records.length}경기 Performance: ${records.map((r) => money(r.performance)).join(", ")}`}>
      {records.map((r) => (
        <span key={r.id} className={r.performance == null ? "dnp" : ""}>
          <i style={{ height: `${r.performance == null ? 6 : Math.max(8, r.performance)}%` }} />
          <b className="num">{r.performance == null ? "—" : r.performance}</b>
          <small>{dateText(r.playedAt, false).slice(6)}</small>
        </span>
      ))}
    </div>
  );
}
export function PlayerDetail() {
  const params = useParams();
  const { data, status, mock, getPlayer, getTeam, getLeague } = usePlatform();
  const p: Player | undefined = getPlayer(String(params.id));
  const [period, setPeriod] = useState("1개월"),
    [tab, setTab] = useState("최근 경기");
  const owned = data.member?.holdings.find((h) => h.playerId === p?.id);
  const team = getTeam(p?.team);
  const posts = data.posts.filter((post) => post.scope === "player" && post.target === p?.id).slice(0, 3);
  if (!p)
    return (
      <>
        <BackLink />
        <section className="panel">
          {status === "ready" ? (
            <Empty title="선수를 찾을 수 없습니다" description="주소가 올바른지 확인하거나 선수 목록에서 다시 찾아보세요." action={<Link className="button primary small" href="/players">선수 탐색</Link>} />
          ) : <DataEmpty entity="선수" />}
        </section>
      </>
    );
  const points = seriesForDays(p.history, period === "1주" ? 7 : period === "2주" ? 14 : 30);
  const high = points.length ? Math.max(...points.map((x) => x.value)) : null,
    low = points.length ? Math.min(...points.map((x) => x.value)) : null;
  return (
    <>
      <BackLink />
      <section className="detail-hero">
        <div className="detail-photo"><PlayerPortrait player={p} size="xl" /></div>
        <div className="detail-identity">
          <span className="eyebrow">{getLeague(team?.leagueId)?.name || "PLAYER PROFILE"}</span>
          <h1>{p.name}</h1>
          <p className="detail-english">{p.english || "—"}</p>
          <div className="detail-meta">
            <span className="detail-club"><TeamBadge id={p.team} size="small" />{team?.name || "소속 정보 없음"}</span>
            <PositionBadge position={p.position} />
            <span>#{p.number ?? "—"}</span>
            <span>{p.country || "—"}</span>
            <span>{p.age != null ? `${p.age}세` : "—"}</span>
          </div>
        </div>
        <div className="detail-price">
          <span>현재 선수 가치</span>
          <strong className="num">{money(p.price)}<span className="unit">P</span></strong>
          <Change value={p.change} size="lg" />
          <small>최근 갱신 {dateText(p.updatedAt)}</small>
          <div className="detail-cta">
            <TradeButton player={p} side="buy" className="button primary large" label="매입하기" />
            <TradeButton player={owned ? p : undefined} side="sell" className="button secondary large" label="매각하기" />
            <WatchButton id={p.id} />
          </div>
          {p.status && <p className="detail-status">{p.status} · 현재 거래할 수 없습니다.</p>}
        </div>
      </section>
      <div className="stat-grid detail-stats">
        <StatCard label="최근 Performance" value={money(p.performance)} hint="최근 경기 기준" tone="yellow" />
        <StatCard label="시즌 득점 · 도움" value={`${money(p.goals)} · ${money(p.assists)}`} />
        <StatCard label="출전 시간" value={money(p.minutes)} unit="분" />
        <StatCard label="거래량" value={money(p.volume)} unit="건" />
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <div className="section-title">
              <h2>가치 흐름<span>MARKET VALUE</span></h2>
              <Tabs items={["1주", "2주", "1개월"]} value={period} onChange={setPeriod} variant="segment" label="기간 선택" />
            </div>
            <div className="chart-summary">
              <div><span>기간 최고</span><b className="num">{money(high)} P</b></div>
              <div><span>기간 최저</span><b className="num">{money(low)} P</b></div>
              <div><span>기간 변동</span><b>{points.length > 1 ? <Change value={((points[points.length - 1].value - points[0].value) / points[0].value) * 100} /> : "—"}</b></div>
            </div>
            <PriceChart points={points} />
          </section>
          <section className="panel">
            <Tabs items={["최근 경기", "가치 분석"]} value={tab} onChange={setTab} label="상세 정보" />
            {tab === "최근 경기" ? (
              <>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>경기</th>
                        <th>결과</th>
                        <th className="numeric">출전</th>
                        <th className="numeric">골</th>
                        <th className="numeric">도움</th>
                        <th className="numeric">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.records.map((r) => (
                        <tr key={r.id}>
                          <td><div className="two-line"><strong>vs {r.opponent}</strong><small>{dateText(r.playedAt, false)}</small></div></td>
                          <td><span className={`result-tag ${r.result?.includes("승") ? "win" : r.result?.includes("패") ? "loss" : ""}`}>{r.result || "—"}</span></td>
                          <td className="numeric">{r.minutes ? `${money(r.minutes)}′` : <span className="muted">미출전</span>}</td>
                          <td className="numeric">{money(r.goals)}</td>
                          <td className="numeric">{money(r.assists)}</td>
                          <td className="numeric strong">{money(r.performance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!p.records.length && <DataEmpty entity="경기 기록" />}
              </>
            ) : (
              <div className="analysis">
                <span className="tag ink"><Sparkles size={13} />AI 가치 분석{mock ? " · 예시" : ""}</span>
                <h3>경기력과 가치를 함께 읽어보세요.</h3>
                {p.analysis ? <p>{p.analysis}</p> : <DataEmpty entity="가치 분석" />}
                <p className="fine-print">AI 분석은 저장된 경기 기록과 가치 이력을 설명하는 보조 정보이며, 가치를 결정하지 않습니다.</p>
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel frame order-panel">
            <h2>내 보유 현황</h2>
            {owned ? (
              <dl className="summary-list">
                <div><dt>매입 금액</dt><dd>{money(owned.cost)} P</dd></div>
                <div><dt>현재 가치</dt><dd>{money(owned.value)} P</dd></div>
                <div><dt>평가손익</dt><dd className={(owned.profit ?? 0) >= 0 ? "up" : "down"}>{(owned.profit ?? 0) > 0 ? "+" : ""}{money(owned.profit)} P</dd></div>
                <div><dt>수익률</dt><dd><Change value={owned.returnRate} /></dd></div>
              </dl>
            ) : (
              <p className="order-empty">{data.session ? "아직 보유하지 않은 선수입니다." : "로그인 후 보유 현황을 확인할 수 있습니다."}</p>
            )}
            <div className="order-balance"><span>보유 포인트</span><b className="num">{money(data.member?.financialReady === false ? null : data.member?.points)} P</b></div>
          </section>
          <section className="panel">
            <SectionTitle title="최근 Performance" meta="최근 6경기" />
            <PerformanceBars player={p} />
          </section>
          <section className="panel lounge-preview">
            <SectionTitle title={`${p.short || p.name} 라운지`} href={`/community/players/${p.id}`} link="입장" />
            {posts.length ? (
              <ul>
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/community/posts/${post.id}`}>
                      <strong>{post.title}</strong>
                      <span>{post.author} · 댓글 {post.commentCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Link href={`/community/players/${p.id}`} className="lounge-empty"><MessageCircle size={18} />첫 이야기를 남겨보세요 <ArrowRight size={15} /></Link>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

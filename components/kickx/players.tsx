"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getPlayer,
  getTeam,
  leagues,
  money,
  players,
  teams,
} from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  BackLink,
  Change,
  DemoNote,
  Empty,
  PageHeading,
  PlayerAvatar,
  PlayerIdentity,
  PositionBadge,
  PriceChart,
  SectionTitle,
  Sparkline,
  Tabs,
  TeamBadge,
  TradeButton,
  WatchButton,
} from "./ui";
export function PlayerList({ market = false }: { market?: boolean }) {
  const sp = useSearchParams();
  const { state } = useDemo();
  const [q, setQ] = useState(sp.get("q") || "");
  const [league, setLeague] = useState("all");
  const [team, setTeam] = useState("all");
  const [pos, setPos] = useState("전체");
  const [sort, setSort] = useState(market ? "volume" : "price");
  const [view, setView] = useState(market ? "list" : "grid");
  const [tab, setTab] = useState("전체 선수");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setQ(sp.get("q") || "");
    setPage(1);
  }, [sp]);
  const results = useMemo(
    () =>
      players
        .filter((p) => {
          const t = getTeam(p.team);
          return (
            (!q ||
              `${p.name} ${p.english} ${t.name} ${t.english} ${t.league}`
                .toLowerCase()
                .includes(q.toLowerCase())) &&
            (league === "all" || t.league === league) &&
            (team === "all" || p.team === team) &&
            (pos === "전체" || p.position === pos) &&
            (tab !== "관심 선수" || state.watchlist.includes(p.id)) &&
            (tab !== "상승 선수" || p.change > 0) &&
            (tab !== "하락 선수" || p.change < 0)
          );
        })
        .sort((a, b) =>
          sort === "price"
            ? b.price - a.price
            : sort === "price-asc"
              ? a.price - b.price
              : sort === "change"
                ? b.change - a.change
                : sort === "performance"
                  ? b.performance - a.performance
                  : b.volume - a.volume,
        ),
    [q, league, team, pos, sort, tab, state.watchlist],
  );
  const pageCount = Math.max(1, Math.ceil(results.length / 12));
  const current = Math.min(page, pageCount);
  const visible = results.slice((current - 1) * 12, current * 12);
  const reset = () => {
    setQ("");
    setLeague("all");
    setTeam("all");
    setPos("전체");
    setTab("전체 선수");
    setPage(1);
  };
  return (
    <>
      <PageHeading
        eyebrow={market ? "PLAYER EXCHANGE" : "DISCOVER YOUR NEXT PLAYER"}
        title={market ? "선수 시장" : "선수 탐색"}
        description={
          market
            ? "경기의 흐름을 읽고, 다음 기회를 발견하세요."
            : "숫자 너머의 가능성. 나만의 선수를 찾아보세요."
        }
        action={
          <span className="quiet-label">
            <span className="blue-dot" />
            시연 데이터 · 09.25 기준
          </span>
        }
      />
      {market && (
        <div className="market-highlights">
          <div className="market-feature">
            <div>
              <span className="eyebrow">MARKET SPOTLIGHT</span>
              <h2>
                오늘의 움직임,
                <br />
                <em>내일의 가능성.</em>
              </h2>
              <Link className="text-link" href="/players/yamal">
                라민 야말 살펴보기 <ArrowRight size={15} />
              </Link>
            </div>
            <div className="market-feature-chart">
              <span>라민 야말</span>
              <strong>
                {money(13900)} <small>P</small>
              </strong>
              <Change value={5.6} />
              <Sparkline values={getPlayer("yamal")!.history} />
            </div>
          </div>
          <div className="market-stat">
            <span>
              전체 거래량 <BarChart3 size={18} />
            </span>
            <strong>
              {money(players.reduce((s, p) => s + p.volume, 0))}
              <small>건</small>
            </strong>
            <p>예시 24시간 집계</p>
            <div className="mini-bars">
              {[20, 35, 28, 48, 34, 63, 51, 74, 61, 90, 75, 100].map((v, i) => (
                <i key={i} style={{ height: `${v}%` }} />
              ))}
            </div>
          </div>
          <div className="market-stat">
            <span>
              상승 / 하락 <TrendingUp size={18} />
            </span>
            <strong className="up">
              {players.filter((p) => p.change > 0).length}
              <small className="muted"> / </small>
              <span className="down">
                {players.filter((p) => p.change < 0).length}
              </span>
            </strong>
            <p>전체 {players.length}명의 선수</p>
            <div className="ratio-bar">
              <span
                style={{
                  width: `${(players.filter((p) => p.change > 0).length / players.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
      <section className="panel player-browser">
        <div className="browser-tabs">
          <Tabs
            items={
              market
                ? ["전체 선수", "상승 선수", "하락 선수", "관심 선수"]
                : ["전체 선수", "관심 선수"]
            }
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
          />
          <div className="view-switch">
            <button
              aria-label="카드 보기"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={view === "grid" ? "active" : ""}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              aria-label="목록 보기"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={view === "list" ? "active" : ""}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="filter-row">
          <div className="input-search">
            <Search size={17} />
            <input
              aria-label="선수 검색"
              placeholder="이름 또는 구단 검색"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="리그 필터"
            value={league}
            onChange={(e) => {
              setLeague(e.target.value);
              setTeam("all");
              setPage(1);
            }}
          >
            <option value="all">모든 리그</option>
            {leagues.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select
            aria-label="구단 필터"
            value={team}
            onChange={(e) => {
              setTeam(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">모든 구단</option>
            {teams
              .filter((t) => league === "all" || t.league === league)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <button
            className="icon-button"
            aria-label="필터 초기화"
            title="필터 초기화"
            onClick={reset}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
        <div className="results-bar">
          <div className="position-filters">
            {["전체", "FW", "MF", "DF", "GK"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPos(p);
                  setPage(1);
                }}
                className={p === pos ? "active" : ""}
              >
                {p}
              </button>
            ))}
            <span className="result-count">{results.length}명의 선수</span>
          </div>
          <div className="sort-control">
            <ArrowDownWideNarrow size={15} />
            <select
              aria-label="선수 정렬"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="price">가격 높은 순</option>
              <option value="price-asc">가격 낮은 순</option>
              <option value="change">상승률 순</option>
              <option value="performance">Performance 순</option>
              <option value="volume">거래량 순</option>
            </select>
          </div>
        </div>
        {!visible.length ? (
          <Empty
            action={
              <button className="button secondary" onClick={reset}>
                필터 초기화
              </button>
            }
          />
        ) : view === "grid" ? (
          <div className="player-grid">
            {visible.map((p) => (
              <article className="player-card" key={p.id}>
                <div className="player-card-top">
                  <PositionBadge position={p.position} />
                  <WatchButton id={p.id} />
                </div>
                <Link href={`/players/${p.id}`} className="player-card-main">
                  <PlayerAvatar player={p} large />
                  <h3>{p.name}</h3>
                  <span>{p.english}</span>
                  <p>
                    <TeamBadge id={p.team} size="small" />
                    {getTeam(p.team).name}
                  </p>
                </Link>
                <div className="player-card-price">
                  <strong>
                    {money(p.price)} <small>P</small>
                  </strong>
                  <Change value={p.change} />
                </div>
                <div className="player-card-bottom">
                  <span>
                    Performance <b>{p.performance}</b>
                  </span>
                  <Link
                    href={`/players/${p.id}`}
                    aria-label={`${p.name} 상세 보기`}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>
                {state.holdings.some((h) => h.playerId === p.id) && (
                  <span className="owned-tag">
                    <Check size={11} />
                    보유
                  </span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table market-table">
              <thead>
                <tr>
                  <th aria-label="관심" />
                  <th>선수</th>
                  <th className="numeric">현재 가치</th>
                  <th className="numeric">등락률</th>
                  <th>최근 30일</th>
                  <th className="numeric">Performance</th>
                  <th className="numeric">거래량</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <WatchButton id={p.id} />
                    </td>
                    <td>
                      <PlayerIdentity player={p} />
                    </td>
                    <td className="numeric strong">
                      {money(p.price)} <small>P</small>
                    </td>
                    <td className="numeric">
                      <Change value={p.change} />
                    </td>
                    <td>
                      <Sparkline values={p.history} down={p.change < 0} />
                    </td>
                    <td className="numeric">
                      <span className="performance-number">
                        {p.performance}
                      </span>
                    </td>
                    <td className="numeric muted">{money(p.volume)}</td>
                    <td>
                      <TradeButton
                        player={p}
                        side={
                          state.holdings.some((h) => h.playerId === p.id)
                            ? "sell"
                            : "buy"
                        }
                        className="button secondary small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            {results.length
              ? `${(current - 1) * 12 + 1}–${Math.min(current * 12, results.length)} / ${results.length}명`
              : "0명"}
          </span>
          <div>
            <button
              aria-label="이전 페이지"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                className={current === i + 1 ? "active" : ""}
                onClick={() => setPage(i + 1)}
                aria-label={`${i + 1}페이지`}
              >
                {i + 1}
              </button>
            ))}
            <button
              aria-label="다음 페이지"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <DemoNote />
    </>
  );
}
export function PlayerDetail() {
  const params = useParams();
  const p = getPlayer(String(params.id));
  const { state } = useDemo();
  const [period, setPeriod] = useState("1개월");
  const [tab, setTab] = useState("최근 경기");
  if (!p)
    return (
      <Empty
        title="선수를 찾을 수 없습니다"
        description="선수 목록에서 다시 선택해 주세요."
        action={
          <Link className="button primary" href="/players">
            선수 탐색
          </Link>
        }
      />
    );
  const owned = state.holdings.find((h) => h.playerId === p.id);
  const chart =
    period === "1주"
      ? p.history.slice(-7)
      : period === "2주"
        ? p.history.slice(-14)
        : p.history;
  return (
    <>
      <BackLink />
      <section className="player-profile panel">
        <div className="player-profile-identity">
          <PlayerAvatar player={p} large />
          <div>
            <div className="eyebrow">
              {getTeam(p.team).league} <i> / </i> {p.country}
            </div>
            <h1>{p.name}</h1>
            <p>{p.english}</p>
            <div className="inline-meta">
              <TeamBadge id={p.team} size="small" />
              {getTeam(p.team).name}
              <PositionBadge position={p.position} />
              <span>
                {p.age}세 · #{p.number}
              </span>
            </div>
          </div>
        </div>
        <div className="player-profile-price">
          <WatchButton id={p.id} />
          <span>현재 선수 가치</span>
          <strong>
            {money(p.price)} <small>P</small>
          </strong>
          <Change value={p.change} />
        </div>
      </section>
      <div className="detail-layout">
        <div>
          <section className="panel chart-panel">
            <SectionTitle title="가격 흐름" meta="MARKET PRICE" />
            <div className="chart-summary">
              <div>
                <strong>
                  {money(p.price)} <small>P</small>
                </strong>
                <span>마지막 예시 가격 · 09.25 19:45</span>
              </div>
              <Tabs
                items={["1주", "2주", "1개월"]}
                value={period}
                onChange={setPeriod}
              />
            </div>
            <PriceChart
              values={chart}
              labels={
                period === "1주"
                  ? ["09.19", "09.21", "09.23", "09.25"]
                  : period === "2주"
                    ? ["09.12", "09.16", "09.20", "09.25"]
                    : undefined
              }
            />
          </section>
          <section className="panel records-panel">
            <Tabs
              items={["최근 경기", "시즌 기록", "가치 분석"]}
              value={tab}
              onChange={setTab}
            />
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
                      {[0, 1, 2, 3, 4].map((n) => (
                        <tr key={n}>
                          <td>
                            <div className="two-line">
                              <strong>
                                {
                                  ["09.24", "09.20", "09.16", "09.12", "09.06"][
                                    n
                                  ]
                                }{" "}
                                <span className="muted">vs</span>{" "}
                                {teams.filter((t) => t.id !== p.team)[n].name}
                              </strong>
                              <small>예시 경기 기록</small>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`result-badge ${n === 2 ? "draw" : "win"}`}
                            >
                              {n === 2 ? "D" : "W"}
                            </span>{" "}
                            <span className="muted">
                              {n === 2 ? "1 : 1" : "2 : 0"}
                            </span>
                          </td>
                          <td className="numeric">{90 - n * 3}′</td>
                          <td className="numeric">
                            {p.position === "FW" ? (n % 2 === 0 ? 2 : 0) : 0}
                          </td>
                          <td className="numeric">
                            {p.position === "MF" ? 1 : 0}
                          </td>
                          <td className="numeric">
                            <span className="score-pill">
                              {p.performance - n * 2}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DemoNote>
                  경기 기록과 Performance는 화면 확인용 샘플이며 계산 공식은
                  미확정입니다.
                </DemoNote>
              </>
            ) : tab === "시즌 기록" ? (
              <div className="season-stats">
                {[
                  ["출전 시간", `${p.minutes}′`],
                  ["득점", p.goals],
                  ["도움", p.assists],
                  ["Performance", p.performance],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-panel">
                <span className="eyebrow">PERFORMANCE ≠ MARKET PRICE</span>
                <h3>경기력과 가격을 함께 살펴보세요.</h3>
                <p>
                  {p.name}의 예시 Performance는 <strong>{p.performance}</strong>
                  , 가격 변동률은{" "}
                  <strong>
                    {p.change > 0 ? "+" : ""}
                    {p.change}%
                  </strong>
                  입니다. Performance는 한 경기의 활약을 나타내고, 시장 가격은
                  거래에 사용하는 가상 포인트입니다.
                </p>
                <DemoNote>
                  저장된 예시 수치를 설명하는 화면입니다. AI 리포트와 실제 가치
                  계산은 연결 전입니다.
                </DemoNote>
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel order-panel">
            <SectionTitle title="선수 거래" />
            <div className="holding-status">
              <span className="blue-dot" />
              {owned ? "내가 보유한 선수" : "새로운 스쿼드의 가능성"}
            </div>
            <dl className="summary-list">
              <div>
                <dt>현재 가치</dt>
                <dd>{money(p.price)} P</dd>
              </div>
              <div>
                <dt>보유 포인트</dt>
                <dd>{money(state.points)} P</dd>
              </div>
              {owned && (
                <>
                  <div>
                    <dt>매입가</dt>
                    <dd>{money(owned.cost)} P</dd>
                  </div>
                  <div>
                    <dt>평가손익</dt>
                    <dd className={p.price >= owned.cost ? "up" : "down"}>
                      {money(p.price - owned.cost)} P
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <TradeButton
              player={p}
              side={owned ? "sell" : "buy"}
              className="button primary full"
            />
            <p className="fine-print">
              실제 금전이 사용되지 않는 데모 거래입니다.
            </p>
          </section>
          <section className="panel performance-panel">
            <span className="eyebrow">LAST PERFORMANCE</span>
            <div className="performance-big">
              {p.performance}
              <small>/ 100</small>
            </div>
            <div className="meter">
              <span style={{ width: `${p.performance}%` }} />
            </div>
            <p>최근 예시 경기의 활약도</p>
          </section>
          <Link
            href={`/community/players/${p.id}`}
            className="panel community-cta"
          >
            <Users size={22} />
            <div>
              <strong>{p.short} 라운지</strong>
              <span>선수에 대한 이야기 나누기</span>
            </div>
            <ArrowRight size={18} />
          </Link>
        </aside>
      </div>
    </>
  );
}

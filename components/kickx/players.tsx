"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { dateText, money, seriesForDays } from "@/lib/kickx/data";
import type { Player } from "@/lib/kickx/types";
import { usePlatform } from "./provider";
import {
  BackLink,
  Change,
  DataEmpty,
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
function compareNumber(a: number | null, b: number | null, ascending = false) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return ascending ? a - b : b - a;
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
        `${p.name} ${p.english || ""} ${t?.name || ""} ${t?.english || ""} ${l?.name || ""}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()) &&
        (league === "all" || t?.leagueId === league) &&
        (team === "all" || p.team === team) &&
        (pos === "전체" || p.position === pos) &&
        (tab !== "관심 선수" || data.member?.watchlist.includes(p.id)) &&
        (tab !== "상승 선수" || (p.change != null && p.change > 0)) &&
        (tab !== "하락 선수" || (p.change != null && p.change < 0))
      );
    })
    .sort((a, b) => {
      const key = (sort === "price-asc" ? "price" : sort) as
        | "price"
        | "change"
        | "performance"
        | "volume";
      return compareNumber(a[key], b[key], sort === "price-asc");
    });
  const pageCount = Math.max(1, Math.ceil(results.length / 12)),
    current = Math.min(page, pageCount),
    visible = results.slice((current - 1) * 12, current * 12);
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
            {data.updatedAt
              ? `최근 갱신 ${dateText(data.updatedAt)}`
              : "데이터 준비 중"}
          </span>
        }
      />
      {market && (
        <div className="market-highlights">
          <div className="market-feature">
            <div>
              <span className="eyebrow">PLAYER MARKET</span>
              <h2>
                오늘의 움직임,
                <br />
                <em>내일의 가능성.</em>
              </h2>
              <p className="muted">경기력과 시장 가격을 함께 살펴보세요.</p>
            </div>
            <TrendingUp size={60} className="market-empty-icon" />
          </div>
          <div className="market-stat">
            <span>
              전체 거래량 <BarChart3 size={18} />
            </span>
            <strong>
              {money(data.market?.volume)}
              <small>건</small>
            </strong>
            <p>
              {data.market?.calculatedAt
                ? dateText(data.market.calculatedAt)
                : "집계 대기"}
            </p>
          </div>
          <div className="market-stat">
            <span>
              상승 / 하락 <TrendingUp size={18} />
            </span>
            <strong>
              <span className="up">{money(data.market?.rising)}</span>
              <small> / </small>
              <span className="down">{money(data.market?.falling)}</span>
            </strong>
            <p>선수별 가격 변동</p>
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
              <LayoutGrid size={18} />
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
            {data.leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
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
            {data.teams
              .filter((t) => league === "all" || t.leagueId === league)
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
            <span className="result-count">
              {status === "ready" ? `${results.length}명의 선수` : "—"}
            </span>
          </div>
          <div className="sort-control">
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
        {view === "grid" && visible.length > 0 ? (
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
                  <span>{p.english || "—"}</span>
                  <p>
                    <TeamBadge id={p.team} size="small" />
                    {getTeam(p.team)?.name || "소속 정보 없음"}
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
                    Performance <b>{money(p.performance)}</b>
                  </span>
                  <Link
                    href={`/players/${p.id}`}
                    aria-label={`${p.name} 상세 보기`}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>
                {data.member?.holdings.some((h) => h.playerId === p.id) && (
                  <span className="owned-tag">보유</span>
                )}
              </article>
            ))}
          </div>
        ) : view === "list" ? (
          <div className="table-scroll">
            <table className="data-table market-table">
              <thead>
                <tr>
                  <th aria-label="관심" />
                  <th>선수</th>
                  <th className="numeric">현재 가치</th>
                  <th className="numeric">등락률</th>
                  <th>가격 추이</th>
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
                    <td className="numeric strong">{money(p.price)} P</td>
                    <td className="numeric">
                      <Change value={p.change} />
                    </td>
                    <td>
                      <Sparkline
                        values={p.history.map((v) => v.value)}
                        down={(p.change ?? 0) < 0}
                      />
                    </td>
                    <td className="numeric">{money(p.performance)}</td>
                    <td className="numeric">{money(p.volume)}</td>
                    <td>
                      <TradeButton
                        player={p}
                        side={
                          data.member?.holdings.some((h) => h.playerId === p.id)
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
        ) : null}
        {!visible.length && (
          <DataEmpty entity="선수" filtered={data.players.length > 0} />
        )}
        <div className="pagination">
          <span>
            {status === "ready" ? `총 ${results.length}명` : "데이터 대기"}
          </span>
          <div>
            <button
              aria-label="이전 페이지"
              disabled={!results.length || current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>{results.length ? `${current} / ${pageCount}` : "—"}</span>
            <button
              aria-label="다음 페이지"
              disabled={!results.length || current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
export function PlayerDetail() {
  const params = useParams();
  const { data, status, getPlayer, getTeam, getLeague } = usePlatform();
  const p: Player | undefined = getPlayer(String(params.id));
  const [period, setPeriod] = useState("1개월"),
    [tab, setTab] = useState("최근 경기");
  const owned = data.member?.holdings.find((h) => h.playerId === p?.id);
  return (
    <>
      <BackLink />
      <section className="player-profile panel">
        <div className="player-profile-identity">
          {p && <PlayerAvatar player={p} large />}
          <div>
            <div className="eyebrow">
              {getLeague(getTeam(p?.team)?.leagueId)?.name || "PLAYER PROFILE"}
            </div>
            <h1>{p?.name || "선수 상세"}</h1>
            <p>
              {p?.english ||
                (status === "ready"
                  ? "선수를 찾을 수 없습니다"
                  : "선수 정보가 준비되면 표시됩니다")}
            </p>
            <div className="inline-meta">
              <TeamBadge id={p?.team || null} size="small" />
              {getTeam(p?.team)?.name || "소속 정보 없음"}
              <PositionBadge position={p?.position || null} />
              <span>{p?.country || "—"}</span>
            </div>
          </div>
        </div>
        <div className="player-profile-price">
          {p && <WatchButton id={p.id} />}
          <span>현재 선수 가치</span>
          <strong>
            {money(p?.price)} <small>P</small>
          </strong>
          <Change value={p?.change} />
        </div>
      </section>
      <div className="detail-layout">
        <div>
          <section className="panel chart-panel">
            <SectionTitle title="가격 흐름" meta="MARKET PRICE" />
            <div className="chart-summary">
              <div>
                <strong>
                  {money(p?.price)} <small>P</small>
                </strong>
                <span>최근 갱신 {dateText(p?.updatedAt)}</span>
              </div>
              <Tabs
                items={["1주", "2주", "1개월"]}
                value={period}
                onChange={setPeriod}
              />
            </div>
            <PriceChart
              points={seriesForDays(
                p?.history || [],
                period === "1주" ? 7 : period === "2주" ? 14 : 30,
              )}
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
                      {p?.records.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="two-line">
                              <strong>{r.opponent}</strong>
                              <small>{dateText(r.playedAt, false)}</small>
                            </div>
                          </td>
                          <td>{r.result || "—"}</td>
                          <td className="numeric">{money(r.minutes)}′</td>
                          <td className="numeric">{money(r.goals)}</td>
                          <td className="numeric">{money(r.assists)}</td>
                          <td className="numeric">{money(r.performance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!p?.records.length && <DataEmpty entity="경기 기록" />}
              </>
            ) : tab === "시즌 기록" ? (
              <div className="season-stats">
                {[
                  ["출전 시간", p?.minutes],
                  ["득점", p?.goals],
                  ["도움", p?.assists],
                  ["Performance", p?.performance],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>{money(value as number | undefined)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-panel">
                <span className="eyebrow">PERFORMANCE ≠ MARKET PRICE</span>
                <h3>경기력과 가격을 함께 살펴보세요.</h3>
                {p?.analysis ? (
                  <p>{p.analysis}</p>
                ) : (
                  <DataEmpty entity="가치 분석" />
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel order-panel">
            <SectionTitle title="선수 거래" />
            <dl className="summary-list">
              <div>
                <dt>현재 가치</dt>
                <dd>{money(p?.price)} P</dd>
              </div>
              <div>
                <dt>보유 포인트</dt>
                <dd>{money(data.member?.points)} P</dd>
              </div>
              {owned && (
                <>
                  <div>
                    <dt>매입 금액</dt>
                    <dd>{money(owned.cost)} P</dd>
                  </div>
                  <div>
                    <dt>평가손익</dt>
                    <dd>{money(owned.profit)} P</dd>
                  </div>
                </>
              )}
            </dl>
            <TradeButton
              player={p}
              side={owned ? "sell" : "buy"}
              className="button primary full"
            />
            <p className="fine-print">거래 서비스 준비 중입니다.</p>
          </section>
          <section className="panel performance-panel">
            <span className="eyebrow">LAST PERFORMANCE</span>
            <div className="performance-big">{money(p?.performance)}</div>
            <p>최근 경기의 활약도</p>
          </section>
          {p && (
            <Link
              href={`/community/players/${p.id}`}
              className="panel community-cta"
            >
              <Users size={22} />
              <div>
                <strong>{p.name} 라운지</strong>
                <span>선수에 대한 이야기 나누기</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  Wallet,
} from "lucide-react";
import { getPlayer, money } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  Change,
  DemoNote,
  Empty,
  PageHeading,
  PlayerIdentity,
  PriceChart,
  SectionTitle,
  Tabs,
  TradeButton,
} from "./ui";
export function PortfolioScreen() {
  const { state } = useDemo();
  const [period, setPeriod] = useState("1개월");
  const [tab, setTab] = useState("보유 선수");
  const value = state.holdings.reduce(
    (s, h) => s + getPlayer(h.playerId)!.price,
    0,
  );
  const cost = state.holdings.reduce((s, h) => s + h.cost, 0);
  const total = state.points + value;
  const gain = total - state.baseline;
  const series = [
    118900,
    120450,
    119650,
    122000,
    121850,
    124200,
    125940,
    124980,
    129120,
    128420,
    131700,
    total,
  ];
  const history = period === "1주" ? series.slice(-7) : series;
  return (
    <>
      <PageHeading
        eyebrow="YOUR PORTFOLIO"
        title="내 자산"
        description="선택의 기록이 쌓여, 나만의 포트폴리오가 됩니다."
        action={
          <Link className="button secondary" href="/transactions">
            <History size={17} />
            거래 내역
          </Link>
        }
      />
      <div className="portfolio-top">
        <section className="panel asset-overview">
          <span className="eyebrow">TOTAL ASSETS</span>
          <div className="asset-total">
            {money(total)} <small>P</small>
          </div>
          <div className="inline-meta">
            <Change value={(gain / state.baseline) * 100} />
            <span>
              기준 자산 대비 {gain >= 0 ? "+" : ""}
              {money(gain)} P
            </span>
          </div>
          <div className="asset-split">
            <div>
              <span>보유 포인트</span>
              <strong>
                {money(state.points)} <small>P</small>
              </strong>
            </div>
            <div>
              <span>선수 자산</span>
              <strong>
                {money(value)} <small>P</small>
              </strong>
            </div>
            <div>
              <span>선수 평가손익</span>
              <strong className={value >= cost ? "up" : "down"}>
                {value >= cost ? "+" : ""}
                {money(value - cost)} <small>P</small>
              </strong>
            </div>
          </div>
        </section>
        <section className="panel allocation-panel">
          <SectionTitle title="자산 구성" />
          <div className="allocation-content">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#4389ff 0 ${(value / total) * 100}%, #26456d ${(value / total) * 100}% 100%)`,
              }}
            >
              <div>
                <Wallet size={23} />
                <strong>
                  {state.holdings.length}
                  <small>명 보유</small>
                </strong>
              </div>
            </div>
            <div>
              <p>
                <span className="legend-dot" />
                선수 자산 <b>{((value / total) * 100).toFixed(1)}%</b>
              </p>
              <p>
                <span className="legend-dot secondary" />
                포인트 <b>{((state.points / total) * 100).toFixed(1)}%</b>
              </p>
              <Link className="text-link" href="/market">
                다음 선수 찾기 <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
      <section className="panel chart-panel asset-chart">
        <div className="section-title">
          <h2>
            자산 흐름 <span>예시 추이</span>
          </h2>
          <Tabs items={["1주", "1개월"]} value={period} onChange={setPeriod} />
        </div>
        <PriceChart
          values={history}
          label="총자산"
          labels={
            period === "1주" ? ["09.19", "09.21", "09.23", "09.25"] : undefined
          }
        />
      </section>
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["보유 선수", "평가손익 순"]}
            value={tab}
            onChange={setTab}
          />
          <span className="muted">총 {state.holdings.length}명</span>
        </div>
        {state.holdings.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th className="numeric">매입가</th>
                  <th className="numeric">현재 가치</th>
                  <th className="numeric">평가손익</th>
                  <th className="numeric">수익률</th>
                  <th>스쿼드</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...state.holdings]
                  .sort((a, b) =>
                    tab === "평가손익 순"
                      ? getPlayer(b.playerId)!.price -
                        b.cost -
                        (getPlayer(a.playerId)!.price - a.cost)
                      : 0,
                  )
                  .map((h) => {
                    const p = getPlayer(h.playerId)!;
                    return (
                      <tr key={p.id}>
                        <td>
                          <PlayerIdentity player={p} />
                        </td>
                        <td className="numeric muted">{money(h.cost)} P</td>
                        <td className="numeric strong">{money(p.price)} P</td>
                        <td
                          className={`numeric ${p.price >= h.cost ? "up" : "down"}`}
                        >
                          {p.price >= h.cost ? "+" : ""}
                          {money(p.price - h.cost)} P
                        </td>
                        <td className="numeric">
                          <Change value={((p.price - h.cost) / h.cost) * 100} />
                        </td>
                        <td>
                          <span
                            className={`status-pill ${state.squad.includes(p.id) ? "blue" : ""}`}
                          >
                            {state.squad.includes(p.id) ? "등록" : "미등록"}
                          </span>
                        </td>
                        <td>
                          <TradeButton
                            player={p}
                            side="sell"
                            className="button secondary small"
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="아직 보유한 선수가 없습니다"
            description="시장에서 첫 번째 선수를 영입해 보세요."
            action={
              <Link className="button primary" href="/market">
                선수 시장
              </Link>
            }
          />
        )}
      </section>
      <DemoNote>
        총자산 = 보유 포인트 + 보유 선수 현재 가치. 차트의 과거 값은 예시이며
        마지막 값은 현재 데모 자산입니다.
      </DemoNote>
    </>
  );
}
export function TransactionsScreen() {
  const { state } = useDemo();
  const [tab, setTab] = useState("전체");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState("전체 기간");
  const list = state.transactions.filter((t) => {
    const p = getPlayer(t.playerId);
    return (
      (tab === "전체" || t.type === (tab === "매입" ? "buy" : "sell")) &&
      (!q ||
        p?.name.includes(q) ||
        p?.english.toLowerCase().includes(q.toLowerCase())) &&
      (period === "전체 기간" ||
        new Date(t.date).getTime() >= Date.now() - 7 * 86400000)
    );
  });
  return (
    <>
      <PageHeading
        eyebrow="YOUR TRADING HISTORY"
        title="거래 내역"
        description="모든 선택의 순간을 한곳에서 확인하세요."
        action={
          <Link className="button secondary" href="/portfolio">
            내 자산 <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="transaction-stats">
        <div>
          <span>누적 매입</span>
          <strong>
            {money(
              state.transactions
                .filter((t) => t.type === "buy")
                .reduce((s, t) => s + t.net, 0),
            )}{" "}
            <small>P</small>
          </strong>
        </div>
        <div>
          <span>누적 매각 정산</span>
          <strong>
            {money(
              state.transactions
                .filter((t) => t.type === "sell")
                .reduce((s, t) => s + t.net, 0),
            )}{" "}
            <small>P</small>
          </strong>
        </div>
        <div>
          <span>거래 건수</span>
          <strong>
            {state.transactions.length} <small>건</small>
          </strong>
        </div>
      </div>
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체", "매입", "매각"]}
            value={tab}
            onChange={setTab}
          />
          <div className="button-row">
            <div className="input-search">
              <Search size={16} />
              <input
                aria-label="거래 선수 검색"
                placeholder="거래 선수 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              aria-label="거래 기간"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>전체 기간</option>
              <option>최근 7일</option>
            </select>
          </div>
        </div>
        {list.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>거래 일시 (KST)</th>
                  <th>선수</th>
                  <th>유형</th>
                  <th className="numeric">거래 가격</th>
                  <th className="numeric">수수료</th>
                  <th className="numeric">정산액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td className="muted date-cell">
                      {new Intl.DateTimeFormat("ko-KR", {
                        timeZone: "Asia/Seoul",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(t.date))}
                    </td>
                    <td>
                      <PlayerIdentity player={getPlayer(t.playerId)!} />
                    </td>
                    <td>
                      <span className={`trade-type ${t.type}`}>
                        {t.type === "buy" ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}{" "}
                        {t.type === "buy" ? "매입" : "매각"}
                      </span>
                    </td>
                    <td className="numeric">{money(t.price)} P</td>
                    <td className="numeric muted">{money(t.fee)} P</td>
                    <td className="numeric strong">
                      {t.type === "buy" ? "-" : "+"}
                      {money(t.net)} P
                    </td>
                    <td>
                      <span className="status-pill green">완료</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="해당 거래 내역이 없습니다"
            description="기간이나 검색 조건을 변경해 주세요."
          />
        )}
      </section>
      <DemoNote>
        거래 시점의 가격과 수수료를 보존합니다. 화면의 기록은 이 브라우저의 데모
        거래입니다.
      </DemoNote>
    </>
  );
}

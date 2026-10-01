"use client";
import Link from "next/link";
import { useState } from "react";
import { History, Search, Wallet } from "lucide-react";
import { dateText, money, seriesForDays } from "@/lib/kickx/data";
import { usePlatform } from "./provider";
import {
  Change,
  DataEmpty,
  MemberNotice,
  PageHeading,
  PlayerIdentity,
  PriceChart,
  SectionTitle,
  Tabs,
  TradeButton,
} from "./ui";
export function PortfolioScreen() {
  const { data, getPlayer } = usePlatform();
  const member = data.member?.financialReady === false ? null : data.member;
  const [period, setPeriod] = useState("1개월"),
    [tab, setTab] = useState("보유 선수");
  const total = member?.totalAssets,
    value = member?.playerAssets,
    cash = member?.points;
  const allocation =
    total != null && total > 0 && value != null && cash != null
      ? Math.min(100, Math.max(0, (value / total) * 100))
      : null;
  const rows = [...(member?.holdings || [])].sort((a, b) =>
    tab === "평가손익 순"
      ? (b.profit ?? -Infinity) - (a.profit ?? -Infinity)
      : 0,
  );
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
      <MemberNotice />
      <div className="portfolio-top">
        <section className="panel asset-overview">
          <span className="eyebrow">TOTAL ASSETS</span>
          <div className="asset-total">
            {money(total)} <small>P</small>
          </div>
          <div className="inline-meta">
            <Change value={member?.returnRate} />
            <span>자산 수익률</span>
          </div>
          <div className="asset-split">
            {[
              ["보유 포인트", cash],
              ["선수 자산", value],
              ["평가손익", member?.profit],
            ].map(([label, amount]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <strong>
                  {money(amount as number | undefined)} <small>P</small>
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel allocation-panel">
          <SectionTitle title="자산 구성" />
          <div className="allocation-content">
            <div
              className="donut"
              style={{
                background:
                  allocation == null
                    ? "#e3e1d9"
                    : `conic-gradient(#ead11f 0 ${allocation}%, #242424 ${allocation}% 100%)`,
              }}
            >
              <div>
                <Wallet size={23} />
                <strong>
                  {member ? member.holdings.length : "—"}
                  <small>보유 선수</small>
                </strong>
              </div>
            </div>
            <div>
              <p>
                <span className="legend-dot" />
                선수 자산{" "}
                <b>{allocation == null ? "—" : `${allocation.toFixed(1)}%`}</b>
              </p>
              <p>
                <span className="legend-dot secondary" />
                포인트{" "}
                <b>
                  {allocation == null
                    ? "—"
                    : `${(100 - allocation).toFixed(1)}%`}
                </b>
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="panel chart-panel asset-chart">
        <div className="section-title">
          <h2>자산 흐름</h2>
          <Tabs items={["1주", "1개월"]} value={period} onChange={setPeriod} />
        </div>
        <PriceChart
          points={seriesForDays(
            member?.assetHistory || [],
            period === "1주" ? 7 : 30,
          )}
          label="총자산"
        />
      </section>
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["보유 선수", "평가손익 순"]}
            value={tab}
            onChange={setTab}
          />
          <span className="muted">{member ? `${rows.length}명` : "—"}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>선수</th>
                <th className="numeric">수량</th>
                <th className="numeric">매입 금액</th>
                <th className="numeric">현재 가치</th>
                <th className="numeric">평가손익</th>
                <th className="numeric">수익률</th>
                <th>스쿼드</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const p = getPlayer(h.playerId);
                return (
                  <tr key={h.id}>
                    <td>{p ? <PlayerIdentity player={p} /> : h.playerName}</td>
                    <td className="numeric">{money(h.quantity)}</td>
                    <td className="numeric">{money(h.cost)} P</td>
                    <td className="numeric">{money(h.value)} P</td>
                    <td className="numeric">{money(h.profit)} P</td>
                    <td className="numeric">
                      <Change value={h.returnRate} />
                    </td>
                    <td>
                      {member?.squad?.slots.includes(h.playerId)
                        ? "등록"
                        : "미등록"}
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
        {!rows.length && <DataEmpty financial entity="보유 선수" />}
      </section>
    </>
  );
}
export function TransactionsScreen() {
  const { data, getPlayer } = usePlatform();
  const member = data.member?.financialReady === false ? null : data.member;
  const [tab, setTab] = useState("전체"),
    [q, setQ] = useState(""),
    [period, setPeriod] = useState("전체 기간");
  const all = member?.transactions || [];
  const rows = all.filter(
    (t) =>
      (tab === "전체" || t.type === (tab === "매입" ? "buy" : "sell")) &&
      t.playerName.toLowerCase().includes(q.toLowerCase()) &&
      (period === "전체 기간" ||
        Date.parse(t.date) >= Date.now() - 7 * 86400000),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR TRADING HISTORY"
        title="거래 내역"
        description="모든 선택의 순간을 한곳에서 확인하세요."
        action={
          <Link className="button secondary" href="/portfolio">
            내 자산
          </Link>
        }
      />
      <MemberNotice />
      <div className="transaction-stats">
        <div>
          <span>조회된 매입 금액</span>
          <strong>
            {money(
              member
                ? all
                    .filter((t) => t.type === "buy")
                    .reduce((sum, t) => sum + t.net, 0)
                : null,
            )}{" "}
            <small>P</small>
          </strong>
        </div>
        <div>
          <span>조회된 매각 정산</span>
          <strong>
            {money(
              member
                ? all
                    .filter((t) => t.type === "sell")
                    .reduce((sum, t) => sum + t.net, 0)
                : null,
            )}{" "}
            <small>P</small>
          </strong>
        </div>
        <div>
          <span>거래 건수</span>
          <strong>
            {member ? all.length : "—"} <small>건</small>
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
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래 일시 (KST)</th>
                <th>선수</th>
                <th>유형</th>
                <th className="numeric">거래 가격</th>
                <th className="numeric">수량</th>
                <th className="numeric">수수료</th>
                <th className="numeric">정산액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const p = getPlayer(t.playerId);
                return (
                  <tr key={t.id}>
                    <td className="muted date-cell">{dateText(t.date)}</td>
                    <td>{p ? <PlayerIdentity player={p} /> : t.playerName}</td>
                    <td>
                      <span className={`trade-type ${t.type}`}>
                        {t.type === "buy" ? "매입" : "매각"}
                      </span>
                    </td>
                    <td className="numeric">{money(t.price)} P</td>
                    <td className="numeric">{money(t.quantity)}</td>
                    <td className="numeric">{money(t.fee)} P</td>
                    <td className="numeric">{money(t.net)} P</td>
                    <td>{t.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <DataEmpty financial entity="거래 내역" filtered={all.length > 0} />
        )}
      </section>
    </>
  );
}

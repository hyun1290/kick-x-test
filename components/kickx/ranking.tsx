"use client";
import { useState } from "react";
import { Award, Crown, Trophy } from "lucide-react";
import { getPlayer, getTeam, money, rankings } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import { Change, DemoNote, PageHeading, Tabs, TeamBadge } from "./ui";
export function RankingScreen() {
  const { state } = useDemo();
  const [period, setPeriod] = useState("주간");
  const [league, setLeague] = useState("전체 구단");
  const total =
    state.points +
    state.holdings.reduce((s, h) => s + getPlayer(h.playerId)!.price, 0);
  const gain = ((total - state.baseline) / state.baseline) * 100;
  const all = [
    ...rankings,
    {
      id: "me",
      name: state.profile.nickname,
      team: state.profile.team,
      asset: total,
      weekly: gain,
      monthly: gain,
    },
  ].sort((a, b) =>
    period === "주간" ? b.weekly - a.weekly : b.monthly - a.monthly,
  );
  const rows = all.filter(
    (r) => league === "전체 구단" || r.team === state.profile.team,
  );
  const mine = all.findIndex((r) => r.id === "me") + 1;
  return (
    <>
      <PageHeading
        eyebrow="THE LEADERBOARD"
        title="랭킹"
        description="축구를 보는 안목, 수익률로 증명하세요."
        action={
          <Tabs items={["주간", "월간"]} value={period} onChange={setPeriod} />
        }
      />
      <div className="ranking-banner">
        <div>
          <span className="eyebrow">
            {period === "주간" ? "WEEKLY" : "MONTHLY"} CHALLENGE
          </span>
          <h2>이번 {period === "주간" ? "주" : "달"}의 게임 체인저</h2>
          <p>
            {period === "주간" ? "2026.09.21 — 09.27" : "2026.09.01 — 09.30"}{" "}
            <i>·</i> 동일 기준 자산 대비 수익률
          </p>
        </div>
        <Trophy size={72} />
      </div>
      <div className="podium">
        {[all[1], all[0], all[2]].filter(Boolean).map((r) => {
          const rank = all.indexOf(r) + 1;
          return (
            <article className={`podium-card place-${rank}`} key={r.id}>
              <div className="podium-place">
                {rank === 1 ? <Crown size={25} /> : <Award size={22} />}
                <span>0{rank}</span>
              </div>
              <TeamBadge id={r.team} size="large" />
              <h3>{r.name}</h3>
              <p>{getTeam(r.team).name}</p>
              <strong>
                {(period === "주간" ? r.weekly : r.monthly) >= 0 ? "+" : ""}
                {(period === "주간" ? r.weekly : r.monthly).toFixed(1)}
                <small>%</small>
              </strong>
              <span className="podium-asset">{money(r.asset)} P</span>
            </article>
          );
        })}
      </div>
      <div className="my-rank-strip">
        <div>
          <span className="user-avatar">{state.profile.nickname[0]}</span>
          <strong>나의 {period} 순위</strong>
          <span className="muted">{state.profile.nickname}</span>
        </div>
        <div>
          <strong>#{mine}</strong>
          <Change value={gain} />
        </div>
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>
            전체 순위 <span>{rows.length}명 · 예시 사용자</span>
          </h2>
          <select
            aria-label="랭킹 구단 필터"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
          >
            <option>전체 구단</option>
            <option>내 응원 구단</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>사용자</th>
                <th>응원 구단</th>
                <th className="numeric">총자산</th>
                <th className="numeric">{period} 수익률</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.id === "me" ? "my-row" : ""}>
                  <td className="rank-index">{all.indexOf(r) + 1}</td>
                  <td>
                    <div className="rank-user">
                      <span className="user-avatar small">{r.name[0]}</span>
                      <strong>{r.name}</strong>
                      {r.id === "me" && (
                        <span className="status-pill blue">나</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="inline-meta">
                      <TeamBadge id={r.team} size="small" />
                      {getTeam(r.team).name}
                    </div>
                  </td>
                  <td className="numeric">{money(r.asset)} P</td>
                  <td className="numeric">
                    <Change value={period === "주간" ? r.weekly : r.monthly} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <DemoNote>
        기간별 다른 예시 순위를 제공합니다. 나의 수익률은 현재 데모 자산을
        기준으로 계산하며 실제 집계·동률 정책은 확정 전입니다.
      </DemoNote>
    </>
  );
}

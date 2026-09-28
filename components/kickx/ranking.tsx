"use client";
import { useState } from "react";
import { Crown, Trophy } from "lucide-react";
import { dateText, money, percent } from "@/lib/kickx/data";
import { usePlatform } from "./provider";
import { Change, DataEmpty, PageHeading, Tabs, TeamBadge } from "./ui";
export function RankingScreen() {
  const { data, getTeam } = usePlatform();
  const [period, setPeriod] = useState("주간"),
    [club, setClub] = useState("전체 구단");
  const result = data.rankings.find(
    (r) => r.id === (period === "주간" ? "weekly" : "monthly"),
  );
  const rows = (result?.rows || [])
    .filter(
      (r) =>
        club === "전체 구단" ||
        (!!data.session?.profile?.team && r.team === data.session.profile.team),
    )
    .sort((a, b) => a.rank - b.rank);
  const mine = result?.rows.find((r) => r.userId === data.session?.userId);
  return (
    <>
      <PageHeading
        eyebrow="THE LEADERBOARD"
        title="랭킹"
        description="축구를 보는 안목, 기록으로 확인하세요."
        action={
          <Tabs items={["주간", "월간"]} value={period} onChange={setPeriod} />
        }
      />
      <div className="ranking-banner">
        <div>
          <span className="eyebrow">
            {period === "주간" ? "WEEKLY" : "MONTHLY"} RANKING
          </span>
          <h2>이번 {period === "주간" ? "주" : "달"}의 게임 체인저</h2>
          <p>
            {result
              ? `${dateText(result.startsAt, false)} — ${dateText(result.endsAt, false)}`
              : "랭킹 집계 대기"}
          </p>
        </div>
        <Trophy size={72} />
      </div>
      {rows.length > 0 && (
        <div className="podium">
          {rows.slice(0, 3).map((r) => (
            <article className={`podium-card place-${r.rank}`} key={r.userId}>
              <div className="podium-place">
                <Crown size={25} />
                <span>{r.rank}</span>
              </div>
              <TeamBadge id={r.team} size="large" />
              <h3>{r.nickname}</h3>
              <p>{getTeam(r.team)?.name || "응원 구단 없음"}</p>
              <strong>{percent(r.returnRate)}</strong>
              <span className="podium-asset">{money(r.assets)} P</span>
            </article>
          ))}
        </div>
      )}
      <div className="my-rank-strip">
        <div>
          <span className="user-avatar">
            {data.session?.profile?.nickname.slice(0, 1) || "—"}
          </span>
          <strong>나의 {period} 순위</strong>
        </div>
        <div>
          <strong>{mine ? `#${mine.rank}` : "—"}</strong>
          <Change value={mine?.returnRate} />
        </div>
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>전체 순위</h2>
          <select
            aria-label="랭킹 구단 필터"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          >
            <option>전체 구단</option>
            <option disabled={!data.session?.profile?.team}>
              내 응원 구단
            </option>
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
                <tr
                  key={r.userId}
                  className={r.userId === data.session?.userId ? "my-row" : ""}
                >
                  <td className="rank-index">{r.rank}</td>
                  <td>
                    <div className="rank-user">
                      <span className="user-avatar small">
                        {r.nickname.slice(0, 1)}
                      </span>
                      <strong>{r.nickname}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="inline-meta">
                      <TeamBadge id={r.team} size="small" />
                      {getTeam(r.team)?.name || "—"}
                    </div>
                  </td>
                  <td className="numeric">{money(r.assets)} P</td>
                  <td className="numeric">
                    <Change value={r.returnRate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <DataEmpty entity="랭킹" filtered={!!result?.rows.length} />
        )}
      </section>
    </>
  );
}

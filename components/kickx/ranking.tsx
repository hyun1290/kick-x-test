"use client";
import { useState } from "react";
import { dateText, money } from "@/lib/kickx/data";
import { usePlatform } from "./provider";
import { Change, DataEmpty, PageHeading, Tabs, TeamBadge } from "./ui";
export function RankingScreen() {
  const { data, getTeam } = usePlatform();
  const [period, setPeriod] = useState("주간"),
    [club, setClub] = useState("전체 구단");
  const result = data.rankings.find((r) => r.id === (period === "주간" ? "weekly" : "monthly"));
  const myTeam = data.session?.profile?.team;
  const rows = (result?.rows || []).filter((r) => club === "전체 구단" || (!!myTeam && r.team === myTeam)).sort((a, b) => a.rank - b.rank);
  const mine = result?.rows.find((r) => r.userId === data.session?.userId);
  const top = club === "전체 구단" ? rows.slice(0, 3) : [];
  return (
    <>
      <PageHeading
        eyebrow="THE LEADERBOARD"
        title="랭킹"
        description="초기 자산 대비 수익률로 경쟁합니다. 축구를 보는 안목을 기록으로 증명하세요."
        action={<Tabs items={["주간", "월간"]} value={period} onChange={setPeriod} variant="segment" label="랭킹 기간" />}
      />
      <div className="ranking-meta">
        <span className="tag ink">{period === "주간" ? "WEEKLY" : "MONTHLY"}</span>
        <span>{result ? `${dateText(result.startsAt, false)} — ${dateText(result.endsAt, false)}` : "랭킹 집계 대기"}</span>
        {result && <span className="muted">집계 {dateText(result.calculatedAt)}</span>}
      </div>
      {top.length > 0 && (
        <ol className="podium">
          {top.map((r) => (
            <li className={`podium-card place-${r.rank}`} key={r.userId}>
              <span className="podium-rank num">{String(r.rank).padStart(2, "0")}</span>
              <div className="podium-user">
                <TeamBadge id={r.team} size="large" />
                <div>
                  <strong>{r.nickname}</strong>
                  <span>{getTeam(r.team)?.name || "응원 구단 없음"}</span>
                </div>
              </div>
              <div className="podium-figures">
                <div><span>{period} 수익률</span><Change value={r.returnRate} size="lg" /></div>
                <div><span>총자산</span><b className="num">{money(r.assets)} P</b></div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="my-rank">
        <span className="my-rank-avatar">{data.session?.profile?.nickname.slice(0, 1) || "—"}</span>
        <div className="my-rank-text">
          <span>나의 {period} 순위</span>
          <strong>{data.session?.profile?.nickname || (data.session ? "내 계정" : "로그인 후 확인")}</strong>
        </div>
        <div className="my-rank-figure"><span>순위</span><b className="num">{mine ? `${mine.rank}위` : "—"}</b></div>
        <div className="my-rank-figure"><span>수익률</span><Change value={mine?.returnRate} /></div>
        <div className="my-rank-figure"><span>총자산</span><b className="num">{money(mine?.assets)} P</b></div>
      </div>
      <section className="panel flush">
        <div className="panel-head">
          <h2>전체 순위 <span className="muted num">{rows.length ? `${rows.length}명` : ""}</span></h2>
          <select aria-label="랭킹 구단 필터" value={club} onChange={(e) => setClub(e.target.value)} className="compact-select">
            <option>전체 구단</option>
            <option disabled={!myTeam}>내 응원 구단</option>
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
                <tr key={r.userId} className={r.userId === data.session?.userId ? "my-row" : ""}>
                  <td className={`rank-index num ${r.rank <= 3 ? "top" : ""}`}>{r.rank}</td>
                  <td>
                    <div className="rank-user">
                      <span className="rank-avatar">{r.nickname.slice(0, 1)}</span>
                      <strong>{r.nickname}</strong>
                      {r.userId === data.session?.userId && <span className="tag yellow">나</span>}
                    </div>
                  </td>
                  <td><span className="rank-club"><TeamBadge id={r.team} size="small" />{getTeam(r.team)?.name || "—"}</span></td>
                  <td className="numeric">{money(r.assets)} P</td>
                  <td className="numeric"><Change value={r.returnRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <DataEmpty entity="랭킹" filtered={!!result?.rows.length} />}
      </section>
    </>
  );
}

"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Trophy, Wallet } from "lucide-react";
import { dateText, money } from "@/lib/kickx/data";
import { usePlatform } from "./provider";
import {
  Change,
  DataEmpty,
  PlayerIdentity,
  SectionTitle,
  TeamBadge,
} from "./ui";
import { Pitch } from "./squad";
export function HomeScreen() {
  const { data, getTeam, getLeague } = usePlatform();
  const member = data.member;
  const trending = [...data.players]
    .filter((p) => p.change != null)
    .sort((a, b) => b.change! - a.change!)
    .slice(0, 5);
  return (
    <>
      <div className="home-welcome">
        <span>YOUR FOOTBALL, YOUR CALL.</span>
        <span>
          {data.updatedAt
            ? `최근 갱신 ${dateText(data.updatedAt)}`
            : "REAL FOOTBALL. YOUR GAME."}
        </span>
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span />
            REAL MATCH DATA × PLAYER MARKET
          </span>
          <h1>
            경기를 읽는 당신,
            <br />
            <em>가치를 만드는 선택.</em>
          </h1>
          <p>
            실제 축구의 흐름이 나만의 선수 자산으로.
            <br />
            KICK-X에서 다음 가능성을 발견하세요.
          </p>
          <Link href="/market" className="button primary">
            선수 시장 둘러보기 <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-caption">
          <span>THE BEAUTIFUL GAME.</span>
          <strong>A NEW WAY TO PLAY.</strong>
        </div>
      </section>
      <div className="home-stats">
        <Link href="/portfolio" className="stat-card">
          <div className="stat-label">
            <span>
              <Wallet size={17} />
              총자산
            </span>
            <ArrowUpRight size={17} />
          </div>
          <div className="stat-value">
            {money(member?.totalAssets)} <small>P</small>
          </div>
          <div className="stat-foot">
            <Change value={member?.returnRate} />
            <span>{member ? "자산 수익률" : "내 자산 정보가 표시됩니다"}</span>
          </div>
        </Link>
        <Link href="/portfolio" className="stat-card">
          <div className="stat-label">
            <span>보유 포인트</span>
            <ArrowUpRight size={17} />
          </div>
          <div className="stat-value">
            {money(member?.points)} <small>P</small>
          </div>
          <div className="stat-foot">
            <span>선수 자산</span>
            <b>{money(member?.playerAssets)} P</b>
          </div>
        </Link>
        <Link href="/ranking" className="stat-card ranking-stat">
          <div className="stat-label">
            <span>
              <Trophy size={17} />
              이번 주 랭킹
            </span>
            <ArrowUpRight size={17} />
          </div>
          <div className="stat-value">
            {member?.weeklyRank != null ? `#${member.weeklyRank}` : "—"}
            <span className="ranking-tag">WEEKLY</span>
          </div>
          <div className="stat-foot">
            <span>집계된 순위를 확인하세요</span>
          </div>
          <Trophy className="stat-watermark" size={70} />
        </Link>
      </div>
      <div className="home-bottom">
        <section className="panel home-market">
          <SectionTitle title="지금 주목할 선수" href="/market" />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>선수</th>
                  <th className="numeric">현재 가치</th>
                  <th className="numeric">등락률</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((p, i) => (
                  <tr key={p.id}>
                    <td className="rank-index">{i + 1}</td>
                    <td>
                      <PlayerIdentity player={p} />
                    </td>
                    <td className="numeric strong">{money(p.price)} P</td>
                    <td className="numeric">
                      <Change value={p.change} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!trending.length && <DataEmpty entity="선수" />}
          <div className="panel-bottom-note">
            <span className="blue-dot" />
            선수 가격 · 거래량 · 경기력 한눈에 확인하기
          </div>
        </section>
        <section className="panel fixtures-panel">
          <SectionTitle title="주요 경기" meta="KST" />
          {data.fixtures.map((f) => (
            <div className="fixture" key={f.id}>
              <div className="fixture-meta">
                <span>{getLeague(f.leagueId)?.name || "—"}</span>
                <span>{dateText(f.startsAt)}</span>
              </div>
              <div className="fixture-teams">
                <Link href={`/community/clubs/${f.home}`}>
                  <TeamBadge id={f.home} />
                  <span>{getTeam(f.home)?.name || "구단 정보 없음"}</span>
                </Link>
                <div>
                  <strong>VS</strong>
                  <span>{f.status}</span>
                </div>
                <Link href={`/community/clubs/${f.away}`}>
                  <TeamBadge id={f.away} />
                  <span>{getTeam(f.away)?.name || "구단 정보 없음"}</span>
                </Link>
              </div>
            </div>
          ))}
          {!data.fixtures.length && <DataEmpty entity="경기 일정" />}
        </section>
        <section className="panel home-squad">
          <SectionTitle title="내 스쿼드" href="/squad" link="관리" />
          <div className="squad-summary">
            <strong>
              {data.formations.find((f) => f.id === member?.squad?.formationId)
                ?.name || "포메이션 미선택"}
            </strong>
            <span>
              {member?.squad
                ? `${member.squad.slots.filter(Boolean).length}명`
                : "—"}
            </span>
          </div>
          <Pitch
            slots={member?.squad?.slots || []}
            formation={member?.squad?.formationId || null}
            compact
          />
          <div className="home-squad-footer">
            <span>선수단 가치</span>
            <strong>{money(member?.squad?.value)} P</strong>
          </div>
        </section>
      </div>
    </>
  );
}

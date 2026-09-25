"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Trophy,
  Wallet,
} from "lucide-react";
import { fixtures, getPlayer, getTeam, money, players } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  Change,
  PlayerIdentity,
  SectionTitle,
  Sparkline,
  TeamBadge,
} from "./ui";
import { Pitch } from "./squad";
export function HomeScreen() {
  const { state } = useDemo();
  const value = state.holdings.reduce(
    (s, h) => s + getPlayer(h.playerId)!.price,
    0,
  );
  const total = state.points + value;
  const gain = ((total - state.baseline) / state.baseline) * 100;
  const trending = [...players].sort((a, b) => b.change - a.change).slice(0, 5);
  return (
    <>
      <div className="home-welcome">
        <span>YOUR FOOTBALL, YOUR CALL.</span>
        <span>
          2026년 9월 25일 <i>금요일</i>
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
            {money(total)} <small>P</small>
          </div>
          <div className="stat-foot">
            <Change value={gain} />
            <span>기준 자산 대비</span>
          </div>
          <Sparkline
            values={[
              112000,
              115000,
              114000,
              119000,
              117000,
              124000,
              122000,
              total,
            ]}
          />
        </Link>
        <Link href="/portfolio" className="stat-card">
          <div className="stat-label">
            <span>보유 포인트</span>
            <ArrowUpRight size={17} />
          </div>
          <div className="stat-value">
            {money(state.points)} <small>P</small>
          </div>
          <div className="stat-foot">
            <span>선수 자산</span>
            <b>{money(value)} P</b>
          </div>
          <div className="stat-allocation">
            <span style={{ width: `${(state.points / total) * 100}%` }} />
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
            <small>#</small> 8 <span className="ranking-tag">WEEKLY</span>
          </div>
          <div className="stat-foot">
            <span>주간 수익률 경쟁</span>
            <b>예시 순위</b>
          </div>
          <Trophy className="stat-watermark" size={70} />
        </Link>
      </div>
      <div className="home-bottom">
        <section className="panel home-market">
          <SectionTitle title="지금 주목할 선수" meta="TOP 5" href="/market" />
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
                    <td className="rank-index">0{i + 1}</td>
                    <td>
                      <PlayerIdentity player={p} />
                    </td>
                    <td className="numeric strong">
                      {money(p.price)} <small>P</small>
                    </td>
                    <td className="numeric">
                      <Change value={p.change} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-bottom-note">
            <span className="blue-dot" />
            선수 가격 · 거래량 · 경기력 한눈에 확인하기
          </div>
        </section>
        <section className="panel fixtures-panel">
          <SectionTitle title="주요 경기" meta="KST" />
          {fixtures.map((f) => (
            <div className="fixture" key={f.id}>
              <div className="fixture-meta">
                <span>{f.league}</span>
                <span>
                  {f.date} ({f.day})
                </span>
              </div>
              <div className="fixture-teams">
                <Link href={`/community/clubs/${f.home}`}>
                  <TeamBadge id={f.home} />
                  <span>{getTeam(f.home).name}</span>
                </Link>
                <div>
                  <strong>{f.time}</strong>
                  <span>예정</span>
                </div>
                <Link href={`/community/clubs/${f.away}`}>
                  <TeamBadge id={f.away} />
                  <span>{getTeam(f.away).name}</span>
                </Link>
              </div>
            </div>
          ))}
          <p className="panel-bottom-note">
            <CalendarDays size={14} />
            실제 일정이 아닌 예시 경기입니다.
          </p>
        </section>
        <section className="panel home-squad">
          <SectionTitle title="내 스쿼드" href="/squad" link="편집" />
          <div className="squad-summary">
            <strong>{state.formation}</strong>
            <span>{state.squad.filter(Boolean).length} / 11명</span>
          </div>
          <Pitch slots={state.squad} formation={state.formation} compact />
          <div className="home-squad-footer">
            <span>선수단 가치</span>
            <strong>
              {money(
                state.squad.reduce(
                  (s, id) => s + (id ? getPlayer(id)!.price : 0),
                  0,
                ),
              )}{" "}
              P
            </strong>
          </div>
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  Home as HomeIcon,
  LayoutGrid,
  Search,
  Shield,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

const navItems = [
  { label: "홈", href: "/", icon: HomeIcon },
  { label: "선수", href: "/players", icon: Users },
  { label: "선수 시장", href: "/market", icon: TrendingUp },
  { label: "스쿼드", href: "/squad", icon: LayoutGrid },
  { label: "랭킹", href: "/ranking", icon: Trophy },
  { label: "커뮤니티", href: "/community", icon: Shield },
  { label: "마이페이지", href: "/mypage", icon: CircleUserRound },
];

const marketPlayers = [
  { name: "E. Haaland", team: "Manchester City", position: "FW", price: "15,200 P", change: "+4.2%", up: true },
  { name: "J. Bellingham", team: "Real Madrid", position: "MF", price: "13,850 P", change: "+3.1%", up: true },
  { name: "B. Saka", team: "Arsenal", position: "FW", price: "12,100 P", change: "+2.8%", up: true },
  { name: "H. Kane", team: "Bayern München", position: "FW", price: "14,400 P", change: "-1.2%", up: false },
  { name: "Rodri", team: "Manchester City", position: "MF", price: "11,760 P", change: "-1.8%", up: false },
];

const matches = [
  { league: "Premier League", home: "Arsenal", away: "Man City", time: "09.27 20:30" },
  { league: "LaLiga", home: "Barcelona", away: "Real Madrid", time: "09.28 04:00" },
  { league: "Bundesliga", home: "Bayern", away: "Leverkusen", time: "09.28 22:30" },
];

const squad = [
  { name: "Haaland", pos: "FW", top: "13%", left: "50%" },
  { name: "Saka", pos: "FW", top: "29%", left: "27%" },
  { name: "Bellingham", pos: "MF", top: "34%", left: "69%" },
  { name: "Rodri", pos: "MF", top: "51%", left: "50%" },
  { name: "Saliba", pos: "DF", top: "68%", left: "31%" },
  { name: "Dias", pos: "DF", top: "68%", left: "69%" },
  { name: "Alisson", pos: "GK", top: "84%", left: "50%" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/5 bg-[#081522] px-4 py-6">
        <Link href="/" className="mb-10 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-black text-white shadow-lg shadow-blue-500/20">
            KX
          </div>
          <div>
            <p className="text-lg font-black tracking-[0.18em] text-white">KICK-X</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Football Market</p>
          </div>
        </Link>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <Icon size={18} strokeWidth={1.9} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-slate-500">AVAILABLE POINTS</p>
          <div className="mt-2 flex items-center gap-2">
            <WalletCards size={18} className="text-blue-400" />
            <p className="text-lg font-bold text-white">38,420 P</p>
          </div>
        </div>
      </aside>

      <div className="ml-60 min-h-screen">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/5 bg-[#07111f]/90 px-8 backdrop-blur-xl">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="선수명, 구단, 리그 검색"
              className="h-11 w-full rounded-xl border border-white/5 bg-white/[0.04] pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/40 focus:bg-white/[0.06]"
            />
          </div>

          <div className="ml-8 flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="알림"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-slate-400 transition hover:text-white"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] py-1.5 pl-2 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-700 text-xs font-black text-white">
                K
              </div>
              <div className="hidden text-left xl:block">
                <p className="text-xs font-bold text-slate-100">KICK-X USER</p>
                <p className="text-[10px] text-slate-500">Manchester United</p>
              </div>
              <Link
                href="/mypage"
                className="ml-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                마이프로필
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-8 py-8">
          <section className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/5 bg-[#0c1c2e]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(37,99,235,0.26),transparent_34%),linear-gradient(120deg,rgba(6,18,33,0.98),rgba(10,31,54,0.86))]" />
            <div className="absolute -right-24 top-1/2 h-[440px] w-[620px] -translate-y-1/2 rotate-[-8deg] rounded-[50%] border border-blue-300/10" />
            <div className="absolute -right-4 top-1/2 h-[330px] w-[500px] -translate-y-1/2 rotate-[-8deg] rounded-[50%] border border-blue-300/10" />
            <div className="absolute right-36 top-1/2 h-[280px] w-px -translate-y-1/2 rotate-[-8deg] bg-blue-300/10" />
            <div className="absolute right-24 top-12 select-none text-[150px] font-black tracking-[-0.08em] text-white/[0.025]">
              KICK-X
            </div>

            <div className="relative z-10 flex min-h-[360px] max-w-3xl flex-col justify-center px-12 py-12">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                REAL MATCH DATA × PLAYER MARKET
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.18] tracking-tight text-white xl:text-5xl">
                실제 경기의 흐름이,
                <br />
                <span className="text-blue-400">당신의 선수 가치</span>가 된다.
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">
                실제 경기 데이터를 기반으로 선수를 분석하고 거래하세요.
                KICK-X에서 나만의 스쿼드와 자산을 성장시킬 수 있습니다.
              </p>

              <Link
                href="/market"
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                선수 시장 둘러보기
                <ChevronRight size={17} />
              </Link>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-[#0b1827] p-5">
              <p className="text-xs font-semibold text-slate-500">총자산</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-black text-white">128,340 P</p>
                <span className="text-xs font-bold text-emerald-400">+8.4%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0b1827] p-5">
              <p className="text-xs font-semibold text-slate-500">보유 포인트</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-black text-white">38,420 P</p>
                <span className="text-xs text-slate-500">거래 가능</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0b1827] p-5">
              <p className="text-xs font-semibold text-slate-500">이번 주 랭킹</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-black text-white">#23</p>
                <span className="text-xs font-bold text-blue-400">TOP 12%</span>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-[1.45fr_0.8fr] gap-6">
            <div className="rounded-[24px] border border-white/5 bg-[#0b1827] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-white">시장 급상승 선수</p>
                  <p className="mt-1 text-xs text-slate-500">최근 가치 변동이 큰 선수 TOP 5</p>
                </div>
                <Link href="/market" className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300">
                  전체 시장
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-white/5">
                {marketPlayers.map((player, index) => (
                  <Link
                    key={player.name}
                    href="/market"
                    className="grid grid-cols-[36px_1.4fr_0.7fr_0.7fr] items-center gap-3 py-3.5 transition hover:bg-white/[0.02]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-xs font-black text-slate-300">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{player.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {player.team} · {player.position}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold text-slate-300">{player.price}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-sm font-bold ${
                        player.up ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {player.up ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {player.change}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] border border-white/5 bg-[#0b1827] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">다가오는 경기</p>
                    <p className="mt-1 text-xs text-slate-500">주요 경기 일정</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={`${match.home}-${match.away}`} className="rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{match.league}</span>
                        <span className="text-[10px] font-semibold text-blue-400">{match.time}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-slate-200">
                        <span>{match.home}</span>
                        <span className="text-[10px] font-semibold text-slate-600">VS</span>
                        <span>{match.away}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/5 bg-[#0b1827] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">내 스쿼드</p>
                    <p className="mt-1 text-xs text-slate-500">현재 등록 선수 미리보기</p>
                  </div>
                  <Link href="/squad" className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300">
                    관리
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="relative h-56 overflow-hidden rounded-2xl border border-emerald-300/10 bg-[#0b342d]">
                  <div className="absolute inset-3 rounded-xl border border-white/10" />
                  <div className="absolute left-1/2 top-3 h-[calc(100%-24px)] w-px -translate-x-1/2 bg-white/10" />
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

                  {squad.map((player) => (
                    <div
                      key={player.name}
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                      style={{ top: player.top, left: player.left }}
                    >
                      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-blue-300/20 bg-[#102b49] text-[9px] font-black text-blue-200 shadow-lg shadow-black/20">
                        {player.pos}
                      </div>
                      <p className="mt-1 whitespace-nowrap text-[9px] font-semibold text-slate-200">{player.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

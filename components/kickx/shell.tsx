"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Globe2,
  Home,
  LayoutGrid,
  Menu,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
  X,
  History,
} from "lucide-react";
import { money, getTeam } from "@/lib/kickx/data";
import { useDemo } from "./provider";
const links = [
  { href: "/", label: "홈", icon: Home },
  { href: "/players", label: "선수 탐색", icon: Users },
  { href: "/market", label: "선수 시장", icon: Activity },
  { href: "/squad", label: "내 스쿼드", icon: LayoutGrid },
  { href: "/portfolio", label: "내 자산", icon: Wallet },
  { href: "/transactions", label: "거래 내역", icon: History },
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/community", label: "커뮤니티", icon: MessageCircle },
];
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="KICK-X 홈">
      KICK<span>-X</span>
      <small>FOOTBALL MARKET</small>
    </Link>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const standalone = pathname === "/login" || pathname === "/onboarding";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/players?q=${encodeURIComponent(query.trim())}`);
  };
  if (standalone) return <>{children}</>;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-button mobile-only"
            aria-label="메뉴 닫기"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="nav-label">PLAY THE GAME</div>
        <nav aria-label="주 메뉴">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={`nav-item ${(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "active" : ""}`}
              aria-current={
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              <Icon size={19} />
              {label}
              {href === "/market" && <span className="nav-tag">MARKET</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link
            href="/mypage"
            onClick={() => setMobile(false)}
            className={`nav-item ${pathname === "/mypage" ? "active" : ""}`}
          >
            <Settings2 size={18} />
            마이페이지
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobile(false)}
            className={`nav-item ${pathname.startsWith("/admin") ? "active" : ""}`}
          >
            <ShieldCheck size={18} />
            운영 관리 <span className="subtle-tag">데모</span>
          </Link>
          <Link href="/portfolio" className="sidebar-wallet">
            <span>
              보유 포인트 <ArrowUpRight size={15} />
            </span>
            <strong>
              {money(state.points)} <small>P</small>
            </strong>
            <div>나의 다음 선수를 만나보세요</div>
          </Link>
          <p className="sidebar-footer">REAL FOOTBALL. YOUR GAME.</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="메뉴 열기"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <form className="global-search" onSubmit={submit}>
            <Search size={19} />
            <input
              aria-label="선수, 구단, 리그 통합 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="선수, 구단, 리그를 검색하세요"
            />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-right">
            <span className="demo-pill">DEMO</span>
            <div className="notification-wrap">
              <button
                className="icon-button notification"
                aria-label="알림 열기"
                aria-expanded={alerts}
                onClick={() => setAlerts(!alerts)}
              >
                <Bell size={20} />
              </button>
              {alerts && (
                <div className="notification-popover">
                  <strong>알림</strong>
                  <p>지금은 시연 모드입니다.</p>
                  <span>
                    선수 거래와 스쿼드 변경은 이 브라우저에 저장됩니다.
                  </span>
                  <button
                    className="text-link"
                    onClick={() => setAlerts(false)}
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
            {state.signedIn ? (
              <Link className="profile-link" href="/mypage">
                <span className="user-avatar">
                  {state.profile.nickname.slice(0, 1)}
                </span>
                <div>
                  <strong>{state.profile.nickname}</strong>
                  <small>
                    {getTeam(state.profile.team)?.name || "응원 구단 선택"}
                  </small>
                </div>
                <ChevronDown size={15} />
              </Link>
            ) : (
              <Link className="button primary small" href="/login">
                로그인
              </Link>
            )}
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="page-footer">
          <span>
            © 2026 KICK-X <i>·</i> 실제 축구, 나만의 선택
          </span>
          <span>
            <Globe2 size={13} /> 가상 포인트 시연 <i>·</i> 모든 경기·가격은 예시
          </span>
        </footer>
      </div>
    </div>
  );
}

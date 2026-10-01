"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { DataNotice } from "./ui";
import { usePlatform } from "./provider";
import { PlaybookArt } from "./playbook-art";

const links = [
  { href: "/", label: "홈" },
  { href: "/market", label: "선수 시장" },
  { href: "/squad", label: "스쿼드" },
  { href: "/ranking", label: "랭킹" },
  { href: "/community", label: "커뮤니티" },
];
export function Logo() {
  return <Link href="/" className="logo yb-wordmark" aria-label="KICK-X 홈">KICK-X</Link>;
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, status, reload } = usePlatform();
  const [query, setQuery] = useState("");
  const standalone = pathname === "/login" || pathname === "/onboarding";
  const isHome = pathname === "/";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    router.push(`/players?q=${encodeURIComponent(query.trim())}`);
  };
  if (standalone) return <>{children}</>;
  return (
    <div className="yb-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <div className="yb-edition"><span>KICK-X / FOOTBALL MARKET</span><span>REAL FOOTBALL. YOUR GAME.</span></div>
      <header className="yb-header">
        <Logo />
        <p className="yb-brand-line">축구를 더 가깝게,<br />선수를 소유하는 새로운 방법.</p>
        <nav className="yb-nav" aria-label="주 메뉴">
          {links.map(({ href, label }) => {
            const active = href === "/" ? isHome : pathname.startsWith(href) || (href === "/market" && pathname.startsWith("/players"));
            return <Link href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
          })}
        </nav>
        <PlaybookArt variant="header" className="yb-header-art" />
        <Link href={data.session ? "/mypage" : "/login"} className="yb-login"><span>{data.session ? data.session.profile?.nickname || "내 계정" : "로그인"}</span><ArrowRight size={24} /></Link>
        <span className="yb-manifesto">PLAYERS<br />MARKET<br />SQUAD<br />COMMUNITY<br />FOR A BIGGER FOOTBALL</span>
      </header>
      {<div className={"yb-utility " + (isHome ? "is-home" : "")}>
        <nav aria-label="내 활동 메뉴"><Link href="/players" aria-current={pathname === "/players" ? "page" : undefined}>선수 탐색</Link><Link href="/fixtures" aria-current={pathname === "/fixtures" ? "page" : undefined}>경기 일정</Link><Link href="/portfolio" aria-current={pathname === "/portfolio" ? "page" : undefined}>내 자산</Link><Link href="/transactions" aria-current={pathname === "/transactions" ? "page" : undefined}>거래 내역</Link><Link href="/mypage" aria-current={pathname === "/mypage" ? "page" : undefined}>마이페이지</Link>{data.session?.role === "admin" && <Link href="/admin">운영 관리</Link>}</nav>
        {!isHome && <form onSubmit={submit}><Search size={17} /><input aria-label="선수, 구단, 리그 통합 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="선수·구단 검색" /><button type="submit">검색</button></form>}{isHome && <span className="kx-utility-note">발견하고, 분석하고, 완성하세요.</span>}
      </div>}
      <main id="main-content" className={isHome ? "yb-main" : "yb-content"}>
        {!isHome && <DataNotice status={status} reload={reload} />}
        {children}
      </main>
      <footer className="yb-footer"><span>© 2026 KICK-X · REAL FOOTBALL. YOUR GAME.</span><nav aria-label="보조 메뉴"><Link href="/players" aria-current={pathname === "/players" ? "page" : undefined}>선수 탐색</Link><Link href="/fixtures" aria-current={pathname === "/fixtures" ? "page" : undefined}>경기 일정</Link><Link href="/portfolio" aria-current={pathname === "/portfolio" ? "page" : undefined}>내 자산</Link><Link href="/transactions" aria-current={pathname === "/transactions" ? "page" : undefined}>거래 내역</Link><Link href="/mypage" aria-current={pathname === "/mypage" ? "page" : undefined}>마이페이지</Link>{data.session?.role === "admin" && <Link href="/admin">운영 관리</Link>}</nav></footer>
    </div>
  );
}

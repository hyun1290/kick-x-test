"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, History, LogOut, Search, Settings, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/kickx/client";
import { dateText, money } from "@/lib/kickx/data";
import { DataNotice, MockBadge } from "./ui";
import { usePlatform } from "./provider";
import { PlaybookArt } from "./playbook-art";

const links = [
  { href: "/", label: "홈" },
  { href: "/market", label: "선수 시장" },
  { href: "/squad", label: "스쿼드" },
  { href: "/ranking", label: "랭킹" },
  { href: "/community/clubs", label: "구단 커뮤니티" },
];
const utility = [
  { href: "/players", label: "선수 탐색" },
  { href: "/fixtures", label: "경기 일정" },
  { href: "/portfolio", label: "내 자산" },
  { href: "/transactions", label: "거래 내역" },
  { href: "/mypage", label: "마이페이지" },
];
function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/market") return pathname.startsWith("/market") || (pathname.startsWith("/players") && pathname !== "/players");
  return pathname === href || pathname.startsWith(href + "/");
}
/** Striker mark traced from the approved silhouette; follows the ink colour. */
function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 1207 1154" aria-hidden="true" focusable="false">
      <path fill="currentColor" fillRule="evenodd" d="M 1167.6 46.2 C 1164.8 49.1, 1155.7 58.9, 1147.5 68 C 1129.7 87.5, 1113.4 104.7, 1107.7 109.9 C 1092.4 123.9, 1074.7 131.5, 987 162.3 C 965.9 169.7, 957.6 173.3, 936 184.2 C 901.8 201.5, 869.3 209.7, 799.8 218.5 C 775.4 221.6, 770.2 222.6, 739.5 229.7 C 712.8 235.9, 698.9 237.3, 690.3 234.9 C 682.8 232.9, 674.2 223.7, 668.3 211.5 L 663.6 201.8 662.4 183.1 C 660.3 150.9, 654.2 133, 640.4 118.1 C 621.4 97.6, 593.9 93.4, 570.5 107.6 C 546.1 122.2, 534.2 151.1, 542 176.5 C 548.4 197.1, 567.3 220.4, 590.1 235.7 C 607.2 247.1, 615.4 247.6, 627.1 237.8 L 633 232.9 630.9 238.2 C 624.4 254.7, 616.6 260.1, 581.5 271.6 C 545.4 283.5, 543.7 285.1, 521 327.5 C 490 385.2, 477.2 404.1, 456.8 421.7 C 432.1 442.9, 425.2 450.5, 406 478.5 C 358.5 547.4, 355.9 550.3, 324.8 567.9 C 309.6 576.5, 298.4 587.1, 286.1 604.7 C 281.7 611.1, 286.3 611.4, 303.6 605.9 C 338.4 594.9, 349.7 587.4, 369 562.6 C 380.4 547.9, 388.3 540.8, 439.5 499.5 C 463.3 480.3, 468 475.1, 489.1 445.5 C 499.4 430.9, 503.3 426.5, 534.4 395 C 553.1 376, 568.7 360.4, 569.1 360.2 C 570.2 359.7, 575.9 375.2, 578.6 386 C 584.6 409.5, 585.9 451.5, 581.1 466.5 C 577.4 477.9, 568.2 496.2, 552.5 523 C 534.2 554.4, 530.5 564.8, 529.3 587.4 C 528.4 606.7, 532.7 655.3, 537.5 678.7 C 538.3 682.7, 539 686.2, 539 686.6 C 539 686.9, 542.8 682.3, 547.4 676.4 C 558.1 662.5, 569.8 649.6, 582.8 637.6 C 588.5 632.3, 593.3 628, 593.5 628 C 593.7 628, 589.6 634.2, 584.3 641.8 C 540.1 705.5, 509.8 758.6, 492 803 C 481.8 828.5, 479.8 831.3, 460 849.1 C 424.9 880.8, 421.4 885.1, 373.5 956 C 333.8 1014.8, 332.2 1016.7, 300 1043.5 C 250.3 1085, 237.2 1100.2, 244.9 1107.9 C 252.3 1115.3, 270.4 1111.7, 303.7 1096 C 321 1087.8, 322.7 1085.9, 332.4 1063.7 C 343 1039.5, 345.7 1036.5, 389 1002.1 C 402.5 991.4, 420 977.5, 428 971.1 C 491.8 920.4, 500.6 909.8, 515.1 865.4 C 525.1 834.6, 523.3 837.2, 561.9 801.1 C 632.3 735.2, 671.9 687.7, 694.6 641.5 C 709.3 611.8, 710.3 597, 700.2 563.6 C 694.1 543.2, 693.7 530.2, 698.9 514.7 C 703.4 500.9, 734.6 429.5, 761.5 371 C 765.2 363, 770.4 351.6, 773.2 345.5 C 785.4 318.2, 798.4 300.3, 813.5 289.5 C 834.5 274.5, 890.5 249.8, 949 229.8 C 974.5 221, 980.4 218.1, 1016.5 196 C 1086.8 153.1, 1106.1 141.5, 1122.1 132.7 C 1137.6 124.2, 1142.8 117.7, 1156.6 89.5 C 1177.5 46.7, 1181.2 32.3, 1167.6 46.2 M 877.4 656.6 C 874.7 658, 870.3 661, 867.7 663.2 C 857.3 671.9, 838.3 683.8, 831.3 686 C 815.6 690.9, 793.6 693.4, 747 695.5 C 705.1 697.5, 695.8 699, 671.8 708.2 C 664 711.2, 664 711.2, 651.6 725.4 C 644.7 733.3, 630.5 748.3, 619.8 758.9 L 600.5 778.1 605 782.1 C 617.5 793.1, 629.7 795.1, 646.5 789 C 656.6 785.4, 708.4 765.6, 729 757.5 C 767 742.5, 835.5 718.1, 855.1 712.4 C 863.6 710, 865.5 709.8, 875 710.3 C 886.7 711, 909.7 714.5, 932.5 718.9 C 957.6 723.8, 958.9 723.9, 961 720 C 963.9 714.7, 956.9 706.7, 930.5 685 C 920.6 676.9, 909.4 667.5, 905.5 664.1 C 893.3 653.3, 886.9 651.6, 877.4 656.6 M 141.1 1003.1 C 91.3 1016.1, 71.2 1074.5, 102.4 1115.7 C 110.5 1126.4, 123 1134.9, 138.5 1140.1 C 149.7 1143.9, 169.3 1143.6, 181.3 1139.3 C 223.8 1124.3, 242 1077.8, 221.2 1037.5 C 216.2 1028, 203.1 1014.8, 193.5 1009.8 C 177 1001.2, 157.6 998.7, 141.1 1003.1" />
    </svg>
  );
}
export function Logo() {
  return <Link href="/" className="logo wordmark" aria-label="KICK-X 홈"><LogoMark />KICK-X</Link>;
}
function AccountMenu() {
  const { data, mock, notify } = usePlatform();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  if (!data.session)
    return <Link href={"/login?next=" + encodeURIComponent(pathname)} className="account-login"><span>로그인</span><ArrowRight size={22} /></Link>;
  const nickname = data.session.profile?.nickname || "내 계정";
  const points = data.member?.financialReady === false ? null : data.member?.points;
  async function signOut() {
    if (busy) return;
    if (mock) { notify("예시 모드에서는 로그아웃할 수 없습니다."); setOpen(false); return; }
    setBusy(true);
    try { await apiRequest("/api/auth/logout", "POST"); window.location.replace("/"); }
    catch (error) { notify(error instanceof Error ? error.message : "로그아웃하지 못했습니다.", "error"); setBusy(false); }
  }
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(value => !value)}>
        <span className="account-avatar" aria-hidden="true">{nickname.slice(0, 1)}</span>
        <span className="account-text">
          <strong>{nickname}</strong>
          <span className="num">{money(points)}<span className="unit">P</span></span>
        </span>
        <ChevronDown size={18} className="account-chevron" />
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">
            <span>보유 포인트</span>
            <strong className="num">{money(points)}<span className="unit">P</span></strong>
          </div>
          <Link role="menuitem" href="/portfolio"><Wallet size={17} />내 자산</Link>
          <Link role="menuitem" href="/transactions"><History size={17} />거래 내역</Link>
          <Link role="menuitem" href="/mypage"><Settings size={17} />마이페이지</Link>
          <button role="menuitem" type="button" onClick={() => void signOut()} disabled={busy}><LogOut size={17} />{busy ? "로그아웃 중…" : "로그아웃"}</button>
        </div>
      )}
    </div>
  );
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
    <div className="app">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <div className="topbar">
        <span className="topbar-market">
          {data.market ? (
            <>
              <span>상승 <b className="up num">{money(data.market.rising)}</b></span>
              <span>하락 <b className="down num">{money(data.market.falling)}</b></span>
              <span>가격 적용 <b className="num">{dateText(data.updatedAt)}</b></span>
            </>
          ) : <span>REAL FOOTBALL. YOUR GAME.</span>}
        </span>
        <MockBadge compact />
      </div>
      <header className="masthead">
        <Logo />
        <p className="masthead-tagline">축구를 더 가깝게,<br />선수를 소유하는 새로운 방법.</p>
        <nav className="main-nav" aria-label="주 메뉴">
          {links.map(({ href, label }) => (
            <Link href={href} key={href} aria-current={isActive(href, pathname) ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <PlaybookArt variant="header" className="masthead-art" />
        <AccountMenu />
        <span className="masthead-manifesto">PLAYERS<br />MARKET<br />SQUAD<br />COMMUNITY<br />FOR A BIGGER FOOTBALL</span>
      </header>
      <div className="subnav">
        <nav aria-label="내 활동 메뉴">
          {utility.map(({ href, label }) => (
            <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <form onSubmit={submit} role="search" className="subnav-search">
          <Search size={16} />
          <input aria-label="선수, 구단, 리그 통합 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="선수 · 구단 · 리그 검색" />
          <button type="submit">검색</button>
        </form>
      </div>
      <main id="main-content" className={isHome ? "content home" : "content"}>
        {!isHome && <DataNotice status={status} reload={reload} />}
        {children}
      </main>
      <footer className="footer">
        <div className="footer-brand">
          <span className="wordmark small">KICK-X</span>
          <p>실제 경기 기록으로 움직이는 선수 가치,<br />가상 포인트로 즐기는 판타지 축구 트레이딩.</p>
        </div>
        <nav aria-label="서비스 메뉴">
          <strong>서비스</strong>
          <Link href="/market">선수 시장</Link>
          <Link href="/players">선수 탐색</Link>
          <Link href="/fixtures">경기 일정</Link>
          <Link href="/ranking">랭킹</Link>
        </nav>
        <nav aria-label="커뮤니티 메뉴">
          <strong>커뮤니티</strong>
          <Link href="/community/clubs">구단 커뮤니티</Link>
          <Link href="/community/write">글쓰기</Link>
        </nav>
        <nav aria-label="내 계정 메뉴">
          <strong>내 계정</strong>
          <Link href="/portfolio">내 자산</Link>
          <Link href="/transactions">거래 내역</Link>
          <Link href="/mypage">마이페이지</Link>
        </nav>
        <p className="footer-legal">
          KICK-X는 서비스 내부 가상 포인트만 사용하며 실제 금전 거래·환전·스포츠 베팅을 제공하지 않습니다. 선수 가치는 KICK-X 내부 지표로 실제 이적료와 무관합니다.
          <span>© 2026 KICK-X · Capstone Design Project</span>
        </p>
      </footer>
    </div>
  );
}

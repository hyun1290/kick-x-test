"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, LogOut, Mail, Save, ShieldCheck } from "lucide-react";
import { usePlatform } from "./provider";
import { Logo } from "./shell";
import { DataNotice, MemberNotice, PageHeading, SectionTitle, TeamBadge } from "./ui";
import { apiRequest } from "@/lib/kickx/client";
import { parseProfile, PROFILE_LIMITS, safeReturnPath } from "@/lib/kickx/validation";
import type { Profile } from "@/lib/kickx/types";
export function LoginScreen() {
  const search = useSearchParams();
  const { data } = usePlatform();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const errors: Record<string, string> = {
    oauth: "로그인이 완료되지 않았습니다. Google 계정을 선택해 다시 시도해 주세요.",
    profile: "계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    "not-configured": "로그인 서비스 연결을 준비하고 있습니다.",
  };
  const [error, setError] = useState("");
  const message = error || errors[search.get("error") || ""] || "";
  const next = safeReturnPath(search.get("next"));
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/status", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(result => { if (!controller.signal.aborted) setEnabled(result.enabled === true); })
      .catch(() => { if (!controller.signal.aborted) { setEnabled(false); setError("로그인 연결 상태를 확인하지 못했습니다. 페이지를 새로고침해 주세요."); } });
    return () => controller.abort();
  }, []);
  async function signIn() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const result = await apiRequest<{ url: string }>("/api/auth/login", "POST", { next });
      window.location.assign(result.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "로그인을 시작하지 못했습니다.");
      setBusy(false); lock.current = false;
    }
  }
  return <div className="auth-layout">
    <section className="auth-visual"><Logo/><div><span className="eyebrow">REAL FOOTBALL. YOUR GAME.</span><h1>당신의 축구가<br/><em>새롭게 시작되는 곳.</em></h1><p>경기를 보는 즐거움에서,<br/>나만의 선수 가치를 발견하는 경험으로.</p><div className="auth-feature">{["가상 포인트 선수 거래", "나만의 스쿼드", "함께하는 축구"].map(t => <span key={t}><Check size={15}/>{t}</span>)}</div></div><span className="auth-photo-caption">KICK-X · FOOTBALL MARKET</span></section>
    <section className="auth-form-side"><Link className="back-link" href="/"><ArrowLeft size={16}/>홈으로</Link><div className="login-form"><span className="eyebrow">WELCOME TO KICK-X</span><h2>경기의 다음 장면을,<br/>함께 만들어가요.</h2><p>Google 계정으로 시작하는 나만의 축구 시장.</p>
      {message && <p className="kx-form-error" role="alert">{message}</p>}
      {data.session ? <Link className="button primary full" href={data.session.profile ? next : "/onboarding?next=" + encodeURIComponent(next)}>로그인한 계정으로 계속하기<ArrowRight size={18}/></Link> : <button type="button" disabled={!enabled || busy} className="google-button" onClick={signIn}>{busy ? <LoaderCircle size={20} className="kx-spin"/> : <span aria-hidden="true">G</span>}{busy ? "Google로 이동 중…" : "Google로 계속하기"}</button>}
      {!data.session && !enabled && <p className="auth-connection-note">{enabled === null ? "로그인 연결을 확인하고 있습니다." : "로그인 서비스 연결을 준비하고 있습니다."}</p>}
      <div className="or-divider"><span>먼저 둘러보고 싶다면</span></div><Link href="/" className="button secondary full">둘러보기<ArrowRight size={18}/></Link><div className="login-note"><ShieldCheck size={20}/><p>Google 비밀번호는 KICK-X에 저장되지 않습니다.</p></div></div><span className="auth-copyright">© 2026 KICK-X. All rights reserved.</span></section>
  </div>;
}
function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { data, status, updateProfile, notify } = usePlatform();
  const search = useSearchParams(), router = useRouter();
  const [draftName, setDraftName] = useState<string | null>(null), [draftTeam, setDraftTeam] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false);
  const nickname = draftName ?? data.session?.profile?.nickname ?? "";
  const team = draftTeam ?? data.session?.profile?.team ?? "";
  const canSave = status === "ready" && !!data.session;
  const dirty = !data.session?.profile || nickname !== data.session.profile.nickname || team !== (data.session.profile.team || "");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || lock.current) return;
    setError("");
    try {
      const values = parseProfile({ nickname, team });
      lock.current = true; setBusy(true);
      const result = await apiRequest<{ profile: Profile }>("/api/kickx/profile", "POST", values);
      updateProfile(result.profile); setDraftName(null); setDraftTeam(null);
      notify("프로필을 저장했습니다.");
      if (onboarding) { router.replace(safeReturnPath(search.get("next"))); router.refresh(); }
    } catch (error) { setError(error instanceof Error ? error.message : "프로필을 저장하지 못했습니다."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={save} className={"panel " + (onboarding ? "onboarding-form" : "settings-form")}>
    {!onboarding && <SectionTitle title="프로필 설정"/>}
    <label htmlFor="profile-nickname">닉네임<input id="profile-nickname" value={nickname} onChange={event => setDraftName(event.target.value)} placeholder="사용할 닉네임을 입력하세요" autoComplete="nickname" required minLength={PROFILE_LIMITS.min} maxLength={PROFILE_LIMITS.max} disabled={busy} aria-describedby="nickname-help" aria-invalid={!!error}/><small id="nickname-help">2–20자 · 문자, 숫자, 공백, 밑줄, 하이픈</small></label>
    <label htmlFor="profile-team">응원 구단<select id="profile-team" value={team} disabled={busy || !data.teams.length} onChange={event => setDraftTeam(event.target.value)}><option value="">나중에 선택</option>{data.teams.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select><small>{data.teams.length ? "구단 라운지에서 함께할 팀을 선택하세요." : "구단 정보가 준비되면 선택할 수 있습니다."}</small></label>
    {error && <p className="kx-form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="submit" className="button primary" disabled={!canSave || !dirty || busy}>{busy ? <LoaderCircle size={16} className="kx-spin"/> : <Save size={16}/>} {busy ? "저장 중…" : onboarding ? "프로필 등록" : "변경사항 저장"}</button></div>
    {!canSave && <p className="fine-print">{data.session ? "서비스 연결 후 저장할 수 있습니다." : "로그인 후 프로필을 저장할 수 있습니다."}</p>}
  </form>;
}
export function OnboardingScreen() {
  const { data, status, reload } = usePlatform();
  return <div className="onboarding"><Logo/><div className="onboarding-intro"><span className="eyebrow">MAKE IT YOURS</span><h1>어떤 팀과 함께할까요?</h1><p>닉네임과 응원 구단으로 나만의 축구를 시작하세요.</p></div><DataNotice status={status} reload={reload}/><MemberNotice/><ProfileForm key={data.session?.userId || "guest"} onboarding/><Link className="back-link" href="/">홈으로 돌아가기</Link></div>;
}
export function MyPageScreen() {
  const { data, getTeam, notify } = usePlatform();
  const [busy, setBusy] = useState(false);
  const profile = data.session?.profile, member = data.member?.financialReady === false ? null : data.member;
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try { await apiRequest("/api/auth/logout", "POST"); window.location.replace("/"); }
    catch (error) { notify(error instanceof Error ? error.message : "로그아웃하지 못했습니다.", "error"); setBusy(false); }
  }
  return <><PageHeading eyebrow="MY KICK-X" title="마이페이지" description="나의 프로필과 응원 구단을 관리하세요."/><MemberNotice/><div className="settings-layout">
    <aside className="panel profile-card"><span className="profile-avatar-large">{profile?.nickname.slice(0,1) || "—"}</span><h2>{profile?.nickname || (data.session ? "프로필을 완성해 주세요" : "로그인이 필요합니다")}</h2><div className="profile-club"><TeamBadge id={profile?.team || null}/><strong>{getTeam(profile?.team)?.name || "응원 구단 미선택"}</strong></div><div className="profile-facts"><span>보유 선수<b>{member ? new Set(member.holdings.map(h => h.playerId)).size + "명" : "—"}</b></span><span>거래 기록<b>{member ? member.transactions.length + "건" : "—"}</b></span></div>{data.session ? <button className="button secondary full" onClick={signOut} disabled={busy}><LogOut size={16}/>{busy ? "로그아웃 중…" : "로그아웃"}</button> : <Link className="button primary full" href="/login?next=/mypage">로그인</Link>}</aside>
    <div><ProfileForm key={data.session?.userId || "guest"}/><section className="panel account-settings"><SectionTitle title="계정 설정"/><div className="settings-row"><Mail size={20}/><div><strong>Google 계정 연결</strong><span>{data.session ? "Google로 로그인한 계정입니다." : "로그인 후 확인할 수 있습니다."}</span></div><span className="status-pill">{data.session ? "연결됨" : "미로그인"}</span></div></section></div>
  </div></>;
}

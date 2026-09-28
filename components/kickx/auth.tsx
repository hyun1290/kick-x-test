"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
} from "lucide-react";
import { usePlatform } from "./provider";
import { Logo } from "./shell";
import {
  DataEmpty,
  DataNotice,
  DisabledAction,
  MemberNotice,
  PageHeading,
  SectionTitle,
  TeamBadge,
} from "./ui";
export function LoginScreen() {
  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <Logo />
        <div>
          <span className="eyebrow">REAL FOOTBALL. YOUR GAME.</span>
          <h1>
            당신의 축구가
            <br />
            <em>새롭게 시작되는 곳.</em>
          </h1>
          <p>
            경기를 보는 즐거움에서,
            <br />
            나만의 선수 가치를 발견하는 경험으로.
          </p>
          <div className="auth-feature">
            {["가상 포인트 선수 거래", "나만의 스쿼드", "함께하는 축구"].map(
              (t) => (
                <span key={t}>
                  <Check size={15} />
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
        <span className="auth-photo-caption">KICK-X · FOOTBALL MARKET</span>
      </section>
      <section className="auth-form-side">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          홈으로
        </Link>
        <div className="login-form">
          <span className="eyebrow">WELCOME TO KICK-X</span>
          <h2>
            경기의 다음 장면을,
            <br />
            함께 만들어가요.
          </h2>
          <p>Google 계정으로 시작하는 나만의 축구 시장.</p>
          <button disabled className="google-button">
            <span>G</span>Google로 계속하기
          </button>
          <p className="auth-connection-note">로그인 서비스 준비 중입니다.</p>
          <div className="or-divider">
            <span>먼저 둘러보고 싶다면</span>
          </div>
          <Link href="/" className="button secondary full">
            둘러보기 <ArrowRight size={18} />
          </Link>
          <div className="login-note">
            <ShieldCheck size={20} />
            <p>로그인하면 내 선수와 스쿼드를 관리할 수 있습니다.</p>
          </div>
        </div>
        <span className="auth-copyright">
          © 2026 KICK-X. All rights reserved.
        </span>
      </section>
    </div>
  );
}
function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { data } = usePlatform();
  const [draftName, setDraftName] = useState<string | null>(null),
    [draftTeam, setDraftTeam] = useState<string | null>(null);
  const nickname = draftName ?? data.session?.profile?.nickname ?? "",
    team = draftTeam ?? data.session?.profile?.team ?? "";
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={`panel ${onboarding ? "onboarding-form" : "settings-form"}`}
    >
      {!onboarding && <SectionTitle title="프로필 설정" />}
      <label>
        닉네임
        <input
          value={nickname}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="사용할 닉네임을 입력하세요"
          autoComplete="nickname"
        />
        <small>구단과 선수 라운지에서 사용할 이름입니다.</small>
      </label>
      <label>
        응원 구단
        <select
          value={team}
          disabled={!data.teams.length}
          onChange={(e) => setDraftTeam(e.target.value)}
        >
          <option value="">응원 구단 선택</option>
          {data.teams.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {!data.teams.length && <DataEmpty entity="응원 구단" />}
      <div className="form-actions">
        <DisabledAction className="button primary">
          <Save size={16} />
          {onboarding ? "프로필 등록" : "변경사항 저장"}
        </DisabledAction>
      </div>
      <p className="fine-print">
        프로필 저장 서비스 준비 중입니다. 입력한 내용은 저장되지 않습니다.
      </p>
    </form>
  );
}
export function OnboardingScreen() {
  const { status, reload } = usePlatform();
  return (
    <div className="onboarding">
      <Logo />
      <div className="onboarding-intro">
        <span className="eyebrow">MAKE IT YOURS</span>
        <h1>어떤 팀과 함께할까요?</h1>
        <p>닉네임과 응원 구단으로 나만의 축구를 시작하세요.</p>
      </div>
      <DataNotice status={status} reload={reload} />
      <MemberNotice />
      <ProfileForm onboarding />
      <Link className="back-link" href="/">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
export function MyPageScreen() {
  const { data, getTeam } = usePlatform();
  const profile = data.session?.profile;
  return (
    <>
      <PageHeading
        eyebrow="MY KICK-X"
        title="마이페이지"
        description="나의 프로필과 응원 구단을 관리하세요."
      />
      <MemberNotice />
      <div className="settings-layout">
        <aside className="panel profile-card">
          <span className="profile-avatar-large">
            {profile?.nickname.slice(0, 1) || "—"}
          </span>
          <h2>{profile?.nickname || "로그인이 필요합니다"}</h2>
          <div className="profile-club">
            <TeamBadge id={profile?.team || null} />
            <strong>
              {getTeam(profile?.team)?.name || "응원 구단 미선택"}
            </strong>
          </div>
          <div className="profile-facts">
            <span>
              보유 선수{" "}
              <b>{data.member ? `${data.member.holdings.length}명` : "—"}</b>
            </span>
            <span>
              거래 기록{" "}
              <b>
                {data.member ? `${data.member.transactions.length}건` : "—"}
              </b>
            </span>
          </div>
          {data.session ? (
            <DisabledAction className="button secondary full">
              <LogOut size={16} />
              로그아웃
            </DisabledAction>
          ) : (
            <Link className="button primary full" href="/login">
              로그인
            </Link>
          )}
        </aside>
        <div>
          <ProfileForm />
          <section className="panel account-settings">
            <SectionTitle title="계정 설정" />
            <div className="settings-row">
              <Mail size={20} />
              <div>
                <strong>Google 계정 연결</strong>
                <span>로그인 서비스 준비 중</span>
              </div>
              <span className="status-pill">준비 중</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

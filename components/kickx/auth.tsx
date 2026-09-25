"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { money, teams } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import { Logo } from "./shell";
import { DemoNote, Modal, PageHeading, SectionTitle, TeamBadge } from "./ui";
export function LoginScreen() {
  const { dispatch } = useDemo();
  const router = useRouter();
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
            <span>
              <Check size={15} />
              가상 포인트 선수 거래
            </span>
            <span>
              <Check size={15} />
              나만의 스쿼드
            </span>
            <span>
              <Check size={15} />
              함께하는 축구
            </span>
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
          <p className="auth-connection-note">
            Google 로그인은 서비스 연결 후 사용할 수 있습니다.
          </p>
          <div className="or-divider">
            <span>먼저 둘러보고 싶다면</span>
          </div>
          <button
            className="button primary full"
            onClick={() => {
              dispatch({ type: "LOGIN" });
              router.push("/onboarding");
            }}
          >
            데모 계정으로 시작하기 <ArrowRight size={18} />
          </button>
          <div className="login-note">
            <ShieldCheck size={20} />
            <p>
              실제 금전 거래 없이 가상 포인트로 체험하세요.
              <br />
              데모 정보는 이 브라우저에만 저장됩니다.
            </p>
          </div>
        </div>
        <span className="auth-copyright">
          © 2026 KICK-X. All rights reserved.
        </span>
      </section>
    </div>
  );
}
export function OnboardingScreen() {
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const [nickname, setNickname] = useState(state.profile.nickname);
  const [team, setTeam] = useState(state.profile.team);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) return;
    dispatch({ type: "LOGIN" });
    dispatch({ type: "PROFILE", nickname, team });
    router.push("/");
  };
  return (
    <div className="onboarding">
      <Logo />
      <div className="onboarding-intro">
        <span className="eyebrow">MAKE IT YOURS</span>
        <h1>어떤 팀과 함께할까요?</h1>
        <p>닉네임과 응원 구단을 선택하고, 나만의 축구를 시작하세요.</p>
      </div>
      <form onSubmit={submit} className="panel onboarding-form">
        <label>
          닉네임
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={16}
            required
            placeholder="2~16자의 닉네임"
          />
          <small>구단과 선수 라운지에서 사용할 이름이에요.</small>
        </label>
        <fieldset>
          <legend>응원 구단</legend>
          <div className="onboarding-teams">
            {teams.map((t) => (
              <label
                className={`team-choice ${team === t.id ? "selected" : ""}`}
                key={t.id}
              >
                <input
                  type="radio"
                  name="team"
                  value={t.id}
                  checked={team === t.id}
                  onChange={() => setTeam(t.id)}
                />
                <TeamBadge id={t.id} />
                <span>{t.name}</span>
                {team === t.id && <Check size={15} />}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="starter-balance">
          <Wallet size={23} />
          <div>
            <strong>데모 포트폴리오가 준비되어 있어요</strong>
            <span>
              보유 포인트 {money(state.points)} P + 예시 선수{" "}
              {state.holdings.length}명
            </span>
          </div>
        </div>
        <button
          className="button primary full"
          disabled={nickname.trim().length < 2}
        >
          KICK-X 시작하기 <ArrowRight size={18} />
        </button>
        <p className="fine-print">
          응원 구단은 마이페이지에서 변경할 수 있습니다. 재입장 시 자산은
          유지됩니다.
        </p>
      </form>
    </div>
  );
}
export function MyPageScreen() {
  const { state, dispatch } = useDemo();
  const router = useRouter();
  const [nickname, setNickname] = useState(state.profile.nickname);
  const [team, setTeam] = useState(state.profile.team);
  const [reset, setReset] = useState(false);
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) return;
    dispatch({ type: "PROFILE", nickname, team });
  };
  return (
    <>
      <PageHeading
        eyebrow="MY KICK-X"
        title="마이페이지"
        description="나의 프로필과 응원 구단을 관리하세요."
      />
      <div className="settings-layout">
        <aside className="panel profile-card">
          <span className="profile-avatar-large">
            {state.profile.nickname[0]}
          </span>
          <h2>{state.profile.nickname}</h2>
          <span className="status-pill blue">DEMO MEMBER</span>
          <div className="profile-club">
            <TeamBadge id={state.profile.team} />
            <strong>
              {teams.find((t) => t.id === state.profile.team)?.name}
            </strong>
          </div>
          <div className="profile-facts">
            <span>
              보유 선수 <b>{state.holdings.length}명</b>
            </span>
            <span>
              거래 기록 <b>{state.transactions.length}건</b>
            </span>
          </div>
          <button
            className="button secondary full"
            onClick={() => {
              dispatch({ type: "LOGOUT" });
              router.push("/login");
            }}
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </aside>
        <div>
          <form className="panel settings-form" onSubmit={save}>
            <SectionTitle title="프로필 설정" />
            <label>
              닉네임
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={16}
                required
              />
              <small>2~16자 이내로 입력해 주세요.</small>
            </label>
            <label>
              응원 구단
              <select value={team} onChange={(e) => setTeam(e.target.value)}>
                {teams.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <small>
                선택한 구단의 커뮤니티에서 글과 댓글을 작성할 수 있습니다.
              </small>
            </label>
            <div className="form-actions">
              <button
                className="button primary"
                disabled={nickname.trim().length < 2}
              >
                <Save size={16} />
                변경사항 저장
              </button>
            </div>
          </form>
          <section className="panel account-settings">
            <SectionTitle title="계정 및 시연 설정" />
            <div className="settings-row">
              <Mail size={20} />
              <div>
                <strong>Google 계정 연결</strong>
                <span>실제 로그인 연결 전 · 현재 데모 계정</span>
              </div>
              <span className="status-pill">미연결</span>
            </div>
            <div className="settings-row">
              <RotateCcw size={20} />
              <div>
                <strong>데모 데이터 초기화</strong>
                <span>
                  거래, 스쿼드, 게시글과 프로필을 처음 상태로 되돌립니다.
                </span>
              </div>
              <button
                className="button secondary small"
                onClick={() => setReset(true)}
              >
                초기화
              </button>
            </div>
          </section>
          <DemoNote>
            현재 설정은 브라우저에 저장됩니다. 실제 회원 정보 저장은 Supabase
            연결 후 제공됩니다.
          </DemoNote>
        </div>
      </div>
      {reset && (
        <Modal
          title="데모 데이터를 초기화할까요?"
          onClose={() => setReset(false)}
        >
          <p className="muted">
            이 브라우저에서 만든 거래와 게시글, 스쿼드 편집 내용이 초기 예시
            상태로 돌아갑니다.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              취소
            </button>
            <button
              className="button danger"
              onClick={() => {
                dispatch({ type: "RESET" });
                setNickname("KICKER");
                setTeam("arsenal");
                setReset(false);
              }}
            >
              초기화
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

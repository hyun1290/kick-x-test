"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { getPlayer, money, players, Transaction } from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  DemoNote,
  Empty,
  Modal,
  PageHeading,
  PlayerIdentity,
  SectionTitle,
  Tabs,
} from "./ui";
const nav = [
  ["/admin", "운영 개요"],
  ["/admin/data", "데이터 관리"],
  ["/admin/trades", "거래 모니터링"],
  ["/admin/community", "커뮤니티 관리"],
];
function AdminNav({ active }: { active: string }) {
  return (
    <>
      <div className="admin-notice">
        <ShieldCheck size={18} />
        <div>
          <strong>운영 화면 시연</strong>
          <span>
            예시 작업과 신고를 관리합니다. 실제 서버 작업과 관리자 권한에는
            연결되어 있지 않습니다.
          </span>
        </div>
        <span className="demo-pill">DEMO</span>
      </div>
      <nav className="admin-nav" aria-label="관리자 메뉴">
        {nav.map(([href, title]) => (
          <Link
            className={active === href ? "active" : ""}
            href={href}
            key={href}
          >
            {title}
          </Link>
        ))}
      </nav>
    </>
  );
}
export function AdminScreen() {
  const { state } = useDemo();
  const failed = state.jobs.filter((j) => j.status === "실패").length;
  return (
    <>
      <PageHeading
        eyebrow="KICK-X CONTROL ROOM"
        title="운영 개요"
        description="데이터의 흐름부터 커뮤니티의 이야기까지."
      />
      <AdminNav active="/admin" />
      <div className="admin-stats">
        {[
          {
            label: "등록 선수",
            value: players.length,
            unit: "명",
            icon: Users,
          },
          {
            label: "데이터 처리",
            value: state.jobs.length - failed,
            unit: `/ ${state.jobs.length}건`,
            icon: Database,
          },
          {
            label: "확인할 작업",
            value: failed,
            unit: "건",
            icon: TriangleAlert,
          },
          {
            label: "접수된 신고",
            value: state.reports.filter((r) => r.status === "접수").length,
            unit: "건",
            icon: ShieldCheck,
          },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div className="panel" key={label}>
            <span>
              {label}
              <Icon size={19} />
            </span>
            <strong>
              {value} <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className="admin-columns">
        <section className="panel">
          <SectionTitle
            title="최근 데이터 처리"
            href="/admin/data"
            link="작업 관리"
          />
          {state.jobs.map((j) => (
            <div className="job-overview" key={j.id}>
              <div
                className={`job-icon ${j.status === "실패" ? "warning" : ""}`}
              >
                {j.status === "실패" ? (
                  <AlertCircle size={21} />
                ) : (
                  <CheckCircle2 size={21} />
                )}
              </div>
              <div>
                <strong>{j.name}</strong>
                <span>
                  {j.target} · {j.time}
                </span>
              </div>
              <span
                className={`status-pill ${j.status === "실패" ? "orange" : "green"}`}
              >
                {j.status}
              </span>
            </div>
          ))}
        </section>
        <section className="panel admin-quick">
          <SectionTitle title="운영 바로가기" />
          {[
            {
              href: "/admin/data",
              title: "데이터 관리",
              desc: "수집 · 계산 · 가격 갱신",
              icon: Database,
            },
            {
              href: "/admin/trades",
              title: "거래 모니터링",
              desc: "거래 내역과 정산 정보 확인",
              icon: Activity,
            },
            {
              href: "/admin/community",
              title: "커뮤니티 관리",
              desc: "신고 접수와 게시글 운영",
              icon: ShieldCheck,
            },
          ].map(({ href, title, desc, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon size={22} />
              <div>
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </section>
      </div>
      <section className="panel audit-panel">
        <SectionTitle
          title="운영 조치 이력"
          meta="이 브라우저에서 수행한 작업"
        />
        {state.audit.length ? (
          <ul>
            {state.audit.map((a, i) => (
              <li key={i}>
                <FileClock size={16} />
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title="아직 운영 조치가 없습니다"
            description="작업 재처리와 신고 처리 결과가 여기에 기록됩니다."
          />
        )}
      </section>
    </>
  );
}
export function DataAdmin() {
  const { state, dispatch } = useDemo();
  const [tab, setTab] = useState("전체");
  const [jobId, setJobId] = useState<string | null>(null);
  const selected = state.jobs.find((j) => j.id === jobId);
  const filtered = state.jobs.filter((j) => tab === "전체" || j.status === tab);
  return (
    <>
      <PageHeading
        eyebrow="DATA OPERATIONS"
        title="데이터 관리"
        description="수집부터 가치 갱신까지, 처리 상태를 확인하세요."
      />
      <AdminNav active="/admin/data" />
      <div className="pipeline">
        <div>
          <Database size={20} />
          <strong>경기 데이터 수집</strong>
          <span>원본 기록 확인</span>
        </div>
        <ArrowRight size={18} />
        <div>
          <Activity size={20} />
          <strong>Performance 계산</strong>
          <span>포지션별 경기력 평가</span>
        </div>
        <ArrowRight size={18} />
        <div>
          <RefreshCw size={20} />
          <strong>선수 가치 갱신</strong>
          <span>현재 가치 · 이력 보존</span>
        </div>
      </div>
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체", "실패", "완료"]}
            value={tab}
            onChange={setTab}
          />
          <span className="muted">작업 {filtered.length}건</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>작업</th>
                <th>대상</th>
                <th>처리 시각</th>
                <th className="numeric">성공 / 실패</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div className="two-line">
                      <strong>{j.name}</strong>
                      <small>{j.id}</small>
                    </div>
                  </td>
                  <td className="muted">{j.target}</td>
                  <td className="muted">{j.time}</td>
                  <td className="numeric">
                    {j.success} /{" "}
                    <span className={j.fail ? "down" : ""}>{j.fail}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${j.status === "실패" ? "orange" : "green"}`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setJobId(j.id)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty
            title="해당 상태의 작업이 없습니다"
            description="다른 상태를 선택해 주세요."
          />
        )}
      </section>
      {selected && (
        <Modal title="작업 처리 내역" onClose={() => setJobId(null)}>
          <span className="eyebrow">{selected.id}</span>
          <h3 className="modal-subheading">{selected.name}</h3>
          <dl className="summary-list">
            <div>
              <dt>대상</dt>
              <dd>{selected.target}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>{selected.status}</dd>
            </div>
            <div>
              <dt>성공 / 실패</dt>
              <dd>
                {selected.success} / {selected.fail}
              </dd>
            </div>
          </dl>
          {selected.error && (
            <div className="error-box">
              <AlertCircle size={19} />
              <p>{selected.error}</p>
            </div>
          )}
          <DemoNote>
            재처리는 선택한 실패 항목의 시연 상태만 변경하며 외부 API를 호출하지
            않습니다.
          </DemoNote>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setJobId(null)}>
              닫기
            </button>
            {selected.status === "실패" && (
              <button
                className="button primary"
                onClick={() => {
                  dispatch({
                    type: "RETRY",
                    id: selected.id,
                    date: new Date().toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    }),
                  });
                  setJobId(null);
                }}
              >
                <RefreshCw size={16} />
                실패 항목 재처리
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
export function TradesAdmin() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("전체 거래");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const records = state.transactions.filter(
    (t) =>
      (!q ||
        `${t.id} ${getPlayer(t.playerId)?.name}`
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (tab === "전체 거래" || t.price >= 14000),
  );
  return (
    <>
      <PageHeading
        eyebrow="TRADE MONITORING"
        title="거래 모니터링"
        description="거래 시점의 가격, 수수료와 정산 결과를 확인하세요."
      />
      <AdminNav active="/admin/trades" />
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체 거래", "고액 거래"]}
            value={tab}
            onChange={setTab}
          />
          <div className="input-search">
            <Search size={16} />
            <input
              aria-label="운영 거래 검색"
              placeholder="거래 ID 또는 선수명"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        {tab === "고액 거래" && (
          <DemoNote>
            시연에서는 14,000 P 이상을 고액 거래로 분류합니다. 이상 거래 판단
            기준은 확정 전입니다.
          </DemoNote>
        )}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래 ID / 사용자</th>
                <th>선수</th>
                <th>유형</th>
                <th className="numeric">거래 가격</th>
                <th className="numeric">수수료</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="two-line">
                      <strong>{t.id.slice(0, 16)}</strong>
                      <small>{state.profile.nickname} · 데모 사용자</small>
                    </div>
                  </td>
                  <td>
                    <PlayerIdentity player={getPlayer(t.playerId)!} />
                  </td>
                  <td>
                    <span className={`trade-type ${t.type}`}>
                      {t.type === "buy" ? "매입" : "매각"}
                    </span>
                  </td>
                  <td className="numeric">{money(t.price)} P</td>
                  <td className="numeric muted">{money(t.fee)} P</td>
                  <td>
                    <span className="status-pill green">완료</span>
                  </td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setSelected(t)}
                    >
                      내역
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!records.length && <Empty title="조건에 맞는 거래가 없습니다" />}
      </section>
      {selected && (
        <Modal title="거래 상세 이력" onClose={() => setSelected(null)}>
          <dl className="summary-list">
            <div>
              <dt>선수</dt>
              <dd>{getPlayer(selected.playerId)?.name}</dd>
            </div>
            <div>
              <dt>거래 구분</dt>
              <dd>{selected.type === "buy" ? "매입" : "매각"}</dd>
            </div>
            <div>
              <dt>거래 가격</dt>
              <dd>{money(selected.price)} P</dd>
            </div>
            <div>
              <dt>수수료</dt>
              <dd>{money(selected.fee)} P</dd>
            </div>
            <div>
              <dt>정산액</dt>
              <dd>{money(selected.net)} P</dd>
            </div>
            <div>
              <dt>거래 시각</dt>
              <dd>
                {new Date(selected.date).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </dd>
            </div>
          </dl>
          <DemoNote>
            데모 상태의 포인트·보유 선수·거래 기록이 함께 변경된 내역입니다.
          </DemoNote>
          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => setSelected(null)}
            >
              확인
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function CommunityAdmin() {
  const { state, dispatch } = useDemo();
  const [tab, setTab] = useState("접수");
  const [target, setTarget] = useState<string | null>(null);
  const reports = state.reports.filter(
    (r) => tab === "전체" || r.status === tab,
  );
  const selected = state.reports.find((r) => r.id === target);
  const post = state.posts.find((p) => p.id === selected?.postId);
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY MODERATION"
        title="커뮤니티 관리"
        description="서로 존중하는 축구 이야기를 위한 운영 공간."
      />
      <AdminNav active="/admin/community" />
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["접수", "숨김", "기각", "전체"]}
            value={tab}
            onChange={setTab}
          />
          <span className="muted">{reports.length}건의 신고</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>신고 대상</th>
                <th>신고 사유</th>
                <th>접수 시각</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="two-line">
                      <strong>
                        {state.posts.find((p) => p.id === r.postId)?.title ||
                          "삭제된 게시글"}
                      </strong>
                      <small>게시글 · {r.id.slice(0, 12)}</small>
                    </div>
                  </td>
                  <td className="muted">{r.reason}</td>
                  <td className="muted">{r.date}</td>
                  <td>
                    <span
                      className={`status-pill ${r.status === "접수" ? "orange" : "blue"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setTarget(r.id)}
                    >
                      검토
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!reports.length && (
          <Empty
            title="처리할 신고가 없습니다"
            description="다른 상태의 신고를 확인할 수 있습니다."
          />
        )}
      </section>
      {selected && (
        <Modal title="신고 검토" onClose={() => setTarget(null)}>
          <span className="category-tag">{selected.reason}</span>
          <h3 className="modal-subheading">{post?.title || "삭제된 게시글"}</h3>
          <p className="review-body">
            {post?.body || "원문이 삭제되어 내용을 확인할 수 없습니다."}
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setTarget(null)}
            >
              닫기
            </button>
            <button
              className="button secondary"
              onClick={() => {
                dispatch({
                  type: "MODERATE",
                  id: selected.id,
                  status: "기각",
                  date: new Date().toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  }),
                });
                setTarget(null);
              }}
            >
              기각 / 공개
            </button>
            <button
              className="button danger"
              disabled={!post}
              onClick={() => {
                dispatch({
                  type: "MODERATE",
                  id: selected.id,
                  status: "숨김",
                  date: new Date().toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  }),
                });
                setTarget(null);
              }}
            >
              게시글 숨김
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

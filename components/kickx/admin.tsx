"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Database,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { dateText, money } from "@/lib/kickx/data";
import type { DataStatus } from "@/lib/kickx/types";
import { useAdminData } from "./provider";
import {
  DataEmpty,
  DataNotice,
  DisabledAction,
  Modal,
  PageHeading,
  SectionTitle,
  Tabs,
} from "./ui";
const nav = [
  ["/admin", "운영 개요"],
  ["/admin/data", "데이터 관리"],
  ["/admin/trades", "거래 모니터링"],
  ["/admin/community", "커뮤니티 관리"],
];
function AdminNav({
  active,
  status,
  reload,
}: {
  active: string;
  status: DataStatus;
  reload: () => void;
}) {
  return (
    <>
      <div className="admin-notice">
        <ShieldCheck size={18} />
        <div>
          <strong>운영 관리</strong>
          <span>운영 정보는 관리자 권한 확인 후 표시됩니다.</span>
        </div>
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
      {status !== "not-configured" && (
        <DataNotice status={status} reload={reload} />
      )}
    </>
  );
}
export function AdminScreen() {
  const { data, status, reload } = useAdminData();
  return (
    <>
      <PageHeading
        eyebrow="KICK-X CONTROL ROOM"
        title="운영 개요"
        description="데이터의 흐름부터 커뮤니티의 이야기까지."
      />
      <AdminNav active="/admin" status={status} reload={reload} />
      <div className="admin-stats">
        {[
          ["등록 선수", data.summary?.players],
          ["완료 작업", data.summary?.completedJobs],
          ["실패 작업", data.summary?.failedJobs],
          ["접수된 신고", data.summary?.pendingReports],
        ].map(([label, value]) => (
          <div className="panel" key={String(label)}>
            <span>
              {label}
              <Database size={19} />
            </span>
            <strong>{money(value as number | undefined)}</strong>
          </div>
        ))}
      </div>
      <div className="admin-columns">
        <section className="panel">
          <SectionTitle title="최근 처리 작업" href="/admin/data" />
          {data.jobs.slice(0, 5).map((j) => (
            <div className="job-overview" key={j.id}>
              <Database size={18} />
              <div>
                <strong>{j.name}</strong>
                <span>{dateText(j.time)}</span>
              </div>
              <span className="status-pill">{j.status}</span>
            </div>
          ))}
          {!data.jobs.length && (
            <DataEmpty entity="처리 작업" status={status} />
          )}
        </section>
        <section className="panel admin-quick">
          <SectionTitle title="운영 메뉴" />
          {nav.slice(1).map(([href, title]) => (
            <Link key={href} href={href}>
              <ShieldCheck size={22} />
              <div>
                <strong>{title}</strong>
                <span>상세 화면으로 이동</span>
              </div>
              <ArrowRight size={17} />
            </Link>
          ))}
        </section>
      </div>
      <section className="panel audit-panel">
        <SectionTitle title="운영 처리 이력" />
        {data.audit.length ? (
          <ul>
            {data.audit.map((a) => (
              <li key={a.id}>
                <FileClock size={16} />
                <span>
                  {dateText(a.date)} · {a.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <DataEmpty entity="운영 이력" status={status} />
        )}
      </section>
    </>
  );
}
export function DataAdmin() {
  const { data, status, reload } = useAdminData();
  const [tab, setTab] = useState("전체"),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.jobs.filter((j) => tab === "전체" || j.status === tab),
    job = data.jobs.find((j) => j.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="DATA OPERATIONS"
        title="데이터 관리"
        description="데이터 수집과 계산 작업의 상태를 확인하세요."
      />
      <AdminNav active="/admin/data" status={status} reload={reload} />
      <div className="pipeline">
        <div>
          <Database size={22} />
          <strong>경기 데이터 수집</strong>
        </div>
        <ArrowRight size={18} />
        <div>
          <strong>Performance 계산</strong>
        </div>
        <ArrowRight size={18} />
        <div>
          <strong>선수 가치 갱신</strong>
        </div>
      </div>
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체", "완료", "실패", "진행 중"]}
            value={tab}
            onChange={setTab}
          />
          <DisabledAction>
            <RefreshCw size={16} />
            실패 작업 재처리
          </DisabledAction>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>작업</th>
                <th>대상</th>
                <th>처리 일시 (KST)</th>
                <th>성공 / 실패</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div className="two-line">
                      <strong>{j.name}</strong>
                      <small>{j.id}</small>
                    </div>
                  </td>
                  <td>{j.target}</td>
                  <td>{dateText(j.time)}</td>
                  <td>
                    {money(j.success)} / {money(j.fail)}
                  </td>
                  <td>{j.status}</td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setSelected(j.id)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <DataEmpty
            entity="처리 작업"
            status={status}
            filtered={data.jobs.length > 0}
          />
        )}
      </section>
      {job && (
        <Modal title={job.name} onClose={() => setSelected(null)}>
          <dl className="summary-list">
            <div>
              <dt>상태</dt>
              <dd>{job.status}</dd>
            </div>
            <div>
              <dt>대상</dt>
              <dd>{job.target}</dd>
            </div>
          </dl>
          <p className="muted">{job.error || "저장된 오류 내용이 없습니다."}</p>
          <div className="modal-actions">
            <DisabledAction>재처리 요청</DisabledAction>
          </div>
        </Modal>
      )}
    </>
  );
}
export function TradesAdmin() {
  const { data, status, reload } = useAdminData();
  const [q, setQ] = useState(""),
    [tab, setTab] = useState("전체"),
    [minimum, setMinimum] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.trades.filter(
    (t) =>
      `${t.id} ${t.userId} ${t.playerName}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (tab === "전체" || t.type === (tab === "매입" ? "buy" : "sell")) &&
      (!minimum || t.price >= Number(minimum)),
  );
  const trade = data.trades.find((t) => t.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="TRADE MONITORING"
        title="거래 모니터링"
        description="서버에 기록된 거래와 정산 결과를 확인하세요."
      />
      <AdminNav active="/admin/trades" status={status} reload={reload} />
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체", "매입", "매각"]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="filter-row">
          <div className="input-search">
            <Search size={16} />
            <input
              aria-label="운영 거래 검색"
              placeholder="거래 ID, 사용자, 선수 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <input
            type="number"
            min="0"
            aria-label="최소 거래 가격"
            placeholder="최소 거래 가격 (P)"
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
          />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래 ID</th>
                <th>사용자</th>
                <th>선수</th>
                <th>유형</th>
                <th className="numeric">가격</th>
                <th>일시 (KST)</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.userId}</td>
                  <td>{t.playerName}</td>
                  <td>{t.type === "buy" ? "매입" : "매각"}</td>
                  <td className="numeric">{money(t.price)} P</td>
                  <td>{dateText(t.date)}</td>
                  <td>{t.status}</td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setSelected(t.id)}
                    >
                      정산 상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <DataEmpty
            entity="거래"
            status={status}
            filtered={data.trades.length > 0}
          />
        )}
      </section>
      {trade && (
        <Modal title="거래 정산 상세" onClose={() => setSelected(null)}>
          <dl className="summary-list">
            {[
              ["선수", trade.playerName],
              ["거래 가격", `${money(trade.price)} P`],
              ["수량", money(trade.quantity)],
              ["수수료", `${money(trade.fee)} P`],
              ["정산액", `${money(trade.net)} P`],
              ["상태", trade.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
}
export function CommunityAdmin() {
  const { data, status, reload } = useAdminData();
  const [tab, setTab] = useState("전체"),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.reports.filter((r) => tab === "전체" || r.status === tab),
    report = data.reports.find((r) => r.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="COMMUNITY MODERATION"
        title="커뮤니티 관리"
        description="신고된 게시글과 처리 내역을 확인하세요."
      />
      <AdminNav active="/admin/community" status={status} reload={reload} />
      <section className="panel">
        <div className="browser-tabs">
          <Tabs
            items={["전체", "접수", "숨김", "기각"]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>접수 일시</th>
                <th>게시글</th>
                <th>신고 사유</th>
                <th>처리 상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{dateText(r.date)}</td>
                  <td>{r.title}</td>
                  <td>{r.reason}</td>
                  <td>{r.status}</td>
                  <td>
                    <button
                      className="button secondary small"
                      onClick={() => setSelected(r.id)}
                    >
                      검토
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <DataEmpty
            entity="신고"
            status={status}
            filtered={data.reports.length > 0}
          />
        )}
      </section>
      {report && (
        <Modal title="신고 검토" onClose={() => setSelected(null)}>
          <h3>{report.title}</h3>
          <p className="review-body">{report.reason}</p>
          <p className="fine-print">신고 처리 서비스 준비 중입니다.</p>
          <div className="modal-actions">
            <DisabledAction>신고 기각</DisabledAction>
            <DisabledAction className="button danger">
              게시글 숨김
            </DisabledAction>
          </div>
        </Modal>
      )}
    </>
  );
}

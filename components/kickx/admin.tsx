"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { AlertTriangle, ArrowRight, Calculator, Database, FileClock, Flag, RefreshCw, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { dateText, money, relativeTime } from "@/lib/kickx/data";
import type { AdminData, DataStatus } from "@/lib/kickx/types";
import {PrototypeAdmin} from "./prototype-admin";
import {apiRequest} from "@/lib/kickx/client";
import { useAdminData, usePlatform } from "./provider";
import { ManualIngestion } from "./ingestion";
import { DataEmpty, DataNotice, DisabledAction, MockBadge, Modal, StatCard, Tabs } from "./ui";

const nav = [
  ["/admin", "운영 개요"],
  ["/admin/data", "데이터 관리"],
  ["/admin/trades", "거래 모니터링"],
  ["/admin/community", "커뮤니티 관리"],
];
type Job = AdminData["jobs"][number];
const PIPELINE: { kind: string; label: string; icon: typeof Database }[] = [
  { kind: "collect", label: "경기 데이터 수집", icon: Database },
  { kind: "performance", label: "Performance 계산", icon: Calculator },
  { kind: "value", label: "선수 가치 갱신", icon: TrendingUp },
];
function statusTone(status: string) {
  return /완료|체결|기각/.test(status) ? "ok" : /실패|숨김/.test(status) ? "fail" : /진행|접수/.test(status) ? "live" : "";
}
function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${statusTone(status)}`}>{status}</span>;
}
function AdminFrame({
  active,
  status,
  reload,
  eyebrow,
  title,
  description,
  children,
}: {
  active: string;
  status: DataStatus;
  reload: () => void;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="admin-hero">
        <div className="admin-hero-top">
          <span className="admin-badge"><ShieldCheck size={15} />CONTROL ROOM</span>
          <MockBadge compact />
          <span className="admin-hero-note">운영 정보는 관리자 권한을 서버에서 확인한 뒤 표시됩니다.</span>
        </div>
        <div className="admin-hero-title">
          <span className="eyebrow plain">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
      </header>
      {status !== "not-configured" && <DataNotice status={status} reload={reload} />}
      {children}
    </>
  );
}
function Pipeline({ jobs }: { jobs: Job[] }) {
  return (
    <ol className="pipeline">
      {PIPELINE.map(({ kind, label, icon: Icon }, i) => {
        const latest = jobs.filter((j) => j.kind === kind).sort((a, b) => Date.parse(b.time) - Date.parse(a.time))[0];
        return (
          <li key={kind} className={`pipeline-step ${latest ? statusTone(latest.status) : ""}`}>
            <span className="pipeline-index num">{String(i + 1).padStart(2, "0")}</span>
            <Icon size={22} />
            <div>
              <strong>{label}</strong>
              <span>{latest ? `${relativeTime(latest.time)} · ${latest.target}` : "실행 기록 없음"}</span>
            </div>
            {latest ? <StatusPill status={latest.status} /> : <span className="status-pill">대기</span>}
          </li>
        );
      })}
    </ol>
  );
}
export function AdminScreen() {
  const { data, status, reload } = useAdminData();
  const failed = data.jobs.filter((j) => j.status === "실패");
  return (
    <AdminFrame active="/admin" status={status} reload={reload} eyebrow="KICK-X OPERATIONS" title="운영 개요" description="데이터 수집부터 커뮤니티 신고까지, 오늘 확인할 항목을 모았습니다.">
      <div className="stat-grid admin-stats">
        <StatCard label="등록 선수" value={money(data.summary?.players)} unit="명" />
        <StatCard label="완료 작업" value={money(data.summary?.completedJobs)} unit="건" hint="최근 기록 기준" />
        <StatCard label="실패 작업" value={<span className={(data.summary?.failedJobs ?? 0) > 0 ? "down" : ""}>{money(data.summary?.failedJobs)}</span>} unit="건" hint={(data.summary?.failedJobs ?? 0) > 0 ? "재처리 필요" : undefined} />
        <StatCard label="접수된 신고" value={money(data.summary?.pendingReports)} unit="건" hint="검토 대기" tone="yellow" />
      </div>
      {failed.length > 0 && (
        <div className="admin-alert" role="status">
          <AlertTriangle size={18} />
          <span><b>실패한 작업 {failed.length}건</b> · {failed[0].name} ({failed[0].target})</span>
          <Link className="text-link" href="/admin/data">확인하기 <ArrowRight size={14} /></Link>
        </div>
      )}
      <section className="admin-section">
        <div className="section-title"><h2>데이터 파이프라인<span>최근 실행 기준</span></h2></div>
        <Pipeline jobs={data.jobs} />
      </section>
      <div className="admin-columns">
        <section className="panel flush">
          <div className="panel-head"><h2>최근 처리 작업</h2><Link className="text-link" href="/admin/data">전체 보기 <ArrowRight size={14} /></Link></div>
          {data.jobs.length ? (
            <ul className="job-list">
              {data.jobs.slice(0, 5).map((j) => (
                <li key={j.id}>
                  <span className={`job-dot ${statusTone(j.status)}`} aria-hidden="true" />
                  <div><strong>{j.name}</strong><span>{j.target}</span></div>
                  <time className="num">{relativeTime(j.time)}</time>
                  <StatusPill status={j.status} />
                </li>
              ))}
            </ul>
          ) : <DataEmpty entity="처리 작업" status={status} rows={3} />}
        </section>
        <section className="panel flush">
          <div className="panel-head"><h2>운영 처리 이력</h2></div>
          {data.audit.length ? (
            <ol className="audit-list">
              {data.audit.map((a) => (
                <li key={a.id}>
                  <FileClock size={15} />
                  <div><span>{a.description}</span><time className="num">{dateText(a.date)}</time></div>
                </li>
              ))}
            </ol>
          ) : <DataEmpty entity="운영 이력" status={status} rows={3} />}
        </section>
      </div>
      <div className="admin-quick">
        {nav.slice(1).map(([href, title], i) => (
          <Link key={href} href={href} className="admin-quick-card hover-lift">
            {[<Database key="d" size={22} />, <TrendingUp key="t" size={22} />, <Flag key="f" size={22} />][i]}
            <strong>{title}</strong>
            <span>{["수집·계산 작업 상태와 오류", "거래 기록과 수수료·정산 결과", "신고 접수와 게시글 숨김 처리"][i]}</span>
            <ArrowRight size={18} />
          </Link>
        ))}
      </div>
    </AdminFrame>
  );
}
export function DataAdmin() {
  const { data, status, reload } = useAdminData();
  const [tab, setTab] = useState("전체"),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.jobs.filter((j) => tab === "전체" || j.status === tab),
    job = data.jobs.find((j) => j.id === selected);
  return (
    <AdminFrame active="/admin/data" status={status} reload={reload} eyebrow="DATA OPERATIONS" title="데이터 관리" description="경기 데이터 수집 → Performance 계산 → 선수 가치 갱신 작업 상태를 확인합니다.">
      <section className="admin-section"><Pipeline jobs={data.jobs} /></section>
      <ManualIngestion initial={data.ingestion} reload={reload} />
      <PrototypeAdmin data={data} reload={reload}/>
      <section className="panel flush">
        <div className="panel-head">
          <Tabs items={["전체", "완료", "실패", "진행 중"]} value={tab} onChange={setTab} variant="segment" label="작업 상태" />
          <DisabledAction className="button secondary small"><RefreshCw size={15} />실패 작업 재처리</DisabledAction>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>작업</th>
                <th>대상</th>
                <th>처리 일시 (KST)</th>
                <th className="numeric">성공 / 실패</th>
                <th>상태</th>
                <th className="cell-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id}>
                  <td><div className="two-line"><strong>{j.name}</strong><small className="mono">{j.id}</small></div></td>
                  <td>{j.target}</td>
                  <td className="muted num">{dateText(j.time)}</td>
                  <td className="numeric">{money(j.success)} <span className="muted">/</span> <span className={(j.fail ?? 0) > 0 ? "down" : ""}>{money(j.fail)}</span></td>
                  <td><StatusPill status={j.status} /></td>
                  <td className="cell-actions"><button className="button secondary small" onClick={() => setSelected(j.id)}>상세</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <DataEmpty entity="처리 작업" status={status} filtered={data.jobs.length > 0} />}
      </section>
      {job && (
        <Modal title={job.name} eyebrow={job.id} onClose={() => setSelected(null)}>
          <dl className="summary-list">
            <div><dt>상태</dt><dd><StatusPill status={job.status} /></dd></div>
            <div><dt>대상</dt><dd>{job.target}</dd></div>
            <div><dt>처리 일시</dt><dd>{dateText(job.time)}</dd></div>
            <div><dt>성공 / 실패</dt><dd>{money(job.success)} / {money(job.fail)}</dd></div>
          </dl>
          <pre className="log-block">{job.error || "저장된 오류 내용이 없습니다."}</pre>
          <p className="fine-print">5대 리그 수집은 위의 수동 갱신에서 이어서 실행할 수 있습니다. 계산은 위의 게임 운영에서 별도로 실행할 수 있습니다.</p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setSelected(null)}>닫기</button>
            <DisabledAction className="button primary"><RefreshCw size={15} />재처리 요청</DisabledAction>
          </div>
        </Modal>
      )}
    </AdminFrame>
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
      `${t.id} ${t.userId} ${t.playerName}`.toLowerCase().includes(q.toLowerCase()) &&
      (tab === "전체" || t.type === (tab === "매입" ? "buy" : "sell")) &&
      (!minimum || t.price >= Number(minimum)),
  );
  const trade = data.trades.find((t) => t.id === selected);
  return (
    <AdminFrame active="/admin/trades" status={status} reload={reload} eyebrow="TRADE MONITORING" title="거래 모니터링" description="서버에 기록된 거래와 수수료·정산 결과를 확인합니다.">
      <div className="stat-grid three admin-stats">
        <StatCard label="조회 거래" value={money(data.trades.length || null)} unit="건" />
        <StatCard label="매입 합계" value={money(data.trades.length ? data.trades.filter((t) => t.type === "buy").reduce((s, t) => s + t.net, 0) : null)} unit="P" />
        <StatCard label="수수료 합계" value={money(data.trades.length ? data.trades.reduce((s, t) => s + t.fee, 0) : null)} unit="P" tone="yellow" />
      </div>
      <section className="panel flush">
        <div className="panel-head">
          <Tabs items={["전체", "매입", "매각"]} value={tab} onChange={setTab} variant="segment" label="거래 유형" />
          <div className="toolbar">
            <label className="input-search"><Search size={16} /><input aria-label="운영 거래 검색" placeholder="거래 ID, 사용자, 선수" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <input className="min-price" type="number" min="0" aria-label="최소 거래 가격" placeholder="최소 가격 (P)" value={minimum} onChange={(e) => setMinimum(e.target.value)} />
          </div>
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
                <th className="numeric">수수료</th>
                <th>일시 (KST)</th>
                <th>상태</th>
                <th className="cell-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td className="mono muted">{t.userId}</td>
                  <td><strong>{t.playerName}</strong></td>
                  <td><span className={`trade-type ${t.type}`}>{t.type === "buy" ? "매입" : "매각"}</span></td>
                  <td className="numeric">{money(t.price)}</td>
                  <td className="numeric muted">{money(t.fee)}</td>
                  <td className="muted num">{dateText(t.date)}</td>
                  <td><StatusPill status={t.status} /></td>
                  <td className="cell-actions"><button className="button secondary small" onClick={() => setSelected(t.id)}>정산 상세</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <DataEmpty entity="거래" status={status} filtered={data.trades.length > 0} />}
      </section>
      {trade && (
        <Modal title="거래 정산 상세" eyebrow={trade.id} onClose={() => setSelected(null)}>
          <dl className="trade-summary">
            <div><dt>선수</dt><dd>{trade.playerName}</dd></div>
            <div><dt>사용자</dt><dd className="mono">{trade.userId}</dd></div>
            <div><dt>거래 가격</dt><dd className="num">{money(trade.price)}<span className="unit">P</span></dd></div>
            <div className="minor"><dt>수량</dt><dd className="num">{money(trade.quantity)}</dd></div>
            <div className="minor"><dt>수수료</dt><dd className="num">{money(trade.fee)}<span className="unit">P</span></dd></div>
            <div className="total"><dt>정산액</dt><dd className="num">{money(trade.net)}<span className="unit">P</span></dd></div>
          </dl>
          <div className="modal-actions"><button className="button primary" onClick={() => setSelected(null)}>확인</button></div>
        </Modal>
      )}
    </AdminFrame>
  );
}
export function CommunityAdmin() {
  const {mock,notify}=usePlatform();
  const [reason,setReason]=useState(""),[busy,setBusy]=useState(false);
  const lock=useRef(false);
  async function moderate(operation:string){if(!report||lock.current)return;if(mock){notify("예시 모드 · 실제로 처리되지 않습니다.");return;}lock.current=true;setBusy(true);try{await apiRequest("/api/kickx/admin/prototype","POST",{action:"moderate",reportId:report.id,operation,reason});setSelected(null);setReason("");reload();notify("신고를 처리했습니다.");}catch(e){notify(e instanceof Error?e.message:"처리 실패","error");}finally{lock.current=false;setBusy(false);}}
  const { data, status, reload } = useAdminData();
  const [tab, setTab] = useState("전체"),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.reports.filter((r) => tab === "전체" || r.status === tab),
    report = data.reports.find((r) => r.id === selected);
  return (
    <AdminFrame active="/admin/community" status={status} reload={reload} eyebrow="COMMUNITY MODERATION" title="커뮤니티 관리" description="신고된 게시글을 검토하고 처리 내역을 확인합니다.">
      <section className="panel flush">
        <div className="panel-head">
          <Tabs items={["전체", "접수", "숨김", "기각", "복원"]} value={tab} onChange={setTab} variant="segment" label="처리 상태" />
          <span className="fine-print num">검토 대기 {data.reports.filter((r) => r.status === "접수").length}건</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>접수</th>
                <th>게시글</th>
                <th>신고 사유</th>
                <th>처리 상태</th>
                <th className="cell-actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted num">{relativeTime(r.date)}</td>
                  <td><Link className="table-link" href={`/community/posts/${r.postId}`}>{r.title}</Link></td>
                  <td>{r.reason}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td className="cell-actions"><button className="button secondary small" onClick={() => setSelected(r.id)}>검토</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <DataEmpty entity="신고" status={status} filtered={data.reports.length > 0} />}
      </section>
      {report && (
        <Modal title="신고 검토" eyebrow={report.id} onClose={() => setSelected(null)}>
          <div className="review-post">
            <span className="fine-print">대상 게시글</span>
            <Link href={`/community/posts/${report.postId}`}><strong>{report.title}</strong> <ArrowRight size={14} /></Link>
          </div>
          <dl className="summary-list">
            <div><dt>신고 사유</dt><dd>{report.reason}</dd></div>
            <div><dt>접수 일시</dt><dd>{dateText(report.date)}</dd></div>
            <div><dt>처리 상태</dt><dd><StatusPill status={report.status} /></dd></div>
          </dl>
          <p className="article-body">{report.content}</p><label className="modal-field">처리 사유 (5~500자)<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label><p className="fine-print">처리 결과와 사유가 운영 이력에 기록됩니다.</p>
          <div className="modal-actions">
            <button className="button secondary" disabled={busy||reason.trim().length<5||report.status!=="접수"} onClick={()=>void moderate("dismiss")}>신고 기각</button>
            <button className="button danger" disabled={busy||reason.trim().length<5||!["접수","숨김"].includes(report.status)} onClick={()=>void moderate(report.status==="숨김"?"restore":"hide")}>{report.status==="숨김"?"복원":report.commentId?"댓글 숨김":"게시글 숨김"}</button>
          </div>
        </Modal>
      )}
    </AdminFrame>
  );
}

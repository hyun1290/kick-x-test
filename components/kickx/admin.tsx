"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { ArrowRight, FileClock, Flag, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { dateText, money, relativeTime } from "@/lib/kickx/data";
import type { DataStatus } from "@/lib/kickx/types";

import {apiRequest} from "@/lib/kickx/client";
import { useAdminData, usePlatform } from "./provider";

import { DataEmpty, DataNotice, MockBadge, Modal, StatCard, Tabs } from "./ui";

const nav = [
  ["/admin", "운영 개요"],
  ["/admin/users", "회원 관리"],
  ["/admin/trades", "거래 모니터링"],
  ["/admin/community", "커뮤니티 관리"],
];

function statusTone(status: string) {
  return /완료|체결|기각/.test(status) ? "ok" : /실패|숨김/.test(status) ? "fail" : /진행|접수/.test(status) ? "live" : "";
}
function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${statusTone(status)}`}>{status}</span>;
}
export function AdminFrame({
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
export function AdminScreen() {
  const { data, status, reload } = useAdminData();
  return (
    <AdminFrame active="/admin" status={status} reload={reload} eyebrow="KICK-X OPERATIONS" title="운영 개요" description="회원·거래·커뮤니티 신고를 관리합니다. 축구 데이터와 게임 계산은 자동 처리됩니다.">
      <div className="stat-grid admin-stats">
        <StatCard label="등록 회원" value={money(data.summary?.members)} unit="명" />
        <StatCard label="이용 제한 회원" value={money(data.summary?.restrictedMembers)} unit="명" />
        <StatCard label="누적 체결 거래" value={money(data.summary?.trades)} unit="건" />
        <StatCard label="접수된 신고" value={money(data.summary?.pendingReports)} unit="건" tone="yellow" />
      </div>
      <div className="admin-quick">
        {nav.slice(1).map(([href, title], i) => (
          <Link key={href} href={href} className="admin-quick-card hover-lift">
            {[<ShieldCheck key="u" size={22} />, <TrendingUp key="t" size={22} />, <Flag key="f" size={22} />][i]}
            <strong>{title}</strong><span>{["회원 검색·이용 제한·해제", "체결 거래와 수수료·정산 확인", "신고 검토·숨김·복원"][i]}</span><ArrowRight size={18} />
          </Link>
        ))}
      </div>
      <section className="panel flush">
        <div className="panel-head"><h2>관리자 처리 이력</h2></div>
        {data.audit.length ? <ol className="audit-list">{data.audit.map(a => <li key={a.id}><FileClock size={15} /><div><span>{a.description}</span><time className="num">{dateText(a.date)}</time></div></li>)}</ol> : <DataEmpty entity="운영 이력" status={status} rows={3} />}
      </section>
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

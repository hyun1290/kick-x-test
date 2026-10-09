"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/kickx/client";
import { dateText } from "@/lib/kickx/data";
import { AdminFrame } from "./admin";
import { useAdminData, usePlatform } from "./provider";
import { Modal } from "./ui";
import { Select } from "./select";

type Member = { id: string; nickname: string; team_id: string; created_at: string; member_restrictions: { suspended_until: string | null; reason: string } | null; user_roles: { role: string } | null };
type PageData = { items: Member[]; total: number; page: number; size: number };
const restricted = (m: Member) => !!m.member_restrictions?.suspended_until && Date.parse(m.member_restrictions.suspended_until) > Date.now();
export function MembersAdmin() {
  const { status, reload } = useAdminData(), { mock, notify } = usePlatform();
  const [q, setQ] = useState(""), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [data, setData] = useState<PageData | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null), [days, setDays] = useState("7"), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (mock) { setData({ items: [], total: 0, page: 1, size: 30 }); setLoading(false); return; }
      setLoading(true); setError("");
      fetch(`/api/kickx/admin/users?page=${page}&q=${encodeURIComponent(q)}`, { cache: "no-store" }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "회원 정보를 불러오지 못했습니다."); return result; }).then(result => { if (active) setData(result as PageData); }).catch(e => { if (active) { setData(null); setError(e instanceof Error ? e.message : "회원을 불러오지 못했습니다."); } }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [q, page, revision, mock]);
  async function save() {
    if (!selected || lock.current) return;
    if (mock) { notify("예시 모드 · 실제로 처리되지 않습니다."); return; }
    lock.current = true; setBusy(true);
    try {
      await apiRequest("/api/kickx/admin/users", "POST", { userId: selected.id, days: Number(days), reason });
      setSelected(null); setReason(""); setRevision(r => r + 1); reload(); notify(days === "0" ? "이용 제한을 해제했습니다." : "회원 이용을 제한했습니다.");
    } catch (e) { notify(e instanceof Error ? e.message : "처리 실패", "error"); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AdminFrame active="/admin/users" status={status} reload={reload} eyebrow="MEMBER MANAGEMENT" title="회원 관리" description="회원을 검색하고 거래·스쿼드·커뮤니티 이용을 제한하거나 해제합니다.">
    <section className="panel flush">
      <div className="panel-head"><h2>회원 목록 {data ? `· ${data.total}명` : ""}</h2><label className="input-search"><Search size={16} /><input aria-label="회원 검색" placeholder="닉네임 또는 회원 ID" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} maxLength={100} /></label></div>
      {error && <p role="alert" className="fine-print">{error}</p>}
      {loading ? <p className="fine-print" role="status">회원을 불러오고 있습니다.</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>닉네임</th><th>회원 ID</th><th>가입 일시</th><th>상태</th><th className="cell-actions" /></tr></thead><tbody>{data?.items.map(m => <tr key={m.id}><td><strong>{m.nickname}</strong></td><td className="mono muted">{m.id}</td><td className="num muted">{dateText(m.created_at)}</td><td>{m.user_roles?.role === "admin" ? "관리자" : restricted(m) ? `이용 제한 · ${dateText(m.member_restrictions!.suspended_until!)}` : "정상"}</td><td className="cell-actions"><button className="button secondary small" disabled={m.user_roles?.role === "admin"} onClick={() => { setSelected(m); setReason(""); setDays(restricted(m) ? "0" : "7"); }}>회원 관리</button></td></tr>)}</tbody></table>{data?.total === 0 && <p className="fine-print">{mock ? "예시 모드에서는 실제 회원을 조회하지 않습니다." : "검색된 회원이 없습니다."}</p>}</div>}
      <div className="panel-head"><button className="button secondary small" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>이전</button><span className="fine-print num">{page} / {Math.max(1, Math.ceil((data?.total || 0) / 30))}</span><button className="button secondary small" disabled={!data || page * 30 >= data.total || loading} onClick={() => setPage(p => p + 1)}>다음</button></div>
    </section>
    {selected && <Modal title={`${selected.nickname} · 회원 관리`} eyebrow={selected.id} onClose={() => { if (!busy) setSelected(null); }}>
      {restricted(selected) && <p className="fine-print">기존 사유: {selected.member_restrictions?.reason}</p>}
      <label className="modal-field">처리<Select label="제한 기간" value={days} onChange={setDays} options={[{ value: "0", label: "이용 제한 해제" }, { value: "1", label: "1일 제한" }, { value: "7", label: "7일 제한" }, { value: "30", label: "30일 제한" }]} /></label>
      <label className="modal-field">처리 사유 (5~500자)<textarea aria-label="회원 처리 사유" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} /></label>
      <p className="fine-print">처리 사유와 기간이 관리자 이력에 기록됩니다.</p>
      <div className="modal-actions"><button className="button secondary" disabled={busy} onClick={() => setSelected(null)}>취소</button><button className="button danger" disabled={busy || reason.trim().length < 5} onClick={() => void save()}>{days === "0" ? "제한 해제" : "이용 제한 적용"}</button></div>
    </Modal>}
  </AdminFrame>;
}

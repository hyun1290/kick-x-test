"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, CircleStop, Languages, ListChecks, LoaderCircle, Play, Trophy, Zap } from "lucide-react";
import { apiRequest } from "@/lib/kickx/client";
import type { AdminData, Player } from "@/lib/kickx/types";
import { warningText } from "@/lib/kickx/score-labels";
import { usePlatform } from "./provider";
import { useCatalogPage } from "./catalog";
import { Select } from "./select";

const CURSOR_KEY = "kickx-calculation-cursor-v1";
function readCursor() { try { return localStorage.getItem(CURSOR_KEY) ?? ""; } catch { return ""; } }
function writeCursor(cursor: string | null) { try { if (cursor) localStorage.setItem(CURSOR_KEY, cursor); else localStorage.removeItem(CURSOR_KEY); } catch {} }

export function PrototypeAdmin({ data, reload }: { data: AdminData; reload: () => void }) {
  const { mock, notify, data: platform } = usePlatform();
  const [busy, setBusy] = useState<string | null>(null), [result, setResult] = useState(""), [processed, setProcessed] = useState(0);
  const [query, setQuery] = useState(""), [playerId, setPlayerId] = useState(""), [name, setName] = useState(""), [aliases, setAliases] = useState("");
  const [savedCursor, setSavedCursor] = useState("");
  const lock = useRef(false), stop = useRef(false);
  const page = useCatalogPage<Player>("players", { q: query, sort: "name", size: 50 });
  const enabled = !!data.prototypeReady && !mock;
  // Mock mode has no catalog API; search the example players locally so the form can be previewed.
  const candidates = mock ? platform.players.filter((p) => !query.trim() || [p.name, p.english, p.originalName].some((v) => v?.toLowerCase().includes(query.trim().toLowerCase()))).slice(0, 50) : page.data.items;
  const selected = candidates.find((p) => p.id === playerId);
  useEffect(() => { setSavedCursor(readCursor()); return () => { stop.current = true; }; }, []);
  function pick(id: string) {
    setPlayerId(id);
    const p = candidates.find((x) => x.id === id);
    // Load the stored display name only when it differs from the BSD original.
    setName(p && p.originalName && p.name !== p.originalName ? p.name : "");
    setAliases(p?.aliases?.join(", ") ?? "");
  }
  async function run(action: string) {
    if (lock.current) return;
    lock.current = true; setBusy(action); stop.current = false; setResult(""); setProcessed(0);
    try {
      if (action === "batch") {
        let cursor = readCursor(), count = 0;
        while (!stop.current) {
          const r = await apiRequest<{ done: boolean; cursor: string; results: unknown[] }>("/api/kickx/admin/prototype", "POST", { action, cursor });
          count += r.results?.length ?? 0; setProcessed(count);
          setResult(JSON.stringify(r, null, 2));
          cursor = r.cursor;
          writeCursor(r.done ? null : cursor); setSavedCursor(r.done ? "" : cursor);
          if (r.done) break;
        }
      } else {
        const r = await apiRequest("/api/kickx/admin/prototype", "POST", { action, playerId, displayName: name, aliases: aliases.split(",").map((x) => x.trim()).filter(Boolean) });
        setResult(JSON.stringify(r, null, 2));
      }
      reload();
      notify(stop.current ? "계산을 멈췄습니다. 다음 선수부터 이어서 실행할 수 있습니다." : "요청을 처리했습니다.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "처리 실패";
      setResult(message); notify(message, "error");
    } finally { lock.current = false; setBusy(null); }
  }
  const spin = (action: string, icon: React.ReactNode) => (busy === action ? <LoaderCircle size={16} className="kx-spin" /> : icon);
  const steps: { action: string; title: string; text: string; icon: React.ReactNode; label: string }[] = [
    { action: "initialize", title: "기본 가치 활성화", text: "아직 가치가 없는 선수에게 시범 기본 가치를 부여합니다.", icon: <Zap size={16} />, label: "활성화" },
    { action: "batch", title: "전체 계산", text: savedCursor ? "이전에 멈춘 지점이 저장되어 있습니다. 다음 선수부터 이어갑니다." : "저장된 경기 기록으로 선수 단위 계산을 차례로 실행합니다.", icon: <Play size={16} />, label: savedCursor ? "이어가기" : "시작" },
    { action: "rankings", title: "랭킹 갱신", text: "현재 시각 기준 주간·월간 자산 수익률 스냅샷을 만듭니다.", icon: <Trophy size={16} />, label: "갱신" },
  ];
  return (
    <section className="panel proto-admin">
      <div className="proto-head">
        <div>
          <h2>게임 운영 <span className="tag outline">프로토타입</span></h2>
          <p>실행 버튼을 눌렀을 때만 계산합니다. 창을 닫으면 다음 요청을 보내지 않습니다. <Link className="text-link" href="/rules">시범 정책 보기</Link></p>
        </div>
        {busy && <button className="button danger small" onClick={() => { stop.current = true; }}><CircleStop size={15} />현재 선수 처리 후 중지</button>}
      </div>
      {!enabled && <p className="data-notice proto-notice">{mock ? "예시 데이터 · 운영 작업은 실행되지 않습니다." : "새 기능의 DB 연결을 준비하고 있습니다. 새 SQL 적용 후 사용할 수 있습니다."}</p>}

      <ol className="proto-steps">
        {steps.map((s, i) => (
          <li key={s.action} className={busy === s.action ? "running" : ""}>
            <span className="proto-step-no num">{String(i + 1).padStart(2, "0")}</span>
            <div><strong>{s.title}</strong><span>{s.text}</span>{s.action === "batch" && busy === "batch" && <span className="proto-progress num">처리한 선수 {processed}명</span>}</div>
            <button className={`button ${i === 0 ? "primary" : "secondary"} small`} disabled={!enabled || !!busy} onClick={() => void run(s.action)}>{spin(s.action, s.icon)}{s.label}</button>
          </li>
        ))}
      </ol>

      <div className="proto-grid">
        <div className="proto-card">
          <h3><Calculator size={17} />선수별 계산</h3>
          <label className="field">대상 선수 검색<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="한글·영문 이름" /></label>
          <div className="field"><span>대상 선수</span><Select label="운영 대상 선수" value={playerId} onChange={pick} options={candidates.map((p) => ({ value: p.id, label: p.name, hint: p.originalName && p.originalName !== p.name ? p.originalName : p.id }))} placeholder={candidates.length ? "선수 선택" : "검색 결과 없음"} searchable /></div>
          {selected && <p className="proto-selected"><b>{selected.name}</b>{selected.originalName && selected.originalName !== selected.name && <span>원문 {selected.originalName}</span>}<span className="num">{selected.id}</span></p>}
          <div className="button-row">
            <button className="button secondary small" disabled={!enabled || !!busy || !playerId} onClick={() => void run("preview")}>{spin("preview", <ListChecks size={15} />)}계산 미리보기</button>
            <button className="button primary small" disabled={!enabled || !!busy || !playerId} onClick={() => void run("calculate")}>{spin("calculate", <Calculator size={15} />)}계산·반영</button>
          </div>
          <p className="fine-print">미리보기는 저장하지 않습니다. 반영하면 가격 이력이 발행됩니다.</p>
        </div>
        <div className="proto-card">
          <h3><Languages size={17} />한글 표시명</h3>
          <label className="field">한글 표시명<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={selected ? "예: 엘링 홀란" : "먼저 선수를 선택하세요"} disabled={!playerId} /></label>
          <label className="field">검색 별칭 <small>쉼표로 구분</small><input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="별명, 다른 표기" disabled={!playerId} /></label>
          {aliases.trim() && <div className="proto-chips">{aliases.split(",").map((a) => a.trim()).filter(Boolean).map((a) => <span key={a} className="tag outline">{a}</span>)}</div>}
          <button className="button secondary small" disabled={!enabled || !!busy || !playerId || !name.trim()} onClick={() => void run("name")}>{spin("name", <Languages size={15} />)}표시명·별칭 저장</button>
          <p className="fine-print">BSD 원문 이름은 그대로 두고 표시명만 따로 저장합니다.</p>
        </div>
      </div>

      {result && (
        <details className="proto-result" open>
          <summary>처리 결과 {busy && <LoaderCircle size={14} className="kx-spin" />}</summary>
          <pre className="log-block" role="status">{result}</pre>
        </details>
      )}
      <details className="proto-issues">
        <summary><AlertTriangle size={15} />최근 계산 보류 <b className="num">{data.calculationIssues?.length ?? 0}</b>건 <small>최대 50건</small></summary>
        {data.calculationIssues?.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>선수</th><th>경기</th><th>사유</th></tr></thead>
              <tbody>
                {data.calculationIssues.map((i) => (
                  <tr key={i.player_id + i.fixture_id}>
                    <td className="num">{i.player_id}</td>
                    <td className="num">{i.fixture_id}</td>
                    <td><ul className="proto-reasons">{[...new Set(i.warnings.map(warningText))].map((w) => <li key={w}>{w}</li>)}</ul></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="fine-print proto-none">보류된 계산이 없습니다.</p>}
      </details>
    </section>
  );
}

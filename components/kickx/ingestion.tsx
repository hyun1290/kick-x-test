"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import type { IngestionState } from "@/lib/kickx/types";
import { dateText, money } from "@/lib/kickx/data";

const statusLabels = { running: "진행 중 / 이어서 실행 가능", paused: "일시 중지", completed: "수집 완료", cancelled: "취소" };
const errorLabels: Record<string, string> = {
  LOCAL_DAILY_BUDGET: "오늘의 수집 호출 한도에 도달했습니다.",
  DAILY_QUOTA_REACHED: "BSD의 오늘 사용량을 모두 소진했습니다.",
  PROVIDER_RATE_LIMIT: "BSD가 요청 간격을 제한했습니다.",
  CURRENT_SEASON_UNAVAILABLE: "BSD의 현재 시즌 정보를 확인해야 합니다.",
  EMPTY_SQUAD: "비어 있는 선수단이 있어 확인 후 재개해야 합니다.",
  MATCH_STATS_UNAVAILABLE: "선수 통계가 아직 제공되지 않았습니다.",
  MATCH_NO_LONGER_FINISHED: "경기 상태가 변경되어 통계 수집을 건너뛰었습니다.",
};
type Reply = IngestionState & { actionState?: string };

export function ManualIngestion({ initial, reload }: { initial?: IngestionState; reload: () => void }) {
  const [local, setLocal] = useState<IngestionState | null>(null);
  const [busy, setBusy] = useState(false), [stopping, setStopping] = useState(false), [message, setMessage] = useState("");
  const mounted = useRef(true), executing = useRef(false), stop = useRef(false);
  const state = local ?? initial, run = state?.latest;
  const active = run && ["running", "paused"].includes(run.status);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stop.current = true; };
  }, []);
  async function send(action: string, runId?: string): Promise<Reply> {
    const response = await fetch("/api/kickx/admin/ingestion", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      body: JSON.stringify({ action, runId }), signal: AbortSignal.timeout(65000),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "수집 요청을 처리하지 못했습니다.");
    if (mounted.current) setLocal(body);
    return body;
  }
  async function execute(action: "start" | "resume" | "cancel") {
    if (executing.current) return;
    executing.current = true; stop.current = false; setBusy(true); setMessage("");
    try {
      let reply = await send(action, run?.id);
      if (action === "cancel") return;
      if (["busy", "cooldown"].includes(reply.actionState ?? "")) {
        setMessage(reply.actionState === "busy" ? "다른 요청이 처리 중입니다. 잠시 후 이어서 실행해 주세요." : "표시된 재개 가능 시각 이후에 다시 눌러 주세요.");
        return;
      }
      const id = reply.latest?.id;
      if (!id) throw new Error("수집 작업을 확인하지 못했습니다.");
      // Only an explicit click enters this loop. Closing/navigating stops further calls.
      while (mounted.current && !stop.current && reply.latest?.status === "running") {
        reply = await send("step", id);
        if (reply.actionState === "busy") {
          setMessage("다른 창에서 처리 중입니다. 이 창의 실행을 멈췄습니다.");
          return;
        }
        if (reply.latest?.status === "running" && !stop.current) await new Promise(resolve => setTimeout(resolve, 1200));
      }
      if (mounted.current && stop.current && reply.latest?.status === "running") await send("pause", id);
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error && error.name !== "TimeoutError" ? error.message : "응답을 확인하지 못했습니다. 잠시 후 이어서 실행하면 저장된 지점부터 진행합니다.");
    } finally {
      executing.current = false;
      if (mounted.current) { setBusy(false); setStopping(false); reload(); }
    }
  }
  return (
    <section className="panel manual-ingestion" aria-labelledby="manual-ingestion-title">
      <div className="section-title"><h2 id="manual-ingestion-title">5대 리그 데이터 갱신<span>관리자 수동 실행</span></h2></div>
      <p>현재 시즌의 구단·선수단·선수 정보와 사진 주소·전체 일정·종료 경기의 선수 기록을 수집합니다.</p>
      <p className="fine-print">갱신을 시작한 뒤 이 페이지를 열어 두세요. 창을 닫으면 다음 요청이 멈추고, 이후 저장된 지점부터 이어서 실행할 수 있습니다. Performance와 선수 가치는 계산 기능 구현 후 반영됩니다.</p>
      {!state?.enabled && <p className="form-error" role="status">{state?.reason || "DB 연결과 관리자 권한을 확인하면 사용할 수 있습니다."}</p>}
      <div className="manual-ingestion-actions">
        <button className="button primary" disabled={!state?.enabled || busy} onClick={() => execute(active ? "resume" : "start")}>
          {active ? <Play size={16} /> : <RefreshCw size={16} />}{busy ? "수집 요청 처리 중" : active ? "이어서 실행" : "5대 리그 데이터 갱신"}
        </button>
        {busy && <button className="button secondary" disabled={stopping} onClick={() => { stop.current = true; setStopping(true); }}><Pause size={16} />{stopping ? "현재 요청 후 중지" : "일시 중지"}</button>}
        {active && !busy && <button className="button secondary" onClick={() => execute("cancel")}>수집 종료</button>}
        <button className="button secondary" disabled={busy} onClick={() => { setLocal(null); reload(); }}>상태 새로고침</button>
      </div>
      {message && <p className="form-error" role="alert">{message}</p>}
      {run && <div className="manual-ingestion-progress">
        <p role="status"><strong>{statusLabels[run.status]}</strong>{state?.current && active ? ` · ${state.current.label}` : ""}</p>
        <progress aria-label="수집 작업 진행률" value={run.completed_tasks} max={Math.max(1, run.total_tasks)} />
        <dl className="summary-list">
          <div><dt>완료 작업 / 발견된 작업</dt><dd>{money(run.completed_tasks)} / {money(run.total_tasks)}</dd></div>
          <div><dt>BSD 호출 / 저장 처리</dt><dd>{money(run.requests)}회 / {money(run.rows_written)}건</dd></div>
          <div><dt>확인 필요한 경기</dt><dd>{money(run.warnings)}건</dd></div>
          <div><dt>BSD 응답의 잔여 호출</dt><dd>{run.remaining == null ? "미제공" : `${money(run.remaining)}회`}</dd></div>
          <div><dt>마지막 처리 (KST)</dt><dd>{dateText(run.updated_at)}</dd></div>
        </dl>
        <p className="fine-print">작업 수는 구단과 일정을 찾으면서 늘어납니다. 저장 처리 건수에는 기존 기록 갱신이 포함됩니다.</p>
        {run.error_code && <p className="form-error">{errorLabels[run.error_code] || "수집을 중지했습니다. 원인을 확인하고 이어서 실행해 주세요."} <code>{run.error_code}</code></p>}
        {run.retry_at && run.status === "paused" && <p>재개 가능 시각 (KST): {dateText(run.retry_at)}</p>}
        {!!state?.warnings.length && <ul className="manual-ingestion-warnings">{state.warnings.map((w, i) => <li key={`${w.label}:${i}`}>{w.label} · {errorLabels[w.warning] || w.warning}</li>)}</ul>}
        {!!run.warnings && <p className="fine-print">위 목록은 최대 20건입니다. 미제공 통계는 생성하지 않으며, 수집 완료 후 새 갱신에서 다시 조회합니다.</p>}
      </div>}
    </section>
  );
}

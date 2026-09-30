"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { emptyAdminData, emptyPlatformData } from "@/lib/kickx/data";
import { apiRequest } from "@/lib/kickx/client";
import type { DataResponse, DataStatus, PlatformData, Profile } from "@/lib/kickx/types";
function useResource<T>(url: string, initial: () => T) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    void fetch(url, { signal: controller.signal, cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            if (!controller.signal.aborted) { setData(initial()); setStatus(response.status === 401 ? "unauthorized" : "forbidden"); }
            return;
          }
          throw new Error("Request failed");
        }
        const result = await response.json() as DataResponse<T>;
        if (!["ready", "not-configured"].includes(result.status) || !result.data) throw new Error("Invalid response");
        if (!controller.signal.aborted) { setData(result.data); setStatus(result.status); }
      })
      .catch(() => { if (!controller.signal.aborted) { setData(initial()); setStatus("error"); } });
    return () => controller.abort();
  }, [url, attempt, initial]);
  return { data, status, reload, setData };
}
type Notice = { message: string; kind: "success" | "error" };
type PlatformContext = {
  data: PlatformData; status: DataStatus; reload: () => void;
  pendingWatch: string[]; setWatched: (id: string, watched: boolean) => Promise<void>;
  updateProfile: (profile: Profile) => void;
  notify: (message: string, kind?: Notice["kind"]) => void;
};
const Context = createContext<PlatformContext | null>(null);
export function PlatformProvider({ children }: { children: ReactNode }) {
  const { data, status, reload, setData } = useResource("/api/kickx", emptyPlatformData);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingWatch, setPendingWatch] = useState<string[]>([]);
  const locks = useRef(new Set<string>());
  const notify = useCallback((message: string, kind: Notice["kind"] = "success") => setNotice({ message, kind }), []);
  useEffect(() => {
    try { localStorage.removeItem("kickx-ui-demo-v1"); } catch { /* No fallback demo state. */ }
  }, []);
  useEffect(() => {
    if (!notice || notice.kind === "error") return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const setWatched = useCallback(async (id: string, watched: boolean) => {
    if (!data.session || status !== "ready" || locks.current.has(id)) return;
    const userId = data.session.userId;
    locks.current.add(id); setPendingWatch([...locks.current]);
    try {
      const result = await apiRequest<{ playerId: string; watched: boolean }>("/api/kickx/watchlist", "PUT", { playerId: id, watched });
      if (result.playerId !== id || result.watched !== watched) throw new Error("저장 상태를 확인하지 못했습니다. 새로고침 후 확인해 주세요.");
      setData(current => {
        if (current.session?.userId !== userId || !current.member) return current;
        const watchlist = current.member.watchlist.filter(value => value !== id);
        if (watched) watchlist.push(id);
        return { ...current, member: { ...current.member, watchlist } };
      });
      notify(watched ? "관심 선수에 추가했습니다." : "관심 선수에서 해제했습니다.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "관심 선수를 저장하지 못했습니다.", "error");
    } finally { locks.current.delete(id); setPendingWatch([...locks.current]); }
  }, [data.session, status, setData, notify]);
  const updateProfile = useCallback((profile: Profile) => {
    setData(current => current.session ? { ...current, session: { ...current.session, profile } } : current);
  }, [setData]);
  const value = useMemo(() => ({ data, status, reload, pendingWatch, setWatched, updateProfile, notify }), [data, status, reload, pendingWatch, setWatched, updateProfile, notify]);
  return <Context.Provider value={value}>{children}<div className="kx-notice-region" aria-live="polite" aria-atomic="true">{notice && <div className={"kx-toast " + notice.kind}>{notice.kind === "error" ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>}<span>{notice.message}</span><button type="button" aria-label="알림 닫기" onClick={() => setNotice(null)}><X size={18}/></button></div>}</div></Context.Provider>;
}
export function usePlatform() {
  const context = useContext(Context);
  if (!context) throw new Error("PlatformProvider is required");
  return useMemo(() => ({
    ...context,
    getPlayer: (id: string | null | undefined) => context.data.players.find(p => p.id === id),
    getTeam: (id: string | null | undefined) => context.data.teams.find(t => t.id === id),
    getLeague: (id: string | null | undefined) => context.data.leagues.find(l => l.id === id),
  }), [context]);
}
export function useAdminData() { return useResource("/api/kickx/admin", emptyAdminData); }

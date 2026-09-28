"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyAdminData, emptyPlatformData } from "@/lib/kickx/data";
import type { DataResponse, DataStatus, PlatformData } from "@/lib/kickx/types";
function useResource<T>(url: string, initial: () => T) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setData(initial());
    void fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setStatus(response.status === 401 ? "unauthorized" : "forbidden");
            return;
          }
          throw new Error("Request failed");
        }
        const result = (await response.json()) as DataResponse<T>;
        if (
          !["ready", "not-configured"].includes(result.status) ||
          !result.data
        )
          throw new Error("Invalid response");
        if (!controller.signal.aborted) {
          setData(result.data);
          setStatus(result.status);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [url, attempt, initial]);
  return { data, status, reload };
}
const Context = createContext<{
  data: PlatformData;
  status: DataStatus;
  reload: () => void;
} | null>(null);
export function PlatformProvider({ children }: { children: ReactNode }) {
  const resource = useResource("/api/kickx", emptyPlatformData);
  useEffect(() => {
    // Remove only the obsolete KICK-X demo state; never touch unrelated browser storage.
    try {
      localStorage.removeItem("kickx-ui-demo-v1");
    } catch {
      /* Storage may be blocked. Reads still work. */
    }
  }, []);
  return <Context.Provider value={resource}>{children}</Context.Provider>;
}
export function usePlatform() {
  const context = useContext(Context);
  if (!context) throw new Error("PlatformProvider is required");
  return useMemo(
    () => ({
      ...context,
      getPlayer: (id: string | null | undefined) =>
        context.data.players.find((p) => p.id === id),
      getTeam: (id: string | null | undefined) =>
        context.data.teams.find((t) => t.id === id),
      getLeague: (id: string | null | undefined) =>
        context.data.leagues.find((l) => l.id === id),
    }),
    [context],
  );
}
export function useAdminData() {
  return useResource("/api/kickx/admin", emptyAdminData);
}

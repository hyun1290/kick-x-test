"use client";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  Dispatch,
  ReactNode,
  Fragment,
} from "react";
import {
  Action,
  DEMO_STORAGE_KEY,
  DemoState,
  demoReducer,
  initialState,
  restoreDemo,
} from "@/lib/kickx/store";
const Context = createContext<{ state: DemoState; dispatch: Dispatch<Action> }>(
  { state: initialState, dispatch: () => {} },
);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  useEffect(() => {
    try {
      dispatch({
        type: "HYDRATE",
        state: restoreDemo(localStorage.getItem(DEMO_STORAGE_KEY)),
      });
    } catch {
      dispatch({ type: "HYDRATE" });
    }
  }, []);
  useEffect(() => {
    if (state.ready)
      try {
        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ ...state, notice: "" }),
        );
      } catch {
        /* Browsing still works when storage is unavailable. */
      }
  }, [state]);
  useEffect(() => {
    if (!state.notice) return;
    const timer = setTimeout(
      () => dispatch({ type: "NOTICE", text: "" }),
      5000,
    );
    return () => clearTimeout(timer);
  }, [state.notice]);
  return (
    <Context.Provider value={{ state, dispatch }}>
      <Fragment key={state.ready ? "ready" : "loading"}>{children}</Fragment>
      {state.notice && (
        <div
          role={state.noticeKind === "error" ? "alert" : "status"}
          className={`toast ${state.noticeKind}`}
        >
          <span>{state.noticeKind === "error" ? "!" : "✓"}</span>
          {state.notice}
          <button
            aria-label="알림 닫기"
            onClick={() => dispatch({ type: "NOTICE", text: "" })}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useDemo = () => useContext(Context);

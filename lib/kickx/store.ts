import {
  Comment,
  formations,
  getPlayer,
  initialPosts,
  initialSquad,
  jobsSeed,
  Post,
  seedHoldings,
  seedTransactions,
  Transaction,
  teams,
} from "./data";
export const DEMO_STORAGE_KEY = "kickx-ui-demo-v1";
export const DEMO_SELL_FEE = 0.02; // Presentation assumption only; product policy remains undecided.
export type DemoState = {
  version: 1;
  signedIn: boolean;
  profile: { nickname: string; team: string };
  points: number;
  baseline: number;
  holdings: typeof seedHoldings;
  squad: (string | null)[];
  formation: string;
  watchlist: string[];
  transactions: Transaction[];
  posts: Post[];
  comments: Comment[];
  likes: string[];
  jobs: typeof jobsSeed;
  reports: {
    id: string;
    postId: string;
    reason: string;
    status: string;
    date: string;
  }[];
  audit: string[];
  notice: string;
  noticeKind: "success" | "error";
  ready: boolean;
};
export const initialState: DemoState = {
  version: 1,
  signedIn: true,
  profile: { nickname: "KICKER", team: "arsenal" },
  points: 38420,
  baseline: 132000,
  holdings: seedHoldings,
  squad: initialSquad,
  formation: "4-3-3",
  watchlist: ["haaland", "saka", "yamal"],
  transactions: seedTransactions,
  posts: initialPosts,
  comments: [
    {
      id: "comment-1",
      postId: "post-1",
      author: "Gunner04",
      authorId: "gunner",
      body: "저도 라이스의 전진 패스가 기대돼요!",
      date: "2026-09-25T10:40:00.000Z",
    },
  ],
  likes: [],
  jobs: jobsSeed,
  reports: [
    {
      id: "report-1",
      postId: "post-2",
      reason: "광고성 내용 의심 · 예시 신고",
      status: "접수",
      date: "2026-09-25 19:40",
    },
  ],
  audit: [],
  notice: "",
  noticeKind: "success",
  ready: false,
};
export type Action =
  | { type: "HYDRATE"; state?: Partial<DemoState> }
  | { type: "NOTICE"; text: string; error?: boolean }
  | { type: "PROFILE"; nickname: string; team: string }
  | { type: "LOGIN" | "LOGOUT" | "RESET" }
  | { type: "WATCH"; id: string }
  | {
      type: "TRADE";
      id: string;
      side: "buy" | "sell";
      requestId: string;
      date: string;
    }
  | { type: "SQUAD"; formation: string; slots: (string | null)[] }
  | { type: "POST"; post: Post }
  | { type: "DELETE_POST"; id: string }
  | { type: "COMMENT"; comment: Comment }
  | { type: "DELETE_COMMENT"; id: string }
  | { type: "LIKE"; id: string }
  | { type: "REPORT"; postId: string; id: string; date: string }
  | { type: "RETRY"; id: string; date: string }
  | { type: "MODERATE"; id: string; status: string; date: string };
function note(state: DemoState, text: string, error = false): DemoState {
  return { ...state, notice: text, noticeKind: error ? "error" : "success" };
}
export function demoReducer(state: DemoState, action: Action): DemoState {
  if (
    !state.signedIn &&
    ["PROFILE", "DELETE_POST", "DELETE_COMMENT", "LIKE", "REPORT"].includes(
      action.type,
    )
  )
    return note(state, "데모 로그인 후 이용해 주세요.", true);
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.state, ready: true, notice: "" };
    case "NOTICE":
      return note(state, action.text, action.error);
    case "LOGIN":
      return note({ ...state, signedIn: true }, "데모 계정으로 입장했습니다.");
    case "LOGOUT":
      return { ...state, signedIn: false, notice: "" };
    case "RESET":
      return {
        ...initialState,
        ready: true,
        notice: "데모 데이터를 처음 상태로 되돌렸습니다.",
      };
    case "PROFILE": {
      if (
        action.nickname.trim().length < 2 ||
        action.nickname.length > 16 ||
        !teams.some((t) => t.id === action.team)
      )
        return note(state, "닉네임은 2~16자로 입력해 주세요.", true);
      return note(
        {
          ...state,
          profile: { nickname: action.nickname.trim(), team: action.team },
        },
        "프로필을 저장했습니다.",
      );
    }
    case "WATCH":
      return {
        ...state,
        watchlist: state.watchlist.includes(action.id)
          ? state.watchlist.filter((i) => i !== action.id)
          : [...state.watchlist, action.id],
      };
    case "TRADE": {
      if (!state.signedIn)
        return note(state, "데모 로그인 후 거래할 수 있습니다.", true);
      const p = getPlayer(action.id);
      if (!p || p.status)
        return note(state, "현재 거래할 수 없는 선수입니다.", true);
      if (state.transactions.some((t) => t.id === action.requestId))
        return state;
      const owned = state.holdings.find((h) => h.playerId === p.id);
      const buying = action.side === "buy";
      if (buying && owned)
        return note(
          state,
          "이미 보유한 선수입니다. 시연에서는 선수당 1명만 보유할 수 있습니다.",
          true,
        );
      if (buying && state.points < p.price)
        return note(
          state,
          "보유 포인트가 부족합니다. 내 자산을 확인해 주세요.",
          true,
        );
      if (!buying && !owned)
        return note(state, "보유한 선수만 매각할 수 있습니다.", true);
      const fee = buying ? 0 : Math.floor(p.price * DEMO_SELL_FEE);
      const net = p.price - fee;
      const tx: Transaction = {
        id: action.requestId,
        playerId: p.id,
        type: action.side,
        price: p.price,
        fee,
        net,
        date: action.date,
      };
      return note(
        {
          ...state,
          points: state.points + (buying ? -p.price : net),
          holdings: buying
            ? [
                ...state.holdings,
                { playerId: p.id, cost: p.price, date: action.date },
              ]
            : state.holdings.filter((h) => h.playerId !== p.id),
          transactions: [tx, ...state.transactions],
          squad: buying
            ? state.squad
            : state.squad.map((id) => (id === p.id ? null : id)),
        },
        `${p.name} ${buying ? "매입" : "매각"}이 데모 자산에 반영되었습니다.`,
      );
    }
    case "SQUAD": {
      if (!state.signedIn)
        return note(state, "로그인 후 스쿼드를 저장해 주세요.", true);
      const rules = formations[action.formation];
      const ids = action.slots.filter(Boolean);
      if (
        !rules ||
        action.slots.length !== 11 ||
        new Set(ids).size !== ids.length ||
        action.slots.some(
          (id, i) =>
            id &&
            (!state.holdings.some((h) => h.playerId === id) ||
              getPlayer(id)?.position !== rules[i]),
        )
      )
        return note(state, "보유 선수와 포지션을 다시 확인해 주세요.", true);
      return note(
        { ...state, squad: action.slots, formation: action.formation },
        "스쿼드를 저장했습니다.",
      );
    }
    case "POST": {
      const p = action.post;
      if (
        !state.signedIn ||
        (p.scope === "club" && p.target !== state.profile.team)
      )
        return note(
          state,
          "응원 구단의 게시판에서만 작성할 수 있습니다.",
          true,
        );
      if (
        p.transaction &&
        !state.transactions.some((t) => t.id === p.transaction!.id)
      )
        return note(state, "본인 거래 내역만 첨부할 수 있습니다.", true);
      const old = state.posts.find((x) => x.id === p.id);
      if (old && old.authorId !== "me")
        return note(state, "본인 글만 수정할 수 있습니다.", true);
      return note(
        {
          ...state,
          posts: old
            ? state.posts.map((x) => (x.id === p.id ? p : x))
            : [p, ...state.posts],
        },
        old ? "게시글을 수정했습니다." : "게시글을 등록했습니다.",
      );
    }
    case "DELETE_POST":
      return note(
        {
          ...state,
          posts: state.posts.filter(
            (p) => p.id !== action.id || p.authorId !== "me",
          ),
          comments: state.posts.some(
            (p) => p.id === action.id && p.authorId === "me",
          )
            ? state.comments.filter((c) => c.postId !== action.id)
            : state.comments,
        },
        "게시글을 삭제했습니다.",
      );
    case "COMMENT": {
      const post = state.posts.find((p) => p.id === action.comment.postId);
      if (
        !state.signedIn ||
        !post ||
        post.hidden ||
        (post.scope === "club" && post.target !== state.profile.team)
      )
        return note(state, "이 게시판에 댓글을 작성할 수 없습니다.", true);
      const existing = state.comments.find((c) => c.id === action.comment.id);
      if (existing && existing.authorId !== "me")
        return note(state, "본인 댓글만 수정할 수 있습니다.", true);
      return note(
        {
          ...state,
          comments: existing
            ? state.comments.map((c) =>
                c.id === action.comment.id ? action.comment : c,
              )
            : [...state.comments, action.comment],
        },
        existing ? "댓글을 수정했습니다." : "댓글을 등록했습니다.",
      );
    }
    case "DELETE_COMMENT":
      return {
        ...state,
        comments: state.comments.filter(
          (c) => c.id !== action.id || c.authorId !== "me",
        ),
      };
    case "LIKE":
      return {
        ...state,
        likes: state.likes.includes(action.id)
          ? state.likes.filter((i) => i !== action.id)
          : [...state.likes, action.id],
      };
    case "REPORT":
      return note(
        {
          ...state,
          reports: [
            ...state.reports,
            {
              id: action.id,
              postId: action.postId,
              reason: "이용자 신고 · 데모",
              status: "접수",
              date: action.date,
            },
          ],
        },
        "데모 신고가 접수되었습니다.",
      );
    case "RETRY":
      return note(
        {
          ...state,
          jobs: state.jobs.map((j) =>
            j.id === action.id
              ? {
                  ...j,
                  status: "완료",
                  success: j.success + j.fail,
                  fail: 0,
                  error: "",
                }
              : j,
          ),
          audit: [
            `${action.date} · ${action.id} · 데모 재처리 완료`,
            ...state.audit,
          ],
        },
        "선택한 실패 작업을 시연 데이터에서 재처리했습니다.",
      );
    case "MODERATE": {
      const report = state.reports.find((r) => r.id === action.id);
      return note(
        {
          ...state,
          reports: state.reports.map((r) =>
            r.id === action.id ? { ...r, status: action.status } : r,
          ),
          posts: state.posts.map((p) =>
            p.id === report?.postId
              ? { ...p, hidden: action.status === "숨김" }
              : p,
          ),
          audit: [
            `${action.date} · ${action.id} · ${action.status}`,
            ...state.audit,
          ],
        },
        "운영 상태를 변경했습니다.",
      );
    }
    default:
      return state;
  }
}
export function restoreDemo(
  raw: string | null,
): Partial<DemoState> | undefined {
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !s.profile ||
      typeof s.profile.nickname !== "string" ||
      !teams.some((t) => t.id === s.profile.team) ||
      !Number.isFinite(s.baseline) ||
      s.baseline <= 0 ||
      typeof s.signedIn !== "boolean" ||
      !Number.isFinite(s.points) ||
      s.points < 0 ||
      !Array.isArray(s.holdings) ||
      !Array.isArray(s.posts) ||
      !Array.isArray(s.transactions) ||
      !Array.isArray(s.jobs) ||
      !Array.isArray(s.squad) ||
      s.squad.length !== 11 ||
      s.squad.some((id: string | null) => id !== null && !getPlayer(id)) ||
      !Array.isArray(s.comments) ||
      !Array.isArray(s.reports) ||
      !Array.isArray(s.watchlist) ||
      !Array.isArray(s.likes) ||
      !Array.isArray(s.audit) ||
      !formations[s.formation]
    )
      return;
    if (
      s.holdings.some(
        (h: { playerId: string; cost: number }) =>
          !getPlayer(h.playerId) || !Number.isFinite(h.cost),
      )
    )
      return;
    return s;
  } catch {
    return;
  }
}

"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Flag,
  Heart,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Pencil,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  getPlayer,
  getTeam,
  money,
  players,
  Post,
  teams,
} from "@/lib/kickx/data";
import { useDemo } from "./provider";
import {
  BackLink,
  DemoNote,
  Empty,
  Modal,
  PageHeading,
  PlayerAvatar,
  SectionTitle,
  Tabs,
  TeamBadge,
} from "./ui";
const dateText = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    hour12: false,
  }).format(new Date(date));
function PostList({ posts }: { posts: Post[] }) {
  const { state } = useDemo();
  return posts.length ? (
    <div className="post-list">
      {posts.map((p) => (
        <Link href={`/community/posts/${p.id}`} className="post-row" key={p.id}>
          <div className="post-row-main">
            <div className="post-meta">
              <span className="category-tag">{p.category}</span>
              <span>
                {p.scope === "club"
                  ? getTeam(p.target).name
                  : getPlayer(p.target)?.name}
              </span>
            </div>
            <h3>
              {p.title}
              {p.transaction && <Paperclip size={14} />}
            </h3>
            <div className="post-byline">
              <span>{p.author}</span>
              <span>{dateText(p.date)}</span>
              <span>
                <Eye size={13} />
                {p.views}
              </span>
            </div>
          </div>
          <div className="post-counts">
            <span>
              <Heart size={14} />
              {p.likes + (state.likes.includes(p.id) ? 1 : 0)}
            </span>
            <span>
              <MessageCircle size={14} />
              {
                state.comments.filter((c) => c.postId === p.id && !c.hidden)
                  .length
              }
            </span>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <Empty
      title="아직 이야기가 없습니다"
      description="이 게시판의 첫 번째 이야기를 시작해 보세요."
    />
  );
}
export function CommunityScreen({ scope }: { scope?: "club" | "player" }) {
  const params = useParams();
  const { state } = useDemo();
  const [tab, setTab] = useState("전체");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("최신순");
  const target =
    scope === "club"
      ? String(params.teamId)
      : scope === "player"
        ? String(params.playerId)
        : undefined;
  const team =
    scope === "club" ? teams.find((t) => t.id === target) : undefined;
  const player = scope === "player" ? getPlayer(target!) : undefined;
  if (scope && !team && !player)
    return (
      <Empty
        title="게시판을 찾을 수 없습니다"
        description="커뮤니티 홈에서 게시판을 다시 선택해 주세요."
        action={
          <Link className="button primary" href="/community">
            커뮤니티
          </Link>
        }
      />
    );
  const writable =
    state.signedIn &&
    (!scope || scope === "player" || target === state.profile.team);
  const title = team
    ? `${team.name} 팬 라운지`
    : player
      ? `${player.name} 라운지`
      : "커뮤니티";
  const posts = state.posts
    .filter(
      (p) =>
        !p.hidden &&
        (!scope || (p.scope === scope && p.target === target)) &&
        (tab === "전체" || p.category === tab) &&
        (!q ||
          `${p.title} ${p.body} ${p.author}`
            .toLowerCase()
            .includes(q.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "인기순"
        ? b.likes - a.likes
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  return (
    <>
      {scope && <BackLink href="/community" label="커뮤니티" />}
      <PageHeading
        eyebrow={scope ? "THE FAN LOUNGE" : "FOOTBALL CONNECTS US"}
        title={title}
        description={
          scope
            ? "같은 경기를 보고, 서로 다른 이야기를 나누는 곳."
            : "같은 열정, 새로운 시선. 축구 이야기는 여기서 계속됩니다."
        }
        action={
          writable ? (
            <Link
              className="button primary"
              href={`/community/write${scope ? `?scope=${scope}&target=${target}` : ""}`}
            >
              <Pencil size={16} />
              글쓰기
            </Link>
          ) : (
            <span className="quiet-label">
              <LockKeyhole size={16} />
              읽기 전용
            </span>
          )
        }
      />
      {scope ? (
        <section className="lounge-banner">
          {team ? (
            <TeamBadge id={team.id} size="large" />
          ) : (
            player && <PlayerAvatar player={player} large />
          )}
          <div>
            <span className="eyebrow">{team?.english || player?.english}</span>
            <h2>
              {team
                ? "함께 응원할 때, 더 커지는 경기."
                : "경기력부터 가치까지, 함께 보는 선수."}
            </h2>
            <p>
              {team
                ? writable
                  ? "내 응원 구단 · 글과 댓글을 작성할 수 있습니다."
                  : "이 구단을 응원하는 팬만 글과 댓글을 작성할 수 있습니다."
                : "선수의 경기력, 가치 변화와 거래 경험을 나눠보세요."}
            </p>
          </div>
          {player && (
            <Link className="button secondary" href={`/players/${player.id}`}>
              선수 상세 <ArrowUpRight size={16} />
            </Link>
          )}
        </section>
      ) : (
        <section className="club-discovery">
          <div className="section-title">
            <h2>나의 팀, 나의 라운지</h2>
            <Link href="/mypage" className="text-link">
              응원 구단 설정 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="club-grid">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/community/clubs/${t.id}`}
                className={`club-card ${state.profile.team === t.id ? "my-club" : ""}`}
              >
                <TeamBadge id={t.id} />
                <strong>{t.name}</strong>
                <span>{state.profile.team === t.id ? "MY CLUB" : t.code}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="community-layout">
        <section className="panel">
          <div className="browser-tabs">
            <Tabs
              items={[
                "전체",
                "경기 이야기",
                "선수 분석",
                "거래 이야기",
                "자유 이야기",
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="filter-row">
            <div className="input-search">
              <Search size={16} />
              <input
                aria-label="게시글 검색"
                placeholder="관심 있는 이야기를 검색하세요"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              aria-label="게시글 정렬"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>최신순</option>
              <option>인기순</option>
            </select>
          </div>
          <PostList posts={posts} />
        </section>
        <aside>
          <section className="panel lounge-sidebar">
            <SectionTitle title="지금 이야기하는 선수" />
            {[...players]
              .sort((a, b) => b.volume - a.volume)
              .slice(0, 5)
              .map((p, i) => (
                <Link
                  href={`/community/players/${p.id}`}
                  key={p.id}
                  className="trending-lounge"
                >
                  <span className="rank-index">0{i + 1}</span>
                  <PlayerAvatar player={p} />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{getTeam(p.team).name}</span>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
          </section>
          <section className="community-guide">
            <MessageCircle size={22} />
            <h3>좋은 경기는 존중에서 시작됩니다.</h3>
            <p>
              서로 다른 의견도 존중해 주세요. 경기와 선수에 관한 생각을 자유롭게
              나눠보세요.
            </p>
            <span>구단 라운지는 해당 구단 팬의 작성 공간입니다.</span>
          </section>
        </aside>
      </div>
    </>
  );
}
export function PostDetail() {
  const { state, dispatch } = useDemo();
  const params = useParams();
  const router = useRouter();
  const post = state.posts.find((p) => p.id === params.postId);
  const [comment, setComment] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState(false);
  const [editComment, setEditComment] = useState<string | null>(null);
  if (!post || post.hidden)
    return (
      <Empty
        title={
          post?.hidden
            ? "운영 정책에 따라 숨겨진 게시글입니다"
            : "게시글을 찾을 수 없습니다"
        }
        description="다른 커뮤니티 이야기를 확인해 보세요."
        action={
          <Link className="button secondary" href="/community">
            커뮤니티로
          </Link>
        }
      />
    );
  const canWrite =
    state.signedIn &&
    (post.scope === "player" || state.profile.team === post.target);
  const back =
    post.scope === "club"
      ? `/community/clubs/${post.target}`
      : `/community/players/${post.target}`;
  const comments = state.comments.filter(
    (c) => c.postId === post.id && !c.hidden,
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    dispatch({
      type: "COMMENT",
      comment: {
        id: editComment || crypto.randomUUID(),
        postId: post.id,
        author: state.profile.nickname,
        authorId: "me",
        body: comment.trim(),
        date: new Date().toISOString(),
      },
    });
    setComment("");
    setEditComment(null);
  };
  return (
    <div className="reading-width">
      <BackLink
        href={back}
        label={
          post.scope === "club"
            ? `${getTeam(post.target).name} 라운지`
            : `${getPlayer(post.target)?.name} 라운지`
        }
      />
      <article className="panel article-panel">
        <span className="category-tag">{post.category}</span>
        <h1>{post.title}</h1>
        <div className="article-author">
          <span className="user-avatar">{post.author[0]}</span>
          <div>
            <strong>{post.author}</strong>
            <span>
              {dateText(post.date)} <i>·</i> 조회 {post.views}
            </span>
          </div>
          {post.authorId === "me" && (
            <div className="button-row">
              <Link
                className="icon-button"
                href={`/community/write?edit=${post.id}`}
                aria-label="글 수정"
              >
                <Pencil size={17} />
              </Link>
              <button
                className="icon-button"
                aria-label="글 삭제"
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </div>
        <div className="article-body">{post.body}</div>
        {post.transaction && (
          <div className="attached-trade">
            <div>
              <Paperclip size={17} />
              <strong>첨부된 거래 내역</strong>
              <span className="subtle-tag">DEMO</span>
            </div>
            <p>
              {getPlayer(post.transaction.playerId)?.name}{" "}
              <span className="status-pill blue">
                {post.transaction.type === "buy" ? "매입" : "매각"}
              </span>
            </p>
            <strong>{money(post.transaction.price)} P</strong>
            <small>{dateText(post.transaction.date)} · 작성자 본인 거래</small>
          </div>
        )}
        <div className="article-actions">
          <button
            className={`button secondary ${state.likes.includes(post.id) ? "liked" : ""}`}
            aria-pressed={state.likes.includes(post.id)}
            onClick={() => dispatch({ type: "LIKE", id: post.id })}
          >
            <Heart
              size={16}
              fill={state.likes.includes(post.id) ? "currentColor" : "none"}
            />
            공감 {post.likes + (state.likes.includes(post.id) ? 1 : 0)}
          </button>
          <button className="text-link muted" onClick={() => setReport(true)}>
            <Flag size={15} />
            신고
          </button>
        </div>
      </article>
      <section className="panel comments-panel">
        <SectionTitle title="댓글" meta={String(comments.length)} />
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <span className="user-avatar small">{c.author[0]}</span>
            <div>
              <strong>{c.author}</strong>
              <span>{dateText(c.date)}</span>
              <p>{c.body}</p>
            </div>
            {c.authorId === "me" && (
              <div className="button-row">
                <button
                  className="icon-button"
                  aria-label="댓글 수정"
                  onClick={() => {
                    setEditComment(c.id);
                    setComment(c.body);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label="댓글 삭제"
                  onClick={() => dispatch({ type: "DELETE_COMMENT", id: c.id })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        <form onSubmit={submit} className="comment-form">
          <label htmlFor="comment">
            {editComment ? "댓글 수정" : "댓글 작성"}
          </label>
          <textarea
            id="comment"
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canWrite}
            placeholder={
              canWrite
                ? "나의 생각을 나눠보세요."
                : "응원 구단의 게시판에서 댓글을 작성할 수 있습니다."
            }
          />
          <div>
            <span>{comment.length} / 1,000</span>
            <div className="button-row">
              {editComment && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => {
                    setEditComment(null);
                    setComment("");
                  }}
                >
                  취소
                </button>
              )}
              <button
                className="button primary small"
                disabled={!canWrite || !comment.trim()}
              >
                <Send size={15} />
                {editComment ? "수정" : "댓글 등록"}
              </button>
            </div>
          </div>
        </form>
      </section>
      {deleting && (
        <Modal title="게시글을 삭제할까요?" onClose={() => setDeleting(false)}>
          <p className="muted">게시글과 연결된 댓글이 함께 삭제됩니다.</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(false)}
            >
              취소
            </button>
            <button
              className="button danger"
              onClick={() => {
                dispatch({ type: "DELETE_POST", id: post.id });
                router.push(back);
              }}
            >
              삭제
            </button>
          </div>
        </Modal>
      )}
      {report && (
        <Modal title="게시글 신고" onClose={() => setReport(false)}>
          <p className="muted">
            신고를 접수하면 데모 운영 관리 화면에서 확인할 수 있습니다.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReport(false)}
            >
              취소
            </button>
            <button
              className="button primary"
              onClick={() => {
                dispatch({
                  type: "REPORT",
                  postId: post.id,
                  id: crypto.randomUUID(),
                  date: new Date().toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  }),
                });
                setReport(false);
              }}
            >
              신고 접수
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function WritePost() {
  const { state, dispatch } = useDemo();
  const sp = useSearchParams();
  const router = useRouter();
  const existing = state.posts.find((p) => p.id === sp.get("edit"));
  const [scope, setScope] = useState<"club" | "player">(
    existing?.scope || (sp.get("scope") === "player" ? "player" : "club"),
  );
  const [target, setTarget] = useState(
    existing?.target || sp.get("target") || state.profile.team,
  );
  const [category, setCategory] = useState(existing?.category || "경기 이야기");
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const [transaction, setTransaction] = useState(
    existing?.transaction?.id || "",
  );
  const validTarget =
    scope === "club"
      ? teams.some((t) => t.id === target)
      : players.some((p) => p.id === target);
  const canWrite =
    state.signedIn &&
    validTarget &&
    (scope === "player" || target === state.profile.team) &&
    (!existing || existing.authorId === "me");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite || !title.trim() || !body.trim()) return;
    const post: Post = {
      id: existing?.id || crypto.randomUUID(),
      author: state.profile.nickname,
      authorId: "me",
      scope,
      target,
      category,
      title: title.trim(),
      body: body.trim(),
      date: existing?.date || new Date().toISOString(),
      likes: existing?.likes || 0,
      views: existing?.views || 0,
      transaction: state.transactions.find((t) => t.id === transaction),
    };
    dispatch({ type: "POST", post });
    router.push(`/community/posts/${post.id}`);
  };
  return (
    <div className="reading-width">
      <BackLink href="/community" label="커뮤니티" />
      <PageHeading
        eyebrow="SHARE YOUR PERSPECTIVE"
        title={existing ? "게시글 수정" : "새로운 이야기"}
      />
      <form onSubmit={submit} className="panel write-form">
        <div className="form-grid">
          <label>
            게시판 종류
            <select
              value={scope}
              onChange={(e) => {
                const s = e.target.value as "club" | "player";
                setScope(s);
                setTarget(s === "club" ? state.profile.team : "haaland");
              }}
            >
              <option value="club">구단 커뮤니티</option>
              <option value="player">선수 커뮤니티</option>
            </select>
          </label>
          <label>
            대상 {scope === "club" ? "구단" : "선수"}
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {(scope === "club" ? teams : players).map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!canWrite && (
          <p className="form-error">
            로그인과 응원 구단 설정을 확인해 주세요. 구단 게시판에는 해당 팬만
            작성할 수 있습니다.
          </p>
        )}
        <label>
          주제
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["경기 이야기", "선수 분석", "거래 이야기", "자유 이야기"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
        <label>
          제목
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="이야기의 제목을 입력하세요"
          />
        </label>
        <label>
          내용
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={5000}
            rows={12}
            placeholder="경기에 대한 생각, 선수 분석, 나의 거래 경험을 나눠보세요."
          />
        </label>
        <div className="writing-count">{body.length} / 5,000</div>
        <label className="attachment-label">
          <span>
            <Paperclip size={16} />내 거래 내역 첨부 <small>선택</small>
          </span>
          <select
            value={transaction}
            onChange={(e) => setTransaction(e.target.value)}
          >
            <option value="">첨부하지 않음</option>
            {state.transactions.map((t) => (
              <option value={t.id} key={t.id}>
                {getPlayer(t.playerId)?.name} ·{" "}
                {t.type === "buy" ? "매입" : "매각"} · {money(t.price)} P ·{" "}
                {dateText(t.date)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <Link className="button secondary" href="/community">
            취소
          </Link>
          <button
            className="button primary"
            disabled={!canWrite || !title.trim() || !body.trim()}
          >
            <Pencil size={16} />
            {existing ? "수정 완료" : "게시글 등록"}
          </button>
        </div>
      </form>
      <DemoNote>
        게시글과 댓글은 이 브라우저에만 저장되며 다른 사용자에게 공개되지
        않습니다.
      </DemoNote>
    </div>
  );
}

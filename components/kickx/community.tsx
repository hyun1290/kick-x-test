"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  Flag,
  Heart,
  MessageCircle,
  Paperclip,
  Pencil,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { dateText, money } from "@/lib/kickx/data";
import type { Post } from "@/lib/kickx/types";
import { usePlatform } from "./provider";
import {
  BackLink,
  DataEmpty,
  DisabledAction,
  MemberNotice,
  Modal,
  PageHeading,
  PlayerAvatar,
  SectionTitle,
  Tabs,
  TeamBadge,
} from "./ui";
function PostList({ posts, filtered }: { posts: Post[]; filtered?: boolean }) {
  const { getTeam, getPlayer } = usePlatform();
  return posts.length ? (
    <div className="post-list">
      {posts.map((p) => (
        <Link href={`/community/posts/${p.id}`} className="post-row" key={p.id}>
          <div className="post-row-main">
            <div className="post-meta">
              <span className="category-tag">{p.category}</span>
              <span>
                {p.scope === "club"
                  ? getTeam(p.target)?.name
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
                {money(p.views)}
              </span>
            </div>
          </div>
          <div className="post-counts">
            <span>
              <Heart size={14} />
              {money(p.likes)}
            </span>
            <span>
              <MessageCircle size={14} />
              {money(p.commentCount)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <DataEmpty entity="게시글" filtered={filtered} />
  );
}
export function CommunityScreen({ scope }: { scope?: "club" | "player" }) {
  const params = useParams();
  const { data, getPlayer, getTeam, status } = usePlatform();
  const [tab, setTab] = useState("전체"),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("최신순");
  const target =
    scope === "club"
      ? String(params.teamId)
      : scope === "player"
        ? String(params.playerId)
        : null;
  const team = scope === "club" ? getTeam(target) : undefined,
    player = scope === "player" ? getPlayer(target) : undefined;
  const title = team
    ? `${team.name} 팬 라운지`
    : player
      ? `${player.name} 라운지`
      : scope === "club"
        ? "구단 라운지"
        : scope === "player"
          ? "선수 라운지"
          : "커뮤니티";
  const all = data.posts.filter(
    (p) => !scope || (p.scope === scope && p.target === target),
  );
  const posts = all
    .filter(
      (p) =>
        (tab === "전체" || p.category === tab) &&
        `${p.title} ${p.body} ${p.author}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "인기순"
        ? b.likes - a.likes
        : Date.parse(b.date) - Date.parse(a.date),
    );
  return (
    <>
      {scope && <BackLink href="/community" label="커뮤니티" />}
      <PageHeading
        eyebrow={scope ? "THE FAN LOUNGE" : "FOOTBALL CONNECTS US"}
        title={title}
        description="같은 열정, 새로운 시선. 축구 이야기는 여기서 계속됩니다."
        action={
          <Link
            className="button primary"
            href={`/community/write${scope && target ? `?scope=${scope}&target=${encodeURIComponent(target)}` : ""}`}
          >
            <Pencil size={16} />
            글쓰기
          </Link>
        }
      />
      {scope ? (
        <section className="lounge-banner">
          {team ? (
            <TeamBadge id={team.id} size="large" />
          ) : player ? (
            <PlayerAvatar player={player} large />
          ) : (
            <MessageCircle size={36} />
          )}
          <div>
            <span className="eyebrow">FAN COMMUNITY</span>
            <h2>
              {scope === "club"
                ? "함께 응원할 때, 더 커지는 경기."
                : "경기력부터 가치까지, 함께 보는 선수."}
            </h2>
            <p>
              {status === "ready" && !team && !player
                ? "요청한 라운지를 찾을 수 없습니다."
                : "라운지 정보와 게시글이 이곳에 표시됩니다."}
            </p>
          </div>
          {player && (
            <Link className="button secondary" href={`/players/${player.id}`}>
              선수 상세 <ArrowRight size={16} />
            </Link>
          )}
        </section>
      ) : (
        <section className="club-discovery">
          <SectionTitle
            title="나의 팀, 나의 라운지"
            href="/mypage"
            link="응원 구단 설정"
          />
          {data.teams.length ? (
            <div className="club-grid">
              {data.teams.map((t) => (
                <Link
                  className="club-card"
                  href={`/community/clubs/${t.id}`}
                  key={t.id}
                >
                  <TeamBadge id={t.id} />
                  <strong>{t.name}</strong>
                  <span>{t.english}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel">
              <DataEmpty entity="구단 라운지" />
            </div>
          )}
        </section>
      )}
      <div className="community-layout">
        <section className="panel">
          <div className="browser-tabs">
            <Tabs
              items={["전체", ...data.categories]}
              value={tab}
              onChange={setTab}
            />
          </div>
          <div className="filter-row">
            <div className="input-search">
              <Search size={16} />
              <input
                aria-label="게시글 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="제목, 내용, 작성자 검색"
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
          <PostList posts={posts} filtered={all.length > 0} />
        </section>
        <aside>
          <section className="panel">
            <SectionTitle title="선수 라운지" />
            {data.players.slice(0, 5).map((p) => (
              <Link
                className="trending-lounge"
                href={`/community/players/${p.id}`}
                key={p.id}
              >
                <PlayerAvatar player={p} />
                <div>
                  <strong>{p.name}</strong>
                  <span>{getTeam(p.team)?.name}</span>
                </div>
                <ArrowRight size={15} />
              </Link>
            ))}
            {!data.players.length && <DataEmpty entity="선수 라운지" />}
          </section>
          <div className="community-guide">
            <MessageCircle size={22} />
            <h3>축구로 이어지는 이야기</h3>
            <p>경기를 보는 시선과 선수에 대한 생각을 나누는 공간입니다.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function PostDetail() {
  const params = useParams();
  const { data, status } = usePlatform();
  const post = data.posts.find((p) => p.id === params.postId);
  const [comment, setComment] = useState(""),
    [action, setAction] = useState<"report" | "delete" | null>(null),
    [reason, setReason] = useState("");
  const comments = data.comments.filter((c) => c.postId === post?.id),
    owner = !!post && post.authorId === data.session?.userId;
  return (
    <div className="reading-width">
      <BackLink href="/community" label="커뮤니티" />
      <article className="panel article-panel">
        <span className="category-tag">{post?.category || "POST"}</span>
        <h1>{post?.title || "게시글 상세"}</h1>
        {post ? (
          <>
            <div className="article-author">
              <span className="user-avatar">{post.author.slice(0, 1)}</span>
              <div>
                <strong>{post.author}</strong>
                <span>
                  {dateText(post.date)} · 조회 {money(post.views)}
                </span>
              </div>
              {owner && (
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
                    onClick={() => setAction("delete")}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
            <div className="article-body">{post.body}</div>
            {post.transaction && (
              <div className="attached-trade">
                <Paperclip size={18} />
                <div>
                  <strong>
                    {post.transaction.playerName} ·{" "}
                    {post.transaction.type === "buy" ? "매입" : "매각"}
                  </strong>
                  <p>
                    {money(post.transaction.price)} P ·{" "}
                    {dateText(post.transaction.date)}
                  </p>
                </div>
              </div>
            )}
            <div className="article-actions">
              <DisabledAction>
                <Heart size={16} />
                공감 {money(post.likes)}
              </DisabledAction>
              <button
                className="button secondary"
                onClick={() => setAction("report")}
              >
                <Flag size={16} />
                신고
              </button>
            </div>
          </>
        ) : (
          <DataEmpty entity={status === "ready" ? "요청한 게시글" : "게시글"} />
        )}
      </article>
      <section className="panel comments-panel">
        <SectionTitle
          title="댓글"
          meta={post ? `${comments.length}개` : undefined}
        />
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <span className="user-avatar small">{c.author.slice(0, 1)}</span>
            <div>
              <strong>{c.author}</strong>
              <span>{dateText(c.date)}</span>
              <p>{c.body}</p>
              {c.authorId === data.session?.userId && (
                <div className="button-row">
                  <DisabledAction className="button secondary small">
                    수정
                  </DisabledAction>
                  <DisabledAction className="button secondary small">
                    삭제
                  </DisabledAction>
                </div>
              )}
            </div>
          </div>
        ))}
        {!comments.length && <DataEmpty entity="댓글" />}
        <form className="comment-form" onSubmit={(e) => e.preventDefault()}>
          <label className="sr-only" htmlFor="comment-body">
            댓글 내용
          </label>
          <textarea
            id="comment-body"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글 서비스 준비 중입니다"
            rows={3}
          />
          <DisabledAction className="button primary">
            <Send size={16} />
            댓글 등록
          </DisabledAction>
        </form>
        <p className="fine-print">
          댓글과 공감·신고 서비스 준비 중입니다. 입력한 내용은 저장되지
          않습니다.
        </p>
      </section>
      {action && (
        <Modal
          title={action === "report" ? "게시글 신고" : "게시글 삭제"}
          onClose={() => setAction(null)}
        >
          {action === "report" && (
            <label className="modal-field">
              신고 사유
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="신고 사유를 입력하세요"
              />
            </label>
          )}
          <p className="muted">
            처리 서비스 준비 중입니다. 현재는 요청을 제출할 수 없습니다.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setAction(null)}
            >
              닫기
            </button>
            <DisabledAction className="button primary">
              {action === "report" ? "신고 제출" : "삭제 확인"}
            </DisabledAction>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function WritePost() {
  const sp = useSearchParams();
  const { data } = usePlatform();
  const existing = data.posts.find(
    (p) => p.id === sp.get("edit") && p.authorId === data.session?.userId,
  );
  const [scopeDraft, setScope] = useState<"club" | "player" | null>(null);
  const [targetDraft, setTarget] = useState<string | null>(null);
  const scope =
    scopeDraft ??
    existing?.scope ??
    (sp.get("scope") === "player" ? "player" : "club");
  const target = targetDraft ?? existing?.target ?? sp.get("target") ?? "";
  const [title, setTitle] = useState<string | null>(null),
    [body, setBody] = useState<string | null>(null),
    [category, setCategory] = useState<string | null>(null),
    [transactionDraft, setTransaction] = useState<string | null>(null);
  const transaction = transactionDraft ?? existing?.transaction?.id ?? "";
  const targets = scope === "club" ? data.teams : data.players;
  return (
    <div className="reading-width">
      <BackLink href="/community" label="커뮤니티" />
      <PageHeading
        eyebrow="SHARE YOUR PERSPECTIVE"
        title={sp.has("edit") ? "게시글 수정" : "새로운 이야기"}
      />
      <MemberNotice />
      <form onSubmit={(e) => e.preventDefault()} className="panel write-form">
        <div className="form-grid">
          <label>
            게시판 종류
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as "club" | "player");
                setTarget("");
              }}
            >
              <option value="club">구단 커뮤니티</option>
              <option value="player">선수 커뮤니티</option>
            </select>
          </label>
          <label>
            대상 {scope === "club" ? "구단" : "선수"}
            <select
              disabled={!targets.length}
              value={targets.some((t) => t.id === target) ? target : ""}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">대상 선택</option>
              {targets.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          주제
          <select
            disabled={!data.categories.length}
            value={category ?? existing?.category ?? ""}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">주제 선택</option>
            {data.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          제목
          <input
            value={title ?? existing?.title ?? ""}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이야기의 제목을 입력하세요"
          />
        </label>
        <label>
          내용
          <textarea
            value={body ?? existing?.body ?? ""}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="경기에 대한 생각과 선수에 대한 이야기를 나눠보세요"
          />
        </label>
        <label className="attachment-label">
          <span>
            <Paperclip size={16} />내 거래 내역 첨부 <small>선택</small>
          </span>
          <select
            disabled={!data.member?.transactions.length}
            value={transaction}
            onChange={(e) => setTransaction(e.target.value)}
          >
            <option value="">첨부하지 않음</option>
            {data.member?.transactions.map((t) => (
              <option value={t.id} key={t.id}>
                {t.playerName} · {t.type === "buy" ? "매입" : "매각"} ·{" "}
                {money(t.price)} P
              </option>
            ))}
          </select>
        </label>
        <p className="fine-print">
          게시글 저장 서비스 준비 중입니다. 입력한 내용은 저장되지 않습니다.
        </p>
        <div className="form-actions">
          <Link className="button secondary" href="/community">
            취소
          </Link>
          <DisabledAction className="button primary">
            <Pencil size={16} />
            {sp.has("edit") ? "수정 저장" : "게시글 등록"}
          </DisabledAction>
        </div>
      </form>
    </div>
  );
}

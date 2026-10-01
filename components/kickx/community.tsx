"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, Flag, Heart, Lock, MessageCircle, Paperclip, Pencil, Search, Send, Trash2, Users } from "lucide-react";
import { dateText, money, relativeTime } from "@/lib/kickx/data";
import type { Post } from "@/lib/kickx/types";
import { usePlatform } from "./provider";
import { BackLink, Change, DataEmpty, DisabledAction, Empty, MemberNotice, Modal, PageHeading, PlayerPortrait, SectionTitle, Tabs, TeamBadge } from "./ui";

const HUB = { club: "/community/clubs", player: "/community/players" } as const;
function useTargetName() {
  const { getTeam, getPlayer } = usePlatform();
  return (post: Post) => (post.scope === "club" ? getTeam(post.target)?.name : getPlayer(post.target)?.name) || "—";
}
function PostList({ posts, filtered, showTarget = true }: { posts: Post[]; filtered?: boolean; showTarget?: boolean }) {
  const targetName = useTargetName();
  return posts.length ? (
    <ul className="post-list">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/community/posts/${p.id}`} className="post-row">
            <div className="post-row-main">
              <div className="post-meta">
                <span className="category-tag">{p.category}</span>
                {showTarget && <span className="post-target">{targetName(p)}</span>}
              </div>
              <h3>{p.title}{p.transaction && <span className="tag outline"><Paperclip size={12} />거래 첨부</span>}</h3>
              <p className="post-preview">{p.body}</p>
              <div className="post-byline">
                <span className="post-author">{p.author}</span>
                <span>{relativeTime(p.date)}</span>
                <span><Eye size={13} />{money(p.views)}</span>
              </div>
            </div>
            <div className="post-counts">
              <span><Heart size={15} /><b className="num">{money(p.likes)}</b></span>
              <span><MessageCircle size={15} /><b className="num">{money(p.commentCount)}</b></span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <DataEmpty entity="게시글" filtered={filtered} rows={4} />
  );
}
function PostBrowser({ posts, showTarget = true }: { posts: Post[]; showTarget?: boolean }) {
  const { data } = usePlatform();
  const [tab, setTab] = useState("전체"),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("최신순");
  const visible = posts
    .filter((p) => (tab === "전체" || p.category === tab) && `${p.title} ${p.body} ${p.author}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === "인기순" ? b.likes - a.likes : Date.parse(b.date) - Date.parse(a.date)));
  return (
    <section className="panel flush post-browser">
      <div className="panel-head">
        <Tabs items={["전체", ...data.categories]} value={tab} onChange={setTab} label="게시글 주제" />
      </div>
      <div className="toolbar post-tools">
        <label className="input-search"><Search size={16} /><input aria-label="게시글 검색" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 내용, 작성자 검색" /></label>
        <select aria-label="게시글 정렬" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option>최신순</option>
          <option>인기순</option>
        </select>
      </div>
      <PostList posts={visible} filtered={posts.length > 0} showTarget={showTarget} />
    </section>
  );
}
function PopularPosts({ posts }: { posts: Post[] }) {
  const targetName = useTargetName();
  const top = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5);
  return (
    <section className="panel">
      <SectionTitle title="인기 게시글" meta="공감 순" />
      {top.length ? (
        <ol className="popular-list">
          {top.map((p, i) => (
            <li key={p.id}>
              <span className="num">{i + 1}</span>
              <Link href={`/community/posts/${p.id}`}>
                <strong>{p.title}</strong>
                <small>{targetName(p)} · 공감 {money(p.likes)}</small>
              </Link>
            </li>
          ))}
        </ol>
      ) : <DataEmpty entity="인기 게시글" rows={3} />}
    </section>
  );
}
export function CommunityHub({ kind }: { kind: "club" | "player" }) {
  const { data, status, getTeam } = usePlatform();
  const [league, setLeague] = useState("전체");
  const [q, setQ] = useState("");
  const posts = data.posts.filter((p) => p.scope === kind);
  const count = (target: string) => posts.filter((p) => p.target === target).length;
  const myTeam = getTeam(data.session?.profile?.team);
  const leagueId = data.leagues.find((l) => l.name === league)?.id;
  const clubs = data.teams.filter((t) => league === "전체" || t.leagueId === leagueId);
  const owned = new Set(data.member?.holdings.map((h) => h.playerId));
  const lounges = data.players
    .filter((p) => `${p.name} ${p.english || ""} ${getTeam(p.team)?.name || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => count(b.id) - count(a.id) || Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))
    .slice(0, q ? 24 : 12);
  return (
    <>
      <PageHeading
        eyebrow={kind === "club" ? "CLUB COMMUNITY" : "PLAYER COMMUNITY"}
        title={kind === "club" ? "구단 커뮤니티" : "선수 커뮤니티"}
        description={kind === "club" ? "같은 팀을 응원하는 팬들과 경기·이적·구단 이슈를 나누세요." : "선수의 경기력과 가치 변화, 거래 판단을 함께 이야기하세요."}
        action={<Link className="button primary" href={`/community/write?scope=${kind}`}><Pencil size={16} />글쓰기</Link>}
      />
      {kind === "club" ? (
        <>
          <div className={`my-club ${myTeam ? "" : "unset"}`}>
            {myTeam ? (
              <>
                <TeamBadge id={myTeam.id} size="large" />
                <div><span>나의 응원 구단</span><strong>{myTeam.name}</strong><small>응원 구단 라운지에서 글과 댓글을 작성할 수 있습니다.</small></div>
                <Link className="button primary" href={`/community/clubs/${myTeam.id}`}>라운지 입장 <ArrowRight size={16} /></Link>
              </>
            ) : (
              <>
                <span className="my-club-icon"><Users size={24} /></span>
                <div><span>응원 구단 미설정</span><strong>응원 구단을 정하고 팬 라운지에 참여하세요</strong><small>구단 라운지의 글·댓글 작성은 해당 구단 팬에게만 열립니다.</small></div>
                <Link className="button secondary" href="/mypage">응원 구단 설정 <ArrowRight size={16} /></Link>
              </>
            )}
          </div>
          <div className="hub-layout">
            <section>
              <div className="section-title">
                <h2>구단 라운지<span>{data.teams.length ? `${clubs.length}개 구단` : ""}</span></h2>
              </div>
              <Tabs items={["전체", ...data.leagues.map((l) => l.name)]} value={league} onChange={setLeague} label="리그 선택" />
              {clubs.length ? (
                <div className="club-grid">
                  {clubs.map((t) => (
                    <Link className={`club-tile hover-lift ${t.id === myTeam?.id ? "mine" : ""}`} href={`/community/clubs/${t.id}`} key={t.id}>
                      <TeamBadge id={t.id} size="large" />
                      <strong>{t.name}</strong>
                      <span>{t.english}</span>
                      <small className="num">게시글 {count(t.id)}</small>
                      {t.id === myTeam?.id && <span className="tag yellow">MY CLUB</span>}
                    </Link>
                  ))}
                </div>
              ) : <div className="panel"><DataEmpty entity="구단 라운지" status={status === "ready" && data.teams.length ? "ready" : undefined} filtered={data.teams.length > 0} /></div>}
            </section>
            <aside><PopularPosts posts={posts} /></aside>
          </div>
        </>
      ) : (
        <>
          {owned.size > 0 && (
            <div className="owned-lounges">
              <span>내 보유 선수 라운지</span>
              <div>
                {data.players.filter((p) => owned.has(p.id)).map((p) => (
                  <Link key={p.id} href={`/community/players/${p.id}`} className="lounge-chip"><PlayerPortrait player={p} size="sm" />{p.short || p.name}</Link>
                ))}
              </div>
            </div>
          )}
          <div className="hub-layout">
            <section>
              <div className="section-title">
                <h2>{q ? "검색 결과" : "지금 뜨거운 선수 라운지"}<span>{q ? `${lounges.length}명` : "게시글 · 변동 순"}</span></h2>
                <label className="input-search hub-search"><Search size={16} /><input aria-label="선수 라운지 검색" placeholder="선수 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              </div>
              {lounges.length ? (
                <div className="lounge-grid">
                  {lounges.map((p) => (
                    <Link className="lounge-card hover-lift" href={`/community/players/${p.id}`} key={p.id}>
                      <PlayerPortrait player={p} size="md" />
                      <span className="lounge-card-text">
                        <strong>{p.name}</strong>
                        <span>{getTeam(p.team)?.name || "—"}</span>
                      </span>
                      <span className="lounge-card-meta">
                        <Change value={p.change} />
                        <small className="num"><MessageCircle size={12} />{count(p.id)}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : <div className="panel"><DataEmpty entity="선수 라운지" filtered={!!q && data.players.length > 0} /></div>}
            </section>
            <aside><PopularPosts posts={posts} /></aside>
          </div>
        </>
      )}
      <div className="hub-posts">
        <SectionTitle title={kind === "club" ? "최근 구단 게시글" : "최근 선수 게시글"} />
        <PostBrowser posts={posts} />
      </div>
    </>
  );
}
export function CommunityScreen({ scope }: { scope: "club" | "player" }) {
  const params = useParams();
  const { data, getPlayer, getTeam, getLeague, status } = usePlatform();
  const target = scope === "club" ? String(params.teamId) : String(params.playerId);
  const team = scope === "club" ? getTeam(target) : undefined,
    player = scope === "player" ? getPlayer(target) : undefined;
  const found = team || player;
  const posts = data.posts.filter((p) => p.scope === scope && p.target === target);
  const isFan = scope === "player" || (!!data.session?.profile?.team && data.session.profile.team === target);
  const writable = !!found && !!data.session && isFan;
  const squad = team ? data.players.filter((p) => p.team === team.id) : [];
  return (
    <>
      <BackLink href={HUB[scope]} label={scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"} />
      <section className={`lounge-hero ${scope}`}>
        <div className="lounge-hero-mark">
          {team ? <TeamBadge id={team.id} size="large" /> : player ? <PlayerPortrait player={player} size="lg" /> : <MessageCircle size={36} />}
        </div>
        <div className="lounge-hero-text">
          <span className="eyebrow plain">{scope === "club" ? "CLUB LOUNGE" : "PLAYER LOUNGE"}{team && ` · ${getLeague(team.leagueId)?.name || ""}`}{player && ` · ${getTeam(player.team)?.name || ""}`}</span>
          <h1>{team ? `${team.name} 팬 라운지` : player ? `${player.name} 라운지` : scope === "club" ? "구단 라운지" : "선수 라운지"}</h1>
          <p>
            {status === "ready" && !found
              ? "요청한 라운지를 찾을 수 없습니다."
              : scope === "club"
                ? "함께 응원할 때, 더 커지는 경기."
                : "경기력부터 가치까지, 함께 보는 선수."}
          </p>
        </div>
        <div className="lounge-hero-stats">
          <div><span>게시글</span><b className="num">{found ? posts.length : "—"}</b></div>
          {player && <div><span>현재 가치</span><b className="num">{money(player.price)} P</b><Change value={player.change} /></div>}
          {team && <div><span>등록 선수</span><b className="num">{squad.length}</b></div>}
        </div>
        <div className="lounge-hero-actions">
          {writable ? (
            <Link className="button primary" href={`/community/write?scope=${scope}&target=${encodeURIComponent(target)}`}><Pencil size={16} />글쓰기</Link>
          ) : (
            <button className="button primary" disabled title={!data.session ? "로그인 후 작성할 수 있습니다." : "응원 구단 팬만 작성할 수 있습니다."}><Lock size={15} />글쓰기</button>
          )}
          {player && <Link className="button secondary" href={`/players/${player.id}`}>선수 상세 <ArrowRight size={16} /></Link>}
        </div>
      </section>
      {scope === "club" && found && data.session && !isFan && (
        <div className="data-notice"><Lock size={16} /><span>구단 라운지의 글·댓글 작성은 <b>{team?.name}</b> 응원 팬에게만 열려 있습니다. 읽기는 누구나 가능합니다.</span><Link className="text-link" href="/mypage">응원 구단 설정</Link></div>
      )}
      <MemberNotice />
      <div className="hub-layout">
        <PostBrowser posts={posts} showTarget={false} />
        <aside>
          {team ? (
            <section className="panel">
              <SectionTitle title="구단 선수 라운지" />
              {squad.length ? (
                <ul className="side-players">
                  {squad.map((p) => (
                    <li key={p.id}>
                      <Link href={`/community/players/${p.id}`}>
                        <PlayerPortrait player={p} size="sm" />
                        <span><strong>{p.name}</strong><small>{p.position || "—"} · {money(p.price)} P</small></span>
                        <Change value={p.change} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <DataEmpty entity="선수" rows={3} />}
            </section>
          ) : player ? (
            <section className="panel">
              <SectionTitle title="선수 요약" href={`/players/${player.id}`} link="상세" />
              <dl className="summary-list">
                <div><dt>현재 가치</dt><dd>{money(player.price)} P</dd></div>
                <div><dt>변동</dt><dd><Change value={player.change} /></dd></div>
                <div><dt>Performance</dt><dd>{money(player.performance)}</dd></div>
                <div><dt>시즌 득점 · 도움</dt><dd>{money(player.goals)} · {money(player.assists)}</dd></div>
              </dl>
            </section>
          ) : null}
          <div className="community-guide">
            <MessageCircle size={20} />
            <h3>함께 지키는 라운지 규칙</h3>
            <p>근거 있는 의견, 서로 다른 응원에 대한 존중. 거래 내역 첨부는 본인 거래만 가능합니다.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function PostDetail() {
  const params = useParams();
  const { data, status, getTeam, getPlayer } = usePlatform();
  const post = data.posts.find((p) => p.id === params.postId);
  const [comment, setComment] = useState(""),
    [action, setAction] = useState<"report" | "delete" | null>(null),
    [reason, setReason] = useState("");
  const comments = data.comments.filter((c) => c.postId === post?.id),
    owner = !!post && post.authorId === data.session?.userId;
  const scope = post?.scope ?? "club";
  const targetName = post ? (post.scope === "club" ? getTeam(post.target)?.name : getPlayer(post.target)?.name) : null;
  const loungeHref = post ? `${HUB[post.scope]}/${post.target}` : "/community/clubs";
  return (
    <div className="reading-width">
      <BackLink href={loungeHref} label={targetName ? `${targetName} 라운지` : "커뮤니티"} />
      <article className="article">
        {post ? (
          <>
            <div className="article-crumbs">
              <Link href={HUB[scope]}>{scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"}</Link>
              <span aria-hidden="true">›</span>
              <Link href={loungeHref}>{targetName || "—"}</Link>
              <span className="category-tag">{post.category}</span>
            </div>
            <h1>{post.title}</h1>
            <div className="article-author">
              <span className="rank-avatar">{post.author.slice(0, 1)}</span>
              <div>
                <strong>{post.author}</strong>
                <span>{dateText(post.date)} · 조회 {money(post.views)}</span>
              </div>
              {owner && (
                <div className="button-row">
                  <Link className="icon-button" href={`/community/write?edit=${post.id}`} aria-label="글 수정"><Pencil size={17} /></Link>
                  <button className="icon-button" aria-label="글 삭제" onClick={() => setAction("delete")}><Trash2 size={17} /></button>
                </div>
              )}
            </div>
            <div className="article-body">{post.body}</div>
            {post.transaction && (
              <div className="attached-trade">
                <span className="attached-label"><Paperclip size={14} />첨부된 거래</span>
                <div className="attached-row">
                  <span className={`trade-type ${post.transaction.type}`}>{post.transaction.type === "buy" ? "매입" : "매각"}</span>
                  <strong>{post.transaction.playerName}</strong>
                  <span className="num">{money(post.transaction.price)} P</span>
                  <span className="muted">{dateText(post.transaction.date)}</span>
                </div>
              </div>
            )}
            <div className="article-actions">
              <DisabledAction><Heart size={16} />공감 <b className="num">{money(post.likes)}</b></DisabledAction>
              <button className="button ghost" onClick={() => setAction("report")}><Flag size={16} />신고</button>
            </div>
          </>
        ) : status === "ready" ? (
          <Empty title="게시글을 찾을 수 없습니다" description="삭제되었거나 주소가 올바르지 않습니다." action={<Link className="button primary small" href="/community/clubs">커뮤니티로</Link>} />
        ) : (
          <DataEmpty entity="게시글" />
        )}
      </article>
      <section className="comments">
        <SectionTitle title="댓글" meta={post ? `${comments.length}개` : undefined} />
        <form className="comment-form" onSubmit={(e) => e.preventDefault()}>
          <label className="sr-only" htmlFor="comment-body">댓글 내용</label>
          <textarea id="comment-body" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={data.session ? "댓글 서비스 준비 중입니다" : "로그인 후 댓글을 작성할 수 있습니다"} rows={3} />
          <div className="comment-form-foot">
            <span className="fine-print">댓글·공감·신고 저장 서비스 준비 중입니다.</span>
            <DisabledAction className="button primary small"><Send size={15} />댓글 등록</DisabledAction>
          </div>
        </form>
        <ul className="comment-list">
          {comments.map((c) => (
            <li className="comment" key={c.id}>
              <span className="rank-avatar">{c.author.slice(0, 1)}</span>
              <div>
                <div className="comment-head"><strong>{c.author}</strong>{c.authorId === post?.authorId && <span className="tag">작성자</span>}<span>{relativeTime(c.date)}</span></div>
                <p>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {post && !comments.length && <p className="comment-empty">첫 댓글을 남겨보세요.</p>}
      </section>
      {action && (
        <Modal title={action === "report" ? "게시글 신고" : "게시글 삭제"} onClose={() => setAction(null)}>
          {action === "report" && (
            <label className="modal-field">
              신고 사유
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="신고 사유를 입력하세요" />
            </label>
          )}
          <p className="fine-print">처리 서비스 준비 중입니다. 현재는 요청을 제출할 수 없습니다.</p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setAction(null)}>닫기</button>
            <DisabledAction className="button primary">{action === "report" ? "신고 제출" : "삭제 확인"}</DisabledAction>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function WritePost() {
  const sp = useSearchParams();
  const { data } = usePlatform();
  const existing = data.posts.find((p) => p.id === sp.get("edit") && p.authorId === data.session?.userId);
  const [scopeDraft, setScope] = useState<"club" | "player" | null>(null);
  const [targetDraft, setTarget] = useState<string | null>(null);
  const scope = scopeDraft ?? existing?.scope ?? (sp.get("scope") === "player" ? "player" : "club");
  const target = targetDraft ?? existing?.target ?? sp.get("target") ?? "";
  const [title, setTitle] = useState<string | null>(null),
    [body, setBody] = useState<string | null>(null),
    [category, setCategory] = useState<string | null>(null),
    [transactionDraft, setTransaction] = useState<string | null>(null);
  const transaction = transactionDraft ?? existing?.transaction?.id ?? "";
  const myTeam = data.session?.profile?.team;
  const targets = scope === "club" ? data.teams.filter((t) => !myTeam || t.id === myTeam) : data.players;
  const bodyText = body ?? existing?.body ?? "";
  return (
    <div className="reading-width">
      <BackLink href={HUB[scope]} label={scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"} />
      <PageHeading eyebrow="SHARE YOUR PERSPECTIVE" title={sp.has("edit") ? "게시글 수정" : "새 게시글"} description="경기를 본 시선, 선수에 대한 생각, 나의 거래 판단을 나눠보세요." />
      <MemberNotice />
      <form onSubmit={(e) => e.preventDefault()} className="panel frame write-form">
        <div className="write-scope" role="group" aria-label="게시판 종류">
          {(["club", "player"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={scope === value} className={scope === value ? "active" : ""} onClick={() => { setScope(value); setTarget(""); }}>
              <strong>{value === "club" ? "구단 커뮤니티" : "선수 커뮤니티"}</strong>
              <span>{value === "club" ? "응원 구단 팬 전용" : "모든 회원"}</span>
            </button>
          ))}
        </div>
        <div className="form-grid">
          <label>
            대상 {scope === "club" ? "구단" : "선수"}
            <select disabled={!targets.length} value={targets.some((t) => t.id === target) ? target : ""} onChange={(e) => setTarget(e.target.value)}>
              <option value="">대상 선택</option>
              {targets.map((t) => <option value={t.id} key={t.id}>{t.name}</option>)}
            </select>
            {scope === "club" && <small>{myTeam ? "응원 구단 라운지에만 작성할 수 있습니다." : "응원 구단을 설정하면 해당 구단 라운지에 작성할 수 있습니다."}</small>}
          </label>
          <label>
            주제
            <select disabled={!data.categories.length} value={category ?? existing?.category ?? ""} onChange={(e) => setCategory(e.target.value)}>
              <option value="">주제 선택</option>
              {data.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label>
          제목
          <input value={title ?? existing?.title ?? ""} onChange={(e) => setTitle(e.target.value)} placeholder="이야기의 제목을 입력하세요" maxLength={80} />
        </label>
        <label>
          <span className="label-row">내용<small className="num">{bodyText.length} / 3,000</small></span>
          <textarea value={bodyText} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={3000} placeholder="경기에 대한 생각과 선수에 대한 이야기를 나눠보세요" />
        </label>
        <label className="attachment-label">
          <span className="label-row"><span><Paperclip size={15} /> 내 거래 내역 첨부</span><small>선택</small></span>
          <select disabled={!data.member?.transactions.length} value={transaction} onChange={(e) => setTransaction(e.target.value)}>
            <option value="">첨부하지 않음</option>
            {data.member?.transactions.map((t) => (
              <option value={t.id} key={t.id}>{t.playerName} · {t.type === "buy" ? "매입" : "매각"} · {money(t.price)} P · {dateText(t.date, false)}</option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <p className="fine-print">게시글 저장 서비스 준비 중입니다. 입력한 내용은 저장되지 않습니다.</p>
          <Link className="button secondary" href={HUB[scope]}>취소</Link>
          <DisabledAction className="button primary"><Pencil size={16} />{sp.has("edit") ? "수정 저장" : "게시글 등록"}</DisabledAction>
        </div>
      </form>
    </div>
  );
}

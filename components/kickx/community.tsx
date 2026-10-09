"use client";
import { Select } from "./select";
import { simple, useTeamOptions } from "./options";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Eye, Heart, LoaderCircle, Lock, MessageCircle, Paperclip, Pencil, Search, Users } from "lucide-react";
import { dateText, money, relativeTime, score } from "@/lib/kickx/data";
import type { Post, Player } from "@/lib/kickx/types";
import { clubIdentity, leagueIdentity } from "@/lib/kickx/club-identity";
import { POST_LIMITS, validatePost, type PostField } from "@/lib/kickx/validation";
import {apiRequest} from "@/lib/kickx/client";
import {usePost} from "./community-detail";
import { usePlatform, useResource } from "./provider";
import { useCatalogPage, useCatalogPlayer } from "./catalog";
import { BackLink, Change, ClubCrest, LeagueMark, useClub, DataEmpty, MemberNotice, PageHeading, PlayerPortrait, SectionTitle, Tabs, TeamBadge } from "./ui";

const HUB = { club: "/community/clubs", player: "/community/players" } as const;
function useTargetName() {
  const { getTeam, getPlayer } = usePlatform();
  return (post: Post) => post.targetName || (post.scope === "club" ? getTeam(post.target)?.name : getPlayer(post.target)?.name) || "—";
}
/** Club crest for club posts, or the player's club crest for player posts. */
function PostTarget({ post, name }: { post: Post; name: string }) {
  const { getPlayer } = usePlatform();
  const crest = post.scope === "club" ? post.target : getPlayer(post.target)?.team ?? null;
  return <span className="post-target"><ClubCrest id={crest} size="small" />{post.scope === "player" && <span className="post-target-kind">선수</span>}{name}</span>;
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
                {showTarget && <PostTarget post={p} name={targetName(p)} />}
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
const emptyPosts=()=>({items:[] as Post[],total:0,page:1,size:20});
function PostBrowser({ posts, scope, target, showTarget = true }: { posts: Post[]; scope:"club"|"player";target?:string; showTarget?: boolean }) {
  const { data, mock, status } = usePlatform();
  const [tab, setTab] = useState("전체"),
    [q, setQ] = useState(""),
    [sort, setSort] = useState("최신순");
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState(q);
  useEffect(()=>{const timer=setTimeout(()=>{setSearch(q);setPage(1);},250);return()=>clearTimeout(timer);},[q]);
  const params=new URLSearchParams({scope,q:search,sort:sort==="인기순"?"popular":"new",page:String(page)});
  if(target)params.set("target",target);if(tab!=="전체")params.set("category",tab);
  const remote=useResource(!mock&&status==="ready"?`/api/kickx/community?${params}`:null,emptyPosts);
  const visible = posts
    .filter((p) => (tab === "전체" || p.category === tab) && `${p.title} ${p.body} ${p.author}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === "인기순" ? b.likes - a.likes : Date.parse(b.date) - Date.parse(a.date)));
  return (
    <section className="panel flush post-browser">
      <div className="panel-head">
        <Tabs items={["전체", ...data.categories]} value={tab} onChange={v=>{setTab(v);setPage(1);}} label="게시글 주제" />
      </div>
      <div className="toolbar post-tools">
        <label className="input-search"><Search size={16} /><input aria-label="게시글 검색" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 내용 검색" /></label>
        <Select label="게시글 정렬" value={sort} onChange={v=>{setSort(v);setPage(1);}} options={simple(["최신순", "인기순"])} variant="compact" />
      </div>
      {!mock&&remote.status!=="ready"?<DataEmpty entity="게시글" status={remote.status}/>:<PostList posts={mock?visible:remote.data.items} filtered={!!q||tab!=="전체"} showTarget={showTarget} />}
      {!mock&&<div className="button-row frame"><button className="button secondary small" disabled={page===1} onClick={()=>setPage(p=>p-1)}>이전</button><span>{page} 페이지 · {remote.status==="ready"?remote.data.total:"—"}건</span><button className="button secondary small" disabled={page*20>=remote.data.total} onClick={()=>setPage(p=>p+1)}>다음</button></div>}
    </section>
  );
}
function PopularPosts({ posts,scope }: { posts: Post[];scope:"club"|"player" }) {
  const {mock,status}=usePlatform();
  const remote=useResource(!mock&&status==="ready"?`/api/kickx/community?scope=${scope}&sort=popular`:null,emptyPosts);
  const targetName = useTargetName();
  const top = [...(mock?posts:remote.data.items)].sort((a, b) => b.likes - a.likes).slice(0, 5);
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
function ClubTile({ id, mine, posts }: { id: string; mine: boolean; posts: number | null }) {
  const { team, identity } = useClub(id);
  if (!team) return null;
  return (
    <Link className={`club-tile ${mine ? "mine" : ""}`} href={`/community/clubs/${id}`} style={{ "--club": identity?.primary, "--club-2": identity?.secondary } as CSSProperties}>
      <span className="club-tile-band" aria-hidden="true" />
      <span className="club-tile-code" aria-hidden="true">{identity?.code}</span>
      <ClubCrest id={id} size="large" />
      <strong>{team.name}</strong>
      {team.english && team.english !== team.name && <span className="club-tile-sub">{team.english}</span>}
      <span className="club-tile-foot">
        <small className="num"><MessageCircle size={12} />{posts??"—"}</small>
        <span className="club-tile-go">라운지 <ArrowRight size={13} /></span>
      </span>
      {mine && <span className="tag yellow">MY CLUB</span>}
    </Link>
  );
}
export function CommunityHub({ kind }: { kind: "club" | "player" }) {
  const { data, status, getTeam } = usePlatform();
  const [league, setLeague] = useState("전체");
  const [q, setQ] = useState("");
  const posts = data.posts.filter((p) => p.scope === kind);
  const count = (target: string) => data.communityCounts?.find(c=>c.scope===kind&&c.target===target)?.count ?? (data.policy?0:posts.filter(p=>p.target===target).length);
  const myTeam = getTeam(data.session?.profile?.team);
  const leagueId = data.leagues.find((l) => l.name === league)?.id;
  const clubs = data.teams.filter((t) => league === "전체" || t.leagueId === leagueId);
  const owned = new Set(data.member?.holdings.map((h) => h.playerId));
  const localLounges = data.players
    .filter((p) => `${p.name} ${p.english || ""} ${getTeam(p.team)?.name || ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => count(b.id) - count(a.id) || Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))
    .slice(0, q ? 24 : 12);
  const remote=useCatalogPage<Player>("players",{q,size:24,sort:"name"});
  const lounges=remote.enabled ? (remote.status === "ready" ? remote.data.items : []) : localLounges;
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
              <div className="league-switch" role="group" aria-label="리그 선택">
                {["전체", ...data.leagues.map((l) => l.name)].map((name) => {
                  const l = data.leagues.find((x) => x.name === name);
                  const n = l ? data.teams.filter((t) => t.leagueId === l.id).length : data.teams.length;
                  return (
                    <button key={name} type="button" aria-pressed={league === name} className={league === name ? "active" : ""} onClick={() => setLeague(name)}>
                      {l ? <LeagueMark league={l} size="sm" /> : <span className="league-all">ALL</span>}
                      <span>{l ? name : "전체 리그"}</span>
                      <small className="num">{n}</small>
                    </button>
                  );
                })}
              </div>
              {clubs.length ? (
                (league === "전체" ? data.leagues.filter((l) => clubs.some((t) => t.leagueId === l.id)) : [data.leagues.find((l) => l.name === league)!]).map((l) => {
                  const mark = leagueIdentity(l);
                  const group = clubs.filter((t) => t.leagueId === l.id);
                  return (
                    <section key={l.id} className="club-league" style={{ "--league": mark?.color, "--league-ink": mark?.ink } as CSSProperties}>
                      <header className="club-league-head">
                        <LeagueMark league={l} size="lg" />
                        <strong>{l.name}</strong>
                        {mark?.country && <span>{mark.country}</span>}
                        <small className="num">{group.length}개 구단 · 게시글 {group.reduce((sum, t) => sum + count(t.id), 0)}</small>
                      </header>
                      <div className="club-grid">
                        {group.map((t) => <ClubTile key={t.id} id={t.id} mine={t.id === myTeam?.id} posts={count(t.id)} />)}
                      </div>
                    </section>
                  );
                })
              ) : <div className="panel"><DataEmpty entity="구단 라운지" status={status === "ready" && data.teams.length ? "ready" : undefined} filtered={data.teams.length > 0} /></div>}
            </section>
            <aside><PopularPosts posts={posts} scope={kind} /></aside>
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
                <h2>{q ? "검색 결과" : "선수 라운지"}<span>{q ? `${lounges.length}명` : "선수 탐색에서 전체 보기"}</span></h2>
                <label className="input-search hub-search"><Search size={16} /><input aria-label="선수 라운지 검색" placeholder="선수 이름 검색" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              </div>
              {lounges.length ? (
                <div className="lounge-grid">
                  {lounges.map((p) => (
                    <Link className="lounge-card hover-lift" href={`/community/players/${p.id}`} key={p.id} style={{ "--club": clubIdentity(getTeam(p.team))?.primary ?? "var(--ink)" } as CSSProperties}>
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
              ) : <div className="panel"><DataEmpty entity="선수 라운지" status={remote.enabled ? remote.status : status} retry={remote.enabled ? remote.reload : undefined} filtered={!!q} /></div>}
            </section>
            <aside><PopularPosts posts={posts} scope={kind} /></aside>
          </div>
        </>
      )}
      <div className="hub-posts">
        <SectionTitle title={kind === "club" ? "최근 구단 게시글" : "최근 선수 게시글"} />
        <PostBrowser posts={posts} scope={kind} />
      </div>
    </>
  );
}
export function CommunityScreen({ scope }: { scope: "club" | "player" }) {
  const params = useParams();
  const { data, getTeam, getLeague, status } = usePlatform();
  const target = scope === "club" ? String(params.teamId) : String(params.playerId);
  const detail=useCatalogPlayer(scope === "player" ? target : null);
  const team = scope === "club" ? getTeam(target) : undefined,
    player = scope === "player" ? detail.player : undefined;
  const found = team || player;
  const posts = data.posts.filter((p) => p.scope === scope && p.target === target);
  const isFan = scope === "player" || (!!data.session?.profile?.team && data.session.profile.team === target);
  const writable = !!found && !!data.session && isFan;
  const roster=useCatalogPage<Player>("players",{team:team?.id,size:12,sort:"name"});
  const squad=roster.enabled ? (team && roster.status === "ready" ? roster.data.items : []) : team ? data.players.filter(p=>p.team===team.id) : [];
  const heroIdentity = clubIdentity(team ?? getTeam(player?.team));
  const heroStyle = heroIdentity ? ({ "--club": heroIdentity.primary, "--club-2": heroIdentity.secondary } as CSSProperties) : undefined;
  return (
    <>
      <BackLink href={HUB[scope]} label={scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"} />
      <section className={`lounge-hero ${scope}`} style={heroStyle}>
        <span className="lounge-hero-code" aria-hidden="true">{heroIdentity?.code ?? ""}</span>
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
          <div><span>게시글</span><b className="num">{found ? (data.communityCounts?.find(c=>c.scope===scope&&c.target===target)?.count ?? (data.policy?0:posts.length)) : "—"}</b></div>
          {player && <div><span>현재 가치</span><b className="num">{money(player.price)} P</b><Change value={player.change} /></div>}
          {team && <div><span>선수 미리보기</span><b className="num">{squad.length}</b></div>}
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
        <PostBrowser posts={posts} scope={scope} target={target} showTarget={false} />
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
              ) : <DataEmpty entity="선수" status={roster.enabled ? roster.status : status} retry={roster.enabled ? roster.reload : undefined} rows={3} />}
              {team && roster.enabled && roster.data.total > 12 && <Link className="text-link" href={`/players?team=${encodeURIComponent(team.id)}`}>구단 선수 전체 보기 <ArrowRight size={14} /></Link>}
            </section>
          ) : player ? (
            <section className="panel">
              <SectionTitle title="선수 요약" href={`/players/${player.id}`} link="상세" />
              <dl className="summary-list">
                <div><dt>현재 가치</dt><dd>{money(player.price)} P</dd></div>
                <div><dt>변동</dt><dd><Change value={player.change} /></dd></div>
                <div><dt>Performance</dt><dd>{score(player.performance)}</dd></div>
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
export {PostDetail} from "./community-detail";
type DraftState = { scope: "club" | "player"; target: string; category: string; title: string; body: string; transaction: string };
const FIELD_ORDER: PostField[] = ["target", "category", "title", "body", "transaction"];
const FIELD_LABEL: Record<PostField, string> = { scope: "게시판 종류", target: "대상", category: "주제", title: "제목", body: "내용", transaction: "거래 첨부" };
function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const count = [...value.trim()].length;
  const tone = count > max ? "over" : count >= max * 0.9 ? "near" : count > 0 && count < min ? "under" : "";
  return <small className={`char-count num ${tone}`} aria-live="polite">{count.toLocaleString("ko-KR")} / {max.toLocaleString("ko-KR")}</small>;
}
export function WritePost() {
  const sp = useSearchParams();
  const { data, status, mock, notify, getTeam, getPlayer, reload } = usePlatform();
  const detail=usePost(sp.get("edit"));
  const existing=detail.data.post?.authorId===data.session?.userId?detail.data.post:undefined;
  const requestId=useRef("");
  const revision=useRef<number|null>(null);
  const [savedId,setSavedId]=useState<string|null>(null);
  const [playerSearch,setPlayerSearch]=useState("");
  const searched=useCatalogPage<Player>("players",{q:playerSearch,size:50,sort:"name"});
  const myTeam = data.session?.profile?.team ?? null;
  const initialScope: DraftState["scope"] = existing?.scope ?? (sp.get("scope") === "player" ? "player" : "club");
  const [draft, setDraft] = useState<DraftState | null>(null);
  const value: DraftState = draft ?? {
    scope: initialScope,
    target: existing?.target ?? sp.get("target") ?? (initialScope === "club" ? myTeam ?? "" : ""),
    category: existing?.category ?? "",
    title: existing?.title ?? "",
    body: existing?.body ?? "",
    transaction: existing?.transaction?.id ?? "",
  };
  const [touched, setTouched] = useState<Partial<Record<PostField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState<"edit" | "saving" | "done">("edit");
  const [serverNote, setServerNote] = useState("");
  const lock = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const selectedPlayer=useCatalogPlayer(value.scope==="player"?value.target:null);
  const selectablePlayers=[...new Map([...(searched.enabled?searched.data.items:data.players),...(selectedPlayer.player?[selectedPlayer.player]:[])].map(p=>[p.id,p])).values()];
  const targets = value.scope === "club" ? data.teams : selectablePlayers;
  const clubTargets = useTeamOptions(null).filter((o) => o.value === myTeam);
  const errors = validatePost(value, {
    myTeam,
    categories: data.categories,
    targets: targets.map((t) => t.id),
    transactions: data.member?.transactions.map((t) => t.id) ?? [],
  });
  const errorFields = FIELD_ORDER.filter((f) => errors[f]);
  const visible = (field: PostField) => (attempted || touched[field]) && errors[field];
  const dirty = draft !== null && phase === "edit";
  const isEdit = sp.has("edit");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = (patch: Partial<DraftState>) => { revision.current ??= existing?.revision??0;requestId.current="";setDraft({ ...value, ...patch }); setServerNote(""); };
  const blur = (field: PostField) => () => setTouched((t) => ({ ...t, [field]: true }));
  const fieldProps = (field: PostField) => ({
    id: `post-${field}`,
    "aria-invalid": !!visible(field),
    "aria-describedby": `post-${field}-hint${visible(field) ? ` post-${field}-error` : ""}`,
    onBlur: blur(field),
    disabled: phase !== "edit",
  });
  const fieldError = (field: PostField) => visible(field) ? <p className="field-error" id={`post-${field}-error`}>{errors[field]}</p> : null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (errorFields.length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (lock.current) return;
    lock.current = true;setPhase("saving");requestId.current ||= crypto.randomUUID();
    try{
      if(mock){setPhase("done");notify("게시글 등록 예시입니다. 실제로 저장되지 않습니다.");}
      else{const result=await apiRequest<{id:string}>("/api/kickx/community","POST",{...value,action:isEdit?"editPost":"createPost",postId:existing?.id,revision:revision.current??existing?.revision,requestId:requestId.current});setSavedId(result.id);setPhase("done");reload();notify("게시글을 저장했습니다.");}
    }catch(e){setServerNote(e instanceof Error?e.message:"저장하지 못했습니다.");setPhase("edit");}finally{lock.current=false;}
  }
  const hub = HUB[value.scope];
  const targetName = value.scope === "club" ? getTeam(value.target)?.name : getPlayer(value.target)?.name;
  const attached = data.member?.transactions.find((t) => t.id === value.transaction);
  if(isEdit&&!existing)return <DataEmpty entity="수정할 게시글" status={detail.status}/>;
  if (phase === "done")
    return (
      <div className="reading-width">
        <section className="panel frame write-done">
          <span className="trade-done-mark"><Pencil size={28} /></span>
          <h1>게시글을 {isEdit ? "수정" : "등록"}했습니다</h1>
          <p>{mock ? "예시 모드에서는 게시글이 실제로 저장되지 않습니다." : "라운지에서 게시글을 확인할 수 있습니다."}</p>
          <div className="button-row">
            {savedId&&<Link className="button primary" href={`/community/posts/${savedId}`}>저장한 게시글 보기</Link>}
            <Link className="button secondary" href={hub}>{value.scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"}</Link>
            {value.target && <Link className="button primary" href={`${hub}/${value.target}`}>{targetName ? `${targetName} 라운지` : "라운지"}로 이동 <ArrowRight size={16} /></Link>}
          </div>
        </section>
      </div>
    );
  return (
    <div className="reading-width">
      <BackLink href={hub} label={value.scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"} />
      <PageHeading eyebrow="SHARE YOUR PERSPECTIVE" title={isEdit ? "게시글 수정" : "새 게시글"} description="경기를 본 시선, 선수에 대한 생각, 나의 거래 판단을 나눠보세요." />
      <MemberNotice />
      <form onSubmit={submit} noValidate className="panel frame write-form" aria-busy={phase === "saving"}>
        {attempted && errorFields.length > 0 && (
          <div className="error-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title">
            <strong id="error-summary-title">입력 내용을 확인해 주세요 · {errorFields.length}건</strong>
            <ul>
              {errorFields.map((f) => (
                <li key={f}><a href={`#post-${f}`} onClick={(e) => { e.preventDefault(); document.getElementById(`post-${f}`)?.focus(); }}><b>{FIELD_LABEL[f]}</b> {errors[f]}</a></li>
              ))}
            </ul>
          </div>
        )}
        <fieldset className="write-scope" disabled={phase !== "edit" || isEdit}>
          <legend className="sr-only">게시판 종류</legend>
          {(["club", "player"] as const).map((scope) => (
            <button key={scope} type="button" aria-pressed={value.scope === scope} className={value.scope === scope ? "active" : ""}
              onClick={() => update({ scope, target: scope === "club" ? myTeam ?? "" : "" })}>
              <strong>{scope === "club" ? "구단 커뮤니티" : "선수 커뮤니티"}</strong>
              <span>{scope === "club" ? "응원 구단 팬 전용" : "모든 회원"}</span>
            </button>
          ))}
        </fieldset>
        <div className="form-grid">
          <div className={`field ${visible("target") ? "invalid" : ""}`}>
            <label htmlFor="post-target">대상 {value.scope === "club" ? "구단" : "선수"} <span className="req" aria-hidden="true">*</span></label>
            {value.scope==="player"&&!isEdit&&<input aria-label="게시글 대상 선수 검색" value={playerSearch} onChange={e=>setPlayerSearch(e.target.value)} placeholder="한글·영문 선수 검색"/>}
            <Select id="post-target" invalid={!!visible("target")} describedBy={`post-target-hint${visible("target") ? " post-target-error" : ""}`} onBlur={blur("target")}
              disabled={isEdit || phase !== "edit" || !targets.length || (value.scope === "club" && !myTeam)} value={targets.some((t) => t.id === value.target) ? value.target : ""}
              onChange={(target) => update({ target })} placeholder={value.scope === "club" ? "구단 선택" : "선수 선택"}
              options={value.scope === "club" ? clubTargets : selectablePlayers.map((p) => ({ value: p.id, label: p.name, hint: getTeam(p.team)?.name, icon: <ClubCrest id={p.team} size="small" /> }))} />
            <small id="post-target-hint">{value.scope === "club" ? (myTeam ? "응원 구단 라운지에만 작성할 수 있습니다." : <>응원 구단이 없습니다. <Link className="text-link" href="/mypage">마이페이지에서 설정</Link></>) : "선수 라운지에 게시됩니다."}</small>
            {fieldError("target")}
          </div>
          <div className={`field ${visible("category") ? "invalid" : ""}`}>
            <label htmlFor="post-category">주제 <span className="req" aria-hidden="true">*</span></label>
            <Select id="post-category" invalid={!!visible("category")} describedBy={`post-category-hint${visible("category") ? " post-category-error" : ""}`} onBlur={blur("category")}
              disabled={phase !== "edit" || !data.categories.length} value={value.category} onChange={(category) => update({ category })} placeholder="주제 선택" options={simple(data.categories)} />
            <small id="post-category-hint">경기 리뷰, 선수 분석, 거래 전략 등</small>
            {fieldError("category")}
          </div>
        </div>
        <div className={`field ${visible("title") ? "invalid" : ""}`}>
          <div className="label-row"><label htmlFor="post-title">제목 <span className="req" aria-hidden="true">*</span></label><Counter value={value.title} min={POST_LIMITS.titleMin} max={POST_LIMITS.titleMax} /></div>
          <input {...fieldProps("title")} value={value.title} onChange={(e) => update({ title: e.target.value })} placeholder="이야기의 제목을 입력하세요" />
          <small id="post-title-hint">{POST_LIMITS.titleMin}–{POST_LIMITS.titleMax}자</small>
          {fieldError("title")}
        </div>
        <div className={`field ${visible("body") ? "invalid" : ""}`}>
          <div className="label-row"><label htmlFor="post-body">내용 <span className="req" aria-hidden="true">*</span></label><Counter value={value.body} min={POST_LIMITS.bodyMin} max={POST_LIMITS.bodyMax} /></div>
          <textarea {...fieldProps("body")} value={value.body} onChange={(e) => update({ body: e.target.value })} rows={11} placeholder="경기에 대한 생각과 선수에 대한 이야기를 나눠보세요" />
          <small id="post-body-hint">{POST_LIMITS.bodyMin}자 이상 · 근거 있는 의견과 서로에 대한 존중을 부탁드립니다.</small>
          {fieldError("body")}
        </div>
        <div className={`field attachment ${visible("transaction") ? "invalid" : ""}`}>
          <div className="label-row"><label htmlFor="post-transaction"><Paperclip size={15} /> 내 거래 내역 첨부</label><small>선택</small></div>
          <Select id="post-transaction" invalid={!!visible("transaction")} describedBy={`post-transaction-hint${visible("transaction") ? " post-transaction-error" : ""}`} onBlur={blur("transaction")}
            disabled={phase !== "edit" || !data.member?.transactions.length} value={value.transaction} onChange={(transaction) => update({ transaction })} placeholder="첨부하지 않음"
            options={[{ value: "", label: "첨부하지 않음" }, ...(data.member?.transactions.map((t) => ({ value: t.id, label: `${t.playerName} · ${t.type === "buy" ? "매입" : "매각"}`, hint: `${money(t.price)} P · ${dateText(t.date, false)}` })) ?? [])]} />
          <small id="post-transaction-hint">{data.member?.transactions.length ? "본인의 거래만 첨부할 수 있으며 게시글에 함께 공개됩니다." : "첨부할 수 있는 거래 내역이 없습니다."}</small>
          {fieldError("transaction")}
          {attached && (
            <div className="attached-trade compact">
              <span className="attached-label"><Paperclip size={14} />첨부 미리보기</span>
              <div className="attached-row">
                <span className={`trade-type ${attached.type}`}>{attached.type === "buy" ? "매입" : "매각"}</span>
                <strong>{attached.playerName}</strong>
                <span className="num">{money(attached.price)} P</span>
                <span className="muted">{dateText(attached.date)}</span>
              </div>
            </div>
          )}
        </div>
        {serverNote && <p className="data-notice" role="status"><Lock size={15} />{serverNote}</p>}
        <div className="form-actions">
          <p className="fine-print">{mock ? "예시 모드 · 등록해도 실제로 저장되지 않습니다." : status === "ready" && !data.session ? "로그인 후 작성할 수 있습니다." : "저장한 글은 해당 라운지에 공개됩니다."}</p>
          <Link className="button secondary" href={hub}>취소</Link>
          <button type="submit" className="button primary" disabled={phase !== "edit" || !data.session} aria-busy={phase === "saving"}>
            {phase === "saving" ? <><LoaderCircle size={16} className="kx-spin" />등록 중…</> : <><Pencil size={16} />{isEdit ? "수정 저장" : "게시글 등록"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

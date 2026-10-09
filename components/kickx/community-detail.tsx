'use client';
import Link from 'next/link';
import {useParams,useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import type {Comment,Post} from '@/lib/kickx/types';
import {apiRequest} from '@/lib/kickx/client';
import {dateText} from '@/lib/kickx/data';
import {usePlatform,useResource} from './provider';
import {BackLink,DataEmpty,Modal} from './ui';
export const emptyPost=()=>({post:null as Post|null,comments:[] as Comment[]});
export function usePost(id:string|null,page=1){
 const {data,mock,status}=usePlatform();
 const remote=useResource(!mock&&status==='ready'&&id?`/api/kickx/community?postId=${encodeURIComponent(id)}&page=${page}`:null,emptyPost);
 return {...remote,data:mock?{post:data.posts.find(p=>p.id===id)??null,comments:data.comments.filter(c=>c.postId===id)}:remote.data,status:mock?status:remote.status};
}
export function PostDetail(){
 const {postId}=useParams<{postId:string}>(),router=useRouter();const {data,mock,notify}=usePlatform();
 const [page,setPage]=useState(1);const resource=usePost(postId,page);const {post,comments}=resource.data;
 const [body,setBody]=useState(''),[reply,setReply]=useState<Comment|null>(null),[editing,setEditing]=useState<Comment|null>(null),[busy,setBusy]=useState(false);
 const [action,setAction]=useState<{kind:'report'|'deletePost'|'deleteComment';comment?:Comment}|null>(null),[reason,setReason]=useState('');
 const lock=useRef(false),requestId=useRef('');
 const owner=post?.authorId===data.session?.userId;
 const canWrite=!!data.session?.profile&&(post?.scope==='player'||data.session.profile.team===post?.target);
 const lounge=post?`/community/${post.scope==='club'?'clubs':'players'}/${post.target}`:'/community/clubs';
 useEffect(()=>{
  if(!mock&&post&&data.session?.profile)void apiRequest('/api/kickx/community','POST',{action:'view',postId:post.id}).catch(()=>{});
 },[mock,post?.id,data.session?.userId,data.session?.profile,post]);
 async function mutate(payload:Record<string,unknown>){
  if(lock.current)return false;
  if(mock){notify('예시 모드 · 실제로 저장되지 않습니다.');return false;}
  lock.current=true;setBusy(true);
  try{await apiRequest('/api/kickx/community','POST',{postId,...payload});resource.reload();return true;}
  catch(e){notify(e instanceof Error?e.message:'저장하지 못했습니다.','error');return false;}
  finally{lock.current=false;setBusy(false);}
 }
 async function comment(){
  requestId.current ||= crypto.randomUUID();
  if(await mutate(editing?{action:'editComment',commentId:editing.id,revision:editing.revision,body}:{action:'comment',parentId:reply?.id,body,requestId:requestId.current})){setBody('');setReply(null);setEditing(null);requestId.current='';notify('댓글을 저장했습니다.');}
 }
 async function confirm(){
  if(!action)return;
  if(await mutate(action.kind==='report'?{action:'report',commentId:action.comment?.id,reason}:{action:action.kind,commentId:action.comment?.id,revision:action.comment?.revision??post?.revision})){if(action.kind==='deletePost')router.push(lounge);setAction(null);setReason('');notify('처리했습니다.');}
 }
 if(!post)return <div className="reading-width"><DataEmpty entity="게시글" status={resource.status}/><Link href="/community/clubs" className="button secondary">커뮤니티로</Link></div>;
 return <div className="reading-width"><BackLink href={lounge} label={`${post.targetName??'커뮤니티'} 라운지`}/><article className="article"><span className="category-tag">{post.category}</span><h1>{post.title}</h1><div className="article-author"><div><strong>{post.author}</strong><span>{dateText(post.date)} · 조회 {post.views} · 공감 {post.likes}</span></div>{owner&&<div className="button-row"><Link className="button secondary small" href={`/community/write?edit=${post.id}`}>수정</Link><button className="button danger small" onClick={()=>setAction({kind:'deletePost'})}>삭제</button></div>}</div><div className="article-body">{post.body}</div>
 {post.transaction&&<div className="attached-trade"><strong>첨부된 본인 거래</strong><p>{post.transaction.playerName} · {post.transaction.type==='buy'?'매입':'매각'} · {post.transaction.price.toLocaleString('ko-KR')}P · {dateText(post.transaction.date)}</p></div>}
 <div className="article-actions"><button className="button secondary" disabled={!data.session||busy} aria-pressed={!!post.liked} onClick={()=>void mutate({action:'like',liked:!post.liked})}>{post.liked?'공감 취소':'공감'} · {post.likes}</button><button className="button ghost" disabled={!data.session} onClick={()=>setAction({kind:'report'})}>게시글 신고</button></div></article>
 <section className="comments"><h2>댓글 {post.commentCount}개</h2><form className="comment-form" onSubmit={e=>{e.preventDefault();void comment();}}>
 {(reply||editing)&&<p>{editing?'댓글 수정':`${reply?.author}님에게 답글`} <button type="button" className="button ghost small" onClick={()=>{setReply(null);setEditing(null);setBody('');requestId.current='';}}>취소</button></p>}
 <label className="sr-only" htmlFor="comment-body">댓글 내용</label><textarea id="comment-body" value={body} disabled={!canWrite||busy} maxLength={1000} onChange={e=>{setBody(e.target.value);requestId.current='';}} placeholder={canWrite?'댓글을 작성해 주세요':'로그인 및 구단 팬 권한이 필요합니다'} rows={3}/><div className="comment-form-foot"><span className="fine-print">{body.length}/1000 · 답글은 한 단계까지</span><button className="button primary small" disabled={!canWrite||busy||!body.trim()}>{editing?'수정 저장':'댓글 등록'}</button></div></form>
 <ul className="comment-list">{comments.map(c=><li className="comment" key={c.id}><div><div className="comment-head"><strong>{c.author}</strong><span>{dateText(c.date)}</span>{c.parentId&&<span className="tag">답글{comments.find(p=>p.id===c.parentId)?.author?` · ${comments.find(p=>p.id===c.parentId)?.author}님에게`:''}</span>}</div><p>{c.body}</p><div className="button-row">{canWrite&&!c.parentId&&<button className="button ghost small" onClick={()=>{setReply(c);setEditing(null);setBody('');requestId.current='';document.getElementById('comment-body')?.focus();}}>답글</button>}{c.authorId===data.session?.userId&&<><button className="button ghost small" onClick={()=>{setEditing(c);setReply(null);setBody(c.body);}}>수정</button><button className="button ghost small" onClick={()=>setAction({kind:'deleteComment',comment:c})}>삭제</button></>}{data.session&&<button className="button ghost small" onClick={()=>setAction({kind:'report',comment:c})}>신고</button>}</div></div></li>)}</ul>
 <div className="button-row"><button className="button secondary small" disabled={page===1} onClick={()=>setPage(p=>p-1)}>이전 댓글</button><span>{page} 페이지</span><button className="button secondary small" disabled={page*50>=post.commentCount} onClick={()=>setPage(p=>p+1)}>다음 댓글</button></div></section>
 {action&&<Modal title={action.kind==='report'?'신고 제출':'삭제 확인'} onClose={()=>setAction(null)}>{action.kind==='report'?<label className="modal-field">신고 사유 (5~500자)<textarea value={reason} minLength={5} maxLength={500} onChange={e=>setReason(e.target.value)} rows={4}/></label>:<p>삭제하면 공개 목록에서 사라집니다.</p>}<div className="modal-actions"><button className="button secondary" onClick={()=>setAction(null)}>취소</button><button className="button primary" disabled={busy||(action.kind==='report'&&reason.trim().length<5)} onClick={()=>void confirm()}>확인</button></div></Modal>}</div>;
}

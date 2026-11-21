"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { cosmeticTheme } from '@/lib/kickx/engagement';
import { usePlatform } from './provider';
import { useEngagement } from './engagement-provider';
import { ClubCrest } from './ui';
const cache = new Map<string,{skin:string|null;at:number}>();
const waiting = new Map<string,Set<(skin:string|null)=>void>>();
let scheduled = false;
function requestName(id:string,callback:(skin:string|null)=>void) {
 const found=cache.get(id);if(found&&Date.now()-found.at<60000){callback(found.skin);return()=>{};}
 const listeners=waiting.get(id)??new Set();listeners.add(callback);waiting.set(id,listeners);
 if(!scheduled){scheduled=true;setTimeout(()=>{
  scheduled=false;const batch=[...waiting.entries()].slice(0,100);for(const [id] of batch)waiting.delete(id);
  void fetch(`/api/kickx/nameplates?users=${batch.map(([id])=>id).join(',')}`,{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return await r.json() as Record<string,string>;}).then(result=>{
   for(const [id,listeners] of batch){const skin=result[id]??null;cache.set(id,{skin,at:Date.now()});for(const fn of listeners)fn(skin);}
  }).catch(()=>{});
 },20);}
 return()=>{listeners.delete(callback);};
}
export function Nameplate({skin,primaryTeam,children,preview=false}:{skin?:string|null;primaryTeam?:string|null;children:ReactNode;preview?:boolean}) {
 if(!skin)return <span className="member-plain-name">{primaryTeam&&<span className="primary-name-crest" title="메인 응원 구단"><ClubCrest id={primaryTeam} size="small"/></span>}{children}</span>;
 const theme=cosmeticTheme(skin);
 return <span className={`kx-nameplate nameplate-${theme} ${preview?'is-preview':''}`}><span className="nameplate-plate" aria-hidden="true"/><span className="nameplate-sigil" title="메인 응원 구단">{primaryTeam&&<ClubCrest id={primaryTeam} size="small"/>}</span><span className="nameplate-text">{children}</span><NameplateArt theme={theme}/></span>;
}
/** Theme ornament outside the plate's right edge, so it never sits on top of the nickname. */
function NameplateArt({theme}:{theme:string}) {
 return <svg className="nameplate-art" viewBox="0 0 36 32" fill="none" aria-hidden="true" focusable="false">
  {theme==='arcane'?<>
   <path d="M3 16 15 4l3 8 6-7 1 9 8-4-6 10 6 6-9-2-1 9-5-7-4 8-2-9Z" fill="var(--plate-b)" stroke="var(--plate-a)" strokeWidth="1.2" strokeLinejoin="round"/>
   <path className="nameplate-pulse" d="m19 11 4 5-4 5-4-5Z" fill="#fff" stroke="var(--plate-a)"/>
  </>:theme==='circuit'?<>
   <path d="M1 16h7l3-6h7l3 6h6M11 10V4h8M18 22l3-6m-3 6v6h9" stroke="var(--plate-a)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
   <path className="nameplate-pulse" d="m26 5-5 10h5l-4 12 10-14h-6l4-8Z" fill="#effff5" stroke="var(--plate-a)" strokeLinejoin="round"/>
   <circle cx="19" cy="4" r="2" fill="var(--plate-a)"/><circle cx="27" cy="28" r="2" fill="var(--plate-a)"/>
  </>:theme==='inferno'?<>
   <path className="nameplate-flame" d="M2 24q8 1 9-7 4 5 2 10 7-3 6-12 7 6 5 14 6-5 4-13 9 9 4 20H5Z" fill="var(--plate-b)" stroke="var(--plate-a)" strokeWidth="1.2" strokeLinejoin="round"/>
   <path d="M13 28q2-6 6-7 0 4 3 5 2-3 1-6 5 4 2 8Z" fill="#ffd27a"/>
  </>:<>
   <path d="M1 18C11 18 15 6 34 4M1 16c12 1 17 8 33 11M3 17c9-2 14-7 23-7" stroke="var(--plate-a)" strokeWidth="1.6" strokeLinecap="round"/>
   <path d="M1 17c11 0 17 3 24 4" stroke="var(--plate-b)" strokeWidth="2.2" strokeLinecap="round"/>
   <path className="nameplate-pulse" d="m29 12 1.6 3.4L34 17l-3.4 1.6L29 22l-1.6-3.4L24 17l3.4-1.6Z" fill="#fff"/>
  </>}
 </svg>;
}
export function MemberNameplate({userId,primaryTeam,children}:{userId?:string;primaryTeam?:string|null;children:ReactNode}) {
 const {data}=usePlatform(),{state}=useEngagement();
 const [found,setFound]=useState<{id:string;skin:string|null}|null>(null);
 const own=userId===data.session?.userId;
 useEffect(()=>{
  if(!userId||own||!/^[0-9a-f-]{36}$/i.test(userId))return;
  let unsubscribe=requestName(userId,skin=>setFound({id:userId,skin}));
  const timer=setInterval(()=>{unsubscribe();unsubscribe=requestName(userId,skin=>setFound({id:userId,skin}));},65000);
  return()=>{clearInterval(timer);unsubscribe();};
 },[userId,own]);
 return <Nameplate primaryTeam={own?data.session?.profile?.primaryTeam:primaryTeam} skin={own?state.loadout.nameplate:found && found.id===userId?found.skin:null}>{children}</Nameplate>;
}

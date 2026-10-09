'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {apiRequest} from '@/lib/kickx/client';
import type {AdminData,Player} from '@/lib/kickx/types';
import {usePlatform} from './provider';
import {useCatalogPage} from './catalog';
import {Select} from './select';
export function PrototypeAdmin({data,reload}:{data:AdminData;reload:()=>void}){
 const {mock,notify}=usePlatform();const [busy,setBusy]=useState(false),[result,setResult]=useState(''),[query,setQuery]=useState(''),[playerId,setPlayerId]=useState(''),[name,setName]=useState(''),[aliases,setAliases]=useState('');
 const lock=useRef(false),stop=useRef(false);const page=useCatalogPage<Player>('players',{q:query,sort:'name',size:50});
 const enabled=!!data.prototypeReady&&!mock;
 useEffect(()=>()=>{stop.current=true;},[]);
 async function run(action:string){
  if(lock.current)return;lock.current=true;setBusy(true);stop.current=false;setResult('처리 중…');
  try{
   if(action==='batch'){
    let cursor='';try{cursor=localStorage.getItem('kickx-calculation-cursor-v1')??'';}catch{}
    while(!stop.current){const r=await apiRequest<{done:boolean;cursor:string;results:unknown[]}>('/api/kickx/admin/prototype','POST',{action,cursor});setResult(JSON.stringify(r,null,2));cursor=r.cursor;try{if(r.done)localStorage.removeItem('kickx-calculation-cursor-v1');else localStorage.setItem('kickx-calculation-cursor-v1',cursor);}catch{}if(r.done)break;}
   }else{const r=await apiRequest('/api/kickx/admin/prototype','POST',{action,playerId,displayName:name,aliases:aliases.split(',').map(x=>x.trim()).filter(Boolean)});setResult(JSON.stringify(r,null,2));}
   reload();notify(stop.current?'계산을 멈췄습니다. 다음 선수부터 이어서 실행할 수 있습니다.':'요청을 처리했습니다.');
  }catch(e){setResult(e instanceof Error?e.message:'처리 실패');notify(e instanceof Error?e.message:'처리 실패','error');}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="panel frame prototype-admin"><h2>게임 운영 · 프로토타입</h2><p>기본 가치를 활성화한 뒤 기록 계산과 랭킹 집계를 실행하세요. <Link className="text-link" href="/rules">시범 정책 보기</Link></p>{!enabled&&<p className="data-notice">{mock?'예시 데이터 · 운영 작업은 실행되지 않습니다.':'새 기능의 DB 연결을 준비하고 있습니다.'}</p>}
 <div className="button-row"><button className="button primary" disabled={!enabled||busy} onClick={()=>void run('initialize')}>미산정 선수 기본 가치 활성화</button><button className="button secondary" disabled={!enabled||busy} onClick={()=>void run('batch')}>전체 계산 시작·이어가기</button><button className="button secondary" disabled={!enabled||busy} onClick={()=>void run('rankings')}>주간·월간 랭킹 갱신</button>{busy&&<button className="button danger" onClick={()=>{stop.current=true;}}>현재 선수 처리 후 중지</button>}</div>
 <p className="fine-print">이 화면에서 실행 버튼을 눌렀을 때만 계산합니다. 창을 닫으면 다음 요청을 보내지 않습니다. 일부 선수 계산 실패 시 해당 선수부터 재시도합니다.</p>
 <div className="form-grid"><label className="field">대상 선수 검색<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="한글·영문 이름"/></label><label className="field">대상 선수<Select label="운영 대상 선수" value={playerId} onChange={setPlayerId} options={page.data.items.map(p=>({value:p.id,label:p.name,hint:p.id}))} placeholder="선수 선택"/></label></div>
 <div className="button-row"><button className="button secondary" disabled={!enabled||busy||!playerId} onClick={()=>void run('preview')}>계산 미리보기</button><button className="button secondary" disabled={!enabled||busy||!playerId} onClick={()=>void run('calculate')}>선택 선수 계산·반영</button></div>
 <div className="form-grid"><label className="field">한글 표시명<input value={name} onChange={e=>setName(e.target.value)} maxLength={80}/></label><label className="field">검색 별칭 (쉼표 구분)<input value={aliases} onChange={e=>setAliases(e.target.value)} placeholder="별명, 다른 표기"/></label></div><button className="button secondary" disabled={!enabled||busy||!playerId||!name.trim()} onClick={()=>void run('name')}>표시명·별칭 저장</button>
 {result&&<details open><summary>처리 결과</summary><pre className="log-block" role="status">{result}</pre></details>}
 <details><summary>최근 계산 보류 기록 (최대 50건)</summary><ul>{data.calculationIssues?.map(i=><li key={i.player_id+i.fixture_id}>{i.player_id} · {i.fixture_id}: {i.warnings.join(', ')}</li>)}</ul></details></section>;
}

'use client';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useState} from 'react';
import type {Player,Fixture} from '@/lib/kickx/types';
import {dateText} from '@/lib/kickx/data';
import {usePlatform} from './provider';
import {useCatalogPage} from './catalog';
import {BackLink,ClubCrest,DataEmpty,PageHeading,PositionBadge} from './ui';
export function TeamScreen(){
 const {teamId}=useParams<{teamId:string}>();const {data,getTeam,getLeague,mock}=usePlatform();const team=getTeam(teamId);
 const [page,setPage]=useState(1),[matchPage,setMatchPage]=useState(1);
 const roster=useCatalogPage<Player>('players',{team:teamId,sort:'number',page,size:20});
 const schedule=useCatalogPage<Fixture>('fixtures',{team:teamId,page:matchPage,size:20});
 const local=data.players.filter(p=>p.team===teamId).sort((a,b)=>(a.number??Infinity)-(b.number??Infinity)||a.name.localeCompare(b.name));
 const players=mock?local:roster.status==='ready'?roster.data.items:[];
 const matches=mock?data.fixtures.filter(f=>f.home===teamId||f.away===teamId):schedule.status==='ready'?schedule.data.items:[];
 return <><BackLink href="/fixtures" label="경기 일정"/><PageHeading eyebrow="TEAM PROFILE" title={team?.name??'구단 정보'} description={team?`${team.english??''} · ${getLeague(team.leagueId)?.name??'리그 정보 없음'}`:undefined}/>
 {team&&<section className="panel frame"><div className="button-row"><ClubCrest id={teamId} size="large"/><strong>{team.name}</strong><Link className="button secondary" href={`/community/clubs/${teamId}`}>팬 라운지</Link></div><p className="fine-print">현재 소속 선수와 수집된 경기 기록을 확인하세요.</p></section>}
 <section className="panel flush"><div className="panel-head"><h2>소속 선수 · 등번호 순</h2><span>{mock?local.length:roster.status==='ready'?roster.data.total:'—'}명</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>등번호</th><th>선수</th><th>포지션</th><th>국적</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td>{p.number??'—'}</td><td><Link className="table-link" href={`/players/${p.id}`}>{p.name}</Link></td><td><PositionBadge position={p.position}/></td><td>{p.country??'—'}</td></tr>)}</tbody></table></div>{!players.length&&<DataEmpty entity="소속 선수" status={mock?undefined:roster.status}/>}
 {!mock&&<div className="button-row frame"><button className="button secondary small" disabled={page===1} onClick={()=>setPage(p=>p-1)}>이전</button><span>{page} 페이지</span><button className="button secondary small" disabled={page*20>=roster.data.total} onClick={()=>setPage(p=>p+1)}>다음</button></div>}</section>
 <section className="panel flush"><div className="panel-head"><h2>경기 일정·결과</h2></div><ul className="job-list">{matches.map(f=><li key={f.id}><span>{dateText(f.startsAt)}</span><div><Link href={`/teams/${f.home}`}>{getTeam(f.home)?.name??'—'}</Link><strong>{f.homeScore??'—'} : {f.awayScore??'—'}</strong><Link href={`/teams/${f.away}`}>{getTeam(f.away)?.name??'—'}</Link></div><span>{f.status}</span></li>)}</ul>{!matches.length&&<DataEmpty entity="경기" status={mock?undefined:schedule.status}/>}
 {!mock&&<div className="button-row frame"><button className="button secondary small" disabled={matchPage===1} onClick={()=>setMatchPage(p=>p-1)}>이전</button><span>{matchPage} 페이지</span><button className="button secondary small" disabled={matchPage*20>=schedule.data.total} onClick={()=>setMatchPage(p=>p+1)}>다음</button></div>}</section></>;
}

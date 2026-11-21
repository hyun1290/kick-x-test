"use client";
import { useId } from 'react';
import type { Player } from '@/lib/kickx/types';
import { PlayerPortrait } from './ui';

/** Ornament themes drawn as vector artwork. The face occupies the circle r=40 at the centre;
    every ornament stays outside r=42 and above y=140 so it never covers the face or the name. */
export const ORNAMENT_THEMES=['laurel','circuit','arcane','seraph','dragon','astral','tempest'];
const LAUREL_LEAVES=[0,1,2,3,4,5,6];
/** Original vector ornaments shared by the actual squad and store previews. */
function FrameOrnament({theme}:{theme:string}) {
 const id=useId().replace(/:/g,'');
 if(!ORNAMENT_THEMES.includes(theme))return null;
 return <svg className={`frame-ornament ornament-${theme}`} viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
  <defs><linearGradient id={`${id}-metal`} x1="20" y1="10" x2="140" y2="145" gradientUnits="userSpaceOnUse"><stop stopColor="var(--frame-light)"/><stop offset=".3" stopColor="var(--frame-main)"/><stop offset=".52" stopColor="var(--frame-light)"/><stop offset=".75" stopColor="var(--frame-deep)"/><stop offset="1" stopColor="var(--frame-main)"/></linearGradient></defs>
  <circle cx="80" cy="80" r="43" stroke={`url(#${id}-metal)`} strokeWidth="4"/>
  <circle cx="80" cy="80" r="48" stroke="var(--frame-main)" strokeWidth="1"/>
  {theme==='laurel'&&<>
   {[1,-1].map(side=><g key={side} transform={side<0?'matrix(-1 0 0 1 160 0)':undefined}>
    <path d="M70 132Q38 124 32 88 30 62 52 39" stroke="var(--frame-deep)" strokeWidth="2.5" strokeLinecap="round"/>
    {LAUREL_LEAVES.map(i=>{const a=(235-i*20)*Math.PI/180,x=80+49*Math.cos(a),y=80-49*Math.sin(a),rot=Math.atan2(Math.cos(a),Math.sin(a))*180/Math.PI+(i%2?-28:28);return <path key={i} d="M0 0q7-6 16-3-7 7-16 3Z" fill={`url(#${id}-metal)`} stroke="var(--frame-deep)" strokeWidth=".8" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})`}/>;})}
   </g>)}
   <path d="m66 130 14 9 14-9-4 12-10-4-10 4Z" fill="var(--frame-main)" stroke="var(--frame-deep)"/>
   <circle cx="80" cy="35" r="3.5" fill="var(--frame-light)"/>
  </>}
  {theme==='circuit'&&<>
   <path className="frame-trace" d="M80 35V21h20l8-8m-28 8H58l-9-9M125 80h12l9-9m-21 9 9 9h10M35 80H23l-9 9m21-9-9-9H16M80 125v11H62l-8 7m26-18v11h17" stroke="var(--frame-main)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   {[[108,13],[49,12],[146,71],[144,89],[14,89],[16,71]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--frame-deep)" stroke="var(--frame-light)" strokeWidth="1.5"/>)}
   <circle cx="80" cy="80" r="47" stroke="var(--frame-light)" strokeDasharray="14 6 3 6" strokeWidth="1.5"/>
  </>}
  {theme==='arcane'&&<>
   {[45,135,225,315].map(a=><path key={a} d="M80 18 88 30 80 40 72 30Z" fill={`url(#${id}-metal)`} stroke="var(--frame-light)" strokeWidth="1.2" transform={`rotate(${a} 80 80)`}/>)}
   <path d="M80 15 86 27 80 37 74 27Z" fill="var(--frame-light)" stroke="var(--frame-main)"/>
   <g className="frame-runes" stroke="var(--frame-light)" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="80" cy="80" r="50" stroke="var(--frame-main)" strokeDasharray="1 5"/>
    <path d="M30 70v8l4-4M127 68l4 6 4-6M33 96l5-4v8M125 96h8l-4 6"/>
   </g>
  </>}
  {theme==='seraph'&&<>
   <path d="M38 61 7 28 14 66 25 82 13 78 22 99 41 108 34 91 39 81Z" fill={`url(#${id}-metal)`} stroke="var(--frame-light)"/>
   <path d="m122 61 31-33-7 38-11 16 12-4-9 21-19 9 7-17-5-10Z" fill={`url(#${id}-metal)`} stroke="var(--frame-light)"/>
   <path d="m15 43 21 29M19 61l17 19m-10 9 11 5m108-51-21 29m17-11-17 19m10 9-11 5" stroke="var(--frame-deep)" strokeWidth="2"/>
   <path d="m61 32-4-17 14 8L80 6l9 17 14-8-4 17Z" fill={`url(#${id}-metal)`} stroke="var(--frame-light)" strokeWidth="1.5"/>
   <path d="m80 124 5 7-5 9-5-9Z" fill="var(--frame-main)" stroke="var(--frame-light)"/>
  </>}
  {theme==='dragon'&&<>
   <path d="M36 54 8 27l6 31L3 71l21 6-4 26 23-9-12-17Zm88 0 28-27-6 31 11 13-21 6 4 26-23-9 12-17Z" fill="var(--frame-deep)" stroke={`url(#${id}-metal)`} strokeWidth="3"/>
   <path d="m18 45 19 21-13 3 9 19M142 45l-19 21 13 3-9 19" stroke="var(--frame-main)" strokeWidth="2"/>
   <path d="m52 42-6-20 20 12L80 16l14 18 20-12-6 20M55 120l11 9 14-5 14 5 11-9" stroke={`url(#${id}-metal)`} strokeWidth="4"/>
   <path className="frame-fire" d="M71 140q-5-8 3-13 0 6 6 8 7-5 4-12 15 12-13 17Z" fill="var(--frame-main)" stroke="var(--frame-light)"/>
  </>}
  {theme==='astral'&&<>
   <g className="frame-orbit"><ellipse cx="80" cy="80" rx="69" ry="24" transform="rotate(-32 80 80)" stroke="var(--frame-main)" strokeWidth="2"/><ellipse cx="80" cy="80" rx="67" ry="29" transform="rotate(40 80 80)" stroke="var(--frame-light)" strokeOpacity=".7"/><circle cx="22" cy="114" r="5" fill="var(--frame-main)"/><circle cx="132" cy="43" r="4" fill="var(--frame-light)"/></g>
   <path d="m80 8 5 13 13 5-13 5-5 13-5-13-13-5 13-5Zm48 101 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill={`url(#${id}-metal)`}/>
   <circle cx="80" cy="80" r="53" stroke="var(--frame-main)" strokeDasharray="2 9"/>
  </>}
  {theme==='tempest'&&<>
   <path className="frame-bolt" d="m36 33-20 42 17-2-10 38 28-50-18 3Zm89-3 19 43-17-2 10 39-27-51 17 3Z" fill="var(--frame-light)" stroke="var(--frame-main)" strokeWidth="2"/>
   <path d="m52 37 6-17 12 9L80 9l10 20 12-9 6 17M52 121l10 10h36l10-10" fill={`url(#${id}-metal)`} stroke="var(--frame-light)" strokeWidth="2"/>
   <path d="m42 111-9 10 13 6 12 11h44l12-11 13-6-9-10" stroke="var(--frame-main)" strokeWidth="2"/>
   <circle cx="80" cy="80" r="51" stroke="var(--frame-light)" strokeDasharray="9 5 2 8"/>
  </>}
 </svg>;
}
export function FramedPlayer({player,theme='default',preview=false}:{player?:Player;theme?:string;preview?:boolean}) {
 const ornate=ORNAMENT_THEMES.includes(theme);
 return <span className={`squad-player-icon squad-face player-frame frame-${theme} ${ornate?'frame-ornate':''} ${preview?'is-preview':''}`}>
  {player?<PlayerPortrait player={player} size={preview?'lg':'md'}/>:<span className="cosmetic-player-placeholder">✦</span>}
  <FrameOrnament theme={theme}/>
 </span>;
}

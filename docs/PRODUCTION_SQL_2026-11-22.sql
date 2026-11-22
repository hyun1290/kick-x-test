-- KICK-X 운영 DB 적용 SQL (2026-11-22)
-- 전제: 운영 DB에 20261122010013_market_goal_assist_totals.sql까지 적용된 상태.
-- 사용법: Supabase SQL Editor에 1부를 그대로 붙여 넣고 실행한다. 전체가 하나의 트랜잭션이라 중간에 실패하면 아무것도 바뀌지 않는다.
-- 2부(치장 24종)는 가격을 확정한 뒤 따로 실행한다.
-- 이미 적용한 마이그레이션을 다시 실행하지 않는다(create function이 '이미 존재' 오류로 멈춘다).

-- ===================== 1부: 기능 변경 (필수) =====================
begin;

-- ---------- 20261122100000_supported_club_posting.sql ----------
-- Members with a confirmed primary club may author posts in any of their supported clubs
-- (previously the primary club only). Comment and poll participation rules are unchanged.
create or replace function public.kickx_can_write_lounge(u uuid,s text,t text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=u and (s='player' or s='club' and p.primary_team_id is not null and t=any(p.team_ids)))
$$;
revoke all on function public.kickx_can_write_lounge(uuid,text,text) from public,anon,authenticated;
grant execute on function public.kickx_can_write_lounge(uuid,text,text) to service_role;

-- ---------- 20261122110000_weekly_item_rewards_ticket_player_frames.sql ----------
-- 1) Weekly missions: each completed mission can be claimed for 1,000P; clearing all six adds 4,000P
--    (the weekly maximum stays 10,000P). 2) Attendance recovery ticket costs 2,500P.
-- 3) Members can give each owned player their own frame (falls back to the equipped frame).

create table kickx_private.weekly_item_claims(
 user_id uuid not null references auth.users(id) on delete cascade,week date not null,mission text not null,
 claimed_at timestamptz not null default clock_timestamp(),primary key(user_id,week,mission));
alter table kickx_private.weekly_item_claims enable row level security;
revoke all on kickx_private.weekly_item_claims from public,anon,authenticated,service_role;

do $patch$ declare d text;begin
 d:=pg_get_functiondef('kickx_private.weekly_progress(uuid,date)'::regprocedure);
 if position($q$'claimed',(select exists(select 1 from kickx_private.weekly_claims where user_id=u and week=w)));$q$ in d)=0 then raise exception 'weekly_progress shape changed';end if;
 d:=replace(d,$q$'claimed',(select exists(select 1 from kickx_private.weekly_claims where user_id=u and week=w)));$q$,
  $q$'claimed',(select exists(select 1 from kickx_private.weekly_claims where user_id=u and week=w)),
 'claimedItems',(select coalesce(jsonb_agg(c.mission order by c.mission),'[]'::jsonb) from kickx_private.weekly_item_claims c where c.user_id=u and c.week=w));$q$);
 execute d;

 d:=pg_get_functiondef('public.kickx_engagement()'::regprocedure);
 if position($q$jsonb_build_object('reward',10000)$q$ in d)=0 then raise exception 'kickx_engagement shape changed';end if;
 d:=replace(d,$q$jsonb_build_object('reward',10000)$q$,$q$jsonb_build_object('reward',4000,'itemReward',1000)$q$);
 execute d;

 d:=pg_get_functiondef('public.kickx_engagement_action(text,jsonb)'::regprocedure);
 if position($q$if found then amount:=10000;end if;$q$ in d)=0 or position($q$ elsif p_action='purchase' then$q$ in d)=0 then raise exception 'kickx_engagement_action shape changed';end if;
 d:=replace(d,$q$if found then amount:=10000;end if;$q$,$q$if found then amount:=4000;end if;$q$);
 d:=replace(d,$q$ elsif p_action='purchase' then$q$,$q$ elsif p_action='claim_weekly_item' then
  progress:=kickx_private.weekly_progress(u,w);
  if not exists(select 1 from jsonb_array_elements(progress->'items') x where x->>'id'=p_input->>'mission' and (x->>'current')::int>=(x->>'target')::int) then raise exception 'MISSIONS_INCOMPLETE';end if;
  insert into kickx_private.weekly_item_claims(user_id,week,mission) values(u,w,p_input->>'mission') on conflict do nothing;
  if found then amount:=1000;end if;
 elsif p_action='purchase' then$q$);
 execute d;
end $patch$;

update kickx_private.shop_items set price=2500 where id='attendance-ticket';

create table kickx_private.player_frames(
 user_id uuid not null references auth.users(id) on delete cascade,player_id text not null,
 item_id text not null references kickx_private.shop_items(id),updated_at timestamptz not null default clock_timestamp(),
 primary key(user_id,player_id));
alter table kickx_private.player_frames enable row level security;
revoke all on kickx_private.player_frames from public,anon,authenticated,service_role;

create function public.kickx_player_frames() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_object_agg(f.player_id,f.item_id),'{}'::jsonb) from kickx_private.player_frames f where f.user_id=auth.uid() $$;

-- p_item null/empty clears the player's own frame. Only owned frames, only on players the member holds.
create function public.kickx_set_player_frame(p_player text,p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=public.kickx_require_active_member();item text:=nullif(p_item,'');begin
 if p_player is null or length(p_player)>120 then raise exception 'INVALID_INPUT';end if;
 if item is null then delete from kickx_private.player_frames where user_id=u and player_id=p_player;return public.kickx_player_frames();end if;
 if not exists(select 1 from kickx_private.cosmetic_inventory inv join kickx_private.shop_items s on s.id=inv.item_id
  where inv.user_id=u and inv.item_id=item and inv.quantity>0 and s.category='frame') then raise exception 'ITEM_NOT_OWNED';end if;
 if not exists(select 1 from public.holdings h where h.user_id=u and h.player_id=p_player) then raise exception 'PLAYER_NOT_OWNED';end if;
 insert into kickx_private.player_frames(user_id,player_id,item_id) values(u,p_player,item)
 on conflict(user_id,player_id) do update set item_id=excluded.item_id,updated_at=clock_timestamp();
 return public.kickx_player_frames();
end $$;
revoke all on function public.kickx_player_frames(),public.kickx_set_player_frame(text,text) from public,anon;
grant execute on function public.kickx_player_frames(),public.kickx_set_player_frame(text,text) to authenticated;

-- ---------- 20261122120000_player_trends.sql ----------
-- 30-day trend for list views (home, market list and cards), which do not carry full price history.
-- One value per Korean day (the last of that day), preceded by the last value before the window so a
-- player whose price moved rarely still draws a line. Read-only over the public price_history table.
create function public.kickx_player_trends(p_players text[]) returns jsonb
language sql stable security invoker set search_path='' as $$
 with ids as(select distinct unnest(p_players[1:60]) id),
 daily as(select distinct on(h.player_id,(h.recorded_at at time zone 'Asia/Seoul')::date) h.player_id,h.recorded_at,h.value
  from public.price_history h join ids on ids.id=h.player_id
  where h.recorded_at>=now()-interval '30 days'
  order by h.player_id,(h.recorded_at at time zone 'Asia/Seoul')::date,h.recorded_at desc,h.id desc),
 anchor as(select ids.id player_id,a.recorded_at,a.value from ids cross join lateral(
  select h.recorded_at,h.value from public.price_history h where h.player_id=ids.id and h.recorded_at<now()-interval '30 days'
  order by h.recorded_at desc,h.id desc limit 1) a),
 series as(select player_id,jsonb_agg(jsonb_build_object('at',recorded_at,'value',value) order by recorded_at) points
  from(select * from anchor union all select * from daily) s group by player_id)
 select coalesce(jsonb_object_agg(player_id,points),'{}'::jsonb) from series
$$;
revoke all on function public.kickx_player_trends(text[]) from public;
grant execute on function public.kickx_player_trends(text[]) to anon,authenticated,service_role;
notify pgrst,'reload schema';

-- ---------- 20261122130000_initial_points_and_weekly_reset_time.sql ----------
-- 1) New members start with 1,000,000P (existing wallets are unchanged).
-- 2) The weekly mission week now turns over on Tuesday 09:00 KST instead of 00:00.
--    Before 09:00 on Tuesday the previous week stays open (its day range includes that Tuesday);
--    match-based missions use the 09:00 boundary as well.
update public.kickx_policy set initial_points=1000000 where id=true;

create function kickx_private.mission_now() returns timestamp language sql stable set search_path='' as $$
 select now() at time zone 'Asia/Seoul' $$;
create function kickx_private.mission_week_now() returns date language sql stable set search_path='' as $$
 select kickx_private.mission_week(kickx_private.mission_today()-case when extract(isodow from kickx_private.mission_today())=2
  and kickx_private.mission_now()::time<time '09:00' then 1 else 0 end) $$;

do $patch$ declare d text;f text;begin
 foreach f in array array['public.kickx_engagement()','public.kickx_engagement_action(text,jsonb)'] loop
  d:=pg_get_functiondef(f::regprocedure);
  if position('w date:=kickx_private.mission_week(d);' in d)=0 then raise exception '% shape changed',f;end if;
  d:=replace(d,'w date:=kickx_private.mission_week(d);','w date:=kickx_private.mission_week_now();');
  execute d;
 end loop;
 d:=pg_get_functiondef('kickx_private.weekly_progress(uuid,date)'::regprocedure);
 if position($q$f.starts_at>=(w::timestamp at time zone 'Asia/Seoul') and f.starts_at<((w+7)::timestamp at time zone 'Asia/Seoul')$q$ in d)=0
  or position($q$'endsAt',((w+7)::timestamp at time zone 'Asia/Seoul')$q$ in d)=0 then raise exception 'weekly_progress shape changed';end if;
 d:=replace(d,$q$f.starts_at>=(w::timestamp at time zone 'Asia/Seoul') and f.starts_at<((w+7)::timestamp at time zone 'Asia/Seoul')$q$,
  $q$f.starts_at>=((w::timestamp+interval '9 hours') at time zone 'Asia/Seoul') and f.starts_at<(((w+7)::timestamp+interval '9 hours') at time zone 'Asia/Seoul')$q$);
 d:=replace(d,$q$'endsAt',((w+7)::timestamp at time zone 'Asia/Seoul')$q$,$q$'endsAt',(((w+7)::timestamp+interval '9 hours') at time zone 'Asia/Seoul')$q$);
 -- Day-based counts include the closing Tuesday so activity before 09:00 still counts for the open week.
 d:=replace(d,'day<w+7','day<=w+7');
 execute d;
end $patch$;

commit;

-- 적용 확인 (각각 true가 나와야 함)
select exists(select 1 from pg_proc where proname='kickx_set_player_frame') as player_frames,
       exists(select 1 from pg_proc where proname='kickx_player_trends') as trends,
       exists(select 1 from pg_proc where proname='mission_week_now') as weekly_9am,
       (select initial_points=1000000 from public.kickx_policy) as initial_1m,
       (select price=2500 from kickx_private.shop_items where id='attendance-ticket') as ticket_2500;

-- ===================== 2부: 치장 24종 추가 (가격 확정 후 실행) =====================
-- 가격은 제안값이다. 필요하면 아래 숫자를 바꾼 뒤 실행한다.
begin;
-- ---------- 20261121090000_cosmetic_catalog_expansion.sql ----------
-- Cosmetic catalog expansion (design pass 2026-11-21): 8 nameplates, 8 player frames, 8 pitches.
-- Catalog rows only. Prices are proposals for the policy owner to confirm before this is applied;
-- existing items keep their prices. Artwork is original CSS/SVG in the app (no external assets).
insert into kickx_private.shop_items(id,category,name,description,price,theme,sort_order) values
 ('nameplate-royal','nameplate','로열 크레스트','금빛 문장과 리본이 감싸는 왕실 네임태그',22000,'royal',5),
 ('nameplate-glacier','nameplate','글레이셜','얼음 결정이 반짝이는 빙하 네임태그',20000,'glacier',6),
 ('nameplate-sakura','nameplate','사쿠라 블룸','벚꽃잎이 흩날리는 분홍 네임태그',20000,'sakura',7),
 ('nameplate-neon','nameplate','네온 시티','네온사인과 글리치가 깜빡이는 도시 네임태그',24000,'neon',8),
 ('nameplate-jungle','nameplate','정글 바인','덩굴과 황금 잎이 감긴 정글 네임태그',20000,'jungle',9),
 ('nameplate-void','nameplate','보이드 리프트','공간이 갈라진 보랏빛 균열 네임태그',28000,'void',10),
 ('nameplate-pixel','nameplate','픽셀 아케이드','8비트 픽셀과 하트가 빛나는 아케이드 네임태그',18000,'pixel',11),
 ('nameplate-champion','nameplate','챔피언 리본','트로피와 붉은 리본의 우승 네임태그',30000,'champion',12),
 ('frame-bronze','frame','브론즈 실드','구리빛 방패와 작은 날개의 입문 테두리',10000,'bronze',20),
 ('frame-silver','frame','실버 윙','은빛 날개가 펼쳐지는 테두리',16000,'silver',21),
 ('frame-gold','frame','골드 크레스트','황금 문장과 붉은 보석의 테두리',22000,'gold',22),
 ('frame-platinum','frame','플래티넘 프리즘','청록 결정이 솟은 프리즘 테두리',28000,'platinum',23),
 ('frame-diamond','frame','다이아몬드 헤일로','푸른 다이아몬드와 광륜의 테두리',34000,'diamond',24),
 ('frame-master','frame','마스터 크라운','보랏빛 왕관과 보석 날개의 테두리',40000,'master',25),
 ('frame-legend','frame','레전드 이클립스','금빛 광선이 터지는 일식 테두리',50000,'legend',26),
 ('frame-frost','frame','프로스트 팽','얼음 송곳과 눈꽃이 둘러싼 테두리',30000,'frost',27),
 ('pitch-sky','pitch','스카이 아일랜드','구름 위에 떠 있는 섬 경기장',35000,'sky',33),
 ('pitch-arcade','pitch','네온 아케이드','네온 격자와 오락기가 빛나는 경기장',35000,'arcade',34),
 ('pitch-desert','pitch','오아시스','모래 언덕과 야자수의 사막 경기장',32000,'desert',35),
 ('pitch-deepsea','pitch','딥 블루','산호와 물방울이 떠오르는 해저 경기장',35000,'deepsea',36),
 ('pitch-blossom','pitch','블라썸 가든','벚꽃과 등불이 걸린 정원 경기장',35000,'blossom',37),
 ('pitch-haunted','pitch','문라이트 할로우','달빛 아래 호박과 묘비가 선 경기장',32000,'haunted',38),
 ('pitch-candy','pitch','캔디 랜드','사탕 줄무늬와 막대사탕의 경기장',30000,'candy',39),
 ('pitch-ruins','pitch','정글 템플','이끼 낀 석상과 덩굴의 유적 경기장',35000,'ruins',40)
on conflict (id) do nothing;
-- Keep each category together: nameplates, frames, pitches, then the recovery ticket.
update kickx_private.shop_items s set sort_order=v.sort_order
from (values ('nameplate-aurora',1),('nameplate-arcane',2),('nameplate-circuit',3),('nameplate-inferno',4),('frame-laurel',13),('frame-circuit',14),('frame-arcane',15),('frame-seraph',16),('frame-dragon',17),('frame-astral',18),('frame-tempest',19),('pitch-myth',28),('pitch-engineering',29),('pitch-christmas',30),('pitch-volcano',31),('pitch-cosmos',32),('attendance-ticket',41)) as v(id,sort_order) where s.id=v.id;
commit;

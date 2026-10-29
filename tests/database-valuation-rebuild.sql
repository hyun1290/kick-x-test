begin;
do $$begin
 if has_function_privilege('anon','public.kickx_seed_non_participation()','execute') or has_function_privilege('authenticated','public.kickx_stage_valuation_rebuild(jsonb)','execute') then raise exception 'Rebuild helper exposed';end if;
 if has_table_privilege('anon','public.football_roster_observations','select') then raise exception 'Roster evidence exposed';end if;
end $$;
insert into public.leagues(id,name)values('bsd-1','Valuation test')on conflict do nothing;
insert into public.teams(id,name,league_id)values('bsd-910','Home','bsd-1'),('bsd-911','Away','bsd-1');
insert into public.players(id,name,provider,position,team_id)values('bsd-9001','Bench','bsd','FW','bsd-910'),('bsd-9002','Unavailable','bsd','DF','bsd-910'),('bsd-9003','Later roster','bsd','MF','bsd-910');
insert into public.football_entity_sources(provider,kind,external_id,raw,updated_at)
values('bsd','squad',910,'{"team_id":910,"count":3,"players":[{"id":9001},{"id":9002},{"id":9003}]}','2026-10-03T00:00:00Z');
insert into public.fixtures(id,league_id,home_team_id,away_team_id,starts_at,status,home_score,away_score,season)
values('valuation-evidence','bsd-1','bsd-910','bsd-911','2026-10-02T12:00:00Z','FT',0,0,2026);
insert into public.football_event_sources(fixture_id,detail,lineups,incidents)
select 'valuation-evidence','{}',jsonb_build_object('lineup_status','confirmed','lineups',jsonb_build_object(
 'home',jsonb_build_object('team_id',910,'players',(select jsonb_agg(jsonb_build_object('id',n,'position','D'))from generate_series(100,110)n),'substitutes','[{"id":9001,"position":"F"}]'::jsonb),
 'away',jsonb_build_object('team_id',911,'players',(select jsonb_agg(jsonb_build_object('id',n,'position','D'))from generate_series(200,210)n),'substitutes','[]'::jsonb)),
 'unavailable_players','{"home":[{"id":9002}],"away":[]}'::jsonb),'{"incidents":[]}';
do $$declare n integer;begin
 n:=public.kickx_seed_non_participation();if n<>2 then raise exception 'Expected two verified DNPs, got %',n;end if;
 if exists(select 1 from public.football_match_stats where player_id='bsd-9003')then raise exception 'Current roster backdated';end if;
 if (select count(*)from public.calculation_queue where player_id in('bsd-9001','bsd-9002'))<>2 then raise exception 'DNP not queued';end if;
 if public.kickx_seed_non_participation()<>0 then raise exception 'DNP not idempotent';end if;
 if (select count(*)from public.player_match_records where fixture_id='valuation-evidence' and minutes=0)<>2 then raise exception 'DNP history absent';end if;
end $$;
rollback;

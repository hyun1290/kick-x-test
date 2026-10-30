begin;
create schema if not exists storage;
create table if not exists storage.objects(bucket_id text,name text,created_at timestamptz not null default now());
do $$begin
 if has_function_privilege('anon','public.kickx_replace_regular_reference(text,jsonb)','execute')or has_function_privilege('authenticated','public.kickx_replace_regular_reference(text,jsonb)','execute')then raise exception 'Reference replacement exposed';end if;
 if public.kickx_duration_evidence('{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":12},{"player_id":4,"minutes_played":18}]}','{"incidents":[{"type":"substitution","minute":83,"player_in_id":3},{"type":"substitution","minute":77,"player_in_id":4}]}')<>95 then raise exception 'Corroborated added time not recovered';end if;
 if public.kickx_duration_evidence('{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":12}]}','{"incidents":[{"type":"substitution","minute":83,"player_in_id":3}]}')<>90 then raise exception 'Uncorroborated clock was invented';end if;
end $$;
do $$declare ref jsonb;params jsonb;b jsonb;begin
 select report_parameters into params from public.kickx_policy;
 ref:='{"status":"ready","season":2025,"hash":"ties","groups":{"MF":{"mean":6,"lower":0,"upper":30,"baselines":[1,6,6,10]}},"players":{}}';
 b:=public.kickx_report_baseline('new','MF',ref,params);
 if (b->>'percentile')::numeric<>0.5 or (b->>'price')::integer<>505000 then raise exception 'Binary tied midrank changed policy';end if;
 ref:=jsonb_set(ref,'{players}','{"new":{"MF":{"n":1,"sum":21}}}');b:=public.kickx_report_baseline('new','MF',ref,params);
 if (b->>'percentile')::numeric<>0.75 then raise exception 'Binary insertion percentile changed policy';end if;
end $$;
insert into public.leagues(id,name)values('bsd-5','Scope league')on conflict do nothing;
insert into public.teams(id,name,league_id)values('scope-home','Home','bsd-5'),('scope-away','Away','bsd-5');
insert into public.teams(id,name,league_id)values('bsd-919','Observed squad','bsd-5');
insert into public.football_entity_sources(provider,kind,external_id,raw,updated_at)values('bsd','squad',919,'{"players":[{"id":9999}]}','2026-10-01T00:00:00Z');
update public.football_entity_sources set updated_at='2026-10-02T00:00:00Z'where kind='squad'and external_id=919;
do $$begin
 if (select max(verified_at)from public.football_roster_observations where team_id='bsd-919')<>timestamptz '2026-10-02T00:00:00Z'then raise exception 'Unchanged source did not advance verification';end if;
 if (select updated_at from public.football_entity_sources where kind='squad'and external_id=919)<>timestamptz '2026-10-01T00:00:00Z'then raise exception 'Verification changed semantic source time';end if;
end $$;
update public.football_entity_sources set updated_at='2026-10-20T00:00:00Z'where kind='squad'and external_id=919;
do $$begin
 if (select count(*)from public.football_roster_observations where team_id='bsd-919')<>2 then raise exception 'Verification gap was silently bridged';end if;
 if exists(select 1 from public.football_roster_observations where team_id='bsd-919'and observed_at<=timestamptz '2026-10-15T00:00:00Z'and verified_at>=timestamptz '2026-10-08T00:00:00Z')then raise exception 'Fresh check was backdated into missing history';end if;
end $$;
insert into public.fixtures(id,league_id,home_team_id,away_team_id,starts_at,status,stage)
values('scope-regular','bsd-5','scope-home','scope-away','2026-10-03T12:00:00Z','FT','league-phase'),('scope-final','bsd-5','scope-home','scope-away','2026-10-04T12:00:00Z','FT','final'),('scope-unknown','bsd-5','scope-home','scope-away','2026-10-05T12:00:00Z','FT',null);
do $$begin
 if public.kickx_regular_fixture('scope-regular')is distinct from true or public.kickx_regular_fixture('scope-final')is distinct from false or public.kickx_regular_fixture('scope-unknown')is not null then raise exception 'Regular/knockout/unknown scope conflated';end if;
end $$;
insert into public.football_event_sources(fixture_id,detail,player_stats,incidents)values('scope-regular','{}','{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":12},{"player_id":4,"minutes_played":18}]}','{"incidents":[{"type":"substitution","minute":83,"player_in_id":3},{"type":"substitution","minute":77,"player_in_id":4}]}');
do $$declare at_time timestamptz;begin
 select updated_at into at_time from public.fixtures where id='scope-regular';
 if public.kickx_observed_fixture_minutes('scope-regular')<>95 then raise exception 'Clock not cached';end if;
 update public.football_event_sources set player_stats='{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":14},{"player_id":4,"minutes_played":20}]}'where fixture_id='scope-regular';
 if public.kickx_observed_fixture_minutes('scope-regular')<>97 then raise exception 'Changed clock not refreshed';end if;
 if (select updated_at from public.fixtures where id='scope-regular')is distinct from at_time then raise exception 'Cache write changed source timestamp';end if;
end $$;
update public.kickx_policy set report_reference='{"hash":"scope-old"}';
do $$begin
 begin perform public.kickx_replace_regular_reference('stale','{}');raise exception 'Accepted stale reference';exception when others then if sqlerrm<>'REFERENCE_CHANGED'then raise;end if;end;
 begin perform public.kickx_replace_regular_reference('scope-old','{"hash":"scope-new","regularSeasonScopeVerified":false}');raise exception 'Accepted unverified scope';exception when others then if sqlerrm<>'REGULAR_SEASON_SCOPE_REQUIRED'then raise;end if;end;
 if (select report_reference->>'hash' from public.kickx_policy)<>'scope-old'then raise exception 'Failed correction changed policy';end if;
end $$;
-- An active reference correction replaces derived initial/history values atomically.
insert into storage.objects(bucket_id,name)values('kickx-calculation-archives','scope/old'),('kickx-calculation-archives','scope/reference');
insert into public.players(id,name,provider,position,team_id)values('scope-player','Scope player','bsd','MF','scope-home');
insert into public.player_market_snapshots(id,price,pricing_status,pricing_rule_version)values('scope-player',123000,'ready','report-v3');
insert into public.price_history(player_id,recorded_at,value,rule_version)values('scope-player',now(),123000,'report-v3');
insert into public.calculation_queue(player_id,attempts,error_code,retry_at)values('scope-player',7,'OLD_FAILURE',now()+interval '1 day')on conflict(player_id)do update set attempts=7,error_code='OLD_FAILURE',retry_at=now()+interval '1 day';
update public.kickx_policy set version='report-v3',report_reference='{"hash":"scope-old"}',valuation_rebuild='{"status":"active","backup":{"path":"scope/old"},"portfolioRebuiltAt":"old"}';
do $$declare ref jsonb;answer jsonb;before_hash jsonb;begin
 select jsonb_build_object('status','ready','season',2025,'hash',repeat('c',64),'regularSeasonScopeVerified',true,'completed',1500,'fixtureCount',1500,
 'archives',(select jsonb_agg(jsonb_build_object('path','scope/reference','fixtureId','scope-'||n))from generate_series(1,1500)n),
 'players','{}'::jsonb,'groups',(select jsonb_object_agg(pos,'{"mean":6,"lower":0,"upper":30,"baselines":[6]}'::jsonb)from unnest(array['GK','DF','MF','FW'])pos),
 'scopeAudit','{"previousReferenceBackup":{"path":"scope/reference"},"excluded":[]}'::jsonb)into ref;
 before_hash:=public.kickx_valuation_integrity();answer:=public.kickx_replace_regular_reference('scope-old',ref);
 if not exists(select 1 from public.calculation_queue where player_id='scope-player'and attempts=0 and error_code is null and retry_at<=now())then raise exception 'Bulk reset did not clear retry backoff';end if;
 if (select price from public.player_market_snapshots where id='scope-player')<>505000 or (select pricing_status from public.player_market_snapshots where id='scope-player')<>'pending'then raise exception 'Corrected baseline not staged';end if;
 if (select detail->>'referenceHash' from public.player_initial_values where player_id='scope-player')<>repeat('c',64)then raise exception 'Incomplete players retained an old initial value';end if;
 if (select count(*)from public.price_history where player_id='scope-player')<>1 or not exists(select 1 from public.price_history where player_id='scope-player' and recorded_at=timestamptz '2026-09-30T15:00:00Z')then raise exception 'Stale derived history retained';end if;
 if (public.kickx_replace_regular_reference('scope-old',ref)->>'unchanged')::boolean is distinct from true then raise exception 'Correction retry not idempotent';end if;
 if before_hash is distinct from public.kickx_valuation_integrity()then raise exception 'Reference correction touched financial facts';end if;
end $$;
rollback;

begin;
create schema if not exists storage;
create table if not exists storage.objects(bucket_id text,name text);
do $$begin
 if has_function_privilege('anon','public.kickx_replace_regular_reference(text,jsonb)','execute')or has_function_privilege('authenticated','public.kickx_replace_regular_reference(text,jsonb)','execute')then raise exception 'Reference replacement exposed';end if;
 if public.kickx_duration_evidence('{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":12},{"player_id":4,"minutes_played":18}]}','{"incidents":[{"type":"substitution","minute":83,"player_in_id":3},{"type":"substitution","minute":77,"player_in_id":4}]}')<>95 then raise exception 'Corroborated added time not recovered';end if;
 if public.kickx_duration_evidence('{"player_stats":[{"player_id":1,"minutes_played":90},{"player_id":2,"minutes_played":90},{"player_id":3,"minutes_played":12}]}','{"incidents":[{"type":"substitution","minute":83,"player_in_id":3}]}')<>90 then raise exception 'Uncorroborated clock was invented';end if;
end $$;
insert into public.leagues(id,name)values('bsd-5','Scope league')on conflict do nothing;
insert into public.teams(id,name,league_id)values('scope-home','Home','bsd-5'),('scope-away','Away','bsd-5');
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
rollback;

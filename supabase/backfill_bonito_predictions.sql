-- One-time backfill: Bonito historical predictions.
--
-- User:
-- - bonysayed@gmail.com
--
-- Purpose:
-- - Reattach/update Bonito's historical predictions after football-data fixtures became canonical.
-- - Touches only the profile resolved from bonysayed@gmail.com.
-- - Does not modify any other user's predictions.
--
-- Note:
-- - These fixtures are historical/locked, so this transaction temporarily disables only
--   predictions_validate_write while repairing the old rows.

begin;

create temp table bonito_target_profile (
  user_id uuid primary key
) on commit drop;

insert into bonito_target_profile (user_id)
select id
from (
  select p.id, 1 as source_priority
  from public.profiles p
  where lower(p.email) = lower('bonysayed@gmail.com')

  union all

  select p.id, 2 as source_priority
  from public.profiles p
  join auth.users u
    on u.id = p.id
  where lower(u.email) = lower('bonysayed@gmail.com')
) matched_profile
order by source_priority
limit 1;

do $$
begin
  if not exists (select 1 from bonito_target_profile) then
    raise exception 'No public.profiles row found for bonysayed@gmail.com. Have this user sign in once first.';
  end if;
end $$;

create temp table bonito_backfill_picks (
  home_team text not null,
  away_team text not null,
  pick_team_name text,
  pick_is_draw boolean not null default false,
  pred_goals_team1 integer,
  pred_goals_team2 integer
) on commit drop;

insert into bonito_backfill_picks (
  home_team,
  away_team,
  pick_team_name,
  pick_is_draw,
  pred_goals_team1,
  pred_goals_team2
)
values
  ('Mexico', 'South Africa', 'Mexico', false, null, null),
  ('South Korea', 'Czechia', 'Czechia', false, null, null),
  ('Canada', 'Bosnia and Herzegovina', 'Canada', false, 2, 1),
  ('USA', 'Paraguay', null, true, 1, 1),
  ('Qatar', 'Switzerland', 'Switzerland', false, null, null),
  ('Brazil', 'Morocco', 'Brazil', false, null, null),
  ('Haiti', 'Scotland', 'Scotland', false, null, null),
  ('Australia', 'Turkey', null, true, null, null);

create temp table bonito_resolved_predictions on commit drop as
select
  profile.user_id,
  f.id as fixture_id,
  picks.home_team,
  picks.away_team,
  picks.pick_team_name,
  case
    when picks.pick_is_draw then null
    when t.id is not null then t.id
    when picks.pick_team_name = f.home_team then f.team1_id
    when picks.pick_team_name = f.away_team then f.team2_id
    else null
  end as picked_team_id,
  picks.pick_is_draw,
  picks.pred_goals_team1,
  picks.pred_goals_team2
from bonito_backfill_picks picks
cross join bonito_target_profile profile
join public.fixtures f
  on f.api_provider = 'football-data'
 and f.home_team = picks.home_team
 and f.away_team = picks.away_team
left join public.teams t
  on t.name = picks.pick_team_name;

do $$
declare
  missing_fixture_count integer;
  unresolved_pick_count integer;
begin
  select count(*)
    into missing_fixture_count
  from bonito_backfill_picks picks
  where not exists (
    select 1
    from public.fixtures f
    where f.api_provider = 'football-data'
      and f.home_team = picks.home_team
      and f.away_team = picks.away_team
  );

  if missing_fixture_count > 0 then
    raise exception 'Bonito backfill aborted: % listed fixtures could not be found as football-data fixtures', missing_fixture_count;
  end if;

  select count(*)
    into unresolved_pick_count
  from bonito_resolved_predictions
  where pick_is_draw = false
    and picked_team_id is null;

  if unresolved_pick_count > 0 then
    raise exception 'Bonito backfill aborted: % picked teams could not be resolved', unresolved_pick_count;
  end if;
end $$;

alter table public.predictions disable trigger predictions_validate_write;

insert into public.predictions (
  user_id,
  fixture_id,
  picked_team_id,
  pick_is_draw,
  pred_goals_team1,
  pred_goals_team2,
  joker_used
)
select
  user_id,
  fixture_id,
  picked_team_id,
  pick_is_draw,
  pred_goals_team1,
  pred_goals_team2,
  false
from bonito_resolved_predictions
on conflict (user_id, fixture_id) do update
set
  picked_team_id = excluded.picked_team_id,
  pick_is_draw = excluded.pick_is_draw,
  pred_goals_team1 = excluded.pred_goals_team1,
  pred_goals_team2 = excluded.pred_goals_team2,
  updated_at = now();

alter table public.predictions enable trigger predictions_validate_write;

commit;

-- Verification: Bonito's updated prediction rows.
select
  f.home_team || ' vs ' || f.away_team as fixture,
  case
    when p.pick_is_draw then 'Draw'
    else picked.name
  end as prediction,
  p.pred_goals_team1 as predicted_home_score,
  p.pred_goals_team2 as predicted_away_score
from public.predictions p
join public.profiles profile
  on profile.id = p.user_id
join public.fixtures f
  on f.id = p.fixture_id
left join public.teams picked
  on picked.id = p.picked_team_id
where lower(profile.email) = lower('bonysayed@gmail.com')
  and (
    (f.home_team = 'Mexico' and f.away_team = 'South Africa')
    or (f.home_team = 'South Korea' and f.away_team = 'Czechia')
    or (f.home_team = 'Canada' and f.away_team = 'Bosnia and Herzegovina')
    or (f.home_team = 'USA' and f.away_team = 'Paraguay')
    or (f.home_team = 'Qatar' and f.away_team = 'Switzerland')
    or (f.home_team = 'Brazil' and f.away_team = 'Morocco')
    or (f.home_team = 'Haiti' and f.away_team = 'Scotland')
    or (f.home_team = 'Australia' and f.away_team = 'Turkey')
  )
order by f.kickoff_time_utc;

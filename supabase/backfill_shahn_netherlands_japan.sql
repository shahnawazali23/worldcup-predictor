-- One-time fix: Shahnawaz Ali prediction for Netherlands vs Japan.
--
-- User:
-- - shahn1998@gmail.com
--
-- Expected prediction:
-- - Netherlands vs Japan -> Netherlands
-- - Not a draw
-- - No scoreline prediction
-- - No joker
--
-- Scope:
-- - Touches only this user's prediction for the canonical football-data fixture.
-- - Does not modify any other user's predictions.
-- - Does not modify fixtures, teams, results, or scoring logic.

begin;

create temp table shahn_target_profile (
  user_id uuid primary key
) on commit drop;

insert into shahn_target_profile (user_id)
select id
from (
  select p.id, 1 as source_priority
  from public.profiles p
  where lower(p.email) = lower('shahn1998@gmail.com')

  union all

  select p.id, 2 as source_priority
  from public.profiles p
  join auth.users u
    on u.id = p.id
  where lower(u.email) = lower('shahn1998@gmail.com')
) matched_profile
order by source_priority
limit 1;

do $$
begin
  if not exists (select 1 from shahn_target_profile) then
    raise exception 'No public.profiles row found for shahn1998@gmail.com. Have this user sign in once first.';
  end if;
end $$;

create temp table shahn_target_prediction on commit drop as
select
  profile.user_id,
  f.id as fixture_id,
  coalesce(f.team1_id, picked.id) as picked_team_id
from shahn_target_profile profile
join public.fixtures f
  on f.api_provider = 'football-data'
 and f.home_team = 'Netherlands'
 and f.away_team = 'Japan'
left join public.teams picked
  on picked.name = 'Netherlands';

do $$
declare
  target_count integer;
  unresolved_pick_count integer;
begin
  select count(*) into target_count
  from shahn_target_prediction;

  if target_count <> 1 then
    raise exception 'Expected exactly 1 canonical football-data fixture for Netherlands vs Japan, found %', target_count;
  end if;

  select count(*) into unresolved_pick_count
  from shahn_target_prediction
  where picked_team_id is null;

  if unresolved_pick_count > 0 then
    raise exception 'Could not resolve Netherlands team ID for Netherlands vs Japan';
  end if;
end $$;

-- Historical/locked fixture repair only.
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
  false,
  null,
  null,
  false
from shahn_target_prediction
on conflict (user_id, fixture_id) do update
set
  picked_team_id = excluded.picked_team_id,
  pick_is_draw = false,
  pred_goals_team1 = null,
  pred_goals_team2 = null,
  joker_used = false,
  updated_at = now();

alter table public.predictions enable trigger predictions_validate_write;

commit;

-- Verification.
select
  profile.email as user_email,
  f.id as fixture_id,
  f.home_team || ' vs ' || f.away_team as fixture,
  picked.name as picked_team,
  p.pick_is_draw,
  p.pred_goals_team1,
  p.pred_goals_team2,
  p.joker_used
from public.predictions p
join public.profiles profile
  on profile.id = p.user_id
join public.fixtures f
  on f.id = p.fixture_id
left join public.teams picked
  on picked.id = p.picked_team_id
where lower(profile.email) = lower('shahn1998@gmail.com')
  and f.api_provider = 'football-data'
  and f.home_team = 'Netherlands'
  and f.away_team = 'Japan';

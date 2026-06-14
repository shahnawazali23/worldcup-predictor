-- One-time restore: Bonito predictions.
--
-- User:
-- - bonysayed@gmail.com
--
-- Purpose:
-- - Restore Bonito's 9 expected predictions after football-data fixtures became canonical.
-- - Touches only the profile resolved from bonysayed@gmail.com.
-- - Does not modify any other user's predictions.
--
-- Note:
-- - These fixtures are historical/locked, so this transaction temporarily disables only
--   predictions_validate_write while repairing the old rows.

begin;

create or replace function pg_temp.bonito_team_key(team_name text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(
      translate(
        coalesce(team_name, ''),
        'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕØóòôöõøÚÙÛÜúùûüÇçÑñÝýÿ',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnYyy'
      )
    ),
    '[^a-z0-9]+',
    '',
    'g'
  )
$$;

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
  ('Australia', 'Turkey', null, true, null, null),
  ('Germany', 'Curacao', 'Germany', false, null, null);

create table if not exists public.prediction_restore_backup (
  id bigserial primary key,
  restored_at timestamptz not null default now(),
  reason text not null,
  user_id uuid not null,
  prediction_id uuid,
  prediction_row jsonb
);

insert into public.prediction_restore_backup (
  reason,
  user_id,
  prediction_id,
  prediction_row
)
select
  'bonito_restore_2026_06_14',
  p.user_id,
  p.id,
  to_jsonb(p)
from public.predictions p
join bonito_target_profile profile
  on profile.user_id = p.user_id;

create temp table bonito_resolved_predictions on commit drop as
select
  profile.user_id,
  f.id as fixture_id,
  picks.home_team,
  picks.away_team,
  picks.pick_team_name,
  case
    when picks.pick_is_draw then null
    when picks.pick_team_name = f.home_team then f.team1_id
    when picks.pick_team_name = f.away_team then f.team2_id
    when picked_home.name = picks.pick_team_name then f.team1_id
    when picked_away.name = picks.pick_team_name then f.team2_id
    else null
  end as picked_team_id,
  picks.pick_is_draw,
  picks.pred_goals_team1,
  picks.pred_goals_team2
from bonito_backfill_picks picks
cross join bonito_target_profile profile
join public.fixtures f
  on f.api_provider = 'football-data'
 and pg_temp.bonito_team_key(f.home_team) = pg_temp.bonito_team_key(picks.home_team)
 and pg_temp.bonito_team_key(f.away_team) = pg_temp.bonito_team_key(picks.away_team)
left join public.teams picked_home
  on picked_home.id = f.team1_id
left join public.teams picked_away
  on picked_away.id = f.team2_id;

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
      and pg_temp.bonito_team_key(f.home_team) = pg_temp.bonito_team_key(picks.home_team)
      and pg_temp.bonito_team_key(f.away_team) = pg_temp.bonito_team_key(picks.away_team)
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

-- Restore exactly the 9 expected rows for Bonito. Remove any other Bonito
-- predictions, but do not touch other users.
delete from public.predictions p
using bonito_target_profile profile
where p.user_id = profile.user_id
  and not exists (
    select 1
    from bonito_resolved_predictions expected
    where expected.fixture_id = p.fixture_id
  );

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
  p.pred_goals_team2 as predicted_away_score,
  f.is_finished
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
    or (f.home_team = 'Germany' and f.away_team in ('Curacao', 'Curaçao'))
  )
order by f.kickoff_time_utc;

-- Count verification. Expected: total_predictions = 9.
select
  count(*) as total_predictions,
  count(*) filter (where f.is_finished) as finished_predictions,
  count(*) filter (where not f.is_finished) as upcoming_predictions
from public.predictions p
join public.profiles profile
  on profile.id = p.user_id
join public.fixtures f
  on f.id = p.fixture_id
where lower(profile.email) = lower('bonysayed@gmail.com');

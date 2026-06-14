-- One-time migration: make football-data.org the only fixture source.
--
-- Goal:
-- - Backup predictions before changing fixture references.
-- - Build a report mapping old legacy fixture IDs to football-data fixture IDs.
-- - Reattach existing predictions to matching football-data fixtures.
-- - Delete all legacy fixtures.
-- - Keep only football-data fixtures in public.fixtures.
--
-- Matching key:
-- - competition
-- - stage
-- - team1_id/team2_id
-- - canonical kickoff instant: coalesce(kickoff_time_utc, kickoff_at)
--
-- Provider note:
-- Legacy seed data and football-data.org can use different text for the same stage
-- or competition, for example "Group Stage" vs "GROUP_STAGE". The migration
-- normalizes those labels before matching.
--
-- Safety:
-- - The migration aborts if any prediction on a legacy fixture cannot be mapped.
-- - The migration aborts if prediction count changes.
-- - The prediction write validation trigger is disabled only inside this transaction
--   because this is a historical repair for already locked/finished fixtures.

-- ============================================================================
-- BEFORE / DRY RUN
-- ============================================================================

create or replace function pg_temp.fixture_stage_key(stage text)
returns text
language sql
immutable
as $$
  select case
    when stage is null or btrim(stage) = '' then 'unknown'
    when lower(stage) in ('group', 'group stage', 'group_stage', 'regular season') then 'group'
    when lower(stage) in ('last_16', 'last 16', 'round of 16', 'round_of_16') then 'round_of_16'
    when lower(stage) in ('quarter_finals', 'quarter finals', 'quarter-final', 'quarter final', 'quarterfinals') then 'quarter_finals'
    when lower(stage) in ('semi_finals', 'semi finals', 'semi-final', 'semi final', 'semifinals') then 'semi_finals'
    when lower(stage) in ('third_place', 'third place', 'third place play-off', 'third-place play-off') then 'third_place'
    when lower(stage) in ('final', 'finals') then 'final'
    else lower(regexp_replace(stage, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

create or replace function pg_temp.fixture_competition_key(competition text)
returns text
language sql
immutable
as $$
  select case
    when competition is null or btrim(competition) = '' then 'unknown'
    when lower(competition) like '%world cup%' then 'world_cup'
    else lower(regexp_replace(competition, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

-- 1. Prediction count before migration.
select count(*) as prediction_count_before
from public.predictions;

-- 2. Fixture counts by provider before migration.
select
  coalesce(api_provider, '<null>') as api_provider,
  count(*) as fixture_count
from public.fixtures
group by 1
order by 1;

-- 3. Mapping report: old legacy fixture IDs -> football-data fixture IDs.
with fixture_map as (
  select
    legacy.id as old_fixture_id,
    fd.id as football_data_fixture_id,
    legacy.api_provider as old_provider,
    legacy.api_fixture_id as old_api_fixture_id,
    fd.api_fixture_id as football_data_api_fixture_id,
    legacy.home_team,
    legacy.away_team,
    coalesce(fd.kickoff_time_utc, fd.kickoff_at) as kickoff_time_utc,
    legacy.stage,
    legacy.competition,
    count(p.id) as predictions_to_move
  from public.fixtures legacy
  left join public.fixtures fd
    on fd.api_provider = 'football-data'
   and pg_temp.fixture_competition_key(fd.competition) = pg_temp.fixture_competition_key(legacy.competition)
   and pg_temp.fixture_stage_key(fd.stage) = pg_temp.fixture_stage_key(legacy.stage)
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  left join public.predictions p
    on p.fixture_id = legacy.id
  where legacy.api_provider = 'legacy'
  group by
    legacy.id,
    fd.id,
    legacy.api_provider,
    legacy.api_fixture_id,
    fd.api_fixture_id,
    legacy.home_team,
    legacy.away_team,
    fd.kickoff_time_utc,
    fd.kickoff_at,
    legacy.stage,
    legacy.competition
)
select *
from fixture_map
order by kickoff_time_utc, home_team, away_team;

-- 4. Must be zero before migration: legacy predictions that cannot be mapped.
with fixture_map as (
  select legacy.id as old_fixture_id, fd.id as football_data_fixture_id
  from public.fixtures legacy
  left join public.fixtures fd
    on fd.api_provider = 'football-data'
   and pg_temp.fixture_competition_key(fd.competition) = pg_temp.fixture_competition_key(legacy.competition)
   and pg_temp.fixture_stage_key(fd.stage) = pg_temp.fixture_stage_key(legacy.stage)
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  where legacy.api_provider = 'legacy'
)
select
  p.id as prediction_id,
  p.user_id,
  p.fixture_id as unmapped_legacy_fixture_id
from public.predictions p
join fixture_map m
  on m.old_fixture_id = p.fixture_id
where m.football_data_fixture_id is null
order by p.user_id, p.fixture_id;

-- 5. Diagnostic for any rows returned by query 4.
-- This shows the legacy fixture details and the closest football-data candidates.
-- Use this before adding any manual override; do not guess.
create or replace function pg_temp.fixture_stage_key(stage text)
returns text
language sql
immutable
as $$
  select case
    when stage is null or btrim(stage) = '' then 'unknown'
    when lower(stage) in ('group', 'group stage', 'group_stage', 'regular season') then 'group'
    when lower(stage) in ('last_16', 'last 16', 'round of 16', 'round_of_16') then 'round_of_16'
    when lower(stage) in ('quarter_finals', 'quarter finals', 'quarter-final', 'quarter final', 'quarterfinals') then 'quarter_finals'
    when lower(stage) in ('semi_finals', 'semi finals', 'semi-final', 'semi final', 'semifinals') then 'semi_finals'
    when lower(stage) in ('third_place', 'third place', 'third place play-off', 'third-place play-off') then 'third_place'
    when lower(stage) in ('final', 'finals') then 'final'
    else lower(regexp_replace(stage, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

create or replace function pg_temp.fixture_competition_key(competition text)
returns text
language sql
immutable
as $$
  select case
    when competition is null or btrim(competition) = '' then 'unknown'
    when lower(competition) like '%world cup%' then 'world_cup'
    else lower(regexp_replace(competition, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

with unmapped_legacy_fixtures as (
  select distinct
    legacy.id,
    legacy.api_fixture_id,
    legacy.home_team,
    legacy.away_team,
    legacy.team1_id,
    legacy.team2_id,
    legacy.stage,
    legacy.competition,
    coalesce(legacy.kickoff_time_utc, legacy.kickoff_at) as kickoff_time_utc
  from public.predictions p
  join public.fixtures legacy
    on legacy.id = p.fixture_id
  left join public.fixtures fd
    on fd.api_provider = 'football-data'
   and pg_temp.fixture_competition_key(fd.competition) = pg_temp.fixture_competition_key(legacy.competition)
   and pg_temp.fixture_stage_key(fd.stage) = pg_temp.fixture_stage_key(legacy.stage)
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  where legacy.api_provider = 'legacy'
    and fd.id is null
)
select
  legacy.id as legacy_fixture_id,
  legacy.api_fixture_id as legacy_api_fixture_id,
  legacy.home_team as legacy_home_team,
  legacy.away_team as legacy_away_team,
  legacy.stage as legacy_stage,
  legacy.kickoff_time_utc as legacy_kickoff_time_utc,
  fd.id as candidate_football_data_fixture_id,
  fd.api_fixture_id as candidate_api_fixture_id,
  fd.home_team as candidate_home_team,
  fd.away_team as candidate_away_team,
  fd.stage as candidate_stage,
  coalesce(fd.kickoff_time_utc, fd.kickoff_at) as candidate_kickoff_time_utc,
  abs(extract(epoch from (coalesce(fd.kickoff_time_utc, fd.kickoff_at) - legacy.kickoff_time_utc))) / 3600
    as kickoff_difference_hours
from unmapped_legacy_fixtures legacy
left join lateral (
  select fd.*
  from public.fixtures fd
  where fd.api_provider = 'football-data'
    and (
      (fd.team1_id = legacy.team1_id and fd.team2_id = legacy.team2_id)
      or (fd.team1_id = legacy.team2_id and fd.team2_id = legacy.team1_id)
      or coalesce(fd.kickoff_time_utc, fd.kickoff_at)::date = legacy.kickoff_time_utc::date
    )
  order by
    case
      when fd.team1_id = legacy.team1_id and fd.team2_id = legacy.team2_id then 0
      when fd.team1_id = legacy.team2_id and fd.team2_id = legacy.team1_id then 1
      else 2
    end,
    abs(extract(epoch from (coalesce(fd.kickoff_time_utc, fd.kickoff_at) - legacy.kickoff_time_utc)))
  limit 5
) fd on true
order by legacy.kickoff_time_utc, legacy.id, kickoff_difference_hours nulls last;

-- 6. Must be zero before migration: same user predicted both legacy and football-data rows.
-- If this returns rows, resolve manually before running the migration because preserving
-- prediction count is impossible with the unique (user_id, fixture_id) constraint.
with fixture_map as (
  select legacy.id as old_fixture_id, fd.id as football_data_fixture_id
  from public.fixtures legacy
  join public.fixtures fd
    on fd.api_provider = 'football-data'
   and pg_temp.fixture_competition_key(fd.competition) = pg_temp.fixture_competition_key(legacy.competition)
   and pg_temp.fixture_stage_key(fd.stage) = pg_temp.fixture_stage_key(legacy.stage)
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  where legacy.api_provider = 'legacy'
)
select
  legacy_prediction.user_id,
  legacy_prediction.id as legacy_prediction_id,
  canonical_prediction.id as football_data_prediction_id,
  legacy_prediction.fixture_id as old_fixture_id,
  canonical_prediction.fixture_id as football_data_fixture_id
from fixture_map m
join public.predictions legacy_prediction
  on legacy_prediction.fixture_id = m.old_fixture_id
join public.predictions canonical_prediction
  on canonical_prediction.fixture_id = m.football_data_fixture_id
 and canonical_prediction.user_id = legacy_prediction.user_id
order by legacy_prediction.user_id, legacy_prediction.fixture_id;

-- 7. Duplicate match groups before migration.
with duplicate_groups as (
  select
    coalesce(competition, 'FIFA World Cup 2026') as competition,
    coalesce(stage, '') as stage,
    team1_id,
    team2_id,
    coalesce(kickoff_time_utc, kickoff_at) as kickoff_time_utc,
    count(*) as fixture_count,
    array_agg(id order by api_provider, id) as fixture_ids,
    array_agg(api_provider order by api_provider, id) as providers
  from public.fixtures
  where team1_id is not null
    and team2_id is not null
    and coalesce(kickoff_time_utc, kickoff_at) is not null
  group by 1, 2, 3, 4, 5
  having count(*) > 1
)
select *
from duplicate_groups
order by kickoff_time_utc, stage;

-- ============================================================================
-- MIGRATION
-- ============================================================================

create or replace function pg_temp.fixture_stage_key(stage text)
returns text
language sql
immutable
as $$
  select case
    when stage is null or btrim(stage) = '' then 'unknown'
    when lower(stage) in ('group', 'group stage', 'group_stage', 'regular season') then 'group'
    when lower(stage) in ('last_16', 'last 16', 'round of 16', 'round_of_16') then 'round_of_16'
    when lower(stage) in ('quarter_finals', 'quarter finals', 'quarter-final', 'quarter final', 'quarterfinals') then 'quarter_finals'
    when lower(stage) in ('semi_finals', 'semi finals', 'semi-final', 'semi final', 'semifinals') then 'semi_finals'
    when lower(stage) in ('third_place', 'third place', 'third place play-off', 'third-place play-off') then 'third_place'
    when lower(stage) in ('final', 'finals') then 'final'
    else lower(regexp_replace(stage, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

create or replace function pg_temp.fixture_competition_key(competition text)
returns text
language sql
immutable
as $$
  select case
    when competition is null or btrim(competition) = '' then 'unknown'
    when lower(competition) like '%world cup%' then 'world_cup'
    else lower(regexp_replace(competition, '[^a-zA-Z0-9]+', '_', 'g'))
  end
$$;

begin;

create table if not exists public.fixture_canonicalization_backup (
  id bigserial primary key,
  migrated_at timestamptz not null default now(),
  backup_kind text not null,
  old_fixture_id text,
  new_fixture_id text,
  prediction_id text,
  prediction_row jsonb,
  fixture_row jsonb
);

create table if not exists public.fixture_canonicalization_map (
  id bigserial primary key,
  migrated_at timestamptz not null default now(),
  old_fixture_id text not null,
  new_fixture_id text,
  old_provider text,
  old_api_fixture_id text,
  new_api_fixture_id text,
  home_team text,
  away_team text,
  kickoff_time_utc timestamptz,
  stage text,
  competition text,
  predictions_moved integer not null default 0
);

create temp table migration_counts (
  prediction_count_before bigint not null
) on commit drop;

insert into migration_counts (prediction_count_before)
select count(*)
from public.predictions;

create temp table fixture_map (
  old_fixture_id public.fixtures.id%type primary key,
  new_fixture_id public.fixtures.id%type,
  old_provider text,
  old_api_fixture_id text,
  new_api_fixture_id text,
  home_team text,
  away_team text,
  kickoff_time_utc timestamptz,
  stage text,
  competition text
) on commit drop;

insert into fixture_map (
  old_fixture_id,
  new_fixture_id,
  old_provider,
  old_api_fixture_id,
  new_api_fixture_id,
  home_team,
  away_team,
  kickoff_time_utc,
  stage,
  competition
)
select
  legacy.id,
  fd.id,
  legacy.api_provider,
  legacy.api_fixture_id,
  fd.api_fixture_id,
  legacy.home_team,
  legacy.away_team,
  coalesce(fd.kickoff_time_utc, fd.kickoff_at),
  legacy.stage,
  legacy.competition
from public.fixtures legacy
left join public.fixtures fd
  on fd.api_provider = 'football-data'
 and pg_temp.fixture_competition_key(fd.competition) = pg_temp.fixture_competition_key(legacy.competition)
 and pg_temp.fixture_stage_key(fd.stage) = pg_temp.fixture_stage_key(legacy.stage)
 and fd.team1_id = legacy.team1_id
 and fd.team2_id = legacy.team2_id
 and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
where legacy.api_provider = 'legacy';

-- Abort if any legacy prediction cannot be mapped to a football-data fixture.
do $$
declare
  unmapped_prediction_count integer;
begin
  select count(*)
    into unmapped_prediction_count
  from public.predictions p
  join fixture_map m
    on m.old_fixture_id = p.fixture_id
  where m.new_fixture_id is null;

  if unmapped_prediction_count > 0 then
    raise exception
      'Cannot canonicalize fixtures: % legacy predictions have no matching football-data fixture',
      unmapped_prediction_count;
  end if;
end $$;

-- Abort if moving predictions would collide with existing football-data predictions.
do $$
declare
  duplicate_prediction_count integer;
begin
  select count(*)
    into duplicate_prediction_count
  from public.predictions legacy_prediction
  join fixture_map m
    on m.old_fixture_id = legacy_prediction.fixture_id
  join public.predictions canonical_prediction
    on canonical_prediction.fixture_id = m.new_fixture_id
   and canonical_prediction.user_id = legacy_prediction.user_id;

  if duplicate_prediction_count > 0 then
    raise exception
      'Cannot canonicalize fixtures: % users have predictions on both legacy and football-data fixture rows',
      duplicate_prediction_count;
  end if;
end $$;

-- Backup full predictions table before touching fixture references.
insert into public.fixture_canonicalization_backup (
  backup_kind,
  prediction_id,
  prediction_row
)
select
  'predictions_table_before_football_data_canonicalization',
  p.id::text,
  to_jsonb(p)
from public.predictions p;

-- Backup all legacy fixture rows before deletion.
insert into public.fixture_canonicalization_backup (
  backup_kind,
  old_fixture_id,
  new_fixture_id,
  fixture_row
)
select
  'legacy_fixture_before_delete',
  f.id::text,
  m.new_fixture_id::text,
  to_jsonb(f)
from public.fixtures f
join fixture_map m
  on m.old_fixture_id = f.id;

-- Persist the mapping report.
insert into public.fixture_canonicalization_map (
  old_fixture_id,
  new_fixture_id,
  old_provider,
  old_api_fixture_id,
  new_api_fixture_id,
  home_team,
  away_team,
  kickoff_time_utc,
  stage,
  competition,
  predictions_moved
)
select
  m.old_fixture_id::text,
  m.new_fixture_id::text,
  m.old_provider,
  m.old_api_fixture_id,
  m.new_api_fixture_id,
  m.home_team,
  m.away_team,
  m.kickoff_time_utc,
  m.stage,
  m.competition,
  count(p.id)::integer
from fixture_map m
left join public.predictions p
  on p.fixture_id = m.old_fixture_id
group by
  m.old_fixture_id,
  m.new_fixture_id,
  m.old_provider,
  m.old_api_fixture_id,
  m.new_api_fixture_id,
  m.home_team,
  m.away_team,
  m.kickoff_time_utc,
  m.stage,
  m.competition;

-- Data repair only: avoid blocked updates on already locked fixtures.
alter table public.predictions disable trigger predictions_validate_write;

-- Move remaining legacy predictions to football-data fixtures.
update public.predictions p
set
  fixture_id = m.new_fixture_id,
  updated_at = now()
from fixture_map m
where p.fixture_id = m.old_fixture_id;

alter table public.predictions enable trigger predictions_validate_write;

-- Delete every legacy fixture. At this point predictions either moved or were absent.
delete from public.fixtures
where api_provider = 'legacy';

-- Abort if prediction count changed.
do $$
declare
  before_count bigint;
  after_count bigint;
begin
  select prediction_count_before into before_count from migration_counts limit 1;
  select count(*) into after_count from public.predictions;

  if before_count <> after_count then
    raise exception
      'Prediction count changed during canonicalization: before %, after %',
      before_count,
      after_count;
  end if;
end $$;

-- Abort if any legacy fixtures remain.
do $$
declare
  legacy_fixture_count integer;
begin
  select count(*) into legacy_fixture_count
  from public.fixtures
  where api_provider = 'legacy';

  if legacy_fixture_count > 0 then
    raise exception 'Legacy fixtures remain after canonicalization: %', legacy_fixture_count;
  end if;
end $$;

commit;

-- ============================================================================
-- AFTER VERIFICATION
-- ============================================================================

-- 1. Prediction count after migration.
select count(*) as prediction_count_after
from public.predictions;

-- 2. Fixture counts by provider after migration. "legacy" should be absent.
select
  coalesce(api_provider, '<null>') as api_provider,
  count(*) as fixture_count
from public.fixtures
group by 1
order by 1;

-- 3. Mapping report generated by the migration.
select *
from public.fixture_canonicalization_map
order by migrated_at desc, kickoff_time_utc, home_team, away_team;

-- 4. Must be zero: predictions still pointing to non-football-data fixtures.
select count(*) as predictions_on_non_football_data_fixtures
from public.predictions p
join public.fixtures f
  on f.id = p.fixture_id
where f.api_provider <> 'football-data';

-- 5. Duplicate match groups after migration. This should return zero rows for assigned teams.
with duplicate_groups as (
  select
    coalesce(competition, 'FIFA World Cup 2026') as competition,
    coalesce(stage, '') as stage,
    team1_id,
    team2_id,
    coalesce(kickoff_time_utc, kickoff_at) as kickoff_time_utc,
    count(*) as fixture_count,
    array_agg(id order by api_provider, id) as fixture_ids,
    array_agg(api_provider order by api_provider, id) as providers
  from public.fixtures
  where team1_id is not null
    and team2_id is not null
    and coalesce(kickoff_time_utc, kickoff_at) is not null
  group by 1, 2, 3, 4, 5
  having count(*) > 1
)
select *
from duplicate_groups
order by kickoff_time_utc, stage;

-- 6. Sanity: Australia vs Turkey should have only one football-data fixture row.
select
  f.id,
  f.api_provider,
  f.api_fixture_id,
  f.external_fixture_id,
  f.home_team,
  f.away_team,
  f.home_score,
  f.away_score,
  f.goals_team1,
  f.goals_team2,
  f.is_finished,
  count(p.id) as prediction_count
from public.fixtures f
left join public.predictions p
  on p.fixture_id = f.id
where (f.home_team = 'Australia' and f.away_team = 'Turkey')
   or (f.home_team = 'Turkey' and f.away_team = 'Australia')
group by f.id
order by f.api_provider, f.id;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
--
-- Preferred rollback:
-- Restore the Supabase database backup taken immediately before this migration.
--
-- Emergency manual rollback:
-- Use public.fixture_canonicalization_backup rows with:
-- - backup_kind = 'predictions_table_before_football_data_canonicalization'
-- - backup_kind = 'legacy_fixture_before_delete'
--
-- Manual rollback is intentionally not automated because users may make new predictions
-- after this migration. Restore from a database backup if anything looks wrong.

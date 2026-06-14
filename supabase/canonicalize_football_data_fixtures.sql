-- One-time migration: make football-data fixture rows canonical.
--
-- Goal:
-- - Keep football-data fixture rows.
-- - Move predictions from duplicate legacy/sheet fixture rows to football-data rows.
-- - Preserve prediction data in an audit backup table before changing references.
-- - Remove legacy/sheet duplicate fixture rows only after prediction references are moved.
--
-- Duplicate identity:
-- - Same competition
-- - Same stage
-- - Same team1_id/team2_id
-- - Same canonical kickoff instant: coalesce(kickoff_time_utc, kickoff_at)
--
-- Important:
-- - Review the DRY RUN queries first.
-- - Run the MIGRATION section only after the duplicate map looks correct.
-- - The prediction write validation trigger is disabled only inside this transaction because
--   this is a historical data repair for already locked/finished fixtures.

-- ============================================================================
-- DRY RUN / BEFORE VERIFICATION
-- ============================================================================

-- Total prediction count before migration.
select count(*) as prediction_count_before
from public.predictions;

-- Duplicate fixture groups before migration.
with duplicate_groups as (
  select
    coalesce(competition, 'FIFA World Cup 2026') as competition,
    coalesce(stage, '') as stage,
    team1_id,
    team2_id,
    coalesce(kickoff_time_utc, kickoff_at) as kickoff_time_utc,
    count(*) as fixture_count,
    count(*) filter (where api_provider = 'football-data') as football_data_count,
    count(*) filter (where coalesce(api_provider, '') <> 'football-data') as legacy_count,
    array_agg(id order by api_provider, id) as fixture_ids
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

-- Exact legacy -> football-data mapping that the migration will use.
with duplicate_fixture_map as (
  select
    legacy.id as legacy_fixture_id,
    fd.id as football_data_fixture_id,
    legacy.api_provider as legacy_provider,
    legacy.api_fixture_id as legacy_api_fixture_id,
    fd.api_fixture_id as football_data_api_fixture_id,
    legacy.home_team,
    legacy.away_team,
    coalesce(fd.kickoff_time_utc, fd.kickoff_at) as kickoff_time_utc,
    legacy.stage,
    legacy.competition,
    count(p.id) as predictions_to_move
  from public.fixtures legacy
  join public.fixtures fd
    on fd.api_provider = 'football-data'
   and coalesce(fd.competition, 'FIFA World Cup 2026') = coalesce(legacy.competition, 'FIFA World Cup 2026')
   and coalesce(fd.stage, '') = coalesce(legacy.stage, '')
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  left join public.predictions p
    on p.fixture_id = legacy.id
  where coalesce(legacy.api_provider, '') <> 'football-data'
    and legacy.team1_id is not null
    and legacy.team2_id is not null
    and coalesce(legacy.kickoff_time_utc, legacy.kickoff_at) is not null
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
from duplicate_fixture_map
order by kickoff_time_utc, home_team, away_team;

-- Conflict check: same user has a prediction on both legacy and football-data rows.
-- These are preserved in the backup table; the migration keeps the newest updated prediction.
with duplicate_fixture_map as (
  select legacy.id as legacy_fixture_id, fd.id as football_data_fixture_id
  from public.fixtures legacy
  join public.fixtures fd
    on fd.api_provider = 'football-data'
   and coalesce(fd.competition, 'FIFA World Cup 2026') = coalesce(legacy.competition, 'FIFA World Cup 2026')
   and coalesce(fd.stage, '') = coalesce(legacy.stage, '')
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  where coalesce(legacy.api_provider, '') <> 'football-data'
)
select
  legacy_prediction.user_id,
  legacy_prediction.fixture_id as legacy_fixture_id,
  football_data_prediction.fixture_id as football_data_fixture_id,
  legacy_prediction.id as legacy_prediction_id,
  football_data_prediction.id as football_data_prediction_id,
  legacy_prediction.updated_at as legacy_updated_at,
  football_data_prediction.updated_at as football_data_updated_at
from duplicate_fixture_map m
join public.predictions legacy_prediction
  on legacy_prediction.fixture_id = m.legacy_fixture_id
join public.predictions football_data_prediction
  on football_data_prediction.fixture_id = m.football_data_fixture_id
 and football_data_prediction.user_id = legacy_prediction.user_id
order by legacy_prediction.user_id;

-- ============================================================================
-- MIGRATION
-- ============================================================================

begin;

create table if not exists public.fixture_canonicalization_backup (
  id bigserial primary key,
  migrated_at timestamptz not null default now(),
  backup_kind text not null,
  old_fixture_id text not null,
  new_fixture_id text,
  prediction_id text,
  prediction_row jsonb,
  fixture_row jsonb
);

create temp table duplicate_fixture_map (
  legacy_fixture_id public.fixtures.id%type primary key,
  football_data_fixture_id public.fixtures.id%type not null
) on commit drop;

insert into duplicate_fixture_map (legacy_fixture_id, football_data_fixture_id)
select legacy.id, fd.id
from public.fixtures legacy
join public.fixtures fd
  on fd.api_provider = 'football-data'
 and coalesce(fd.competition, 'FIFA World Cup 2026') = coalesce(legacy.competition, 'FIFA World Cup 2026')
 and coalesce(fd.stage, '') = coalesce(legacy.stage, '')
 and fd.team1_id = legacy.team1_id
 and fd.team2_id = legacy.team2_id
 and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
where coalesce(legacy.api_provider, '') <> 'football-data'
  and legacy.team1_id is not null
  and legacy.team2_id is not null
  and coalesce(legacy.kickoff_time_utc, legacy.kickoff_at) is not null;

-- Backup every prediction that will be touched or removed.
insert into public.fixture_canonicalization_backup (
  backup_kind,
  old_fixture_id,
  new_fixture_id,
  prediction_id,
  prediction_row
)
select
  'legacy_prediction_before_move',
  m.legacy_fixture_id::text,
  m.football_data_fixture_id::text,
  p.id::text,
  to_jsonb(p)
from duplicate_fixture_map m
join public.predictions p
  on p.fixture_id = m.legacy_fixture_id;

-- Backup the legacy fixture rows before deletion.
insert into public.fixture_canonicalization_backup (
  backup_kind,
  old_fixture_id,
  new_fixture_id,
  fixture_row
)
select
  'legacy_fixture_before_delete',
  f.id::text,
  m.football_data_fixture_id::text,
  to_jsonb(f)
from duplicate_fixture_map m
join public.fixtures f
  on f.id = m.legacy_fixture_id;

-- Data repair only: avoid blocked updates on already locked fixtures.
alter table public.predictions disable trigger predictions_validate_write;

-- If a user has predictions on both duplicate rows, keep the newest updated prediction
-- values on the canonical football-data row.
update public.predictions canonical_prediction
set
  picked_team_id = legacy_prediction.picked_team_id,
  pick_is_draw = legacy_prediction.pick_is_draw,
  pred_goals_team1 = legacy_prediction.pred_goals_team1,
  pred_goals_team2 = legacy_prediction.pred_goals_team2,
  penalty_call = legacy_prediction.penalty_call,
  joker_used = legacy_prediction.joker_used,
  updated_at = greatest(canonical_prediction.updated_at, legacy_prediction.updated_at)
from duplicate_fixture_map m
join public.predictions legacy_prediction
  on legacy_prediction.fixture_id = m.legacy_fixture_id
where canonical_prediction.fixture_id = m.football_data_fixture_id
  and canonical_prediction.user_id = legacy_prediction.user_id
  and legacy_prediction.updated_at >= canonical_prediction.updated_at;

-- Remove losing duplicate legacy predictions where a canonical prediction already exists.
-- They are already preserved in fixture_canonicalization_backup.
delete from public.predictions legacy_prediction
using duplicate_fixture_map m
where legacy_prediction.fixture_id = m.legacy_fixture_id
  and exists (
    select 1
    from public.predictions canonical_prediction
    where canonical_prediction.fixture_id = m.football_data_fixture_id
      and canonical_prediction.user_id = legacy_prediction.user_id
  );

-- Move all remaining legacy predictions to their canonical football-data fixture row.
update public.predictions p
set
  fixture_id = m.football_data_fixture_id,
  updated_at = now()
from duplicate_fixture_map m
where p.fixture_id = m.legacy_fixture_id;

alter table public.predictions enable trigger predictions_validate_write;

-- Delete legacy duplicate fixture rows after predictions no longer reference them.
delete from public.fixtures legacy
using duplicate_fixture_map m
where legacy.id = m.legacy_fixture_id
  and not exists (
    select 1
    from public.predictions p
    where p.fixture_id = legacy.id
  );

commit;

-- ============================================================================
-- AFTER VERIFICATION
-- ============================================================================

-- Total prediction count after migration. This should match the before count unless
-- conflict rows existed. If conflicts existed, all removed conflict rows are preserved
-- in public.fixture_canonicalization_backup.
select count(*) as prediction_count_after
from public.predictions;

-- Any predictions still attached to legacy duplicates should be zero.
with duplicate_fixture_map as (
  select legacy.id as legacy_fixture_id, fd.id as football_data_fixture_id
  from public.fixtures legacy
  join public.fixtures fd
    on fd.api_provider = 'football-data'
   and coalesce(fd.competition, 'FIFA World Cup 2026') = coalesce(legacy.competition, 'FIFA World Cup 2026')
   and coalesce(fd.stage, '') = coalesce(legacy.stage, '')
   and fd.team1_id = legacy.team1_id
   and fd.team2_id = legacy.team2_id
   and coalesce(fd.kickoff_time_utc, fd.kickoff_at) = coalesce(legacy.kickoff_time_utc, legacy.kickoff_at)
  where coalesce(legacy.api_provider, '') <> 'football-data'
)
select count(*) as predictions_still_on_legacy_duplicates
from duplicate_fixture_map m
join public.predictions p
  on p.fixture_id = m.legacy_fixture_id;

-- Duplicate fixture groups after migration. This should return zero rows for legacy
-- vs football-data duplicate groups with assigned teams.
with duplicate_groups as (
  select
    coalesce(competition, 'FIFA World Cup 2026') as competition,
    coalesce(stage, '') as stage,
    team1_id,
    team2_id,
    coalesce(kickoff_time_utc, kickoff_at) as kickoff_time_utc,
    count(*) as fixture_count,
    count(*) filter (where api_provider = 'football-data') as football_data_count,
    count(*) filter (where coalesce(api_provider, '') <> 'football-data') as legacy_count,
    array_agg(id order by api_provider, id) as fixture_ids
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

-- Sanity: Australia vs Turkey should now have predictions only on the football-data row.
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
-- ROLLBACK PLAN
-- ============================================================================
--
-- Preferred rollback: restore the database/project from the Supabase backup taken
-- immediately before running this migration.
--
-- Manual rollback is possible only for rows captured in fixture_canonicalization_backup,
-- but it is intentionally not automated here because re-splitting predictions back from
-- canonical fixtures can conflict with new user changes made after the migration.
--
-- If you must manually roll back immediately, before users make new predictions:
--
-- 1. Reinsert backed-up legacy fixture rows from backup_kind = 'legacy_fixture_before_delete'.
-- 2. Repoint backed-up legacy prediction rows to their old_fixture_id, resolving any
--    user_id/fixture_id conflicts manually.
-- 3. Re-run the AFTER VERIFICATION queries.
--
-- Keep public.fixture_canonicalization_backup until the app has been verified in production.

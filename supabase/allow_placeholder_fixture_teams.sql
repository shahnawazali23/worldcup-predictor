-- Allow future knockout/bracket fixtures before participants are known.
--
-- football-data.org can publish knockout fixtures with kickoff/stage/fixture IDs
-- before homeTeam/awayTeam are assigned. The app should store those bracket rows
-- and fill team1_id/team2_id later when the provider assigns actual teams.
--
-- This preserves existing fixture IDs, predictions, scoring data, and team rows.

begin;

alter table public.fixtures
  alter column team1_id drop not null,
  alter column team2_id drop not null;

comment on column public.fixtures.team1_id is
  'Nullable so placeholder knockout/bracket fixtures can be imported before the participant is known.';

comment on column public.fixtures.team2_id is
  'Nullable so placeholder knockout/bracket fixtures can be imported before the participant is known.';

commit;

-- One-time migration: replace spreadsheet placeholder kickoff times with published
-- World Cup 2026 group-stage kickoff times.
--
-- This updates existing fixture rows in place by api_fixture_id, preserving fixture IDs,
-- predictions.fixture_id references, picks, results, and scoring data.
--
-- Source used for kickoff times:
-- - Published FIFA World Cup 2026 group-stage schedule as listed by FIFA-referenced
--   schedule pages and broadcaster schedules.
-- - UTC values below are converted from Eastern Time schedule listings and venue-local
--   kickoff listings for the first completed matches.
--
-- Time model:
-- - kickoff_time_utc is canonical and stored as UTC.
-- - kickoff_at is kept as a compatibility mirror and is set to the same UTC instant.
-- - UI converts kickoff_time_utc to the user's local timezone.
-- - Prediction locks use kickoff_time_utc.

begin;

alter table public.fixtures add column if not exists kickoff_time_utc timestamptz;
alter table public.fixtures add column if not exists venue_timezone text;
alter table public.fixtures add column if not exists external_fixture_id text;
alter table public.fixtures add column if not exists competition text not null default 'FIFA World Cup 2026';
alter table public.fixtures add column if not exists home_team text;
alter table public.fixtures add column if not exists away_team text;
alter table public.fixtures add column if not exists home_team_code text;
alter table public.fixtures add column if not exists away_team_code text;
alter table public.fixtures add column if not exists home_score integer;
alter table public.fixtures add column if not exists away_score integer;
alter table public.fixtures add column if not exists status text not null default 'scheduled';
alter table public.fixtures add column if not exists last_synced_at timestamptz;

with official_times(api_fixture_id, kickoff_time_utc, venue, venue_timezone) as (
  values
    ('sheet-001', '2026-06-11 19:00:00+00'::timestamptz, 'Estadio Azteca, Mexico City', 'America/Mexico_City'),
    ('sheet-002', '2026-06-12 02:00:00+00'::timestamptz, 'Estadio Akron, Zapopan', 'America/Mexico_City'),
    ('sheet-003', '2026-06-12 19:00:00+00'::timestamptz, 'BMO Field, Toronto', 'America/Toronto'),
    ('sheet-004', '2026-06-13 01:00:00+00'::timestamptz, 'SoFi Stadium, Inglewood', 'America/Los_Angeles'),
    ('sheet-005', '2026-06-13 19:00:00+00'::timestamptz, 'Levi''s Stadium, Santa Clara', 'America/Los_Angeles'),
    ('sheet-006', '2026-06-13 22:00:00+00'::timestamptz, 'Gillette Stadium, Foxborough', 'America/New_York'),
    ('sheet-007', '2026-06-14 01:00:00+00'::timestamptz, 'MetLife Stadium, East Rutherford', 'America/New_York'),
    ('sheet-008', '2026-06-14 04:00:00+00'::timestamptz, 'BC Place, Vancouver', 'America/Vancouver'),
    ('sheet-009', '2026-06-14 17:00:00+00'::timestamptz, 'NRG Stadium, Houston', 'America/Chicago'),
    ('sheet-010', '2026-06-14 20:00:00+00'::timestamptz, 'AT&T Stadium, Arlington', 'America/Chicago'),
    ('sheet-011', '2026-06-14 23:00:00+00'::timestamptz, 'Lincoln Financial Field, Philadelphia', 'America/New_York'),
    ('sheet-012', '2026-06-15 02:00:00+00'::timestamptz, 'Estadio BBVA, Guadalupe', 'America/Monterrey'),
    ('sheet-013', '2026-06-15 16:00:00+00'::timestamptz, 'Mercedes-Benz Stadium, Atlanta', 'America/New_York'),
    ('sheet-014', '2026-06-15 19:00:00+00'::timestamptz, 'Lumen Field, Seattle', 'America/Los_Angeles'),
    ('sheet-015', '2026-06-15 22:00:00+00'::timestamptz, 'Hard Rock Stadium, Miami Gardens', 'America/New_York'),
    ('sheet-016', '2026-06-16 01:00:00+00'::timestamptz, 'SoFi Stadium, Inglewood', 'America/Los_Angeles'),
    ('sheet-017', '2026-06-16 19:00:00+00'::timestamptz, 'MetLife Stadium, East Rutherford', 'America/New_York'),
    ('sheet-018', '2026-06-16 22:00:00+00'::timestamptz, 'Gillette Stadium, Foxborough', 'America/New_York'),
    ('sheet-019', '2026-06-17 01:00:00+00'::timestamptz, 'Arrowhead Stadium, Kansas City', 'America/Chicago'),
    ('sheet-020', '2026-06-17 04:00:00+00'::timestamptz, 'Levi''s Stadium, Santa Clara', 'America/Los_Angeles'),
    ('sheet-021', '2026-06-17 17:00:00+00'::timestamptz, 'NRG Stadium, Houston', 'America/Chicago'),
    ('sheet-022', '2026-06-17 20:00:00+00'::timestamptz, 'AT&T Stadium, Arlington', 'America/Chicago'),
    ('sheet-023', '2026-06-17 23:00:00+00'::timestamptz, 'BMO Field, Toronto', 'America/Toronto'),
    ('sheet-024', '2026-06-18 02:00:00+00'::timestamptz, 'Estadio Azteca, Mexico City', 'America/Mexico_City'),
    ('sheet-025', '2026-06-18 16:00:00+00'::timestamptz, 'Mercedes-Benz Stadium, Atlanta', 'America/New_York'),
    ('sheet-026', '2026-06-18 19:00:00+00'::timestamptz, 'SoFi Stadium, Inglewood', 'America/Los_Angeles'),
    ('sheet-027', '2026-06-18 22:00:00+00'::timestamptz, 'BC Place, Vancouver', 'America/Vancouver'),
    ('sheet-028', '2026-06-19 01:00:00+00'::timestamptz, 'Estadio Akron, Zapopan', 'America/Mexico_City'),
    ('sheet-029', '2026-06-19 19:00:00+00'::timestamptz, 'Lumen Field, Seattle', 'America/Los_Angeles'),
    ('sheet-030', '2026-06-19 22:00:00+00'::timestamptz, 'Lincoln Financial Field, Philadelphia', 'America/New_York'),
    ('sheet-031', '2026-06-20 00:30:00+00'::timestamptz, 'Gillette Stadium, Foxborough', 'America/New_York'),
    ('sheet-032', '2026-06-20 03:00:00+00'::timestamptz, 'Levi''s Stadium, Santa Clara', 'America/Los_Angeles'),
    ('sheet-033', '2026-06-20 17:00:00+00'::timestamptz, 'NRG Stadium, Houston', 'America/Chicago'),
    ('sheet-034', '2026-06-20 20:00:00+00'::timestamptz, 'BMO Field, Toronto', 'America/Toronto'),
    ('sheet-035', '2026-06-21 00:00:00+00'::timestamptz, 'Arrowhead Stadium, Kansas City', 'America/Chicago'),
    ('sheet-036', '2026-06-21 04:00:00+00'::timestamptz, 'Estadio BBVA, Guadalupe', 'America/Monterrey'),
    ('sheet-037', '2026-06-21 16:00:00+00'::timestamptz, 'Mercedes-Benz Stadium, Atlanta', 'America/New_York'),
    ('sheet-038', '2026-06-21 19:00:00+00'::timestamptz, 'SoFi Stadium, Inglewood', 'America/Los_Angeles'),
    ('sheet-039', '2026-06-21 22:00:00+00'::timestamptz, 'Hard Rock Stadium, Miami Gardens', 'America/New_York'),
    ('sheet-040', '2026-06-22 01:00:00+00'::timestamptz, 'BC Place, Vancouver', 'America/Vancouver'),
    ('sheet-041', '2026-06-22 17:00:00+00'::timestamptz, 'AT&T Stadium, Arlington', 'America/Chicago'),
    ('sheet-042', '2026-06-22 21:00:00+00'::timestamptz, 'Lincoln Financial Field, Philadelphia', 'America/New_York'),
    ('sheet-043', '2026-06-23 00:00:00+00'::timestamptz, 'MetLife Stadium, East Rutherford', 'America/New_York'),
    ('sheet-044', '2026-06-23 03:00:00+00'::timestamptz, 'Levi''s Stadium, Santa Clara', 'America/Los_Angeles'),
    ('sheet-045', '2026-06-23 17:00:00+00'::timestamptz, 'NRG Stadium, Houston', 'America/Chicago'),
    ('sheet-046', '2026-06-23 20:00:00+00'::timestamptz, 'Gillette Stadium, Foxborough', 'America/New_York'),
    ('sheet-047', '2026-06-23 23:00:00+00'::timestamptz, 'BMO Field, Toronto', 'America/Toronto'),
    ('sheet-048', '2026-06-24 02:00:00+00'::timestamptz, 'Estadio Akron, Zapopan', 'America/Mexico_City'),
    ('sheet-049', '2026-06-24 19:00:00+00'::timestamptz, 'BC Place, Vancouver', 'America/Vancouver'),
    ('sheet-050', '2026-06-24 19:00:00+00'::timestamptz, 'Lumen Field, Seattle', 'America/Los_Angeles'),
    ('sheet-051', '2026-06-24 22:00:00+00'::timestamptz, 'Hard Rock Stadium, Miami Gardens', 'America/New_York'),
    ('sheet-052', '2026-06-24 22:00:00+00'::timestamptz, 'Mercedes-Benz Stadium, Atlanta', 'America/New_York'),
    ('sheet-053', '2026-06-25 01:00:00+00'::timestamptz, 'Estadio Azteca, Mexico City', 'America/Mexico_City'),
    ('sheet-054', '2026-06-25 01:00:00+00'::timestamptz, 'Estadio BBVA, Guadalupe', 'America/Monterrey'),
    ('sheet-055', '2026-06-25 20:00:00+00'::timestamptz, 'MetLife Stadium, East Rutherford', 'America/New_York'),
    ('sheet-056', '2026-06-25 20:00:00+00'::timestamptz, 'Lincoln Financial Field, Philadelphia', 'America/New_York'),
    ('sheet-057', '2026-06-25 23:00:00+00'::timestamptz, 'Arrowhead Stadium, Kansas City', 'America/Chicago'),
    ('sheet-058', '2026-06-25 23:00:00+00'::timestamptz, 'AT&T Stadium, Arlington', 'America/Chicago'),
    ('sheet-059', '2026-06-26 02:00:00+00'::timestamptz, 'SoFi Stadium, Inglewood', 'America/Los_Angeles'),
    ('sheet-060', '2026-06-26 02:00:00+00'::timestamptz, 'Levi''s Stadium, Santa Clara', 'America/Los_Angeles'),
    ('sheet-061', '2026-06-26 19:00:00+00'::timestamptz, 'Gillette Stadium, Foxborough', 'America/New_York'),
    ('sheet-062', '2026-06-26 19:00:00+00'::timestamptz, 'BMO Field, Toronto', 'America/Toronto'),
    ('sheet-063', '2026-06-27 00:00:00+00'::timestamptz, 'Estadio Akron, Zapopan', 'America/Mexico_City'),
    ('sheet-064', '2026-06-27 00:00:00+00'::timestamptz, 'NRG Stadium, Houston', 'America/Chicago'),
    ('sheet-065', '2026-06-27 03:00:00+00'::timestamptz, 'BC Place, Vancouver', 'America/Vancouver'),
    ('sheet-066', '2026-06-27 03:00:00+00'::timestamptz, 'Lumen Field, Seattle', 'America/Los_Angeles'),
    ('sheet-067', '2026-06-27 21:00:00+00'::timestamptz, 'MetLife Stadium, East Rutherford', 'America/New_York'),
    ('sheet-068', '2026-06-27 21:00:00+00'::timestamptz, 'Lincoln Financial Field, Philadelphia', 'America/New_York'),
    ('sheet-069', '2026-06-27 23:30:00+00'::timestamptz, 'Hard Rock Stadium, Miami Gardens', 'America/New_York'),
    ('sheet-070', '2026-06-27 23:30:00+00'::timestamptz, 'Mercedes-Benz Stadium, Atlanta', 'America/New_York'),
    ('sheet-071', '2026-06-28 02:00:00+00'::timestamptz, 'AT&T Stadium, Arlington', 'America/Chicago'),
    ('sheet-072', '2026-06-28 02:00:00+00'::timestamptz, 'Arrowhead Stadium, Kansas City', 'America/Chicago')
),
updated as (
  update public.fixtures f
  set
    kickoff_time_utc = o.kickoff_time_utc,
    kickoff_at = o.kickoff_time_utc,
    competition = coalesce(nullif(f.competition, ''), 'FIFA World Cup 2026'),
    home_team = coalesce(f.home_team, (select name from public.teams where id = f.team1_id limit 1)),
    away_team = coalesce(f.away_team, (select name from public.teams where id = f.team2_id limit 1)),
    home_team_code = coalesce(f.home_team_code, (select short_name from public.teams where id = f.team1_id limit 1)),
    away_team_code = coalesce(f.away_team_code, (select short_name from public.teams where id = f.team2_id limit 1)),
    home_score = coalesce(f.home_score, f.goals_team1),
    away_score = coalesce(f.away_score, f.goals_team2),
    status = case
      when f.status is not null and f.status <> '' then f.status
      when f.is_finished then 'finished'
      else 'scheduled'
    end,
    venue = coalesce(nullif(o.venue, ''), f.venue),
    venue_timezone = o.venue_timezone,
    external_fixture_id = coalesce(f.external_fixture_id, f.api_fixture_id),
    last_synced_at = coalesce(f.last_synced_at, now()),
    updated_at = now()
  from official_times o
  where f.api_fixture_id = o.api_fixture_id
    and coalesce(f.api_provider, 'legacy') in ('legacy', 'sheet')
  returning f.id
)
select count(*) as fixtures_updated from updated;

commit;

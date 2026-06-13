-- One-time legacy import generated from /Users/ali/Downloads/Fifa World Cup.xlsx.
-- Historical fallback only. Do not use this file as the fixture schedule source of truth.
-- Kickoff times are placeholder UTC slots because the sheet only has dates.
-- Current fixture data should come from the server-side API sync into Supabase.
begin;

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Algeria', 'ALG', '🇩🇿', 28, 'legacy', 'algeria'
where not exists (select 1 from public.teams where name = 'Algeria');
update public.teams set short_name = 'ALG', flag = coalesce(nullif(flag, ''), '🇩🇿'), fifa_rank = 28 where name = 'Algeria';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Argentina', 'ARG', '🇦🇷', 1, 'legacy', 'argentina'
where not exists (select 1 from public.teams where name = 'Argentina');
update public.teams set short_name = 'ARG', flag = coalesce(nullif(flag, ''), '🇦🇷'), fifa_rank = 1 where name = 'Argentina';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Australia', 'AUS', '🇦🇺', 27, 'legacy', 'australia'
where not exists (select 1 from public.teams where name = 'Australia');
update public.teams set short_name = 'AUS', flag = coalesce(nullif(flag, ''), '🇦🇺'), fifa_rank = 27 where name = 'Australia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Austria', 'AUS', '🇦🇹', 23, 'legacy', 'austria'
where not exists (select 1 from public.teams where name = 'Austria');
update public.teams set short_name = 'AUS', flag = coalesce(nullif(flag, ''), '🇦🇹'), fifa_rank = 23 where name = 'Austria';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Belgium', 'BEL', '🇧🇪', 9, 'legacy', 'belgium'
where not exists (select 1 from public.teams where name = 'Belgium');
update public.teams set short_name = 'BEL', flag = coalesce(nullif(flag, ''), '🇧🇪'), fifa_rank = 9 where name = 'Belgium';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Bosnia and Herzegovina', 'BAH', '🇧🇦', 64, 'legacy', 'bosnia-and-herzegovina'
where not exists (select 1 from public.teams where name = 'Bosnia and Herzegovina');
update public.teams set short_name = 'BAH', flag = coalesce(nullif(flag, ''), '🇧🇦'), fifa_rank = 64 where name = 'Bosnia and Herzegovina';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Brazil', 'BRA', '🇧🇷', 6, 'legacy', 'brazil'
where not exists (select 1 from public.teams where name = 'Brazil');
update public.teams set short_name = 'BRA', flag = coalesce(nullif(flag, ''), '🇧🇷'), fifa_rank = 6 where name = 'Brazil';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Canada', 'CAN', '🇨🇦', 30, 'legacy', 'canada'
where not exists (select 1 from public.teams where name = 'Canada');
update public.teams set short_name = 'CAN', flag = coalesce(nullif(flag, ''), '🇨🇦'), fifa_rank = 30 where name = 'Canada';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Cape Verde', 'CV', '🇨🇻', 67, 'legacy', 'cape-verde'
where not exists (select 1 from public.teams where name = 'Cape Verde');
update public.teams set short_name = 'CV', flag = coalesce(nullif(flag, ''), '🇨🇻'), fifa_rank = 67 where name = 'Cape Verde';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Colombia', 'COL', '🇨🇴', 13, 'legacy', 'colombia'
where not exists (select 1 from public.teams where name = 'Colombia');
update public.teams set short_name = 'COL', flag = coalesce(nullif(flag, ''), '🇨🇴'), fifa_rank = 13 where name = 'Colombia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Congo DR', 'CD', '🇨🇩', 45, 'legacy', 'congo-dr'
where not exists (select 1 from public.teams where name = 'Congo DR');
update public.teams set short_name = 'CD', flag = coalesce(nullif(flag, ''), '🇨🇩'), fifa_rank = 45 where name = 'Congo DR';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Croatia', 'CRO', '🇭🇷', 11, 'legacy', 'croatia'
where not exists (select 1 from public.teams where name = 'Croatia');
update public.teams set short_name = 'CRO', flag = coalesce(nullif(flag, ''), '🇭🇷'), fifa_rank = 11 where name = 'Croatia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Curacao', 'CUR', '🇨🇼', 82, 'legacy', 'curacao'
where not exists (select 1 from public.teams where name = 'Curacao');
update public.teams set short_name = 'CUR', flag = coalesce(nullif(flag, ''), '🇨🇼'), fifa_rank = 82 where name = 'Curacao';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Czechia', 'CZE', '🇨🇿', 39, 'legacy', 'czechia'
where not exists (select 1 from public.teams where name = 'Czechia');
update public.teams set short_name = 'CZE', flag = coalesce(nullif(flag, ''), '🇨🇿'), fifa_rank = 39 where name = 'Czechia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Ecuador', 'ECU', '🇪🇨', 24, 'legacy', 'ecuador'
where not exists (select 1 from public.teams where name = 'Ecuador');
update public.teams set short_name = 'ECU', flag = coalesce(nullif(flag, ''), '🇪🇨'), fifa_rank = 24 where name = 'Ecuador';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Egypt', 'EGY', '🇪🇬', 29, 'legacy', 'egypt'
where not exists (select 1 from public.teams where name = 'Egypt');
update public.teams set short_name = 'EGY', flag = coalesce(nullif(flag, ''), '🇪🇬'), fifa_rank = 29 where name = 'Egypt';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 4, 'legacy', 'england'
where not exists (select 1 from public.teams where name = 'England');
update public.teams set short_name = 'ENG', flag = coalesce(nullif(flag, ''), '🏴󠁧󠁢󠁥󠁮󠁧󠁿'), fifa_rank = 4 where name = 'England';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'France', 'FRA', '🇫🇷', 3, 'legacy', 'france'
where not exists (select 1 from public.teams where name = 'France');
update public.teams set short_name = 'FRA', flag = coalesce(nullif(flag, ''), '🇫🇷'), fifa_rank = 3 where name = 'France';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Germany', 'GER', '🇩🇪', 10, 'legacy', 'germany'
where not exists (select 1 from public.teams where name = 'Germany');
update public.teams set short_name = 'GER', flag = coalesce(nullif(flag, ''), '🇩🇪'), fifa_rank = 10 where name = 'Germany';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Ghana', 'GHA', '🇬🇭', 73, 'legacy', 'ghana'
where not exists (select 1 from public.teams where name = 'Ghana');
update public.teams set short_name = 'GHA', flag = coalesce(nullif(flag, ''), '🇬🇭'), fifa_rank = 73 where name = 'Ghana';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Haiti', 'HAI', '🇭🇹', 83, 'legacy', 'haiti'
where not exists (select 1 from public.teams where name = 'Haiti');
update public.teams set short_name = 'HAI', flag = coalesce(nullif(flag, ''), '🇭🇹'), fifa_rank = 83 where name = 'Haiti';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Iran', 'IRA', '🇮🇷', 21, 'legacy', 'iran'
where not exists (select 1 from public.teams where name = 'Iran');
update public.teams set short_name = 'IRA', flag = coalesce(nullif(flag, ''), '🇮🇷'), fifa_rank = 21 where name = 'Iran';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Iraq', 'IRA', '🇮🇶', 56, 'legacy', 'iraq'
where not exists (select 1 from public.teams where name = 'Iraq');
update public.teams set short_name = 'IRA', flag = coalesce(nullif(flag, ''), '🇮🇶'), fifa_rank = 56 where name = 'Iraq';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Ivory Coast', 'IC', '🇨🇮', 33, 'legacy', 'ivory-coast'
where not exists (select 1 from public.teams where name = 'Ivory Coast');
update public.teams set short_name = 'IC', flag = coalesce(nullif(flag, ''), '🇨🇮'), fifa_rank = 33 where name = 'Ivory Coast';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Japan', 'JAP', '🇯🇵', 18, 'legacy', 'japan'
where not exists (select 1 from public.teams where name = 'Japan');
update public.teams set short_name = 'JAP', flag = coalesce(nullif(flag, ''), '🇯🇵'), fifa_rank = 18 where name = 'Japan';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Jordan', 'JOR', '🇯🇴', 63, 'legacy', 'jordan'
where not exists (select 1 from public.teams where name = 'Jordan');
update public.teams set short_name = 'JOR', flag = coalesce(nullif(flag, ''), '🇯🇴'), fifa_rank = 63 where name = 'Jordan';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Mexico', 'MEX', '🇲🇽', 14, 'legacy', 'mexico'
where not exists (select 1 from public.teams where name = 'Mexico');
update public.teams set short_name = 'MEX', flag = coalesce(nullif(flag, ''), '🇲🇽'), fifa_rank = 14 where name = 'Mexico';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Morocco', 'MOR', '🇲🇦', 7, 'legacy', 'morocco'
where not exists (select 1 from public.teams where name = 'Morocco');
update public.teams set short_name = 'MOR', flag = coalesce(nullif(flag, ''), '🇲🇦'), fifa_rank = 7 where name = 'Morocco';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Netherlands', 'NET', '🇳🇱', 8, 'legacy', 'netherlands'
where not exists (select 1 from public.teams where name = 'Netherlands');
update public.teams set short_name = 'NET', flag = coalesce(nullif(flag, ''), '🇳🇱'), fifa_rank = 8 where name = 'Netherlands';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'New Zealand', 'NZ', '🇳🇿', 85, 'legacy', 'new-zealand'
where not exists (select 1 from public.teams where name = 'New Zealand');
update public.teams set short_name = 'NZ', flag = coalesce(nullif(flag, ''), '🇳🇿'), fifa_rank = 85 where name = 'New Zealand';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Norway', 'NOR', '🇳🇴', 31, 'legacy', 'norway'
where not exists (select 1 from public.teams where name = 'Norway');
update public.teams set short_name = 'NOR', flag = coalesce(nullif(flag, ''), '🇳🇴'), fifa_rank = 31 where name = 'Norway';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Panama', 'PAN', '🇵🇦', 34, 'legacy', 'panama'
where not exists (select 1 from public.teams where name = 'Panama');
update public.teams set short_name = 'PAN', flag = coalesce(nullif(flag, ''), '🇵🇦'), fifa_rank = 34 where name = 'Panama';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Paraguay', 'PAR', '🇵🇾', 40, 'legacy', 'paraguay'
where not exists (select 1 from public.teams where name = 'Paraguay');
update public.teams set short_name = 'PAR', flag = coalesce(nullif(flag, ''), '🇵🇾'), fifa_rank = 40 where name = 'Paraguay';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Portugal', 'POR', '🇵🇹', 5, 'legacy', 'portugal'
where not exists (select 1 from public.teams where name = 'Portugal');
update public.teams set short_name = 'POR', flag = coalesce(nullif(flag, ''), '🇵🇹'), fifa_rank = 5 where name = 'Portugal';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Qatar', 'QAT', '🇶🇦', 57, 'legacy', 'qatar'
where not exists (select 1 from public.teams where name = 'Qatar');
update public.teams set short_name = 'QAT', flag = coalesce(nullif(flag, ''), '🇶🇦'), fifa_rank = 57 where name = 'Qatar';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Saudi Arabia', 'SA', '🇸🇦', 61, 'legacy', 'saudi-arabia'
where not exists (select 1 from public.teams where name = 'Saudi Arabia');
update public.teams set short_name = 'SA', flag = coalesce(nullif(flag, ''), '🇸🇦'), fifa_rank = 61 where name = 'Saudi Arabia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Scotland', 'SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 42, 'legacy', 'scotland'
where not exists (select 1 from public.teams where name = 'Scotland');
update public.teams set short_name = 'SCO', flag = coalesce(nullif(flag, ''), '🏴󠁧󠁢󠁳󠁣󠁴󠁿'), fifa_rank = 42 where name = 'Scotland';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Senegal', 'SEN', '🇸🇳', 15, 'legacy', 'senegal'
where not exists (select 1 from public.teams where name = 'Senegal');
update public.teams set short_name = 'SEN', flag = coalesce(nullif(flag, ''), '🇸🇳'), fifa_rank = 15 where name = 'Senegal';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'South Africa', 'SA', '🇿🇦', 60, 'legacy', 'south-africa'
where not exists (select 1 from public.teams where name = 'South Africa');
update public.teams set short_name = 'SA', flag = coalesce(nullif(flag, ''), '🇿🇦'), fifa_rank = 60 where name = 'South Africa';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'South Korea', 'SK', '🇰🇷', 25, 'legacy', 'south-korea'
where not exists (select 1 from public.teams where name = 'South Korea');
update public.teams set short_name = 'SK', flag = coalesce(nullif(flag, ''), '🇰🇷'), fifa_rank = 25 where name = 'South Korea';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Spain', 'SPA', '🇪🇸', 2, 'legacy', 'spain'
where not exists (select 1 from public.teams where name = 'Spain');
update public.teams set short_name = 'SPA', flag = coalesce(nullif(flag, ''), '🇪🇸'), fifa_rank = 2 where name = 'Spain';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Sweden', 'SWE', '🇸🇪', 38, 'legacy', 'sweden'
where not exists (select 1 from public.teams where name = 'Sweden');
update public.teams set short_name = 'SWE', flag = coalesce(nullif(flag, ''), '🇸🇪'), fifa_rank = 38 where name = 'Sweden';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Switzerland', 'SWI', '🇨🇭', 19, 'legacy', 'switzerland'
where not exists (select 1 from public.teams where name = 'Switzerland');
update public.teams set short_name = 'SWI', flag = coalesce(nullif(flag, ''), '🇨🇭'), fifa_rank = 19 where name = 'Switzerland';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Tunisia', 'TUN', '🇹🇳', 46, 'legacy', 'tunisia'
where not exists (select 1 from public.teams where name = 'Tunisia');
update public.teams set short_name = 'TUN', flag = coalesce(nullif(flag, ''), '🇹🇳'), fifa_rank = 46 where name = 'Tunisia';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Turkey', 'TUR', '🇹🇷', 22, 'legacy', 'turkey'
where not exists (select 1 from public.teams where name = 'Turkey');
update public.teams set short_name = 'TUR', flag = coalesce(nullif(flag, ''), '🇹🇷'), fifa_rank = 22 where name = 'Turkey';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'USA', 'USA', '🇺🇸', 17, 'legacy', 'usa'
where not exists (select 1 from public.teams where name = 'USA');
update public.teams set short_name = 'USA', flag = coalesce(nullif(flag, ''), '🇺🇸'), fifa_rank = 17 where name = 'USA';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Uruguay', 'URU', '🇺🇾', 16, 'legacy', 'uruguay'
where not exists (select 1 from public.teams where name = 'Uruguay');
update public.teams set short_name = 'URU', flag = coalesce(nullif(flag, ''), '🇺🇾'), fifa_rank = 16 where name = 'Uruguay';

insert into public.teams (name, short_name, flag, fifa_rank, api_provider, api_team_id)
select 'Uzbekistan', 'UZB', '🇺🇿', 50, 'legacy', 'uzbekistan'
where not exists (select 1 from public.teams where name = 'Uzbekistan');
update public.teams set short_name = 'UZB', flag = coalesce(nullif(flag, ''), '🇺🇿'), fifa_rank = 50 where name = 'Uzbekistan';

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Mexico' limit 1;
  select id into t2 from public.teams where name = 'South Africa' limit 1;
  select id into winner from public.teams where name = 'Mexico' limit 1;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-001';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-001', '2026-06-11'::date, 'Group Stage', '2026-06-11 14:00:00+00'::timestamptz, t1, t2, 2, 0, winner, false, true, true);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'South Korea' limit 1;
  select id into t2 from public.teams where name = 'Czechia' limit 1;
  select id into winner from public.teams where name = 'South Korea' limit 1;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-002';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-002', '2026-06-11'::date, 'Group Stage', '2026-06-11 17:00:00+00'::timestamptz, t1, t2, 2, 1, winner, false, true, true);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Canada' limit 1;
  select id into t2 from public.teams where name = 'Bosnia and Herzegovina' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-003';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-003', '2026-06-12'::date, 'Group Stage', '2026-06-12 14:00:00+00'::timestamptz, t1, t2, 1, 1, winner, true, true, true);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'USA' limit 1;
  select id into t2 from public.teams where name = 'Paraguay' limit 1;
  select id into winner from public.teams where name = 'USA' limit 1;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-004';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-004', '2026-06-12'::date, 'Group Stage', '2026-06-12 17:00:00+00'::timestamptz, t1, t2, 4, 1, winner, false, true, true);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Qatar' limit 1;
  select id into t2 from public.teams where name = 'Switzerland' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-005';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-005', '2026-06-13'::date, 'Group Stage', '2026-06-13 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Brazil' limit 1;
  select id into t2 from public.teams where name = 'Morocco' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-006';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-006', '2026-06-13'::date, 'Group Stage', '2026-06-13 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Haiti' limit 1;
  select id into t2 from public.teams where name = 'Scotland' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-007';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-007', '2026-06-13'::date, 'Group Stage', '2026-06-13 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Australia' limit 1;
  select id into t2 from public.teams where name = 'Turkey' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-008';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-008', '2026-06-13'::date, 'Group Stage', '2026-06-13 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Germany' limit 1;
  select id into t2 from public.teams where name = 'Curacao' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-009';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-009', '2026-06-14'::date, 'Group Stage', '2026-06-14 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Netherlands' limit 1;
  select id into t2 from public.teams where name = 'Japan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-010';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-010', '2026-06-14'::date, 'Group Stage', '2026-06-14 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Ivory Coast' limit 1;
  select id into t2 from public.teams where name = 'Ecuador' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-011';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-011', '2026-06-14'::date, 'Group Stage', '2026-06-14 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Tunisia' limit 1;
  select id into t2 from public.teams where name = 'Sweden' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-012';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-012', '2026-06-14'::date, 'Group Stage', '2026-06-14 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Spain' limit 1;
  select id into t2 from public.teams where name = 'Cape Verde' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-013';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-013', '2026-06-15'::date, 'Group Stage', '2026-06-15 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Belgium' limit 1;
  select id into t2 from public.teams where name = 'Egypt' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-014';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-014', '2026-06-15'::date, 'Group Stage', '2026-06-15 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Saudi Arabia' limit 1;
  select id into t2 from public.teams where name = 'Uruguay' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-015';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-015', '2026-06-15'::date, 'Group Stage', '2026-06-15 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Iran' limit 1;
  select id into t2 from public.teams where name = 'New Zealand' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-016';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-016', '2026-06-15'::date, 'Group Stage', '2026-06-15 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'France' limit 1;
  select id into t2 from public.teams where name = 'Senegal' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-017';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-017', '2026-06-16'::date, 'Group Stage', '2026-06-16 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Iraq' limit 1;
  select id into t2 from public.teams where name = 'Norway' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-018';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-018', '2026-06-16'::date, 'Group Stage', '2026-06-16 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Argentina' limit 1;
  select id into t2 from public.teams where name = 'Algeria' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-019';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-019', '2026-06-16'::date, 'Group Stage', '2026-06-16 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Austria' limit 1;
  select id into t2 from public.teams where name = 'Jordan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-020';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-020', '2026-06-16'::date, 'Group Stage', '2026-06-16 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Portugal' limit 1;
  select id into t2 from public.teams where name = 'Congo DR' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-021';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-021', '2026-06-17'::date, 'Group Stage', '2026-06-17 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'England' limit 1;
  select id into t2 from public.teams where name = 'Croatia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-022';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-022', '2026-06-17'::date, 'Group Stage', '2026-06-17 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Ghana' limit 1;
  select id into t2 from public.teams where name = 'Panama' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-023';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-023', '2026-06-17'::date, 'Group Stage', '2026-06-17 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Uzbekistan' limit 1;
  select id into t2 from public.teams where name = 'Colombia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-024';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-024', '2026-06-17'::date, 'Group Stage', '2026-06-17 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Czechia' limit 1;
  select id into t2 from public.teams where name = 'South Africa' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-025';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-025', '2026-06-18'::date, 'Group Stage', '2026-06-18 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Switzerland' limit 1;
  select id into t2 from public.teams where name = 'Bosnia and Herzegovina' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-026';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-026', '2026-06-18'::date, 'Group Stage', '2026-06-18 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Canada' limit 1;
  select id into t2 from public.teams where name = 'Qatar' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-027';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-027', '2026-06-18'::date, 'Group Stage', '2026-06-18 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Mexico' limit 1;
  select id into t2 from public.teams where name = 'South Korea' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-028';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-028', '2026-06-18'::date, 'Group Stage', '2026-06-18 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'USA' limit 1;
  select id into t2 from public.teams where name = 'Australia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-029';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-029', '2026-06-19'::date, 'Group Stage', '2026-06-19 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Scotland' limit 1;
  select id into t2 from public.teams where name = 'Morocco' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-030';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-030', '2026-06-19'::date, 'Group Stage', '2026-06-19 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Brazil' limit 1;
  select id into t2 from public.teams where name = 'Haiti' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-031';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-031', '2026-06-19'::date, 'Group Stage', '2026-06-19 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Turkey' limit 1;
  select id into t2 from public.teams where name = 'Paraguay' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-032';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-032', '2026-06-19'::date, 'Group Stage', '2026-06-19 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Netherlands' limit 1;
  select id into t2 from public.teams where name = 'Sweden' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-033';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-033', '2026-06-20'::date, 'Group Stage', '2026-06-20 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Germany' limit 1;
  select id into t2 from public.teams where name = 'Ivory Coast' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-034';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-034', '2026-06-20'::date, 'Group Stage', '2026-06-20 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Ecuador' limit 1;
  select id into t2 from public.teams where name = 'Curacao' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-035';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-035', '2026-06-20'::date, 'Group Stage', '2026-06-20 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Tunisia' limit 1;
  select id into t2 from public.teams where name = 'Japan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-036';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-036', '2026-06-20'::date, 'Group Stage', '2026-06-20 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Spain' limit 1;
  select id into t2 from public.teams where name = 'Saudi Arabia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-037';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-037', '2026-06-21'::date, 'Group Stage', '2026-06-21 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Belgium' limit 1;
  select id into t2 from public.teams where name = 'Iran' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-038';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-038', '2026-06-21'::date, 'Group Stage', '2026-06-21 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Uruguay' limit 1;
  select id into t2 from public.teams where name = 'Cape Verde' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-039';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-039', '2026-06-21'::date, 'Group Stage', '2026-06-21 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'New Zealand' limit 1;
  select id into t2 from public.teams where name = 'Egypt' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-040';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-040', '2026-06-21'::date, 'Group Stage', '2026-06-21 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Argentina' limit 1;
  select id into t2 from public.teams where name = 'Austria' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-041';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-041', '2026-06-22'::date, 'Group Stage', '2026-06-22 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'France' limit 1;
  select id into t2 from public.teams where name = 'Iraq' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-042';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-042', '2026-06-22'::date, 'Group Stage', '2026-06-22 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Norway' limit 1;
  select id into t2 from public.teams where name = 'Senegal' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-043';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-043', '2026-06-22'::date, 'Group Stage', '2026-06-22 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Jordan' limit 1;
  select id into t2 from public.teams where name = 'Algeria' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-044';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-044', '2026-06-22'::date, 'Group Stage', '2026-06-22 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Portugal' limit 1;
  select id into t2 from public.teams where name = 'Uzbekistan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-045';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-045', '2026-06-23'::date, 'Group Stage', '2026-06-23 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'England' limit 1;
  select id into t2 from public.teams where name = 'Ghana' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-046';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-046', '2026-06-23'::date, 'Group Stage', '2026-06-23 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Panama' limit 1;
  select id into t2 from public.teams where name = 'Croatia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-047';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-047', '2026-06-23'::date, 'Group Stage', '2026-06-23 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Colombia' limit 1;
  select id into t2 from public.teams where name = 'Congo DR' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-048';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-048', '2026-06-23'::date, 'Group Stage', '2026-06-23 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Switzerland' limit 1;
  select id into t2 from public.teams where name = 'Canada' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-049';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-049', '2026-06-24'::date, 'Group Stage', '2026-06-24 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Bosnia and Herzegovina' limit 1;
  select id into t2 from public.teams where name = 'Qatar' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-050';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-050', '2026-06-24'::date, 'Group Stage', '2026-06-24 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Brazil' limit 1;
  select id into t2 from public.teams where name = 'Scotland' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-051';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-051', '2026-06-24'::date, 'Group Stage', '2026-06-24 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Morocco' limit 1;
  select id into t2 from public.teams where name = 'Haiti' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-052';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-052', '2026-06-24'::date, 'Group Stage', '2026-06-24 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Mexico' limit 1;
  select id into t2 from public.teams where name = 'Czechia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-053';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-053', '2026-06-24'::date, 'Group Stage', '2026-06-24 02:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'South Korea' limit 1;
  select id into t2 from public.teams where name = 'South Africa' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-054';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-054', '2026-06-24'::date, 'Group Stage', '2026-06-24 05:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Ecuador' limit 1;
  select id into t2 from public.teams where name = 'Germany' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-055';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-055', '2026-06-25'::date, 'Group Stage', '2026-06-25 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Curacao' limit 1;
  select id into t2 from public.teams where name = 'Ivory Coast' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-056';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-056', '2026-06-25'::date, 'Group Stage', '2026-06-25 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Tunisia' limit 1;
  select id into t2 from public.teams where name = 'Netherlands' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-057';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-057', '2026-06-25'::date, 'Group Stage', '2026-06-25 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Japan' limit 1;
  select id into t2 from public.teams where name = 'Sweden' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-058';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-058', '2026-06-25'::date, 'Group Stage', '2026-06-25 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'USA' limit 1;
  select id into t2 from public.teams where name = 'Turkey' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-059';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-059', '2026-06-25'::date, 'Group Stage', '2026-06-25 02:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Paraguay' limit 1;
  select id into t2 from public.teams where name = 'Australia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-060';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-060', '2026-06-25'::date, 'Group Stage', '2026-06-25 05:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Norway' limit 1;
  select id into t2 from public.teams where name = 'France' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-061';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-061', '2026-06-26'::date, 'Group Stage', '2026-06-26 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Senegal' limit 1;
  select id into t2 from public.teams where name = 'Iraq' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-062';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-062', '2026-06-26'::date, 'Group Stage', '2026-06-26 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Uruguay' limit 1;
  select id into t2 from public.teams where name = 'Spain' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-063';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-063', '2026-06-26'::date, 'Group Stage', '2026-06-26 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Cape Verde' limit 1;
  select id into t2 from public.teams where name = 'Saudi Arabia' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-064';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-064', '2026-06-26'::date, 'Group Stage', '2026-06-26 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'New Zealand' limit 1;
  select id into t2 from public.teams where name = 'Belgium' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-065';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-065', '2026-06-26'::date, 'Group Stage', '2026-06-26 02:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Egypt' limit 1;
  select id into t2 from public.teams where name = 'Iran' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-066';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-066', '2026-06-26'::date, 'Group Stage', '2026-06-26 05:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Panama' limit 1;
  select id into t2 from public.teams where name = 'England' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-067';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-067', '2026-06-27'::date, 'Group Stage', '2026-06-27 14:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Croatia' limit 1;
  select id into t2 from public.teams where name = 'Ghana' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-068';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-068', '2026-06-27'::date, 'Group Stage', '2026-06-27 17:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Colombia' limit 1;
  select id into t2 from public.teams where name = 'Portugal' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-069';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-069', '2026-06-27'::date, 'Group Stage', '2026-06-27 20:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Congo DR' limit 1;
  select id into t2 from public.teams where name = 'Uzbekistan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-070';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-070', '2026-06-27'::date, 'Group Stage', '2026-06-27 23:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Argentina' limit 1;
  select id into t2 from public.teams where name = 'Jordan' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-071';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-071', '2026-06-27'::date, 'Group Stage', '2026-06-27 02:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

do $$
declare
  t1 public.teams.id%type;
  t2 public.teams.id%type;
  winner public.teams.id%type;
begin
  select id into t1 from public.teams where name = 'Algeria' limit 1;
  select id into t2 from public.teams where name = 'Austria' limit 1;
  winner := null;
  delete from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-072';
  insert into public.fixtures (api_provider, api_fixture_id, match_date, stage, kickoff_at, team1_id, team2_id, goals_team1, goals_team2, winner_team_id, is_draw, is_finished, result_confirmed)
  values ('legacy', 'sheet-072', '2026-06-27'::date, 'Group Stage', '2026-06-27 05:00:00+00'::timestamptz, t1, t2, null, null, winner, false, false, false);
end $$;

commit;

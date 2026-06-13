-- Optional one-time import for legacy picks from the spreadsheet.
-- After this import, predictions should be managed only through the website.
-- Bonito maps to bonysayed@gmail.com. Shanu maps to shahn1998@gmail.com.
-- Run this after both users have signed in once, so their profiles exist.
begin;

-- Historical import only: bypass the kickoff lock while this transaction loads old picks.
alter table public.predictions disable trigger predictions_validate_write;

-- Bonito
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-001' limit 1;
  select id into picked from public.teams where name = 'Mexico' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-002' limit 1;
  select id into picked from public.teams where name = 'Czechia' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-003' limit 1;
  select id into picked from public.teams where name = 'Canada' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-004' limit 1;
  picked := null;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, true, 1, 1, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-005' limit 1;
  select id into picked from public.teams where name = 'Switzerland' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('bonysayed@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-006' limit 1;
  picked := null;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, true, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;

-- Shanu
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('shahn1998@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-001' limit 1;
  select id into picked from public.teams where name = 'Mexico' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('shahn1998@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-002' limit 1;
  select id into picked from public.teams where name = 'South Korea' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('shahn1998@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-003' limit 1;
  select id into picked from public.teams where name = 'Canada' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;
do $$
declare
  profile_id uuid;
  target_fixture_id public.fixtures.id%type;
  picked public.teams.id%type;
begin
  select id into profile_id from public.profiles where lower(email) = lower('shahn1998@gmail.com') limit 1;
  if profile_id is null then return; end if;
  select id into target_fixture_id from public.fixtures where api_provider = 'legacy' and api_fixture_id = 'sheet-004' limit 1;
  select id into picked from public.teams where name = 'USA' limit 1;
  insert into public.predictions (user_id, fixture_id, picked_team_id, pick_is_draw, pred_goals_team1, pred_goals_team2, joker_used)
  values (profile_id, target_fixture_id, picked, false, null, null, false)
  on conflict (user_id, fixture_id) do update set
    picked_team_id = excluded.picked_team_id, pick_is_draw = excluded.pick_is_draw,
    pred_goals_team1 = excluded.pred_goals_team1, pred_goals_team2 = excluded.pred_goals_team2, joker_used = excluded.joker_used;
end $$;

alter table public.predictions enable trigger predictions_validate_write;

commit;

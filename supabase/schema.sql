create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  api_provider text,
  api_team_id text,
  name text not null,
  short_name text,
  flag text,
  fifa_rank integer not null check (fifa_rank > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (api_provider, api_team_id)
);

alter table public.teams add column if not exists api_provider text;
alter table public.teams add column if not exists api_team_id text;
alter table public.teams add column if not exists short_name text;
alter table public.teams add column if not exists flag text;
alter table public.teams add column if not exists fifa_rank integer;
alter table public.teams add column if not exists created_at timestamptz not null default now();
alter table public.teams add column if not exists updated_at timestamptz not null default now();

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  api_provider text,
  api_fixture_id text,
  external_fixture_id text,
  competition text not null default 'FIFA World Cup 2026',
  stage text not null default 'Group',
  group_name text,
  kickoff_at timestamptz not null,
  kickoff_time_utc timestamptz,
  venue_timezone text,
  venue text,
  home_team text,
  away_team text,
  home_team_code text,
  away_team_code text,
  goals_team1 integer check (goals_team1 >= 0),
  goals_team2 integer check (goals_team2 >= 0),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled',
  is_draw boolean not null default false,
  is_finished boolean not null default false,
  went_to_penalties boolean,
  result_confirmed boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (api_provider, api_fixture_id)
);

alter table public.fixtures add column if not exists api_provider text;
alter table public.fixtures add column if not exists api_fixture_id text;
alter table public.fixtures add column if not exists external_fixture_id text;
alter table public.fixtures add column if not exists competition text not null default 'FIFA World Cup 2026';
alter table public.fixtures add column if not exists stage text not null default 'Group';
alter table public.fixtures add column if not exists group_name text;
alter table public.fixtures add column if not exists kickoff_at timestamptz;
alter table public.fixtures add column if not exists kickoff_time_utc timestamptz;
alter table public.fixtures add column if not exists venue_timezone text;
alter table public.fixtures add column if not exists venue text;
alter table public.fixtures add column if not exists home_team text;
alter table public.fixtures add column if not exists away_team text;
alter table public.fixtures add column if not exists home_team_code text;
alter table public.fixtures add column if not exists away_team_code text;
do $$
declare
  team_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into team_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'teams'
    and a.attname = 'id'
    and not a.attisdropped;

  execute format('alter table public.fixtures add column if not exists team1_id %s', team_id_type);
  execute format('alter table public.fixtures add column if not exists team2_id %s', team_id_type);
  execute format('alter table public.fixtures add column if not exists winner_team_id %s', team_id_type);
  execute format('alter table public.fixtures add column if not exists advancing_team_id %s', team_id_type);
end;
$$;
alter table public.fixtures add column if not exists goals_team1 integer;
alter table public.fixtures add column if not exists goals_team2 integer;
alter table public.fixtures add column if not exists home_score integer;
alter table public.fixtures add column if not exists away_score integer;
alter table public.fixtures add column if not exists status text not null default 'scheduled';
alter table public.fixtures add column if not exists is_draw boolean not null default false;
alter table public.fixtures add column if not exists is_finished boolean not null default false;
alter table public.fixtures add column if not exists went_to_penalties boolean;
alter table public.fixtures add column if not exists result_confirmed boolean not null default false;
alter table public.fixtures add column if not exists last_synced_at timestamptz;
alter table public.fixtures add column if not exists created_at timestamptz not null default now();
alter table public.fixtures add column if not exists updated_at timestamptz not null default now();

-- Time model:
-- kickoff_time_utc is the canonical kickoff instant and must be stored as UTC.
-- kickoff_at is kept for compatibility and should mirror kickoff_time_utc.
-- venue_timezone stores the IANA timezone for the stadium; the UI converts kickoff_time_utc
-- to the user's browser timezone for display. Prediction locks use the canonical UTC instant.
comment on column public.fixtures.kickoff_time_utc is
  'Canonical fixture kickoff instant in UTC. UI converts this to user local time; lock deadlines use this value.';
comment on column public.fixtures.venue_timezone is
  'Optional IANA timezone for the venue, for audit/context only. Not the canonical kickoff instant.';
comment on column public.fixtures.external_fixture_id is
  'Provider fixture identifier used for API sync upserts with api_provider.';

update public.fixtures
set kickoff_time_utc = coalesce(kickoff_time_utc, kickoff_at)
where kickoff_at is not null;

update public.fixtures
set
  external_fixture_id = coalesce(external_fixture_id, api_fixture_id),
  home_score = coalesce(home_score, goals_team1),
  away_score = coalesce(away_score, goals_team2),
  status = case when is_finished then 'FINISHED' else coalesce(status, 'scheduled') end
where external_fixture_id is null
   or home_score is null
   or away_score is null
   or status is null;

create unique index if not exists teams_api_provider_api_team_id_key
on public.teams (api_provider, api_team_id)
where api_provider is not null and api_team_id is not null;

create unique index if not exists fixtures_api_provider_api_fixture_id_key
on public.fixtures (api_provider, api_fixture_id)
where api_provider is not null and api_fixture_id is not null;

create unique index if not exists fixtures_api_provider_external_fixture_id_key
on public.fixtures (api_provider, external_fixture_id)
where api_provider is not null and external_fixture_id is not null;

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  pick_is_draw boolean not null default false,
  pred_goals_team1 integer check (pred_goals_team1 >= 0),
  pred_goals_team2 integer check (pred_goals_team2 >= 0),
  penalty_call text check (penalty_call in ('yes', 'no')),
  joker_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fixture_id)
);

do $$
declare
  team_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
    into team_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'teams'
    and a.attname = 'id'
    and not a.attisdropped;

  execute format('alter table public.predictions add column if not exists picked_team_id %s', team_id_type);
end;
$$;
alter table public.predictions add column if not exists pick_is_draw boolean not null default false;
alter table public.predictions add column if not exists pred_goals_team1 integer;
alter table public.predictions add column if not exists pred_goals_team2 integer;
alter table public.predictions add column if not exists penalty_call text;
alter table public.predictions add column if not exists joker_used boolean not null default false;
alter table public.predictions add column if not exists created_at timestamptz not null default now();
alter table public.predictions add column if not exists updated_at timestamptz not null default now();

create unique index if not exists predictions_user_id_fixture_id_key
on public.predictions (user_id, fixture_id);

create table if not exists public.api_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status text not null,
  imported_fixtures integer not null default 0,
  imported_results integer not null default 0,
  message text,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

create or replace function public.validate_prediction_write()
returns trigger
language plpgsql
as $$
declare
  fixture_record public.fixtures%rowtype;
  lock_kickoff timestamptz;
  joker_count integer;
begin
  select * into fixture_record from public.fixtures where id = new.fixture_id;
  lock_kickoff := coalesce(fixture_record.kickoff_time_utc, fixture_record.kickoff_at);

  if lock_kickoff - interval '1 minute' <= now() then
    raise exception 'Predictions are locked 1 minute before kickoff';
  end if;

  if lower(fixture_record.stage) not in ('group', 'group stage') and new.pick_is_draw then
    raise exception 'Knockout main pick must be an advancer';
  end if;

  if new.joker_used then
    select count(*) into joker_count
    from public.predictions
    where user_id = new.user_id
      and joker_used = true
      and (tg_op = 'INSERT' or id <> new.id);

    if joker_count >= 3 then
      raise exception 'Only 3 jokers are allowed per user';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists predictions_touch_updated_at on public.predictions;
create trigger predictions_touch_updated_at
before update on public.predictions
for each row execute function public.touch_updated_at();

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at
before update on public.teams
for each row execute function public.touch_updated_at();

drop trigger if exists fixtures_touch_updated_at on public.fixtures;
create trigger fixtures_touch_updated_at
before update on public.fixtures
for each row execute function public.touch_updated_at();

drop trigger if exists predictions_validate_write on public.predictions;
create trigger predictions_validate_write
before insert or update on public.predictions
for each row execute function public.validate_prediction_write();

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;
alter table public.api_sync_runs enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
for select to authenticated using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "teams readable" on public.teams;
create policy "teams readable" on public.teams
for select to authenticated using (true);

drop policy if exists "teams admin write" on public.teams;
create policy "teams admin write" on public.teams
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fixtures readable" on public.fixtures;
create policy "fixtures readable" on public.fixtures
for select to authenticated using (true);

drop policy if exists "fixtures admin write" on public.fixtures;
create policy "fixtures admin write" on public.fixtures
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "predictions readable" on public.predictions;
create policy "predictions readable" on public.predictions
for select to authenticated using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.fixtures f
    where f.id = public.predictions.fixture_id
      and coalesce(f.kickoff_time_utc, f.kickoff_at) - interval '1 minute' <= now()
  )
);

drop policy if exists "predictions self insert" on public.predictions;
create policy "predictions self insert" on public.predictions
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "predictions self update" on public.predictions;
create policy "predictions self update" on public.predictions
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "api sync readable" on public.api_sync_runs;
create policy "api sync readable" on public.api_sync_runs
for select to authenticated using (true);

drop policy if exists "api sync admin write" on public.api_sync_runs;
create policy "api sync admin write" on public.api_sync_runs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

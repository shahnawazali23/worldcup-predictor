-- Privacy fix: users can read their own predictions at any time, but other
-- users' predictions only become readable after the fixture lock time.
-- This keeps pre-lock picks private while still allowing leaderboards/history
-- to use locked and completed match predictions.

begin;

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

commit;

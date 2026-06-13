# Fixture Sync

Fixture timing must come from a server-side provider sync:

External football API -> Supabase `fixtures` table -> frontend reads Supabase.

The frontend must not call the provider directly because provider API keys are secret.

## Provider

The first supported provider is `football-data.org`.

Default env:

```sh
FIXTURE_PROVIDER=football-data
FOOTBALL_DATA_COMPETITION_CODE=WC
FOOTBALL_DATA_SEASON=2026
FOOTBALL_DATA_API_KEY=...
```

If football-data.org does not expose the required 2026 World Cup fixtures on your plan or at the
time you run it, keep this same Supabase schema and replace only the Edge Function fetch/normalize
section with another provider.

## Time Rules

`fixtures.kickoff_time_utc` is canonical and must be stored as a UTC instant.

`fixtures.kickoff_at` is kept as a compatibility mirror for existing app code and should match
`kickoff_time_utc`.

The UI converts `kickoff_time_utc` to the user's browser timezone for display.

Countdowns and prediction locks use `kickoff_time_utc`.

Never store browser-local time as the canonical kickoff time.

## Run Sync

Deploy the function:

```sh
supabase functions deploy sync-fixtures
```

Set secrets:

```sh
supabase secrets set FOOTBALL_DATA_API_KEY=your_key FOOTBALL_DATA_COMPETITION_CODE=WC FOOTBALL_DATA_SEASON=2026
```

Run manually:

```sh
supabase functions invoke sync-fixtures
```

For production, schedule the function from Supabase scheduled functions or any trusted server cron.

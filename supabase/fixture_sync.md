# Fixture Sync

Fixture timing must come from a server-side provider sync:

External football API -> Supabase `fixtures` table -> frontend reads Supabase.

The frontend must not call the provider directly because provider API keys are secret.

## Provider

The first supported provider is `football-data.org`.

Required Edge Function secrets/env:

```sh
FIXTURE_PROVIDER=football-data
FOOTBALL_DATA_COMPETITION_CODE=WC
FOOTBALL_DATA_SEASON=2026
FOOTBALL_DATA_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`FIXTURE_PROVIDER` is optional and defaults to `football-data`. `FOOTBALL_DATA_TIMEOUT_MS`
is also optional and defaults to `15000`.

If football-data.org does not expose the required 2026 World Cup fixtures on your plan or at the
time you run it, keep this same Supabase schema and replace only the Edge Function fetch/normalize
section with another provider.

The football-data.org URL currently called is:

```txt
https://api.football-data.org/v4/competitions/WC/matches?season=2026
```

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
supabase secrets set \
  FOOTBALL_DATA_API_KEY=your_key \
  FOOTBALL_DATA_COMPETITION_CODE=WC \
  FOOTBALL_DATA_SEASON=2026 \
  FOOTBALL_DATA_TIMEOUT_MS=15000
```

Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are also available to the function. If
they are not already injected in your project, set them as Edge Function secrets:

```sh
supabase secrets set SUPABASE_URL=your_project_url SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run manually:

```sh
supabase functions invoke sync-fixtures
```

Expected success response:

```json
{
  "ok": true,
  "provider": "football-data",
  "competitionCode": "WC",
  "season": "2026",
  "fixtures": 104,
  "results": 0,
  "durationMs": 1234
}
```

Handled provider/network failures return HTTP 200 with `ok: false` so the Supabase manual test
view shows a readable JSON error instead of a generic 500.

The function logs the competition code, season, API URL, HTTP response status, retry attempts,
and final sync result.

The football-data.org request uses a Deno HTTP client with HTTP/2 disabled when the Edge Runtime
supports it. This avoids known provider transport failures that can appear as `TypeError: error
sending request` / HTTP2 connection errors in Supabase logs.

For production, schedule the function from Supabase scheduled functions or any trusted server cron.

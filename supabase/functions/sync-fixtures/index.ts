import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type FootballDataTeam = {
  id?: number | string | null
  name?: string | null
  shortName?: string | null
  tla?: string | null
}

type FootballDataMatch = {
  id: number | string
  utcDate: string
  status?: string
  stage?: string | null
  group?: string | null
  venue?: string | null
  competition?: {
    code?: string | null
    name?: string | null
  }
  homeTeam?: FootballDataTeam
  awayTeam?: FootballDataTeam
  score?: {
    fullTime?: {
      home?: number | null
      away?: number | null
    }
  }
  lastUpdated?: string | null
}

type NormalizedTeam = {
  api_provider: string
  api_team_id: string
  name: string
  short_name: string
  fifa_rank: number
}

const provider = Deno.env.get('FIXTURE_PROVIDER') || 'football-data'
const competitionCode = Deno.env.get('FOOTBALL_DATA_COMPETITION_CODE') || 'WC'
const season = Deno.env.get('FOOTBALL_DATA_SEASON') || '2026'

Deno.serve(async () => {
  const supabaseUrl = requiredEnv('SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const apiKey = requiredEnv('FOOTBALL_DATA_API_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const matches = await fetchFootballDataMatches(apiKey)
    const teams = uniqueTeams(matches)

    if (teams.length > 0) {
      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teams, { onConflict: 'api_provider,api_team_id', ignoreDuplicates: true })

      if (teamsError) throw teamsError
    }

    const { data: savedTeams, error: loadTeamsError } = await supabase
      .from('teams')
      .select('id, api_team_id')
      .eq('api_provider', provider)

    if (loadTeamsError) throw loadTeamsError

    const teamIdsByApiId = Object.fromEntries(
      (savedTeams || []).map((team) => [team.api_team_id, team.id]),
    )

    const fixtures = matches.map((match) => normalizeFixture(match, teamIdsByApiId))
    const { error: fixturesError } = await supabase
      .from('fixtures')
      .upsert(fixtures, { onConflict: 'api_provider,external_fixture_id' })

    if (fixturesError) throw fixturesError

    await logSync(supabase, {
      status: 'success',
      imported_fixtures: fixtures.length,
      imported_results: fixtures.filter((fixture) => fixture.is_finished).length,
      message: `Synced ${fixtures.length} ${competitionCode} fixtures for ${season}.`,
    })

    return jsonResponse({ ok: true, provider, competitionCode, season, fixtures: fixtures.length })
  } catch (error) {
    await logSync(supabase, {
      status: 'error',
      imported_fixtures: 0,
      imported_results: 0,
      message: error instanceof Error ? error.message : String(error),
    })

    return jsonResponse(
      { ok: false, provider, competitionCode, season, error: error instanceof Error ? error.message : String(error) },
      500,
    )
  }
})

async function fetchFootballDataMatches(apiKey: string): Promise<FootballDataMatch[]> {
  const url = new URL(`https://api.football-data.org/v4/competitions/${competitionCode}/matches`)
  url.searchParams.set('season', season)

  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`football-data.org ${response.status}: ${body}`)
  }

  const payload = await response.json()
  return payload.matches || []
}

function normalizeFixture(match: FootballDataMatch, teamIdsByApiId: Record<string, string>) {
  const homeTeam = match.homeTeam || {}
  const awayTeam = match.awayTeam || {}
  const homeApiId = String(homeTeam.id || homeTeam.tla || homeTeam.name || '')
  const awayApiId = String(awayTeam.id || awayTeam.tla || awayTeam.name || '')
  const homeScore = match.score?.fullTime?.home ?? null
  const awayScore = match.score?.fullTime?.away ?? null
  const isFinished = match.status === 'FINISHED'

  // football-data.org returns utcDate as an ISO UTC instant. Store it unchanged as canonical UTC.
  return {
    api_provider: provider,
    api_fixture_id: String(match.id),
    external_fixture_id: String(match.id),
    competition: match.competition?.name || competitionCode,
    stage: normalizeStage(match.stage),
    group_name: match.group || null,
    home_team: homeTeam.name || null,
    away_team: awayTeam.name || null,
    home_team_code: homeTeam.tla || null,
    away_team_code: awayTeam.tla || null,
    kickoff_time_utc: match.utcDate,
    kickoff_at: match.utcDate,
    venue: match.venue || null,
    venue_timezone: null,
    team1_id: teamIdsByApiId[homeApiId] || null,
    team2_id: teamIdsByApiId[awayApiId] || null,
    goals_team1: homeScore,
    goals_team2: awayScore,
    home_score: homeScore,
    away_score: awayScore,
    winner_team_id: winnerTeamId(homeScore, awayScore, teamIdsByApiId[homeApiId], teamIdsByApiId[awayApiId]),
    is_draw: homeScore != null && awayScore != null && homeScore === awayScore,
    is_finished: isFinished,
    status: match.status || 'SCHEDULED',
    last_synced_at: new Date().toISOString(),
  }
}

function uniqueTeams(matches: FootballDataMatch[]): NormalizedTeam[] {
  const teamsByApiId = new Map<string, NormalizedTeam>()

  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!team?.name) continue
      const apiTeamId = String(team.id || team.tla || team.name)
      teamsByApiId.set(apiTeamId, {
        api_provider: provider,
        api_team_id: apiTeamId,
        name: team.name,
        short_name: team.tla || team.shortName || team.name,
        fifa_rank: 999,
      })
    }
  }

  return [...teamsByApiId.values()]
}

function winnerTeamId(
  homeScore: number | null,
  awayScore: number | null,
  homeTeamId?: string,
  awayTeamId?: string,
) {
  if (homeScore == null || awayScore == null || homeScore === awayScore) return null
  return homeScore > awayScore ? homeTeamId || null : awayTeamId || null
}

function normalizeStage(stage?: string | null) {
  if (!stage) return 'Group'
  return stage
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function logSync(
  supabase: ReturnType<typeof createClient>,
  run: { status: string; imported_fixtures: number; imported_results: number; message: string },
) {
  await supabase.from('api_sync_runs').insert({
    provider,
    ...run,
  })
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  })
}

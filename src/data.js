import { supabase } from './supabaseClient'
import { canonicalTeamName, resolveTeamFlag } from './teamFlags'

const fixtureSelect = `
  id,
  api_provider,
  api_fixture_id,
  external_fixture_id,
  competition,
  stage,
  group_name,
  kickoff_at,
  kickoff_time_utc,
  venue_timezone,
  venue,
  home_team,
  away_team,
  home_team_code,
  away_team_code,
  team1_id,
  team2_id,
  goals_team1,
  goals_team2,
  home_score,
  away_score,
  winner_team_id,
  advancing_team_id,
  status,
  is_draw,
  is_finished,
  went_to_penalties,
  result_confirmed,
  last_synced_at
`

export async function loadLeagueData() {
  const [profiles, teams, fixtures, predictions, syncRuns] = await Promise.all([
    selectOrThrow('profiles', '*', (query) => query.order('display_name')),
    selectOrThrow('teams', '*', (query) => query.order('name')),
    selectOrThrow('fixtures', fixtureSelect, (query) => query.order('kickoff_time_utc')),
    selectOrThrow('predictions', '*'),
    selectOptional('api_sync_runs', '*', (query) =>
      query.order('created_at', { ascending: false }).limit(5),
    ),
  ])
  const normalizedTeams = teams.map(normalizeTeamDisplay)

  return {
    profiles,
    teams: normalizedTeams,
    teamsById: Object.fromEntries(normalizedTeams.map((team) => [team.id, team])),
    fixtures: fixtures.map(normalizeFixtureResultFields),
    predictions,
    syncRuns,
  }
}

function normalizeTeamDisplay(team) {
  const name = canonicalTeamName(team.name)
  return {
    ...team,
    flag: resolveTeamFlag({ ...team, name }),
    name,
  }
}

function normalizeFixtureResultFields(fixture) {
  const goalsTeam1 = fixture.goals_team1 ?? fixture.home_score ?? null
  const goalsTeam2 = fixture.goals_team2 ?? fixture.away_score ?? null
  const hasResult = goalsTeam1 != null && goalsTeam2 != null
  const isDraw = hasResult ? goalsTeam1 === goalsTeam2 : fixture.is_draw
  const winnerTeamId = fixture.winner_team_id || (
    hasResult && !isDraw
      ? goalsTeam1 > goalsTeam2
        ? fixture.team1_id
        : fixture.team2_id
      : null
  )

  return {
    ...fixture,
    goals_team1: goalsTeam1,
    goals_team2: goalsTeam2,
    home_score: fixture.home_score ?? goalsTeam1,
    away_score: fixture.away_score ?? goalsTeam2,
    is_draw: isDraw,
    winner_team_id: winnerTeamId,
  }
}

export async function savePrediction({ fixture, prediction, session, updates }) {
  const payload = {
    user_id: session.user.id,
    fixture_id: fixture.id,
    picked_team_id: prediction?.picked_team_id || null,
    pick_is_draw: prediction?.pick_is_draw || false,
    pred_goals_team1: prediction?.pred_goals_team1 ?? null,
    pred_goals_team2: prediction?.pred_goals_team2 ?? null,
    penalty_call: null,
    joker_used: prediction?.joker_used || false,
    ...updates,
  }

  delete payload.id
  delete payload.created_at
  delete payload.updated_at

  const { data, error } = await supabase
    .from('predictions')
    .upsert(payload, { onConflict: 'user_id,fixture_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveFixtureResult(fixtureId, updates) {
  const { data, error } = await supabase
    .from('fixtures')
    .update(updates)
    .eq('id', fixtureId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveTeam(teamId, updates) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return data
}

async function selectOrThrow(table, columns, transform = (query) => query) {
  const { data, error } = await transform(supabase.from(table).select(columns))
  if (error) throw new Error(`${table}: ${error.message}`)
  return data || []
}

async function selectOptional(table, columns, transform = (query) => query) {
  const { data, error } = await transform(supabase.from(table).select(columns))
  if (error?.code === '42P01' || error?.message?.includes('schema cache')) return []
  if (error) throw new Error(`${table}: ${error.message}`)
  return data || []
}

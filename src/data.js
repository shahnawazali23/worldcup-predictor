import { supabase } from './supabaseClient'

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

  const normalizedFixtures = fixtures.map(normalizeFixtureResultFields)
  const { fixtureIdAliases, fixtures: mergedFixtures } = mergeDuplicateFixtureRows(normalizedFixtures, predictions)
  const mergedPredictions = mergePredictionsByFixtureAliases(predictions, fixtureIdAliases)

  return {
    profiles,
    teams,
    teamsById: Object.fromEntries(teams.map((team) => [team.id, team])),
    fixtures: mergedFixtures,
    predictions: mergedPredictions,
    syncRuns,
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

function mergeDuplicateFixtureRows(fixtures, predictions) {
  const predictionCounts = predictions.reduce((counts, prediction) => {
    const fixtureId = String(prediction.fixture_id)
    counts[fixtureId] = (counts[fixtureId] || 0) + 1
    return counts
  }, {})

  const groups = new Map()
  fixtures.forEach((fixture) => {
    const key = duplicateFixtureKey(fixture)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(fixture)
  })

  const fixtureIdAliases = {}
  const mergedFixtures = []

  groups.forEach((group) => {
    if (group.length === 1) {
      mergedFixtures.push(group[0])
      return
    }

    const canonical = group.slice().sort((a, b) => compareCanonicalFixture(a, b, predictionCounts))[0]
    const merged = group.reduce((current, fixture) => mergeFixtureResultFields(current, fixture), canonical)

    group.forEach((fixture) => {
      if (String(fixture.id) !== String(canonical.id)) {
        fixtureIdAliases[String(fixture.id)] = canonical.id
      }
    })

    mergedFixtures.push(merged)
  })

  return {
    fixtureIdAliases,
    fixtures: mergedFixtures.sort((a, b) => fixtureTimestamp(a) - fixtureTimestamp(b)),
  }
}

function duplicateFixtureKey(fixture) {
  if (!fixture.team1_id || !fixture.team2_id) return `fixture:${fixture.id}`
  const kickoff = fixtureTimestamp(fixture)
  if (!kickoff) return `fixture:${fixture.id}`
  return [
    'match',
    fixture.team1_id,
    fixture.team2_id,
    new Date(kickoff).toISOString(),
  ].join(':')
}

function compareCanonicalFixture(a, b, predictionCounts) {
  return (
    (predictionCounts[String(b.id)] || 0) - (predictionCounts[String(a.id)] || 0) ||
    Number(hasFixtureResult(b)) - Number(hasFixtureResult(a)) ||
    Number(b.api_provider === 'football-data') - Number(a.api_provider === 'football-data') ||
    String(a.id).localeCompare(String(b.id))
  )
}

function mergeFixtureResultFields(current, candidate) {
  const currentHasResult = hasFixtureResult(current)
  const candidateHasResult = hasFixtureResult(candidate)
  const resultSource = !currentHasResult && candidateHasResult ? candidate : current

  return normalizeFixtureResultFields({
    ...current,
    goals_team1: resultSource.goals_team1 ?? resultSource.home_score ?? current.goals_team1,
    goals_team2: resultSource.goals_team2 ?? resultSource.away_score ?? current.goals_team2,
    home_score: resultSource.home_score ?? resultSource.goals_team1 ?? current.home_score,
    away_score: resultSource.away_score ?? resultSource.goals_team2 ?? current.away_score,
    winner_team_id: resultSource.winner_team_id || current.winner_team_id,
    advancing_team_id: resultSource.advancing_team_id || current.advancing_team_id,
    is_draw: candidateHasResult ? resultSource.is_draw : current.is_draw,
    is_finished: current.is_finished || candidate.is_finished,
    result_confirmed: current.result_confirmed || candidate.result_confirmed,
    status: candidate.is_finished ? candidate.status : current.status,
    last_synced_at: latestTimestamp(current.last_synced_at, candidate.last_synced_at),
  })
}

function mergePredictionsByFixtureAliases(predictions, fixtureIdAliases) {
  const predictionsByUserFixture = new Map()

  predictions.forEach((prediction) => {
    const fixtureId = fixtureIdAliases[String(prediction.fixture_id)] || prediction.fixture_id
    const normalizedPrediction = { ...prediction, fixture_id: fixtureId }
    const key = `${normalizedPrediction.user_id}:${normalizedPrediction.fixture_id}`
    const existing = predictionsByUserFixture.get(key)

    if (!existing || predictionTimestamp(normalizedPrediction) >= predictionTimestamp(existing)) {
      predictionsByUserFixture.set(key, normalizedPrediction)
    }
  })

  return [...predictionsByUserFixture.values()]
}

function hasFixtureResult(fixture) {
  return (fixture.goals_team1 ?? fixture.home_score) != null && (fixture.goals_team2 ?? fixture.away_score) != null
}

function fixtureTimestamp(fixture) {
  const timestamp = Date.parse(fixture.kickoff_time_utc || fixture.kickoff_at || '')
  return Number.isFinite(timestamp) ? timestamp : 0
}

function predictionTimestamp(prediction) {
  return Date.parse(prediction.updated_at || prediction.created_at || '') || 0
}

function latestTimestamp(left, right) {
  if (!left) return right
  if (!right) return left
  return Date.parse(left) >= Date.parse(right) ? left : right
}

export async function savePrediction({ fixture, prediction, session, updates }) {
  const payload = {
    user_id: session.user.id,
    fixture_id: fixture.id,
    picked_team_id: prediction?.picked_team_id || null,
    pick_is_draw: prediction?.pick_is_draw || false,
    pred_goals_team1: prediction?.pred_goals_team1 ?? null,
    pred_goals_team2: prediction?.pred_goals_team2 ?? null,
    penalty_call: prediction?.penalty_call || null,
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

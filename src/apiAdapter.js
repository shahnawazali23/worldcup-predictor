export function normalizeApiFixture(provider, rawFixture) {
  const kickoffTimeUtc = rawFixture.utcDate || rawFixture.kickoff_time_utc || rawFixture.fixture?.date
  const homeScore = rawFixture.score?.fullTime?.home ?? rawFixture.goals_team1 ?? rawFixture.goals?.home ?? null
  const awayScore = rawFixture.score?.fullTime?.away ?? rawFixture.goals_team2 ?? rawFixture.goals?.away ?? null

  return {
    api_provider: provider,
    api_fixture_id: String(rawFixture.id || rawFixture.fixture?.id || rawFixture.external_fixture_id),
    external_fixture_id: String(rawFixture.id || rawFixture.fixture?.id || rawFixture.external_fixture_id),
    competition: rawFixture.competition?.name || rawFixture.league?.name || rawFixture.competition || 'FIFA World Cup 2026',
    stage: normalizeStage(rawFixture.stage || rawFixture.league?.round || 'Group'),
    group_name: rawFixture.group || null,
    kickoff_time_utc: kickoffTimeUtc,
    kickoff_at: kickoffTimeUtc,
    venue: rawFixture.venue || rawFixture.fixture?.venue?.name || null,
    venue_timezone: rawFixture.venue_timezone || null,
    home_team: rawFixture.homeTeam?.name || rawFixture.teams?.home?.name || null,
    away_team: rawFixture.awayTeam?.name || rawFixture.teams?.away?.name || null,
    home_team_code: rawFixture.homeTeam?.tla || rawFixture.teams?.home?.code || null,
    away_team_code: rawFixture.awayTeam?.tla || rawFixture.teams?.away?.code || null,
    team1_api_id: String(rawFixture.team1_api_id || rawFixture.teams?.home?.id || ''),
    team2_api_id: String(rawFixture.team2_api_id || rawFixture.teams?.away?.id || ''),
    goals_team1: homeScore,
    goals_team2: awayScore,
    home_score: homeScore,
    away_score: awayScore,
    status: rawFixture.status || rawFixture.fixture?.status?.short || 'SCHEDULED',
  }
}

export function normalizeApiTeam(provider, rawTeam) {
  return {
    api_provider: provider,
    api_team_id: String(rawTeam.id || rawTeam.team?.id),
    name: rawTeam.name || rawTeam.team?.name,
    short_name: rawTeam.short_name || rawTeam.team?.code || rawTeam.team?.name,
    flag: rawTeam.flag || rawTeam.team?.logo || '',
    fifa_rank: rawTeam.fifa_rank ?? null,
  }
}

function normalizeStage(stage) {
  if (!stage) return 'Group'
  return String(stage)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

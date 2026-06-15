import { canonicalTeamName } from './teamFlags.js'

export const INSIGHT_BONUS_ENABLED = true

export const ROUND_MULTIPLIERS = {
  group: 1,
  r32: 1.5,
  r16: 2,
  qf: 2.5,
  semi: 3,
  final: 4,
}

export const JOKER_LIMIT = 3

export function normalizeStage(stage = '') {
  const value = String(stage).toLowerCase().replaceAll(' ', '_')
  if (value.includes('final') && !value.includes('semi') && !value.includes('third')) return 'final'
  if (value.includes('semi')) return 'semi'
  if (value.includes('quarter') || value === 'qf') return 'qf'
  if (value.includes('round_of_16') || value.includes('r16')) return 'r16'
  if (value.includes('round_of_32') || value.includes('r32')) return 'r32'
  return 'group'
}

export function isKnockoutFixture(fixture) {
  return normalizeStage(fixture.stage) !== 'group'
}

export function roundMultiplier(fixture) {
  return ROUND_MULTIPLIERS[normalizeStage(fixture.stage)] || 1
}

export function winnerIdFromFixture(fixture) {
  if (isKnockoutFixture(fixture)) return fixture.advancing_team_id || fixture.winner_team_id || null
  if (fixture.is_draw) return 'draw'
  return fixture.winner_team_id || null
}

export function mainPickBasePoints(fixture, prediction, teamsById) {
  const winnerId = winnerIdFromFixture(fixture)
  const pickedId = prediction.pick_is_draw ? 'draw' : prediction.picked_team_id

  if (!winnerId || !pickedId) return 0
  if (pickedId === 'draw') return winnerId === 'draw' ? 3 : 0
  if (winnerId === 'draw') return 0

  const pickedTeam = teamsById[pickedId]
  const winnerTeam = teamsById[winnerId]
  if (!sameTeamIdentity(pickedTeam, winnerTeam)) return 0

  return 3
}

function sameTeamIdentity(left, right) {
  if (!left || !right) return false
  if (left.id != null && right.id != null && String(left.id) === String(right.id)) return true
  return canonicalTeamName(left.name) === canonicalTeamName(right.name)
}

export function scorelineBonus(fixture, prediction) {
  const pred1 = prediction.pred_goals_team1
  const pred2 = prediction.pred_goals_team2
  const actual1 = fixture.goals_team1
  const actual2 = fixture.goals_team2

  if (pred1 == null || pred2 == null) return 0
  if (actual1 == null || actual2 == null) return 0
  if (pred1 === actual1 && pred2 === actual2) return 3
  return 0
}

export function expectedScoreForFixture(fixture, teamsById) {
  const homeTeam = teamsById[fixture.team1_id]
  const awayTeam = teamsById[fixture.team2_id]
  const homeRank = rankForTeam(homeTeam, teamsById)
  const awayRank = rankForTeam(awayTeam, teamsById)
  const rankEdge = clamp((awayRank - homeRank) / 35, -0.9, 0.9)
  const homeGoals = clamp(Math.round(1.35 + 0.18 + rankEdge), 0, 5)
  const awayGoals = clamp(Math.round(1.15 - rankEdge), 0, 5)

  return {
    away: awayGoals,
    home: homeGoals,
  }
}

function rankForTeam(team, teamsById) {
  if (!team) return 50

  const canonicalName = canonicalTeamName(team.name)
  const matchingRanks = Object.values(teamsById)
    .filter((candidate) => canonicalTeamName(candidate?.name) === canonicalName)
    .map((candidate) => Number(candidate?.fifa_rank))
    .filter((rank) => Number.isFinite(rank) && rank > 0 && rank < 999)

  if (matchingRanks.length > 0) return Math.min(...matchingRanks)

  const rank = Number(team.fifa_rank)
  return Number.isFinite(rank) && rank > 0 && rank < 999 ? rank : 50
}

export function insightBonus(fixture, prediction, teamsById) {
  if (!INSIGHT_BONUS_ENABLED) return emptyInsight()
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return emptyInsight()
  if (fixture.goals_team1 == null || fixture.goals_team2 == null) return emptyInsight()

  const expected = expectedScoreForFixture(fixture, teamsById)
  const modelError = Math.abs(expected.home - fixture.goals_team1) +
    Math.abs(expected.away - fixture.goals_team2)
  const predictionError = Math.abs(prediction.pred_goals_team1 - fixture.goals_team1) +
    Math.abs(prediction.pred_goals_team2 - fixture.goals_team2)
  const insightScore = modelError - predictionError

  return {
    bonus: insightScore >= 3 ? 2 : insightScore >= 1 ? 1 : insightScore === 0 ? 0 : -1,
    expected,
    insightScore,
    modelError,
    predictionError,
  }
}

function emptyInsight() {
  return {
    bonus: 0,
    expected: null,
    insightScore: 0,
    modelError: 0,
    predictionError: 0,
  }
}

export function scoreMatch(fixture, prediction, teamsById) {
  if (!fixture?.is_finished || !prediction) return emptyMatchScore()

  const baseMain = mainPickBasePoints(fixture, prediction, teamsById)
  const main = baseMain
  const scoreline = scorelineBonus(fixture, prediction)
  const insight = insightBonus(fixture, prediction, teamsById)
  const beforeJoker = main + scoreline + insight.bonus
  const total = prediction.joker_used ? beforeJoker * 2 : beforeJoker

  return {
    total,
    main,
    baseMain,
    exactScore: scoreline,
    insight: insight.bonus,
    insightDetails: insight,
    scoreline,
    jokerMultiplier: prediction.joker_used ? 2 : 1,
    correctPick: baseMain > 0,
  }
}

export function emptyMatchScore() {
  return {
    total: 0,
    main: 0,
    baseMain: 0,
    exactScore: 0,
    insight: 0,
    insightDetails: emptyInsight(),
    scoreline: 0,
    jokerMultiplier: 1,
    correctPick: false,
  }
}

export function buildLeaderboard({ fixtures, predictions, profiles, teamsById }) {
  const fixturesById = Object.fromEntries(fixtures.map((fixture) => [fixture.id, fixture]))
  const predictionsByUser = new Map()

  predictions.forEach((prediction) => {
    if (!predictionsByUser.has(prediction.user_id)) predictionsByUser.set(prediction.user_id, [])
    predictionsByUser.get(prediction.user_id).push(prediction)
  })

  const rows = profiles.map((profile) => {
    const userPredictions = predictionsByUser.get(profile.id) || []
    const row = {
      id: profile.id,
      name: profile.display_name || profile.email || 'Player',
      avatar: profile.avatar_url,
      points: 0,
      correctPicks: 0,
      finishedPicks: 0,
      predictionsMade: 0,
      jokersUsed: 0,
      matchScores: {},
    }

    userPredictions.forEach((prediction) => {
      const fixture = fixturesById[prediction.fixture_id]
      if (!fixture) return
      if (prediction.picked_team_id || prediction.pick_is_draw) row.predictionsMade += 1
      if (prediction.joker_used) row.jokersUsed += 1
      if (!fixture.is_finished) return

      const score = scoreMatch(fixture, prediction, teamsById)
      row.points += score.total
      row.matchScores[fixture.id] = {
        points: score.total,
        picked: prediction.pick_is_draw ? 'draw' : prediction.picked_team_id,
      }
      if (prediction.picked_team_id || prediction.pick_is_draw) row.finishedPicks += 1
      if (score.correctPick) row.correctPicks += 1
    })

    row.accuracy = row.finishedPicks ? (row.correctPicks / row.finishedPicks) * 100 : 0
    return row
  })

  return rows.sort(compareLeaderboardRows)
}

export function compareLeaderboardRows(a, b) {
  return (
    b.points - a.points ||
    b.correctPicks - a.correctPicks ||
    headToHeadPoints(b, a) - headToHeadPoints(a, b) ||
    a.name.localeCompare(b.name)
  )
}

export function headToHeadPoints(row, opponent) {
  return Object.entries(row.matchScores).reduce((total, [fixtureId, score]) => {
    const opponentScore = opponent.matchScores[fixtureId]
    if (!opponentScore || opponentScore.picked === score.picked) return total
    return total + score.points
  }, 0)
}

export function remainingJokers(predictions, userId) {
  const used = predictions.filter((prediction) => prediction.user_id === userId && prediction.joker_used)
    .length
  return Math.max(0, JOKER_LIMIT - used)
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

import { roundMultiplier } from './scoring'

export function possibleMainPickPoints(fixture, pickedId, teamsById) {
  if (!pickedId) return 0
  if (pickedId === 'draw') return roundMultiplier(fixture)

  const pickedTeam = teamsById[pickedId]
  const opponentId = pickedId === fixture.team1_id ? fixture.team2_id : fixture.team1_id
  const opponent = teamsById[opponentId]
  if (!pickedTeam || !opponent) return 0

  let basePoints = 1
  if (pickedTeam.fifa_rank > opponent.fifa_rank) {
    const upsetGap = pickedTeam.fifa_rank - opponent.fifa_rank
    if (upsetGap >= 40) basePoints = 5
    else if (upsetGap >= 15) basePoints = 3
    else basePoints = 2
  }

  return basePoints * roundMultiplier(fixture)
}

export function predictionPotential({ fixture, prediction, teamsById }) {
  const pickedId = prediction?.pick_is_draw ? 'draw' : prediction?.picked_team_id
  const main = possibleMainPickPoints(fixture, pickedId, teamsById)
  const hasScoreline = prediction?.pred_goals_team1 != null && prediction?.pred_goals_team2 != null
  const scoreline = hasScoreline ? 3 : 0
  const beforeJoker = main + scoreline
  const multiplier = prediction?.joker_used ? 2 : 1

  return {
    main,
    scoreline,
    multiplier,
    total: beforeJoker * multiplier,
    hasMainPick: Boolean(pickedId),
    hasScoreline,
  }
}

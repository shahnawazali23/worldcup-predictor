export function possibleMainPickPoints(_fixture, pickedId) {
  if (!pickedId) return 0
  return 3
}

export function predictionPotential({ fixture, prediction, teamsById }) {
  const pickedId = prediction?.pick_is_draw ? 'draw' : prediction?.picked_team_id
  const main = possibleMainPickPoints(fixture, pickedId, teamsById)
  const hasScoreline = prediction?.pred_goals_team1 != null && prediction?.pred_goals_team2 != null
  const scoreline = 3
  const goalDifference = 1
  const beforeJoker = main + scoreline
  const multiplier = prediction?.joker_used ? 2 : 1

  return {
    goalDifference,
    maximum: beforeJoker * multiplier,
    main,
    scoreline,
    multiplier,
    total: beforeJoker * multiplier,
    hasMainPick: Boolean(pickedId),
    hasScoreline,
  }
}

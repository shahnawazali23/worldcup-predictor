import { memo, useMemo, useState } from 'react'
import { buildFixtureDisplayMeta, compareFixturesTournamentOrder, fixtureParticipant } from './fixtureDisplay'
import { scoreMatch } from './scoring'
import TeamFlag from './TeamFlag'
import { fixtureKickoffDate, fixtureKickoffMs } from './time'

function History({ data, session }) {
  const [now] = useState(() => Date.now())
  const fixtureDisplayMeta = useMemo(() => buildFixtureDisplayMeta(data.fixtures), [data.fixtures])

  const rows = useMemo(() => {
    const predictionsByFixture = Object.fromEntries(
      data.predictions
        .filter((prediction) => prediction.user_id === session.user.id)
        .map((prediction) => [prediction.fixture_id, prediction]),
    )

    return data.fixtures
      .filter((fixture) => fixture.is_finished || fixtureKickoffMs(fixture) < now)
      .map((fixture) => {
        const prediction = predictionsByFixture[fixture.id]
        const score = fixture.is_finished && prediction
          ? scoreMatch(fixture, prediction, data.teamsById, data.fixtures)
          : null
        return {
          fixture,
          prediction,
          score,
        }
      })
      .filter((row) => row.prediction)
      .sort((a, b) => compareFixturesTournamentOrder(b.fixture, a.fixture))
  }, [data, now, session.user.id])

  const summary = useMemo(() => buildHistorySummary(rows), [rows])

  return (
    <section className="screen-stack">
      <div className="history-stat-cards">
        <SummaryCard label="Total Points" icon="🏆" value={summary.totalPoints} />
        <SummaryCard label="Accuracy" icon="🎯" value={`${summary.accuracy.toFixed(0)}%`} />
        <SummaryCard label="Current Streak" icon="🔥" value={summary.currentStreak} />
        <SummaryCard label="Current Rank" icon="👑" value={summary.rankTitle.label} title={summary.rankTitle.description} />
      </div>

      <div className="history-list">
        {rows.map(({ fixture, prediction, score }) => {
          const team1 = fixtureParticipant({
            fixture,
            side: 'home',
            teamsById: data.teamsById,
            sequenceByFixtureId: fixtureDisplayMeta.sequenceByFixtureId,
          })
          const team2 = fixtureParticipant({
            alignRight: true,
            fixture,
            side: 'away',
            teamsById: data.teamsById,
            sequenceByFixtureId: fixtureDisplayMeta.sequenceByFixtureId,
          })
          const pickedTeamRecord = prediction.pick_is_draw
            ? null
            : data.teamsById[prediction.picked_team_id]
          const predictedScore = formatPredictedScore(prediction)
          const resultStatus = getResultStatus(fixture, prediction, score)
          const exactScorePoints = score?.exactScore || 0
          const insightPoints = score?.insight || 0
          const basePoints = score ? score.main + exactScorePoints + insightPoints : null
          const jokerBonus = score && prediction.joker_used ? score.total - basePoints : null
          const insightExplanation = score
            ? insightExplanationFor({ fixture, prediction, score, team1, team2 })
            : ''

          return (
            <article className="history-row" key={fixture.id}>
              <div className="history-match">
                <span>{fixture.stage}</span>
                <div className="history-fixture-teams">
                  <TeamNameWithFlag team={team1} />
                  <b>vs</b>
                  <TeamNameWithFlag team={team2} alignRight />
                </div>
                <span className={`result-status result-status-${resultStatus.tone}`}>
                  {resultStatus.label}
                </span>
                <time>
                  {fixtureKickoffDate(fixture).toLocaleString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              <div className="history-detail">
                <div className="history-summary-grid">
                  <div>
                    <small>Your Prediction</small>
                    {prediction.pick_is_draw ? (
                      <span className="history-team-name">
                        <span className="draw-prediction-mark">DRAW</span>
                        <strong>Draw</strong>
                      </span>
                    ) : pickedTeamRecord ? (
                      <TeamNameWithFlag team={pickedTeamRecord} />
                    ) : (
                      <strong>No pick</strong>
                    )}
                    <span>{predictedScore}</span>
                  </div>
                  <div>
                    <small>Actual Result</small>
                    <ActualResult fixture={fixture} team1={team1} team2={team2} />
                    <span>{fixture.is_finished ? 'Final' : 'Pending result'}</span>
                  </div>
                  {score?.insightDetails.expected && (
                    <div>
                      <small>Expected Score</small>
                      <strong>
                        {score.insightDetails.expected.home}-{score.insightDetails.expected.away}
                      </strong>
                      <span>Internal pre-match forecast</span>
                    </div>
                  )}
                </div>

                <div className="history-breakdown">
                  <p className="section-label">Points Breakdown</p>
                  <BreakdownItem label="Winner Prediction" value={score ? score.main : null} />
                  <BreakdownItem label="Exact Score Prediction" value={score ? exactScorePoints : null} />
                  <BreakdownItem label="Insight Bonus" value={score ? insightPoints : null} />
                  {prediction.joker_used && <BreakdownItem label="Joker Bonus" value={jokerBonus} joker />}
                  {insightExplanation && <p className="insight-explanation">{insightExplanation}</p>}
                  <div className="history-total">
                    <span>Total Points Earned</span>
                    <strong>{score ? score.total : 'Pending'}</strong>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div className="panel empty-state">
          No history yet. Once matches pass kickoff, your locked predictions will appear here.
        </div>
      )}
    </section>
  )
}

function SummaryCard({ icon, label, title, value }) {
  return (
    <div className="history-stat-card" title={title}>
      <span>{icon} {label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ActualResult({ fixture, team1, team2 }) {
  if (!fixture.is_finished || fixture.goals_team1 == null || fixture.goals_team2 == null) {
    return <strong>Pending</strong>
  }

  return (
    <div className="history-result-line">
      <TeamNameWithFlag team={team1} compact />
      <strong>{fixture.goals_team1}-{fixture.goals_team2}</strong>
      <TeamNameWithFlag team={team2} alignRight compact />
    </div>
  )
}

function TeamNameWithFlag({ alignRight = false, compact = false, team }) {
  return (
    <span className={[
      'history-team-name',
      alignRight ? 'history-team-name-right' : '',
      compact ? 'history-team-name-compact' : '',
    ].filter(Boolean).join(' ')}>
      <TeamFlag size={compact ? 'compact' : 'table'} team={team} />
      <strong>{team?.name || 'TBD'}</strong>
      {team?.isPlaceholder && team.subtitle && !compact && <small>{team.subtitle}</small>}
    </span>
  )
}

export default memo(History)

function buildHistorySummary(rows) {
  const completedRows = rows.filter((row) => row.score)
  const completedResultRows = completedRows.filter((row) =>
    row.prediction.picked_team_id || row.prediction.pick_is_draw
  )
  const totalPoints = completedRows.reduce((total, row) => total + row.score.total, 0)
  const correctPicks = completedResultRows.filter((row) => row.score.correctPick).length
  const accuracy = completedResultRows.length ? (correctPicks / completedResultRows.length) * 100 : 0
  const currentStreak = completedResultRows.reduce((streak, row) => {
    if (streak.done) return streak
    if (row.score.correctPick) return { count: streak.count + 1, done: false }
    return { count: streak.count, done: true }
  }, { count: 0, done: false }).count

  return {
    accuracy,
    currentStreak,
    rankTitle: rankTitleFor({
      accuracy,
      exactScores: completedResultRows.filter((row) => row.score.scoreline === 3).length,
      finishedPicks: completedResultRows.length,
    }),
    totalPoints,
  }
}

function getResultStatus(fixture, prediction, score) {
  if (!prediction?.pick_is_draw && !prediction?.picked_team_id) {
    return { label: 'No Pick', tone: 'neutral' }
  }

  if (!fixture.is_finished || !score) {
    return { label: 'Pending Result', tone: 'pending' }
  }

  return score.correctPick
    ? { label: 'Correct Result', tone: 'success' }
    : { label: 'Wrong Result', tone: 'danger' }
}

function BreakdownItem({ joker = false, label, value }) {
  return (
    <div className={joker ? 'history-breakdown-line history-breakdown-joker' : 'history-breakdown-line'}>
      <span>{label}</span>
      <strong>
        {value == null
          ? 'Pending'
          : `${value >= 0 ? '+' : ''}${value}`}
      </strong>
    </div>
  )
}

function formatPredictedScore(prediction) {
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return 'No score prediction'
  return `Score ${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
}

function insightExplanationFor({ fixture, prediction, score, team1, team2 }) {
  const expected = score.insightDetails.expected
  if (!expected || prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return ''

  const homeName = team1?.name || fixture.home_team || 'Home team'
  const awayName = team2?.name || fixture.away_team || 'Away team'
  const predicted = `${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
  const actual = `${fixture.goals_team1}-${fixture.goals_team2}`
  const expectedText = `${expected.home}-${expected.away}`
  const actualMargin = fixture.goals_team1 - fixture.goals_team2
  const expectedMargin = expected.home - expected.away
  const predictedMargin = prediction.pred_goals_team1 - prediction.pred_goals_team2
  const actualWinner = actualMargin > 0 ? homeName : actualMargin < 0 ? awayName : 'the draw'
  const predictedWinner = predictedMargin > 0 ? homeName : predictedMargin < 0 ? awayName : 'the draw'

  if (score.insight > 0) {
    if (actualMargin === 0 && predictedMargin === 0) {
      return `You correctly saw ${homeName} and ${awayName} staying level, beating the ${expectedText} forecast with a ${predicted} call.`
    }

    if (Math.abs(actualMargin) > Math.abs(expectedMargin) && predictedWinner === actualWinner) {
      return `You anticipated a bigger ${actualWinner} performance than the ${expectedText} forecast, and your ${predicted} call moved closer to the ${actual} result.`
    }

    if (fixture.goals_team1 > expected.home || fixture.goals_team2 > expected.away) {
      const teamName = fixture.goals_team1 > expected.home ? homeName : awayName
      return `You correctly backed ${teamName} to find more attacking threat than the ${expectedText} forecast suggested.`
    }

    return `Your ${predicted} prediction read the ${homeName} vs ${awayName} match better than the ${expectedText} forecast.`
  }

  if (score.insight < 0) {
    if (predictedWinner !== actualWinner) {
      return `${actualWinner === 'the draw' ? 'The match stayed level' : `${actualWinner} controlled the result`} far more than your ${predicted} prediction anticipated.`
    }

    if (Math.abs(actualMargin) > Math.abs(predictedMargin)) {
      return `${actualWinner} delivered a stronger performance than your ${predicted} prediction suggested, with the match finishing ${actual}.`
    }

    return `${homeName} and ${awayName} played out differently from your ${predicted} read, with the ${actual} scoreline staying nearer to the ${expectedText} pre-match shape.`
  }

  return `Your ${predicted} call landed on the same match shape as the ${expectedText} pre-match read for ${homeName} vs ${awayName}.`
}

function rankTitleFor({ accuracy, exactScores, finishedPicks }) {
  if (finishedPicks >= 50 && accuracy >= 70 && exactScores >= 3) {
    return {
      label: '👑 Oracle',
      description: 'Unlocked with 50 completed result predictions, 70% accuracy, and 3 exact scores.',
    }
  }

  if (finishedPicks >= 35 && accuracy >= 65) {
    return {
      label: '🏆 World Cup Master',
      description: 'Unlocked with 35 completed result predictions and 65% accuracy.',
    }
  }

  if (finishedPicks >= 20 && accuracy >= 60) {
    return {
      label: '🎯 Tournament Expert',
      description: 'Unlocked with 20 completed result predictions and 60% accuracy.',
    }
  }

  if (finishedPicks >= 10 && accuracy >= 50) {
    return {
      label: '⚽ Match Analyst',
      description: 'Unlocked with 10 completed result predictions and 50% accuracy.',
    }
  }

  return {
    label: '🌱 Rookie Predictor',
    description: 'Default title for every player.',
  }
}

import { memo, useMemo, useState } from 'react'
import { buildFixtureDisplayMeta, compareFixturesTournamentOrder, fixtureParticipant, formatStageName } from './fixtureDisplay'
import Icon from './Icon'
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
        <SummaryCard label="Total Points" icon="trophy" value={summary.totalPoints} />
        <SummaryCard label="Accuracy" icon="target" value={`${summary.accuracy.toFixed(0)}%`} />
        <SummaryCard label="Current Streak" icon="trendingUp" value={summary.currentStreak} />
        <SummaryCard label="Current Rank" icon={summary.rankTitle.icon} value={summary.rankTitle.label} title={summary.rankTitle.description} />
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
          const scorelinePoints = score?.scoreline || 0
          const basePoints = score ? score.main + scorelinePoints : null
          const jokerBonus = score && prediction.joker_used ? score.total - basePoints : null
          const predictionSummary = score
            ? predictionSummaryFor({ fixture, prediction, score, team1, team2 })
            : null

          return (
            <article className="history-row" key={fixture.id}>
              <div className="history-card-main">
                <div className="history-card-meta">
                  <span>{formatStageName(fixture.stage)}</span>
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

                <ActualResult fixture={fixture} team1={team1} team2={team2} />

                <div className="history-prediction-card">
                  <span>Your Prediction</span>
                  <strong>{formatPredictionLine({ fixture, prediction, pickedTeamRecord, team1, team2 })}</strong>
                  <small>{predictedScore}</small>
                </div>
              </div>

              <div className="history-detail">
                <div className="history-breakdown">
                  <p className="section-label">Points Breakdown</p>
                  <BreakdownItem label="Result Prediction" value={score ? score.main : null} />
                  <BreakdownItem label="Scoreline Accuracy" value={score ? scorelinePoints : null} />
                  {prediction.joker_used && <BreakdownItem label="Joker Bonus" value={jokerBonus} joker />}
                  <div className="history-total">
                    <span>Total Points Earned</span>
                    <strong>{score ? formatPoints(score.total) : 'Pending'}</strong>
                  </div>
                </div>

                {predictionSummary && (
                  <div className="match-analysis-card">
                    <span>
                      <Icon name="activity" size={16} />
                      Prediction Summary
                    </span>
                    <strong>{predictionSummary.status}</strong>
                    <p>{predictionSummary.text}</p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div className="panel empty-state">
          <Icon name="clock" size={20} />
          <strong>No history yet</strong>
          <span>Locked predictions will appear here once matches are complete.</span>
        </div>
      )}
    </section>
  )
}

function SummaryCard({ icon, label, title, value }) {
  return (
    <div className="history-stat-card" title={title}>
      <span>
        <Icon name={icon} size={16} />
        {label}
      </span>
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
      exactScores: completedResultRows.filter((row) => row.score.scorelineComponents.exact > 0).length,
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

function BreakdownItem({ joker = false, label, meta, tone, value }) {
  return (
    <div className={[
      'history-breakdown-line',
      joker ? 'history-breakdown-joker' : '',
      tone ? `history-breakdown-${tone}` : '',
    ].filter(Boolean).join(' ')}>
      <span>
        {label}
        {meta && <small>{meta}</small>}
      </span>
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
  return `${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
}

function formatPredictionLine({ fixture, prediction, pickedTeamRecord, team1, team2 }) {
  const scoreText = formatPredictedScore(prediction)
  const homeName = team1?.name || fixture.home_team || 'Home'
  const awayName = team2?.name || fixture.away_team || 'Away'

  if (prediction.pred_goals_team1 != null && prediction.pred_goals_team2 != null) {
    return `${homeName} ${scoreText} ${awayName}`
  }

  if (prediction.pick_is_draw) return `${homeName} draw ${awayName}`
  if (pickedTeamRecord?.name) return `${pickedTeamRecord.name} to win`
  return `No pick ${scoreText}`
}

function formatPoints(points) {
  if (typeof points !== 'number') return points
  return `${points >= 0 ? '+' : ''}${points} pts`
}

function predictionSummaryFor({ fixture, prediction, score, team1, team2 }) {
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return null

  const homeName = team1?.name || fixture.home_team || 'Home team'
  const awayName = team2?.name || fixture.away_team || 'Away team'
  const actual = `${fixture.goals_team1}-${fixture.goals_team2}`
  const actualMargin = fixture.goals_team1 - fixture.goals_team2
  const predictedMargin = prediction.pred_goals_team1 - prediction.pred_goals_team2
  const actualWinner = actualMargin > 0 ? homeName : actualMargin < 0 ? awayName : null
  const predictedWinner = predictedMargin > 0 ? homeName : predictedMargin < 0 ? awayName : null

  if (score.scorelineComponents?.exact > 0) {
    return {
      status: 'Perfect Call',
      text: `Perfect call. You predicted ${homeName} ${actual} ${awayName} exactly.`,
    }
  }

  if (!score.correctPick) {
    if (prediction.pick_is_draw && actualWinner) {
      return {
        status: 'Missed Call',
        text: `Missed call. ${actualWinner} beat ${actualWinner === homeName ? awayName : homeName} after a match you called as a draw.`,
      }
    }

    if (!actualWinner) {
      return {
        status: 'Missed Call',
        text: `Missed call. ${homeName} could not break down ${awayName} and the match ended ${actual}.`,
      }
    }

    return {
      status: 'Missed Call',
      text: `Missed call. The match went the other way, with ${actualWinner} winning ${actual}.`,
    }
  }

  if (!score.scorelineComponents?.aligned) {
    return {
      status: 'Good Prediction',
      text: 'Good prediction. You got the result right, but the scoreline did not match that pick.',
    }
  }

  if (score.scorelineError != null && score.scorelineError <= 1) {
    return {
      status: 'Very Close',
      text: `Very close. ${predictedWinner || 'The draw'} landed as predicted and you missed the exact score by just one goal.`,
    }
  }

  const actualAbsMargin = Math.abs(actualMargin)
  const predictedAbsMargin = Math.abs(predictedMargin)

  if (actualAbsMargin > predictedAbsMargin && actualWinner) {
    return {
      status: 'Good Prediction',
      text: `You got the winner right, but ${actualWinner} won by a much bigger margin.`,
    }
  }

  if (actualAbsMargin < predictedAbsMargin) {
    return {
      status: 'Good Prediction',
      text: 'You got the winner right, but the match was closer than your scoreline suggested.',
    }
  }

  return {
    status: 'Good Prediction',
    text: `Good prediction. You correctly picked ${predictedWinner || 'the draw'}.`,
  }
}

function rankTitleFor({ accuracy, exactScores, finishedPicks }) {
  if (finishedPicks >= 50 && accuracy >= 70 && exactScores >= 3) {
    return {
      icon: 'spark',
      label: 'Oracle',
      description: 'Unlocked with 50 completed result predictions, 70% accuracy, and 3 exact scores.',
    }
  }

  if (finishedPicks >= 35 && accuracy >= 65) {
    return {
      icon: 'trophy',
      label: 'World Cup Master',
      description: 'Unlocked with 35 completed result predictions and 65% accuracy.',
    }
  }

  if (finishedPicks >= 20 && accuracy >= 60) {
    return {
      icon: 'target',
      label: 'Tournament Expert',
      description: 'Unlocked with 20 completed result predictions and 60% accuracy.',
    }
  }

  if (finishedPicks >= 10 && accuracy >= 50) {
    return {
      icon: 'activity',
      label: 'Match Analyst',
      description: 'Unlocked with 10 completed result predictions and 50% accuracy.',
    }
  }

  return {
    icon: 'medal',
    label: 'Rookie Predictor',
    description: 'Default title for every player.',
  }
}

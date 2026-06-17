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
          const insightExplanation = score
            ? insightExplanationFor({ fixture, prediction, score, team1, team2 })
            : ''
          const rating = score ? insightRatingFor(score.scoreline) : null

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
                  <BreakdownItem label="Winner Prediction" value={score ? score.main : null} />
                  <BreakdownItem
                    label="Insight Rating"
                    meta={rating?.label}
                    tone={rating?.tone}
                    value={score ? scorelinePoints : null}
                  />
                  {prediction.joker_used && <BreakdownItem label="Joker Bonus" value={jokerBonus} joker />}
                  <div className="history-total">
                    <span>Total Points Earned</span>
                    <strong>{score ? formatPoints(score.total) : 'Pending'}</strong>
                  </div>
                </div>

                {insightExplanation && (
                  <div className="match-analysis-card">
                    <span>
                      <Icon name="activity" size={16} />
                      Match Analysis
                    </span>
                    <p>{insightExplanation}</p>
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
      exactScores: completedResultRows.filter((row) => row.score.scorelineError === 0).length,
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

  if (prediction.pick_is_draw) return `${homeName} ${scoreText} ${awayName}`
  if (pickedTeamRecord?.name) return `${pickedTeamRecord.name} ${scoreText}`
  return `No pick ${scoreText}`
}

function formatPoints(points) {
  if (typeof points !== 'number') return points
  return `${points >= 0 ? '+' : ''}${points} pts`
}

function insightRatingFor(points) {
  if (points >= 3) return { icon: 'target', label: 'Excellent Read', tone: 'excellent' }
  if (points === 2) return { icon: 'trendingUp', label: 'Strong Read', tone: 'strong' }
  if (points === 1) return { icon: 'checkCircle', label: 'Solid Read', tone: 'solid' }
  if (points === 0) return { icon: 'activity', label: 'Neutral Read', tone: 'neutral' }
  if (points === -1) return { icon: 'clock', label: 'Missed Read', tone: 'missed' }
  return { icon: 'lock', label: 'Poor Read', tone: 'poor' }
}

function insightExplanationFor({ fixture, prediction, score, team1, team2 }) {
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return ''

  const homeName = team1?.name || fixture.home_team || 'Home team'
  const awayName = team2?.name || fixture.away_team || 'Away team'
  const predicted = `${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
  const actual = `${fixture.goals_team1}-${fixture.goals_team2}`
  const actualMargin = fixture.goals_team1 - fixture.goals_team2
  const predictedMargin = prediction.pred_goals_team1 - prediction.pred_goals_team2
  const actualWinner = actualMargin > 0 ? homeName : actualMargin < 0 ? awayName : 'the draw'
  const predictedWinner = predictedMargin > 0 ? homeName : predictedMargin < 0 ? awayName : 'the draw'
  const winningSide = actualWinner === 'the draw' ? null : actualWinner
  const predictedWinnerCorrect = predictedWinner === actualWinner
  const scorelineError = score.scorelineError
  const templateSeed = `${fixture.id}-${prediction.user_id}-${predicted}-${actual}-${scorelineError}`

  if (scorelineError === 0) {
    return pickInsightTemplate(templateSeed, [
      `You called ${homeName} vs ${awayName} exactly as it unfolded, including the ${actual} scoreline.`,
      `Your ${predicted} prediction nailed the final score.`,
      `You read the full match perfectly, right down to the ${actual} result.`,
    ])
  }

  if (scorelineError === 1) {
    if (predictedWinnerCorrect && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `You correctly backed ${winningSide} and came within a single goal of the final ${actual} scoreline.`,
        `You were right about ${winningSide} winning and almost landed the exact score.`,
        `Your prediction tracked the match closely, with only one goal separating it from the final result.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `You came within a single goal of the final ${actual} scoreline.`,
      `Your scoreline was close, with one goal separating your prediction from the result.`,
      `You nearly matched the final score, even though the result moved slightly away from your call.`,
    ])
  }

  if (scorelineError === 2) {
    if (predictedWinnerCorrect && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `You correctly backed ${winningSide}, even though the final margin landed differently.`,
        `You had the right winner, but the ${actual} scoreline added a little more distance from your prediction.`,
        `Your prediction caught the result direction, with the final score finishing two goals away.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `Your scoreline kept close enough to the final ${actual} result to earn a small return.`,
      `You were two goals away from the final scoreline.`,
      `${homeName} and ${awayName} finished within reach of your predicted scoreline.`,
    ])
  }

  if (scorelineError === 3) {
    if (predictedWinnerCorrect && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `You correctly picked ${winningSide}, but the scoreline finished too far from your prediction for a bonus.`,
        `The winner was right, but the final ${actual} result moved beyond your scoreline call.`,
        `You had the result direction, but the match total stretched away from your prediction.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `The final ${actual} scoreline finished too far from your prediction for a scoreline return.`,
      `${homeName} vs ${awayName} moved away from your ${predicted} scoreline as the result settled.`,
      `Your scoreline missed by three goals, so the scoreline insight stayed level.`,
    ])
  }

  if (predictedWinner !== actualWinner) {
    return pickInsightTemplate(templateSeed, [
      `${actualWinner === 'the draw' ? 'The match stayed level' : `${actualWinner} controlled the result`} far more than your ${predicted} prediction anticipated.`,
      `${actualWinner === 'the draw' ? 'The draw became the story' : `${actualWinner} shaped the match`} while your prediction expected a different outcome.`,
      `${homeName} vs ${awayName} moved well away from your predicted scoreline as the final ${actual} result took hold.`,
    ])
  }

  return pickInsightTemplate(templateSeed, [
    `You had the winner, but the final ${actual} scoreline moved too far away from your prediction.`,
    `The result became more extreme than your ${predicted} scoreline allowed for.`,
    `${winningSide || 'The winning side'} pushed the scoreline beyond your prediction.`,
  ])
}

function pickInsightTemplate(seed, templates) {
  const index = Math.abs(hashString(seed)) % templates.length
  return templates[index]
}

function hashString(value) {
  return Array.from(String(value)).reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0
  }, 0)
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

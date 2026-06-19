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
          const components = score?.scorelineComponents
          const basePoints = score ? score.main + score.scoreline : null
          const jokerBonus = score && prediction.joker_used ? score.total - basePoints : null
          const insightExplanation = score
            ? insightExplanationFor({ fixture, prediction, score, team1, team2 })
            : ''

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
                  <BreakdownItem label="Exact Score" value={components?.exact ?? null} />
                  <BreakdownItem label="BTTS" value={components?.btts ?? null} />
                  <BreakdownItem
                    label="Margin Band"
                    meta={components ? marginBandLabel(components.marginBandDistance) : null}
                    value={components?.marginBand ?? null}
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

  if (prediction.pick_is_draw) return `${homeName} ${scoreText} ${awayName}`
  if (pickedTeamRecord?.name) return `${pickedTeamRecord.name} ${scoreText}`
  return `No pick ${scoreText}`
}

function formatPoints(points) {
  if (typeof points !== 'number') return points
  return `${points >= 0 ? '+' : ''}${points} pts`
}

function marginBandLabel(distance) {
  if (distance == null) return null
  if (distance === 0) return 'Same band'
  if (distance === 1) return 'One band away'
  return 'Two or more bands away'
}

function insightExplanationFor({ fixture, prediction, score, team1, team2 }) {
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return ''

  const homeName = team1?.name || fixture.home_team || 'Home team'
  const awayName = team2?.name || fixture.away_team || 'Away team'
  const predicted = `${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
  const actual = `${fixture.goals_team1}-${fixture.goals_team2}`
  const actualMargin = fixture.goals_team1 - fixture.goals_team2
  const actualWinner = actualMargin > 0 ? homeName : actualMargin < 0 ? awayName : 'the draw'
  const winningSide = actualWinner === 'the draw' ? null : actualWinner
  const components = score.scorelineComponents
  const templateSeed = `${fixture.id}-${prediction.user_id}-${predicted}-${actual}-${score.scoreline}-${score.main}`

  if (!score.correctPick) {
    return pickInsightTemplate(templateSeed, [
      `The ${actual} result moved away from your ${predicted} prediction, so only scoreline penalties could apply.`,
      `${homeName} vs ${awayName} did not follow your result pick, which kept scoreline rewards off the table.`,
      `Your scoreline read could not earn bonus points because the main result prediction missed.`,
    ])
  }

  if (!components.aligned) {
    return pickInsightTemplate(templateSeed, [
      `You picked the right result, but your scoreline did not align with that selection.`,
      `The winner was right, but the scoreline pointed to a different match outcome.`,
      `Your result pick landed, while the scoreline itself told a different story.`,
    ])
  }

  if (components.exact > 0) {
    return pickInsightTemplate(templateSeed, [
      `You called ${homeName} vs ${awayName} exactly as it unfolded, including the ${actual} scoreline.`,
      `Your ${predicted} prediction nailed the final score.`,
      `You read the full match perfectly, right down to the ${actual} result.`,
    ])
  }

  if (components.btts > 0 && components.marginBand > 0) {
    return pickInsightTemplate(templateSeed, [
      `You correctly backed ${winningSide || actualWinner} and read both the scoring pattern and margin band.`,
      `Your prediction captured the winner, both teams scoring, and the shape of the final margin.`,
      `The result matched your broader read: winner, BTTS, and margin band all landed.`,
    ])
  }

  if (components.btts > 0) {
    return pickInsightTemplate(templateSeed, [
      `You correctly backed ${winningSide || actualWinner} and read the both-teams-to-score pattern.`,
      `The winner was right, and your scoreline correctly anticipated whether both sides would score.`,
      `Your result pick landed, with the BTTS call adding value to the prediction.`,
    ])
  }

  if (components.marginBand > 0) {
    return pickInsightTemplate(templateSeed, [
      `You correctly backed ${winningSide || actualWinner} and matched the final margin band.`,
      `The winner and margin shape matched your prediction, even without the exact scoreline.`,
      `Your result pick landed, and the margin band read was on target.`,
    ])
  }

  return pickInsightTemplate(templateSeed, [
    `You picked the right result, but the final ${actual} scoreline landed away from your detailed read.`,
    `The winner was right, though the scoring pattern did not quite follow your prediction.`,
    `Your result pick held up, but the scoreline components did not add extra points.`,
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

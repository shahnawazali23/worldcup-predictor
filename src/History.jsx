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
                <span>{formatStageName(fixture.stage)}</span>
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
      exactScores: completedResultRows.filter((row) => row.score.scoreline === 2).length,
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
  const winningSide = actualWinner === 'the draw' ? null : actualWinner
  const actualLoser = actualMargin > 0 ? awayName : actualMargin < 0 ? homeName : null
  const predictedWinnerCorrect = predictedWinner === actualWinner
  const predictionError = score.insightDetails.predictionError
  const templateSeed = `${fixture.id}-${prediction.user_id}-${predicted}-${actual}-${score.insightDetails.insightScore}`

  if (score.insight >= 2) {
    if (predictionError === 0) {
      return pickInsightTemplate(templateSeed, [
        `You called ${homeName} vs ${awayName} exactly as it unfolded, including the ${actual} scoreline.`,
        `Your ${predicted} prediction nailed the final score and read the match better than the pre-match forecast.`,
        `You saw the full ${actual} story before kickoff and collected the full Insight reward.`,
      ])
    }

    if (winningSide && predictedWinnerCorrect) {
      return pickInsightTemplate(templateSeed, [
        `You correctly predicted a much bigger ${winningSide} performance than expected and came close to the final result.`,
        `You saw ${winningSide}'s dominant performance before kickoff, with your prediction landing closer to ${actual} than the forecast.`,
        `You anticipated ${winningSide} taking control of the match more clearly than the pre-match forecast suggested.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `You read the final scoreline better than the pre-match forecast, coming close to the ${actual} result.`,
      `Your score prediction captured how the match unfolded more sharply than the expected ${expectedText} outlook.`,
      `You spotted a match pattern the forecast missed and moved close to the final ${actual} scoreline.`,
    ])
  }

  if (score.insight === 1) {
    if (actualMargin === 0 && predictedMargin === 0) {
      return pickInsightTemplate(templateSeed, [
        `You correctly saw ${homeName} and ${awayName} staying level and came close to the final ${actual} result.`,
        `You read the draw well, with your prediction landing nearer to the final score than the pre-match forecast.`,
        `You anticipated a tighter contest between ${homeName} and ${awayName} before kickoff.`,
      ])
    }

    if (Math.abs(actualMargin) > Math.abs(expectedMargin) && predictedWinnerCorrect && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `You anticipated a stronger ${winningSide} performance than expected and came close to the final result.`,
        `You correctly backed ${winningSide} to pull away, even though the final score proved more emphatic.`,
        `You saw ${winningSide} trending in the right direction before kickoff.`,
      ])
    }

    if (fixture.goals_team1 > expected.home || fixture.goals_team2 > expected.away) {
      const teamName = fixture.goals_team1 > expected.home ? homeName : awayName
      return pickInsightTemplate(templateSeed, [
        `You correctly expected more attacking threat from ${teamName} and moved closer to the final ${actual} scoreline.`,
        `${teamName}'s attack showed the edge your prediction was leaning toward before kickoff.`,
        `You saw ${teamName} causing more problems than the forecast allowed for.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `You were closer to the final ${actual} result than the pre-match forecast.`,
      `Your scoreline read moved in the right direction as ${homeName} and ${awayName} played it out.`,
      `You picked up on a match pattern that brought your prediction closer to the final result.`,
    ])
  }

  if (score.insight === 0) {
    if (predictionError <= 1) {
      return pickInsightTemplate(templateSeed, [
        `You were close to the final result, with only a small difference separating your prediction from the ${actual} outcome.`,
        `Your prediction came within a single goal of the final ${actual} scoreline.`,
        `You nearly matched the final score, even if one detail moved away from your prediction.`,
      ])
    }

    if (predictedWinnerCorrect && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `You correctly backed ${winningSide} to win, although the final margin finished differently from your prediction.`,
        `You captured the overall direction of the match, with ${winningSide} getting the result you expected.`,
        `You were right about ${winningSide} winning, even if the scoreline landed elsewhere.`,
      ])
    }

    if (actualMargin === 0 && predictedMargin === 0) {
      return pickInsightTemplate(templateSeed, [
        `You correctly predicted the match would stay level, even though the final scoreline differed from your call.`,
        `You saw ${homeName} and ${awayName} cancelling each other out before kickoff.`,
        `You captured the draw, with the final score adding a little more movement than your prediction expected.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `Your prediction captured part of the match story, but the final ${actual} result moved in a different direction.`,
      `${homeName} and ${awayName} played out differently from your call, leaving your Insight score level.`,
      `Your read was not far enough from the outcome to lose Insight, but the final result still took a different shape.`,
    ])
  }

  if (score.insight < 0) {
    if (predictedWinner !== actualWinner) {
      return pickInsightTemplate(templateSeed, [
        `${actualWinner === 'the draw' ? 'The match stayed level' : `${actualWinner} controlled the result`} far more than your ${predicted} prediction anticipated.`,
        `${actualWinner === 'the draw' ? 'The draw became the story' : `${actualWinner} shaped the match`} while your prediction expected a different outcome.`,
        `${homeName} vs ${awayName} moved away from your predicted winner as the final ${actual} result took hold.`,
      ])
    }

    if (Math.abs(actualMargin) > Math.abs(predictedMargin) && winningSide) {
      return pickInsightTemplate(templateSeed, [
        `${winningSide} delivered a stronger performance than your prediction suggested, with the match finishing ${actual}.`,
        `${winningSide}'s attack proved more decisive than your prediction anticipated.`,
        `The match became more one-sided than your prediction expected, with ${winningSide} pushing beyond your read.`,
      ])
    }

    if (actualLoser) {
      return pickInsightTemplate(templateSeed, [
        `${actualLoser} kept the match tighter than your prediction suggested.`,
        `${homeName} and ${awayName} finished closer than your prediction expected.`,
        `The final ${actual} result was tighter than your prediction allowed for.`,
      ])
    }

    return pickInsightTemplate(templateSeed, [
      `The match unfolded further from your scoreline than expected, ending ${actual}.`,
      `${homeName} and ${awayName} produced a final result that moved away from your prediction.`,
      `Your scoreline read missed how the match would settle, with the final result ending ${actual}.`,
    ])
  }
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

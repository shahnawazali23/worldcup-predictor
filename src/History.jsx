import { memo, useMemo, useState } from 'react'
import { buildFixtureDisplayMeta, compareFixturesTournamentOrder, fixtureParticipant } from './fixtureDisplay'
import { isKnockoutFixture, scoreMatch } from './scoring'
import { resolveTeamFlag } from './teamFlags'
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
          ? scoreMatch(fixture, prediction, data.teamsById)
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
          const knockout = isKnockoutFixture(fixture)
          const resultStatus = getResultStatus(fixture, prediction, score)
          const basePoints = score ? score.main + score.scoreline + score.penalty : null
          const jokerBonus = score && prediction.joker_used ? score.total - basePoints : null

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
                        <span className="flag-mark">DRAW</span>
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
                </div>

                <div className="history-breakdown">
                  <p className="section-label">Points Breakdown</p>
                  <BreakdownItem label="Result Prediction" value={score ? score.main : null} />
                  <BreakdownItem label="Score Prediction" value={score ? score.scoreline : null} />
                  {knockout && <BreakdownItem label="Penalty Prediction" value={score ? score.penalty : null} />}
                  {prediction.joker_used && <BreakdownItem label="Joker Bonus" value={jokerBonus} joker />}
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
      <TeamFlag team={team} />
      <strong>{team?.name || 'TBD'}</strong>
      {team?.isPlaceholder && team.subtitle && !compact && <small>{team.subtitle}</small>}
    </span>
  )
}

function TeamFlag({ team }) {
  const flagValue = resolveTeamFlag(team)
  const flagIsImage = flagValue.startsWith('http') || flagValue.startsWith('/')

  if (!flagValue && team?.isPlaceholder) return null

  if (flagIsImage) {
    return <img alt="" className="flag-mark flag-image" src={flagValue} />
  }

  return (
    <span className="flag-mark">
      {flagValue || team?.code?.slice(0, 6) || team?.short_name?.slice(0, 3) || 'TBD'}
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

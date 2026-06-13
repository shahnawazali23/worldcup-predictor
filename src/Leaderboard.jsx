import { memo, useMemo } from 'react'
import { buildLeaderboard, scoreMatch } from './scoring'
import { fixtureKickoffMs } from './time'

function Leaderboard({ data, session }) {
  const { rows, summaryCards } = useMemo(
    () => buildLeaderboardView(data, session?.user?.id),
    [data, session?.user?.id],
  )

  return (
    <section className="screen-stack competition-leaderboard">
      <div className="leaderboard-page-head">
        <div>
          <h2>Leaderboard</h2>
          <p>Compare points, accuracy and exact scores.</p>
          <small
            className="leaderboard-title-help"
            title="Rank titles unlock from completed result predictions, accuracy, and exact scores."
          >
            Rank titles unlock as tournament results come in.
          </small>
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="competition-summary">
          {summaryCards.map((card) => (
            <div className="competition-summary-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.name}</strong>
              <small>{card.value}</small>
            </div>
          ))}
        </div>
      )}

      <div className="points-table-wrap">
        <table className="points-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Points</th>
              <th>Predictions</th>
              <th>Correct</th>
              <th>Wrong</th>
              <th>Accuracy</th>
              <th>Exact Scores</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                className={[
                  index === 0 ? 'points-table-leader' : '',
                  row.id === session?.user?.id ? 'points-table-current' : '',
                ].filter(Boolean).join(' ')}
                key={row.id}
              >
                <td data-label="Rank">
                  <strong className="table-rank">#{index + 1}</strong>
                </td>
                <td data-label="Player">
                  <div className="table-player">
                    {row.avatar ? (
                      <img alt="" className="avatar table-avatar" src={row.avatar} />
                    ) : (
                      <div className="avatar avatar-initial table-avatar">{initialFor(row.name)}</div>
                    )}
                    <div className="table-player-copy">
                      <strong>{row.name}</strong>
                      <span className="rank-title" title={row.rankTitle.description}>
                        {row.rankTitle.label}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="table-points" data-label="Points">
                  <strong>{row.points}</strong>
                  <span>pts</span>
                </td>
                <td data-label="Predictions">{row.predictionsMade}</td>
                <td data-label="Correct">{row.correctPicks}</td>
                <td data-label="Wrong">{row.wrongPicks}</td>
                <td data-label="Accuracy">{row.accuracy.toFixed(0)}%</td>
                <td data-label="Exact Scores">{row.exactScores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <div className="panel empty-state">No players yet.</div>}
    </section>
  )
}

export default memo(Leaderboard)

function buildLeaderboardView(data, currentUserId) {
  const baseRows = buildLeaderboard(data)
  const fixturesById = Object.fromEntries(data.fixtures.map((fixture) => [fixture.id, fixture]))
  const now = Date.now()
  const analyticsByUser = Object.fromEntries(
    baseRows.map((row) => [
      row.id,
      {
        accuracy: 0,
        correctPicks: 0,
        exactScores: 0,
        finishedPicks: 0,
        predictionsMade: 0,
        wrongPicks: 0,
      },
    ]),
  )

  data.predictions.forEach((prediction) => {
    const fixture = fixturesById[prediction.fixture_id]
    const analytics = analyticsByUser[prediction.user_id]
    if (!fixture || !analytics) return
    if (!isPredictionVisibleForMetrics(prediction, fixture, currentUserId, now)) return
    if (!prediction.picked_team_id && !prediction.pick_is_draw) return

    analytics.predictionsMade += 1
    if (!fixture.is_finished) return

    const score = scoreMatch(fixture, prediction, data.teamsById)
    analytics.finishedPicks += 1
    if (score.correctPick) analytics.correctPicks += 1
    if (!score.correctPick) analytics.wrongPicks += 1
    if (score.scoreline === 3) analytics.exactScores += 1
  })

  const rows = baseRows.map((row) => {
    const analytics = analyticsByUser[row.id]
    return {
      ...row,
      ...analytics,
      accuracy: analytics.finishedPicks
        ? (analytics.correctPicks / analytics.finishedPicks) * 100
        : 0,
      rankTitle: rankTitleFor({
        accuracy: analytics.finishedPicks
          ? (analytics.correctPicks / analytics.finishedPicks) * 100
          : 0,
        exactScores: analytics.exactScores,
        finishedPicks: analytics.finishedPicks,
      }),
    }
  })

  return {
    rows,
    summaryCards: buildSummaryCards(rows),
  }
}

function isPredictionVisibleForMetrics(prediction, fixture, currentUserId, now) {
  if (prediction.user_id === currentUserId) return true
  return fixture.is_finished || fixtureKickoffMs(fixture) <= now
}

function buildSummaryCards(rows) {
  if (rows.length === 0) return []

  const cards = []
  const leader = rows[0]
  cards.push({
    label: 'Leader',
    name: leader.name,
    value: `${leader.points} pts`,
  })

  const completedRows = rows.filter((row) => row.finishedPicks > 0)
  const mostAccurate = maxBy(completedRows, (row) => row.accuracy)
  cards.push({
    label: 'Most Accurate',
    name: mostAccurate?.name || 'No results yet',
    value: mostAccurate ? `${mostAccurate.accuracy.toFixed(0)}%` : '-',
  })

  const mostExact = maxBy(rows, (row) => row.exactScores)
  cards.push({
    label: 'Most Exact Scores',
    name: mostExact?.name || 'No players yet',
    value: `${mostExact?.exactScores || 0}`,
  })

  return cards
}

function maxBy(rows, getValue) {
  return rows.reduce((best, row) => {
    if (!best) return row
    return getValue(row) > getValue(best) ? row : best
  }, null)
}

function initialFor(name) {
  return String(name || 'P').trim().slice(0, 1).toUpperCase()
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

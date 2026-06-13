import { memo, useMemo } from 'react'
import { buildLeaderboard, scoreMatch } from './scoring'
import { fixtureKickoffMs } from './time'

function Leaderboard({ data, session }) {
  const { rows, summaryCards } = useMemo(
    () => buildLeaderboardView(data, session?.user?.id),
    [data, session?.user?.id],
  )

  return (
    <section className="screen-stack leaderboard-screen">
      {summaryCards.length > 0 && (
        <div className="leader-summary-cards">
          {summaryCards.map((card) => (
            <div className="leader-summary-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.name}</strong>
              <small>{card.value}</small>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard">
        {rows.map((row, index) => (
          <article
            className={[
              'leader-row',
              index === 0 ? 'leader' : '',
              row.id === session?.user?.id ? 'current-user' : '',
            ].filter(Boolean).join(' ')}
            key={row.id}
          >
            <div className="rank">#{index + 1}</div>
            {row.avatar ? (
              <img alt="" className="avatar" src={row.avatar} />
            ) : (
              <div className="avatar avatar-initial">{initialFor(row.name)}</div>
            )}
            <div className="leader-main">
              <strong>{row.name}</strong>
              <span>
                {row.predictionsMade} predictions &bull; {row.correctPicks} correct &bull;{' '}
                {row.accuracy.toFixed(0)}% accuracy &bull; {row.exactScores} exact scores
              </span>
            </div>
            <div className="points">
              <strong>{row.points}</strong>
              <span>pts</span>
            </div>
          </article>
        ))}
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
  if (mostAccurate) {
    cards.push({
      label: 'Most Accurate',
      name: mostAccurate.name,
      value: `${mostAccurate.accuracy.toFixed(0)}%`,
    })
  }

  const mostExact = maxBy(completedRows, (row) => row.exactScores)
  if (mostExact?.exactScores > 0) {
    cards.push({
      label: 'Most Exact Scores',
      name: mostExact.name,
      value: `${mostExact.exactScores}`,
    })
  }

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

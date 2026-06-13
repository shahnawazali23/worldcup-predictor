import { memo, useMemo, useState } from 'react'
import { buildLeaderboard, roundMultiplier, scoreMatch } from './scoring'
import { fixtureKickoffMs } from './time'

const SORT_OPTIONS = {
  points: { label: 'Points' },
  accuracy: { label: 'Accuracy' },
  exactScores: { label: 'Exact Scores' },
  upsetPoints: { label: 'Upsets' },
  jokerImpact: { label: 'Joker Impact' },
}

function Leaderboard({ data, session }) {
  const [sortKey, setSortKey] = useState('points')
  const { highlights, rows } = useMemo(
    () => buildLeaderboardAnalytics(data, sortKey, session?.user?.id),
    [data, session?.user?.id, sortKey],
  )
  const leader = rows[0]

  return (
    <section className="screen-stack">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Live table</p>
          <h2>{leader ? `${leader.name} leads on ${leader.points} pts` : 'Leaderboard'}</h2>
          <p>See the picks, scorelines, upsets, and joker swings behind the standings.</p>
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="leader-highlights">
          {highlights.map((highlight) => (
            <div className="leader-highlight-card" key={highlight.label}>
              <span>{highlight.label}</span>
              <strong>{highlight.name}</strong>
              <small>{highlight.detail}</small>
            </div>
          ))}
        </div>
      )}

      <div className="leader-sort" aria-label="Sort leaderboard">
        {Object.entries(SORT_OPTIONS).map(([key, option]) => (
          <button
            className={sortKey === key ? 'active' : ''}
            key={key}
            onClick={() => setSortKey(key)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

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
            {row.avatar ? <img alt="" className="avatar" src={row.avatar} /> : <div className="avatar" />}
            <div className="leader-main">
              <strong>{row.name}</strong>
              <span>
                {row.predictionsMade} predictions · {row.correctPicks} correct · {row.wrongPicks} wrong ·
                {` ${row.accuracy.toFixed(0)}% accuracy`}
              </span>
            </div>
            <div className="leader-metrics" aria-label={`${row.name} leaderboard analytics`}>
              <Metric label="Exact" title="Finished matches where the exact scoreline matched" value={row.exactScores} />
              <Metric label="Result pts" title="Points from the main result prediction" value={formatSigned(row.resultPredictionPoints)} />
              <Metric label="Score pts" title="Points from scoreline prediction only" value={formatSigned(row.scorePredictionPoints)} />
              <Metric label="Upset pts" title="Extra points earned by correctly picking underdogs" value={formatSigned(row.upsetPoints)} />
              <Metric label="Joker impact" title="Points gained or lost because a joker was active" value={formatSigned(row.jokerImpact)} />
            </div>
            <div className="points">{row.points}</div>
          </article>
        ))}
      </div>

      {rows.length === 0 && <div className="panel empty-state">No players yet.</div>}
    </section>
  )
}

export default memo(Leaderboard)

function Metric({ label, title, value }) {
  return (
    <div className="leader-metric" title={title}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function buildLeaderboardAnalytics(data, sortKey, currentUserId) {
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
        resultPredictionPoints: 0,
        scorePredictionPoints: 0,
        upsetPoints: 0,
        jokerImpact: 0,
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
    analytics.resultPredictionPoints += score.main
    analytics.scorePredictionPoints += score.scoreline
    if (score.scoreline === 3) analytics.exactScores += 1

    const favouriteValue = roundMultiplier(fixture)
    const upsetValue = score.correctPick && score.baseMain > 1
      ? Math.max(0, score.main - favouriteValue)
      : 0
    analytics.upsetPoints += upsetValue

    const pointsWithoutJoker = score.main + score.scoreline + score.penalty
    analytics.jokerImpact += score.total - pointsWithoutJoker
  })

  const rows = baseRows.map((row) => ({
    ...row,
    ...analyticsByUser[row.id],
  }))
    .map((row) => ({
      ...row,
      accuracy: row.finishedPicks ? (row.correctPicks / row.finishedPicks) * 100 : 0,
    }))

  const sortedRows = [...rows].sort((a, b) => {
    if (sortKey === 'points') return rows.indexOf(a) - rows.indexOf(b)
    return (
      b[sortKey] - a[sortKey] ||
      b.points - a.points ||
      a.name.localeCompare(b.name)
    )
  })

  return {
    highlights: buildHighlights(rows),
    rows: sortedRows,
  }
}

function isPredictionVisibleForMetrics(prediction, fixture, currentUserId, now) {
  if (prediction.user_id === currentUserId) return true
  return fixture.is_finished || fixtureKickoffMs(fixture) <= now
}

function buildHighlights(rows) {
  const completedRows = rows.filter((row) => row.finishedPicks > 0)
  if (completedRows.length === 0) return []

  const highlights = []
  const mostAccurate = maxBy(completedRows, (row) => row.accuracy)
  if (mostAccurate) {
    highlights.push({
      label: 'Most Accurate',
      name: mostAccurate.name,
      detail: `${mostAccurate.accuracy.toFixed(0)}% from ${mostAccurate.finishedPicks} finished picks`,
    })
  }

  const upsetKing = maxBy(completedRows, (row) => row.upsetPoints)
  if (upsetKing?.upsetPoints > 0) {
    highlights.push({
      label: 'Upset King',
      name: upsetKing.name,
      detail: `${formatSigned(upsetKing.upsetPoints)} upset points`,
    })
  }

  const scorelineSpecialist = maxBy(completedRows, (row) => row.exactScores)
  if (scorelineSpecialist?.exactScores > 0) {
    highlights.push({
      label: 'Scoreline Specialist',
      name: scorelineSpecialist.name,
      detail: `${scorelineSpecialist.exactScores} exact scores`,
    })
  }

  const jokerMaster = maxBy(completedRows, (row) => row.jokerImpact)
  if (jokerMaster?.jokerImpact !== 0) {
    highlights.push({
      label: 'Joker Master',
      name: jokerMaster.name,
      detail: `${formatSigned(jokerMaster.jokerImpact)} points from jokers`,
    })
  }

  return highlights
}

function maxBy(rows, getValue) {
  return rows.reduce((best, row) => {
    if (!best) return row
    return getValue(row) > getValue(best) ? row : best
  }, null)
}

function formatSigned(value) {
  if (value > 0) return `+${value}`
  return String(value)
}

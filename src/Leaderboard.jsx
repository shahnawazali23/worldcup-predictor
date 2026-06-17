import { memo, useMemo } from 'react'
import Icon from './Icon'
import { buildLeaderboard, scoreMatch, winnerIdFromFixture } from './scoring'
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
              <th>Form</th>
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
                  <strong className="table-rank">
                    {index === 0 && <Icon name="trophy" size={16} />}
                    #{index + 1}
                  </strong>
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
                        <Icon name={row.rankTitle.icon} size={14} />
                        {row.rankTitle.label}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="table-points" data-label="Points">
                  <strong>{row.points}</strong>
                  <span>pts</span>
                </td>
                <td data-label="Form">
                  <div className="form-strip" aria-label={`Last five completed scores for ${row.name}`}>
                    {row.form.length > 0
                      ? row.form.map((points, formIndex) => (
                        <span className={formTone(points)} key={`${row.id}-form-${formIndex}`}>
                          {points > 0 ? `+${points}` : points}
                        </span>
                      ))
                      : <small>-</small>}
                  </div>
                </td>
                <td data-label="Correct">{row.correctPicks}</td>
                <td data-label="Wrong">{row.wrongPicks}</td>
                <td className="table-accuracy" data-label="Accuracy">{row.accuracy.toFixed(0)}%</td>
                <td data-label="Exact Scores">{row.exactScores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="panel empty-state">
          <Icon name="users" size={20} />
          <strong>No players yet</strong>
          <span>The table will appear when players join the league.</span>
        </div>
      )}
    </section>
  )
}

export default memo(Leaderboard)

function buildLeaderboardView(data, currentUserId) {
  const baseRows = buildLeaderboard(data)
  const fixturesById = Object.fromEntries(data.fixtures.map((fixture) => [fixture.id, fixture]))
  logFinishedPredictionDebug(data, fixturesById)
  const now = Date.now()
  const analyticsByUser = Object.fromEntries(
    baseRows.map((row) => [
      row.id,
      {
        accuracy: 0,
        correctPicks: 0,
        exactScores: 0,
        finishedPicks: 0,
        form: [],
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

    const score = scoreMatch(fixture, prediction, data.teamsById, data.fixtures)
    analytics.finishedPicks += 1
    analytics.form.push({
      kickoff: fixtureKickoffMs(fixture),
      points: score.total,
    })
    if (score.correctPick) analytics.correctPicks += 1
    if (!score.correctPick) analytics.wrongPicks += 1
    if (score.scorelineError === 0) analytics.exactScores += 1
  })

  const rows = baseRows.map((row) => {
    const analytics = analyticsByUser[row.id]
    return {
      ...row,
      ...analytics,
      accuracy: analytics.finishedPicks
        ? (analytics.correctPicks / analytics.finishedPicks) * 100
        : 0,
      form: analytics.form
        .sort((a, b) => b.kickoff - a.kickoff)
        .slice(0, 5)
        .reverse()
        .map((item) => item.points),
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

function formTone(points) {
  if (points >= 5) return 'form-win'
  if (points > 0) return 'form-positive'
  if (points === 0) return 'form-neutral'
  return 'form-negative'
}

function logFinishedPredictionDebug(data, fixturesById) {
  const shouldLog = import.meta.env.DEV ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('debugLeaderboard') === '1')
  if (!shouldLog) return

  const profilesById = Object.fromEntries(data.profiles.map((profile) => [profile.id, profile]))
  const debugRows = data.predictions
    .map((prediction) => {
      const fixture = fixturesById[prediction.fixture_id]
      if (!fixture?.is_finished) return null

      const score = scoreMatch(fixture, prediction, data.teamsById, data.fixtures)
      const actualWinnerId = winnerIdFromFixture(fixture)
      const pickedTeam = prediction.pick_is_draw ? null : data.teamsById[prediction.picked_team_id]
      const actualWinner = actualWinnerId === 'draw'
        ? 'Draw'
        : data.teamsById[actualWinnerId]?.name || actualWinnerId || 'No winner'

      return {
        fixtureId: fixture.id,
        homeTeam: fixture.home_team,
        awayTeam: fixture.away_team,
        user: profilesById[prediction.user_id]?.email || profilesById[prediction.user_id]?.display_name || prediction.user_id,
        prediction: prediction.pick_is_draw ? 'Draw' : pickedTeam?.name || prediction.picked_team_id || 'No pick',
        pickedTeamId: prediction.picked_team_id,
        actualWinner,
        actualWinnerId,
        pointsAwarded: score.total,
        countedAsCorrect: score.correctPick,
        countedAsWrong: Boolean((prediction.picked_team_id || prediction.pick_is_draw) && !score.correctPick),
      }
    })
    .filter(Boolean)

  console.table(debugRows)
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

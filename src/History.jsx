import { memo, useMemo, useState } from 'react'
import { isKnockoutFixture, scoreMatch } from './scoring'
import { fixtureKickoffDate, fixtureKickoffMs } from './time'

function History({ data, session }) {
  const [now] = useState(() => Date.now())

  const rows = useMemo(() => {
    const predictionsByFixture = Object.fromEntries(
      data.predictions
        .filter((prediction) => prediction.user_id === session.user.id)
        .map((prediction) => [prediction.fixture_id, prediction]),
    )

    return data.fixtures
      .filter((fixture) => fixture.team1_id && fixture.team2_id)
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
      .sort((a, b) => fixtureKickoffMs(b.fixture) - fixtureKickoffMs(a.fixture))
  }, [data, now, session.user.id])

  return (
    <section className="screen-stack">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Your record</p>
          <h2>History</h2>
          <p>Past matches and the picks you locked in.</p>
        </div>
      </div>

      <div className="history-list">
        {rows.map(({ fixture, prediction, score }) => {
          const team1 = data.teamsById[fixture.team1_id]
          const team2 = data.teamsById[fixture.team2_id]
          const pickedTeamRecord = prediction.pick_is_draw
            ? null
            : data.teamsById[prediction.picked_team_id]
          const predictedScore = formatPredictedScore(prediction)
          const knockout = isKnockoutFixture(fixture)
          const resultStatus = getResultStatus(fixture, prediction, score)

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
                  {knockout && <BreakdownItem label="Penalty Call" value={score ? score.penalty : null} />}
                  <BreakdownItem
                    label="Joker Multiplier"
                    value={`x${prediction.joker_used ? 2 : 1}`}
                    plain
                  />
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
    </span>
  )
}

function TeamFlag({ team }) {
  const flagValue = team?.flag || ''
  const flagIsImage = flagValue.startsWith('http') || flagValue.startsWith('/')

  if (flagIsImage) {
    return <img alt="" className="flag-mark flag-image" src={flagValue} />
  }

  return (
    <span className="flag-mark">
      {flagValue || team?.short_name?.slice(0, 3) || 'TBD'}
    </span>
  )
}

export default memo(History)

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

function BreakdownItem({ label, plain = false, value }) {
  return (
    <div className="history-breakdown-line">
      <span>{label}</span>
      <strong>
        {value == null
          ? 'Pending'
          : plain
            ? value
            : `${value >= 0 ? '+' : ''}${value}`}
      </strong>
    </div>
  )
}

function formatPredictedScore(prediction) {
  if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return 'No score prediction'
  return `Score ${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`
}

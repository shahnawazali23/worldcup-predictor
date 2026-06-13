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
          const pickedTeam = prediction.pick_is_draw
            ? 'Draw'
            : data.teamsById[prediction.picked_team_id]?.name || 'No main pick'
          const predictedScore = formatPredictedScore(prediction)
          const actualResult = formatActualResult(fixture, team1, team2)
          const knockout = isKnockoutFixture(fixture)

          return (
            <article className="history-row" key={fixture.id}>
              <div className="history-match">
                <span>{fixture.stage}</span>
                <strong>
                  {team1?.name || 'TBD'} vs {team2?.name || 'TBD'}
                </strong>
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
                    <strong>{pickedTeam}</strong>
                    <span>{predictedScore}</span>
                  </div>
                  <div>
                    <small>Actual Result</small>
                    <strong>{actualResult}</strong>
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

export default memo(History)

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

function formatActualResult(fixture, team1, team2) {
  if (!fixture.is_finished || fixture.goals_team1 == null || fixture.goals_team2 == null) return 'Pending'
  return `${team1?.short_name || team1?.name || 'TBD'} ${fixture.goals_team1}-${fixture.goals_team2} ${team2?.short_name || team2?.name || 'TBD'}`
}

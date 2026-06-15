import { useMemo, useState } from 'react'
import { saveFixtureResult, saveTeam } from './data'
import { fixtureParticipant } from './fixtureDisplay'
import { calculateInsightBonus, expectedScoreForFixture, isKnockoutFixture } from './scoring'

export default function Admin({ data, onRefresh }) {
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')

  const latestSync = data.syncRuns[0]
  const finishedCount = data.fixtures.filter((fixture) => fixture.is_finished).length
  const unresolved = useMemo(() => {
    return data.fixtures.filter((fixture) => fixture.is_finished && !fixture.result_confirmed)
  }, [data.fixtures])
  const insightDebugRows = useMemo(() => {
    return buildInsightDebugRows(data)
  }, [data])
  const expectedValidation = useMemo(() => {
    return buildExpectedValidation(data)
  }, [data])

  async function updateFixture(fixture, formData) {
    const goals1 = toNullableNumber(formData.get('goals_team1'))
    const goals2 = toNullableNumber(formData.get('goals_team2'))
    const advancingTeamId = formData.get('advancing_team_id') || null
    const winnerTeamId = goals1 == null || goals2 == null || goals1 === goals2
      ? null
      : goals1 > goals2
        ? fixture.team1_id
        : fixture.team2_id

    setSaving(fixture.id)
    setMessage('')
    try {
      await saveFixtureResult(fixture.id, {
        goals_team1: goals1,
        goals_team2: goals2,
        winner_team_id: winnerTeamId,
        advancing_team_id: advancingTeamId,
        is_draw: goals1 != null && goals2 != null && goals1 === goals2,
        is_finished: formData.get('is_finished') === 'on',
        went_to_penalties: formData.get('went_to_penalties') === 'blank'
          ? null
          : formData.get('went_to_penalties') === 'yes',
        result_confirmed: formData.get('result_confirmed') === 'on',
      })
      await onRefresh()
      setMessage('Result saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving('')
    }
  }

  async function updateRank(team, formData) {
    setSaving(team.id)
    setMessage('')
    try {
      await saveTeam(team.id, { fifa_rank: Number(formData.get('fifa_rank')) })
      await onRefresh()
      setMessage('Ranking saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving('')
    }
  }

  return (
    <section className="screen-stack">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Admin console</p>
          <h2>Confirm results before the table moves.</h2>
          <p>
            API data can be synced into Supabase, then reviewed here before scoring is considered
            final.
          </p>
        </div>
        <div className="stat-strip">
          <div>
            <span>{finishedCount}</span>
            <small>Finished</small>
          </div>
          <div>
            <span>{unresolved.length}</span>
            <small>Needs review</small>
          </div>
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="admin-grid">
        <section className="panel">
          <h3>API sync</h3>
          <p className="muted">
            Latest sync: {latestSync ? `${latestSync.provider} · ${latestSync.status}` : 'none yet'}
          </p>
          <p className="muted">
            Use a Supabase Edge Function or scheduled job to call your football provider, normalize
            the payload with <code>src/apiAdapter.js</code>, and upsert into these tables.
          </p>
        </section>

        <section className="panel">
          <h3>Fixed FIFA rankings</h3>
          <div className="team-rank-list">
            {data.teams.slice(0, 12).map((team) => (
              <form action={(formData) => updateRank(team, formData)} className="rank-form" key={team.id}>
                <span>{team.name}</span>
                <input defaultValue={team.fifa_rank} min="1" name="fifa_rank" type="number" />
                <button disabled={saving === team.id} type="submit">
                  Save
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>Results</h3>
        <div className="result-list">
          {data.fixtures.map((fixture) => {
            const team1 = fixtureParticipant({ fixture, side: 'home', teamsById: data.teamsById })
            const team2 = fixtureParticipant({ fixture, side: 'away', teamsById: data.teamsById })
            const knockout = isKnockoutFixture(fixture)
            const expected = fixture.is_finished
              ? expectedScoreForFixture(fixture, data.teamsById, data.fixtures)
              : null

            return (
              <form
                action={(formData) => updateFixture(fixture, formData)}
                className="result-form"
                key={fixture.id}
              >
                <div>
                  <strong>
                    {team1.name} vs {team2.name}
                  </strong>
                  <span>{fixture.stage}</span>
                  {expected && <span>Expected {expected.home}-{expected.away}</span>}
                </div>
                <input defaultValue={fixture.goals_team1 ?? ''} min="0" name="goals_team1" type="number" />
                <input defaultValue={fixture.goals_team2 ?? ''} min="0" name="goals_team2" type="number" />
                {knockout && (
                  <select defaultValue={fixture.advancing_team_id || ''} name="advancing_team_id">
                    <option value="">Advancer</option>
                    {fixture.team1_id && <option value={fixture.team1_id}>{team1.name}</option>}
                    {fixture.team2_id && <option value={fixture.team2_id}>{team2.name}</option>}
                  </select>
                )}
                {knockout && (
                  <select
                    defaultValue={
                      fixture.went_to_penalties == null
                        ? 'blank'
                        : fixture.went_to_penalties
                          ? 'yes'
                          : 'no'
                    }
                    name="went_to_penalties"
                  >
                    <option value="blank">Pens blank</option>
                    <option value="yes">Pens yes</option>
                    <option value="no">Pens no</option>
                  </select>
                )}
                <label>
                  <input defaultChecked={fixture.is_finished} name="is_finished" type="checkbox" />
                  FT
                </label>
                <label>
                  <input
                    defaultChecked={fixture.result_confirmed}
                    name="result_confirmed"
                    type="checkbox"
                  />
                  Confirm
                </label>
                <button disabled={saving === fixture.id} type="submit">
                  Save
                </button>
              </form>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Expected Score Validation</h3>
        <p className="muted">
          Completed fixtures only, sorted by largest model error. Use this before enabling Insight
          Bonus.
        </p>
        <div className="model-error-summary">
          <div>
            <span>Average Model Error</span>
            <strong>{formatDecimal(expectedValidation.averageError)}</strong>
          </div>
          <div>
            <span>Median Model Error</span>
            <strong>{formatDecimal(expectedValidation.medianError)}</strong>
          </div>
        </div>
        <div className="insight-debug-table-wrap">
          <table className="insight-debug-table">
            <thead>
              <tr>
                <th>Fixture</th>
                <th>Expected Score</th>
                <th>Actual Score</th>
                <th>Model Error</th>
              </tr>
            </thead>
            <tbody>
              {expectedValidation.rows.map((row) => (
                <tr key={row.fixtureId}>
                  <td>{row.fixture}</td>
                  <td>{row.expected}</td>
                  <td>{row.actual}</td>
                  <td>{row.modelError}</td>
                </tr>
              ))}
              {expectedValidation.rows.length === 0 && (
                <tr>
                  <td colSpan="4">No completed fixtures yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3>Insight Debug</h3>
        <p className="muted">
          Admin-only audit for completed predictions. Expected scores are hidden from players until
          matches are complete.
        </p>
        <div className="insight-debug-table-wrap">
          <table className="insight-debug-table">
            <thead>
              <tr>
                <th>Fixture</th>
                <th>Player</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Prediction</th>
                <th>Model Error</th>
                <th>Prediction Error</th>
                <th>Insight Score</th>
                <th>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {insightDebugRows.map((row) => (
                <tr key={`${row.fixtureId}-${row.predictionId}`}>
                  <td>{row.fixture}</td>
                  <td>{row.player}</td>
                  <td>{row.expected}</td>
                  <td>{row.actual}</td>
                  <td>{row.prediction}</td>
                  <td>{row.modelError}</td>
                  <td>{row.predictionError}</td>
                  <td>{row.insightScore}</td>
                  <td>{formatSigned(row.bonus)}</td>
                </tr>
              ))}
              {insightDebugRows.length === 0 && (
                <tr>
                  <td colSpan="9">No completed scoreline predictions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function toNullableNumber(value) {
  return value === '' || value == null ? null : Number(value)
}

function buildInsightDebugRows(data) {
  const fixturesById = Object.fromEntries(data.fixtures.map((fixture) => [fixture.id, fixture]))
  const profilesById = Object.fromEntries(data.profiles.map((profile) => [profile.id, profile]))

  return data.predictions
    .map((prediction) => {
      const fixture = fixturesById[prediction.fixture_id]
      if (!fixture?.is_finished) return null
      if (prediction.pred_goals_team1 == null || prediction.pred_goals_team2 == null) return null

      const expected = expectedScoreForFixture(fixture, data.teamsById, data.fixtures)
      const insight = calculateInsightBonus(fixture, prediction, data.teamsById, data.fixtures)
      const profile = profilesById[prediction.user_id]

      return {
        actual: `${fixture.goals_team1}-${fixture.goals_team2}`,
        bonus: insight.bonus,
        expected: `${expected.home}-${expected.away}`,
        fixture: `${fixture.home_team} vs ${fixture.away_team}`,
        fixtureId: fixture.id,
        insightScore: insight.insightScore,
        modelError: insight.modelError,
        player: profile?.display_name || profile?.email || prediction.user_id,
        prediction: `${prediction.pred_goals_team1}-${prediction.pred_goals_team2}`,
        predictionError: insight.predictionError,
        predictionId: prediction.id,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.fixture.localeCompare(b.fixture) || a.player.localeCompare(b.player))
}

function buildExpectedValidation(data) {
  const rows = data.fixtures
    .filter((fixture) => fixture.is_finished && fixture.goals_team1 != null && fixture.goals_team2 != null)
    .map((fixture) => {
      const expected = expectedScoreForFixture(fixture, data.teamsById, data.fixtures)
      const modelError = Math.abs(expected.home - fixture.goals_team1) +
        Math.abs(expected.away - fixture.goals_team2)

      return {
        actual: `${fixture.goals_team1}-${fixture.goals_team2}`,
        expected: `${expected.home}-${expected.away}`,
        fixture: `${fixture.home_team} vs ${fixture.away_team}`,
        fixtureId: fixture.id,
        modelError,
      }
    })
    .sort((a, b) => b.modelError - a.modelError || a.fixture.localeCompare(b.fixture))

  return {
    averageError: average(rows.map((row) => row.modelError)),
    medianError: median(rows.map((row) => row.modelError)),
    rows,
  }
}

function formatSigned(value) {
  return `${value >= 0 ? '+' : ''}${value}`
}

function average(values) {
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}

function median(values) {
  if (values.length === 0) return null

  const sorted = values.slice().sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function formatDecimal(value) {
  if (value == null) return '-'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

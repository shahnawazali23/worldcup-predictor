import { useMemo, useState } from 'react'
import { saveFixtureResult, saveTeam } from './data'
import { fixtureParticipant } from './fixtureDisplay'
import { isKnockoutFixture } from './scoring'

export default function Admin({ data, onRefresh }) {
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')

  const latestSync = data.syncRuns[0]
  const finishedCount = data.fixtures.filter((fixture) => fixture.is_finished).length
  const unresolved = useMemo(() => {
    return data.fixtures.filter((fixture) => fixture.is_finished && !fixture.result_confirmed)
  }, [data.fixtures])

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
    </section>
  )
}

function toNullableNumber(value) {
  return value === '' || value == null ? null : Number(value)
}

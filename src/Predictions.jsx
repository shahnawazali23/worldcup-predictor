import { useEffect, useMemo, useState } from 'react'
import { savePrediction } from './data'
import { possibleMainPickPoints, predictionPotential } from './predictionPreview'
import { buildLeaderboard, isKnockoutFixture, remainingJokers, roundMultiplier, scoreMatch } from './scoring'
import { fixtureKickoffDate, fixtureKickoffMs } from './time'

function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])

  return now
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Locked'
  const seconds = Math.floor(ms / 1000)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  return `${hours}h ${minutes}m ${remainingSeconds}s`
}

export default function Predictions({ active = true, data, onPredictionSaved, session }) {
  const [savingFixtureId, setSavingFixtureId] = useState(null)
  const [error, setError] = useState('')
  const [optimisticPredictions, setOptimisticPredictions] = useState({})
  const [jokerOverrides, setJokerOverrides] = useState({})
  const [savedFixtureId, setSavedFixtureId] = useState(null)
  const now = useNow(active)

  useEffect(() => {
    if (!savedFixtureId) return undefined
    const timer = setTimeout(() => setSavedFixtureId(null), 1800)
    return () => clearTimeout(timer)
  }, [savedFixtureId])

  const userPredictions = useMemo(() => {
    const savedPredictions = data.predictions.filter(
      (prediction) => prediction.user_id === session.user.id,
    )
    const mergedByFixture = Object.fromEntries(
      savedPredictions.map((prediction) => [prediction.fixture_id, prediction]),
    )

    Object.entries(optimisticPredictions).forEach(([fixtureId, prediction]) => {
      mergedByFixture[fixtureId] = prediction
    })

    return Object.values(mergedByFixture)
  }, [data.predictions, optimisticPredictions, session.user.id])

  const predictionsByFixture = useMemo(() => {
    return Object.fromEntries(userPredictions.map((prediction) => [prediction.fixture_id, prediction]))
  }, [userPredictions])

  const jokersLeft = remainingJokers(data.predictions, session.user.id)
  const leaderboardRows = useMemo(() => buildLeaderboard(data), [data])
  const currentRank = leaderboardRows.findIndex((row) => row.id === session.user.id) + 1
  const currentRow = leaderboardRows.find((row) => row.id === session.user.id)
  const currentStreak = useMemo(() => {
    const predictionsByFixture = Object.fromEntries(
      userPredictions.map((prediction) => [prediction.fixture_id, prediction]),
    )
    const finishedRows = data.fixtures
      .filter((fixture) => fixture.is_finished)
      .sort((a, b) => fixtureKickoffMs(b) - fixtureKickoffMs(a))

    let streak = 0
    for (const fixture of finishedRows) {
      const prediction = predictionsByFixture[fixture.id]
      if (!prediction) break
      const score = scoreMatch(fixture, prediction, data.teamsById)
      if (!score.correctPick) break
      streak += 1
    }
    return streak
  }, [data.fixtures, data.teamsById, userPredictions])
  const visibleFixtures = data.fixtures
    .filter((fixture) => fixture.team1_id && fixture.team2_id)
    .filter((fixture) => fixtureKickoffMs(fixture) > now)
  async function updatePrediction(fixture, updates) {
    const existing = predictionsByFixture[fixture.id]
    const kickoffMs = fixtureKickoffMs(fixture)
    const lockMs = kickoffMs - 60 * 1000
    const locked = now >= lockMs

    if (locked) {
      setError('This match is locked because kickoff has passed.')
      return
    }

    if (updates.joker_used && !existing?.joker_used && jokersLeft <= 0) {
      setError('You have already used all 3 jokers.')
      return
    }

    setSavingFixtureId(fixture.id)
    setError('')
    if (Object.prototype.hasOwnProperty.call(updates, 'joker_used')) {
      setJokerOverrides((current) => ({
        ...current,
        [fixture.id]: updates.joker_used,
      }))
    }
    setOptimisticPredictions((current) => ({
      ...current,
      [fixture.id]: {
        ...existing,
        user_id: session.user.id,
        fixture_id: fixture.id,
        ...updates,
      },
    }))

    try {
      const savedPrediction = await savePrediction({ fixture, prediction: existing, session, updates })
      onPredictionSaved(savedPrediction)
      setSavedFixtureId(fixture.id)
      setOptimisticPredictions((current) => {
        const next = { ...current }
        delete next[fixture.id]
        return next
      })
      if (Object.prototype.hasOwnProperty.call(updates, 'joker_used')) {
        setJokerOverrides((current) => {
          const next = { ...current }
          delete next[fixture.id]
          return next
        })
      }
    } catch (saveError) {
      setOptimisticPredictions((current) => {
        const next = { ...current }
        delete next[fixture.id]
        return next
      })
      setError(saveError.message)
      if (Object.prototype.hasOwnProperty.call(updates, 'joker_used')) {
        setJokerOverrides((current) => {
          const next = { ...current }
          delete next[fixture.id]
          return next
        })
      }
    } finally {
      setSavingFixtureId(null)
    }
  }

  return (
    <section className="screen-stack predictions-screen">
      <div className="hero-band">
        <div>
          <p className="eyebrow">Prediction League</p>
          <h2>68 Matches. 3 Jokers. One Champion.</h2>
          <p>
            Main picks, exact scores, penalty calls and three dangerous jokers. Locks happen at
            kickoff.
          </p>
        </div>
        <div className="stat-strip">
          <div>
            <span>{currentRank ? `#${currentRank}` : '-'}</span>
            <small>Current rank</small>
          </div>
          <div>
            <span>{currentRow ? `${currentRow.accuracy.toFixed(0)}%` : '-'}</span>
            <small>Accuracy</small>
          </div>
          <div>
            <span>{currentStreak}</span>
            <small>Current streak</small>
          </div>
          <div>
            <span>{jokersLeft}</span>
            <small>Jokers left</small>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="fixtures-grid">
        {visibleFixtures.map((fixture, index) => {
          const team1 = data.teamsById[fixture.team1_id]
          const team2 = data.teamsById[fixture.team2_id]
          const savedPrediction = predictionsByFixture[fixture.id] || {}
          const prediction = {
            ...savedPrediction,
            joker_used: Object.prototype.hasOwnProperty.call(jokerOverrides, fixture.id)
              ? jokerOverrides[fixture.id]
              : savedPrediction.joker_used,
          }
          const kickoffMs = fixtureKickoffMs(fixture)
          const lockMs = kickoffMs - 60 * 1000
          const locked = now >= lockMs
          const knockout = isKnockoutFixture(fixture)
          const pickedDraw = prediction.pick_is_draw
          const pickedTeam1 = prediction.picked_team_id === fixture.team1_id
          const pickedTeam2 = prediction.picked_team_id === fixture.team2_id
          const isFeatured = index === 0
          const team1Points = possibleMainPickPoints(fixture, fixture.team1_id, data.teamsById)
          const team2Points = possibleMainPickPoints(fixture, fixture.team2_id, data.teamsById)
          const drawPoints = possibleMainPickPoints(fixture, 'draw', data.teamsById)
          const potential = predictionPotential({ fixture, prediction, teamsById: data.teamsById })

          return (
            <article className={isFeatured ? 'fixture-card fixture-card-featured' : 'fixture-card'} key={fixture.id}>
              <div className="fixture-head">
                <div>
                  {isFeatured && <p className="live-label">Next match</p>}
                  <p className="fixture-stage">
                    {fixture.stage}
                    {roundMultiplier(fixture) > 1 && ` x${roundMultiplier(fixture)}`}
                  </p>
                  <time>
                    {fixtureKickoffDate(fixture).toLocaleString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <CountdownBadge
                  isFinished={fixture.is_finished}
                  isLocked={locked}
                  ms={lockMs - now}
                  result={`${fixture.goals_team1}-${fixture.goals_team2}`}
                />
              </div>

              <div className="main-pick-panel">
                <p className="section-label">Main pick</p>
                <div className={knockout ? 'main-pick-row knockout-pick-row' : 'main-pick-row'}>
                <TeamPick
                  disabled={locked || savingFixtureId === fixture.id}
                  isPicked={pickedTeam1}
                  onClick={() =>
                    updatePrediction(fixture, {
                      picked_team_id: fixture.team1_id,
                      pick_is_draw: false,
                    })
                  }
                  points={team1Points}
                  upset={team1Points > roundMultiplier(fixture)}
                  team={team1}
                />

                  {!knockout && (
                    <button
                      className={pickedDraw ? 'draw-pick picked' : 'draw-pick'}
                      disabled={locked || savingFixtureId === fixture.id}
                      onClick={() =>
                        updatePrediction(fixture, {
                          picked_team_id: null,
                          pick_is_draw: true,
                        })
                      }
                      type="button"
                    >
                      <span>Draw</span>
                      <small>{formatPoints(drawPoints)}</small>
                    </button>
                  )}

                <TeamPick
                  disabled={locked || savingFixtureId === fixture.id}
                  isPicked={pickedTeam2}
                  onClick={() =>
                    updatePrediction(fixture, {
                      picked_team_id: fixture.team2_id,
                      pick_is_draw: false,
                    })
                  }
                  points={team2Points}
                  upset={team2Points > roundMultiplier(fixture)}
                  team={team2}
                />
                </div>
              </div>

              <PotentialPointsPanel fixture={fixture} potential={potential} prediction={prediction} />

              <div className="bonus-panel">
                <div>
                  <p className="section-label">Scoreline prediction (bonus)</p>
                </div>
                <div className="scoreline-row">
                  <ScoreTeamLabel team={team1} />
                  <input
                    aria-label={`${team1?.name || 'Team 1'} score`}
                    disabled={locked || savingFixtureId === fixture.id}
                    inputMode="numeric"
                    min="0"
                    onChange={(event) =>
                      updatePrediction(fixture, {
                        pred_goals_team1:
                          event.target.value === '' ? null : Number(event.target.value),
                      })
                    }
                    placeholder="-"
                    type="number"
                    value={prediction.pred_goals_team1 ?? ''}
                  />
                  <span className="score-separator">-</span>
                  <input
                    aria-label={`${team2?.name || 'Team 2'} score`}
                    disabled={locked || savingFixtureId === fixture.id}
                    inputMode="numeric"
                    min="0"
                    onChange={(event) =>
                      updatePrediction(fixture, {
                        pred_goals_team2:
                          event.target.value === '' ? null : Number(event.target.value),
                      })
                    }
                    placeholder="-"
                    type="number"
                    value={prediction.pred_goals_team2 ?? ''}
                  />
                  <ScoreTeamLabel alignRight team={team2} />
                </div>
              </div>

              <div className="fixture-options">
                {(pickedTeam1 || pickedTeam2 || pickedDraw) && (
                  <button
                    className="choice"
                    disabled={locked || savingFixtureId === fixture.id}
                    onClick={() =>
                      updatePrediction(fixture, {
                        picked_team_id: null,
                        pick_is_draw: false,
                      })
                    }
                    type="button"
                  >
                    Clear pick
                  </button>
                )}

                {knockout && (
                  <select
                    disabled={locked || savingFixtureId === fixture.id}
                    onChange={(event) =>
                      updatePrediction(fixture, {
                        penalty_call: event.target.value || null,
                      })
                    }
                    value={prediction.penalty_call || ''}
                  >
                    <option value="">Pens: blank</option>
                    <option value="yes">Pens: yes</option>
                    <option value="no">Pens: no</option>
                  </select>
                )}

                <button
                  aria-pressed={prediction.joker_used || false}
                  className={prediction.joker_used ? 'joker active' : 'joker'}
                  disabled={locked || savingFixtureId === fixture.id}
                  onClick={() =>
                    updatePrediction(fixture, {
                      joker_used: !prediction.joker_used,
                    })
                  }
                  type="button"
                >
                  <span className="joker-card" aria-hidden="true">
                    <img
                      alt=""
                      onError={(event) => {
                        event.currentTarget.hidden = true
                      }}
                      src="/joker-card.jpg"
                    />
                  </span>
                  <span>
                    <strong>{prediction.joker_used ? 'Joker armed' : 'Play Joker'}</strong>
                    <small>
                      {prediction.joker_used ? 'Potential points x2' : `${jokersLeft} jokers left`}
                    </small>
                  </span>
                  {prediction.joker_used && (
                    <span className="joker-check" aria-hidden="true">
                      x2
                    </span>
                  )}
                </button>
              </div>

              <div className="fixture-foot">
                <span>
                  {fixture.venue || fixture.group_name || 'Fixture'} · locks 1 min before kickoff
                </span>
                <strong>
                  {pickedDraw
                    ? 'Picked: Draw'
                    : pickedTeam1
                      ? `Picked: ${team1?.name || 'TBD'}`
                      : pickedTeam2
                        ? `Picked: ${team2?.name || 'TBD'}`
                        : 'No pick yet'}
                </strong>
                {savedFixtureId === fixture.id && <em className="saved-badge">Saved</em>}
              </div>
            </article>
          )
        })}
      </div>

      {visibleFixtures.length === 0 && (
        <div className="panel empty-state">
          No upcoming fixtures. Past matches are now in History.
        </div>
      )}
    </section>
  )
}

function CountdownBadge({ isFinished, isLocked, ms, result }) {
  const urgent = ms > 0 && ms <= 60 * 60 * 1000
  const soon = ms > 60 * 60 * 1000 && ms <= 24 * 60 * 60 * 1000
  const className = [
    'countdown-badge',
    isLocked ? 'countdown-locked' : '',
    urgent ? 'countdown-urgent' : '',
    soon ? 'countdown-soon' : '',
  ].filter(Boolean).join(' ')

  if (isFinished) {
    return (
      <span className="countdown-badge countdown-locked">
        <small>Full time</small>
        <strong>{result}</strong>
      </span>
    )
  }

  return (
    <span className={className}>
      <small>{isLocked ? 'Locked' : 'Locks in'}</small>
      <strong>{formatCountdown(ms)}</strong>
    </span>
  )
}

function PotentialPointsPanel({ fixture, potential, prediction }) {
  const knockout = isKnockoutFixture(fixture)
  const hasPenaltyCall = knockout && Boolean(prediction?.penalty_call)

  return (
    <details className="potential-panel">
      <summary>
        <span>Potential Points</span>
        <strong>{formatPoints(potential.total)}</strong>
      </summary>
      <div className="potential-breakdown">
        <BreakdownLine label="Result Prediction" value={`+${potential.main}`} active={potential.hasMainPick} />
        <BreakdownLine label="Score Prediction" value={`+${potential.scoreline}`} active={potential.hasScoreline} />
        {knockout && (
          <BreakdownLine label="Penalty Prediction" value={hasPenaltyCall ? '+5' : '+0'} active={hasPenaltyCall} />
        )}
        <BreakdownLine label="Joker Multiplier" value={`x${potential.multiplier}`} active={potential.multiplier > 1} joker />
      </div>
    </details>
  )
}

function BreakdownLine({ active, joker = false, label, value }) {
  return (
    <div className={active ? 'breakdown-line active' : 'breakdown-line'}>
      <span>{label}</span>
      <strong className={joker && active ? 'joker-value' : ''}>{value}</strong>
    </div>
  )
}

function TeamPick({ disabled, isPicked, onClick, points, team, upset }) {
  const flag = <TeamFlag team={team} />

  return (
    <button
      className={isPicked ? 'team-pick picked' : 'team-pick'}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="team-pick-flag">{flag}</span>
      <span className="team-pick-main">
        <strong>{team?.name || 'TBD'}</strong>
        <small>{team?.short_name || 'TBD'}</small>
      </span>
      <span className="rank-badge">FIFA #{team?.fifa_rank ?? '-'}</span>
      <span className="team-pick-points">{formatPoints(points)}</span>
      {upset && <span className="upset-badge">Upset value</span>}
      {isPicked && <span className="selected-badge">Selected</span>}
    </button>
  )
}

function ScoreTeamLabel({ alignRight = false, team }) {
  return (
    <span className={alignRight ? 'score-team score-team-right' : 'score-team'}>
      <TeamFlag team={team} />
      <strong>{team?.short_name || team?.name || 'TBD'}</strong>
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

function formatPoints(points) {
  return `${Number.isInteger(points) ? points : points.toFixed(1)} pts`
}

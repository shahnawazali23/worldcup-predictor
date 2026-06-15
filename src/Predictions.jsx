import { useEffect, useMemo, useState } from 'react'
import { savePrediction } from './data'
import {
  buildFixtureDisplayMeta,
  compareFixturesTournamentOrder,
  formatGroupName,
  fixtureMatchLabel,
  fixtureParticipant,
  hasAssignedTeams,
} from './fixtureDisplay'
import { possibleMainPickPoints, predictionPotential } from './predictionPreview'
import { buildLeaderboard, isKnockoutFixture, remainingJokers, scoreMatch } from './scoring'
import TeamFlag from './TeamFlag'
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

function formatFixtureContext(fixture, bracketLabel) {
  return formatGroupName(fixture.group_name) ||
    fixture.venue ||
    bracketLabel ||
    'Fixture'
}

function isPredictionComplete(prediction = {}) {
  const hasWinner = Boolean(prediction.picked_team_id || prediction.pick_is_draw)
  const hasHomeScore = prediction.pred_goals_team1 != null
  const hasAwayScore = prediction.pred_goals_team2 != null
  return hasWinner && hasHomeScore && hasAwayScore
}

export default function Predictions({ active = true, data, onPredictionSaved, session }) {
  const [savingFixtureId, setSavingFixtureId] = useState(null)
  const [error, setError] = useState('')
  const [optimisticPredictions, setOptimisticPredictions] = useState({})
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

  const jokersLeft = remainingJokers(userPredictions, session.user.id)
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
  const fixtureDisplayMeta = useMemo(() => buildFixtureDisplayMeta(data.fixtures), [data.fixtures])
  const visibleFixtures = data.fixtures
    .filter((fixture) => fixtureKickoffMs(fixture) > now)
    .slice()
    .sort(compareFixturesTournamentOrder)
  function updatePrediction(fixture, updates) {
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

    setError('')
    setOptimisticPredictions((current) => ({
      ...current,
      [fixture.id]: {
        ...existing,
        user_id: session.user.id,
        fixture_id: fixture.id,
        ...updates,
      },
    }))
  }

  async function saveDraftPrediction(fixture, prediction) {
    const kickoffMs = fixtureKickoffMs(fixture)
    const lockMs = kickoffMs - 60 * 1000
    const locked = now >= lockMs

    if (locked) {
      setError('This match is locked because kickoff has passed.')
      return
    }

    if (!isPredictionComplete(prediction)) {
      setError('Pick a winner and enter both scores before saving.')
      return
    }

    setSavingFixtureId(fixture.id)
    setError('')
    try {
      const savedPrediction = await savePrediction({
        fixture,
        prediction: {},
        session,
        updates: prediction,
      })
      onPredictionSaved(savedPrediction)
      setSavedFixtureId(fixture.id)
      setOptimisticPredictions((current) => {
        const next = { ...current }
        delete next[fixture.id]
        return next
      })
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingFixtureId(null)
    }
  }

  return (
    <section className="screen-stack predictions-screen">
      <div className="prediction-summary-strip stat-strip" aria-label="Prediction summary">
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

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="fixtures-grid">
        {visibleFixtures.map((fixture, index) => {
          const teamsAssigned = hasAssignedTeams(fixture)
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
          const bracketLabel = fixtureMatchLabel(fixture, fixtureDisplayMeta.sequenceByFixtureId)
          const savedPrediction = predictionsByFixture[fixture.id] || {}
          const prediction = savedPrediction
          const kickoffMs = fixtureKickoffMs(fixture)
          const lockMs = kickoffMs - 60 * 1000
          const locked = now >= lockMs
          const knockout = isKnockoutFixture(fixture)
          const pickedDraw = prediction.pick_is_draw
          const pickedTeam1 = teamsAssigned && prediction.picked_team_id === fixture.team1_id
          const pickedTeam2 = teamsAssigned && prediction.picked_team_id === fixture.team2_id
          const isFeatured = index === 0
          const team1Points = teamsAssigned ? possibleMainPickPoints(fixture, fixture.team1_id, data.teamsById) : 0
          const team2Points = teamsAssigned ? possibleMainPickPoints(fixture, fixture.team2_id, data.teamsById) : 0
          const drawPoints = possibleMainPickPoints(fixture, 'draw', data.teamsById)
          const potential = predictionPotential({ fixture, prediction, teamsById: data.teamsById })
          const canSave = teamsAssigned &&
            !locked &&
            savingFixtureId !== fixture.id &&
            isPredictionComplete(prediction)
          const justSaved = savedFixtureId === fixture.id
          const fixtureContext = formatFixtureContext(fixture, bracketLabel)

          return (
            <article className={isFeatured ? 'fixture-card fixture-card-featured' : 'fixture-card'} key={fixture.id}>
              <div className="fixture-head">
                <div>
                  {isFeatured && <p className="live-label">Next match</p>}
                  <p className="fixture-stage">
                    {bracketLabel || fixture.stage}
                  </p>
                  {bracketLabel && <p className="fixture-stage-detail">{fixture.stage}</p>}
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
                  disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
                  isPicked={pickedTeam1}
                  onClick={() =>
                    updatePrediction(fixture, {
                      picked_team_id: fixture.team1_id,
                      pick_is_draw: false,
                    })
                  }
                  points={team1Points}
                  team={team1}
                />

                  {!knockout && (
                    <button
                      className={pickedDraw ? 'draw-pick picked' : 'draw-pick'}
                      disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
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
                  disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
                  isPicked={pickedTeam2}
                  onClick={() =>
                    updatePrediction(fixture, {
                      picked_team_id: fixture.team2_id,
                      pick_is_draw: false,
                    })
                  }
                  points={team2Points}
                  team={team2}
                />
                </div>
              </div>

              <PotentialPointsPanel fixture={fixture} potential={potential} prediction={prediction} />

              <div className="bonus-panel">
                <div>
                  <p className="section-label">Scoreline prediction (required)</p>
                </div>
                <div className="scoreline-row">
                  <ScoreTeamLabel team={team1} />
                  <input
                    aria-label={`${team1.name} score`}
                    disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
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
                    aria-label={`${team2.name} score`}
                    disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
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

                <button
                  aria-pressed={prediction.joker_used || false}
                  className={prediction.joker_used ? 'joker active' : 'joker'}
                  disabled={!teamsAssigned || locked || savingFixtureId === fixture.id}
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
                    <strong>{prediction.joker_used ? '🔥 Joker Active (x2)' : 'Play Joker'}</strong>
                    <small>
                      {prediction.joker_used ? 'Doubles fixture points' : `${jokersLeft} jokers left`}
                    </small>
                  </span>
                  {prediction.joker_used && (
                    <span className="joker-check" aria-hidden="true">
                      x2
                    </span>
                  )}
                </button>

                <button
                  className={justSaved ? 'save-prediction-button saved' : 'save-prediction-button'}
                  disabled={!canSave || justSaved}
                  onClick={() => saveDraftPrediction(fixture, prediction)}
                  type="button"
                >
                  {justSaved
                    ? '✓ Prediction Saved'
                    : savingFixtureId === fixture.id
                      ? 'Saving...'
                      : 'Save Prediction'}
                </button>
              </div>

              <div className="fixture-foot">
                <span>
                  {teamsAssigned
                    ? `${fixtureContext} • Locks 1 minute before kickoff`
                    : `${fixtureContext} • Teams pending`}
                </span>
                <strong>
                  {pickedDraw
                    ? 'Picked: Draw'
                    : pickedTeam1
                      ? `Picked: ${team1.name}`
                      : pickedTeam2
                        ? `Picked: ${team2.name}`
                        : 'No pick yet'}
                </strong>
                {justSaved && <em className="saved-badge">✓ Prediction Saved</em>}
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

function PotentialPointsPanel({ potential, prediction }) {
  return (
    <details className="potential-panel">
      <summary>
        <span>Potential Points</span>
        <strong>Maximum Available {formatPoints(potential.maximum)}</strong>
      </summary>
      <div className="potential-breakdown">
        <BreakdownLine label="Winner Prediction" value={`+${potential.main}`} active={potential.hasMainPick} />
        <BreakdownLine label="Exact Score" value={`+${potential.scoreline}`} active={potential.hasScoreline} />
        <BreakdownLine label="Insight Bonus" value={`+${potential.insight}`} active={potential.hasScoreline} />
        {prediction?.joker_used && (
          <BreakdownLine label="🔥 Joker Active" value="x2" active joker />
        )}
        <BreakdownLine label="Maximum Available" value={`+${potential.maximum}`} active />
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

function TeamPick({ disabled, isPicked, onClick, points, team }) {
  return (
    <button
      className={isPicked ? 'team-pick picked' : 'team-pick'}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="team-pick-flag">
        <TeamFlag size="fixture" team={team} />
      </span>
      <span className="team-pick-main">
        <strong>{team.name}</strong>
        <small>{team.isPlaceholder ? team.subtitle : team.code}</small>
      </span>
      <span className="rank-badge">{team.isPlaceholder ? 'Bracket' : `FIFA #${team.fifa_rank ?? '-'}`}</span>
      <span className="team-pick-points">{formatPoints(points)}</span>
      {isPicked && <span className="selected-badge">Selected</span>}
    </button>
  )
}

function ScoreTeamLabel({ alignRight = false, team }) {
  return (
    <span className={alignRight ? 'score-team score-team-right' : 'score-team'}>
      <TeamFlag size="compact" team={team} />
      <strong>{team.code || team.name}</strong>
    </span>
  )
}

function formatPoints(points) {
  return `${Number.isInteger(points) ? points : points.toFixed(1)} pts`
}

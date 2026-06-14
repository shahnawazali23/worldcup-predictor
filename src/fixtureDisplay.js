import { normalizeStage } from './scoring'
import { fixtureKickoffMs } from './time'

export function buildFixtureDisplayMeta(fixtures) {
  const orderedKnockoutFixtures = fixtures
    .filter((fixture) => normalizeStage(fixture.stage) !== 'group')
    .slice()
    .sort((a, b) => {
      const kickoffDiff = fixtureKickoffMs(a) - fixtureKickoffMs(b)
      if (kickoffDiff !== 0) return kickoffDiff
      return String(a.external_fixture_id || a.api_fixture_id || a.id).localeCompare(
        String(b.external_fixture_id || b.api_fixture_id || b.id),
      )
    })

  const stageCounts = {}
  const sequenceByFixtureId = {}

  orderedKnockoutFixtures.forEach((fixture) => {
    const stageKey = normalizeStage(fixture.stage)
    stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1
    sequenceByFixtureId[fixture.id] = stageCounts[stageKey]
  })

  return { sequenceByFixtureId }
}

export function fixtureParticipant({ alignRight = false, fixture, side, teamsById, sequenceByFixtureId = {} }) {
  const teamId = side === 'home' ? fixture.team1_id : fixture.team2_id
  const team = teamId ? teamsById[teamId] : null
  if (team) {
    return {
      alignRight,
      code: team.short_name || team.name,
      fifa_rank: team.fifa_rank,
      flag: team.flag || '',
      isPlaceholder: false,
      name: team.name,
    }
  }

  const storedLabel = side === 'home' ? fixture.home_team : fixture.away_team
  const storedCode = side === 'home' ? fixture.home_team_code : fixture.away_team_code
  const name = cleanPlaceholderLabel(storedLabel) || bracketParticipantLabel(fixture, side, sequenceByFixtureId)

  return {
    alignRight,
    code: storedCode || placeholderCode(fixture, side),
    flag: '',
    isPlaceholder: true,
    name,
  }
}

export function fixtureMatchLabel(fixture, sequenceByFixtureId = {}) {
  if (fixture.team1_id && fixture.team2_id) return null
  const stage = stageLabel(fixture)
  const sequence = sequenceByFixtureId[fixture.id]
  return sequence ? `${stage} ${sequence}` : stage
}

export function hasAssignedTeams(fixture) {
  return Boolean(fixture.team1_id && fixture.team2_id)
}

function bracketParticipantLabel(fixture, side, sequenceByFixtureId) {
  const sideLabel = side === 'home' ? 'Home' : 'Away'
  const stage = stageLabel(fixture)
  const sequence = sequenceByFixtureId[fixture.id]

  if (fixture.group_name) {
    return `${sideLabel} ${stage} participant (${fixture.group_name})`
  }

  if (sequence) {
    return `${stage} ${sequence} ${sideLabel}`
  }

  return `${stage} ${sideLabel}`
}

function cleanPlaceholderLabel(label) {
  if (!label) return ''
  const value = String(label).trim()
  if (!value || value.toLowerCase() === 'unknown team' || value.toLowerCase() === 'tbd') return ''
  return value
}

function placeholderCode(fixture, side) {
  const stage = normalizeStage(fixture.stage).toUpperCase()
  return `${stage || 'TBD'}-${side === 'home' ? 'H' : 'A'}`
}

function stageLabel(fixture) {
  const stage = normalizeStage(fixture.stage)
  if (stage === 'r32') return 'Round of 32'
  if (stage === 'r16') return 'Round of 16'
  if (stage === 'qf') return 'Quarter Final'
  if (stage === 'semi') return 'Semi Final'
  if (stage === 'final') return 'Final'
  return fixture.stage || 'Fixture'
}

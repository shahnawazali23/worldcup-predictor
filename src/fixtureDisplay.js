import { normalizeStage } from './scoring'
import { canonicalTeamName, resolveTeamFlag } from './teamFlags'
import { fixtureKickoffMs } from './time'

export function buildFixtureDisplayMeta(fixtures) {
  const orderedKnockoutFixtures = fixtures
    .filter((fixture) => normalizeStage(fixture.stage) !== 'group')
    .slice()
    .sort(compareFixturesTournamentOrder)

  const stageCounts = {}
  const sequenceByFixtureId = {}

  orderedKnockoutFixtures.forEach((fixture) => {
    const stageKey = normalizeStage(fixture.stage)
    stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1
    sequenceByFixtureId[fixture.id] = stageCounts[stageKey]
  })

  return { sequenceByFixtureId }
}

export function compareFixturesTournamentOrder(a, b) {
  const kickoffDiff = fixtureKickoffMs(a) - fixtureKickoffMs(b)
  if (kickoffDiff !== 0) return kickoffDiff

  const stageDiff = stageOrder(a) - stageOrder(b)
  if (stageDiff !== 0) return stageDiff

  return String(a.external_fixture_id || a.api_fixture_id || a.id).localeCompare(
    String(b.external_fixture_id || b.api_fixture_id || b.id),
  )
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
      subtitle: team.short_name || team.name,
    }
  }

  const storedLabel = side === 'home' ? fixture.home_team : fixture.away_team
  const storedCode = side === 'home' ? fixture.home_team_code : fixture.away_team_code
  const placeholder = isUnknownKnockoutParticipant(fixture, storedLabel)
  const name = placeholder ? 'TBD' : canonicalTeamName(cleanPlaceholderLabel(storedLabel)) ||
    bracketParticipantLabel(fixture, side, sequenceByFixtureId)

  return {
    alignRight,
    code: placeholder ? 'TBD' : storedCode || placeholderCode(fixture, side),
    flag: placeholder ? '' : resolveTeamFlag({ code: storedCode, name, short_name: storedCode }),
    isPlaceholder: true,
    name,
    subtitle: placeholder ? 'Participants will be confirmed after group stage completion' : 'Participant pending',
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
  if (
    !value ||
    value.toLowerCase() === 'unknown team' ||
    value.toLowerCase() === 'tbd' ||
    isApiParticipantPlaceholder(value)
  ) return ''
  return value
}

function isUnknownKnockoutParticipant(fixture, label) {
  return isApiParticipantPlaceholder(label) || (
    normalizeStage(fixture.stage) !== 'group' &&
    (!fixture.team1_id || !fixture.team2_id)
  )
}

function isApiParticipantPlaceholder(label) {
  if (!label) return false
  return /^(home|away)\s+.+\s+participant$/i.test(String(label).trim())
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

function stageOrder(fixture) {
  const stage = normalizeStage(fixture.stage)
  if (stage === 'group') return 1
  if (stage === 'r32') return 2
  if (stage === 'r16') return 3
  if (stage === 'qf') return 4
  if (stage === 'semi') return 5
  if (stage === 'final') return 6
  return 99
}

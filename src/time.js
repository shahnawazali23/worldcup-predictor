export function fixtureKickoffValue(fixture) {
  return fixture.kickoff_time_utc || fixture.kickoff_at
}

export function fixtureKickoffDate(fixture) {
  return new Date(fixtureKickoffValue(fixture))
}

export function fixtureKickoffMs(fixture) {
  return fixtureKickoffDate(fixture).getTime()
}

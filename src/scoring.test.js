import assert from 'node:assert/strict'
import {
  buildLeaderboard,
  remainingJokers,
  roundMultiplier,
  scoreMatch,
} from './scoring.js'

const teamsById = {
  favorite: { id: 'favorite', name: 'Favorite', fifa_rank: 5 },
  underdog: { id: 'underdog', name: 'Underdog', fifa_rank: 48 },
  close: { id: 'close', name: 'Close', fifa_rank: 16 },
  usaLegacy: { id: 'usaLegacy', name: 'USA', fifa_rank: 17 },
  usaFootballData: { id: 'usaFootballData', name: 'United States', fifa_rank: 999 },
  paraguay: { id: 'paraguay', name: 'Paraguay', fifa_rank: 40 },
}

const groupFixture = {
  id: 'g1',
  stage: 'Group',
  team1_id: 'favorite',
  team2_id: 'underdog',
  goals_team1: 1,
  goals_team2: 2,
  winner_team_id: 'underdog',
  is_draw: false,
  is_finished: true,
}

assert.equal(scoreMatch(groupFixture, { picked_team_id: 'underdog' }, teamsById).total, 5)
assert.equal(
  scoreMatch(groupFixture, {
    picked_team_id: 'underdog',
    pred_goals_team1: 1,
    pred_goals_team2: 2,
  }, teamsById).total,
  8,
)
assert.equal(
  scoreMatch(groupFixture, {
    picked_team_id: 'underdog',
    pred_goals_team1: 0,
    pred_goals_team2: 1,
  }, teamsById).total,
  6,
)
assert.equal(
  scoreMatch(groupFixture, {
    picked_team_id: 'underdog',
    pred_goals_team1: 3,
    pred_goals_team2: 1,
  }, teamsById).total,
  3,
)

const canonicalIdentityFixture = {
  id: 'usa1',
  stage: 'Group',
  team1_id: 'usaFootballData',
  team2_id: 'paraguay',
  goals_team1: 4,
  goals_team2: 1,
  winner_team_id: 'usaFootballData',
  is_draw: false,
  is_finished: true,
}

assert.equal(
  scoreMatch(canonicalIdentityFixture, { picked_team_id: 'usaLegacy' }, teamsById).correctPick,
  true,
)
assert.equal(scoreMatch(canonicalIdentityFixture, { picked_team_id: 'usaLegacy' }, teamsById).total, 1)

const finalFixture = {
  id: 'f1',
  stage: 'Final',
  team1_id: 'favorite',
  team2_id: 'underdog',
  goals_team1: 1,
  goals_team2: 1,
  winner_team_id: null,
  advancing_team_id: 'underdog',
  is_draw: true,
  is_finished: true,
  went_to_penalties: true,
}

assert.equal(roundMultiplier(finalFixture), 4)
assert.equal(
  scoreMatch(finalFixture, {
    picked_team_id: 'underdog',
    pred_goals_team1: 1,
    pred_goals_team2: 1,
    penalty_call: 'yes',
  }, teamsById).total,
  28,
)
assert.equal(
  scoreMatch(finalFixture, {
    picked_team_id: 'underdog',
    penalty_call: 'no',
    joker_used: true,
  }, teamsById).total,
  34,
)
assert.equal(remainingJokers([{ user_id: 'u1', joker_used: true }], 'u1'), 2)

const leaderboard = buildLeaderboard({
  fixtures: [groupFixture],
  predictions: [
    { user_id: 'u1', fixture_id: 'g1', picked_team_id: 'favorite' },
    { user_id: 'u2', fixture_id: 'g1', picked_team_id: 'underdog' },
  ],
  profiles: [
    { id: 'u1', display_name: 'A' },
    { id: 'u2', display_name: 'B' },
  ],
  teamsById,
})

assert.equal(leaderboard[0].id, 'u2')
console.log('Scoring tests passed')

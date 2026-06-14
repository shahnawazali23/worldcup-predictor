import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type FootballDataTeam = {
  id?: number | string | null
  name?: string | null
  shortName?: string | null
  tla?: string | null
}

type FootballDataMatch = {
  id: number | string
  utcDate: string
  status?: string
  stage?: string | null
  group?: string | null
  venue?: string | null
  competition?: {
    code?: string | null
    name?: string | null
  }
  homeTeam?: FootballDataTeam
  awayTeam?: FootballDataTeam
  score?: {
    fullTime?: {
      home?: number | null
      away?: number | null
    }
  }
  lastUpdated?: string | null
}

type NormalizedTeam = {
  api_provider: string
  api_team_id: string
  name: string
  source_name: string
  short_name: string
  fifa_rank: number
}

type SavedTeam = {
  id: string
  name: string | null
  api_provider: string | null
  api_team_id: string | null
}

type SyncConfig = {
  provider: string
  supabaseUrl: string
  serviceRoleKey: string
  footballDataApiKey: string
  competitionCode: string
  season: string
  requestTimeoutMs: number
}

const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 750
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
const FOOTBALL_DATA_TEAM_NAME_ALIASES: Record<string, string> = {
  'bosnia-herzegovina': 'Bosnia and Herzegovina',
  'bosnia & herzegovina': 'Bosnia and Herzegovina',
  'cape verde islands': 'Cape Verde',
  'cote divoire': 'Ivory Coast',
  'côte divoire': 'Ivory Coast',
  'cote d ivoire': 'Ivory Coast',
  "cote d'ivoire": 'Ivory Coast',
  "côte d'ivoire": 'Ivory Coast',
  'curaçao': 'Curacao',
  'czech republic': 'Czechia',
  'dr congo': 'Congo DR',
  'd r congo': 'Congo DR',
  'democratic republic of congo': 'Congo DR',
  'ir iran': 'Iran',
  'iran islamic republic of': 'Iran',
  'ivory coast': 'Ivory Coast',
  'korea republic': 'South Korea',
  'republic of korea': 'South Korea',
  'south korea': 'South Korea',
  'turkiye': 'Turkey',
  'türkiye': 'Turkey',
  'united states': 'USA',
  'united states of america': 'USA',
  usa: 'USA',
}

Deno.serve(async () => {
  const startedAt = Date.now()
  let supabase: ReturnType<typeof createClient> | null = null
  let config: SyncConfig | null = null

  try {
    config = readConfig()
    supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
    const footballDataHttpClient = createFootballDataHttpClient()

    console.log('[sync-fixtures] starting sync', {
      provider: config.provider,
      competitionCode: config.competitionCode,
      season: config.season,
      requestTimeoutMs: config.requestTimeoutMs,
      http2Disabled: Boolean(footballDataHttpClient),
    })

    if (config.provider !== 'football-data') {
      throw new Error(`Unsupported FIXTURE_PROVIDER: ${config.provider}`)
    }

    let matches: FootballDataMatch[]
    try {
      matches = await fetchFootballDataMatches(config, footballDataHttpClient)
    } finally {
      footballDataHttpClient?.close?.()
    }
    const teams = uniqueTeams(matches, config.provider)
    const teamIdsByApiId = await syncTeamsAndBuildLookup(supabase, teams, config.provider)

    const fixtures = matches.map((match) => normalizeFixture(match, teamIdsByApiId, config))
    assertFixturesHaveResolvedTeams(matches, fixtures, teamIdsByApiId)
    const { error: fixturesError } = await supabase
      .from('fixtures')
      .upsert(fixtures, { onConflict: 'api_provider,external_fixture_id' })

    if (fixturesError) throw new Error(`Supabase fixtures upsert failed: ${formatErrorMessage(fixturesError)}`)

    const importedResults = fixtures.filter((fixture) => fixture.is_finished).length
    await safeLogSync(supabase, config.provider, {
      status: 'success',
      imported_fixtures: fixtures.length,
      imported_results: importedResults,
      message: `Synced ${fixtures.length} ${config.competitionCode} fixtures for ${config.season}.`,
    })

    console.log('[sync-fixtures] sync complete', {
      fixtures: fixtures.length,
      results: importedResults,
      durationMs: Date.now() - startedAt,
    })

    return jsonResponse({
      ok: true,
      provider: config.provider,
      competitionCode: config.competitionCode,
      season: config.season,
      fixtures: fixtures.length,
      results: importedResults,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    const serializedError = serializeError(error)
    console.error('[sync-fixtures] sync failed', serializedError)

    if (supabase && config) {
      await safeLogSync(supabase, config.provider, {
        status: 'error',
        imported_fixtures: 0,
        imported_results: 0,
        message: serializedError.message,
      })
    }

    // Return HTTP 200 for handled sync failures so Supabase manual tests show the structured
    // error body instead of a generic Edge Function 500. The body still reports ok: false.
    return jsonResponse({
      ok: false,
      provider: config?.provider || null,
      competitionCode: config?.competitionCode || null,
      season: config?.season || null,
      error: serializedError.message,
      details: serializedError,
      durationMs: Date.now() - startedAt,
    })
  }
})

async function fetchFootballDataMatches(
  config: SyncConfig,
  httpClient: { close?: () => void } | null,
): Promise<FootballDataMatch[]> {
  const url = new URL(`https://api.football-data.org/v4/competitions/${config.competitionCode}/matches`)
  url.searchParams.set('season', config.season)

  console.log('[sync-fixtures] football-data request config', {
    competitionCode: config.competitionCode,
    season: config.season,
    url: url.toString(),
  })

  const payload = await fetchJsonWithRetry(url, {
    headers: {
      accept: 'application/json',
      'X-Auth-Token': config.footballDataApiKey,
    },
    timeoutMs: config.requestTimeoutMs,
    httpClient,
  })

  if (!Array.isArray(payload.matches)) {
    throw new Error(`football-data.org response did not contain a matches array. Body: ${safeJson(payload)}`)
  }

  return payload.matches
}

async function fetchJsonWithRetry(
  url: URL,
  options: { headers: HeadersInit; timeoutMs: number; httpClient: { close?: () => void } | null },
): Promise<Record<string, unknown>> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options)
      const bodyText = await response.text()

      console.log('[sync-fixtures] football-data response', {
        attempt,
        status: response.status,
        statusText: response.statusText,
      })

      if (response.ok) {
        return parseJsonResponse(bodyText)
      }

      const message = `football-data.org ${response.status} ${response.statusText}: ${truncate(bodyText, 1200)}`
      if (!isRetryableStatus(response.status) || attempt === MAX_RETRIES) {
        throw new Error(message)
      }

      lastError = new Error(message)
    } catch (error) {
      lastError = error
      console.error('[sync-fixtures] football-data attempt failed', {
        attempt,
        error: serializeError(error),
      })

      if (attempt === MAX_RETRIES) break
    }

    const backoffMs = BASE_BACKOFF_MS * 2 ** (attempt - 1)
    console.log('[sync-fixtures] retrying football-data request', {
      nextAttempt: attempt + 1,
      backoffMs,
    })
    await delay(backoffMs)
  }

  throw new Error(`football-data.org request failed after ${MAX_RETRIES} attempts: ${formatErrorMessage(lastError)}`)
}

async function fetchWithTimeout(
  url: URL,
  options: { headers: HeadersInit; timeoutMs: number; httpClient: { close?: () => void } | null },
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('request timeout'), options.timeoutMs)
  const init: RequestInit & { client?: unknown } = {
    headers: options.headers,
    signal: controller.signal,
  }

  if (options.httpClient) {
    // Supabase Edge logs showed HTTP/2 transport failures against football-data.org.
    // Deno's custom client lets us force HTTP/1.1 for this provider fetch.
    init.client = options.httpClient
  }

  try {
    return await fetch(url, init)
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeFixture(
  match: FootballDataMatch,
  teamIdsByApiId: Record<string, string>,
  config: SyncConfig,
) {
  const homeTeam = match.homeTeam || {}
  const awayTeam = match.awayTeam || {}
  const homeApiId = String(homeTeam.id || homeTeam.tla || homeTeam.name || '')
  const awayApiId = String(awayTeam.id || awayTeam.tla || awayTeam.name || '')
  const homeScore = match.score?.fullTime?.home ?? null
  const awayScore = match.score?.fullTime?.away ?? null
  const isFinished = match.status === 'FINISHED'
  const kickoffInstant = parseKickoffInstant(match.utcDate)

  // football-data.org returns utcDate as an ISO UTC instant. Store it unchanged as canonical UTC.
  return {
    api_provider: config.provider,
    api_fixture_id: String(match.id),
    external_fixture_id: String(match.id),
    match_date: kickoffInstant.toISOString().slice(0, 10),
    competition: match.competition?.name || config.competitionCode,
    stage: normalizeStage(match.stage),
    group_name: match.group || null,
    home_team: homeTeam.name ? canonicalTeamName(homeTeam.name) : null,
    away_team: awayTeam.name ? canonicalTeamName(awayTeam.name) : null,
    home_team_code: homeTeam.tla || null,
    away_team_code: awayTeam.tla || null,
    kickoff_time_utc: kickoffInstant.toISOString(),
    kickoff_at: kickoffInstant.toISOString(),
    venue: match.venue || null,
    venue_timezone: null,
    team1_id: teamIdsByApiId[homeApiId] || null,
    team2_id: teamIdsByApiId[awayApiId] || null,
    goals_team1: homeScore,
    goals_team2: awayScore,
    home_score: homeScore,
    away_score: awayScore,
    winner_team_id: winnerTeamId(homeScore, awayScore, teamIdsByApiId[homeApiId], teamIdsByApiId[awayApiId]),
    is_draw: homeScore != null && awayScore != null && homeScore === awayScore,
    is_finished: isFinished,
    result_confirmed: isFinished,
    status: match.status || 'SCHEDULED',
    last_synced_at: new Date().toISOString(),
  }
}

function assertFixturesHaveResolvedTeams(
  matches: FootballDataMatch[],
  fixtures: ReturnType<typeof normalizeFixture>[],
  teamIdsByApiId: Record<string, string>,
) {
  const unresolvedFixtures = fixtures
    .map((fixture, index) => {
      const match = matches[index]
      const homeTeam = match.homeTeam || {}
      const awayTeam = match.awayTeam || {}
      const homeApiId = String(homeTeam.id || homeTeam.tla || homeTeam.name || '')
      const awayApiId = String(awayTeam.id || awayTeam.tla || awayTeam.name || '')

      return {
        apiFixtureId: fixture.api_fixture_id,
        homeTeamName: homeTeam.name || null,
        awayTeamName: awayTeam.name || null,
        canonicalHomeName: homeTeam.name ? canonicalTeamName(homeTeam.name) : null,
        canonicalAwayName: awayTeam.name ? canonicalTeamName(awayTeam.name) : null,
        footballDataHomeId: homeApiId || null,
        footballDataAwayId: awayApiId || null,
        resolvedTeam1Id: teamIdsByApiId[homeApiId] || null,
        resolvedTeam2Id: teamIdsByApiId[awayApiId] || null,
      }
    })
    .filter((fixture) => !fixture.resolvedTeam1Id || !fixture.resolvedTeam2Id)

  if (unresolvedFixtures.length === 0) return

  console.error('[sync-fixtures] unresolved fixtures detail', JSON.stringify({
    unresolvedFixtureCount: unresolvedFixtures.length,
    unresolvedFixtures,
  }))
  throw new Error(`Unable to resolve teams for ${unresolvedFixtures.length} fixtures. See function logs for team names and IDs.`)
}

function parseKickoffInstant(utcDate: string) {
  const kickoffInstant = new Date(utcDate)
  if (Number.isNaN(kickoffInstant.getTime())) {
    throw new Error(`Invalid football-data utcDate for fixture sync: ${utcDate}`)
  }
  return kickoffInstant
}

function uniqueTeams(matches: FootballDataMatch[], provider: string): NormalizedTeam[] {
  const teamsByApiId = new Map<string, NormalizedTeam>()

  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!team?.name) continue
      const apiTeamId = String(team.id || team.tla || team.name)
      const canonicalName = canonicalTeamName(team.name)
      teamsByApiId.set(apiTeamId, {
        api_provider: provider,
        api_team_id: apiTeamId,
        name: canonicalName,
        source_name: team.name,
        short_name: team.tla || team.shortName || team.name,
        fifa_rank: 999,
      })
    }
  }

  return [...teamsByApiId.values()]
}

function canonicalTeamName(name: string) {
  const normalizedName = normalizeTeamNameKey(name)
  return FOOTBALL_DATA_TEAM_NAME_ALIASES[normalizedName] || name
}

function normalizeTeamNameKey(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/[^\w\s'&-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function syncTeamsAndBuildLookup(
  supabase: ReturnType<typeof createClient>,
  teams: NormalizedTeam[],
  provider: string,
): Promise<Record<string, string>> {
  if (teams.length === 0) return {}

  const teamNames = [...new Set(teams.map((team) => team.name))]
  const providerTeamIds = [...new Set(teams.map((team) => team.api_team_id))]

  const { data: existingByName, error: existingByNameError } = await supabase
    .from('teams')
    .select('id, name, api_provider, api_team_id')
    .in('name', teamNames)

  if (existingByNameError) {
    throw new Error(`Supabase teams name lookup failed: ${formatErrorMessage(existingByNameError)}`)
  }

  const { data: existingByProviderId, error: existingByProviderIdError } = await supabase
    .from('teams')
    .select('id, name, api_provider, api_team_id')
    .eq('api_provider', provider)
    .in('api_team_id', providerTeamIds)

  if (existingByProviderIdError) {
    throw new Error(`Supabase teams provider lookup failed: ${formatErrorMessage(existingByProviderIdError)}`)
  }

  const existingRows = [...(existingByName || []), ...(existingByProviderId || [])] as SavedTeam[]
  const rowsByName = new Map(existingRows.filter((row) => row.name).map((row) => [row.name, row]))
  const rowsByProviderId = new Map(
    existingRows
      .filter((row) => row.api_provider === provider && row.api_team_id)
      .map((row) => [row.api_team_id, row]),
  )

  const teamsToInsert = teams.filter((team) => {
    return !rowsByProviderId.has(team.api_team_id) && !rowsByName.has(team.name)
  })
  const teamsToAttachProviderMetadata = teams.filter((team) => {
    const existingTeam = rowsByName.get(team.name)
    return Boolean(
      existingTeam &&
        !rowsByProviderId.has(team.api_team_id) &&
        existingTeam.api_provider == null &&
        existingTeam.api_team_id == null,
    )
  })

  let providerMetadataAttached = 0
  for (const team of teamsToAttachProviderMetadata) {
    const existingTeam = rowsByName.get(team.name)
    if (!existingTeam) continue

    const { error: attachProviderError } = await supabase
      .from('teams')
      .update({
        api_provider: provider,
        api_team_id: team.api_team_id,
      })
      .eq('id', existingTeam.id)
      .is('api_provider', null)
      .is('api_team_id', null)

    if (attachProviderError) {
      throw new Error(`Supabase teams provider metadata update failed: ${formatErrorMessage(attachProviderError)}`)
    }

    providerMetadataAttached += 1
  }

  if (teamsToInsert.length > 0) {
    const { error: teamsError } = await supabase
      .from('teams')
      .upsert(teamsToInsert, { onConflict: 'api_provider,api_team_id', ignoreDuplicates: true })

    if (teamsError) throw new Error(`Supabase teams upsert failed: ${formatErrorMessage(teamsError)}`)
  }

  const { data: resolvedTeams, error: resolvedTeamsError } = await supabase
    .from('teams')
    .select('id, name, api_provider, api_team_id')
    .in('name', teamNames)

  if (resolvedTeamsError) {
    throw new Error(`Supabase teams resolved lookup failed: ${formatErrorMessage(resolvedTeamsError)}`)
  }

  const { data: resolvedProviderTeams, error: resolvedProviderTeamsError } = await supabase
    .from('teams')
    .select('id, name, api_provider, api_team_id')
    .eq('api_provider', provider)
    .in('api_team_id', providerTeamIds)

  if (resolvedProviderTeamsError) {
    throw new Error(`Supabase teams resolved provider lookup failed: ${formatErrorMessage(resolvedProviderTeamsError)}`)
  }

  const resolvedRows = [...(resolvedTeams || []), ...(resolvedProviderTeams || [])] as SavedTeam[]
  const resolvedByName = new Map(resolvedRows.filter((row) => row.name).map((row) => [row.name, row]))
  const resolvedByProviderId = new Map(
    resolvedRows
      .filter((row) => row.api_provider === provider && row.api_team_id)
      .map((row) => [row.api_team_id, row]),
  )

  const teamIdsByApiId: Record<string, string> = {}
  const unresolvedTeams: string[] = []

  for (const team of teams) {
    const resolvedTeam = resolvedByProviderId.get(team.api_team_id) || resolvedByName.get(team.name)
    if (resolvedTeam?.id) {
      teamIdsByApiId[team.api_team_id] = resolvedTeam.id
    } else {
      unresolvedTeams.push(`${team.source_name} -> ${team.name} (${team.api_team_id})`)
    }
  }

  if (unresolvedTeams.length > 0) {
    console.warn('[sync-fixtures] some teams could not be resolved to database IDs', { unresolvedTeams })
  }

  const aliasedTeams = teams
    .filter((team) => team.source_name !== team.name)
    .map((team) => ({
      sourceName: team.source_name,
      canonicalName: team.name,
      footballDataTeamId: team.api_team_id,
      resolvedDatabaseTeamId: teamIdsByApiId[team.api_team_id] || null,
    }))

  if (aliasedTeams.length > 0) {
    console.log('[sync-fixtures] provider team names matched through aliases', { aliasedTeams })
  }

  console.log('[sync-fixtures] teams resolved', {
    provider,
    incomingTeams: teams.length,
    insertedTeams: teamsToInsert.length,
    providerMetadataAttached,
    reusedExistingTeams: teams.length - teamsToInsert.length,
    unresolvedTeams: unresolvedTeams.length,
  })

  return teamIdsByApiId
}

function winnerTeamId(
  homeScore: number | null,
  awayScore: number | null,
  homeTeamId?: string,
  awayTeamId?: string,
) {
  if (homeScore == null || awayScore == null || homeScore === awayScore) return null
  return homeScore > awayScore ? homeTeamId || null : awayTeamId || null
}

function normalizeStage(stage?: string | null) {
  if (!stage) return 'Group'
  return stage
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function safeLogSync(
  supabase: ReturnType<typeof createClient>,
  provider: string,
  run: { status: string; imported_fixtures: number; imported_results: number; message: string },
) {
  const { error } = await supabase.from('api_sync_runs').insert({
    provider,
    ...run,
  })

  if (error) {
    console.error('[sync-fixtures] failed to write api_sync_runs row', serializeError(error))
  }
}

function createFootballDataHttpClient(): { close?: () => void } | null {
  const denoWithHttpClient = Deno as unknown as {
    createHttpClient?: (options: { http2: boolean }) => { close?: () => void }
  }

  if (!denoWithHttpClient.createHttpClient) return null
  return denoWithHttpClient.createHttpClient({ http2: false })
}

function readConfig(): SyncConfig {
  return {
    provider: Deno.env.get('FIXTURE_PROVIDER') || 'football-data',
    supabaseUrl: requiredEnv('SUPABASE_URL'),
    serviceRoleKey: requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    footballDataApiKey: requiredEnv('FOOTBALL_DATA_API_KEY'),
    competitionCode: requiredEnv('FOOTBALL_DATA_COMPETITION_CODE'),
    season: requiredEnv('FOOTBALL_DATA_SEASON'),
    requestTimeoutMs: numberEnv('FOOTBALL_DATA_TIMEOUT_MS', DEFAULT_REQUEST_TIMEOUT_MS),
  }
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function numberEnv(name: string, fallback: number) {
  const raw = Deno.env.get(name)
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid numeric env var ${name}: ${raw}`)
  }
  return value
}

function parseJsonResponse(bodyText: string): Record<string, unknown> {
  try {
    return JSON.parse(bodyText)
  } catch (error) {
    throw new Error(`football-data.org returned invalid JSON: ${truncate(bodyText, 1200)}; ${formatErrorMessage(error)}`)
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? serializeError(error.cause) : undefined,
    }
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return {
      name: String(record.name || 'ObjectError'),
      message: formatErrorMessage(error),
      code: record.code,
      details: record.details,
      hint: record.hint,
      raw: safeJson(error),
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    const message = record.message || record.error_description || record.error
    if (typeof message === 'string') return message
    return safeJson(error)
  }
  return String(error)
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch (_error) {
    return String(value)
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  })
}

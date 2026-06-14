const FLAG_ASSET_BASE_URL = 'https://flagcdn.com'

const ISO_BY_CANONICAL_NAME = {
  Algeria: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  Belgium: 'be',
  'Bosnia and Herzegovina': 'ba',
  Brazil: 'br',
  Canada: 'ca',
  'Cape Verde': 'cv',
  Colombia: 'co',
  'Congo DR': 'cd',
  Croatia: 'hr',
  Curacao: 'cw',
  Czechia: 'cz',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Ghana: 'gh',
  Haiti: 'ht',
  Iran: 'ir',
  Iraq: 'iq',
  'Ivory Coast': 'ci',
  Japan: 'jp',
  Jordan: 'jo',
  Mexico: 'mx',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Panama: 'pa',
  Paraguay: 'py',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  'South Africa': 'za',
  'South Korea': 'kr',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Tunisia: 'tn',
  Turkey: 'tr',
  USA: 'us',
  Uruguay: 'uy',
  Uzbekistan: 'uz',
}

const ISO_BY_CODE = {
  ALG: 'dz',
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba',
  BAH: 'ba',
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci',
  COD: 'cd',
  COL: 'co',
  CPV: 'cv',
  CRO: 'hr',
  CUR: 'cw',
  CUW: 'cw',
  CV: 'cv',
  CZE: 'cz',
  DEN: 'dk',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  JPN: 'jp',
  JAP: 'jp',
  JOR: 'jo',
  KOR: 'kr',
  KORR: 'kr',
  MAR: 'ma',
  MEX: 'mx',
  MOR: 'ma',
  NED: 'nl',
  NET: 'nl',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  KSA: 'sa',
  SAU: 'sa',
  SCO: 'gb-sct',
  SEN: 'sn',
  RSA: 'za',
  ESP: 'es',
  SPA: 'es',
  SUI: 'ch',
  SWI: 'ch',
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  USA: 'us',
  URU: 'uy',
  UZB: 'uz',
}

const CANONICAL_NAME_BY_KEY = {
  bosniaherzegovina: 'Bosnia and Herzegovina',
  bosniaandherzegovina: 'Bosnia and Herzegovina',
  capeverde: 'Cape Verde',
  capeverdeislands: 'Cape Verde',
  cotedivoire: 'Ivory Coast',
  ivorianrepublic: 'Ivory Coast',
  ivorycoast: 'Ivory Coast',
  curacao: 'Curacao',
  czechrepublic: 'Czechia',
  czechia: 'Czechia',
  democraticrepublicofcongo: 'Congo DR',
  drcongo: 'Congo DR',
  congodr: 'Congo DR',
  iriran: 'Iran',
  iranislamicrepublicof: 'Iran',
  iran: 'Iran',
  korearepublic: 'South Korea',
  republicofkorea: 'South Korea',
  southkorea: 'South Korea',
  turkiye: 'Turkey',
  turkey: 'Turkey',
  unitedstates: 'USA',
  unitedstatesofamerica: 'USA',
  usa: 'USA',
}

export function canonicalTeamName(name = '') {
  const trimmed = String(name).trim()
  if (!trimmed) return ''
  return CANONICAL_NAME_BY_KEY[teamNameKey(trimmed)] || trimmed
}

export function resolveTeamFlag(team = {}) {
  return resolveTeamFlagAsset(team)?.src || ''
}

export function resolveTeamFlagAsset(team = {}) {
  if (team?.isPlaceholder) return null

  const code = String(team.code || team.short_name || team.tla || team.home_team_code || '').trim().toUpperCase()
  const isoCode = ISO_BY_CODE[code] || isoFromAlpha2Code(code) || ISO_BY_CANONICAL_NAME[canonicalTeamName(team.name)]
  if (!isoCode) return null

  return {
    code: isoCode,
    src: flagSvgUrl(isoCode),
  }
}

export function teamsMissingResolvedFlags(teams = []) {
  return teams.filter((team) => !resolveTeamFlagAsset(team))
}

function teamNameKey(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
}

function flagSvgUrl(isoCode) {
  return `${FLAG_ASSET_BASE_URL}/${isoCode.toLowerCase()}.svg`
}

function isoFromAlpha2Code(code) {
  return /^[A-Z]{2}$/.test(code) ? code.toLowerCase() : ''
}

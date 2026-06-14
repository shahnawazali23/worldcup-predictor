const FLAG_BY_CANONICAL_NAME = {
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  'Bosnia and Herzegovina': '🇧🇦',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  'Cape Verde': '🇨🇻',
  Colombia: '🇨🇴',
  'Congo DR': '🇨🇩',
  Croatia: '🇭🇷',
  Curacao: '🇨🇼',
  Czechia: '🇨🇿',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Haiti: '🇭🇹',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  'Ivory Coast': '🇨🇮',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  'New Zealand': '🇳🇿',
  Norway: '🇳🇴',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Scotland: '🏴',
  Senegal: '🇸🇳',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  USA: '🇺🇸',
  Uruguay: '🇺🇾',
  Uzbekistan: '🇺🇿',
}

const FLAG_BY_CODE = {
  ALG: '🇩🇿',
  ARG: '🇦🇷',
  AUS: '🇦🇺',
  AUT: '🇦🇹',
  BEL: '🇧🇪',
  BIH: '🇧🇦',
  BAH: '🇧🇦',
  BRA: '🇧🇷',
  CAN: '🇨🇦',
  CIV: '🇨🇮',
  COD: '🇨🇩',
  COL: '🇨🇴',
  CPV: '🇨🇻',
  CRO: '🇭🇷',
  CUR: '🇨🇼',
  CUW: '🇨🇼',
  CV: '🇨🇻',
  CZE: '🇨🇿',
  DEN: '🇩🇰',
  ECU: '🇪🇨',
  EGY: '🇪🇬',
  ENG: '🏴',
  FRA: '🇫🇷',
  GER: '🇩🇪',
  GHA: '🇬🇭',
  HAI: '🇭🇹',
  IRN: '🇮🇷',
  IRQ: '🇮🇶',
  JPN: '🇯🇵',
  JAP: '🇯🇵',
  JOR: '🇯🇴',
  KOR: '🇰🇷',
  MEX: '🇲🇽',
  MAR: '🇲🇦',
  MOR: '🇲🇦',
  NED: '🇳🇱',
  NET: '🇳🇱',
  NOR: '🇳🇴',
  NZL: '🇳🇿',
  PAN: '🇵🇦',
  PAR: '🇵🇾',
  POR: '🇵🇹',
  QAT: '🇶🇦',
  KSA: '🇸🇦',
  SAU: '🇸🇦',
  SCO: '🏴',
  SEN: '🇸🇳',
  RSA: '🇿🇦',
  KORR: '🇰🇷',
  ESP: '🇪🇸',
  SPA: '🇪🇸',
  SWE: '🇸🇪',
  SUI: '🇨🇭',
  SWI: '🇨🇭',
  TUN: '🇹🇳',
  TUR: '🇹🇷',
  USA: '🇺🇸',
  URU: '🇺🇾',
  UZB: '🇺🇿',
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
  curaçao: 'Curacao',
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
  türkiye: 'Turkey',
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
  const storedFlag = team.flag || ''
  if (storedFlag) return storedFlag

  const canonicalName = canonicalTeamName(team.name)
  if (FLAG_BY_CANONICAL_NAME[canonicalName]) return FLAG_BY_CANONICAL_NAME[canonicalName]

  const code = String(team.code || team.short_name || team.tla || '').trim().toUpperCase()
  return FLAG_BY_CODE[code] || ''
}

export function teamsMissingResolvedFlags(teams = []) {
  return teams.filter((team) => !resolveTeamFlag(team))
}

function teamNameKey(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
}

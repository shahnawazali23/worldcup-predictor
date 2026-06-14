import { resolveTeamFlagAsset } from './teamFlags'

const SIZE_CLASS = {
  compact: 'flag-mark-compact',
  table: 'flag-mark-table',
  fixture: 'flag-mark-fixture',
}

export default function TeamFlag({ className = '', decorative = true, size = 'table', team }) {
  if (team?.isPlaceholder) return null

  const asset = resolveTeamFlagAsset(team)
  const classes = ['flag-mark', SIZE_CLASS[size] || SIZE_CLASS.table, className].filter(Boolean).join(' ')
  const label = team?.name || team?.code || team?.short_name || 'Team'

  if (!asset) {
    return (
      <span aria-label={`${label} flag unavailable`} className={`${classes} flag-fallback`} role="img">
        {fallbackCode(team)}
      </span>
    )
  }

  return (
    <img
      alt={decorative ? '' : `${label} flag`}
      className={`${classes} flag-image`}
      loading="lazy"
      src={asset.src}
    />
  )
}

function fallbackCode(team = {}) {
  return String(team.code || team.short_name || team.tla || team.name || 'TBD').slice(0, 3).toUpperCase()
}

const ICON_PATHS = {
  activity: (
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  ),
  calendar: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  check: (
    <>
      <path d="M9 12l2 2 4-5" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  chevronDown: (
    <path d="M6 9l6 6 6-6" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flame: (
    <path d="M12 22c4 0 7-3 7-7 0-3-1.6-5.2-3.8-7.4-.6 2-1.8 3.4-3.2 4.4.4-3.2-1-5.8-3.4-8C8.4 7.4 5 9.8 5 15c0 4 3 7 7 7z" />
  ),
  lock: (
    <>
      <rect width="16" height="11" x="4" y="11" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  medal: (
    <>
      <path d="M8 2l4 7 4-7" />
      <circle cx="12" cy="14" r="6" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </>
  ),
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" />
      <path d="M19 15l.8 3.2L23 19l-3.2.8L19 23l-.8-3.2L15 19l3.2-.8L19 15z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 7H4a3 3 0 0 0 3 3" />
      <path d="M17 7h3a3 3 0 0 1-3 3" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
}

export default function Icon({ className = '', name, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      className={['app-icon', className].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      {ICON_PATHS[name] || ICON_PATHS.spark}
    </svg>
  )
}

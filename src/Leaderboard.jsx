import { memo, useMemo } from 'react'
import { buildLeaderboard } from './scoring'

function Leaderboard({ data }) {
  const rows = useMemo(() => buildLeaderboard(data), [data])
  const leader = rows[0]

  return (
    <section className="screen-stack">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Live table</p>
          <h2>{leader ? `${leader.name} leads on ${leader.points} pts` : 'Leaderboard'}</h2>
          <p>Tie-breakers are already baked in: correct picks, head-to-head, upset size, knockouts.</p>
        </div>
      </div>

      <div className="leaderboard">
        {rows.map((row, index) => (
          <article className={index === 0 ? 'leader-row leader' : 'leader-row'} key={row.id}>
            <div className="rank">#{index + 1}</div>
            {row.avatar ? <img alt="" className="avatar" src={row.avatar} /> : <div className="avatar" />}
            <div className="leader-main">
              <strong>{row.name}</strong>
              <span>
                {row.correctPicks}/{row.finishedPicks} correct · {row.accuracy.toFixed(0)}% ·
                {` ${row.jokersUsed}/3 jokers`}
              </span>
            </div>
            <div className="leader-meta">
              <small>Upset {row.biggestUpset || '-'}</small>
              <small>KO {row.knockoutPoints}</small>
            </div>
            <div className="points">{row.points}</div>
          </article>
        ))}
      </div>

      {rows.length === 0 && <div className="panel empty-state">No players yet.</div>}
    </section>
  )
}

export default memo(Leaderboard)

export default function Rules() {
  return (
    <section className="rules-layout">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Game rules</p>
          <h2>Simple picks, sharp scoring.</h2>
          <p>Pick the winner, predict the scoreline, and use jokers wisely.</p>
        </div>
      </div>

      <Rule title="Main Pick">
        Correct winner predictions are worth +3. Wrong winner predictions are 0. Knockouts use
        the team that advances.
      </Rule>
      <Rule title="Scoreline Insight">
        Exact final score is +3. One goal away is +2, two goals away is +1, three goals away is 0,
        and four or more goals away is -1. Scoreline predictions are required before saving a pick.
      </Rule>
      <Rule title="Jokers">
        Three per player for the tournament. One per match. They double the complete match score,
        so a 6-point match becomes 12.
      </Rule>
      <Rule title="Tie-Breakers">
        Total points, correct picks, then head-to-head on differed picks.
      </Rule>
    </section>
  )
}

function Rule({ children, title }) {
  return (
    <article className="rule-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  )
}

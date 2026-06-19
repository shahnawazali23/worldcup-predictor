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
      <Rule title="Scoreline Components">
        Scoreline rewards require the correct match result and an aligned scoreline. Exact score is
        +2, BTTS is +1, and the correct margin band is +1. Wrong-result scorelines can only receive
        BTTS or margin penalties.
      </Rule>
      <Rule title="Jokers">
        Three per player for the tournament. One per match. They double the complete match score,
        so a 7-point match becomes 14.
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

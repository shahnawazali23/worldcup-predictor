export default function Rules() {
  return (
    <section className="rules-layout">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Game rules</p>
          <h2>Simple picks, sharp scoring.</h2>
          <p>Pick the winner, chase exact scorelines, and use jokers to double your best calls.</p>
        </div>
      </div>

      <Rule title="Main Pick">
        Correct winner predictions are worth +3. Wrong winner predictions are 0. Knockouts use
        the team that advances.
      </Rule>
      <Rule title="Scoreline">
        Exact final score is +3. Correct goal difference is +1. Anything else is 0. Blank
        scorelines are also 0.
      </Rule>
      <Rule title="Jokers">
        Three per player for the tournament. One per match. They double the complete match score,
        so a perfect 6-point match becomes 12.
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

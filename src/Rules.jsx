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
      <Rule title="Scoreline Accuracy">
        Scoreline rewards require the correct match result and a scoreline that matches your pick.
        The closer your scoreline is to the final result, the more it can add.
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

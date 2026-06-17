export default function Rules() {
  return (
    <section className="rules-layout">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Game rules</p>
          <h2>Simple picks, sharp scoring.</h2>
          <p>Pick the winner, predict the scoreline, beat the forecast, and use jokers wisely.</p>
        </div>
      </div>

      <Rule title="Main Pick">
        Correct winner predictions are worth +3. Wrong winner predictions are 0. Knockouts use
        the team that advances.
      </Rule>
      <Rule title="Scoreline">
        Exact final score is +2. Scoreline predictions are required before saving a pick.
      </Rule>
      <Rule title="Insight Bonus">
        If your score prediction reads the match better than the internal expected score forecast,
        you can earn +1 or +2. If it reads the match worse, the insight score is -1.
        Expected scores are hidden until the match is complete.
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

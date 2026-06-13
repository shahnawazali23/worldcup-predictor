export default function Rules() {
  return (
    <section className="rules-layout">
      <div className="hero-band compact">
        <div>
          <p className="eyebrow">Game rules</p>
          <h2>Simple picks, sharp scoring.</h2>
          <p>Optional bets can help, but blanks are safe. Jokers double the whole match score.</p>
        </div>
      </div>

      <Rule title="Main Pick">
        Favourite wins are worth 1 point. Underdogs pay 2, 3, or 5 points depending on the fixed
        FIFA ranking gap. Knockouts use the team that advances.
      </Rule>
      <Rule title="Scoreline">
        Exact final score is +3. Correct goal difference is +1. Wrong goal difference is -2. Blank
        scorelines are 0.
      </Rule>
      <Rule title="Penalties">
        Knockouts only. A correct penalty call is +5. A wrong yes/no call is -3. Blank is safe.
      </Rule>
      <Rule title="Multipliers">
        Main-pick points only: Group x1, R32 x1.5, R16 x2, QF x2.5, Semi x3, Final x4.
      </Rule>
      <Rule title="Jokers">
        Three per player for the tournament. One per match. They double the complete match score,
        including negative scores.
      </Rule>
      <Rule title="Tie-Breakers">
        Total points, correct picks, head-to-head on differed picks, biggest upset, then knockout
        points.
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

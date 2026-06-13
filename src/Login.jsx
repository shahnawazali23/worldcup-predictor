import { supabase } from './supabaseClient'

export default function Login() {
  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-copy">
          <p className="eyebrow">World Cup 2026</p>
          <h1>Prediction League</h1>
          <p>
            Pick every match, chase upsets, protect your scoreline bets, and spend three jokers
            wisely.
          </p>
          <button className="primary-action" onClick={handleLogin} type="button">
            Sign in with Google
          </button>
        </div>
        <div className="login-scoreboard" aria-hidden="true">
          <div>
            <span>MEX</span>
            <strong>2</strong>
          </div>
          <div>
            <span>RSA</span>
            <strong>0</strong>
          </div>
          <small>Upset tiers · Exact scores · Jokers</small>
        </div>
      </section>
    </main>
  )
}

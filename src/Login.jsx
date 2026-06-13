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
          <h1>Call the upsets. Beat your friends.</h1>
          <p>
            Predict every World Cup match, chase scoreline bonuses, and use your jokers wisely.
          </p>
          <button className="primary-action" onClick={handleLogin} type="button">
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
        <div className="login-explainer">
          <h2>How it works</h2>
          <ol>
            <li><span>1</span>Pick the match result</li>
            <li><span>2</span>Predict the exact scoreline</li>
            <li><span>3</span>Play 3 jokers wisely</li>
            <li><span>4</span>Call upsets to climb the table</li>
          </ol>
        </div>
      </section>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="google-icon" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.2z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.4l3.3-2.6z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1z" />
    </svg>
  )
}

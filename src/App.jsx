import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import Admin from './Admin'
import History from './History'
import Leaderboard from './Leaderboard'
import Login from './Login'
import Predictions from './Predictions'
import Rules from './Rules'
import { loadLeagueData } from './data'

const navItems = [
  { id: 'predictions', label: 'Predictions' },
  { id: 'history', label: 'History' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'rules', label: 'Rules' },
  { id: 'admin', label: 'Admin' },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('predictions')
  const scrollPositionsRef = useRef({ predictions: 0 })
  const hasLoadedLeagueDataRef = useRef(false)
  const [leagueData, setLeagueData] = useState({
    fixtures: [],
    teamsById: {},
    predictions: [],
    profiles: [],
    syncRuns: [],
  })
  const [loading, setLoading] = useState(false)
  const [hasLoadedLeagueData, setHasLoadedLeagueData] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      const { data } = await supabase.auth.getSession()
      if (mounted) setSession(data.session)
    }

    initAuth()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) return

    let mounted = true

    async function hydrate() {
      const shouldShowFullPageLoading = !hasLoadedLeagueDataRef.current
      if (shouldShowFullPageLoading) setLoading(true)
      setLoadError('')
      try {
        const data = await loadLeagueData()
        if (mounted) {
          setLeagueData(data)
          hasLoadedLeagueDataRef.current = true
          setHasLoadedLeagueData(true)
        }
      } catch (error) {
        if (mounted) setLoadError(error.message)
      } finally {
        if (mounted && shouldShowFullPageLoading) setLoading(false)
      }
    }

    hydrate()

    return () => {
      mounted = false
    }
  }, [session])

  const currentProfile = useMemo(() => {
    if (!session) return null
    return leagueData.profiles.find((profile) => profile.id === session.user.id) || null
  }, [leagueData.profiles, session])

  async function refreshLeagueData() {
    setLoadError('')
    const data = await loadLeagueData()
    setLeagueData(data)
  }

  function updateSavedPrediction(savedPrediction) {
    setLeagueData((current) => {
      const nextPredictions = current.predictions.filter(
        (prediction) =>
          !(
            prediction.user_id === savedPrediction.user_id &&
            prediction.fixture_id === savedPrediction.fixture_id
          ),
      )

      return {
        ...current,
        predictions: [...nextPredictions, savedPrediction],
      }
    })
  }

  function switchPage(nextPage) {
    if (nextPage === page) return

    scrollPositionsRef.current[page] = window.scrollY
    setPage(nextPage)
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionsRef.current[nextPage] || 0)
    })
  }

  if (!session) return <Login />

  const isAdmin = currentProfile?.is_admin === true

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">World Cup 2026</p>
          <h1>Prediction League</h1>
        </div>

        <nav className="nav-tabs" aria-label="Primary navigation">
          {navItems
            .filter((item) => item.id !== 'admin' || isAdmin)
            .map((item) => (
              <button
                className={page === item.id ? 'nav-tab nav-tab-active' : 'nav-tab'}
                key={item.id}
                onClick={() => switchPage(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
        </nav>

        <div className="account">
          {session.user.user_metadata?.avatar_url && (
            <img
              alt=""
              className="avatar"
              src={session.user.user_metadata.avatar_url}
            />
          )}
          <div>
            <strong>{currentProfile?.display_name || session.user.email}</strong>
            <button onClick={() => supabase.auth.signOut()} type="button">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main-grid">
        {loadError && (
          <div className="alert alert-danger">
            {loadError}. Check that the Supabase schema in <code>supabase/schema.sql</code> has
            been applied.
          </div>
        )}

        {loading && !hasLoadedLeagueData && (
          <div className="panel loading-panel">Loading league data...</div>
        )}

        {!loading && (
          <>
            <div hidden={page !== 'predictions'}>
              <Predictions
                active={page === 'predictions'}
                data={leagueData}
                onPredictionSaved={updateSavedPrediction}
                session={session}
              />
            </div>
            <div hidden={page !== 'history'}>
              <History data={leagueData} session={session} />
            </div>
            <div hidden={page !== 'leaderboard'}>
              <Leaderboard data={leagueData} session={session} />
            </div>
            <div hidden={page !== 'rules'}>
              <Rules />
            </div>
            {isAdmin && (
              <div hidden={page !== 'admin'}>
                <Admin data={leagueData} onRefresh={refreshLeagueData} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

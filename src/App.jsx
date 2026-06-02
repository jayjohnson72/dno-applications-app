import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Components/dashboard'
import NewApplication from './Components/NewApplication'
import Auth from './Components/Auth'
import CustomerPortal from './CustomerPortal'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [dashboardKey, setDashboardKey] = useState(0)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [customerToken, setCustomerToken] = useState(null)

  useEffect(() => {
    // Check for customer portal token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) setCustomerToken(token)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  function goToDashboard() {
    setDashboardKey(k => k + 1)
    setCurrentPage('dashboard')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Show customer portal if token in URL
  if (customerToken) {
    return <CustomerPortal token={customerToken} />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-800 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">DNO Application Manager</h1>
          <div className="flex gap-4 items-center">
            <button onClick={goToDashboard}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 'dashboard' ? 'bg-white text-blue-800' : 'text-white hover:bg-blue-700'}`}>
              Dashboard
            </button>
            <button onClick={() => setCurrentPage('new')}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 'new' ? 'bg-white text-blue-800' : 'text-white hover:bg-blue-700'}`}>
              New Application
            </button>
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-blue-600">
              <span className="text-xs text-blue-200">{session.user.email}</span>
              <button onClick={handleSignOut}
                className="text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-950 transition font-medium">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard key={dashboardKey} setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'new' && (
          <NewApplication setCurrentPage={goToDashboard} />
        )}
      </main>
    </div>
  )
}
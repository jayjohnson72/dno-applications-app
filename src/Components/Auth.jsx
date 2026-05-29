import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Installer registration fields
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [installerNumber, setInstallerNumber] = useState('')
  const [mcsNumber, setMcsNumber] = useState('')
  const [phone, setPhone] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Create auth account
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Save installer profile
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          full_name: fullName,
          company_name: companyName,
          installer_number: installerNumber,
          mcs_number: mcsNumber,
          phone: phone,
        }])
      if (profileError) {
        setError('Account created but profile could not be saved: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setMessage('Account created! You can now log in.')
    setTab('login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="bg-blue-800 rounded-t-xl px-6 py-6 text-center">
          <h1 className="text-2xl font-bold text-white">DNO Application Manager</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to manage your applications</p>
        </div>

        <div className="flex border-b border-gray-200">
          <button onClick={() => { setTab('login'); setError(null); setMessage(null) }}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === 'login' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Sign In
          </button>
          <button onClick={() => { setTab('register'); setError(null); setMessage(null) }}
            className={`flex-1 py-3 text-sm font-medium transition ${tab === 'register' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Register as Installer
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters" required minLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50">
                {loading ? 'Please wait...' : 'Sign In'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setTab('register'); setError(null) }}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  Don't have an account? Register as an installer
                </button>
              </div>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 mb-2">
                Register your installer details below. These will be used to submit applications via ENA Connect Direct once your API access is approved.
              </div>

              <div className="border-b border-gray-100 pb-4 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters" required minLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Installer details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. John Smith" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Smith Electrical Ltd" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installer number
                    <span className="text-gray-400 font-normal ml-1">(NAPIT / NICEIC / ECA)</span>
                  </label>
                  <input type="text" value={installerNumber} onChange={e => setInstallerNumber(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MCS number
                    <span className="text-gray-400 font-normal ml-1">(for solar / heat pump)</span>
                  </label>
                  <input type="text" value={mcsNumber} onChange={e => setMcsNumber(e.target.value)}
                    placeholder="e.g. MCS12345"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 07700 900000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Installer Account'}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => { setTab('login'); setError(null) }}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
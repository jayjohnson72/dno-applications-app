import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function deleteUserData(userId, userEmail) {
    if (!confirm(`Delete all applications and data for ${userEmail}? This cannot be undone.`)) return
    setDeleting(userId)
    try {
      await supabase.from('application_timeline').delete().eq('user_id', userId)
      await supabase.from('applications').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      alert(`Data deleted for ${userEmail}.\n\nTo remove their login access, go to:\nSupabase → Authentication → Users\nand delete ${userEmail} from there.`)
      await fetchUsers()
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setDeleting(null)
  }

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
            <p className="text-xs text-gray-500">Manage user accounts</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 mb-4">
            To fully remove a user login, go to{' '}
            <a href="https://supabase.com/dashboard/project/wutqbleywmhihuedodny/auth/users"
              target="_blank" rel="noreferrer"
              className="underline font-medium hover:text-blue-900">
              Supabase → Authentication → Users ↗
            </a>
            {' '}and delete them there.
          </div>

          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={fetchUsers}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {loading ? (
            <p className="text-gray-500 text-sm text-center py-8">Loading accounts...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No accounts found</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</p>
              {filtered.map(user => (
                <div key={user.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{user.email}</p>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {user.full_name && <p>Name: {user.full_name}</p>}
                      <p>Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
                      <p className="text-gray-400 font-mono">{user.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://supabase.com/dashboard/project/wutqbleywmhihuedodny/auth/users"
                      target="_blank" rel="noreferrer"
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition text-center whitespace-nowrap">
                      Delete Login ↗
                    </a>
                    <button
                      onClick={() => deleteUserData(user.id, user.email)}
                      disabled={deleting === user.id}
                      className="bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 whitespace-nowrap">
                      {deleting === user.id ? 'Deleting...' : 'Delete Data'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
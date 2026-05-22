import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const statusColours = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const typeLabels = {
  G98: 'G98 — up to 3.68kW',
  G99: 'G99 — over 3.68kW',
  EV: 'EV Charger',
  HeatPump: 'Heat Pump',
}

export default function Dashboard({ setCurrentPage }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchApplications() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setApplications(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const counts = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'draft').length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    approved: applications.filter(a => a.status === 'approved').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchApplications}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
          >
            Refresh
          </button>
          <button
            onClick={() => setCurrentPage('new')}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition font-medium"
          >
            + New Application
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Database error:</strong> {error}
          <br />
          <span className="text-red-500 text-xs">Check that the &quot;applications&quot; table exists in Supabase with the correct columns.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: counts.total, colour: 'bg-blue-50 text-blue-800' },
          { label: 'Draft', value: counts.draft, colour: 'bg-gray-50 text-gray-800' },
          { label: 'Submitted', value: counts.submitted, colour: 'bg-yellow-50 text-yellow-800' },
          { label: 'Approved', value: counts.approved, colour: 'bg-green-50 text-green-800' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.colour} rounded-xl p-4 text-center`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading applications...</p>
      ) : error ? null : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg mb-4">No applications yet</p>
          <button
            onClick={() => setCurrentPage('new')}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Create your first application
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Address</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, i) => (
                <tr key={app.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">{app.customer_name}</td>
                  <td className="px-4 py-3 text-gray-600">{typeLabels[app.type] || app.type}</td>
                  <td className="px-4 py-3 text-gray-600">{app.site_address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColours[app.status] || 'bg-gray-100 text-gray-700'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(app.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

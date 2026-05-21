import { useState } from 'react'
import { supabase } from '../supabase'

export default function NewApplication({ setCurrentPage }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    type: 'G98',
    customer_name: '',
    site_address: '',
    postcode: '',
    mpan: '',
    status: 'draft',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('applications')
      .insert([form])
    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => setCurrentPage('dashboard'), 1500)
    } else {
      alert('Error saving application: ' + error.message)
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Saved!</h2>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New DNO Application</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        
        {/* Application Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="G98">G98 — Small scale (up to 3.68kW)</option>
            <option value="G99">G99 — Large scale (over 3.68kW)</option>
            <option value="EV">EV Charger Installation</option>
            <option value="HeatPump">Heat Pump Installation</option>
          </select>
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            placeholder="e.g. John Smith"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Site Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Address
          </label>
          <input
            type="text"
            name="site_address"
            value={form.site_address}
            onChange={handleChange}
            placeholder="e.g. 123 Main Street, Burnley"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Postcode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postcode
          </label>
          <input
            type="text"
            name="postcode"
            value={form.postcode}
            onChange={handleChange}
            placeholder="e.g. BB11 1AA"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* MPAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MPAN Number
          </label>
          <input
            type="text"
            name="mpan"
            value={form.mpan}
            onChange={handleChange}
            placeholder="13 digit MPAN number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Application'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('dashboard')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}
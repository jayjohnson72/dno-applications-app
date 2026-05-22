import { useState } from 'react'
import { supabase } from '../supabase'

export default function EditApplication({ application, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [form, setForm] = useState({
    type: application.type || 'G98',
    customer_name: application.customer_name || '',
    site_address: application.site_address || '',
    postcode: application.postcode || '',
    mpan: application.mpan || '',
    status: application.status || 'draft',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSaveError(null)
    const { error } = await supabase
      .from('applications')
      .update(form)
      .eq('id', application.id)
    setLoading(false)
    if (error) {
      setSaveError(error.message)
    } else {
      onSaved()
    }
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application.id)
    setLoading(false)
    if (error) {
      setSaveError(error.message)
      setConfirmDelete(false)
    } else {
      onSaved()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Edit Application</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {saveError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Type</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
            <input
              type="text"
              name="site_address"
              value={form.site_address}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <input
                type="text"
                name="postcode"
                value={form.postcode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MPAN Number</label>
              <input
                type="text"
                name="mpan"
                value={form.mpan}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-medium hover:bg-red-100 transition disabled:opacity-50 text-sm"
            >
              Delete Application
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium mb-3">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                  className="flex-1 bg-white text-gray-700 border border-gray-200 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Keep It
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

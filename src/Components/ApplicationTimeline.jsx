import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const STATUS_COLOURS = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  escalated: "bg-orange-100 text-orange-700 border-orange-200",
  ena_submitted: "bg-purple-100 text-purple-700 border-purple-200",
  ena_approved: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_ICONS = {
  draft: "📝",
  submitted: "📤",
  approved: "✅",
  rejected: "❌",
  escalated: "⚠️",
  ena_submitted: "🔗",
  ena_approved: "✅",
};

function formatDate(ts) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export default function ApplicationTimeline({ app, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState(app.status)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTimeline()
  }, [])

  async function fetchTimeline() {
    setLoading(true)
    const { data } = await supabase
      .from('application_timeline')
      .select('*')
      .eq('application_id', app.id)
      .order('created_at', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function addEvent() {
    if (!status) return
    setSaving(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    const { error: timelineError } = await supabase
      .from('application_timeline')
      .insert([{
        application_id: app.id,
        user_id: user?.id,
        status,
        note: note.trim() || null,
      }])

    if (!timelineError) {
      await supabase
        .from('applications')
        .update({ status })
        .eq('id', app.id)
      setNote('')
      await fetchTimeline()
    }
    setSaving(false)
  }
  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Application Timeline</h2>
              <p className="text-xs text-gray-500">{app.customer_name} · {app.site_address}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="p-6">

            {/* Add new event */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Update status</p>
              <div className="space-y-3">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="escalated">Escalated to DNO engineer</option>
                  <option value="ena_submitted">Submitted via ENA Connect Direct</option>
                  <option value="ena_approved">Approved via ENA Connect Direct</option>
                </select>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note (optional) — e.g. reference number, reason for rejection, engineer comments..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button onClick={addEvent} disabled={saving}
                  className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50 text-sm">
                  {saving ? 'Saving...' : 'Add to timeline'}
                </button>
              </div>
            </div>

            {/* Timeline events */}
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading timeline...</p>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No timeline events yet</p>
                <p className="text-gray-400 text-xs mt-1">Add a status update above to get started</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {events.map((event, i) => (
                    <div key={event.id} className="relative flex gap-4 pl-10">
                      <div className="absolute left-2 w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs">
                        {STATUS_ICONS[event.status] || '📋'}
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOURS[event.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                        </div>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
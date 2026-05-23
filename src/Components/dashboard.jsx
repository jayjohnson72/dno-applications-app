import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import EditApplication from "./EditApplication"
import jsPDF from "jspdf"
import LoadCalculator from "./LoadCalculator"

const statusColours = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const typeLabels = {
  G98: "G98 — up to 3.68kW",
  G99: "G99 — over 3.68kW",
  EV: "EV Charger",
  HeatPump: "Heat Pump",
}

const DNO_PORTALS = {
  "Electricity North West": "https://www.enwl.co.uk/connections/connection-enquiries/",
  "Northern Powergrid": "https://www.northernpowergrid.com/connections",
  "UK Power Networks": "https://www.ukpowernetworks.co.uk/connections/connections-enquiry-form",
  "Western Power Distribution": "https://www.westernpower.co.uk/connections/i-want-to-connect/connections-enquiry",
  "SSEN Distribution": "https://www.ssen.co.uk/connections/",
  "SSEN Transmission": "https://www.ssen-transmission.co.uk/connections/",
  "SP Energy Networks": "https://www.spenergynetworks.co.uk/pages/connections.aspx",
  "SP Manweb": "https://www.spenergynetworks.co.uk/pages/connections.aspx",
}

export default function Dashboard({ setCurrentPage, demoMode, demoApplications }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [filterDno, setFilterDno] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [submitting, setSubmitting] = useState(null)
  const [loadCalc, setLoadCalc] = useState(null)

  function downloadPDF(app) {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("DNO Connection Application", 20, 20)
    doc.setFontSize(11)
    doc.text(`Date: ${new Date(app.created_at).toLocaleDateString("en-GB")}`, 20, 35)
    doc.text(`Status: ${app.status}`, 20, 43)
    doc.setFontSize(13)
    doc.text("Customer Details", 20, 57)
    doc.setFontSize(11)
    doc.text(`Name: ${app.customer_name}`, 20, 66)
    doc.text(`Address: ${app.site_address}`, 20, 74)
    doc.text(`Postcode: ${app.postcode}`, 20, 82)
    doc.text(`MPAN: ${app.mpan || "Not provided"}`, 20, 90)
    doc.setFontSize(13)
    doc.text("Application Details", 20, 104)
    doc.setFontSize(11)
    doc.text(`Type: ${app.type}`, 20, 113)
    doc.setFontSize(13)
    doc.text("Distribution Network Operator", 20, 127)
    doc.setFontSize(11)
    doc.text(`DNO: ${app.dno_name || "Not identified"}`, 20, 136)
    doc.text(`Region: ${app.dno_region || "—"}`, 20, 144)
    doc.text(`Emergency: ${app.dno_emergency || "—"}`, 20, 152)
    doc.save(`application-${app.customer_name.replace(/\s+/g, "-")}.pdf`)
  }

  async function fetchApplications() {
    setLoading(true)
    setError(null)
    if (demoMode) { setApplications(demoApplications || []); setLoading(false); return }
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) { setError(error.message) } else { setApplications(data) }
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [])

  function handleSaved() {
    setEditing(null)
    fetchApplications()
  }

  const dnoOptions = [...new Set(applications.filter(a => a.dno_name).map(a => a.dno_name))].sort()

  const filtered = applications.filter(a => {
    const dnoMatch = filterDno === "all" || a.dno_name === filterDno
    const statusMatch = filterStatus === "all" || a.status === filterStatus
    return dnoMatch && statusMatch
  })

  const counts = {
    total: applications.length,
    draft: applications.filter(a => a.status === "draft").length,
    submitted: applications.filter(a => a.status === "submitted").length,
    approved: applications.filter(a => a.status === "approved").length,
  }

  return (
    <div>
      {editing && (
        <EditApplication
          application={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {loadCalc && (
        <LoadCalculator app={loadCalc} onClose={() => setLoadCalc(null)} />
      )}

      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Submit to DNO</h2>
              <button onClick={() => setSubmitting(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Submitting to</p>
                <p className="text-sm font-semibold text-blue-800">{submitting.dno_name}</p>
                <p className="text-xs text-gray-500">{submitting.dno_region} · {submitting.dno_emergency}</p>
              </div>
              <p className="text-sm text-gray-600">Copy the details below and paste them into the DNO portal:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1 text-sm">
                <p><span className="font-medium">Customer:</span> {submitting.customer_name}</p>
                <p><span className="font-medium">Address:</span> {submitting.site_address}</p>
                <p><span className="font-medium">Postcode:</span> {submitting.postcode}</p>
                <p><span className="font-medium">MPAN:</span> {submitting.mpan || "Not provided"}</p>
                <p><span className="font-medium">Type:</span> {submitting.type}</p>
                <p><span className="font-medium">DNO:</span> {submitting.dno_name}</p>
                <p><span className="font-medium">Region:</span> {submitting.dno_region}</p>
              </div>
              <a
                href={DNO_PORTALS[submitting.dno_name] || "https://www.google.com/search?q=" + encodeURIComponent(submitting.dno_name + " connection application")}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Open DNO Portal
              </a>
              <p className="text-xs text-gray-400 text-center">Opens in a new tab — copy the details above into the portal form</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex gap-3">
          <button onClick={fetchApplications}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium text-sm">
            Refresh
          </button>
          <button onClick={() => setCurrentPage("new")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition font-medium">
            + New Application
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Database error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: counts.total, colour: "bg-blue-50 text-blue-800" },
          { label: "Draft", value: counts.draft, colour: "bg-gray-50 text-gray-800" },
          { label: "Submitted", value: counts.submitted, colour: "bg-yellow-50 text-yellow-800" },
          { label: "Approved", value: counts.approved, colour: "bg-green-50 text-green-800" },
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
          <button onClick={() => setCurrentPage("new")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition">
            Create your first application
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-4">
            <select value={filterDno} onChange={e => setFilterDno(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All DNOs</option>
              {dnoOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Address</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">DNO</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr key={app.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium text-gray-800">{app.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{typeLabels[app.type] || app.type}</td>
                    <td className="px-4 py-3 text-gray-600">{app.site_address}</td>
                    <td className="px-4 py-3">
                      {app.dno_name ? (
                        <div>
                          <p className="text-gray-800 font-medium text-xs">{app.dno_name}</p>
                          <p className="text-gray-400 text-xs">{app.dno_emergency}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColours[app.status] || "bg-gray-100 text-gray-700"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => downloadPDF(app)}
                          className="text-green-600 hover:text-green-800 font-medium text-xs px-3 py-1 rounded-lg border border-green-200 hover:bg-green-50 transition">
                          PDF
                        </button>
                        <button onClick={() => setEditing(app)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition">
                          Edit
                        </button>
                        <button onClick={() => setLoadCalc(app)}
                          className="text-orange-600 hover:text-orange-800 font-medium text-xs px-3 py-1 rounded-lg border border-orange-200 hover:bg-orange-50 transition">
                          Load Calc
                        </button>
                        <button onClick={() => setSubmitting(app)}
                          className="text-purple-600 hover:text-purple-800 font-medium text-xs px-3 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 transition">
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
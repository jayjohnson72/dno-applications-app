import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import EditApplication from "./EditApplication";
import jsPDF from "jspdf";

const statusColours = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const typeLabels = {
  G98: "G98 — up to 3.68kW",
  G99: "G99 — over 3.68kW",
  EV: "EV Charger",
  HeatPump: "Heat Pump",
};
export default function Dashboard({ setCurrentPage }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filterDno, setFilterDno] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  function downloadPDF(app) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("DNO Connection Application", 20, 20);
    doc.setFontSize(11);
    doc.text(
      `Date: ${new Date(app.created_at).toLocaleDateString("en-GB")}`,
      20,
      35,
    );
    doc.text(`Status: ${app.status}`, 20, 43);
    doc.setFontSize(13);
    doc.text("Customer Details", 20, 57);
    doc.setFontSize(11);
    doc.text(`Name: ${app.customer_name}`, 20, 66);
    doc.text(`Address: ${app.site_address}`, 20, 74);
    doc.text(`Postcode: ${app.postcode}`, 20, 82);
    doc.text(`MPAN: ${app.mpan || "Not provided"}`, 20, 90);
    doc.setFontSize(13);
    doc.text("Application Details", 20, 104);
    doc.setFontSize(11);
    doc.text(`Type: ${app.type}`, 20, 113);
    doc.setFontSize(13);
    doc.text("Distribution Network Operator", 20, 127);
    doc.setFontSize(11);
    doc.text(`DNO: ${app.dno_name || "Not identified"}`, 20, 136);
    doc.text(`Region: ${app.dno_region || "—"}`, 20, 144);
    doc.text(`Emergency: ${app.dno_emergency || "—"}`, 20, 152);
    doc.save(`application-${app.customer_name.replace(/\s+/g, "-")}.pdf`);
  }

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setApplications(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  function handleSaved() {
    setEditing(null);
    fetchApplications();
  }

  const dnoOptions = [
    ...new Set(applications.filter((a) => a.dno_name).map((a) => a.dno_name)),
  ].sort();

  const filtered = applications.filter((a) => {
    const dnoMatch = filterDno === "all" || a.dno_name === filterDno;
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    return dnoMatch && statusMatch;
  });

  const counts = {
    total: applications.length,
    draft: applications.filter((a) => a.status === "draft").length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    approved: applications.filter((a) => a.status === "approved").length,
  };
  return (
    <div>
      {editing && (
        <EditApplication
          application={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

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
            onClick={() => setCurrentPage("new")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition font-medium"
          >
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
          {
            label: "Total",
            value: counts.total,
            colour: "bg-blue-50 text-blue-800",
          },
          {
            label: "Draft",
            value: counts.draft,
            colour: "bg-gray-50 text-gray-800",
          },
          {
            label: "Submitted",
            value: counts.submitted,
            colour: "bg-yellow-50 text-yellow-800",
          },
          {
            label: "Approved",
            value: counts.approved,
            colour: "bg-green-50 text-green-800",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.colour} rounded-xl p-4 text-center`}
          >
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
            onClick={() => setCurrentPage("new")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Create your first application
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-4">
            <select
              value={filterDno}
              onChange={(e) => setFilterDno(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All DNOs</option>
              {dnoOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Address
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    DNO
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {app.customer_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {typeLabels[app.type] || app.type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {app.site_address}
                    </td>
                    <td className="px-4 py-3">
                      {app.dno_name ? (
                        <div>
                          <p className="text-gray-800 font-medium text-xs">
                            {app.dno_name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {app.dno_emergency}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColours[app.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => downloadPDF(app)}
                        className="text-green-600 hover:text-green-800 font-medium text-xs px-3 py-1 rounded-lg border border-green-200 hover:bg-green-50 transition"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => setEditing(app)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

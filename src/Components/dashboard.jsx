import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";
import EditApplication from "./EditApplication";
import jsPDF from "jspdf";
import LoadCalculator from "./LoadCalculator";
import ApplicationTimeline from "./ApplicationTimeline";
import * as XLSX from "xlsx";

const ENA_ENABLED = true;

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

const DNO_PORTALS = {
  "Electricity North West": "https://www.enwl.co.uk/get-connected/",
  "Northern Powergrid": "https://www.northernpowergrid.com/connections",
  "UK Power Networks": "https://www.ukpowernetworks.co.uk/connections",
  "Western Power Distribution":
    "https://www.nationalgrid.com/electricity-distribution/connections",
  "SSEN Distribution": "https://www.ssen.co.uk/connections/",
  "SSEN Transmission": "https://www.ssen-transmission.co.uk/connections/",
  "SP Energy Networks":
    "https://www.spenergynetworks.co.uk/pages/connections.aspx",
  "SP Manweb": "https://www.spenergynetworks.co.uk/pages/connections.aspx",
};

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function SubmitModal({ app, onClose }) {
  const [stage, setStage] = useState("confirm");
  const [enaResult, setEnaResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [enaEnv, setEnaEnv] = useState("sandbox");

  async function handleENASubmit() {
    if (!app.cutout_image_url) {
      setStage("nophoto");
      return;
    }
    setStage("submitting");
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      // Convert image to base64
      const { base64, mimeType } = await fetchImageAsBase64(
        app.cutout_image_url,
      );

      // Upload image via Edge Function
      const uploadRes = await supabase.functions.invoke("ena-submit", {
        body: {
          action: "upload-image",
          imageBase64: base64,
          imageMimeType: mimeType,
          environment: enaEnv,
        },
      });
      if (uploadRes.error)
        throw new Error(`Image upload failed: ${uploadRes.error.message}`);
      if (uploadRes.data?.error)
        throw new Error(`Image upload failed: ${uploadRes.data.error}`);
      const attachmentId = uploadRes.data?.attachmentId;
      if (!attachmentId)
        throw new Error("No attachment ID returned from image upload");

      // Submit application via Edge Function
      const submitRes = await supabase.functions.invoke("ena-submit", {
        body: {
          action: "submit-application",
          app: app,
          profile: { ...profile, email: user?.email },
          attachmentId: attachmentId,
          environment: enaEnv,
        },
      });
      if (submitRes.error)
        throw new Error(`Submission failed: ${submitRes.error.message}`);
      if (submitRes.data?.error)
        throw new Error(`Submission failed: ${submitRes.data.error}`);
      const data = submitRes.data;

      await supabase
        .from("applications")
        .update({
          ena_application_id: data.applicationId || data.id,
          ena_status: data.status || "Awaiting Assessment",
          status: "submitted",
        })
        .eq("id", app.id);

      await supabase.from("application_timeline").insert([
        {
          application_id: app.id,
          user_id: user?.id,
          status: "ena_submitted",
          note: `Submitted via ENA Connect Direct. Application ID: ${data.applicationId || data.id}. Status: ${data.status || "Awaiting Assessment"}`,
          note_only: false,
        },
      ]);

      setEnaResult({
        applicationId: data.applicationId || data.id,
        status: data.status || "Awaiting Assessment",
      });
      setStage("success");
    } catch (e) {
      setErrorMsg(e.message);
      setStage("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Submit to DNO</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 space-y-4">
          {stage === "confirm" && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Submitting to</p>
                <p className="text-sm font-semibold text-blue-800">
                  {app.dno_name}
                </p>
                <p className="text-xs text-gray-500">
                  {app.dno_region} · {app.dno_emergency}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {app.customer_name}
                </p>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {app.site_address}
                </p>
                <p>
                  <span className="font-medium">Postcode:</span> {app.postcode}
                </p>
                <p>
                  <span className="font-medium">MPAN:</span>{" "}
                  {app.mpan || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {app.type}
                </p>
              </div>
              {!app.cutout_image_url && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                  ⚠️ No cut-out image — required for ENA Connect Direct. You can
                  still submit manually.
                </div>
              )}
              {ENA_ENABLED && app.cutout_image_url && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEnaEnv("sandbox")}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${enaEnv === "sandbox" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300"}`}
                    >
                      🧪 Sandbox
                    </button>
                    <button
                      onClick={() => setEnaEnv("live")}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${enaEnv === "live" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"}`}
                    >
                      🟢 Live
                    </button>
                  </div>
                  {enaEnv === "live" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                      ⚠️ Live mode — this will submit a real application to the
                      DNO
                    </div>
                  )}
                  {enaEnv === "sandbox" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
                      🧪 Sandbox mode — test submission, no real application
                      will be created
                    </div>
                  )}
                  <button
                    onClick={handleENASubmit}
                    className={`w-full py-2 rounded-lg font-medium transition text-white ${enaEnv === "live" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
                  >
                    🔗 Submit via ENA Connect Direct (
                    {enaEnv === "live" ? "Live" : "Sandbox"})
                  </button>
                </div>
              )}
              <a
                href={
                  DNO_PORTALS[app.dno_name] ||
                  "https://www.google.com/search?q=" +
                    encodeURIComponent(app.dno_name + " connection application")
                }
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Open DNO Portal Manually
              </a>
            </>
          )}
          {stage === "submitting" && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="text-gray-700 font-medium">
                Submitting to ENA Connect Direct...
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Uploading cut-out image and sending application
              </p>
            </div>
          )}
          {stage === "success" && enaResult && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-green-700 mb-2">
                Submitted Successfully!
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-2 text-sm">
                <p>
                  <span className="font-medium">ENA Application ID:</span>{" "}
                  {enaResult.applicationId}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {enaResult.status}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Timeline updated automatically. ENA will assess and update the
                  status shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Close
              </button>
            </div>
          )}
          {stage === "error" && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-red-700 mb-1">
                  ENA submission failed
                </p>
                <p className="text-xs text-red-500">{errorMsg}</p>
              </div>
              <a
                href={
                  DNO_PORTALS[app.dno_name] ||
                  "https://www.google.com/search?q=" +
                    encodeURIComponent(app.dno_name + " connection application")
                }
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Open DNO Portal Manually
              </a>
              <button
                onClick={() => setStage("confirm")}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
              >
                Try Again
              </button>
            </>
          )}
          {stage === "nophoto" && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                ⚠️ No cut-out image found. Please edit the application to add a
                cut-out photo before submitting via ENA Connect Direct.
              </div>
              <a
                href={
                  DNO_PORTALS[app.dno_name] ||
                  "https://www.google.com/search?q=" +
                    encodeURIComponent(app.dno_name + " connection application")
                }
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Open DNO Portal Manually
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionMenu({
  app,
  onPDF,
  onEdit,
  onTimeline,
  onLoadCalc,
  onSubmit,
  onShare,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const items = [
    {
      label: "Download PDF",
      icon: "📄",
      colour: "text-green-700",
      action: onPDF,
    },
    {
      label: "Edit Application",
      icon: "✏️",
      colour: "text-blue-700",
      action: onEdit,
    },
    {
      label: "Timeline & Notes",
      icon: "🕐",
      colour: "text-teal-700",
      action: onTimeline,
    },
    {
      label: "Load Calculator",
      icon: "⚡",
      colour: "text-orange-700",
      action: onLoadCalc,
    },
    {
      label: "Submit to DNO",
      icon: "📤",
      colour: "text-purple-700",
      action: onSubmit,
    },
    {
      label: "Share with Customer",
      icon: "🔗",
      colour: "text-pink-700",
      action: onShare,
    },
  ];
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-800 transition shadow-sm"
      >
        Actions
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition ${item.colour} ${i < items.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  setCurrentPage,
  demoMode,
  demoApplications,
}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filterDno, setFilterDno] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitting, setSubmitting] = useState(null);
  const [loadCalc, setLoadCalc] = useState(null);
  const [timeline, setTimeline] = useState(null);

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

  function exportToExcel() {
    const rows = filtered.map((app) => ({
      "Customer Name": app.customer_name,
      "Site Address": app.site_address,
      Postcode: app.postcode,
      MPAN: app.mpan || "",
      "Application Type": typeLabels[app.type] || app.type,
      Status: app.status,
      "DNO Name": app.dno_name || "",
      "DNO Region": app.dno_region || "",
      "DNO Emergency": app.dno_emergency || "",
      "ENA Application ID": app.ena_application_id || "",
      "ENA Status": app.ena_status || "",
      "Date Created": new Date(app.created_at).toLocaleDateString("en-GB"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 25 },
      { wch: 35 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    XLSX.writeFile(
      wb,
      `DNO-Applications-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.xlsx`,
    );
  }

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    if (demoMode) {
      setApplications(demoApplications || []);
      setLoading(false);
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user?.id)
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
      {timeline && (
        <ApplicationTimeline
          app={timeline}
          onClose={() => {
            setTimeline(null);
            fetchApplications();
          }}
        />
      )}
      {loadCalc && (
        <LoadCalculator app={loadCalc} onClose={() => setLoadCalc(null)} />
      )}
      {submitting && (
        <SubmitModal
          app={submitting}
          onClose={() => {
            setSubmitting(null);
            fetchApplications();
          }}
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
          <div className="flex gap-3 mb-4 items-center flex-wrap">
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
            <div className="ml-auto">
              <button
                onClick={exportToExcel}
                disabled={filtered.length === 0}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                ⬇ Export to Excel ({filtered.length})
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
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
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColours[app.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {app.status}
                        </span>
                        {app.ena_application_id && (
                          <p className="text-xs text-purple-600 mt-0.5">
                            ENA: {app.ena_status || "Submitted"}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        app={app}
                        onPDF={() => downloadPDF(app)}
                        onEdit={() => setEditing(app)}
                        onTimeline={() => setTimeline(app)}
                        onLoadCalc={() => setLoadCalc(app)}
                        onSubmit={() => setSubmitting(app)}
                        onShare={() => {
                          const url = `${window.location.origin}?token=${app.customer_token}`;
                          navigator.clipboard.writeText(url);
                          alert("Customer link copied to clipboard!");
                        }}
                      />
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

import { useState } from "react";
import { supabase } from "../supabase";

const LOCATION_OPTIONS = [
  "Attic",
  "Bedroom",
  "Cellar/Basement",
  "Garage/Greenhouse",
  "Hall",
  "Kitchen",
  "Landing",
  "Outbuilding/Barn",
  "Under the stairs",
  "Toilet",
  "Outside Box",
  "O/S Box with restricted access",
  "Communal Cupboard",
  "Other not specified",
];

const SANDBOX = {
  base: "https://hybrid.connect-direct.tst.energynetworks.org",
  apiKey: "Q9b0SR0xxZ7TNlgsWcwCY7572MlGgjuQEDyDQTO4",
  tenantId: "66329264-5021-704a-29a0-c97efef3aa2c",
  auth: "Q9b0SR0xxZ7TNlgsWcwCY7572MlGgjuQEDyDQTO4",
};

const LIVE = {
  base: "https://hybrid.connect-direct.energynetworks.org",
  apiKey: "yFh0tTwSbt1Efe0Vwvctg1x2giRmmp8v5R8VwqH7",
  tenantId: "06824204-6041-70c6-baa3-9d11364abff3",
  auth: "yFh0tTwSbt1Efe0Vwvctg1x2giRmmp8v5R8VwqH7",
};

export default function CommissioningForm({ app, onClose }) {
  const [stage, setStage] = useState("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [enaEnv, setEnaEnv] = useState(app.ena_environment || "sandbox");
  const [cxDate, setCxDate] = useState("");
  const [installationLoc, setInstallationLoc] = useState("");
  const [isolatorSwitchLoc, setIsolatorSwitchLoc] = useState("");
  const [circuitDiagram, setCircuitDiagram] = useState(null);
  const [circuitPreview, setCircuitPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isG99 = app.type === "G99";
  const env = enaEnv === "live" ? LIVE : SANDBOX;
  const isDemo = app.id?.startsWith("demo-");

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCircuitDiagram(file);
    setCircuitPreview(file.name);
  }

  async function uploadFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];
        const mimeType = file.type;
        const res = await supabase.functions.invoke("ena-submit", {
          body: {
            action: "upload-image",
            imageBase64: base64,
            imageMimeType: mimeType,
            environment: enaEnv,
          },
        });
        if (res.error) reject(new Error(res.error.message));
        else if (res.data?.error) reject(new Error(res.data.error));
        else resolve(res.data?.attachmentId);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit() {
    if (!cxDate || !installationLoc || !isolatorSwitchLoc) {
      alert("Please fill in all required fields");
      return;
    }
    if (isG99 && !circuitDiagram) {
      alert("A circuit diagram is required for G99 applications");
      return;
    }

    setSubmitting(true);
    setStage("submitting");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      // First check if application is ready for commissioning
      const launchRes = await fetch(
        `${env.base}/commissioning/v1/launch-form?applicationId=${app.ena_application_id}`,
        {
          headers: {
            Authorization: env.auth,
            "X-API-Key": env.apiKey,
            "X-Tenant-Id": env.tenantId,
          },
        },
      );
      const launchData = await launchRes.json();
      console.log("Launch form response:", JSON.stringify(launchData));

      if (!launchRes.ok) {
        throw new Error(
          `Application not ready for commissioning: ${JSON.stringify(launchData)}`,
        );
      }

      const cxFormClass =
        launchData.cxFormClass || (isG99 ? "CX_GT_3.68" : "CX_LT_3.68");
      const cxFormVersion = launchData.cxFormVersion || 1;

      let files = [];

      // Upload circuit diagram for G99
      if (isG99 && circuitDiagram) {
        const fileUrl = await uploadFile(circuitDiagram);
        if (fileUrl) files = [{ fileUrl }];
      }

      // Build form data
      let formData = {};

      if (isG99) {
        formData = {
          siteData: {
            cxDate,
            installationLoc,
            isolatorSwitchLoc,
          },
          devices: [
            {
              deviceSysRef: app.device_sys_ref || "SOLAX/00388/V1",
              installedCapacityKw: 5,
              exportLimitKw: 5,
            },
          ],
          files,
        };
      } else {
        formData = {
          siteData: {
            cxDate,
            installationLoc,
            isolatorSwitchLoc,
          },
          files: [],
        };
      }

      const payload = {
        applicationId: app.ena_application_id,
        cxFormClass,
        cxFormVersion,
        formData,
      };

      console.log("Submitting commissioning payload:", JSON.stringify(payload));

      const res = await fetch(`${env.base}/commissioning/v1/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.auth,
          "X-API-Key": env.apiKey,
          "X-Tenant-Id": env.tenantId,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      console.log(
        "Commissioning response:",
        res.status,
        JSON.stringify(resData),
      );

      if (!res.ok)
        throw new Error(
          `Commissioning failed (${res.status}): ${JSON.stringify(resData)}`,
        );

      // Update application status
      await supabase
        .from("applications")
        .update({
          status: "submitted",
          ena_status: "Commissioning Submitted",
        })
        .eq("id", app.id);

      // Add timeline entry
      await supabase.from("application_timeline").insert([
        {
          application_id: app.id,
          user_id: user?.id,
          status: "submitted",
          note: `Commissioning form submitted via ENA Connect Direct. Date: ${cxDate}. Location: ${installationLoc}.`,
          note_only: false,
        },
      ]);

      setResult(resData);
      setStage("success");
    } catch (e) {
      console.error("Commissioning error:", e.message);
      setErrorMsg(e.message);
      setStage("error");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Commissioning Form
            </h2>
            <p className="text-xs text-gray-500">
              {app.customer_name} · {app.site_address} · {app.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isDemo && (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Demo Mode
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                The commissioning form is not available in demo mode. Create a
                real application and submit it via ENA Connect Direct to use
                this feature.
              </p>
              <button
                onClick={onClose}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Close
              </button>
            </div>
          )}

          {!isDemo && stage === "form" && (
            <>
              {/* Environment toggle */}
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
                  ⚠️ Live mode — this will submit a real commissioning
                  notification to the DNO
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-blue-800 mb-1">
                  ENA Application ID
                </p>
                <p className="text-blue-600 font-mono text-xs">
                  {app.ena_application_id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commissioning Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={cxDate}
                  onChange={(e) => setCxDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Date the devices were installed on site
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location of Installation{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={installationLoc}
                  onChange={(e) => setInstallationLoc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select location...</option>
                  {LOCATION_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Isolator Switch Location{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={isolatorSwitchLoc}
                  onChange={(e) => setIsolatorSwitchLoc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select location...</option>
                  {LOCATION_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {isG99 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Circuit Diagram <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">
                      (required for G99)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {circuitPreview && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {circuitPreview}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-xs text-yellow-700">
                By submitting this form you declare that the installation
                complies with the requirements of{" "}
                {isG99 ? "EREC G99" : "EREC G98"} and all commissioning checks
                have been successfully completed.
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full py-2 rounded-lg font-medium transition text-white disabled:opacity-50 ${enaEnv === "live" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                Submit Commissioning Form (
                {enaEnv === "live" ? "Live" : "Sandbox"})
              </button>
            </>
          )}

          {!isDemo && stage === "submitting" && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="text-gray-700 font-medium">
                Submitting commissioning form...
              </p>
              <p className="text-gray-400 text-sm mt-1">Please wait</p>
            </div>
          )}

          {!isDemo && stage === "success" && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-green-700 mb-2">
                Commissioning Submitted!
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left text-sm">
                <p className="text-gray-600">
                  Your commissioning notification has been submitted to the DNO
                  via ENA Connect Direct. The DNO will review and respond
                  shortly.
                </p>
                {result?.exportMpan && (
                  <p className="mt-2">
                    <span className="font-medium">Export MPAN:</span>{" "}
                    {result.exportMpan}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
              >
                Close
              </button>
            </div>
          )}

          {!isDemo && stage === "error" && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-red-700 mb-1">
                  Commissioning submission failed
                </p>
                <p className="text-xs text-red-500">{errorMsg}</p>
              </div>
              <button
                onClick={() => setStage("form")}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition text-sm"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

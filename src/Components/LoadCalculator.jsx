import { useState } from "react"

const PHASE_OPTIONS = ["Single Phase (230V)", "Three Phase (400V)"]
const DEFAULT_SOLAR = { capacity: "", orientation: "" }
const DEFAULT_BATTERY = { capacity: "", power: "" }
const DEFAULT_EV = { quantity: "", kw: "", smart: "yes" }
const DEFAULT_HP = { capacity: "", cop: "3" }

function ampsToKw(amps, phases) {
  if (!amps || isNaN(amps)) return 0
  return phases === "Three Phase (400V)"
    ? (parseFloat(amps) * 400 * Math.sqrt(3)) / 1000
    : (parseFloat(amps) * 230) / 1000
}

function kwToAmps(kw, phases) {
  if (!kw || isNaN(kw)) return 0
  return phases === "Three Phase (400V)"
    ? (kw * 1000) / (400 * Math.sqrt(3))
    : (kw * 1000) / 230
}

function calcG98G99(totalKw, phases) {
  const limit = phases === "Three Phase (400V)" ? 11.04 : 3.68
  return totalKw <= limit ? "G98" : "G99"
}

function calcExportLimit(totalKw, supplyAmps, phases) {
  const supplyKw = ampsToKw(supplyAmps, phases)
  const available = supplyKw > 0 ? supplyKw : (phases === "Three Phase (400V)" ? 69 : 23)
  return Math.min(totalKw, Math.max(0, available))
}

function round2(n) { return Math.round(n * 100) / 100 }

export default function LoadCalculator({ app, onClose }) {
  const [supplyAmps, setSupplyAmps] = useState("")
  const [existingLoadAmps, setExistingLoadAmps] = useState("")
  const [phases, setPhases] = useState("Single Phase (230V)")
  const [solar, setSolar] = useState(null)
  const [battery, setBattery] = useState(null)
  const [ev, setEv] = useState(null)
  const [hp, setHp] = useState(null)
  const [result, setResult] = useState(null)

  function calculate() {
    const existingLoadKw = ampsToKw(existingLoadAmps, phases)
    const existingSupplyKw = ampsToKw(supplyAmps, phases)

    const solarKw = solar ? parseFloat(solar.capacity) || 0 : 0
    const batteryKw = battery ? parseFloat(battery.power) || 0 : 0
    const evKw = ev ? (parseFloat(ev.quantity) || 0) * (parseFloat(ev.kw) || 0) : 0
    const evDiversified = ev ? evKw * (ev.smart === "yes" ? 0.5 : 1) : 0
    const hpKw = hp ? parseFloat(hp.capacity) || 0 : 0

    const totalGeneration = solarKw + batteryKw
    const totalDemand = evDiversified + hpKw
    const totalImport = totalDemand + existingLoadKw
    const maxDemand = totalImport
    const maxDemandAmps = round2(kwToAmps(maxDemand, phases))
    const exportLimit = calcExportLimit(totalGeneration, supplyAmps, phases)
    const exportLimitAmps = round2(kwToAmps(exportLimit, phases))
    const notification = calcG98G99(totalGeneration, phases)

    setResult({
      solarKw, batteryKw, evKw, evDiversified, hpKw,
      totalGeneration, totalDemand, totalImport,
      maxDemand: round2(maxDemand),
      maxDemandAmps,
      exportLimit: round2(exportLimit),
      exportLimitAmps,
      notification, phases,
      supplyAmps: parseFloat(supplyAmps) || 0,
      existingLoadAmps: parseFloat(existingLoadAmps) || 0,
      existingLoadKw: round2(existingLoadKw),
      existingSupplyKw: round2(existingSupplyKw),
    })
  }

  function copyToClipboard() {
    if (!result) return
    const text = `
DNO LOAD CALCULATION — ${app.customer_name}
Address: ${app.site_address}, ${app.postcode}
DNO: ${app.dno_name} (${app.dno_region})
Date: ${new Date().toLocaleDateString("en-GB")}

SUPPLY DETAILS
Phase Configuration: ${result.phases}
Existing Supply: ${result.supplyAmps}A (${result.existingSupplyKw} kW)
Existing Site Load: ${result.existingLoadAmps}A (${result.existingLoadKw} kW)

GENERATION (EXPORT)
Solar PV (inverter output): ${result.solarKw} kW
Battery Storage (max export): ${result.batteryKw} kW
Total Generation: ${result.totalGeneration} kW
Proposed Export Limit: ${result.exportLimit} kW (${result.exportLimitAmps}A)
Notification Type: ${result.notification}

DEMAND (IMPORT)
EV Chargers (installed): ${result.evKw} kW
EV Chargers (diversified): ${result.evDiversified} kW
Heat Pump: ${result.hpKw} kW
Total New Demand: ${round2(result.totalDemand)} kW
Maximum Demand (inc. existing): ${result.maxDemand} kW (${result.maxDemandAmps}A)

RECOMMENDATION
${result.notification === "G98" ? "G98 notification required — works can proceed without DNO approval" : "G99 application required — DNO approval needed before connection"}
Export limit set at ${result.exportLimit} kW (${result.exportLimitAmps}A)
    `.trim()
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard! Paste into your DNO portal.")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Load Calculation</h2>
            <p className="text-xs text-gray-500">{app.customer_name} · {app.site_address} · {app.dno_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase Configuration</label>
              <select value={phases} onChange={e => { setPhases(e.target.value); setResult(null) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PHASE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Existing Supply (Amps)</label>
              <input type="number" value={supplyAmps} onChange={e => setSupplyAmps(e.target.value)}
                placeholder={phases === "Three Phase (400V)" ? "e.g. 100" : "e.g. 100"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {supplyAmps && <p className="text-xs text-gray-400 mt-1">{round2(ampsToKw(supplyAmps, phases))} kW</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Existing Site Load (Amps)</label>
              <input type="number" value={existingLoadAmps} onChange={e => setExistingLoadAmps(e.target.value)}
                placeholder="e.g. 20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {existingLoadAmps && <p className="text-xs text-gray-400 mt-1">{round2(ampsToKw(existingLoadAmps, phases))} kW</p>}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Solar PV</h3>
              <button onClick={() => setSolar(solar ? null : { ...DEFAULT_SOLAR })}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${solar ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {solar ? "Remove" : "Add Solar PV"}
              </button>
            </div>
            {solar && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Inverter output (kW)</label>
                  <input type="number" value={solar.capacity} onChange={e => setSolar({ ...solar, capacity: e.target.value })}
                    placeholder="e.g. 3.6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">Use inverter rated output, not panel kWp</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Orientation</label>
                  <select value={solar.orientation} onChange={e => setSolar({ ...solar, orientation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    <option>South</option>
                    <option>South East</option>
                    <option>South West</option>
                    <option>East</option>
                    <option>West</option>
                    <option>North</option>
                    <option>Flat roof</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Battery Storage</h3>
              <button onClick={() => setBattery(battery ? null : { ...DEFAULT_BATTERY })}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${battery ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {battery ? "Remove" : "Add Battery"}
              </button>
            </div>
            {battery && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Storage capacity (kWh)</label>
                  <input type="number" value={battery.capacity} onChange={e => setBattery({ ...battery, capacity: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max export power (kW)</label>
                  <input type="number" value={battery.power} onChange={e => setBattery({ ...battery, power: e.target.value })}
                    placeholder="e.g. 3.6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">EV Chargers</h3>
              <button onClick={() => setEv(ev ? null : { ...DEFAULT_EV })}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${ev ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {ev ? "Remove" : "Add EV Chargers"}
              </button>
            </div>
            {ev && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Number of chargers</label>
                  <input type="number" value={ev.quantity} onChange={e => setEv({ ...ev, quantity: e.target.value })}
                    placeholder="e.g. 2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">kW per charger</label>
                  <input type="number" value={ev.kw} onChange={e => setEv({ ...ev, kw: e.target.value })}
                    placeholder="e.g. 7.4"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Smart charging?</label>
                  <select value={ev.smart} onChange={e => setEv({ ...ev, smart: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="yes">Yes — 50% diversity applied</option>
                    <option value="no">No — full load assumed</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Heat Pump</h3>
              <button onClick={() => setHp(hp ? null : { ...DEFAULT_HP })}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${hp ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {hp ? "Remove" : "Add Heat Pump"}
              </button>
            </div>
            {hp && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Output capacity (kW)</label>
                  <input type="number" value={hp.capacity} onChange={e => setHp({ ...hp, capacity: e.target.value })}
                    placeholder="e.g. 8"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">COP</label>
                  <input type="number" value={hp.cop} onChange={e => setHp({ ...hp, cop: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}
          </div>

          <button onClick={calculate}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition">
            Calculate
          </button>

          {result && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-3 ${result.notification === "G98" ? "bg-green-50 border-b border-green-200" : "bg-orange-50 border-b border-orange-200"}`}>
                <p className={`text-lg font-bold ${result.notification === "G98" ? "text-green-700" : "text-orange-700"}`}>
                  {result.notification} {result.notification === "G98" ? "— Notification Only" : "— Full Application Required"}
                </p>
                <p className={`text-xs mt-0.5 ${result.notification === "G98" ? "text-green-600" : "text-orange-600"}`}>
                  {result.notification === "G98" ? "Works can proceed without DNO approval" : "DNO approval required before connection"}
                </p>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">GENERATION</p>
                    <p>Solar PV: <strong>{result.solarKw} kW</strong></p>
                    <p>Battery: <strong>{result.batteryKw} kW</strong></p>
                    <p>Total Export: <strong>{result.totalGeneration} kW</strong></p>
                    <p>Export Limit: <strong>{result.exportLimit} kW ({result.exportLimitAmps}A)</strong></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">DEMAND</p>
                    <p>EV (installed): <strong>{result.evKw} kW</strong></p>
                    <p>EV (diversified): <strong>{result.evDiversified} kW</strong></p>
                    <p>Heat Pump: <strong>{result.hpKw} kW</strong></p>
                    <p>Max Demand: <strong>{result.maxDemand} kW ({result.maxDemandAmps}A)</strong></p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">EXISTING SITE</p>
                  <p>Supply: <strong>{result.supplyAmps}A ({result.existingSupplyKw} kW)</strong></p>
                  <p>Site Load: <strong>{result.existingLoadAmps}A ({result.existingLoadKw} kW)</strong></p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={copyToClipboard}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm">
                  Copy Full DNO Summary to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
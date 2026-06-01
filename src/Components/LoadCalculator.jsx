import { useState, useEffect, useCallback } from "react"

const PHASE_OPTIONS = ["Single Phase (230V)", "Three Phase (400V)"]
const ENA_TTR_URL = "https://hybrid.connect-direct.energynetworks.org/lct/v1/ttr-search"

// Fallback product lists if API is unavailable
const FALLBACK_HEAT_PUMPS = [
  { label:"Mitsubishi Electric Ecodan 5kW", kw:5 },
  { label:"Mitsubishi Electric Ecodan 8.5kW", kw:8.5 },
  { label:"Daikin Altherma 3 6kW", kw:6 },
  { label:"Vaillant aroTHERM plus 7kW", kw:7 },
  { label:"Samsung EHS Mono 8kW", kw:8 },
  { label:"Grant Aerona3 10kW", kw:10 },
  { label:"Ideal Heating Logic Air 5kW", kw:5 },
  { label:"Ideal Heating Logic Air 8kW", kw:8 },
  { label:"Floe ASHP 5kW R32", kw:5 },
  { label:"Floe ASHP 8kW R32", kw:8 },
  { label:"Floe ASHP 12kW R32", kw:12 },
]
const FALLBACK_INVERTERS = [
  { label:"GivEnergy Gen3 Hybrid 3.6kW", kw:3.6 },
  { label:"GivEnergy Gen3 Hybrid 5kW", kw:5 },
  { label:"SolarEdge Home Hub 5kW", kw:5 },
  { label:"Huawei SUN2000 5kW", kw:5 },
  { label:"Fox ESS H1-5.0 5kW", kw:5 },
  { label:"Fronius Symo GEN24 5kW", kw:5 },
  { label:"SMA Sunny Boy 3kW", kw:3 },
]
const FALLBACK_BATTERIES = [
  { label:"Tesla Powerwall 3 — 13.5kWh / 11.5kW", kw:11.5, kwh:13.5 },
  { label:"GivEnergy 9.5kWh / 3.6kW", kw:3.6, kwh:9.5 },
  { label:"Huawei LUNA2000 10kWh / 5kW", kw:5, kwh:10 },
  { label:"Pylontech US5000 4.8kWh / 2.4kW", kw:2.4, kwh:4.8 },
  { label:"Fox ESS ECS4100 4.1kWh / 2.56kW", kw:2.56, kwh:4.1 },
]
const FALLBACK_EV = [
  { label:"Myenergi Zappi 2 7.4kW (Solar Divert)", kw:7.4 },
  { label:"Myenergi Zappi 2 22kW 3-Phase (Solar Divert)", kw:22 },
  { label:"Ohme Home Pro 7.4kW", kw:7.4 },
  { label:"Ohme ePod 7.4kW", kw:7.4 },
  { label:"Hypervolt Home 3 7.4kW", kw:7.4 },
  { label:"Hypervolt Home 3 Pro 7.4kW (Solar Divert)", kw:7.4 },
  { label:"Easee Home 7.4kW", kw:7.4 },
  { label:"Easee Charge 22kW 3-Phase", kw:22 },
  { label:"Pod Point Solo 3 7.4kW", kw:7.4 },
  { label:"Pod Point Solo 3S 7.4kW (Tethered)", kw:7.4 },
  { label:"Andersen A2 7.4kW", kw:7.4 },
  { label:"Andersen A3 7.4kW", kw:7.4 },
  { label:"EO Mini Pro 3 7.4kW", kw:7.4 },
  { label:"EO Mini Pro 3 22kW 3-Phase", kw:22 },
  { label:"Wallbox Pulsar Plus 7.4kW", kw:7.4 },
  { label:"Wallbox Copper SB 7.4kW (Solar Divert)", kw:7.4 },
  { label:"Wallbox Quasar 2 7.4kW (V2H)", kw:7.4 },
  { label:"Indra Smart PRO 7.4kW (Solar Divert)", kw:7.4 },
  { label:"Indra Smart PRO+ 7.4kW (V2G Ready)", kw:7.4 },
  { label:"Rolec WallPod EV Smart 7.4kW", kw:7.4 },
  { label:"Rolec WallPod EV 22kW 3-Phase", kw:22 },
  { label:"Sevadis Homecharge 7.4kW", kw:7.4 },
  { label:"Fox ESS EV Charger 7.4kW (Solar Divert)", kw:7.4 },
  { label:"GivEnergy EV Charger 7.4kW (Solar Divert)", kw:7.4 },
  { label:"SolarEdge EV Charger 7.4kW (Solar Divert)", kw:7.4 },
  { label:"Huawei FusionCharge AC 7.4kW", kw:7.4 },
  { label:"Tesla Wall Connector Gen 3 11kW", kw:11 },
  { label:"Sync EV Smart Charger 7.4kW", kw:7.4 },
  { label:"Zaptec Go 7.4kW", kw:7.4 },
  { label:"Zaptec Pro 22kW 3-Phase", kw:22 },
  { label:"Kaluza Smart Charger 7.4kW", kw:7.4 },
  { label:"British Gas Hive EV Charger 7.4kW", kw:7.4 },
  { label:"Octopus Electroverse / Ohme 7.4kW", kw:7.4 },
  { label:"CTEK Chargestorm Connected 2 7.4kW", kw:7.4 },
  { label:"Vestel EVC04 7.4kW", kw:7.4 },
]

const PRESET_APPLIANCES = [
  { name:"Electric oven / cooker", amps:30 },{ name:"Electric hob", amps:32 },
  { name:"Microwave", amps:5 },{ name:"Fridge / freezer", amps:2 },
  { name:"American fridge freezer", amps:4 },{ name:"Washing machine", amps:10 },
  { name:"Tumble dryer", amps:11 },{ name:"Washer dryer", amps:13 },
  { name:"Dishwasher", amps:10 },{ name:"Electric shower (7.5kW)", amps:33 },
  { name:"Electric shower (9.5kW)", amps:41 },{ name:"Electric shower (10.5kW)", amps:46 },
  { name:"Immersion heater", amps:13 },{ name:"Storage heater (single)", amps:13 },
  { name:"Electric radiator (1kW)", amps:4 },{ name:"Electric radiator (2kW)", amps:9 },
  { name:"Underfloor heating (per circuit)", amps:16 },{ name:"Lighting circuit", amps:6 },
  { name:"Sockets ring main", amps:32 },{ name:"Garage / outbuilding circuit", amps:20 },
  { name:"Garden / outdoor sockets", amps:16 },{ name:"Electric vehicle charger (7.4kW)", amps:32 },
  { name:"Hot tub / spa", amps:16 },{ name:"Swimming pool pump", amps:10 },
  { name:"Air conditioning unit", amps:13 },{ name:"Computer / home office", amps:5 },
  { name:"Television / entertainment", amps:3 },
]

const PRESET_CIRCUITS = [
  { name:"Ring main (sockets)", amps:32 },{ name:"Lighting circuit", amps:6 },
  { name:"Electric oven / cooker", amps:32 },{ name:"Electric hob", amps:32 },
  { name:"Electric shower", amps:40 },{ name:"Immersion heater", amps:16 },
  { name:"Washing machine", amps:16 },{ name:"Dishwasher", amps:16 },
  { name:"Tumble dryer", amps:16 },{ name:"Garage / outbuilding", amps:20 },
  { name:"Underfloor heating", amps:16 },{ name:"Storage heaters", amps:16 },
  { name:"EV charger", amps:32 },{ name:"Air conditioning", amps:16 },
  { name:"Hot tub / spa", amps:16 },{ name:"Custom circuit", amps:0 },
]

function applyDiversity(items) {
  if (items.length === 0) return 0
  const sorted = [...items].sort((a, b) => b.amps - a.amps)
  const largest = sorted[0].amps
  const rest = sorted.slice(1).reduce((sum, i) => sum + i.amps, 0)
  return largest + rest * 0.4
}

function ampsToKw(amps, phases) {
  if (!amps || isNaN(amps)) return 0
  return phases === "Three Phase (400V)" ? (parseFloat(amps) * 400 * Math.sqrt(3)) / 1000 : (parseFloat(amps) * 230) / 1000
}

function kwToAmps(kw, phases) {
  if (!kw || isNaN(kw)) return 0
  return phases === "Three Phase (400V)" ? (kw * 1000) / (400 * Math.sqrt(3)) : (kw * 1000) / 230
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

// Hook to search ENA TTR API
function useTTRSearch(searchTerm, focused) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(true)

  const search = useCallback(async (term) => {
    setLoading(true)
    try {
      const url = `${ENA_TTR_URL}?limit=100&sort_by=DeviceID&ascending=asc`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error("API unavailable")
      const data = await res.json()
      setApiAvailable(true)
      const all = data.results || data.devices || data || []
      const filtered = term && term.length >= 2
        ? all.filter(d => {
            const name = `${d.manufacturer || d.manufacturerName || ""} ${d.modelName || d.model || d.deviceName || ""}`.toLowerCase()
            return name.includes(term.toLowerCase())
          })
        : all
      setResults(filtered.slice(0, 30))
    } catch {
      setApiAvailable(false)
      setResults([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!focused) { setResults([]); return }
    const delay = searchTerm.length >= 2 ? 400 : 0
    const timer = setTimeout(() => search(searchTerm), delay)
    return () => clearTimeout(timer)
  }, [searchTerm, focused, search])

  return { results, loading, apiAvailable }
}

export default function LoadCalculator({ app, onClose }) {
  const [supplyAmps, setSupplyAmps] = useState("")
  const [phases, setPhases] = useState("Single Phase (230V)")
  const [solar, setSolar] = useState(null)
  const [battery, setBattery] = useState(null)
  const [ev, setEv] = useState(null)
  const [hp, setHp] = useState(null)
  const [result, setResult] = useState(null)

  // ENA TTR search
  const [hpSearch, setHpSearch] = useState("")
  const [invSearch, setInvSearch] = useState("")
  const [batSearch, setBatSearch] = useState("")
  const [evSearch, setEvSearch] = useState("")
  const [selectedHpLabel, setSelectedHpLabel] = useState("")
  const [selectedInvLabel, setSelectedInvLabel] = useState("")
  const [selectedBatLabel, setBatLabel] = useState("")
  const [selectedEvLabel, setEvLabel] = useState("")

  // Site load
  const [loadTab, setLoadTab] = useState("circuits")
  const [circuits, setCircuits] = useState([])
  const [appliances, setAppliances] = useState([])
  const [manualAmps, setManualAmps] = useState("")
  const [loadMode, setLoadMode] = useState("calculator")
  const [selectedCircuit, setSelectedCircuit] = useState(PRESET_CIRCUITS[0].name)
  const [customCircuitName, setCustomCircuitName] = useState("")
  const [customCircuitAmps, setCustomCircuitAmps] = useState("")
  const [selectedAppliance, setSelectedAppliance] = useState(PRESET_APPLIANCES[0].name)
  const [applianceQty, setApplianceQty] = useState("1")

  function addCircuit() {
    const preset = PRESET_CIRCUITS.find(c => c.name === selectedCircuit)
    if (!preset) return
    if (preset.name === "Custom circuit") {
      if (!customCircuitName || !customCircuitAmps) return
      setCircuits([...circuits, { name: customCircuitName, amps: parseFloat(customCircuitAmps) }])
      setCustomCircuitName(""); setCustomCircuitAmps("")
    } else {
      setCircuits([...circuits, { name: preset.name, amps: preset.amps }])
    }
  }

  function removeCircuit(i) { setCircuits(circuits.filter((_, idx) => idx !== i)) }

  function addAppliance() {
    const preset = PRESET_APPLIANCES.find(a => a.name === selectedAppliance)
    if (!preset) return
    const qty = parseInt(applianceQty) || 1
    for (let i = 0; i < qty; i++) setAppliances(prev => [...prev, { name: preset.name, amps: preset.amps }])
  }

  function removeAppliance(i) { setAppliances(appliances.filter((_, idx) => idx !== i)) }

  const circuitDiversified = round2(applyDiversity(circuits))
  const applianceDiversified = round2(applyDiversity(appliances))

  function getExistingLoadAmps() {
    if (loadMode === "manual") return parseFloat(manualAmps) || 0
    return loadTab === "circuits" ? circuitDiversified : applianceDiversified
  }

  function calculate() {
    const existingLoadAmps = getExistingLoadAmps()
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
      maxDemand: round2(maxDemand), maxDemandAmps,
      exportLimit: round2(exportLimit), exportLimitAmps,
      notification, phases,
      supplyAmps: parseFloat(supplyAmps) || 0,
      existingLoadAmps: round2(existingLoadAmps),
      existingLoadKw: round2(existingLoadKw),
      existingSupplyKw: round2(existingSupplyKw),
      loadMethod: loadMode === "manual" ? "Manual entry" : loadTab === "circuits" ? "Consumer unit circuits" : "Appliance list",
      hpProduct: selectedHpLabel || null,
      inverterProduct: selectedInvLabel || null,
      batteryProduct: selectedBatLabel || null,
      evProduct: selectedEvLabel || null,
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
Load Assessment Method: ${result.loadMethod}

EQUIPMENT (ENA TTR APPROVED)
${result.hpProduct ? `Heat Pump: ${result.hpProduct}` : ""}
${result.inverterProduct ? `Solar Inverter: ${result.inverterProduct}` : ""}
${result.batteryProduct ? `Battery Storage: ${result.batteryProduct}` : ""}
${result.evProduct ? `EV Charger: ${result.evProduct}` : ""}

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

  // Product search component
  function ProductSearch({ label, searchVal, setSearch, fallbackList, onSelect, selectedLabel, onSelectKw, onSelectKwh }) {
    const [focused, setFocused] = useState(false)
    const { results, loading, apiAvailable } = useTTRSearch(searchVal, focused)
    const placeholder = label === "Heat Pump" ? "e.g. Mitsubishi, Daikin, Floe" : label === "Solar Inverter" ? "e.g. GivEnergy, SolarEdge" : label === "Battery" ? "e.g. Tesla, GivEnergy" : "e.g. Zappi, Ohme"

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs text-gray-500">{label}</label>
          {apiAvailable
            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🟢 Live ENA TTR</span>
            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Offline list</span>
          }
        </div>
        {apiAvailable ? (
          <div className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder={`Click to browse top 30 or search — ${placeholder}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {loading && <p className="text-xs text-gray-400 mt-1">Loading ENA database...</p>}
            {focused && !loading && results.length === 0 && searchVal.length >= 2 && (
              <p className="text-xs text-gray-400 mt-1">No results — try a different search term</p>
            )}
            {focused && results.length > 0 && (
              <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-lg bg-white max-h-48 overflow-y-auto">
                {searchVal.length < 2 && <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100"><p className="text-xs text-blue-600 font-medium">Top 30 — type to search more</p></div>}
                {results.map((r, i) => {
                  const name = `${r.manufacturer || r.manufacturerName || ""} ${r.modelName || r.model || r.deviceName || ""}`
                  const kw = r.maxOutputKw || r.ratedPowerKw || r.outputKw || ""
                  return (
                    <button key={i} onMouseDown={() => { onSelect(name.trim()); setSearch(""); setFocused(false); if (kw) onSelectKw(String(kw)); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0">
                      <span className="font-medium">{name.trim()}</span>
                      {kw && <span className="text-gray-400 ml-2">{kw}kW</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <select onChange={e => {
            const item = fallbackList.find(f => f.label === e.target.value)
            if (item) { onSelect(item.label); if (item.kw) onSelectKw(String(item.kw)); if (item.kwh && onSelectKwh) onSelectKwh(String(item.kwh)) }
          }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select {label} —</option>
            {fallbackList.map(f => <option key={f.label} value={f.label}>{f.label}</option>)}
          </select>
        )}
        {selectedLabel && (
          <p className="text-xs text-blue-600">✓ Selected: {selectedLabel}
            <button onClick={() => { onSelect(""); setSearch("") }} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </p>
        )}
      </div>
    )
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

          {/* Supply */}
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
              <input type="number" value={supplyAmps} onChange={e => setSupplyAmps(e.target.value)} placeholder="e.g. 100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {supplyAmps && <p className="text-xs text-gray-400 mt-1">{round2(ampsToKw(supplyAmps, phases))} kW</p>}
            </div>
          </div>

          {/* Existing site load */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Existing Site Load</h3>
              <div className="flex gap-2">
                <button onClick={() => setLoadMode("calculator")}
                  className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${loadMode === "calculator" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  Calculator
                </button>
                <button onClick={() => setLoadMode("manual")}
                  className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${loadMode === "manual" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  Manual
                </button>
              </div>
            </div>
            {loadMode === "manual" ? (
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter existing site load (Amps)</label>
                <input type="number" value={manualAmps} onChange={e => setManualAmps(e.target.value)} placeholder="e.g. 20"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {manualAmps && <p className="text-xs text-gray-400 mt-1">{round2(ampsToKw(manualAmps, phases))} kW</p>}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setLoadTab("circuits")}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${loadTab === "circuits" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-200"}`}>
                    Consumer Unit Circuits
                  </button>
                  <button onClick={() => setLoadTab("appliances")}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${loadTab === "appliances" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-200"}`}>
                    Appliances
                  </button>
                </div>
                {loadTab === "circuits" && (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <select value={selectedCircuit} onChange={e => setSelectedCircuit(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {PRESET_CIRCUITS.map(c => <option key={c.name} value={c.name}>{c.name}{c.amps > 0 ? ` (${c.amps}A)` : ""}</option>)}
                      </select>
                      <button onClick={addCircuit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition">Add</button>
                    </div>
                    {selectedCircuit === "Custom circuit" && (
                      <div className="flex gap-2 mb-3">
                        <input type="text" value={customCircuitName} onChange={e => setCustomCircuitName(e.target.value)} placeholder="Circuit name"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="number" value={customCircuitAmps} onChange={e => setCustomCircuitAmps(e.target.value)} placeholder="Amps" style={{width:"80px"}}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                    {circuits.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {circuits.map((c, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-700">{c.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-600">{c.amps}A</span>
                              <button onClick={() => removeCircuit(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-gray-400 mb-3">No circuits added yet</p>}
                    {circuits.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">Diversified load (100% largest + 40% remaining)</p>
                        <p className="text-sm font-bold text-blue-800">{circuitDiversified}A</p>
                      </div>
                    )}
                  </div>
                )}
                {loadTab === "appliances" && (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <select value={selectedAppliance} onChange={e => setSelectedAppliance(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {PRESET_APPLIANCES.map(a => <option key={a.name} value={a.name}>{a.name} ({a.amps}A)</option>)}
                      </select>
                      <input type="number" value={applianceQty} onChange={e => setApplianceQty(e.target.value)} min="1" max="10" style={{width:"60px"}}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={addAppliance} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition">Add</button>
                    </div>
                    {appliances.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {appliances.map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-700">{a.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-600">{a.amps}A</span>
                              <button onClick={() => removeAppliance(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-gray-400 mb-3">No appliances added yet</p>}
                    {appliances.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">Diversified load (100% largest + 40% remaining)</p>
                        <p className="text-sm font-bold text-blue-800">{applianceDiversified}A</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Solar PV */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Solar PV</h3>
              <button onClick={() => { setSolar(solar ? null : { capacity:"", orientation:"" }); setSelectedInvLabel(""); setInvSearch("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${solar ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {solar ? "Remove" : "Add Solar PV"}
              </button>
            </div>
            {solar && (
              <div className="space-y-3">
                <ProductSearch label="Solar Inverter" searchVal={invSearch} setSearch={setInvSearch}
                  fallbackList={FALLBACK_INVERTERS} onSelect={setSelectedInvLabel} selectedLabel={selectedInvLabel}
                  onSelectKw={v => setSolar(s => ({ ...(s||{orientation:""}), capacity: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Inverter output (kW)</label>
                    <input type="number" value={solar.capacity} onChange={e => setSolar({ ...solar, capacity: e.target.value })} placeholder="e.g. 3.6"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Orientation</label>
                    <select value={solar.orientation} onChange={e => setSolar({ ...solar, orientation: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select...</option>
                      <option>South</option><option>South East</option><option>South West</option>
                      <option>East</option><option>West</option><option>North</option><option>Flat roof</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Battery */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Battery Storage</h3>
              <button onClick={() => { setBattery(battery ? null : { capacity:"", power:"" }); setBatLabel(""); setBatSearch("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${battery ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {battery ? "Remove" : "Add Battery"}
              </button>
            </div>
            {battery && (
              <div className="space-y-3">
                <ProductSearch label="Battery" searchVal={batSearch} setSearch={setBatSearch}
                  fallbackList={FALLBACK_BATTERIES} onSelect={setBatLabel} selectedLabel={selectedBatLabel}
                  onSelectKw={v => setBattery(b => ({ ...(b||{capacity:""}), power: v }))}
                  onSelectKwh={v => setBattery(b => ({ ...(b||{power:""}), capacity: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Storage capacity (kWh)</label>
                    <input type="number" value={battery.capacity} onChange={e => setBattery({ ...battery, capacity: e.target.value })} placeholder="e.g. 10"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max export power (kW)</label>
                    <input type="number" value={battery.power} onChange={e => setBattery({ ...battery, power: e.target.value })} placeholder="e.g. 3.6"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* EV Chargers */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">EV Chargers</h3>
              <button onClick={() => { setEv(ev ? null : { quantity:"", kw:"", smart:"yes" }); setEvLabel(""); setEvSearch("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${ev ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {ev ? "Remove" : "Add EV Chargers"}
              </button>
            </div>
            {ev && (
              <div className="space-y-3">
                <ProductSearch label="EV Charger" searchVal={evSearch} setSearch={setEvSearch}
                  fallbackList={FALLBACK_EV} onSelect={setEvLabel} selectedLabel={selectedEvLabel}
                  onSelectKw={v => setEv(e => ({ ...(e||{quantity:"1",smart:"yes"}), kw: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Number of chargers</label>
                    <input type="number" value={ev.quantity} onChange={e => setEv({ ...ev, quantity: e.target.value })} placeholder="e.g. 2"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">kW per charger</label>
                    <input type="number" value={ev.kw} onChange={e => setEv({ ...ev, kw: e.target.value })} placeholder="e.g. 7.4"
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
              </div>
            )}
          </div>

          {/* Heat Pump */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Heat Pump</h3>
              <button onClick={() => { setHp(hp ? null : { capacity:"", cop:"3" }); setSelectedHpLabel(""); setHpSearch("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${hp ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {hp ? "Remove" : "Add Heat Pump"}
              </button>
            </div>
            {hp && (
              <div className="space-y-3">
                <ProductSearch label="Heat Pump" searchVal={hpSearch} setSearch={setHpSearch}
                  fallbackList={FALLBACK_HEAT_PUMPS} onSelect={setSelectedHpLabel} selectedLabel={selectedHpLabel}
                  onSelectKw={v => setHp(h => ({ ...(h||{cop:"3"}), capacity: String(round2(parseFloat(v)/3)) }))} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Input power (kW)</label>
                    <input type="number" value={hp.capacity} onChange={e => setHp({ ...hp, capacity: e.target.value })} placeholder="e.g. 2.5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">COP</label>
                    <input type="number" value={hp.cop} onChange={e => setHp({ ...hp, cop: e.target.value })} placeholder="e.g. 3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
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
              {(result.hpProduct || result.inverterProduct || result.batteryProduct || result.evProduct) && (
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">EQUIPMENT (ENA TTR APPROVED)</p>
                  {result.inverterProduct && <p className="text-xs text-blue-700">☀️ {result.inverterProduct}</p>}
                  {result.batteryProduct && <p className="text-xs text-blue-700">🔋 {result.batteryProduct}</p>}
                  {result.evProduct && <p className="text-xs text-blue-700">🚗 {result.evProduct}</p>}
                  {result.hpProduct && <p className="text-xs text-blue-700">♨️ {result.hpProduct}</p>}
                </div>
              )}
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
                    <p>Max Demand: <strong>{result.maxDemandAmps}A</strong></p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">EXISTING SITE</p>
                  <p>Supply: <strong>{result.supplyAmps}A</strong></p>
                  <p>Site Load: <strong>{result.existingLoadAmps}A</strong> <span className="text-gray-400 text-xs">({result.loadMethod})</span></p>
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
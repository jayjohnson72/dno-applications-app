import { useState } from "react"

const PHASE_OPTIONS = ["Single Phase (230V)", "Three Phase (400V)"]

// ─── MCS Approved Product Lists ───────────────────────────────────────────────

const MCS_HEAT_PUMPS = [
  { manufacturer:"Mitsubishi Electric", model:"Ecodan ASHP 5kW", outputKw:5, cop:4.2, type:"Air Source", notes:"R32 refrigerant, quiet operation 42dB" },
  { manufacturer:"Mitsubishi Electric", model:"Ecodan ASHP 8.5kW", outputKw:8.5, cop:4.1, type:"Air Source", notes:"R32 refrigerant, quiet operation 43dB" },
  { manufacturer:"Mitsubishi Electric", model:"Ecodan ASHP 11.2kW", outputKw:11.2, cop:4.0, type:"Air Source", notes:"R32 refrigerant" },
  { manufacturer:"Mitsubishi Electric", model:"Ecodan ASHP 14kW", outputKw:14, cop:3.9, type:"Air Source", notes:"R32 refrigerant, larger properties" },
  { manufacturer:"Daikin", model:"Altherma 3 R 4kW", outputKw:4, cop:4.1, type:"Air Source", notes:"R32, compact monobloc unit" },
  { manufacturer:"Daikin", model:"Altherma 3 R 6kW", outputKw:6, cop:4.0, type:"Air Source", notes:"R32, compact monobloc unit" },
  { manufacturer:"Daikin", model:"Altherma 3 R 8kW", outputKw:8, cop:3.9, type:"Air Source", notes:"R32, monobloc" },
  { manufacturer:"Daikin", model:"Altherma 3 R 11kW", outputKw:11, cop:3.8, type:"Air Source", notes:"R32, monobloc" },
  { manufacturer:"Vaillant", model:"aroTHERM plus 5kW", outputKw:5, cop:4.0, type:"Air Source", notes:"R290 propane refrigerant, A+++ rated" },
  { manufacturer:"Vaillant", model:"aroTHERM plus 7kW", outputKw:7, cop:3.9, type:"Air Source", notes:"R290 propane refrigerant" },
  { manufacturer:"Vaillant", model:"aroTHERM plus 10kW", outputKw:10, cop:3.8, type:"Air Source", notes:"R290 propane refrigerant" },
  { manufacturer:"Samsung", model:"EHS Mono R290 5kW", outputKw:5, cop:4.0, type:"Air Source", notes:"R290, smart app control" },
  { manufacturer:"Samsung", model:"EHS Mono R290 8kW", outputKw:8, cop:3.9, type:"Air Source", notes:"R290, smart app control" },
  { manufacturer:"Samsung", model:"EHS Mono R290 12kW", outputKw:12, cop:3.8, type:"Air Source", notes:"R290, smart app control" },
  { manufacturer:"Grant", model:"Aerona³ R32 6kW", outputKw:6, cop:3.8, type:"Air Source", notes:"UK manufactured, R32" },
  { manufacturer:"Grant", model:"Aerona³ R32 10kW", outputKw:10, cop:3.7, type:"Air Source", notes:"UK manufactured, R32" },
  { manufacturer:"Grant", model:"Aerona³ R32 13kW", outputKw:13, cop:3.7, type:"Air Source", notes:"UK manufactured, R32" },
  { manufacturer:"Panasonic", model:"Aquarea T-Cap 5kW", outputKw:5, cop:4.1, type:"Air Source", notes:"All-in-one unit, R32" },
  { manufacturer:"Panasonic", model:"Aquarea T-Cap 9kW", outputKw:9, cop:4.0, type:"Air Source", notes:"R32" },
  { manufacturer:"Panasonic", model:"Aquarea T-Cap 12kW", outputKw:12, cop:3.9, type:"Air Source", notes:"R32" },
  { manufacturer:"LG", model:"ThermaV R32 5kW", outputKw:5, cop:4.0, type:"Air Source", notes:"R32, quiet 42dB" },
  { manufacturer:"LG", model:"ThermaV R32 9kW", outputKw:9, cop:3.9, type:"Air Source", notes:"R32" },
  { manufacturer:"Viessmann", model:"Vitocal 150-A 6kW", outputKw:6, cop:4.1, type:"Air Source", notes:"R290, German engineering" },
  { manufacturer:"Viessmann", model:"Vitocal 150-A 10kW", outputKw:10, cop:4.0, type:"Air Source", notes:"R290, German engineering" },
  { manufacturer:"Nibe", model:"F2120-8 8kW", outputKw:8, cop:3.8, type:"Air Source", notes:"Swedish brand, R410A" },
  { manufacturer:"Nibe", model:"F2120-12 12kW", outputKw:12, cop:3.7, type:"Air Source", notes:"Swedish brand, R410A" },
  { manufacturer:"Worcester Bosch", model:"Greenstore ASHP 5kW", outputKw:5, cop:3.8, type:"Air Source", notes:"Familiar brand for Gas Safe engineers" },
  { manufacturer:"Worcester Bosch", model:"Greenstore ASHP 9kW", outputKw:9, cop:3.7, type:"Air Source", notes:"R32" },
]

const MCS_SOLAR_INVERTERS = [
  { manufacturer:"GivEnergy", model:"Gen 3 Hybrid 3.6kW", outputKw:3.6, type:"Hybrid", notes:"UK support team, most popular UK residential 2025" },
  { manufacturer:"GivEnergy", model:"Gen 3 Hybrid 5kW", outputKw:5, type:"Hybrid", notes:"UK support team" },
  { manufacturer:"GivEnergy", model:"Gen 3 Hybrid 6kW", outputKw:6, type:"Hybrid", notes:"UK support team" },
  { manufacturer:"SolarEdge", model:"Home Hub 3.68kW", outputKw:3.68, type:"Hybrid", notes:"HD-Wave technology, panel-level optimisers" },
  { manufacturer:"SolarEdge", model:"Home Hub 5kW", outputKw:5, type:"Hybrid", notes:"HD-Wave technology" },
  { manufacturer:"SolarEdge", model:"Home Hub 6kW", outputKw:6, type:"Hybrid", notes:"HD-Wave technology" },
  { manufacturer:"Huawei", model:"SUN2000 3.68kW", outputKw:3.68, type:"Hybrid", notes:"Smart energy controller, AI optimisation" },
  { manufacturer:"Huawei", model:"SUN2000 5kW", outputKw:5, type:"Hybrid", notes:"Smart energy controller" },
  { manufacturer:"Huawei", model:"SUN2000 6kW", outputKw:6, type:"Hybrid", notes:"Smart energy controller" },
  { manufacturer:"Fox ESS", model:"H1-3.0 3kW", outputKw:3, type:"Hybrid", notes:"Good value, IP65 rated" },
  { manufacturer:"Fox ESS", model:"H1-5.0 5kW", outputKw:5, type:"Hybrid", notes:"Good value, IP65 rated" },
  { manufacturer:"Fox ESS", model:"H3-6.0 6kW", outputKw:6, type:"Hybrid (3-phase)", notes:"Three phase hybrid" },
  { manufacturer:"Solis", model:"RHI-3K-48ES-5G 3kW", outputKw:3, type:"Hybrid", notes:"Competitive pricing, reliable" },
  { manufacturer:"Solis", model:"RHI-5K-48ES-5G 5kW", outputKw:5, type:"Hybrid", notes:"Competitive pricing" },
  { manufacturer:"Growatt", model:"MOD 3000TL3-X 3kW", outputKw:3, type:"String", notes:"Budget option, widely available" },
  { manufacturer:"Growatt", model:"SPH5000TL3-BH 5kW", outputKw:5, type:"Hybrid", notes:"Hybrid with battery port" },
  { manufacturer:"Enphase", model:"IQ8HC Microinverter 384W", outputKw:0.384, type:"Microinverter", notes:"Panel-level, ideal for complex roofs" },
  { manufacturer:"SMA", model:"Sunny Boy 3.0 3kW", outputKw:3, type:"String", notes:"German quality, reliable" },
  { manufacturer:"SMA", model:"Sunny Tripower 5.0 5kW", outputKw:5, type:"String", notes:"German quality" },
  { manufacturer:"Fronius", model:"Primo 3.0-1 3kW", outputKw:3, type:"String", notes:"Austrian quality, excellent monitoring" },
  { manufacturer:"Fronius", model:"Symo GEN24 5.0 5kW", outputKw:5, type:"Hybrid", notes:"Backup power capability" },
  { manufacturer:"Sigen", model:"SigenStor 3.6kW", outputKw:3.6, type:"Hybrid", notes:"Fanless design, high IP rating" },
  { manufacturer:"Sigen", model:"SigenStor 5kW", outputKw:5, type:"Hybrid", notes:"Fanless design" },
  { manufacturer:"Anker", model:"SOLIX X1 5kW", outputKw:5, type:"Hybrid", notes:"New to market, AI energy management" },
]

const MCS_BATTERIES = [
  { manufacturer:"Tesla", model:"Powerwall 3", capacityKwh:13.5, maxPowerKw:11.5, notes:"Integrated inverter, whole-home backup, most installed globally" },
  { manufacturer:"GivEnergy", model:"GivBattery 9.5kWh", capacityKwh:9.5, maxPowerKw:3.6, notes:"Compatible with GivEnergy inverters, UK support" },
  { manufacturer:"GivEnergy", model:"GivBattery 13.5kWh", capacityKwh:13.5, maxPowerKw:3.6, notes:"Popular capacity, Octopus integration" },
  { manufacturer:"GivEnergy", model:"AIO 3.68kW All-in-One", capacityKwh:9.5, maxPowerKw:3.68, notes:"Inverter and battery combined" },
  { manufacturer:"Huawei", model:"LUNA2000 5kWh", capacityKwh:5, maxPowerKw:2.5, notes:"Modular, expandable to 30kWh" },
  { manufacturer:"Huawei", model:"LUNA2000 10kWh", capacityKwh:10, maxPowerKw:5, notes:"Modular, expandable" },
  { manufacturer:"Huawei", model:"LUNA2000 15kWh", capacityKwh:15, maxPowerKw:5, notes:"Modular, expandable" },
  { manufacturer:"SolarEdge", model:"Home Battery 9.7kWh", capacityKwh:9.7, maxPowerKw:5, notes:"DC-coupled, works with SolarEdge inverters" },
  { manufacturer:"Fox ESS", model:"ECS2900-H1 2.9kWh", capacityKwh:2.9, maxPowerKw:2.56, notes:"Modular, stack up to 6 units" },
  { manufacturer:"Fox ESS", model:"ECS4100-H1 4.1kWh", capacityKwh:4.1, maxPowerKw:2.56, notes:"Modular" },
  { manufacturer:"Pylontech", model:"US3000C 3.5kWh", capacityKwh:3.5, maxPowerKw:1.5, notes:"Popular OEM battery, stackable" },
  { manufacturer:"Pylontech", model:"US5000 4.8kWh", capacityKwh:4.8, maxPowerKw:2.4, notes:"Stackable, compatible with many inverters" },
  { manufacturer:"Duracell Energy", model:"PowerVault 3 4.5kWh", capacityKwh:4.5, maxPowerKw:3, notes:"Heated cells for year-round performance" },
  { manufacturer:"Duracell Energy", model:"PowerVault 3 9kWh", capacityKwh:9, maxPowerKw:3, notes:"Heated cells, Octopus integration" },
  { manufacturer:"Varta", model:"element backup 6 6.5kWh", capacityKwh:6.5, maxPowerKw:3, notes:"German quality, wall-mounted" },
  { manufacturer:"Varta", model:"element backup 12 12kWh", capacityKwh:12, maxPowerKw:3, notes:"German quality" },
  { manufacturer:"Alpha-ESS", model:"SMILE5 5.7kWh", capacityKwh:5.7, maxPowerKw:3.6, notes:"Good value, popular installer choice" },
  { manufacturer:"Alpha-ESS", model:"SMILE-B3 5.7kWh", capacityKwh:5.7, maxPowerKw:2.4, notes:"AC-coupled, works with any inverter" },
  { manufacturer:"Sigenergy", model:"SigenStor 10kWh", capacityKwh:10, maxPowerKw:5, notes:"Modular, EV charger integration" },
  { manufacturer:"EcoFlow", model:"Power Kits 5kWh", capacityKwh:5, maxPowerKw:3.6, notes:"Modular, whole-home backup" },
]

const MCS_EV_CHARGERS = [
  { manufacturer:"Myenergi", model:"Zappi 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"MCS approved, solar diversion, most popular UK installer choice" },
  { manufacturer:"Myenergi", model:"Zappi 22kW 3-phase", outputKw:22, type:"Smart solar divert (3-phase)", notes:"3-phase version" },
  { manufacturer:"Ohme", model:"Home Pro 7.4kW", outputKw:7.4, type:"Smart", notes:"Octopus/tariff integration, dynamic pricing" },
  { manufacturer:"Hypervolt", model:"Home 3 7.4kW", outputKw:7.4, type:"Smart", notes:"Solar integration, sleek design" },
  { manufacturer:"Hypervolt", model:"Home 3 Pro 7.4kW", outputKw:7.4, type:"Smart", notes:"Enhanced solar diversion" },
  { manufacturer:"Easee", model:"Home 7.4kW", outputKw:7.4, type:"Smart", notes:"Scandinavian design, load balancing" },
  { manufacturer:"Easee", model:"Charge 22kW", outputKw:22, type:"Smart (3-phase)", notes:"3-phase, dynamic load balancing" },
  { manufacturer:"Pod Point", model:"Solo 3 7.4kW", outputKw:7.4, type:"Smart", notes:"OZEV approved, app control" },
  { manufacturer:"Andersen", model:"A2 7.4kW", outputKw:7.4, type:"Smart", notes:"Premium design, RFID access" },
  { manufacturer:"EO", model:"EO Mini Pro 3 7.4kW", outputKw:7.4, type:"Smart", notes:"Compact design, OZEV approved" },
  { manufacturer:"Wallbox", model:"Pulsar Plus 7.4kW", outputKw:7.4, type:"Smart", notes:"Compact, Bluetooth/WiFi" },
  { manufacturer:"Wallbox", model:"Copper SB 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"Solar integration" },
  { manufacturer:"Rolec", model:"WallPod EV Smart 7.4kW", outputKw:7.4, type:"Smart", notes:"OZEV approved, UK manufacturer" },
  { manufacturer:"Sevadis", model:"Homecharge 7.4kW", outputKw:7.4, type:"Smart", notes:"OZEV approved" },
  { manufacturer:"Indra", model:"Smart PRO 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"Solar diversion, V2G ready" },
  { manufacturer:"Fox ESS", model:"EV Charger 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"Integrates with Fox ESS inverter/battery" },
  { manufacturer:"GivEnergy", model:"EV Charger 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"Integrates with GivEnergy system" },
  { manufacturer:"SolarEdge", model:"EV Charger 7.4kW", outputKw:7.4, type:"Smart solar divert", notes:"Integrates with SolarEdge Home Hub" },
]

// ─── Existing appliances / circuits (unchanged) ───────────────────────────────
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

export default function LoadCalculator({ app, onClose }) {
  const [supplyAmps, setSupplyAmps] = useState("")
  const [phases, setPhases] = useState("Single Phase (230V)")
  const [solar, setSolar] = useState(null)
  const [battery, setBattery] = useState(null)
  const [ev, setEv] = useState(null)
  const [hp, setHp] = useState(null)
  const [result, setResult] = useState(null)

  // Selected MCS products
  const [selectedHp, setSelectedHp] = useState("")
  const [selectedInverter, setSelectedInverter] = useState("")
  const [selectedBattery, setSelectedBattery] = useState("")
  const [selectedEv, setSelectedEv] = useState("")

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

  // Auto-fill from MCS product selection
  function selectHpProduct(val) {
    setSelectedHp(val)
    const p = MCS_HEAT_PUMPS.find(h => `${h.manufacturer} ${h.model}` === val)
    if (p) setHp({ capacity: String(p.outputKw / p.cop), cop: String(p.cop) })
  }

  function selectInverterProduct(val) {
    setSelectedInverter(val)
    const p = MCS_SOLAR_INVERTERS.find(i => `${i.manufacturer} ${i.model}` === val)
    if (p) setSolar(s => ({ ...(s || { orientation:"" }), capacity: String(p.outputKw) }))
  }

  function selectBatteryProduct(val) {
    setSelectedBattery(val)
    const p = MCS_BATTERIES.find(b => `${b.manufacturer} ${b.model}` === val)
    if (p) setBattery({ capacity: String(p.capacityKwh), power: String(p.maxPowerKw) })
  }

  function selectEvProduct(val) {
    setSelectedEv(val)
    const p = MCS_EV_CHARGERS.find(e => `${e.manufacturer} ${e.model}` === val)
    if (p) setEv(ev => ({ ...(ev || { quantity:"1", smart:"yes" }), kw: String(p.outputKw) }))
  }

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
      hpProduct: selectedHp || null,
      inverterProduct: selectedInverter || null,
      batteryProduct: selectedBattery || null,
      evProduct: selectedEv || null,
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

EQUIPMENT (MCS APPROVED)
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

  const hpInfo = MCS_HEAT_PUMPS.find(h => `${h.manufacturer} ${h.model}` === selectedHp)
  const invInfo = MCS_SOLAR_INVERTERS.find(i => `${i.manufacturer} ${i.model}` === selectedInverter)
  const batInfo = MCS_BATTERIES.find(b => `${b.manufacturer} ${b.model}` === selectedBattery)
  const evInfo  = MCS_EV_CHARGERS.find(e => `${e.manufacturer} ${e.model}` === selectedEv)

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
              <button onClick={() => { setSolar(solar ? null : { capacity:"", orientation:"" }); setSelectedInverter("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${solar ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {solar ? "Remove" : "Add Solar PV"}
              </button>
            </div>
            {solar && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Select MCS approved inverter</label>
                  <select value={selectedInverter} onChange={e => selectInverterProduct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select inverter or enter manually —</option>
                    {MCS_SOLAR_INVERTERS.map(i => <option key={`${i.manufacturer} ${i.model}`} value={`${i.manufacturer} ${i.model}`}>{i.manufacturer} {i.model} ({i.outputKw}kW {i.type})</option>)}
                  </select>
                  {invInfo && <p className="text-xs text-blue-600 mt-1">✓ {invInfo.notes}</p>}
                </div>
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
              <button onClick={() => { setBattery(battery ? null : { capacity:"", power:"" }); setSelectedBattery("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${battery ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {battery ? "Remove" : "Add Battery"}
              </button>
            </div>
            {battery && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Select MCS approved battery</label>
                  <select value={selectedBattery} onChange={e => selectBatteryProduct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select battery or enter manually —</option>
                    {MCS_BATTERIES.map(b => <option key={`${b.manufacturer} ${b.model}`} value={`${b.manufacturer} ${b.model}`}>{b.manufacturer} {b.model} ({b.capacityKwh}kWh / {b.maxPowerKw}kW)</option>)}
                  </select>
                  {batInfo && <p className="text-xs text-blue-600 mt-1">✓ {batInfo.notes}</p>}
                </div>
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
              <button onClick={() => { setEv(ev ? null : { quantity:"", kw:"", smart:"yes" }); setSelectedEv("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${ev ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {ev ? "Remove" : "Add EV Chargers"}
              </button>
            </div>
            {ev && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Select OZEV/MCS approved charger</label>
                  <select value={selectedEv} onChange={e => selectEvProduct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select charger or enter manually —</option>
                    {MCS_EV_CHARGERS.map(e => <option key={`${e.manufacturer} ${e.model}`} value={`${e.manufacturer} ${e.model}`}>{e.manufacturer} {e.model} ({e.outputKw}kW — {e.type})</option>)}
                  </select>
                  {evInfo && <p className="text-xs text-blue-600 mt-1">✓ {evInfo.notes}</p>}
                </div>
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
              <button onClick={() => { setHp(hp ? null : { capacity:"", cop:"3" }); setSelectedHp("") }}
                className={`text-xs px-3 py-1 rounded-lg border transition font-medium ${hp ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                {hp ? "Remove" : "Add Heat Pump"}
              </button>
            </div>
            {hp && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Select MCS approved heat pump</label>
                  <select value={selectedHp} onChange={e => selectHpProduct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select heat pump or enter manually —</option>
                    {MCS_HEAT_PUMPS.map(h => <option key={`${h.manufacturer} ${h.model}`} value={`${h.manufacturer} ${h.model}`}>{h.manufacturer} {h.model} ({h.outputKw}kW COP {h.cop})</option>)}
                  </select>
                  {hpInfo && <p className="text-xs text-blue-600 mt-1">✓ {hpInfo.notes}</p>}
                </div>
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
                  <p className="text-xs text-gray-500 font-medium mb-1">EQUIPMENT SELECTED</p>
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
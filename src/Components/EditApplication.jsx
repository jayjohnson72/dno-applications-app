import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const DNO_MAP = {BB:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},AB:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"},AL:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},B:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},BA:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},BD:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},BH:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},BL:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},BN:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},BS:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},CA:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},CB:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},CF:{id:"22",name:"Western Power Distribution",region:"South Wales",emergency:"0800 052 0400"},CH:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},CM:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},CR:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},CV:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},CW:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},DA:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},DD:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"},DE:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},DG:{id:"18",name:"SP Energy Networks",region:"Southern Scotland",emergency:"0330 10 10 444"},DH:{id:"17",name:"Northern Powergrid",region:"North East",emergency:"0800 011 3332"},DL:{id:"17",name:"Northern Powergrid",region:"North East",emergency:"0800 011 3332"},DN:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},DT:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},DY:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},E:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},EC:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},EH:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},EN:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},EX:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},FK:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},FY:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},G:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},GL:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},GU:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},HA:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},HD:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},HG:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},HP:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},HR:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},HU:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},HX:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},IG:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},IP:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},IV:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"},KA:{id:"18",name:"SP Energy Networks",region:"Southern Scotland",emergency:"0330 10 10 444"},KT:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},KW:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"},KY:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},L:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},LA:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},LD:{id:"22",name:"Western Power Distribution",region:"South Wales",emergency:"0800 052 0400"},LE:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},LL:{id:"12",name:"SP Manweb",region:"North Wales",emergency:"0330 10 10 444"},LN:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},LS:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},LU:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},M:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},ME:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},MK:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},ML:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},N:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},NE:{id:"17",name:"Northern Powergrid",region:"North East",emergency:"0800 011 3332"},NG:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},NN:{id:"24",name:"Western Power Distribution",region:"East Midlands",emergency:"0800 096 3080"},NP:{id:"22",name:"Western Power Distribution",region:"South Wales",emergency:"0800 052 0400"},NR:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},NW:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},OL:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},OX:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},PA:{id:"19",name:"SP Energy Networks",region:"Central Scotland",emergency:"0330 10 10 444"},PE:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},PH:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"},PL:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},PO:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},PR:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},RG:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},RH:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},RM:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},S:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},SA:{id:"22",name:"Western Power Distribution",region:"South Wales",emergency:"0800 052 0400"},SE:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},SG:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},SK:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},SL:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},SM:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},SN:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},SO:{id:"11",name:"SSEN Distribution",region:"South of England",emergency:"0800 048 3515"},SR:{id:"17",name:"Northern Powergrid",region:"North East",emergency:"0800 011 3332"},SS:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},ST:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},SW:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},SY:{id:"12",name:"SP Manweb",region:"Mid Wales",emergency:"0330 10 10 444"},TA:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},TD:{id:"18",name:"SP Energy Networks",region:"Southern Scotland",emergency:"0330 10 10 444"},TF:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},TN:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},TQ:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},TR:{id:"23",name:"Western Power Distribution",region:"South West",emergency:"0800 365 900"},TS:{id:"17",name:"Northern Powergrid",region:"North East",emergency:"0800 011 3332"},TW:{id:"14",name:"UK Power Networks",region:"South East",emergency:"0800 029 4285"},UB:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},W:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},WA:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},WC:{id:"13",name:"UK Power Networks",region:"London",emergency:"0800 029 4285"},WD:{id:"15",name:"UK Power Networks",region:"East of England",emergency:"0800 029 4285"},WF:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},WN:{id:"21",name:"Electricity North West",region:"North West England",emergency:"0800 195 4141"},WR:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},WS:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},WV:{id:"20",name:"Western Power Distribution",region:"West Midlands",emergency:"0800 096 3080"},YO:{id:"16",name:"Northern Powergrid",region:"Yorkshire",emergency:"0800 011 3332"},ZE:{id:"10",name:"SSEN Transmission",region:"North of Scotland",emergency:"0345 026 2554"}}

function lookupDNO(postcode) {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/)
  if (!match) return null
  const outward = match[1]
  const tries = [outward, outward.replace(/[A-Z]$/, ''), outward.replace(/\d[A-Z]?$/, ''), outward.replace(/\d{1,2}[A-Z]?$/, '')]
  for (const t of tries) { if (DNO_MAP[t]) return DNO_MAP[t] }
  return null
}
export default function EditApplication({ application, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [dno, setDno] = useState(
    application.dno_name ? { name: application.dno_name, region: application.dno_region, emergency: application.dno_emergency } : null
  )
  const [dnoStatus, setDnoStatus] = useState(application.dno_name ? 'found' : 'idle')
  const postcodeTimer = useRef(null)
  const [form, setForm] = useState({
    type: application.type || 'G98',
    customer_name: application.customer_name || '',
    site_address: application.site_address || '',
    postcode: application.postcode || '',
    mpan: application.mpan || '',
    status: application.status || 'draft',
  })

  useEffect(() => {
    const pc = form.postcode.trim()
    if (pc.length < 3) { setDno(null); setDnoStatus('idle'); return }
    clearTimeout(postcodeTimer.current)
    setDnoStatus('loading')
    postcodeTimer.current = setTimeout(() => {
      const found = lookupDNO(pc)
      if (found) { setDno(found); setDnoStatus('found') }
      else setDnoStatus('error')
    }, 500)
    return () => clearTimeout(postcodeTimer.current)
  }, [form.postcode])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSaveError(null)
    const { error } = await supabase
      .from('applications')
      .update({
        ...form,
        dno_name: dno?.name || null,
        dno_region: dno?.region || null,
        dno_emergency: dno?.emergency || null,
      })
      .eq('id', application.id)
    setLoading(false)
    if (error) { setSaveError(error.message) } else { onSaved() }
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application.id)
    setLoading(false)
    if (error) { setSaveError(error.message); setConfirmDelete(false) } else { onSaved() }
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
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="G98">G98 — Small scale (up to 3.68kW)</option>
              <option value="G99">G99 — Large scale (over 3.68kW)</option>
              <option value="EV">EV Charger Installation</option>
              <option value="HeatPump">Heat Pump Installation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
            <input type="text" name="site_address" value={form.site_address} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
              <div className="relative">
                <input type="text" name="postcode" value={form.postcode} onChange={handleChange} maxLength={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase pr-8" />
                {dnoStatus === 'loading' && <span className="absolute right-3 top-2.5 text-gray-400 text-sm">⟳</span>}
                {dnoStatus === 'found' && <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MPAN Number</label>
              <input type="text" name="mpan" value={form.mpan} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {dnoStatus === 'found' && dno && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">Distribution Network Operator</p>
              <p className="text-sm font-semibold text-blue-800">{dno.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{dno.region} · Emergency: {dno.emergency}</p>
            </div>
          )}
          {dnoStatus === 'error' && (
            <p className="text-xs text-red-500">Postcode not recognised — please check and try again.</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>

        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} disabled={loading}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-medium hover:bg-red-100 transition disabled:opacity-50 text-sm">
              Delete Application
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium mb-3">Are you sure? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 text-sm">
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} disabled={loading}
                  className="flex-1 bg-white text-gray-700 border border-gray-200 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm">
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
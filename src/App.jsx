import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import Dashboard from "./Components/dashboard"
import NewApplication from "./Components/NewApplication"
import Auth from "./Components/Auth"
import CustomerPortal from "./CustomerPortal"
import AdminPanel from "./Components/AdminPanel"

const ADMIN_EMAIL = 'james.johnson@heatio.com'

const DEMO_APPLICATIONS = [
  { id:"demo-1", customer_name:"James Robertson", site_address:"14 Maple Avenue, Burnley", postcode:"BB11 2AA", mpan:"", type:"G99", status:"submitted", dno_name:"Electricity North West", dno_region:"North West England", dno_emergency:"0800 195 4141", created_at:new Date(Date.now()-86400000*2).toISOString() },
  { id:"demo-2", customer_name:"Sarah Mitchell", site_address:"7 Oak Street, Leeds", postcode:"LS1 1AA", mpan:"", type:"EV", status:"approved", dno_name:"Northern Powergrid", dno_region:"Yorkshire", dno_emergency:"0800 011 3332", created_at:new Date(Date.now()-86400000*5).toISOString() },
  { id:"demo-3", customer_name:"David Chen", site_address:"22 High Street, London", postcode:"EC1A 1AA", mpan:"", type:"G98", status:"draft", dno_name:"UK Power Networks", dno_region:"London", dno_emergency:"0800 029 4285", created_at:new Date(Date.now()-86400000*1).toISOString() },
  { id:"demo-4", customer_name:"Emma Thompson", site_address:"5 Church Road, Bristol", postcode:"BS1 1AA", mpan:"", type:"HeatPump", status:"submitted", dno_name:"Western Power Distribution", dno_region:"South West England", dno_emergency:"0800 365 900", created_at:new Date(Date.now()-86400000*3).toISOString() },
  { id:"demo-5", customer_name:"John MacDonald", site_address:"11 Castle Lane, Edinburgh", postcode:"EH1 1AA", mpan:"", type:"G99", status:"rejected", dno_name:"SP Energy Networks", dno_region:"Central Scotland", dno_emergency:"0330 10 10 444", created_at:new Date(Date.now()-86400000*7).toISOString() },
]

const TOUR_STEPS = [
  { title:"Welcome to DNO Application Manager", text:"This is the dashboard — it shows all your applications at a glance. You are in Demo Mode so no real data will be saved." },
  { title:"Stats Overview", text:"These cards show a summary of your applications by status — total, draft, submitted and approved." },
  { title:"Filter by DNO or Status", text:"Use these dropdowns to filter applications by DNO or status — really useful as your list grows." },
  { title:"PDF Download", text:"Click the green PDF button to download a formatted application PDF ready to print or email." },
  { title:"Edit Application", text:"Click the blue Edit button to update any application details. The DNO updates automatically if you change the postcode." },
  { title:"Application Timeline", text:"Click the teal Timeline button to track status changes and add internal notes on each application." },
  { title:"Load Calculator", text:"Click the orange Load Calc button to calculate G98/G99 status, export limits and maximum demand — includes live ENA TTR product search." },
  { title:"Submit to DNO", text:"Click the Actions button and select Submit to DNO. Choose Sandbox to test or Live to submit a real application via ENA Connect Direct." },
  { title:"Share with Customer", text:"Click the pink Share button to copy a unique customer portal link — customers can track their application status without logging in." },
  { title:"You're all set!", text:"Exit demo mode by clicking the X on the orange banner. Share this demo with anyone by adding ?demo=true to your URL." },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [dashboardKey, setDashboardKey] = useState(0)
  const [demoMode, setDemoMode] = useState(false)
  const [tourStep, setTourStep] = useState(null)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [customerToken, setCustomerToken] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (token) { setCustomerToken(token); setAuthLoading(false); return }
    if (params.get("demo") === "true") { setDemoMode(true); setTourStep(0) }
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session) })
    return () => subscription.unsubscribe()
  }, [])

  function goToDashboard() { setDashboardKey(k => k + 1); setCurrentPage("dashboard") }
  function exitDemo() { setDemoMode(false); setTourStep(null); window.history.replaceState({}, "", window.location.pathname) }
  function nextTourStep() { if (tourStep < TOUR_STEPS.length - 1) { setTourStep(tourStep + 1) } else { setTourStep(null) } }
  async function handleSignOut() { await supabase.auth.signOut() }

  if (customerToken) return <CustomerPortal token={customerToken} />

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session && !demoMode) return <Auth />

  return (
    <div className="min-h-screen bg-gray-50">

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {demoMode && (
        <div className="bg-orange-500 text-white px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">DEMO MODE</span>
            <span className="text-sm">No data will be saved. Sample applications shown.</span>
            <button onClick={() => setTourStep(0)} className="text-xs bg-white text-orange-600 px-3 py-1 rounded-lg font-medium hover:bg-orange-50 transition">Start Tour</button>
          </div>
          <button onClick={exitDemo} className="text-white hover:text-orange-200 text-xl font-bold">&times;</button>
        </div>
      )}

      {!demoMode && (
        <div className="px-6 py-1.5 text-xs text-center font-medium bg-green-600 text-white">
          🟢 ENA Connect Direct — Sandbox & Live available. Select environment when submitting.
        </div>
      )}

      {tourStep !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Step {tourStep + 1} of {TOUR_STEPS.length}</span>
              <button onClick={() => setTourStep(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{TOUR_STEPS[tourStep].title}</h3>
            <p className="text-sm text-gray-600 mb-6">{TOUR_STEPS[tourStep].text}</p>
            <div className="flex gap-1 mb-4">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= tourStep ? "bg-orange-500" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="flex gap-3">
              {tourStep > 0 && (
                <button onClick={() => setTourStep(tourStep - 1)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm">Back</button>
              )}
              <button onClick={nextTourStep} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition text-sm">
                {tourStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-blue-800 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">DNO Application Manager</h1>
          <div className="flex gap-4 items-center">
            <button onClick={goToDashboard}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === "dashboard" ? "bg-white text-blue-800" : "text-white hover:bg-blue-700"}`}>
              Dashboard
            </button>
            <button onClick={() => setCurrentPage("new")}
              className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === "new" ? "bg-white text-blue-800" : "text-white hover:bg-blue-700"}`}>
              New Application
            </button>
            <button onClick={() => { setDemoMode(true); setTourStep(0) }}
              className={`px-4 py-2 rounded-lg font-medium transition ${demoMode ? "bg-orange-500 text-white" : "text-orange-300 hover:bg-blue-700"}`}>
              Demo
            </button>
            {session && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-blue-600">
                <span className="text-xs text-blue-200">{session.user.email}</span>
                {session.user.email === ADMIN_EMAIL && (
                  <button onClick={() => setShowAdmin(true)}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition font-medium">
                    Admin
                  </button>
                )}
                <button onClick={handleSignOut}
                  className="text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-950 transition font-medium">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentPage === "dashboard" && (
          <Dashboard key={dashboardKey} setCurrentPage={setCurrentPage} demoMode={demoMode} demoApplications={DEMO_APPLICATIONS} />
        )}
        {currentPage === "new" && (
          <NewApplication setCurrentPage={goToDashboard} demoMode={demoMode} />
        )}
      </main>
    </div>
  )
}
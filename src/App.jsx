import { useState, useEffect } from 'react'
import Dashboard from './Components/dashboard'
import NewApplication from './Components/NewApplication'

const DEMO_APPLICATIONS = [
  {
    id: 'demo-1',
    customer_name: 'James Robertson',
    site_address: '14 Maple Avenue, Burnley',
    postcode: 'BB11 2AA',
    mpan: '123456789012345678901',
    type: 'G99',
    status: 'submitted',
    dno_name: 'Electricity North West',
    dno_region: 'North West England',
    dno_emergency: '0800 195 4141',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    customer_name: 'Sarah Mitchell',
    site_address: '7 Oak Street, Leeds',
    postcode: 'LS1 1AA',
    mpan: '',
    type: 'EV',
    status: 'approved',
    dno_name: 'Northern Powergrid',
    dno_region: 'Yorkshire',
    dno_emergency: '0800 011 3332',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'demo-3',
    customer_name: 'David Chen',
    site_address: '22 High Street, London',
    postcode: 'EC1A 1AA',
    mpan: '',
    type: 'G98',
    status: 'draft',
    dno_name: 'UK Power Networks',
    dno_region: 'London',
    dno_emergency: '0800 029 4285',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'demo-4',
    customer_name: 'Emma Thompson',
    site_address: '5 Church Road, Bristol',
    postcode: 'BS1 1AA',
    mpan: '',
    type: 'HeatPump',
    status: 'submitted',
    dno_name: 'Western Power Distribution',
    dno_region: 'South West England',
    dno_emergency: '0800 365 900',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-5',
    customer_name: 'John MacDonald',
    site_address: '11 Castle Lane, Edinburgh',
    postcode: 'EH1 1AA',
    mpan: '',
    type: 'G99',
    status: 'rejected',
    dno_name: 'SP Energy Networks',
    dno_region: 'Central Scotland',
    dno_emergency: '0330 10 10 444',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]

const TOUR_STEPS = [
  { title: 'Welcome to DNO Application Manager', text: 'This is the dashboard — it shows all your applications at a glance. You are currently in Demo Mode so no real data will be saved.', position: 'center' },
  { title: 'Stats Overview', text: 'These cards show a summary of your applications by status — total, draft, submitted and approved.', position: 'top' },
  { title: 'Filter by DNO or Status', text: 'Use these dropdowns to filter applications by DNO or status — really useful as your list grows.', position: 'top' },
  { title: 'PDF Download', text: 'Click the green PDF button to download a formatted application PDF ready to print or email.', position: 'top' },
  { title: 'Edit Application', text: 'Click the blue Edit button to update any application details. The DNO will automatically update if you change the postcode.', position: 'top' },
  { title: 'Load Calculator', text: 'Click the orange Load Calc button to calculate G98/G99 status, export limits and maximum demand — ready to copy into the DNO portal.', position: 'top' },
  { title: 'Submit to DNO', text: 'Click the purple Submit button to open the correct DNO portal with all your application details ready to copy across.', position: 'top' },
  { title: 'New Application', text: 'Click New Application to create a real application. Just enter a postcode and the correct DNO is detected automatically.', position: 'top' },
  { title: "You're all set!", text: 'That is everything! Exit demo mode by clicking the X on the orange banner, or share this demo link with others: add ?demo=true to your URL.', position: 'center' },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [dashboardKey, setDashboardKey] = useState(0)
  const [demoMode, setDemoMode] = useState(false)
  const [tourStep, setTourStep] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setDemoMode(true)
      setTourStep(0)
    }
  }, [])

  function goToDashboard() {
    setDashboardKey(k => k + 1)
    setCurrentPage('dashboard')
  }

  function exitDemo() {
    setDemoMode(false)
    setTourStep(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  function nextTourStep() {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1)
    } else {
      setTourStep(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {demoMode && (
        <div className="bg-orange-500 text-white px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">DEMO MODE</span>
            <span className="text-sm">No data will be saved. Sample applications are shown below.</span>
            <button
              onClick={() => setTourStep(0)}
              className="text-xs bg-white text-orange-600 px-3 py-1 rounded-lg font-medium hover:bg-orange-50 transition"
            >
              Start Tour
            </button>
          </div>
          <button onClick={exitDemo} className="text-white hover:text-orange-200 text-xl font-bold">&times;</button>
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
            <div className="flex gap-3">
              <div className="flex gap-1 flex-1">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= tourStep ? 'bg-orange-500' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              {tourStep > 0 && (
                <button onClick={() => setTourStep(tourStep - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
                  Back
                </button>
              )}
              <button onClick={nextTourStep}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition text-sm">
                {tourStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-blue-800 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">DNO Application Manager</h1>
          <div className="flex gap-4">
            <button
              onClick={goToDashboard}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'dashboard' ? 'bg-white text-blue-800' : 'text-white hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('new')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'new' ? 'bg-white text-blue-800' : 'text-white hover:bg-blue-700'
              }`}
            >
              New Application
            </button>
            {!demoMode && (
              <button
                onClick={() => { setDemoMode(true); setTourStep(0) }}
                className="px-4 py-2 rounded-lg font-medium transition text-orange-300 hover:bg-blue-700"
              >
                Demo
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            key={dashboardKey}
            setCurrentPage={setCurrentPage}
            demoMode={demoMode}
            demoApplications={DEMO_APPLICATIONS}
          />
        )}
        {currentPage === 'new' && (
          <NewApplication setCurrentPage={goToDashboard} demoMode={demoMode} />
        )}
      </main>
    </div>
  )
}
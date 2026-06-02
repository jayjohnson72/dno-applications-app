import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STATUS_STEPS = [
  { key: 'draft', label: 'Application Created', icon: '📝' },
  { key: 'submitted', label: 'Submitted to DNO', icon: '📤' },
  { key: 'ena_submitted', label: 'Submitted via ENA', icon: '🔗' },
  { key: 'escalated', label: 'Under Review', icon: '⚠️' },
  { key: 'approved', label: 'Approved', icon: '✅' },
  { key: 'rejected', label: 'Rejected', icon: '❌' },
]

const STATUS_COLOURS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  escalated: 'bg-orange-100 text-orange-700',
  ena_submitted: 'bg-purple-100 text-purple-700',
  ena_approved: 'bg-green-100 text-green-700',
}

const STATUS_MESSAGES = {
  draft: 'Your application has been created and is being prepared by your installer.',
  submitted: 'Your application has been submitted to your Distribution Network Operator (DNO) for review.',
  ena_submitted: 'Your application has been submitted directly to the DNO via the ENA Connect Direct system.',
  escalated: 'Your application is currently under review by a DNO engineer. This is normal for larger installations.',
  approved: 'Great news! Your application has been approved by the DNO. Your installer will be in touch to confirm next steps.',
  ena_approved: 'Great news! Your application has been approved via ENA Connect Direct. Your installer will be in touch to confirm next steps.',
  rejected: 'Unfortunately your application has not been approved at this time. Your installer will be in touch to discuss the next steps.',
}

export default function CustomerPortal({ token }) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) fetchApplication()
  }, [token])

  async function fetchApplication() {
    setLoading(true)
    const { data, error } = await supabase
      .from('applications')
      .select('customer_name, site_address, postcode, type, status, dno_name, dno_region, created_at')
      .eq('customer_token', token)
      .single()
    if (error || !data) {
      setError('Application not found. Please check your link and try again.')
    } else {
      setApp(data)
    }
    setLoading(false)
  }

  const typeLabels = {
    G98: 'Solar / Battery (G98)',
    G99: 'Solar / Battery (G99)',
    EV: 'EV Charger',
    HeatPump: 'Heat Pump',
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === app?.status)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your application...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Application Not Found</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="bg-blue-800 rounded-xl px-6 py-6 text-center mb-6">
          <h1 className="text-xl font-bold text-white">DNO Application Tracker</h1>
          <p className="text-blue-200 text-sm mt-1">Track your connection application status</p>
        </div>

        {/* Customer details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Application</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{app.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="font-medium text-gray-800 text-right max-w-xs">{app.site_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Postcode</span>
              <span className="font-medium text-gray-800">{app.postcode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Installation type</span>
              <span className="font-medium text-gray-800">{typeLabels[app.type] || app.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DNO</span>
              <span className="font-medium text-gray-800">{app.dno_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date submitted</span>
              <span className="font-medium text-gray-800">{new Date(app.created_at).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Current status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Status</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLOURS[app.status] || 'bg-gray-100 text-gray-700'}`}>
            {STATUS_STEPS.find(s => s.key === app.status)?.icon || '📋'}
            {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {STATUS_MESSAGES[app.status] || 'Your application is being processed.'}
          </p>
        </div>

        {/* Progress tracker */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Progress</h2>
          <div className="space-y-3">
            {STATUS_STEPS.filter(s => s.key !== 'rejected' && s.key !== 'escalated').map((step, i) => {
              const isDone = ['approved', 'ena_approved'].includes(app.status)
                ? true
                : STATUS_STEPS.findIndex(s => s.key === app.status) >= STATUS_STEPS.findIndex(s => s.key === step.key)
              const isCurrent = step.key === app.status
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isCurrent ? 'bg-blue-600 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isDone && !isCurrent ? '✓' : step.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  {isCurrent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>}
                </div>
              )
            })}
            {app.status === 'rejected' && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-red-100 text-red-600">❌</div>
                <p className="text-sm font-medium text-red-600">Application Not Approved</p>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Current</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Powered by DNO Application Manager · {app.dno_name}
        </p>
      </div>
    </div>
  )
}
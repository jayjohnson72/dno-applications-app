import { useState } from 'react'
import { supabase } from './supabase'
import Dashboard from './Components/dashboard'
import NewApplication from './Components/NewApplication'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navigation */}
      <nav className="bg-blue-800 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">DNO Application Manager</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'dashboard'
                  ? 'bg-white text-blue-800'
                  : 'text-white hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('new')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'new'
                  ? 'bg-white text-blue-800'
                  : 'text-white hover:bg-blue-700'
              }`}
            >
              New Application
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard setCurrentPage={setCurrentPage} />
        )}
        {currentPage === 'new' && (
          <NewApplication setCurrentPage={setCurrentPage} />
        )}
      </main>

    </div>
  )
}

export default App
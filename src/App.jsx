import React from 'react'

function App() {
  return (
    <div>
      <header style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#020617'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#e5e7eb' }}>Discord Application</h1>
        <p style={{ marginTop: '8px', color: '#94a3b8' }}>
          Please fill out the form below. All submissions receive a unique review ID.
        </p>
      </header>

      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '10px' }}>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSclfbFIelKj8Haa6bLOT2xYg1pYXjyhPKtCpYYLWKB1PfPoyA/viewform?usp=publish-editor"
          style={{
            width: '100%',
            height: '1000px',
            border: 'none',
            background: 'white',
            borderRadius: '12px'
          }}
          title="DNO Application Form"
        />
      </div>
    </div>
  )
}

export default App

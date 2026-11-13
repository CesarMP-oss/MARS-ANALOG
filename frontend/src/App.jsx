import { useEffect, useState } from 'react'
import { getHealth, getLimitations } from './api/client.js'
import LimitationsBanner from './components/LimitationsBanner.jsx'
import StatusPanel from './components/StatusPanel.jsx'
import './App.css'

export default function App() {
  const [health, setHealth] = useState(null)
  const [limitations, setLimitations] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getHealth({ signal: controller.signal }),
      getLimitations({ signal: controller.signal }),
    ])
      .then(([healthBody, limitationsBody]) => {
        setHealth(healthBody)
        setLimitations(limitationsBody.data)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err)
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="app">
      <header>
        <h1>MARS-ANALOG</h1>
        <p className="subtitle">
          Similitud topográfica experimental entre regiones terrestres y el cráter Jezero (Marte)
        </p>
      </header>
      <LimitationsBanner limitations={limitations} />
      <StatusPanel health={health} error={error} />
    </main>
  )
}

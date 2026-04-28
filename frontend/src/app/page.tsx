'use client'

import { useState, useEffect } from 'react'
import TripForm from '@/components/TripForm'
import ResultsPanel from '@/components/ResultsPanel'
import { TripResult, wakeBackend } from '@/lib/api'

export default function Home() {
  const [result,  setResult]  = useState<TripResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [waking,  setWaking]  = useState(true)

  // Silently wake the Render backend on page load
  useEffect(() => {
    wakeBackend().finally(() => setWaking(false))
  }, [])

  return (
    <main className="min-h-screen bg-ink flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0"
        style={{ background: '#ECEAE3', borderBottomColor: '#D2CFC6' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 rounded-sm" style={{ background: '#C47F17' }} />
          <div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#1A1917',
              lineHeight: 1,
              margin: 0,
            }}>
              HAULPATH
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#6B6760',
              margin: 0,
            }}>
              ELD Trip Planner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#6B6760' }}>
            <span>70H / 8-DAY</span>
            <span style={{ color: '#D2CFC6' }}>|</span>
            <span>FUEL @ 1,000 MI</span>
            <span style={{ color: '#D2CFC6' }}>|</span>
            <span>11H MAX DRIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'pulse-amber' : ''}`}
              style={{ background: loading ? '#C47F17' : result ? '#2E7D52' : '#B0ADA6' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#6B6760' }}>
              {waking ? 'WARMING UP…' : loading ? 'COMPUTING' : result ? 'ROUTE READY' : 'IDLE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-[360px] min-w-[360px] border-r overflow-y-auto flex-shrink-0"
          style={{ background: '#ECEAE3', borderRightColor: '#D2CFC6' }}>
          <TripForm
            onResult={(r) => { setResult(r); setError(null) }}
            onLoading={setLoading}
            onError={setError}
            loading={loading}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-hidden" style={{ background: '#F4F2EC' }}>

          {error && (
            <div className="m-4 p-4 rounded-lg text-sm"
              style={{ background: '#FDEAEA', border: '1px solid #EFB0B0', color: '#B83232', fontFamily: "'DM Sans', sans-serif" }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result ? (
            <ResultsPanel result={result} />
          ) : (
            /* Idle state */
            <div className="h-full flex flex-col items-center justify-center gap-8 text-center px-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ border: '1.5px solid #D2CFC6', background: '#ECEAE3' }}>
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="12" r="5" fill="#C47F17"/>
                  <circle cx="24" cy="36" r="5" fill="#ECEAE3" stroke="#C47F17" strokeWidth="1.5"/>
                  <path d="M24 17 L24 31" stroke="#C47F17" strokeWidth="1.5" strokeDasharray="3 3"/>
                </svg>
              </div>

              <div>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#1A1917',
                  margin: '0 0 10px',
                  textTransform: 'uppercase',
                }}>
                  Plan Your Route
                </h2>
                <p style={{ color: '#6B6760', fontSize: 14, maxWidth: 380, lineHeight: 1.6, margin: '0 auto' }}>
                  Enter origin, pickup, and destination. The HOS engine calculates
                  your compliant route and generates FMCSA-standard ELD logs.
                </p>
                {waking && (
                  <p style={{ color: '#C47F17', fontSize: 12, marginTop: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
                    ⏳ Warming up backend server…
                  </p>
                )}
              </div>

              {/* HOS rule cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
                {[
                  { label: 'Drive Limit',      value: '11h / shift' },
                  { label: 'On-Duty Window',   value: '14h max'     },
                  { label: 'Mandatory Rest',   value: '10h off-duty' },
                  { label: 'Fuel Stop',        value: 'per 1,000 mi' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: '#FFFFFF',
                    border: '1px solid #D2CFC6',
                    borderRadius: 10,
                    padding: '14px 16px',
                    textAlign: 'left',
                  }}>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#C47F17',
                      lineHeight: 1,
                    }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B6760', marginTop: 4, fontWeight: 500 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

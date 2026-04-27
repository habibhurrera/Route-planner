'use client'

import { useState } from 'react'
import TripForm from '@/components/TripForm'
import ResultsPanel from '@/components/ResultsPanel'
import { TripResult } from '@/lib/api'

export default function Home() {
  const [result, setResult] = useState<TripResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-ink flex flex-col">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-amber rounded-sm" />
          <div>
            <h1 className="font-display text-2xl tracking-widest text-paper leading-none">HAULPATH</h1>
            <p className="text-muted text-xs font-mono tracking-widest leading-none mt-0.5">ELD TRIP PLANNER</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-muted">
            <span>70H/8-DAY</span>
            <span className="text-border">|</span>
            <span>FUEL @ 1,000MI</span>
            <span className="text-border">|</span>
            <span>11H MAX DRIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber pulse-amber' : result ? 'bg-signal' : 'bg-muted'}`} />
            <span className="text-xs font-mono text-muted">
              {loading ? 'COMPUTING' : result ? 'ROUTE READY' : 'IDLE'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[360px] min-w-[360px] border-r border-border overflow-y-auto bg-asphalt flex-shrink-0">
          <TripForm
            onResult={(r) => { setResult(r); setError(null) }}
            onLoading={setLoading}
            onError={setError}
            loading={loading}
          />
        </aside>

        <div className="flex-1 overflow-hidden">
          {error && (
            <div className="m-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
              ERROR: {error}
            </div>
          )}
          {result ? (
            <ResultsPanel result={result} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-8 text-center px-8">
              <div className="w-28 h-28 rounded-full border border-border flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="12" r="4" fill="#F5A623"/>
                  <circle cx="24" cy="36" r="4" fill="#2E2E3A" stroke="#F5A623" strokeWidth="1.5"/>
                  <path d="M24 16 L24 32" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="3 3"/>
                </svg>
              </div>
              <div>
                <h2 className="text-paper font-display text-4xl tracking-widest mb-3">PLAN YOUR ROUTE</h2>
                <p className="text-muted text-sm max-w-sm leading-relaxed">
                  Enter origin, pickup, and destination. The HOS engine calculates your compliant route and generates FMCSA-standard ELD logs.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  { label: 'Drive Limit', value: '11h / shift' },
                  { label: 'On-Duty Window', value: '14h max' },
                  { label: 'Mandatory Rest', value: '10h off-duty' },
                  { label: 'Fuel Stop', value: 'per 1,000 mi' },
                ].map(item => (
                  <div key={item.label} className="bg-stripe border border-border rounded-lg p-3 text-left">
                    <div className="text-amber font-mono text-sm font-medium">{item.value}</div>
                    <div className="text-muted text-xs mt-0.5">{item.label}</div>
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

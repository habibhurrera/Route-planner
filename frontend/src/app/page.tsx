'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { calculateTrip, TripInput, TripResult } from '@/lib/api'
import ELDLogComponent from '@/components/ELDLogComponent'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDEAE3', color: '#7A7670', fontSize: 13, letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>
      Initialising map…
    </div>
  ),
})

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<TripResult | null>(null)

  const [inputs, setInputs] = useState<TripInput>({
    current_location:    'Chicago, IL',
    pickup_location:     'St. Louis, MO',
    dropoff_location:    'Dallas, TX',
    current_cycle_used:  0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await calculateTrip(inputs)
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  const hasResult = !!result

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--paper)',
        display: 'flex',
        alignItems: hasResult ? 'flex-start' : 'center',
        justifyContent: hasResult ? 'flex-start' : 'center',
        transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
      }}
    >
      {/* ── Sidebar / Form ───────────────────────────────── */}
      <aside
        style={{
          width: 340,
          minWidth: 340,
          minHeight: hasResult ? '100vh' : undefined,
          background: 'var(--surface)',
          borderRight: hasResult ? '1px solid var(--border)' : 'none',
          borderRadius: hasResult ? 0 : 16,
          boxShadow: hasResult
            ? '2px 0 16px rgba(0,0,0,0.06)'
            : '0 4px 32px rgba(0,0,0,0.10)',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 28px',
          gap: 0,
          zIndex: 50,
          transition: 'border-radius 0.45s, box-shadow 0.45s, min-height 0.45s',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--strong)',
              lineHeight: 1,
              margin: 0,
            }}
          >
            HAUL<span style={{ color: 'var(--amber)' }}>PATH</span>
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 6,
            }}
          >
            ELD Strategic Router v1.0
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'Origin',              key: 'current_location',   placeholder: 'e.g. Chicago, IL',   type: 'text' },
              { label: 'Pickup',              key: 'pickup_location',    placeholder: 'e.g. St. Louis, MO', type: 'text' },
              { label: 'Destination',         key: 'dropoff_location',   placeholder: 'e.g. Dallas, TX',    type: 'text' },
              { label: 'Used Cycle (Hours)',  key: 'current_cycle_used', placeholder: '0',                  type: 'number' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    display: 'block',
                  }}
                >
                  {label}
                </label>
                <input
                  className="input-field"
                  type={type}
                  step={type === 'number' ? '0.1' : undefined}
                  placeholder={placeholder}
                  value={(inputs as any)[key]}
                  onChange={e =>
                    setInputs({ ...inputs, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
            {loading ? 'Calculating…' : 'Compute Route'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              background: '#FDEAEA',
              border: '1px solid #EFB0B0',
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Footer status */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
            fontSize: 10,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Status:{' '}
          <span style={{ color: loading ? 'var(--amber)' : 'var(--signal)', fontWeight: 600 }}>
            {loading ? 'COMPUTING' : 'IDLE'}
          </span>
          {' '}// HOS Engine:{' '}
          <span style={{ color: 'var(--signal)', fontWeight: 600 }}>READY</span>
        </div>
      </aside>

      {/* ── Results panel ────────────────────────────────── */}
      {loading && !result && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--amber)',
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {result && (
        <section
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: '100vh',
            padding: '40px 36px',
            background: 'var(--paper)',
          }}
        >
          {/* ── Stats row ── */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--signal)',
                  textTransform: 'uppercase',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--signal)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                Route Computed
              </h2>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '8px 18px',
                  background: '#fff',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
                className="print:hidden"
              >
                Export PDF
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Distance',   value: `${result.trip_summary.total_distance_miles.toFixed(1)} mi` },
                { label: 'Drive Time', value: `${result.trip_summary.total_driving_hours.toFixed(1)} hr` },
                { label: 'Stops',      value: `${result.trip_summary.fuel_stops + result.trip_summary.rest_stops}` },
                { label: 'ETA',        value: new Date(result.trip_summary.estimated_arrival).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      color: 'var(--strong)',
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Map ── */}
          <div
            style={{
              height: 460,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              marginBottom: 40,
            }}
            className="print:hidden"
          >
            <MapComponent result={result} />
          </div>

          {/* ── ELD Logs ── */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--strong)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Compliance Logs
              </h2>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
              {result.daily_logs.map((log, i) => (
                <ELDLogComponent key={i} log={log} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

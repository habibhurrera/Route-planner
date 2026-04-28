'use client'

import { useState } from 'react'
import { calculateTrip, TripResult } from '@/lib/api'

interface Props {
  onResult:  (result: TripResult) => void
  onLoading: (loading: boolean) => void
  onError:   (error: string | null) => void
  loading:   boolean
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#6B6760',
  display: 'block',
  marginBottom: 6,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1.5px solid #D2CFC6',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  color: '#1A1917',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#C47F17',
}

export default function TripForm({ onResult, onLoading, onError, loading }: Props) {
  const [form, setForm] = useState({
    current_location:   '',
    pickup_location:    '',
    dropoff_location:   '',
    current_cycle_used: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onError(null)
    onLoading(true)
    try {
      const result = await calculateTrip({
        current_location:   form.current_location,
        pickup_location:    form.pickup_location,
        dropoff_location:   form.dropoff_location,
        current_cycle_used: parseFloat(form.current_cycle_used) || 0,
      })
      onResult(result)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Request failed'
      onError(msg.includes('timeout')
        ? 'Server is waking up — please wait 30s and try again.'
        : msg)
    } finally {
      onLoading(false)
    }
  }

  const cycleVal = parseFloat(form.current_cycle_used) || 0
  const cyclePct = Math.min((cycleVal / 70) * 100, 100)
  const cycleColor = cycleVal > 60 ? '#B83232' : cycleVal > 40 ? '#C47F17' : '#2E7D52'

  return (
    <form onSubmit={handleSubmit} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Title */}
      <div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#1A1917',
          margin: '0 0 4px',
        }}>
          Trip Details
        </h2>
        <p style={{ fontSize: 12, color: '#6B6760', margin: 0 }}>
          All locations accept city names or full addresses
        </p>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={SECTION_LABEL}>Route</span>
          <div style={{ flex: 1, height: 1, background: '#D2CFC6' }} />
        </div>

        {/* Visual connector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Origin */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2E7D52', border: '2px solid #ECEAE3', flexShrink: 0 }} />
              <div style={{ width: 1, height: 24, background: '#D2CFC6', marginTop: 2 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <label style={LABEL_STYLE}>Current Location</label>
              <input
                style={INPUT_STYLE}
                type="text"
                value={form.current_location}
                onChange={e => setForm(p => ({ ...p, current_location: e.target.value }))}
                placeholder="e.g. Chicago, IL"
                required
                onFocus={e => { e.target.style.borderColor = '#C47F17'; e.target.style.boxShadow = '0 0 0 3px rgba(196,127,23,0.13)' }}
                onBlur={e  => { e.target.style.borderColor = '#D2CFC6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Pickup */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C47F17', border: '2px solid #ECEAE3', flexShrink: 0 }} />
              <div style={{ width: 1, height: 24, background: '#D2CFC6', marginTop: 2 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <label style={LABEL_STYLE}>Pickup Location</label>
              <input
                style={INPUT_STYLE}
                type="text"
                value={form.pickup_location}
                onChange={e => setForm(p => ({ ...p, pickup_location: e.target.value }))}
                placeholder="e.g. St. Louis, MO"
                required
                onFocus={e => { e.target.style.borderColor = '#C47F17'; e.target.style.boxShadow = '0 0 0 3px rgba(196,127,23,0.13)' }}
                onBlur={e  => { e.target.style.borderColor = '#D2CFC6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Dropoff */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#B83232', border: '2px solid #ECEAE3', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>Dropoff Location</label>
              <input
                style={INPUT_STYLE}
                type="text"
                value={form.dropoff_location}
                onChange={e => setForm(p => ({ ...p, dropoff_location: e.target.value }))}
                placeholder="e.g. Dallas, TX"
                required
                onFocus={e => { e.target.style.borderColor = '#C47F17'; e.target.style.boxShadow = '0 0 0 3px rgba(196,127,23,0.13)' }}
                onBlur={e  => { e.target.style.borderColor = '#D2CFC6'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Driver Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={SECTION_LABEL}>Driver Status</span>
          <div style={{ flex: 1, height: 1, background: '#D2CFC6' }} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Cycle Hours Used</label>
          <input
            style={INPUT_STYLE}
            type="number"
            min={0} max={70} step={0.5}
            value={form.current_cycle_used}
            onChange={e => setForm(p => ({ ...p, current_cycle_used: e.target.value }))}
            placeholder="0"
            onFocus={e => { e.target.style.borderColor = '#C47F17'; e.target.style.boxShadow = '0 0 0 3px rgba(196,127,23,0.13)' }}
            onBlur={e  => { e.target.style.borderColor = '#D2CFC6'; e.target.style.boxShadow = 'none' }}
          />
          <p style={{ fontSize: 11, color: '#6B6760', marginTop: 4 }}>Hours used in current 70h/8-day cycle (0–70)</p>
        </div>

        {form.current_cycle_used && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: '#6B6760', textTransform: 'uppercase' }}>Cycle Used</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: cycleColor }}>{cycleVal}h / 70h</span>
            </div>
            <div style={{ height: 7, background: '#D2CFC6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${cyclePct}%`, background: cycleColor, borderRadius: 4, transition: 'width 0.3s, background 0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          background: loading ? '#D2A96A' : '#C47F17',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.18s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg style={{ width: 16, height: 16, animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
              <path fill="rgba(255,255,255,0.9)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Computing Route…
          </>
        ) : (
          'Calculate Route'
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HOS rules */}
      <div style={{ border: '1px solid #D2CFC6', borderRadius: 10, padding: '14px 16px', background: '#FFFFFF' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C47F17', margin: '0 0 10px' }}>
          HOS Rules Applied
        </p>
        {[
          '11h driving limit per shift',
          '14h on-duty window',
          '10h mandatory rest',
          '30-min break after 8h drive',
          'Fuel stop every 1,000 miles',
        ].map(rule => (
          <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D52', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#1A1917', fontWeight: 500 }}>{rule}</span>
          </div>
        ))}
      </div>

    </form>
  )
}

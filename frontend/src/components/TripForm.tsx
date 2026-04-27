'use client'

import { useState } from 'react'
import { calculateTrip, TripResult } from '@/lib/api'

interface Props {
  onResult: (result: TripResult) => void
  onLoading: (loading: boolean) => void
  onError: (error: string | null) => void
  loading: boolean
}

export default function TripForm({ onResult, onLoading, onError, loading }: Props) {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onError(null)
    onLoading(true)
    try {
      const result = await calculateTrip({
        current_location: form.current_location,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
        current_cycle_used: parseFloat(form.current_cycle_used) || 0,
      })
      onResult(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      const axiosErr = err as { response?: { data?: { error?: string } } }
      onError(axiosErr?.response?.data?.error || msg)
    } finally {
      onLoading(false)
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    type = 'text',
    hint?: string
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-muted tracking-wider uppercase">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        required
        min={type === 'number' ? 0 : undefined}
        max={type === 'number' ? 70 : undefined}
        step={type === 'number' ? 0.5 : undefined}
        className="bg-ink border border-border rounded-lg px-3 py-2.5 text-paper text-sm font-mono placeholder:text-muted/40 focus:outline-none focus:border-amber transition-colors"
      />
      {hint && <p className="text-xs text-muted/60">{hint}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-paper font-display text-xl tracking-wider">TRIP DETAILS</h2>
        <p className="text-muted text-xs mt-1">All locations accept city names or full addresses</p>
      </div>

      {/* Route section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber tracking-widest">ROUTE</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Visual route indicator */}
        <div className="flex flex-col gap-0">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-3">
              <div className="w-3 h-3 rounded-full bg-signal border-2 border-ink" />
              <div className="w-px h-8 bg-border mt-1" />
            </div>
            <div className="flex-1 pb-2">
              {field('current_location', 'Current Location', 'e.g. Chicago, IL')}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-3">
              <div className="w-3 h-3 rounded-full bg-amber border-2 border-ink" />
              <div className="w-px h-8 bg-border mt-1" />
            </div>
            <div className="flex-1 pb-2">
              {field('pickup_location', 'Pickup Location', 'e.g. St. Louis, MO')}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-3">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-ink" />
            </div>
            <div className="flex-1">
              {field('dropoff_location', 'Dropoff Location', 'e.g. Dallas, TX')}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber tracking-widest">DRIVER STATUS</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        {field(
          'current_cycle_used',
          'Cycle Hours Used',
          '0',
          'number',
          'Hours used in current 70h/8-day cycle (0–70)'
        )}

        {/* Cycle visual bar */}
        {form.current_cycle_used && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>CYCLE USED</span>
              <span>{form.current_cycle_used}h / 70h</span>
            </div>
            <div className="h-2 bg-stripe rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((parseFloat(form.current_cycle_used) / 70) * 100, 100)}%`,
                  background: parseFloat(form.current_cycle_used) > 60
                    ? '#FF4444'
                    : parseFloat(form.current_cycle_used) > 40
                    ? '#F5A623'
                    : '#00E5A0',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-amber text-ink font-display text-lg tracking-widest rounded-lg hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            COMPUTING ROUTE...
          </>
        ) : (
          'CALCULATE ROUTE'
        )}
      </button>

      {/* HOS rules reminder */}
      <div className="border border-border rounded-lg p-3 flex flex-col gap-1.5">
        <p className="text-xs font-mono text-amber tracking-wider">HOS RULES APPLIED</p>
        {[
          '11h driving limit per shift',
          '14h on-duty window',
          '10h mandatory rest',
          '30-min break after 8h drive',
          'Fuel stop every 1,000 miles',
        ].map(rule => (
          <div key={rule} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-signal flex-shrink-0" />
            <p className="text-xs text-muted">{rule}</p>
          </div>
        ))}
      </div>
    </form>
  )
}

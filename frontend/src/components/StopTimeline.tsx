'use client'

import { TripResult, Stop } from '@/lib/api'

interface Props { result: TripResult }

const STOP_COLORS: Record<string, string> = {
  pickup:     '#F5A623',
  dropoff:    '#FF4444',
  fuel:       '#00E5A0',
  rest_break: '#818CF8',
  sleeper:    '#60A5FA',
}

const STOP_ICONS: Record<string, string> = {
  pickup:     '📦',
  dropoff:    '🏁',
  fuel:       '⛽',
  rest_break: '☕',
  sleeper:    '🛏',
}

const STOP_LABELS: Record<string, string> = {
  pickup:     'PICKUP',
  dropoff:    'DROPOFF',
  fuel:       'FUEL STOP',
  rest_break: '30-MIN BREAK',
  sleeper:    'SLEEPER REST',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function StopTimeline({ result }: Props) {
  const { stops, waypoints, trip_summary } = result

  // Build full event list: start + stops + end
  const events = [
    {
      type: 'start',
      label: 'DEPARTURE',
      icon: '🚛',
      color: '#00E5A0',
      location: waypoints.current.display_name || 'Current Location',
      time: new Date(stops[0]?.arrival_time).toISOString(),
      detail: 'Trip begins',
      duration: null,
    },
    ...stops.map((s: Stop) => ({
      type: s.type,
      label: STOP_LABELS[s.type] || s.type.toUpperCase(),
      icon: STOP_ICONS[s.type] || '📍',
      color: STOP_COLORS[s.type] || '#888',
      location: s.location.display_name || `${s.location.lat.toFixed(3)}, ${s.location.lng.toFixed(3)}`,
      time: s.arrival_time,
      detail: s.notes,
      duration: s.duration_hours,
    })),
    {
      type: 'end',
      label: 'ARRIVAL',
      icon: '✅',
      color: '#00E5A0',
      location: waypoints.dropoff.display_name || 'Dropoff Location',
      time: trip_summary.estimated_arrival,
      detail: 'Trip complete',
      duration: null,
    },
  ]

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-paper font-display text-xl tracking-wider mb-1">STOP TIMELINE</h3>
        <p className="text-muted text-xs font-mono mb-6">
          {stops.length} scheduled stops · {trip_summary.total_distance_miles.toFixed(0)} mi total
        </p>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          <div className="flex flex-col gap-0">
            {events.map((event, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 border-2 border-ink"
                  style={{ background: event.color + '22', borderColor: event.color }}
                >
                  {event.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="bg-stripe border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span
                          className="text-xs font-mono font-bold tracking-widest"
                          style={{ color: event.color }}
                        >
                          {event.label}
                        </span>
                        <p className="text-paper text-sm mt-0.5">{event.location}</p>
                      </div>
                      {event.duration !== null && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono text-muted">DURATION</div>
                          <div className="text-paper font-mono text-sm">{event.duration}h</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-muted">ARRIVE</span>
                        <span className="text-xs font-mono text-paper">{fmt(event.time)}</span>
                      </div>
                    </div>
                    {event.detail && (
                      <p className="text-muted text-xs mt-2 border-t border-border pt-2">{event.detail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Drive', value: `${trip_summary.total_driving_hours.toFixed(1)}h` },
            { label: 'Fuel Stops', value: `${trip_summary.fuel_stops}` },
            { label: 'Rest Stops', value: `${trip_summary.rest_stops}` },
          ].map(item => (
            <div key={item.label} className="bg-stripe border border-border rounded-lg p-3 text-center">
              <div className="text-amber font-mono text-lg">{item.value}</div>
              <div className="text-muted text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

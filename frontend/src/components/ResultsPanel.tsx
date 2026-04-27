'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { TripResult } from '@/lib/api'
import StopTimeline from './StopTimeline'
import ELDLog from './ELDLog'

const TripMap = dynamic(() => import('./TripMap'), { ssr: false })

interface Props {
  result: TripResult
}

type Tab = 'map' | 'stops' | 'eld'

export default function ResultsPanel({ result }: Props) {
  const [tab, setTab] = useState<Tab>('map')

  const s = result.trip_summary

  return (
    <div className="h-full flex flex-col">
      {/* Summary bar */}
      <div className="border-b border-border px-5 py-3 flex items-center gap-6 flex-shrink-0 bg-asphalt overflow-x-auto">
        {[
          { label: 'TOTAL DISTANCE', value: `${s.total_distance_miles.toFixed(0)} mi` },
          { label: 'TRIP DURATION', value: `${s.total_duration_hours.toFixed(1)}h` },
          { label: 'DRIVING TIME', value: `${s.total_driving_hours.toFixed(1)}h` },
          { label: 'DAYS', value: `${s.num_days}` },
          { label: 'FUEL STOPS', value: `${s.fuel_stops}` },
          { label: 'REST STOPS', value: `${s.rest_stops}` },
        ].map(item => (
          <div key={item.label} className="flex flex-col flex-shrink-0">
            <span className="text-xs font-mono text-muted tracking-wider">{item.label}</span>
            <span className="text-paper font-mono text-base font-medium">{item.value}</span>
          </div>
        ))}
        <div className="flex flex-col flex-shrink-0 ml-auto">
          <span className="text-xs font-mono text-muted tracking-wider">ETA</span>
          <span className="text-signal font-mono text-sm">
            {new Date(s.estimated_arrival).toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex flex-shrink-0">
        {([
          { id: 'map', label: '🗺 MAP' },
          { id: 'stops', label: '📍 STOP TIMELINE' },
          { id: 'eld', label: '📋 ELD LOGS' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs font-mono tracking-wider transition-colors border-b-2 ${
              tab === t.id
                ? 'text-amber border-amber'
                : 'text-muted border-transparent hover:text-paper'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'map' && <TripMap result={result} />}
        {tab === 'stops' && <StopTimeline result={result} />}
        {tab === 'eld' && <ELDLog result={result} />}
      </div>
    </div>
  )
}

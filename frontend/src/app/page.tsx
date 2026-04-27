'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { calculateTrip, TripInput, TripResult } from '@/lib/api'
import ELDLogComponent from '@/components/ELDLogComponent'

// Load MapComponent dynamically to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-ink text-white/20">Initializing Tactical Systems...</div>
})

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TripResult | null>(null)
  
  const [inputs, setInputs] = useState<TripInput>({
    current_location: 'Chicago, IL',
    pickup_location: 'St. Louis, MO',
    dropoff_location: 'Dallas, TX',
    current_cycle_used: 0
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

  return (
    <main className="relative h-screen w-full flex overflow-hidden">
      {/* Sidebar Command Center */}
      <aside className="w-96 h-full glass-panel z-50 flex flex-col p-8 border-r border-white/10 overflow-y-auto shrink-0">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tighter text-amber mb-1">HAULPATH</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-mono">ELD Strategic Router v1.0</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1">
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase text-white/40 font-semibold mb-2 block">Origin</label>
              <input 
                type="text" 
                className="input-field" 
                value={inputs.current_location}
                onChange={e => setInputs({...inputs, current_location: e.target.value})}
                placeholder="Current Location"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-white/40 font-semibold mb-2 block">Pickup</label>
              <input 
                type="text" 
                className="input-field" 
                value={inputs.pickup_location}
                onChange={e => setInputs({...inputs, pickup_location: e.target.value})}
                placeholder="Pickup Location"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-white/40 font-semibold mb-2 block">Destination</label>
              <input 
                type="text" 
                className="input-field" 
                value={inputs.dropoff_location}
                onChange={e => setInputs({...inputs, dropoff_location: e.target.value})}
                placeholder="Dropoff Location"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-white/40 font-semibold mb-2 block">Used Cycle (Hours)</label>
              <input 
                type="number" 
                step="0.1"
                className="input-field" 
                value={inputs.current_cycle_used}
                onChange={e => setInputs({...inputs, current_cycle_used: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Calculating Path...' : 'Compute Route'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded text-error text-xs">
            {error}
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-white/5 text-[10px] font-mono text-white/20">
          SYSTEM STATUS: {loading ? 'COMPUTING' : 'IDLE'} // HOS_ENGINE: READY
        </div>
      </aside>

      {/* Main View Area (Map & Logs Placeholder) */}
      <section className="flex-1 relative bg-[#050505] overflow-y-auto">
        {!result && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/10 select-none">
            <div className="text-center">
              <div className="text-8xl font-bold mb-4">HAULPATH</div>
              <p className="text-sm tracking-widest uppercase">Awaiting flight coordinates</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50 backdrop-blur-sm z-40">
             <div className="w-12 h-12 border-4 border-amber border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {result && (
          <div className="h-full flex flex-col p-8 space-y-8">
             {/* Stats Header */}
             <div className="shrink-0">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-signal flex items-center gap-3">
                   <span className="w-3 h-3 bg-signal rounded-full shadow-[0_0_10px_#10b981]"></span>
                   COMPUTATION COMPLETE
                 </h2>
                 <button 
                   onClick={() => window.print()}
                   className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono hover:bg-white/10 transition-all uppercase tracking-widest print:hidden"
                 >
                   Export Logs (PDF)
                 </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="glass-panel p-4 rounded-lg">
                   <div className="text-[10px] text-white/30 uppercase mb-1 font-mono">Distance</div>
                   <div className="text-xl font-bold">{result.trip_summary.total_distance_miles.toFixed(1)} <span className="text-xs font-normal opacity-50">mi</span></div>
                 </div>
                 <div className="glass-panel p-4 rounded-lg">
                   <div className="text-[10px] text-white/30 uppercase mb-1 font-mono">Drive Time</div>
                   <div className="text-xl font-bold">{result.trip_summary.total_driving_hours.toFixed(1)} <span className="text-xs font-normal opacity-50">hr</span></div>
                 </div>
                 <div className="glass-panel p-4 rounded-lg">
                   <div className="text-[10px] text-white/30 uppercase mb-1 font-mono">Stops</div>
                   <div className="text-xl font-bold">{result.trip_summary.fuel_stops + result.trip_summary.rest_stops} <span className="text-xs font-normal opacity-50">events</span></div>
                 </div>
                 <div className="glass-panel p-4 rounded-lg border-amber/20">
                   <div className="text-[10px] text-amber/40 uppercase mb-1 font-mono">ETA</div>
                   <div className="text-lg font-bold text-amber">
                     {new Date(result.trip_summary.estimated_arrival).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                   </div>
                 </div>
               </div>
             </div>

             {/* Main Scrollable Content */}
             <div className="flex-1 space-y-12">
               {/* Map Visualization */}
               <div className="h-[500px] glass-panel rounded-xl overflow-hidden border border-white/5 relative shadow-2xl print:hidden">
                 <MapComponent result={result} />
               </div>

               {/* ELD Log Sheets */}
               <div className="space-y-8 pb-12">
                 <div className="flex items-center gap-4">
                   <h2 className="text-xl font-bold text-paper/80 uppercase tracking-widest font-mono">
                     Compliance Output
                   </h2>
                   <div className="h-[1px] flex-1 bg-white/10"></div>
                 </div>
                 {result.daily_logs.map((log, i) => (
                   <ELDLogComponent key={i} log={log} />
                 ))}
               </div>
             </div>
          </div>
        )}
      </section>
    </main>
  )
}

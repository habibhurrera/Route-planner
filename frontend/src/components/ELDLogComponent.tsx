'use client'

import { DailyLog } from '@/lib/api'

const STATUS_Y = {
  off_duty: 20,
  sleeper: 50,
  driving: 80,
  on_duty: 110,
}

export default function ELDLogComponent({ log }: { log: DailyLog }) {
  const width = 800
  const height = 130
  const hourWidth = width / 24

  const getX = (isoString: string) => {
    const date = new Date(isoString)
    // Use UTC hours to match backend midnight-to-midnight logic
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60
    return hours * hourWidth
  }

  // Build the path points
  let pathD = ""
  if (log.duty_periods.length > 0) {
    log.duty_periods.forEach((period, idx) => {
      const xStart = Math.max(0, getX(period.start_time))
      const xEnd = Math.min(width, getX(period.end_time))
      const y = STATUS_Y[period.status] || 20

      if (idx === 0) {
        pathD += `M ${xStart} ${y} `
      } else {
        const prevY = STATUS_Y[log.duty_periods[idx-1].status] || 20
        pathD += `L ${xStart} ${prevY} L ${xStart} ${y} `
      }
      pathD += `L ${xEnd} ${y} `
    })
  }

  return (
    <div className="glass-panel p-6 rounded-xl border border-white/10 mb-8 last:mb-0 bg-white/[0.01]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-amber font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-amber rounded-full animate-pulse"></span>
            Daily Log Sheet // Day {log.day_number}
          </h3>
          <p className="text-white/40 text-[10px] font-mono mt-1">{log.date} (UTC Cycle)</p>
        </div>
        <div className="flex gap-6 text-[10px] font-mono">
          <div className="text-right">
            <span className="text-white/20 block mb-1">DRIVING</span>
            <span className="text-signal font-bold text-sm leading-none">{log.total_drive_hours.toFixed(1)}h</span>
          </div>
          <div className="text-right">
            <span className="text-white/20 block mb-1">ON-DUTY</span>
            <span className="text-paper font-bold text-sm leading-none">{log.total_on_duty_hours.toFixed(1)}h</span>
          </div>
          <div className="text-right">
            <span className="text-white/20 block mb-1">SLEEPER</span>
            <span className="text-paper font-bold text-sm leading-none">{log.total_sleeper_hours.toFixed(1)}h</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 scrollbar-hide">
        <svg width={width + 100} height={height + 40} className="overflow-visible ml-16">
          {/* Grid Background */}
          <rect width={width} height={height} fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.1)" />
          
          {/* Status Lines and Labels */}
          {Object.entries(STATUS_Y).map(([status, y]) => (
            <g key={status}>
              <line x1={0} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={-10} y={y + 4} textAnchor="end" className="fill-white/30 text-[9px] font-mono uppercase font-bold">
                {status.replace('_', ' ')}
              </text>
            </g>
          ))}

          {/* Hour Markers */}
          {Array.from({ length: 25 }).map((_, i) => (
            <g key={i}>
              <line 
                x1={i * hourWidth} 
                y1={0} 
                x2={i * hourWidth} 
                y2={height} 
                stroke={i % 6 === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"} 
              />
              <text x={i * hourWidth} y={height + 15} textAnchor="middle" className="fill-white/20 text-[8px] font-mono">
                {i === 0 ? 'M' : i === 12 ? 'N' : i === 24 ? 'M' : i}
              </text>
            </g>
          ))}

          {/* The Log Graph Line */}
          <path d={pathD} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>

      {log.remarks.length > 0 && (
        <div className="mt-8 pt-4 border-t border-white/5">
          <div className="text-[9px] text-white/20 font-mono uppercase mb-3 tracking-tighter">Duty Status Remarks</div>
          <div className="flex flex-wrap gap-2">
            {log.remarks.map((remark, i) => (
              <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/60">
                {remark}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

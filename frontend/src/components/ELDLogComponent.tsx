'use client'

import { DailyLog } from '@/lib/api'

const STATUS_Y: Record<string, number> = {
  off_duty: 20,
  sleeper:  50,
  driving:  80,
  on_duty:  110,
}

export default function ELDLogComponent({ log }: { log: DailyLog }) {
  const width     = 800
  const height    = 130
  const hourWidth = width / 24

  const getX = (isoString: string) => {
    const date  = new Date(isoString)
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60
    return hours * hourWidth
  }

  let pathD = ''
  if (log.duty_periods.length > 0) {
    log.duty_periods.forEach((period, idx) => {
      const xStart = Math.max(0, getX(period.start_time))
      const xEnd   = Math.min(width, getX(period.end_time))
      const y      = STATUS_Y[period.status] ?? 20

      if (idx === 0) {
        pathD += `M ${xStart} ${y} `
      } else {
        const prevY = STATUS_Y[log.duty_periods[idx - 1].status] ?? 20
        pathD += `L ${xStart} ${prevY} L ${xStart} ${y} `
      }
      pathD += `L ${xEnd} ${y} `
    })
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '24px 24px 20px',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--amber)',
              margin: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--amber)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Day {log.day_number} Log Sheet
          </h3>
          <p
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              fontWeight: 500,
              letterSpacing: '0.06em',
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {log.date} · UTC Cycle
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Driving',  value: log.total_drive_hours,    color: 'var(--signal)' },
            { label: 'On-Duty',  value: log.total_on_duty_hours,  color: 'var(--strong)' },
            { label: 'Sleeper',  value: log.total_sleeper_hours,  color: 'var(--muted)'  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {value.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <svg width={width + 100} height={height + 44} style={{ overflow: 'visible', marginLeft: 64 }}>
          {/* Chart background */}
          <rect
            width={width}
            height={height}
            fill="#F7F5F0"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Status rows */}
          {Object.entries(STATUS_Y).map(([status, y]) => (
            <g key={status}>
              <rect x={0} y={y - 15} width={width} height={30} fill={y % 60 === 20 ? 'rgba(0,0,0,0.015)' : 'transparent'} />
              <line x1={0} y1={y} x2={width} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
              <text
                x={-10}
                y={y + 4}
                textAnchor="end"
                fill="var(--muted)"
                fontSize={9}
                fontFamily="'DM Sans', sans-serif"
                fontWeight={600}
                letterSpacing={0.5}
              >
                {status.replace('_', ' ').toUpperCase()}
              </text>
            </g>
          ))}

          {/* Hour markers */}
          {Array.from({ length: 25 }).map((_, i) => (
            <g key={i}>
              <line
                x1={i * hourWidth}
                y1={0}
                x2={i * hourWidth}
                y2={height}
                stroke={i % 6 === 0 ? 'var(--border)' : 'rgba(0,0,0,0.06)'}
                strokeWidth={i % 6 === 0 ? 1 : 0.5}
              />
              <text
                x={i * hourWidth}
                y={height + 16}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={9}
                fontFamily="'DM Sans', sans-serif"
                fontWeight={500}
              >
                {i === 0 ? 'M' : i === 12 ? 'N' : i === 24 ? 'M' : i}
              </text>
            </g>
          ))}

          {/* ELD line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--amber)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Remarks */}
      {log.remarks.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 10,
            }}
          >
            Duty Status Remarks
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {log.remarks.map((remark, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  color: 'var(--strong)',
                }}
              >
                {remark}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

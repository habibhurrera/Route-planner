'use client'

import { useEffect, useRef, useState } from 'react'
import { TripResult, DailyLog, DutyPeriod } from '@/lib/api'

interface Props { result: TripResult }

// FMCSA row order (top to bottom)
const ROWS = ['off_duty', 'sleeper', 'driving', 'on_duty'] as const
type RowType = typeof ROWS[number]

const ROW_LABELS: Record<RowType, string> = {
  off_duty: '1. Off Duty',
  sleeper:  '2. Sleeper\n   Berth',
  driving:  '3. Driving',
  on_duty:  '4. On Duty\n   (Not Driving)',
}

const ROW_COLORS: Record<RowType, string> = {
  off_duty: '#60A5FA',
  sleeper:  '#818CF8',
  driving:  '#F5A623',
  on_duty:  '#00E5A0',
}

function drawELDLog(canvas: HTMLCanvasElement, log: DailyLog) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  // Background
  ctx.fillStyle = '#F8F6F0'
  ctx.fillRect(0, 0, W, H)

  // --- Header ---
  const headerH = 90
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, headerH)
  ctx.strokeStyle = '#CCCCCC'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, W, headerH)

  // Title
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 14px serif'
  ctx.textAlign = 'center'
  ctx.fillText("Driver's Daily Log", W / 2, 20)
  ctx.font = '10px sans-serif'
  ctx.fillText('(24 hours)', W / 2, 33)

  // Date
  ctx.textAlign = 'left'
  ctx.font = '10px sans-serif'
  ctx.fillStyle = '#333'
  ctx.fillText(`Date: ${log.date}`, 12, 20)
  ctx.fillText(`Day ${log.day_number}`, 12, 33)

  // Right side labels
  ctx.textAlign = 'right'
  ctx.fillText('Original – File at home terminal', W - 12, 20)
  ctx.fillText('Duplicate – Driver retains for 8 days', W - 12, 33)

  // Hour totals header
  ctx.textAlign = 'left'
  ctx.font = 'bold 9px sans-serif'
  ctx.fillStyle = '#111'
  ctx.fillText(`Total Miles Driving Today: ${log.total_drive_hours > 0 ? (log.total_drive_hours * 55).toFixed(0) : '—'}`, 12, 55)
  ctx.fillText(`Drive: ${log.total_drive_hours.toFixed(2)}h  |  On-Duty: ${log.total_on_duty_hours.toFixed(2)}h  |  Off-Duty: ${log.total_off_duty_hours.toFixed(2)}h  |  Sleeper: ${log.total_sleeper_hours.toFixed(2)}h`, 12, 70)

  ctx.font = '9px sans-serif'
  ctx.fillStyle = '#555'
  ctx.fillText('HaulPath ELD System  |  Property-Carrying Driver  |  70-Hour/8-Day Cycle', 12, 85)

  // --- Grid ---
  const gridTop = headerH + 10
  const labelW = 85
  const hoursW = W - labelW - 55  // 55 for total column
  const rowH = 35
  const gridH = rowH * 4
  const totalColW = 55

  // Hour markers: 0 to 24 (midnight to midnight)
  const hourLabels = ['Mid-\nnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Noon', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Mid-\nnight']

  // Grid border
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1.5
  ctx.strokeRect(labelW, gridTop, hoursW + totalColW, gridH)

  // Draw hour columns
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 0.5

  for (let h = 0; h <= 24; h++) {
    const x = labelW + (h / 24) * hoursW
    const isMajor = h % 1 === 0
    ctx.lineWidth = h === 0 || h === 12 || h === 24 ? 1.5 : (h % 6 === 0 ? 1 : 0.4)
    ctx.strokeStyle = h === 0 || h === 12 || h === 24 ? '#333' : '#AAAAAA'
    ctx.beginPath()
    ctx.moveTo(x, gridTop)
    ctx.lineTo(x, gridTop + gridH)
    ctx.stroke()

    // Quarter-hour ticks
    if (h < 24) {
      for (let q = 1; q < 4; q++) {
        const qx = labelW + ((h + q / 4) / 24) * hoursW
        ctx.lineWidth = 0.3
        ctx.strokeStyle = '#CCCCCC'
        ctx.beginPath()
        ctx.moveTo(qx, gridTop)
        ctx.lineTo(qx, gridTop + gridH)
        ctx.stroke()
      }
    }
  }

  // Draw row lines
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  for (let r = 0; r <= 4; r++) {
    const y = gridTop + r * rowH
    ctx.beginPath()
    ctx.moveTo(labelW, y)
    ctx.lineTo(labelW + hoursW + totalColW, y)
    ctx.stroke()
  }

  // Total column divider
  ctx.beginPath()
  ctx.moveTo(labelW + hoursW, gridTop)
  ctx.lineTo(labelW + hoursW, gridTop + gridH)
  ctx.stroke()

  // Hour labels at top
  ctx.font = '8px sans-serif'
  ctx.fillStyle = '#333'
  ctx.textAlign = 'center'
  hourLabels.forEach((label, h) => {
    const x = labelW + (h / 24) * hoursW
    const lines = label.split('\n')
    lines.forEach((line, li) => {
      ctx.fillText(line, x, gridTop - 8 + li * 9)
    })
  })

  // Row labels + draw duty bars
  ROWS.forEach((rowKey, rowIdx) => {
    const y = gridTop + rowIdx * rowH
    const rowMid = y + rowH / 2

    // Row label
    ctx.fillStyle = '#111111'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    const labelLines = ROW_LABELS[rowKey].split('\n')
    labelLines.forEach((line, li) => {
      ctx.fillText(line, labelW - 4, rowMid - (labelLines.length - 1) * 5 + li * 11)
    })

    // Row background (alternating)
    if (rowIdx % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.02)'
      ctx.fillRect(labelW, y, hoursW, rowH)
    }

    // Draw duty periods for this row
    const dayStart = new Date(log.date + 'T00:00:00')
    const dayEnd = new Date(log.date + 'T24:00:00')

    log.duty_periods.forEach((period: DutyPeriod) => {
      // Map status to row
      let targetRow: RowType
      if (period.status === 'driving') targetRow = 'driving'
      else if (period.status === 'on_duty') targetRow = 'on_duty'
      else if (period.status === 'sleeper') targetRow = 'sleeper'
      else targetRow = 'off_duty'

      if (targetRow !== rowKey) return

      const pStart = new Date(period.start_time)
      const pEnd = new Date(period.end_time)

      const clampedStart = pStart < dayStart ? dayStart : pStart
      const clampedEnd = pEnd > dayEnd ? dayEnd : pEnd

      if (clampedEnd <= clampedStart) return

      const startFrac = (clampedStart.getTime() - dayStart.getTime()) / (24 * 3600 * 1000)
      const endFrac = (clampedEnd.getTime() - dayStart.getTime()) / (24 * 3600 * 1000)

      const barX = labelW + startFrac * hoursW
      const barW = (endFrac - startFrac) * hoursW
      const barY = y + rowH * 0.2
      const barH = rowH * 0.6

      // Fill bar
      ctx.fillStyle = ROW_COLORS[rowKey]
      ctx.globalAlpha = 0.85
      ctx.fillRect(barX, barY, Math.max(barW, 1), barH)
      ctx.globalAlpha = 1.0

      // Bar border
      ctx.strokeStyle = ROW_COLORS[rowKey]
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, Math.max(barW, 1), barH)

      // Solid line in middle of bar (FMCSA style)
      ctx.strokeStyle = ROW_COLORS[rowKey]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(barX, y + rowH / 2)
      ctx.lineTo(barX + barW, y + rowH / 2)
      ctx.stroke()
    })

    // Total hours for this row
    let totalH = 0
    log.duty_periods.forEach((p: DutyPeriod) => {
      let targetRow: RowType
      if (p.status === 'driving') targetRow = 'driving'
      else if (p.status === 'on_duty') targetRow = 'on_duty'
      else if (p.status === 'sleeper') targetRow = 'sleeper'
      else targetRow = 'off_duty'
      if (targetRow === rowKey) totalH += p.duration_hours
    })

    ctx.fillStyle = '#111111'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(totalH.toFixed(2), labelW + hoursW + totalColW / 2, rowMid + 4)
  })

  // Total hours label header
  ctx.fillStyle = '#333'
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Total', labelW + hoursW + totalColW / 2, gridTop - 4)

  // --- Remarks section ---
  const remarksY = gridTop + gridH + 15
  ctx.fillStyle = '#111'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('REMARKS', labelW, remarksY)

  ctx.strokeStyle = '#AAAAAA'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(labelW, remarksY + 5)
  ctx.lineTo(W - 10, remarksY + 5)
  ctx.stroke()

  ctx.font = '9px sans-serif'
  ctx.fillStyle = '#444'
  log.remarks.forEach((remark, i) => {
    ctx.fillText(`• ${remark}`, labelW, remarksY + 18 + i * 13)
  })

  // HOS summary
  const summaryY = remarksY + 18 + log.remarks.length * 13 + 10
  ctx.font = '8px monospace'
  ctx.fillStyle = '#555'
  ctx.fillText(
    `Drive: ${log.total_drive_hours.toFixed(2)}h  |  On-Duty (not driving): ${log.total_on_duty_hours.toFixed(2)}h  |  Off-Duty: ${log.total_off_duty_hours.toFixed(2)}h  |  Sleeper: ${log.total_sleeper_hours.toFixed(2)}h  |  TOTAL = 24h`,
    labelW, summaryY
  )

  // Bottom certification line
  ctx.font = '8px sans-serif'
  ctx.fillStyle = '#888'
  ctx.fillText('I certify that these entries are true and correct.  Signature: _________________________', labelW, H - 10)
}

export default function ELDLog({ result }: Props) {
  const [activeDay, setActiveDay] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const log = result.daily_logs[activeDay]

  useEffect(() => {
    if (!canvasRef.current || !log) return
    drawELDLog(canvasRef.current, log)
  }, [log, activeDay])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `eld-log-day-${activeDay + 1}-${log.date}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-paper font-display text-xl tracking-wider">ELD DAILY LOGS</h3>
            <p className="text-muted text-xs font-mono mt-0.5">
              FMCSA-standard format · {result.daily_logs.length} day{result.daily_logs.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-amber text-ink font-mono text-xs tracking-wider rounded-lg hover:bg-amber-light transition-colors"
          >
            ↓ DOWNLOAD PNG
          </button>
        </div>

        {/* Day tabs */}
        {result.daily_logs.length > 1 && (
          <div className="flex gap-2 mb-4">
            {result.daily_logs.map((log, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-colors border ${
                  activeDay === i
                    ? 'bg-amber text-ink border-amber'
                    : 'bg-stripe text-muted border-border hover:text-paper'
                }`}
              >
                DAY {log.day_number} — {log.date}
              </button>
            ))}
          </div>
        )}

        {/* Color legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {(Object.entries(ROW_COLORS) as [RowType, string][]).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs font-mono text-muted capitalize">{ROW_LABELS[key].split('\n')[0]}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-border">
          <canvas
            ref={canvasRef}
            width={900}
            height={340}
            className="w-full h-auto eld-canvas"
          />
        </div>

        {/* Daily summary table */}
        {log && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: 'Driving', value: `${log.total_drive_hours.toFixed(2)}h`, color: '#F5A623' },
              { label: 'On-Duty (ND)', value: `${log.total_on_duty_hours.toFixed(2)}h`, color: '#00E5A0' },
              { label: 'Off-Duty', value: `${log.total_off_duty_hours.toFixed(2)}h`, color: '#60A5FA' },
              { label: 'Sleeper', value: `${log.total_sleeper_hours.toFixed(2)}h`, color: '#818CF8' },
            ].map(item => (
              <div key={item.label} className="bg-stripe border border-border rounded-lg p-3 text-center">
                <div className="font-mono text-lg font-medium" style={{ color: item.color }}>{item.value}</div>
                <div className="text-muted text-xs mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Duty periods breakdown */}
        {log && (
          <div className="mt-4">
            <p className="text-xs font-mono text-muted tracking-wider mb-2">DUTY PERIOD BREAKDOWN</p>
            <div className="flex flex-col gap-1">
              {log.duty_periods.map((period, i) => {
                const rowKey = period.status === 'driving' ? 'driving'
                  : period.status === 'on_duty' ? 'on_duty'
                  : period.status === 'sleeper' ? 'sleeper'
                  : 'off_duty'
                const color = ROW_COLORS[rowKey as RowType]
                const start = new Date(period.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                const end = new Date(period.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={i} className="flex items-center gap-3 text-xs font-mono bg-stripe rounded px-3 py-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <span className="text-paper w-28 flex-shrink-0">{start} – {end}</span>
                    <span className="font-medium flex-shrink-0" style={{ color }}>{period.duration_hours.toFixed(2)}h</span>
                    <span className="text-muted truncate">{period.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { TripResult, DailyLog, DutyPeriod } from '@/lib/api'

interface Props { result: TripResult }

const ROW_ORDER = ['off_duty', 'sleeper', 'driving', 'on_duty'] as const
type RowKey = typeof ROW_ORDER[number]

const ROW_LABELS: Record<RowKey, string[]> = {
  off_duty: ['1. Off Duty'],
  sleeper:  ['2. Sleeper', 'Berth'],
  driving:  ['3. Driving'],
  on_duty:  ['4. On Duty', '(not driving)'],
}

const ROW_COLORS: Record<RowKey, string> = {
  off_duty: '#2563EB',
  sleeper:  '#7C3AED',
  driving:  '#B45309',
  on_duty:  '#15803D',
}

const HOUR_LABELS = [
  'Mid-\nnight','1','2','3','4','5','6','7','8','9','10','11',
  'Noon','1','2','3','4','5','6','7','8','9','10','11','Mid-\nnight'
]

function rowForStatus(s: string): RowKey {
  if (s === 'driving')  return 'driving'
  if (s === 'on_duty')  return 'on_duty'
  if (s === 'sleeper')  return 'sleeper'
  return 'off_duty'
}

function drawLog(canvas: HTMLCanvasElement, log: DailyLog, result: TripResult) {
  const ctx   = canvas.getContext('2d')!
  const W     = canvas.width
  const H     = canvas.height
  const dpr   = 1

  // ── Fonts ──────────────────────────────────────────────────────
  const FONT_SERIF  = 'bold 13px Georgia, serif'
  const FONT_SM     = '11px Arial, sans-serif'
  const FONT_XS     = '9.5px Arial, sans-serif'
  const FONT_MONO   = '10px "Courier New", monospace'
  const FONT_BOLD   = 'bold 11px Arial, sans-serif'
  const FONT_TITLE  = 'bold 20px Georgia, serif'

  // ── Layout constants ────────────────────────────────────────────
  const PAD       = 24
  const HEADER_H  = 180
  const GRID_TOP  = HEADER_H + 44   // room for hour labels above grid
  const ROW_H     = 42
  const GRID_H    = ROW_H * 4
  const LABEL_W   = 90
  const TOTAL_W   = 58
  const CHART_W   = W - PAD * 2 - LABEL_W - TOTAL_W
  const GRID_X    = PAD + LABEL_W

  // ── White background ────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — HEADER
  // ══════════════════════════════════════════════════════════════
  let y = PAD

  // Title + 24 hours label
  ctx.fillStyle = '#000'
  ctx.font = FONT_TITLE
  ctx.textAlign = 'left'
  ctx.fillText("Driver's Daily Log", PAD, y + 18)

  ctx.font = FONT_SM
  ctx.fillStyle = '#333'
  ctx.fillText('(24 hours)', PAD, y + 34)

  // Date blanks
  const dateX = 240
  ctx.font = FONT_SM
  ctx.fillStyle = '#000'
  ctx.fillText('Date:', dateX, y + 16)
  ctx.font = FONT_MONO
  ctx.fillText(log.date, dateX + 36, y + 16)
  ctx.beginPath(); ctx.moveTo(dateX + 36, y + 18); ctx.lineTo(dateX + 130, y + 18)
  ctx.strokeStyle = '#000'; ctx.lineWidth = 0.8; ctx.stroke()

  // Original / Duplicate note
  ctx.font = FONT_SM; ctx.fillStyle = '#000'
  ctx.textAlign = 'right'
  ctx.fillText('Original – File at home terminal.', W - PAD, y + 14)
  ctx.fillText('Duplicate – Driver retains for 8 days.', W - PAD, y + 28)

  y += 50

  // From / To line
  ctx.textAlign = 'left'; ctx.font = FONT_SM; ctx.fillStyle = '#000'
  ctx.fillText('From:', PAD, y)
  const fromVal = `${result.waypoints.current.lat.toFixed(4)}, ${result.waypoints.current.lng.toFixed(4)}`
  ctx.font = FONT_MONO
  ctx.fillText(fromVal, PAD + 40, y)
  ctx.beginPath(); ctx.moveTo(PAD + 38, y + 2); ctx.lineTo(PAD + 240, y + 2); ctx.stroke()

  ctx.font = FONT_SM
  ctx.fillText('To:', W / 2 + 10, y)
  const toVal = `${result.waypoints.dropoff.lat.toFixed(4)}, ${result.waypoints.dropoff.lng.toFixed(4)}`
  ctx.font = FONT_MONO
  ctx.fillText(toVal, W / 2 + 36, y)
  ctx.beginPath(); ctx.moveTo(W / 2 + 34, y + 2); ctx.lineTo(W - PAD, y + 2); ctx.stroke()

  y += 24

  // Miles / Mileage boxes
  const boxW = 130; const boxH = 32
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1
  ctx.strokeRect(PAD, y, boxW, boxH)
  ctx.strokeRect(PAD + boxW + 12, y, boxW, boxH)

  const driveKm = log.total_drive_hours * 88.5  // ~55mph in km
  const driveMi = Math.round(log.total_drive_hours * 55)
  ctx.font = FONT_MONO; ctx.fillStyle = '#000'
  ctx.fillText(`${driveMi} mi`, PAD + 8, y + 20)
  ctx.fillText(`${Math.round(driveKm)} km`, PAD + boxW + 20, y + 20)

  ctx.font = FONT_XS; ctx.fillStyle = '#333'
  ctx.fillText('Total Miles Driving Today', PAD, y + boxH + 13)
  ctx.fillText('Total Mileage Today', PAD + boxW + 12, y + boxH + 13)

  // Carrier / Address lines (right side)
  const infoX = PAD + boxW * 2 + 40
  ctx.font = FONT_XS; ctx.fillStyle = '#555'
  const lines = [
    ['Name of Carrier or Carriers', 'HaulPath Logistics'],
    ['Main Office Address', '—'],
    ['Home Terminal Address', '—'],
  ]
  lines.forEach(([label, val], i) => {
    const ly = y + i * 26
    ctx.fillText(label, infoX, ly + 10)
    ctx.font = FONT_MONO; ctx.fillStyle = '#000'
    ctx.fillText(val, infoX, ly + 22)
    ctx.font = FONT_XS; ctx.fillStyle = '#555'
    ctx.beginPath(); ctx.moveTo(infoX, ly + 24); ctx.lineTo(W - PAD, ly + 24)
    ctx.strokeStyle = '#BBB'; ctx.lineWidth = 0.5; ctx.stroke()
  })

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — HOUR LABELS (above grid)
  // ══════════════════════════════════════════════════════════════
  const labelRowY = GRID_TOP - 26

  // Black header bar (exactly like the image)
  ctx.fillStyle = '#111'
  ctx.fillRect(GRID_X, labelRowY - 18, CHART_W + TOTAL_W, 20)

  ctx.fillStyle = '#FFF'
  ctx.font = 'bold 8.5px Arial, sans-serif'
  ctx.textAlign = 'center'
  HOUR_LABELS.forEach((lbl, h) => {
    const x = GRID_X + (h / 24) * CHART_W
    const parts = lbl.split('\n')
    if (parts.length > 1) {
      ctx.fillText(parts[0], x, labelRowY - 10)
      ctx.fillText(parts[1], x, labelRowY - 1)
    } else {
      ctx.fillText(lbl, x, labelRowY - 6)
    }
  })
  // "Total Hours" header in black bar
  ctx.fillText('Total', GRID_X + CHART_W + TOTAL_W / 2, labelRowY - 10)
  ctx.fillText('Hours', GRID_X + CHART_W + TOTAL_W / 2, labelRowY - 1)

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — GRID
  // ══════════════════════════════════════════════════════════════
  const dayStart = new Date(log.date + 'T00:00:00')
  const dayEnd   = new Date(log.date + 'T24:00:00')

  // Outer border
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5
  ctx.strokeRect(GRID_X, GRID_TOP, CHART_W + TOTAL_W, GRID_H)

  // Row separators
  ctx.lineWidth = 1; ctx.strokeStyle = '#000'
  for (let r = 1; r < 4; r++) {
    const ry = GRID_TOP + r * ROW_H
    ctx.beginPath(); ctx.moveTo(GRID_X, ry); ctx.lineTo(GRID_X + CHART_W + TOTAL_W, ry); ctx.stroke()
  }

  // Total column divider
  ctx.beginPath()
  ctx.moveTo(GRID_X + CHART_W, GRID_TOP)
  ctx.lineTo(GRID_X + CHART_W, GRID_TOP + GRID_H)
  ctx.stroke()

  // Hour vertical lines
  for (let h = 0; h <= 24; h++) {
    const x = GRID_X + (h / 24) * CHART_W
    const isMajor = h === 0 || h === 6 || h === 12 || h === 18 || h === 24
    const isNoon  = h === 12
    ctx.lineWidth = isMajor ? 1 : 0.4
    ctx.strokeStyle = isMajor ? '#444' : '#CCC'
    ctx.beginPath(); ctx.moveTo(x, GRID_TOP); ctx.lineTo(x, GRID_TOP + GRID_H); ctx.stroke()

    // Quarter-hour ticks inside each row
    if (h < 24) {
      for (let q = 1; q < 4; q++) {
        const qx = GRID_X + ((h + q / 4) / 24) * CHART_W
        for (let r = 0; r < 4; r++) {
          const ry = GRID_TOP + r * ROW_H
          const tickH = q === 2 ? ROW_H * 0.45 : ROW_H * 0.25
          ctx.lineWidth = 0.3; ctx.strokeStyle = '#AAAAAA'
          ctx.beginPath(); ctx.moveTo(qx, ry); ctx.lineTo(qx, ry + tickH); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(qx, ry + ROW_H); ctx.lineTo(qx, ry + ROW_H - tickH); ctx.stroke()
        }
      }
    }
  }

  // Row labels (left side)
  ROW_ORDER.forEach((key, ri) => {
    const ry    = GRID_TOP + ri * ROW_H
    const midY  = ry + ROW_H / 2
    const lblLines = ROW_LABELS[key]

    ctx.font = 'bold 10px Arial, sans-serif'
    ctx.fillStyle = '#000'
    ctx.textAlign = 'right'
    if (lblLines.length === 1) {
      ctx.fillText(lblLines[0], GRID_X - 4, midY + 4)
    } else {
      ctx.fillText(lblLines[0], GRID_X - 4, midY - 2)
      ctx.font = '9px Arial, sans-serif'
      ctx.fillText(lblLines[1], GRID_X - 4, midY + 9)
    }
  })

  // ── Duty bars ─────────────────────────────────────────────────
  log.duty_periods.forEach((period: DutyPeriod) => {
    const key   = rowForStatus(period.status)
    const ri    = ROW_ORDER.indexOf(key)
    const ry    = GRID_TOP + ri * ROW_H

    const pStart = new Date(period.start_time)
    const pEnd   = new Date(period.end_time)
    const cs     = pStart < dayStart ? dayStart : pStart
    const ce     = pEnd   > dayEnd   ? dayEnd   : pEnd
    if (ce <= cs) return

    const sf  = (cs.getTime() - dayStart.getTime()) / 86400000
    const ef  = (ce.getTime() - dayStart.getTime()) / 86400000
    const bx  = GRID_X + sf * CHART_W
    const bw  = (ef - sf) * CHART_W
    const by  = ry + ROW_H * 0.18
    const bh  = ROW_H * 0.64

    // Filled bar
    ctx.globalAlpha = 0.22
    ctx.fillStyle = ROW_COLORS[key]
    ctx.fillRect(bx, by, Math.max(bw, 1.5), bh)
    ctx.globalAlpha = 1

    // Bold horizontal line through bar centre (FMCSA style)
    ctx.strokeStyle = ROW_COLORS[key]
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(bx, ry + ROW_H / 2)
    ctx.lineTo(bx + Math.max(bw, 1.5), ry + ROW_H / 2)
    ctx.stroke()

    // Vertical drop lines at start/end
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw, by + bh); ctx.stroke()
  })

  // ── Total hours per row ───────────────────────────────────────
  ROW_ORDER.forEach((key, ri) => {
    const ry = GRID_TOP + ri * ROW_H + ROW_H / 2
    const total = log.duty_periods
      .filter(p => rowForStatus(p.status) === key)
      .reduce((s, p) => s + p.duration_hours, 0)

    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.fillStyle = '#000'
    ctx.textAlign = 'center'
    ctx.fillText(total.toFixed(2), GRID_X + CHART_W + TOTAL_W / 2, ry + 4)
  })

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — REMARKS
  // ══════════════════════════════════════════════════════════════
  const REMARKS_Y = GRID_TOP + GRID_H + 18
  ctx.font = FONT_SERIF; ctx.fillStyle = '#000'; ctx.textAlign = 'left'
  ctx.fillText('Remarks', PAD, REMARKS_Y)

  // Vertical bar (left side like image)
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, REMARKS_Y + 6)
  ctx.lineTo(PAD, REMARKS_Y + 80)
  ctx.stroke()
  ctx.lineWidth = 1

  // Remark lines
  log.remarks.forEach((r, i) => {
    ctx.font = FONT_SM; ctx.fillStyle = '#222'
    ctx.fillText(r, PAD + 12, REMARKS_Y + 22 + i * 15)
  })

  // Horizontal line below remarks
  const remLineY = REMARKS_Y + 90
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, remLineY); ctx.lineTo(W - PAD, remLineY); ctx.stroke()

  // Shipping Documents label
  ctx.font = FONT_SM; ctx.fillStyle = '#000'
  ctx.fillText('Shipping Documents:', PAD, remLineY + 16)
  ctx.beginPath(); ctx.moveTo(PAD, remLineY + 28); ctx.lineTo(PAD + 140, remLineY + 28)
  ctx.strokeStyle = '#000'; ctx.stroke()

  ctx.fillText('DVL or Manifest No.', PAD, remLineY + 44)
  ctx.fillText('or', PAD, remLineY + 57)
  ctx.beginPath(); ctx.moveTo(PAD, remLineY + 60); ctx.lineTo(PAD + 140, remLineY + 60); ctx.stroke()

  ctx.fillText('Shipper & Commodity:', PAD, remLineY + 74)
  ctx.beginPath(); ctx.moveTo(PAD, remLineY + 78); ctx.lineTo(PAD + 200, remLineY + 78); ctx.stroke()

  // Instruction text
  ctx.font = FONT_XS; ctx.fillStyle = '#333'; ctx.textAlign = 'center'
  ctx.fillText(
    'Enter name of place you reported and where released from work and when and where each change of duty occurred.',
    W / 2, remLineY + 94
  )
  ctx.fillText('Use time standard of home terminal.', W / 2, remLineY + 107)

  // Double line separator
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(PAD, remLineY + 114); ctx.lineTo(W - PAD, remLineY + 114); ctx.stroke()
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, remLineY + 118); ctx.lineTo(W - PAD, remLineY + 118); ctx.stroke()

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — RECAP TABLE (matches image exactly)
  // ══════════════════════════════════════════════════════════════
  const RECAP_Y = remLineY + 130
  ctx.font = FONT_BOLD; ctx.fillStyle = '#000'; ctx.textAlign = 'left'
  ctx.fillText('Recap:', PAD, RECAP_Y)
  ctx.fillText('Complete at', PAD, RECAP_Y + 13)
  ctx.fillText('end of day', PAD, RECAP_Y + 26)

  // 70h/8-Day section
  const col70 = PAD + 100
  ctx.fillText('70 Hour/', col70, RECAP_Y)
  ctx.fillText('8 Day', col70, RECAP_Y + 13)
  ctx.fillText('Drivers', col70, RECAP_Y + 26)

  const totalOnDuty = log.total_drive_hours + log.total_on_duty_hours
  const cycle70A    = totalOnDuty
  const cycle70B    = Math.max(0, 70 - cycle70A)
  const cycle70C    = Math.max(0, cycle70A - 11)

  const colAW = 80
  const cols70 = ['A.', 'B.', 'C.']
  const desc70 = [
    ['A. Total', 'hours on', 'duty last 7', 'days including', 'today.'],
    ['B. Total', 'hours', 'available', 'tomorrow', '70 hr.', 'minus A*'],
    ['C. Total', 'hours on', 'duty last 5', 'days including', 'today.'],
  ]
  const vals70 = [cycle70A, cycle70B, cycle70C]

  const col60 = col70 + colAW * 3 + 20
  ctx.fillText('60 Hour/ 7', col60, RECAP_Y)
  ctx.fillText('Day Drivers', col60, RECAP_Y + 13)

  cols70.forEach((c, i) => {
    const cx = col70 + colAW + i * colAW
    ctx.font = FONT_BOLD; ctx.fillStyle = '#000'
    ctx.fillText(c, cx, RECAP_Y)
    ctx.font = FONT_XS; ctx.fillStyle = '#333'
    desc70[i].forEach((line, li) => ctx.fillText(line, cx, RECAP_Y + 13 + li * 11))
    ctx.font = 'bold 12px "Courier New", monospace'; ctx.fillStyle = '#000'
    ctx.fillText(vals70[i].toFixed(1) + 'h', cx, RECAP_Y + 78)
  })

  const cycle60A = Math.min(totalOnDuty, 60)
  const cycle60B = Math.max(0, 60 - cycle60A)
  const cycle60C = totalOnDuty
  const cols60desc = [
    ['A. Total', 'hours on', 'duty last 3', 'days including', 'today.'],
    ['B. Total', 'hours', 'available', 'tomorrow', '60 hr.', 'minus A*'],
    ['C. Total', 'hours on', 'duty last 7', 'days including', 'today.'],
  ]
  const vals60 = [cycle60A, cycle60B, cycle60C]
  cols70.forEach((c, i) => {
    const cx = col60 + colAW + i * colAW
    ctx.font = FONT_BOLD; ctx.fillStyle = '#000'
    ctx.fillText(c, cx, RECAP_Y)
    ctx.font = FONT_XS; ctx.fillStyle = '#333'
    cols60desc[i].forEach((line, li) => ctx.fillText(line, cx, RECAP_Y + 13 + li * 11))
    ctx.font = 'bold 12px "Courier New", monospace'; ctx.fillStyle = '#000'
    ctx.fillText(vals60[i].toFixed(1) + 'h', cx, RECAP_Y + 78)
  })

  // * footnote
  ctx.font = FONT_XS; ctx.fillStyle = '#000'
  const fnX = col60 + colAW * 3 + 10
  const fnLines = ['*if you took','34','consecutive','hours off','duty you','have 60/70','hours','available']
  fnLines.forEach((l, i) => ctx.fillText(l, fnX, RECAP_Y + i * 11))

  // On duty line at bottom
  ctx.font = FONT_XS; ctx.fillStyle = '#555'; ctx.textAlign = 'left'
  ctx.fillText('On duty hours today, Total lines 3 & 4', col70, RECAP_Y + 95)

  // Certification line
  ctx.font = FONT_XS; ctx.fillStyle = '#888'; ctx.textAlign = 'center'
  ctx.fillText(
    'I certify that these entries are true and correct.     Signature: ___________________________     Date: ____________',
    W / 2, H - 12
  )
}

export default function ELDLog({ result }: Props) {
  const [activeDay, setActiveDay] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const log = result.daily_logs[activeDay]

  useEffect(() => {
    if (!canvasRef.current || !log) return
    drawLog(canvasRef.current, log, result)
  }, [log, activeDay, result])

  const downloadPNG = () => {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.download = `ELD-log-day${activeDay + 1}-${log.date}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  const downloadPDF = () => {
    if (!canvasRef.current) return
    const img  = canvasRef.current.toDataURL('image/png')
    const win  = window.open('', '_blank')!
    const W    = canvasRef.current.width
    const H    = canvasRef.current.height
    const ratio = H / W
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ELD Log Day ${activeDay + 1}</title>
        <style>
          @page { size: letter landscape; margin: 0; }
          body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
          img  { width: 100%; max-width: 100%; display: block; }
        </style>
      </head>
      <body>
        <img src="${img}" />
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, background: '#F4F2EC' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1A1917', margin: '0 0 2px' }}>
              FMCSA Daily ELD Logs
            </h3>
            <p style={{ fontSize: 12, color: '#6B6760', margin: 0 }}>
              {result.daily_logs.length} day{result.daily_logs.length !== 1 ? 's' : ''} · Property-carrying driver · 70h/8-day cycle
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadPNG} style={btnStyle('#6B6760', '#fff')}>↓ PNG</button>
            <button onClick={downloadPDF} style={btnStyle('#C47F17', '#fff')}>⎙ Print / PDF</button>
          </div>
        </div>

        {/* Day tabs */}
        {result.daily_logs.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {result.daily_logs.map((dl, i) => (
              <button key={i} onClick={() => setActiveDay(i)} style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: `1.5px solid ${i === activeDay ? '#C47F17' : '#D2CFC6'}`,
                background: i === activeDay ? '#C47F17' : '#fff',
                color: i === activeDay ? '#fff' : '#6B6760',
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.06em',
              }}>
                Day {dl.day_number} — {dl.date}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
          {(Object.entries(ROW_COLORS) as [RowKey, string][]).map(([k, c]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 3, background: c, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#6B6760', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                {ROW_LABELS[k][0]}
              </span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #D2CFC6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <canvas ref={canvasRef} width={960} height={700} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Summary row */}
        {log && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Driving',       value: log.total_drive_hours,    color: ROW_COLORS.driving  },
              { label: 'On-Duty (ND)',  value: log.total_on_duty_hours,  color: ROW_COLORS.on_duty  },
              { label: 'Off-Duty',      value: log.total_off_duty_hours, color: ROW_COLORS.off_duty },
              { label: 'Sleeper Berth', value: log.total_sleeper_hours,  color: ROW_COLORS.sleeper  },
            ].map(item => (
              <div key={item.label} style={{ background: '#fff', border: '1px solid #D2CFC6', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700, color: item.color, lineHeight: 1 }}>
                  {item.value.toFixed(2)}h
                </div>
                <div style={{ fontSize: 11, color: '#6B6760', marginTop: 4, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Duty period breakdown */}
        {log && (
          <div style={{ marginTop: 16, paddingBottom: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6760', marginBottom: 8 }}>
              Duty Period Breakdown
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {log.duty_periods.map((p, i) => {
                const key   = rowForStatus(p.status)
                const color = ROW_COLORS[key]
                const start = new Date(p.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                const end   = new Date(p.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E6E3DB', borderRadius: 6, padding: '7px 12px', fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', color: '#1A1917', minWidth: 110 }}>{start} – {end}</span>
                    <span style={{ fontWeight: 700, color, minWidth: 40 }}>{p.duration_hours.toFixed(2)}h</span>
                    <span style={{ color: '#6B6760', flex: 1 }}>{p.label}</span>
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

function btnStyle(bg: string, fg: string): React.CSSProperties {
  return {
    padding: '8px 18px',
    background: bg,
    color: fg,
    border: 'none',
    borderRadius: 7,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
  }
}

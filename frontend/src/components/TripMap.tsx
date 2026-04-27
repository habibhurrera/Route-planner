'use client'

import { useEffect, useRef } from 'react'
import { TripResult, Stop } from '@/lib/api'

interface Props {
  result: TripResult
}

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

export default function TripMap({ result }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import Leaflet (client-only)
    import('leaflet').then(L => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { zoomControl: true })
      mapInstanceRef.current = map

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      const allPoints: L.LatLng[] = []

      // Draw route segments
      result.route_segments.forEach((seg, idx) => {
        if (!seg.geometry || seg.geometry.length < 2) return
        const latlngs = seg.geometry.map(([lng, lat]) => L.latLng(lat, lng))
        allPoints.push(...latlngs)

        L.polyline(latlngs, {
          color: idx === 0 ? '#F5A623' : '#00E5A0',
          weight: 4,
          opacity: 0.9,
        }).addTo(map)
      })

      // Draw current location marker
      const wp = result.waypoints
      const currentIcon = L.divIcon({
        html: `<div style="background:#00E5A0;width:14px;height:14px;border-radius:50%;border:2px solid #0A0A0F;box-shadow:0 0 8px #00E5A080;"></div>`,
        className: '',
        iconAnchor: [7, 7],
      })
      L.marker([wp.current.lat, wp.current.lng], { icon: currentIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#0A0A0F">Current Location</b><br>${wp.current.display_name || ''}`)

      // Draw stop markers
      result.stops.forEach((stop: Stop) => {
        const color = STOP_COLORS[stop.type] || '#888'
        const emoji = STOP_ICONS[stop.type] || '📍'
        const arr = new Date(stop.arrival_time)
        const dep = new Date(stop.departure_time)
        const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

        const icon = L.divIcon({
          html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:2px solid #0A0A0F;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${emoji}</div>`,
          className: '',
          iconAnchor: [16, 16],
        })

        L.marker([stop.location.lat, stop.location.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:monospace;color:#0A0A0F;min-width:180px;">
              <b style="color:${color};font-size:13px;">${stop.label}</b><br>
              <span style="color:#555;font-size:11px;">${stop.notes}</span><br><br>
              <span style="font-size:11px;">⏰ Arrive: ${fmt(arr)}</span><br>
              <span style="font-size:11px;">🚀 Depart: ${fmt(dep)}</span><br>
              <span style="font-size:11px;">⏱ Duration: ${stop.duration_hours}h</span>
            </div>
          `)

        allPoints.push(L.latLng(stop.location.lat, stop.location.lng))
      })

      // Fit map to all points
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] })
      }

      // Legend
      const legend = L.control({ position: 'bottomright' })
      legend.onAdd = () => {
        const div = L.DomUtil.create('div')
        div.style.cssText = 'background:#1C1C24;border:1px solid #2E2E3A;padding:10px;border-radius:8px;font-family:monospace;font-size:11px;color:#F5F3EE;'
        div.innerHTML = `
          <div style="color:#F5A623;font-weight:bold;margin-bottom:6px;letter-spacing:1px;">LEGEND</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div>🟢 Current Location</div>
            <div>📦 Pickup (+1h on-duty)</div>
            <div>🏁 Dropoff (+1h on-duty)</div>
            <div>⛽ Fuel Stop</div>
            <div>☕ 30-min Rest Break</div>
            <div>🛏 Sleeper Rest (10h)</div>
          </div>
        `
        return div
      }
      legend.addTo(map)
    })

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [result])

  return (
    <div className="h-full relative">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

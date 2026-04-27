'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { TripResult } from '@/lib/api'

// Fix for default Leaflet icons in Next.js
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
  className: 'custom-marker',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
})

const icons = {
  current: createIcon('#94a3b8'), // Slate
  pickup: createIcon('#10b981'),  // Signal Green
  dropoff: createIcon('#ef4444'), // Error Red
  fuel: createIcon('#f59e0b'),    // Amber
  rest: createIcon('#8b5cf6'),    // Violet
  sleeper: createIcon('#3b82f6'), // Blue
}

function MapUpdater({ result }: { result: TripResult }) {
  const map = useMap()
  
  useEffect(() => {
    if (result) {
      const bounds = L.latLngBounds([
        [result.waypoints.current.lat, result.waypoints.current.lng],
        [result.waypoints.pickup.lat, result.waypoints.pickup.lng],
        [result.waypoints.dropoff.lat, result.waypoints.dropoff.lng]
      ])
      
      // Include fuel and rest stops in bounds
      result.stops.forEach(stop => {
        bounds.extend([stop.location.lat, stop.location.lng])
      })
      
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [result, map])
  
  return null
}

export default function MapComponent({ result }: { result: TripResult }) {
  // ORS returns [lng, lat], Leaflet needs [lat, lng]
  const fullPolyline = result.route_segments.flatMap(seg => 
    seg.geometry.map(([lng, lat]) => [lat, lng] as [number, number])
  )

  return (
    <MapContainer 
      center={[result.waypoints.current.lat, result.waypoints.current.lng]} 
      zoom={6} 
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater result={result} />
      
      <Polyline 
        positions={fullPolyline} 
        pathOptions={{ color: '#F59E0B', weight: 4, opacity: 0.6, lineJoin: 'round' }} 
      />

      {/* Markers for all stops */}
      {result.stops.map((stop, idx) => {
        let icon = icons.rest
        if (stop.type === 'pickup') icon = icons.pickup
        if (stop.type === 'dropoff') icon = icons.dropoff
        if (stop.type === 'fuel') icon = icons.fuel
        if (stop.type === 'sleeper') icon = icons.sleeper

        return (
          <Marker 
            key={`${stop.type}-${idx}`} 
            position={[stop.location.lat, stop.location.lng]} 
            icon={icon}
          >
            <Popup className="custom-popup">
              <div className="font-sans min-w-[150px]">
                <div className="font-bold text-amber uppercase text-[10px] mb-1">{stop.label}</div>
                <div className="text-xs text-gray-800 mb-2 font-medium">{stop.notes}</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-gray-100 pt-2">
                  <div>
                    <span className="block text-gray-400 font-bold">ARRIVAL</span>
                    {new Date(stop.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <span className="block text-gray-400 font-bold">DEPARTURE</span>
                    {new Date(stop.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

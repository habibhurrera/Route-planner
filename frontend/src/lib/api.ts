import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export interface TripInput {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used: number  // hours already used in 70hr/8day cycle
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface Stop {
  type: 'pickup' | 'dropoff' | 'fuel' | 'rest_break' | 'sleeper'
  label: string
  location: Coordinates
  arrival_time: string    // ISO string
  departure_time: string  // ISO string
  duration_hours: number
  notes: string
  cumulative_drive_hours: number
  cumulative_on_duty_hours: number
}

export interface DutyPeriod {
  status: 'driving' | 'on_duty' | 'off_duty' | 'sleeper'
  start_time: string  // ISO string
  end_time: string    // ISO string
  duration_hours: number
  label: string
}

export interface DailyLog {
  date: string          // YYYY-MM-DD
  day_number: number
  duty_periods: DutyPeriod[]
  total_drive_hours: number
  total_on_duty_hours: number
  total_off_duty_hours: number
  total_sleeper_hours: number
  remarks: string[]
}

export interface RouteSegment {
  from: Coordinates
  to: Coordinates
  geometry: [number, number][]  // [lng, lat] pairs from ORS
  distance_miles: number
  duration_hours: number
}

export interface TripResult {
  success: boolean
  trip_summary: {
    total_distance_miles: number
    total_duration_hours: number
    total_driving_hours: number
    estimated_arrival: string
    num_days: number
    fuel_stops: number
    rest_stops: number
  }
  stops: Stop[]
  route_segments: RouteSegment[]
  daily_logs: DailyLog[]
  waypoints: {
    current: Coordinates
    pickup: Coordinates
    dropoff: Coordinates
  }
}

export async function calculateTrip(input: TripInput): Promise<TripResult> {
  const response = await apiClient.post<TripResult>('/api/calculate-trip/', input)
  return response.data
}

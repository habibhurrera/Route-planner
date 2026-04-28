# 🚛 HaulPath — ELD Trip Planner

> FMCSA-compliant route planning and ELD log generation for commercial truck drivers.  
> Built with **Next.js 14** (frontend) + **Django REST Framework** (backend) + **OpenRouteService** (maps).

---

## Live Demo

| Service  | URL |
|----------|-----|
| Frontend | https://route-planner-nu-lemon.vercel.app |
| Backend  | Deployed on Render (free tier — may take 30–60s to wake) |

---

## What It Does

1. Driver enters **origin**, **pickup**, and **dropoff** locations plus **cycle hours already used**
2. Backend geocodes all three locations via OpenRouteService
3. **HOS Engine** simulates the full trip, inserting:
   - Mandatory 30-min breaks (after 8h continuous driving)
   - Mandatory 10h sleeper rest (at 11h drive limit or 14h on-duty window)
   - Fuel stops (every 1,000 miles)
   - 1h on-duty for pickup loading, 1h for dropoff unloading
4. Frontend renders:
   - **Interactive Leaflet map** with route polylines and stop markers
   - **Stop Timeline** with arrival/departure times and durations
   - **FMCSA-standard ELD Daily Logs** (canvas-drawn, downloadable as PNG or PDF)

---

## HOS Rules Enforced

| Rule | Limit |
|------|-------|
| Max driving per shift | 11 hours |
| Max on-duty window | 14 hours |
| Mandatory rest | 10 hours off-duty |
| Break trigger | 30 min after 8h driving |
| Cycle cap | 70 hours / 8 days |
| Fuel stop interval | Every 1,000 miles |
| Pickup / Dropoff | 1 hour on-duty each |

---

## Project Structure

```
Route-planner/
├── frontend/                          # Next.js 14 app
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Main app shell — sidebar + results layout
│       │   ├── layout.tsx             # Root HTML layout
│       │   └── globals.css            # Off-white theme, Tailwind overrides
│       ├── components/
│       │   ├── TripForm.tsx           # Route input form with visual connector + HOS rules
│       │   ├── ResultsPanel.tsx       # Three-tab panel: Map / Timeline / ELD Logs
│       │   ├── TripMap.tsx            # Leaflet map — route polylines + emoji stop markers
│       │   ├── StopTimeline.tsx       # Vertical event timeline with arrival/departure times
│       │   ├── ELDLog.tsx             # ★ FMCSA canvas log — PNG & PDF export
│       │   ├── ELDLogComponent.tsx    # SVG-based ELD chart (lightweight alternative)
│       │   └── MapComponent.tsx       # react-leaflet wrapper (alternative map)
│       └── lib/
│           └── api.ts                 # Axios client, TypeScript types, wakeBackend()
│
├── backend/                           # Django REST API
│   ├── core/
│   │   ├── views.py                   # POST /api/calculate-trip/ endpoint
│   │   ├── hos_engine.py              # ★ Full HOS simulation engine
│   │   ├── ors_client.py              # Geocoding + routing via OpenRouteService
│   │   └── urls.py
│   ├── trip_planner/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── render.yaml                    # Render deployment config
│
└── README.md
```

---

## ELD Log (FMCSA Standard)

The `ELDLog.tsx` component renders a canvas-drawn log that matches the official FMCSA **Driver's Daily Log** format:

### What's on the log
- **Header** — Date, From/To locations, miles driven, carrier name
- **24-hour grid** — Midnight-to-midnight with quarter-hour tick marks
- **4 status rows** — Off Duty / Sleeper Berth / Driving / On Duty (Not Driving)
- **Duty bars** — Color-coded horizontal lines + filled bars for each period
- **Total Hours** column — Per-row hour totals
- **Remarks** section — Auto-generated from duty periods
- **Shipping Documents** fields — DVL/Manifest No., Shipper & Commodity
- **Recap table** — 70h/8-Day and 60h/7-Day cycle calculations (A/B/C columns)
- **Certification line** — Signature field at bottom

### Export
| Format | How |
|--------|-----|
| PNG    | Click **↓ PNG** — downloads `ELD-log-dayN-YYYY-MM-DD.png` |
| PDF    | Click **⎙ Print / PDF** — opens print dialog with letter landscape layout |

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- OpenRouteService API key (free at https://openrouteservice.org)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Runs at http://localhost:3000

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# set ORS_API_KEY=your_key_here
python manage.py runserver
```

Runs at http://localhost:8000

---

## API Reference

### `POST /api/calculate-trip/`

**Request body:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 12.5
}
```

**Response:**
```json
{
  "success": true,
  "trip_summary": {
    "total_distance_miles": 852.4,
    "total_duration_hours": 18.3,
    "total_driving_hours": 14.5,
    "estimated_arrival": "2026-04-28T14:30:00",
    "num_days": 2,
    "fuel_stops": 1,
    "rest_stops": 1
  },
  "stops": [ ... ],
  "route_segments": [ ... ],
  "daily_logs": [ ... ],
  "waypoints": {
    "current": { "lat": 41.85, "lng": -87.65 },
    "pickup":  { "lat": 38.63, "lng": -90.19 },
    "dropoff": { "lat": 32.78, "lng": -96.80 }
  }
}
```

### `GET /api/health/`

Returns `{"status": "ok"}` — used by frontend to wake the Render dyno on page load.

---

## Deployment

### Frontend (Vercel)
1. Push to `main` branch — Vercel auto-deploys
2. Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

### Backend (Render)
1. Connect GitHub repo in Render dashboard
2. Set env vars:
   - `ORS_API_KEY` — your OpenRouteService key
   - `SECRET_KEY` — Django secret key
   - `DEBUG=False`

> ⚠️ **Free tier cold start:** Render free dynos sleep after 15 min inactivity. The frontend automatically sends a wake ping on page load (`wakeBackend()`). The API timeout is set to **90 seconds** to accommodate cold starts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + inline styles |
| Map | Leaflet.js (dynamic import, SSR-disabled) |
| ELD Canvas | HTML5 Canvas API |
| HTTP client | Axios (90s timeout) |
| Backend framework | Django 4 + Django REST Framework |
| Routing API | OpenRouteService v2 (free tier) |
| Geocoding | OpenRouteService /geocode/search |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Key Design Decisions

**Why canvas for ELD logs?**  
The FMCSA grid requires pixel-precise rendering with quarter-hour tick marks, colored duty bars, and a recap table that doesn't fit cleanly into HTML/CSS. Canvas gives exact control and enables one-click PNG/PDF export.

**Why separate `wakeBackend()`?**  
Render free tier has ~50s cold start. Firing a health check immediately on page load means by the time the driver finishes filling the form, the server is already warm.

**Why inline styles in components?**  
The Tailwind classes used in original dark-theme files map to dark colors. Rather than fight the cascade, components use inline styles directly mapped to CSS vars (`--amber`, `--paper`, etc.) for reliable theming.

---

## License

MIT — free to use and modify.

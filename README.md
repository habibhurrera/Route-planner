# HaulPath — ELD Trip Planner

Automated HOS-compliant route planning and ELD log generation for commercial truck drivers.

## Stack
- **Frontend**: Next.js 14 + Tailwind CSS + Leaflet.js
- **Backend**: Django + DRF (stateless)
- **Map API**: OpenRouteService (free tier)

## Local Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in your ORS_API_KEY
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # fill in your ORS key
npm run dev
```

App runs at: http://localhost:3000  
API runs at: http://localhost:8000

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `ORS_API_KEY` | OpenRouteService API key |
| `DEBUG` | `True` for dev, `False` for prod |

### Frontend `.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Django backend URL |
| `NEXT_PUBLIC_ORS_API_KEY` | ORS key (for geocoding in frontend) |

## Get a Free ORS API Key
1. Go to https://openrouteservice.org/dev/#/signup
2. Register (free)
3. Copy your token from the dashboard

## HOS Rules Implemented
- 11-hour driving limit per shift
- 14-hour on-duty window
- 10-hour mandatory off-duty rest
- 30-minute break after 8 cumulative driving hours
- 70-hour / 8-day cycle cap
- Fuel stop every 1,000 miles
- 1-hour pickup + 1-hour dropoff

## Deployment
- Frontend: Vercel
- Backend: Render

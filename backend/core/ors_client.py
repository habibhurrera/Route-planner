import requests
from django.conf import settings

ORS_BASE = "https://api.openrouteservice.org"


def geocode(address: str) -> dict:
    url = f"{ORS_BASE}/geocode/search"
    params = {"api_key": settings.ORS_API_KEY, "text": address, "size": 1}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("features"):
        raise ValueError(f"Could not geocode address: {address}")
    feature = data["features"][0]
    lng, lat = feature["geometry"]["coordinates"]
    return {"lat": lat, "lng": lng, "display_name": feature["properties"].get("label", address)}


def get_route(origin: dict, destination: dict) -> dict:
    headers = {"Authorization": settings.ORS_API_KEY, "Content-Type": "application/json"}
    body = {"coordinates": [[origin["lng"], origin["lat"]], [destination["lng"], destination["lat"]]]}
    resp = requests.post(f"{ORS_BASE}/v2/directions/driving-car", json=body, headers=headers, timeout=15)
    if resp.status_code != 200:
        raise ValueError(f"ORS error {resp.status_code}: {resp.text[:200]}")
    data = resp.json()

    if "routes" in data:
        route = data["routes"][0]
        seg = route["segments"][0]
        geometry = [[origin["lng"], origin["lat"]], [destination["lng"], destination["lat"]]]
        if "geometry" in route:
            try:
                import polyline as pl
                decoded = pl.decode(route["geometry"])
                geometry = [[lng, lat] for lat, lng in decoded]
            except Exception:
                pass
        return {
            "distance_miles": seg["distance"] * 0.000621371,
            "duration_hours": seg["duration"] / 3600,
            "geometry": geometry,
        }

    if "features" in data and data["features"]:
        feature = data["features"][0]
        props = feature["properties"]["segments"][0]
        return {
            "distance_miles": props["distance"] * 0.000621371,
            "duration_hours": props["duration"] / 3600,
            "geometry": feature["geometry"]["coordinates"],
        }

    raise ValueError(f"Unrecognized ORS response: {str(data)[:300]}")


def get_full_route(current: dict, pickup: dict, dropoff: dict) -> dict:
    seg1 = get_route(current, pickup)
    seg2 = get_route(pickup, dropoff)
    return {
        "segment1": {"from": current, "to": pickup, **seg1},
        "segment2": {"from": pickup, "to": dropoff, **seg2},
        "total_distance_miles": seg1["distance_miles"] + seg2["distance_miles"],
        "total_driving_hours": seg1["duration_hours"] + seg2["duration_hours"],
    }
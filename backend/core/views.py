from datetime import datetime, timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .ors_client import geocode, get_full_route
from .hos_engine import build_trip_timeline


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'message': 'Trip Planner API is running'})


@api_view(['POST'])
def calculate_trip(request):
    """
    Main endpoint. Accepts trip inputs, returns full HOS-compliant
    route timeline and ELD daily logs.

    Request body:
    {
        "current_location": "Chicago, IL",
        "pickup_location": "St. Louis, MO",
        "dropoff_location": "Dallas, TX",
        "current_cycle_used": 12.5
    }
    """
    data = request.data

    # --- Validate inputs ---
    required = ["current_location", "pickup_location", "dropoff_location", "current_cycle_used"]
    missing = [f for f in required if f not in data or str(data[f]).strip() == ""]
    if missing:
        return Response(
            {"error": f"Missing required fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cycle_used = float(data["current_cycle_used"])
        if cycle_used < 0 or cycle_used > 70:
            return Response(
                {"error": "current_cycle_used must be between 0 and 70 hours"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"error": "current_cycle_used must be a number"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --- Geocode all three locations ---
    try:
        current_geo = geocode(data["current_location"])
        pickup_geo  = geocode(data["pickup_location"])
        dropoff_geo = geocode(data["dropoff_location"])
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": f"Geocoding failed: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # --- Get route from ORS ---
    try:
        route_data = get_full_route(current_geo, pickup_geo, dropoff_geo)
    except Exception as e:
        return Response(
            {"error": f"Route calculation failed: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # --- Run HOS engine ---
    trip_start = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC

    try:
        result = build_trip_timeline(route_data, cycle_used, trip_start)
    except Exception as e:
        return Response(
            {"error": f"HOS calculation failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Attach display names to waypoints
    result["waypoints"]["current"]["display_name"] = current_geo["display_name"]
    result["waypoints"]["pickup"]["display_name"]  = pickup_geo["display_name"]
    result["waypoints"]["dropoff"]["display_name"] = dropoff_geo["display_name"]

    return Response(result)

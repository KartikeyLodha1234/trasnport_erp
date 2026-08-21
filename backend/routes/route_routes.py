from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from database import db
import logging
from decimal import Decimal
# NOTE: this file is unchanged from the previous fix; see shipments.py fix below

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================
# CITY ROUTES
# ============================================================

@router.get("/cities")
@router.get("/cities/")
def get_cities():
    """Get all cities"""
    try:
        logger.info("GET /cities called")
        cities = db.get_all_cities()
        logger.info(f"Found {len(cities)} cities")
        return {"success": True, "data": cities}
    except Exception as e:
        logger.error(f"Error in get_cities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET ALL ROUTES
# ============================================================

@router.get("")
@router.get("/")
def get_routes():
    """Get all routes"""
    try:
        logger.info("GET /routes called")
        routes = db.get_all_routes()

        if routes is None:
            routes = []

        for item in routes:
            for key, value in item.items():
                if isinstance(value, Decimal):
                    item[key] = float(value)
                elif hasattr(value, "isoformat"):
                    item[key] = value.isoformat()

        logger.info(f"Found {len(routes)} routes")
        return {"success": True, "data": routes}
    except Exception as e:
        logger.error(f"Error fetching routes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET ACTIVE ROUTES  (must be declared BEFORE /{route_id})
# ============================================================

@router.get("/active")
def get_active_routes():
    """Get only active routes"""
    try:
        cursor = db.get_cursor()
        if not cursor:
            raise HTTPException(status_code=500, detail="Database connection failed")

        cursor.execute("""
            SELECT id, pickup_location, destination, via, stoppage, status,
                   price, distance_km, rate_per_kg, estimated_days
            FROM routes
            WHERE status = 'active'
            ORDER BY pickup_location
        """)
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        cursor.close()

        routes = []
        for row in rows:
            item = dict(zip(columns, row))
            for key, value in item.items():
                if isinstance(value, Decimal):
                    item[key] = float(value)
                elif hasattr(value, "isoformat"):
                    item[key] = value.isoformat()
            routes.append(item)

        return {"success": True, "data": routes}
    except Exception as e:
        logger.error(f"Error fetching active routes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET SINGLE ROUTE
# ============================================================

@router.get("/{route_id}")
def get_route(route_id: int):
    """Get single route by ID"""
    try:
        logger.info(f"Fetching route with ID: {route_id}")
        route = db.get_route_by_id(route_id)

        if not route:
            raise HTTPException(status_code=404, detail="Route not found")

        return {"success": True, "data": route}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching route: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# CREATE ROUTE
# ============================================================

@router.post("")
@router.post("/")
def create_route(data: Dict[str, Any]):
    """Create a new route"""
    try:
        logger.info(f"Creating route with data: {data}")

        if not data.get("pickup_location"):
            raise HTTPException(status_code=400, detail="pickup_location is required")
        if not data.get("destination"):
            raise HTTPException(status_code=400, detail="destination is required")
        if data.get("pickup_location") == data.get("destination"):
            raise HTTPException(status_code=400, detail="Pickup and destination cannot be the same")

        route_id = db.create_route(data)

        if not route_id:
            raise HTTPException(status_code=500, detail="Failed to create route")

        new_route = db.get_route_by_id(route_id)

        return {
            "success": True,
            "message": "Route created successfully",
            "id": route_id,
            "data": new_route
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# UPDATE ROUTE
# ============================================================

@router.put("/{route_id}")
@router.put("/{route_id}/")
def update_route(route_id: int, data: Dict[str, Any]):
    """Update an existing route"""
    try:
        logger.info(f"Updating route {route_id} with data: {data}")

        existing_route = db.get_route_by_id(route_id)
        if not existing_route:
            raise HTTPException(status_code=404, detail="Route not found")

        if not data.get("pickup_location"):
            raise HTTPException(status_code=400, detail="pickup_location is required")
        if not data.get("destination"):
            raise HTTPException(status_code=400, detail="destination is required")

        success = db.update_route(route_id, data)

        if not success:
            raise HTTPException(status_code=500, detail="Database update failed")

        updated_route = db.get_route_by_id(route_id)

        return {
            "success": True,
            "message": "Route updated successfully",
            "data": updated_route
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# DELETE ROUTE
# ============================================================

@router.delete("/{route_id}")
def delete_route(route_id: int):
    """Delete a route"""
    try:
        logger.info(f"Deleting route with ID: {route_id}")

        existing_route = db.get_route_by_id(route_id)
        if not existing_route:
            raise HTTPException(status_code=404, detail="Route not found")

        success = db.delete_route(route_id)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete route")

        return {"success": True, "message": "Route deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
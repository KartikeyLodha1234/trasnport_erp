# routes/route_routes.py
from fastapi import APIRouter, HTTPException
from database import db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
# ====================== CITY ROUTES ======================
# ✅ MOVE THESE TO THE TOP - OUTSIDE ANY OTHER FUNCTION

@router.get("/cities")
def get_cities():
    """Get all cities"""
    try:
        print("🔍 GET /api/routes/cities called")
        cities = db.get_all_cities()
        print(f"✅ Found {len(cities)} cities")
        return {"success": True, "data": cities}
    except Exception as e:
        print(f"❌ Error in get_cities: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities/")
def get_cities_with_slash():
    """Get all cities (with slash)"""
    return get_cities()

# ====================== ROUTE ROUTES ======================


@router.get("")
def get_routes_no_slash():
    return get_routes()

@router.get("/")
def get_routes():
    try:
        print("🔍 GET /api/routes/ called")
        
        cursor = db.get_cursor()
        if not cursor:
            print("❌ No cursor available")
            return {"success": False, "data": [], "message": "Database connection failed"}
        
        # ✅ Check if routes table exists using SQL Server syntax
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'routes'
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("❌ Routes table does not exist!")
            return {"success": False, "data": [], "message": "Routes table not found"}
        
        # ✅ Get column names using SQL Server syntax
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'routes'
        """)
        columns_info = [row[0] for row in cursor.fetchall()]
        print(f"📋 Table columns: {columns_info}")
        
        # ✅ Build query with existing columns only - INCLUDING price
        select_columns = ['id', 'pickup_location', 'destination']
        if 'via' in columns_info:
            select_columns.append('via')
        if 'stoppage' in columns_info:
            select_columns.append('stoppage')
        if 'status' in columns_info:
            select_columns.append('status')
        if 'created_at' in columns_info:
            select_columns.append('created_at')
        if 'distance_km' in columns_info:
            select_columns.append('distance_km')
        if 'rate_per_kg' in columns_info:
            select_columns.append('rate_per_kg')
        if 'price' in columns_info:  # ✅ price column included
            select_columns.append('price')
        if 'estimated_days' in columns_info:
            select_columns.append('estimated_days')
        
        query = f"""
            SELECT {', '.join(select_columns)}
            FROM routes 
            ORDER BY id DESC
        """
        print(f"📝 Query: {query}")
        
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        
        routes = []
        for row in rows:
            item = {}
            for i, col in enumerate(columns):
                value = row[i]
                # Convert any date/Decimal to proper types
                if hasattr(value, "isoformat"):
                    value = str(value)
                if hasattr(value, "__class__") and value.__class__.__name__ == "Decimal":
                    value = float(value)
                item[col] = value
            routes.append(item)
        
        cursor.close()
        print(f"✅ Found {len(routes)} routes")
        return {"success": True, "data": routes}
        
    except Exception as e:
        print(f"❌ Error fetching routes: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "data": [], "message": str(e)}

@router.get("/active")
def get_active_routes():
    try:
        cursor = db.get_cursor()
        if not cursor:
            return {"success": False, "data": [], "message": "Database connection failed"}
        
        cursor.execute("""
            SELECT id, pickup_location, destination, via, stoppage, status, price, distance_km, rate_per_kg, estimated_days
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
            for key, val in item.items():
                if hasattr(val, "isoformat"):
                    item[key] = str(val)
                if hasattr(val, "__class__") and val.__class__.__name__ == "Decimal":
                    item[key] = float(val)
            routes.append(item)
            
        return {"success": True, "data": routes}
    except Exception as e:
        print(f"❌ Error fetching active routes: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{route_id}")
def get_route(route_id: int):
    try:
        cursor = db.get_cursor()
        if not cursor:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor.execute("""
            SELECT id, pickup_location, destination, via, stoppage, status, price, distance_km, rate_per_kg, estimated_days, created_at
            FROM routes 
            WHERE id = ?
        """, (route_id,))
        columns = [col[0] for col in cursor.description]
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Route not found")
            
        route = dict(zip(columns, row))
        for key, val in route.items():
            if hasattr(val, "isoformat"):
                route[key] = str(val)
            if hasattr(val, "__class__") and val.__class__.__name__ == "Decimal":
                route[key] = float(val)
                
        return {"success": True, "data": route}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching route: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_route_no_slash(data: dict):
    return create_route(data)

@router.post("/")
def create_route(data: dict):
    try:
        print("=" * 50)
        print("🔍 ROUTE API: create_route called")
        print(f"  Data received: {data}")
        print("=" * 50)
        
        if not data.get("pickup_location"):
            raise HTTPException(status_code=400, detail="pickup_location is required")
        if not data.get("destination"):
            raise HTTPException(status_code=400, detail="destination is required")
        
        route_id = db.create_route(data)
        print(f"🔍 route_id from db: {route_id}")
        
        if route_id:
            new_route = db.get_route_by_id(route_id)
            print(f"✅ Route created: {new_route}")
            return {"success": True, "message": "Route created", "id": route_id, "data": new_route}
        raise HTTPException(status_code=500, detail="Failed to create route - database returned no ID")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ====================== UPDATE ROUTE - WITH BOTH SLASH VARIANTS ======================
@router.put("/{route_id}/")
def update_route_with_slash(route_id: int, data: dict):
    return update_route(route_id, data)

@router.put("/{route_id}")
def update_route(route_id: int, data: dict):
    try:
        print("=" * 50)
        print("🔍 ROUTE API: update_route called")
        print(f"  Route ID: {route_id}")
        print(f"  Data received: {data}")
        print("=" * 50)
        
        # Check if route exists
        existing_route = db.get_route_by_id(route_id)
        if not existing_route:
            raise HTTPException(status_code=404, detail="Route not found")
        
        # Update the route
        if db.update_route(route_id, data):
            updated = db.get_route_by_id(route_id)
            print(f"✅ Route updated: {updated}")
            return {"success": True, "message": "Route updated", "data": updated}
        raise HTTPException(status_code=400, detail="Failed to update route")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/{route_id}")
def delete_route(route_id: int):
    try:
        if not db.get_route_by_id(route_id):
            raise HTTPException(status_code=404, detail="Route not found")
        if db.delete_route(route_id):
            return {"success": True, "message": "Route deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete route")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting route: {e}")
        raise HTTPException(status_code=500, detail=str(e))@router.put("/{route_id}/")

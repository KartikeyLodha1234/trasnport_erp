from fastapi import APIRouter, HTTPException
from database import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("")
@router.get("/")
def get_cities():
    try:
        print("🔍 GET /api/cities/ called")
        cities = db.get_all_cities()
        print(f"✅ Found {len(cities)} cities")
        
        if cities is None:
            cities = []
            
        return {"success": True, "data": cities, "count": len(cities)}
    except Exception as e:
        print(f"❌ Error in get_cities: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "data": [], "count": 0, "error": str(e)}

@router.get("/{city_id}")
def get_city(city_id: int):
    try:
        city = db.get_city_by_id(city_id)
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        return {"success": True, "data": city}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
@router.post("/")
def create_city(data: dict):
    try:
        print(f"🔍 POST /api/cities/ called with data: {data}")
        
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        if not data.get("state"):
            raise HTTPException(status_code=400, detail="state is required")
        
        # Create city in database
        city_id = db.create_city(data)
        print(f"🔍 city_id from db: {city_id}")
        
        if city_id:
            # Fetch the created city
            new_city = db.get_city_by_id(city_id)
            print(f"🔍 new_city from db: {new_city}")
            
            # If new_city is None, create a fallback response
            if new_city is None:
                print("⚠️ Warning: new_city is None, creating fallback response")
                # Get the city data from the request
                return {
                    "success": True, 
                    "message": "City created", 
                    "id": city_id, 
                    "data": {
                        "id": city_id,
                        "name": data.get("name"),
                        "state": data.get("state"),
                        "pincode": data.get("pincode"),
                        "status": "active"
                    }
                }
            
            return {
                "success": True, 
                "message": "City created", 
                "id": city_id, 
                "data": new_city
            }
        else:
            print("❌ city_id is None or 0")
            raise HTTPException(status_code=500, detail="Failed to create city - database returned no ID")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in create_city route: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{city_id}")
def update_city(city_id: int, data: dict):
    try:
        if not db.get_city_by_id(city_id):
            raise HTTPException(status_code=404, detail="City not found")
        if db.update_city(city_id, data):
            updated = db.get_city_by_id(city_id)
            return {"success": True, "message": "City updated", "data": updated}
        raise HTTPException(status_code=400, detail="Failed to update city")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{city_id}")
def delete_city(city_id: int):
    try:
        if not db.get_city_by_id(city_id):
            raise HTTPException(status_code=404, detail="City not found")
        if db.delete_city(city_id):
            return {"success": True, "message": "City deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete city")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
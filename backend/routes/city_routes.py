from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_cities_no_slash():
    return get_cities()

@router.get("/")
def get_cities():
    try:        
        cities = db.get_all_cities()
        return {"success": True, "data": cities, "count": len(cities)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_city_no_slash(data: dict):
    return create_city(data)

@router.post("/")
def create_city(data: dict):
    try:
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        city_id = db.create_city(data)
        if city_id:
            return {"success": True, "message": "City created", "id": city_id, "data": db.get_city_by_id(city_id)}
        raise HTTPException(status_code=500, detail="Failed to create city")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{city_id}")
def update_city(city_id: int, data: dict):
    try:
        if not db.get_city_by_id(city_id):
            raise HTTPException(status_code=404, detail="City not found")
        if db.update_city(city_id, data):
            return {"success": True, "message": "City updated", "data": db.get_city_by_id(city_id)}
        raise HTTPException(status_code=400, detail="Failed to update city")
    except HTTPException:
        raise
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=str(e))
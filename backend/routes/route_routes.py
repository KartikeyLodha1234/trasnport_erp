from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_routes_no_slash():
    return get_routes()

@router.get("/")
def get_routes():
    try:
        cursor = db.get_cursor()
        cursor.execute("SELECT * FROM routes ORDER BY id")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_route_no_slash(data: dict):
    return create_route(data)

@router.post("/")
def create_route(data: dict):
    try:
        cursor = db.get_cursor()
        cursor.execute("""
            INSERT INTO routes (pickup_location, destination, via, stoppage, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data["pickup_location"],
            data["destination"],
            data.get("via"),
            data.get("stoppage"),
            data.get("status")
        ))
        db.connection.commit()
        cursor.close()
        return {"success": True, "message": "Route created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{route_id}")
def update_route(route_id: int, data: dict):
    try:
        cursor = db.get_cursor()
        cursor.execute("""
            UPDATE routes
            SET pickup_location=?, destination=?, via=?, stoppage=?, status=?
            WHERE id=?
        """, (
            data["pickup_location"],
            data["destination"],
            data.get("via"),
            data.get("stoppage"),
            data.get("status"),
            route_id
        ))
        db.connection.commit()
        cursor.close()
        return {"success": True, "message": "Route updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{route_id}")
def delete_route(route_id: int):
    try:
        cursor = db.get_cursor()
        cursor.execute("DELETE FROM routes WHERE id=?", (route_id,))
        db.connection.commit()
        cursor.close()
        return {"success": True, "message": "Route deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/")
def search_routes(q: str = ""):
    try:
        cursor = db.get_cursor()
        value = f"%{q}%"
        cursor.execute("""
            SELECT * FROM routes
            WHERE pickup_location LIKE ?
               OR destination LIKE ?
               OR via LIKE ?
               OR stoppage LIKE ?
        """, (value, value, value, value))
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_parties_no_slash():
    return get_parties()

@router.get("/")
def get_parties():
    try:
        parties = db.get_all_parties()
        return {"success": True, "data": parties, "count": len(parties)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{party_id}")
def get_party(party_id: int):
    try:
        party = db.get_party_by_id(party_id)
        if not party:
            raise HTTPException(status_code=404, detail="Party not found")
        return {"success": True, "data": party}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_party_no_slash(data: dict):
    return create_party(data)

@router.post("/")
def create_party(data: dict):
    try:
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        party_id = db.create_party(data)
        if party_id:
            return {"success": True, "message": "Party created", "id": party_id, "data": db.get_party_by_id(party_id)}
        raise HTTPException(status_code=500, detail="Failed to create party")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{party_id}")
def update_party(party_id: int, data: dict):
    try:
        if not db.get_party_by_id(party_id):
            raise HTTPException(status_code=404, detail="Party not found")
        if db.update_party(party_id, data):
            return {"success": True, "message": "Party updated", "data": db.get_party_by_id(party_id)}
        raise HTTPException(status_code=400, detail="Failed to update party")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{party_id}")
def delete_party(party_id: int):
    try:
        if not db.get_party_by_id(party_id):
            raise HTTPException(status_code=404, detail="Party not found")
        if db.delete_party(party_id):
            return {"success": True, "message": "Party deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete party")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

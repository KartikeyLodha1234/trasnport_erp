from fastapi import APIRouter, HTTPException
from database import db
import traceback

router = APIRouter()

@router.get("")
def get_parties_no_slash():
    return get_parties()

@router.get("/")
def get_parties():
    try:
        print("🔍 GET /api/parties/ called")
        parties = db.get_all_parties()
        print(f"✅ Found {len(parties)} parties")
        return {"success": True, "data": parties, "count": len(parties)}
    except Exception as e:
        print(f"❌ Error fetching parties: {e}")
        traceback.print_exc()  # ← Full error print karega
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
        print(f"❌ Error fetching party: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_party_no_slash(data: dict):
    return create_party(data)

@router.post("/")
def create_party(data: dict):
    try:
        print(f"🔍 Creating party with data: {data}")
        
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        
        party_id = db.create_party(data)
        print(f"🔍 party_id from db: {party_id}")
        
        if party_id:
            new_party = db.get_party_by_id(party_id)
            print(f"🔍 new_party from db: {new_party}")
            
            if new_party is None:
                new_party = {
                    "id": party_id,
                    "name": data.get("name"),
                    "type": data.get("type", "both"),
                    "email": data.get("email", ""),
                    "phone": data.get("phone", ""),
                    "address": data.get("address", ""),
                    "city": data.get("city", ""),
                    "state": data.get("state", ""),
                    "gstin": data.get("gstin", ""),
                    "status": data.get("status", "active")
                }
            return {"success": True, "message": "Party created", "id": party_id, "data": new_party}
        else:
            print("❌ party_id is None or 0")
            raise HTTPException(status_code=500, detail="Failed to create party - database returned no ID")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in create_party route: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{party_id}")
def update_party(party_id: int, data: dict):
    try:
        if not db.get_party_by_id(party_id):
            raise HTTPException(status_code=404, detail="Party not found")
        if db.update_party(party_id, data):
            updated = db.get_party_by_id(party_id)
            return {"success": True, "message": "Party updated", "data": updated}
        raise HTTPException(status_code=400, detail="Failed to update party")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating party: {e}")
        traceback.print_exc()
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
        print(f"❌ Error deleting party: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
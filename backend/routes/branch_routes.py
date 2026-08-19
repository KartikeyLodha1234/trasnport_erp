from fastapi import APIRouter, HTTPException
from database import db

router = APIRouter()

@router.get("")
def get_branches_no_slash():
    return get_branches()

@router.get("/")
def get_branches():
    try:
        print("🔍 GET /api/branches/ called")
        branches = db.get_all_branches()
        print(f"✅ Found {len(branches)} branches")
        return {"success": True, "data": branches, "count": len(branches)}
    except Exception as e:
        print(f"❌ Error fetching branches: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{branch_id}")
def get_branch(branch_id: int):
    try:
        branch = db.get_branch_by_id(branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        return {"success": True, "data": branch}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching branch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_branch_no_slash(data: dict):
    return create_branch(data)

@router.post("/")
def create_branch(data: dict):
    try:
        print(f"🔍 Creating branch with data: {data}")
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        branch_id = db.create_branch(data)
        print(f"🔍 branch_id: {branch_id}")
        if branch_id:
            new_branch = db.get_branch_by_id(branch_id)
            print(f"✅ Branch created: {new_branch}")
            return {"success": True, "message": "Branch created", "id": branch_id, "data": new_branch}
        raise HTTPException(status_code=500, detail="Failed to create branch")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating branch: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{branch_id}")
def update_branch(branch_id: int, data: dict):
    try:
        if not db.get_branch_by_id(branch_id):
            raise HTTPException(status_code=404, detail="Branch not found")
        if db.update_branch(branch_id, data):
            updated = db.get_branch_by_id(branch_id)
            return {"success": True, "message": "Branch updated", "data": updated}
        raise HTTPException(status_code=400, detail="Failed to update branch")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating branch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{branch_id}")
def delete_branch(branch_id: int):
    try:
        if not db.get_branch_by_id(branch_id):
            raise HTTPException(status_code=404, detail="Branch not found")
        if db.delete_branch(branch_id):
            return {"success": True, "message": "Branch deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete branch")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting branch: {e}")
        raise HTTPException(status_code=500, detail=str(e))
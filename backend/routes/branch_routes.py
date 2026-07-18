from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_branches_no_slash():
    return get_branches()

@router.get("/")
def get_branches():
    try:
        branches = db.get_all_branches()
        return {"success": True, "data": branches, "count": len(branches)}
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_branch_no_slash(data: dict):
    return create_branch(data)

@router.post("/")
def create_branch(data: dict):
    try:
        if not data.get("name"):
            raise HTTPException(status_code=400, detail="name is required")
        branch_id = db.create_branch(data)
        if branch_id:
            return {"success": True, "message": "Branch created", "id": branch_id, "data": db.get_branch_by_id(branch_id)}
        raise HTTPException(status_code=500, detail="Failed to create branch")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{branch_id}")
def update_branch(branch_id: int, data: dict):
    try:
        if not db.get_branch_by_id(branch_id):
            raise HTTPException(status_code=404, detail="Branch not found")
        if db.update_branch(branch_id, data):
            return {"success": True, "message": "Branch updated", "data": db.get_branch_by_id(branch_id)}
        raise HTTPException(status_code=400, detail="Failed to update branch")
    except HTTPException:
        raise
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=str(e))

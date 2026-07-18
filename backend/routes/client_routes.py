from fastapi import APIRouter, HTTPException
from database import Database
from typing import Optional, List
import re

router = APIRouter()
db = Database()

@router.get("")
def get_clients_no_slash(search: str = "", status: str = ""):
    return get_clients(search, status)

@router.get("/")
def get_clients(search: str = "", status: str = ""):
    try:
        if search:
            clients = db.search_clients(search)
        elif status and status != 'all':
            clients = db.filter_clients_by_status(status)
        else:
            clients = db.get_all_clients()
        # Normalize status to lowercase for frontend
        for client in clients:
            if client.get('status'):
                client['status'] = client['status'].lower()
        return clients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_client_stats():
    try:
        return db.get_client_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_client_no_slash(data: dict):
    return create_client(data)

@router.post("/")
def create_client(data: dict):
    try:
        if 'company_name' not in data or not data['company_name']:
            raise HTTPException(status_code=400, detail="Company name is required")
        if data.get('email'):
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
                raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Capitalize status for database
        status_map = {'active': 'Active', 'pending': 'Pending', 'inactive': 'Inactive'}
        data['status'] = status_map.get(data.get('status', 'active').lower(), 'Active')
        
        client_id = db.create_client(data)
        if client_id:
            client = db.get_client_by_id(client_id)
            if client:
                # Return status in lowercase for frontend
                if client.get('status'):
                    client['status'] = client['status'].lower()
                return client
        raise HTTPException(status_code=500, detail="Failed to create client")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{client_id}")
def get_client(client_id: int):
    try:
        client = db.get_client_by_id(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        if client.get('status'):
            client['status'] = client['status'].lower()
        return client
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{client_id}")
def update_client(client_id: int, data: dict):
    try:
        if not db.get_client_by_id(client_id):
            raise HTTPException(status_code=404, detail="Client not found")
        if 'status' in data:
            status_map = {'active': 'Active', 'pending': 'Pending', 'inactive': 'Inactive'}
            data['status'] = status_map.get(data['status'].lower(), 'Active')
        if db.update_client(client_id, data):
            client = db.get_client_by_id(client_id)
            if client and client.get('status'):
                client['status'] = client['status'].lower()
            return client
        raise HTTPException(status_code=500, detail="Failed to update client")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{client_id}")
def delete_client(client_id: int):
    try:
        if not db.get_client_by_id(client_id):
            raise HTTPException(status_code=404, detail="Client not found")
        if db.delete_client(client_id):
            return {"message": f"Client {client_id} deleted successfully"}
        raise HTTPException(status_code=500, detail="Failed to delete client")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk")
def bulk_create_clients(data: list):
    try:
        if not data or not isinstance(data, list):
            raise HTTPException(status_code=400, detail="Expected array of clients")
        created = []
        errors = []
        status_map = {'active': 'Active', 'pending': 'Pending', 'inactive': 'Inactive'}
        for client_data in data:
            try:
                if 'company_name' not in client_data:
                    errors.append({"error": "Company name required", "data": client_data})
                    continue
                if client_data.get('email'):
                    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', client_data['email']):
                        errors.append({"error": "Invalid email", "data": client_data})
                        continue
                client_data['status'] = status_map.get(client_data.get('status', 'active').lower(), 'Active')
                client_id = db.create_client(client_data)
                if client_id:
                    client = db.get_client_by_id(client_id)
                    if client and client.get('status'):
                        client['status'] = client['status'].lower()
                    created.append(client)
                else:
                    errors.append({"error": "Failed to create", "data": client_data})
            except Exception as e:
                errors.append({"error": str(e), "data": client_data})
        return {"success": created, "errors": errors, "total_created": len(created), "total_errors": len(errors)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
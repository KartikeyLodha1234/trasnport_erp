from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_maintenance_logs_no_slash():
    return get_maintenance_logs()

@router.get("/")
def get_maintenance_logs():
    try:
        logs = db.get_all_maintenance_logs()
        return {'success': True, 'data': logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_maintenance_log_no_slash(data: dict):
    return create_maintenance_log(data)

@router.post("/")
def create_maintenance_log(data: dict):
    try:
        required = ['vehicle_id', 'description', 'service_date']
        for field in required:
            if not data.get(field):
                raise HTTPException(status_code=400, detail=f'{field} is required')

        log_data = {
            'vehicle_id': data['vehicle_id'],
            'maintenance_type': data.get('maintenance_type'),
            'category': data.get('category'),
            'description': data['description'],
            'service_date': data['service_date'],
            'cost': data.get('cost', 0),
            'status': data.get('status', 'In Progress')
        }

        log_id = db.create_maintenance_log(log_data)
        return {'success': True, 'message': 'Maintenance log created', 'id': log_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{log_id}")
def update_maintenance_log(log_id: int, data: dict):
    try:
        if db.update_maintenance_log(log_id, data):
            return {'success': True, 'message': 'Maintenance log updated', 'data': db.get_maintenance_log_by_id(log_id)}
        raise HTTPException(status_code=400, detail="Failed to update")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{log_id}")
def delete_maintenance_log(log_id: int):
    try:
        if db.delete_maintenance_log(log_id):
            return {'success': True, 'message': 'Maintenance log deleted'}
        raise HTTPException(status_code=404, detail="Not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
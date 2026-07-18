from fastapi import APIRouter, HTTPException
from database import Database
from datetime import datetime

router = APIRouter()
db = Database()

@router.get("")
def get_logs_no_slash(limit: int = 50):
    return get_logs(limit)

@router.get("/")
def get_logs(limit: int = 50):
    try:
        logs = db.get_system_logs(limit)
        return {'success': True, 'data': logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_log_no_slash(data: dict):
    return create_log(data)

@router.post("/")
def create_log(data: dict):
    try:
        log_data = {
            'type': data.get('type'),
            'title': data.get('title'),
            'description': data.get('description'),
            'time': data.get('time') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        log_id = db.create_system_log(log_data)
        return {'success': True, 'message': 'Log created', 'id': log_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
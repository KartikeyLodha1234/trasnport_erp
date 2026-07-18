from fastapi import APIRouter, HTTPException
from database import Database

router = APIRouter()
db = Database()

@router.get("")
def get_vehicles_no_slash():
    return get_vehicles()

@router.get("/")
def get_vehicles():
    try:
        vehicles = db.get_all_vehicles()
        return {'success': True, 'data': vehicles, 'count': len(vehicles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int):
    try:
        vehicle = db.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return {'success': True, 'data': vehicle}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_vehicle_no_slash(data: dict):
    return create_vehicle(data)

@router.post("/")
def create_vehicle(data: dict):
    try:
        required = ['vehicleId', 'vehicleType', 'companyName', 'modelYear', 'licensePlate']
        for field in required:
            if not data.get(field):
                raise HTTPException(status_code=400, detail=f'{field} is required')

        vehicle_data = {
            'vehicle_id': data.get('vehicleId'),
            'type': data.get('vehicleType'),
            'company_name': data.get('companyName'),
            'year': data.get('modelYear'),
            'license_plate': data.get('licensePlate'),
            'puc_certificate_number': data.get('pucNumber'),
            'notes': data.get('notes', '')
        }

        vehicle_id = db.create_vehicle(vehicle_data)
        if vehicle_id:
            return {'success': True, 'message': 'Vehicle added', 'id': vehicle_id, 'data': db.get_vehicle_by_id(vehicle_id)}
        raise HTTPException(status_code=500, detail="Failed to add vehicle")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, data: dict):
    try:
        if not db.get_vehicle_by_id(vehicle_id):
            raise HTTPException(status_code=404, detail="Vehicle not found")

        vehicle_data = {}
        field_mapping = {
            'vehicleId': 'vehicle_id', 'vehicleType': 'type',
            'companyName': 'company_name', 'modelYear': 'year',
            'licensePlate': 'license_plate', 'pucNumber': 'puc_certificate_number',
            'notes': 'notes'
        }
        for front_field, db_field in field_mapping.items():
            if data.get(front_field) is not None:
                vehicle_data[db_field] = data.get(front_field)

        if db.update_vehicle(vehicle_id, vehicle_data):
            return {'success': True, 'message': 'Vehicle updated', 'data': db.get_vehicle_by_id(vehicle_id)}
        raise HTTPException(status_code=400, detail="Failed to update vehicle")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    try:
        if not db.get_vehicle_by_id(vehicle_id):
            raise HTTPException(status_code=404, detail="Vehicle not found")
        if db.delete_vehicle(vehicle_id):
            return {'success': True, 'message': 'Vehicle deleted'}
        raise HTTPException(status_code=400, detail="Failed to delete vehicle")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
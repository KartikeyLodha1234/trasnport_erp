from flask import request, jsonify
from routes import vehicle_bp
from database import Database

db = Database()

@vehicle_bp.route('/', methods=['GET'])
def get_vehicles():
    try:
        vehicles = db.get_all_vehicles()
        print(f"📥 Fetching vehicles: {len(vehicles)} found")
        return jsonify({'success': True, 'data': vehicles, 'count': len(vehicles)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    try:
        vehicle = db.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        return jsonify({'success': True, 'data': vehicle})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@vehicle_bp.route('/', methods=['POST'])
def create_vehicle():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        required = ['vehicleId', 'vehicleType', 'companyName', 'modelYear', 'licensePlate']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
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
            return jsonify({
                'success': True,
                'message': 'Vehicle added successfully',
                'id': vehicle_id,
                'data': db.get_vehicle_by_id(vehicle_id)
            }), 201
        return jsonify({'success': False, 'message': 'Failed to add vehicle'}), 500
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if not db.get_vehicle_by_id(vehicle_id):
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        
        vehicle_data = {}
        field_mapping = {
            'vehicleId': 'vehicle_id',
            'vehicleType': 'type',
            'companyName': 'company_name',
            'modelYear': 'year',
            'licensePlate': 'license_plate',
            'pucNumber': 'puc_certificate_number',
            'notes': 'notes'
        }
        
        for front_field, db_field in field_mapping.items():
            if data.get(front_field) is not None:
                vehicle_data[db_field] = data.get(front_field)
        
        if db.update_vehicle(vehicle_id, vehicle_data):
            return jsonify({
                'success': True,
                'message': 'Vehicle updated successfully',
                'data': db.get_vehicle_by_id(vehicle_id)
            })
        return jsonify({'success': False, 'message': 'Failed to update vehicle'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@vehicle_bp.route('/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    try:
        if not db.get_vehicle_by_id(vehicle_id):
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        
        if db.delete_vehicle(vehicle_id):
            return jsonify({'success': True, 'message': 'Vehicle deleted successfully'})
        return jsonify({'success': False, 'message': 'Failed to delete vehicle'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
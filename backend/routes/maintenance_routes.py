from flask import request, jsonify
from flask_jwt_extended import jwt_required
from routes import maintenance_bp
from database import Database

db = Database()

@maintenance_bp.route('/', methods=['GET'])
@jwt_required()
def get_maintenance_logs():
    try:
        logs = db.get_all_maintenance_logs()
        return jsonify({'success': True, 'data': logs})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@maintenance_bp.route('/', methods=['POST'])
@jwt_required()
def create_maintenance_log():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        required = ['vehicle_id', 'description', 'service_date']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
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
        return jsonify({
            'success': True,
            'message': 'Maintenance log created',
            'id': log_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@maintenance_bp.route('/<int:log_id>', methods=['PUT'])
@jwt_required()
def update_maintenance_log(log_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if db.update_maintenance_log(log_id, data):
            return jsonify({
                'success': True,
                'message': 'Maintenance log updated',
                'data': db.get_maintenance_log_by_id(log_id)
            })
        return jsonify({'success': False, 'message': 'Failed to update'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@maintenance_bp.route('/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_log(log_id):
    try:
        if db.delete_maintenance_log(log_id):
            return jsonify({'success': True, 'message': 'Maintenance log deleted'})
        return jsonify({'success': False, 'message': 'Not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
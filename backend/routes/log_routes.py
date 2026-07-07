from flask import request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from routes import log_bp
from database import Database

db = Database()

@log_bp.route('/', methods=['GET'])
@jwt_required()
def get_logs():
    try:
        limit = request.args.get('limit', 50, type=int)
        logs = db.get_system_logs(limit)
        return jsonify({'success': True, 'data': logs})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@log_bp.route('/', methods=['POST'])
@jwt_required()
def create_log():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        log_data = {
            'type': data.get('type'),
            'title': data.get('title'),
            'description': data.get('description'),
            'time': data.get('time') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        log_id = db.create_system_log(log_data)
        return jsonify({'success': True, 'message': 'Log created', 'id': log_id})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
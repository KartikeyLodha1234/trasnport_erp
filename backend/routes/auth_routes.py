from flask import request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta
import os
from routes import auth_bp  # ✅ Relative import
from database import Database

db = Database()
# ... rest of your code

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        print(f"🔐 Login attempt: {email}")
        
        # Admin check
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@cargomax.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
        
        if email == admin_email and password == admin_password:
            token = create_access_token(
                identity={'email': email, 'role': 'admin', 'name': 'Admin'},
                expires_delta=timedelta(hours=24)
            )
            return jsonify({
                'success': True,
                'message': 'Admin login successful',
                'token': token,
                'role': 'admin',
                'user': {'name': 'Admin', 'email': email, 'role': 'admin'}
            })
        
        # Driver check
        driver = db.authenticate_driver(email, password)
        if driver:
            token = create_access_token(
                identity={'id': driver['id'], 'email': driver['email'], 
                         'role': 'driver', 'name': driver['full_name']},
                expires_delta=timedelta(hours=24)
            )
            return jsonify({
                'success': True,
                'message': 'Driver login successful',
                'token': token,
                'role': 'driver',
                'user': {
                    'id': driver['id'],
                    'name': driver['full_name'],
                    'email': driver['email'],
                    'phone': driver['phone'],
                    'role': 'driver'
                }
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
from flask import request, jsonify
from routes import driver_bp  # ✅ Relative import
from database import Database

db = Database()
# ... rest of your code

@driver_bp.route('/', methods=['GET'])
def get_drivers():
    try:
        drivers = db.get_all_drivers()
        print(f"📥 Fetching drivers: {len(drivers)} found")
        return jsonify({'success': True, 'data': drivers, 'count': len(drivers)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>', methods=['GET'])
def get_driver(driver_id):
    try:
        driver = db.get_driver_by_id(driver_id)
        if not driver:
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        return jsonify({'success': True, 'data': driver})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/', methods=['POST'])
def create_driver():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        required = ['fullName', 'email', 'phone', 'password']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        if db.get_driver_by_email(data['email']):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        driver_data = {
            'full_name': data.get('fullName'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'password': data.get('password'),
            'dob': data.get('dob'),
            'experience': data.get('experience', 0),
            'license_number': data.get('licenseNumber'),
            'bank_name': data.get('bankName'),
            'account_number': data.get('accountNumber'),
            'ifsc_code': data.get('ifscCode'),
            'bank_branch': data.get('bankBranch'),
            'aadhar_card': data.get('aadharCard'),
            'pan_card': data.get('panCard'),
            'medical_report': data.get('medicalReport', 'Pending'),
            'police_verification': data.get('policeVerification', 'Pending'),
            'city': data.get('city'),
            'state': data.get('state'),
            'pincode': data.get('pincode')
        }
        
        driver_id = db.create_driver(driver_data)
        if driver_id:
            return jsonify({
                'success': True,
                'message': 'Driver registered successfully',
                'driverId': str(driver_id)
            }), 201
        return jsonify({'success': False, 'message': 'Failed to create driver'}), 500
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>', methods=['PUT'])
def update_driver(driver_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        driver_data = {}
        fields = ['full_name', 'email', 'phone', 'dob', 'experience', 'license_number',
                 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'aadhar_card',
                 'pan_card', 'medical_report', 'police_verification', 'city', 'state', 'pincode']
        
        for field in fields:
            if data.get(field) is not None:
                driver_data[field] = data.get(field)
        
        if db.update_driver(driver_id, driver_data):
            return jsonify({
                'success': True,
                'message': 'Driver updated successfully',
                'driver': db.get_driver_by_id(driver_id)
            })
        return jsonify({'success': False, 'message': 'Failed to update driver'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    try:
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        if db.delete_driver(driver_id):
            return jsonify({'success': True, 'message': 'Driver deleted successfully'})
        return jsonify({'success': False, 'message': 'Failed to delete driver'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
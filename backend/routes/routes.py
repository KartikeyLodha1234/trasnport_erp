from flask import request, jsonify, Blueprint
from database import Database
import os
from werkzeug.utils import secure_filename

driver_bp = Blueprint('driver', __name__)
db = Database()

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads/drivers'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, driver_id, file_type):
    """Save uploaded file and return file path"""
    if file and file.filename:
        filename = secure_filename(file.filename)
        unique_filename = f"{driver_id}_{file_type}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        return file_path
    return None

# ✅ CORS HEADERS - ADD THIS
@driver_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@driver_bp.route('/', methods=['OPTIONS'])
def handle_options():
    response = jsonify({'message': 'OK'})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@driver_bp.route('/', methods=['GET'])
def get_drivers():
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 50, type=int)
        search = request.args.get('search', None)
        
        drivers = db.get_all_drivers(page, page_size, search)
        print(f"📥 Fetching drivers: {len(drivers)} found")
        return jsonify({
            'success': True, 
            'data': drivers, 
            'count': len(drivers),
            'page': page,
            'page_size': page_size
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/', methods=['POST'])
def create_driver():
    try:
        # ✅ Yeh line important hai - multipart/form-data handle karega
        if request.files:
            # Get form data
            data = request.form
            
            # Get files
            license_file = request.files.get('licenseFile')
            police_file = request.files.get('policeFile')
            bank_file = request.files.get('bankFile')
            medical_file = request.files.get('medicalFile')
            aadhar_file = request.files.get('aadharFile')
            
            # Extract form fields
            full_name = data.get('fullName')
            email = data.get('email')
            phone = data.get('phone')
            password = data.get('password')
            dob = data.get('dob')
            experience = data.get('experience', 0)
            license_number = data.get('licenseNumber')
            bank_name = data.get('bankName')
            account_number = data.get('accountNumber')
            ifsc_code = data.get('ifscCode')
            bank_branch = data.get('bankBranch')
            aadhar_card = data.get('aadharCard')
            pan_card = data.get('panCard')
            medical_report = data.get('medicalReport', 'Pending')
            police_verification = data.get('policeVerification', 'Pending')
            
        else:
            # Fallback to JSON
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            full_name = data.get('fullName')
            email = data.get('email')
            phone = data.get('phone')
            password = data.get('password')
            dob = data.get('dob')
            experience = data.get('experience', 0)
            license_number = data.get('licenseNumber')
            bank_name = data.get('bankName')
            account_number = data.get('accountNumber')
            ifsc_code = data.get('ifscCode')
            bank_branch = data.get('bankBranch')
            aadhar_card = data.get('aadharCard')
            pan_card = data.get('panCard')
            medical_report = data.get('medicalReport', 'Pending')
            police_verification = data.get('policeVerification', 'Pending')
            license_file = None
            police_file = None
            bank_file = None
            medical_file = None
            aadhar_file = None
        
        # Validate required fields
        if not full_name:
            return jsonify({'success': False, 'message': 'Full Name is required'}), 400
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        if not phone:
            return jsonify({'success': False, 'message': 'Phone is required'}), 400
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'}), 400
        
        # Check if driver already exists
        if db.get_driver_by_email(email):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Create driver
        driver_data = {
            'full_name': full_name,
            'email': email,
            'phone': phone,
            'password': password,
            'dob': dob,
            'experience': experience,
            'license_number': license_number,
            'bank_name': bank_name,
            'account_number': account_number,
            'ifsc_code': ifsc_code,
            'bank_branch': bank_branch,
            'aadhar_card': aadhar_card,
            'pan_card': pan_card,
            'medical_report': medical_report,
            'police_verification': police_verification
        }
        
        driver_id = db.create_driver(driver_data)
        
        if not driver_id:
            return jsonify({'success': False, 'message': 'Failed to create driver'}), 500
        
        # Save files
        file_paths = {}
        if license_file and allowed_file(license_file.filename):
            file_paths['license_file_path'] = save_file(license_file, driver_id, 'license')
        if police_file and allowed_file(police_file.filename):
            file_paths['police_file_path'] = save_file(police_file, driver_id, 'police')
        if bank_file and allowed_file(bank_file.filename):
            file_paths['bank_file_path'] = save_file(bank_file, driver_id, 'bank')
        if medical_file and allowed_file(medical_file.filename):
            file_paths['medical_file_path'] = save_file(medical_file, driver_id, 'medical')
        if aadhar_file and allowed_file(aadhar_file.filename):
            file_paths['aadhar_file_path'] = save_file(aadhar_file, driver_id, 'aadhar')
        
        if file_paths:
            db.update_driver(driver_id, file_paths)
        
        return jsonify({
            'success': True,
            'message': 'Driver registered successfully',
            'driverId': driver_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>', methods=['PUT'])
def update_driver(driver_id):
    try:
        if request.files:
            data = request.form
            license_file = request.files.get('licenseFile')
            police_file = request.files.get('policeFile')
            bank_file = request.files.get('bankFile')
            medical_file = request.files.get('medicalFile')
            aadhar_file = request.files.get('aadharFile')
        else:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            license_file = None
            police_file = None
            bank_file = None
            medical_file = None
            aadhar_file = None
        
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        driver_data = {}
        
        # Map fields
        field_mapping = {
            'fullName': 'full_name',
            'email': 'email',
            'phone': 'phone',
            'dob': 'dob',
            'experience': 'experience',
            'licenseNumber': 'license_number',
            'bankName': 'bank_name',
            'accountNumber': 'account_number',
            'ifscCode': 'ifsc_code',
            'bankBranch': 'bank_branch',
            'aadharCard': 'aadhar_card',
            'panCard': 'pan_card',
            'medicalReport': 'medical_report',
            'policeVerification': 'police_verification'
        }
        
        for frontend_field, db_field in field_mapping.items():
            if data.get(frontend_field) is not None:
                driver_data[db_field] = data.get(frontend_field)
        
        # Save files
        if license_file and allowed_file(license_file.filename):
            driver_data['license_file_path'] = save_file(license_file, driver_id, 'license')
        if police_file and allowed_file(police_file.filename):
            driver_data['police_file_path'] = save_file(police_file, driver_id, 'police')
        if bank_file and allowed_file(bank_file.filename):
            driver_data['bank_file_path'] = save_file(bank_file, driver_id, 'bank')
        if medical_file and allowed_file(medical_file.filename):
            driver_data['medical_file_path'] = save_file(medical_file, driver_id, 'medical')
        if aadhar_file and allowed_file(aadhar_file.filename):
            driver_data['aadhar_file_path'] = save_file(aadhar_file, driver_id, 'aadhar')
        
        result = db.update_driver(driver_id, driver_data)
        if result:
            return jsonify({
                'success': True,
                'message': 'Driver updated successfully',
                'driver': result
            })
        return jsonify({'success': False, 'message': 'Failed to update driver'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        if db.delete_driver(driver_id, force):
            return jsonify({'success': True, 'message': 'Driver deleted successfully'})
        return jsonify({'success': False, 'message': 'Failed to delete driver'}), 400
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/<int:driver_id>/wallet', methods=['POST'])
def update_driver_wallet(driver_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        amount = data.get('amount')
        operation = data.get('operation', 'credit')
        
        if amount is None or amount <= 0:
            return jsonify({'success': False, 'message': 'Valid amount required'}), 400
        
        if operation not in ['credit', 'debit']:
            return jsonify({'success': False, 'message': 'Invalid operation'}), 400
        
        result = db.update_driver_wallet(driver_id, amount, operation)
        if not result:
            return jsonify({'success': False, 'message': 'Driver not found or insufficient balance'}), 404
        
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/stats', methods=['GET'])
def get_driver_stats():
    try:
        stats = db.get_driver_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@driver_bp.route('/search', methods=['GET'])
def search_drivers():
    try:
        search_term = request.args.get('q', '')
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 50, type=int)
        
        if not search_term:
            return jsonify({'success': False, 'message': 'Search term required'}), 400
        
        results = db.search_drivers(search_term, page, page_size)
        return jsonify({'success': True, 'data': results, 'count': len(results)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
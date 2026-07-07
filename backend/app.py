# ==========================================
# IMPORTS
# ==========================================
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
from dotenv import load_dotenv
import bcrypt
import json
from functools import wraps
import random
import mysql.connector
from mysql.connector import Error

# Load environment variables
load_dotenv()

# ==========================================
# DATABASE CLASS - MySQL Connection
# ==========================================
class Database:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'logistics_db'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                port=os.getenv('DB_PORT', 3306)
            )
            print("✅ Database connected successfully!")
        except Error as e:
            print(f"❌ Database connection error: {e}")
            self.connection = None
    
    def get_cursor(self):
        if not self.connection:
            self.connect()
        return self.connection.cursor(dictionary=True)
    
    # ==========================================
    # DRIVER CRUD OPERATIONS
    # ==========================================
    
    def get_all_drivers(self):
        try:
            cursor = self.get_cursor()
            cursor.execute("""
                SELECT id, full_name, email, phone, dob, experience, 
                       license_number, bank_name, account_number, 
                       ifsc_code, bank_branch, aadhar_card, pan_card,
                       medical_report, police_verification, created_at
                FROM drivers ORDER BY id ASC
            """)
            drivers = cursor.fetchall()
            cursor.close()
            
            # Convert datetime to string
            for driver in drivers:
                if driver.get('created_at'):
                    driver['created_at'] = str(driver['created_at'])
                if driver.get('dob'):
                    driver['dob'] = str(driver['dob'])
            
            return drivers
        except Error as e:
            print(f"❌ Error fetching drivers: {e}")
            return []
    
    def get_driver_by_id(self, driver_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM drivers WHERE id = %s", (driver_id,))
            driver = cursor.fetchone()
            cursor.close()
            if driver and driver.get('created_at'):
                driver['created_at'] = str(driver['created_at'])
            if driver and driver.get('dob'):
                driver['dob'] = str(driver['dob'])
            return driver
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def get_driver_by_email(self, email):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM drivers WHERE email = %s", (email,))
            driver = cursor.fetchone()
            cursor.close()
            return driver
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def create_driver(self, driver_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO drivers (
                    full_name, email, phone, password, dob, experience,
                    license_number, bank_name, account_number, ifsc_code,
                    bank_branch, aadhar_card, pan_card, medical_report,
                    police_verification
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            values = (
                driver_data.get('full_name'),
                driver_data.get('email'),
                driver_data.get('phone'),
                driver_data.get('password'),
                driver_data.get('dob'),
                driver_data.get('experience', 0),
                driver_data.get('license_number'),
                driver_data.get('bank_name'),
                driver_data.get('account_number'),
                driver_data.get('ifsc_code'),
                driver_data.get('bank_branch'),
                driver_data.get('aadhar_card'),
                driver_data.get('pan_card'),
                driver_data.get('medical_report', 'Pending'),
                driver_data.get('police_verification', 'Pending')
            )
            cursor.execute(query, values)
            self.connection.commit()
            driver_id = cursor.lastrowid
            cursor.close()
            return driver_id
        except Error as e:
            print(f"❌ Error creating driver: {e}")
            return None
    
    def update_driver(self, driver_id, driver_data):
        try:
            cursor = self.get_cursor()
            fields = []
            values = []
            
            allowed_fields = [
                'full_name', 'email', 'phone', 'dob', 'experience',
                'license_number', 'bank_name', 'account_number', 'ifsc_code',
                'bank_branch', 'aadhar_card', 'pan_card', 'medical_report',
                'police_verification'
            ]
            
            for field in allowed_fields:
                if field in driver_data and driver_data[field] is not None:
                    fields.append(f"{field} = %s")
                    values.append(driver_data[field])
            
            if not fields:
                return True
            
            values.append(driver_id)
            query = f"UPDATE drivers SET {', '.join(fields)} WHERE id = %s"
            cursor.execute(query, values)
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error updating driver: {e}")
            return False
    
    def delete_driver(self, driver_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("DELETE FROM drivers WHERE id = %s", (driver_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error deleting driver: {e}")
            return False
    
    def authenticate_driver(self, email, password):
        try:
            cursor = self.get_cursor()
            cursor.execute(
                "SELECT id, full_name, email, phone, password FROM drivers WHERE email = %s",
                (email,)
            )
            driver = cursor.fetchone()
            cursor.close()
            
            if driver and driver['password'] == password:
                return {
                    'id': driver['id'],
                    'full_name': driver['full_name'],
                    'email': driver['email'],
                    'phone': driver['phone']
                }
            return None
        except Error as e:
            print(f"❌ Authentication error: {e}")
            return None
    
    # ==========================================
    # SHIPMENT METHODS
    # ==========================================
    
    def get_all_shipments(self):
        try:
            cursor = self.get_cursor()
            cursor.execute("""
                SELECT s.*, d.full_name as driver_name, v.vehicle_id as vehicle_number
                FROM shipments s
                LEFT JOIN drivers d ON s.driver_id = d.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                ORDER BY s.id DESC
            """)
            shipments = cursor.fetchall()
            cursor.close()
            for shipment in shipments:
                if shipment.get('eta'):
                    shipment['eta'] = str(shipment['eta'])
                if shipment.get('created_at'):
                    shipment['created_at'] = str(shipment['created_at'])
                if shipment.get('updated_at'):
                    shipment['updated_at'] = str(shipment['updated_at'])
            return shipments
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def get_shipment_by_id(self, shipment_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM shipments WHERE id = %s", (shipment_id,))
            shipment = cursor.fetchone()
            cursor.close()
            return shipment
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def get_shipment_by_lr_number(self, lr_number):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM shipments WHERE tracking_id = %s", (lr_number,))
            shipment = cursor.fetchone()
            cursor.close()
            return shipment
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def create_shipment(self, shipment_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO shipments (
                    tracking_id, destination, client, weight, driver_id,
                    vehicle_id, eta, status, notes, challan_number,
                    pickup_location, delivery_location, freight_charge,
                    gst, payment_mode
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            values = (
                shipment_data.get('lr_number'),
                shipment_data.get('destination'),
                shipment_data.get('client'),
                shipment_data.get('weight'),
                shipment_data.get('driver_id'),
                shipment_data.get('vehicle_id'),
                shipment_data.get('eta'),
                shipment_data.get('status', 'Loading'),
                shipment_data.get('notes'),
                shipment_data.get('challan_number'),
                shipment_data.get('pickup_location'),
                shipment_data.get('delivery_location'),
                shipment_data.get('freight_charge', 0),
                shipment_data.get('gst', 0),
                shipment_data.get('payment_mode', 'cash')
            )
            cursor.execute(query, values)
            self.connection.commit()
            shipment_id = cursor.lastrowid
            cursor.close()
            return shipment_id
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def update_shipment(self, shipment_id, data):
        try:
            cursor = self.get_cursor()
            fields = []
            values = []
            allowed_fields = [
                'destination', 'client', 'weight', 'driver_id',
                'vehicle_id', 'eta', 'status', 'notes',
                'pickup_location', 'delivery_location', 'freight_charge',
                'gst', 'payment_mode'
            ]
            for field in allowed_fields:
                if field in data and data[field] is not None:
                    fields.append(f"{field} = %s")
                    values.append(data[field])
            if not fields:
                return True
            values.append(shipment_id)
            query = f"UPDATE shipments SET {', '.join(fields)} WHERE id = %s"
            cursor.execute(query, values)
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    def delete_shipment(self, shipment_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("DELETE FROM shipments WHERE id = %s", (shipment_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    def update_shipment_tracking_id(self, shipment_id, tracking_id):
        try:
            cursor = self.get_cursor()
            cursor.execute(
                "UPDATE shipments SET tracking_id = %s WHERE id = %s",
                (tracking_id, shipment_id)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    # ==========================================
    # VEHICLE METHODS
    # ==========================================
    
    def get_all_vehicles(self):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM vehicles ORDER BY id DESC")
            vehicles = cursor.fetchall()
            cursor.close()
            return vehicles
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def get_vehicle_by_id(self, vehicle_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM vehicles WHERE id = %s", (vehicle_id,))
            vehicle = cursor.fetchone()
            cursor.close()
            return vehicle
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def create_vehicle(self, vehicle_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO vehicles (
                    vehicle_id, type, company_name, year,
                    license_plate, puc_certificate_number, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                vehicle_data.get('vehicle_id'),
                vehicle_data.get('type'),
                vehicle_data.get('company_name'),
                vehicle_data.get('year'),
                vehicle_data.get('license_plate'),
                vehicle_data.get('puc_certificate_number'),
                vehicle_data.get('notes')
            )
            cursor.execute(query, values)
            self.connection.commit()
            vehicle_id = cursor.lastrowid
            cursor.close()
            return vehicle_id
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def update_vehicle(self, vehicle_id, vehicle_data):
        try:
            cursor = self.get_cursor()
            fields = []
            values = []
            allowed_fields = [
                'vehicle_id', 'type', 'company_name', 'year',
                'license_plate', 'puc_certificate_number', 'notes'
            ]
            for field in allowed_fields:
                if field in vehicle_data and vehicle_data[field] is not None:
                    fields.append(f"{field} = %s")
                    values.append(vehicle_data[field])
            if not fields:
                return True
            values.append(vehicle_id)
            query = f"UPDATE vehicles SET {', '.join(fields)} WHERE id = %s"
            cursor.execute(query, values)
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    def delete_vehicle(self, vehicle_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("DELETE FROM vehicles WHERE id = %s", (vehicle_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    # ==========================================
    # PAYMENT METHODS
    # ==========================================
    
    def get_all_payments(self):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM payments ORDER BY id DESC")
            payments = cursor.fetchall()
            cursor.close()
            return payments
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def get_driver_payments(self, driver_id):
        try:
            cursor = self.get_cursor()
            cursor.execute(
                "SELECT * FROM payments WHERE driver_id = %s ORDER BY id DESC",
                (driver_id,)
            )
            payments = cursor.fetchall()
            cursor.close()
            return payments
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def create_payment(self, payment_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO payments (
                    driver_id, shipment_id, amount, checkpoint,
                    upi_id, upi_ref, note, status, paid_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                payment_data.get('driver_id'),
                payment_data.get('shipment_id'),
                payment_data.get('amount'),
                payment_data.get('checkpoint'),
                payment_data.get('upi_id'),
                payment_data.get('upi_ref'),
                payment_data.get('note'),
                payment_data.get('status', 'pending'),
                payment_data.get('paid_by', 'admin')
            )
            cursor.execute(query, values)
            self.connection.commit()
            payment_id = cursor.lastrowid
            cursor.close()
            return payment_id
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def delete_payment(self, payment_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("DELETE FROM payments WHERE id = %s", (payment_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    # ==========================================
    # MAINTENANCE LOGS
    # ==========================================
    
    def get_all_maintenance_logs(self):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM maintenance_logs ORDER BY id DESC")
            logs = cursor.fetchall()
            cursor.close()
            return logs
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def get_maintenance_log_by_id(self, log_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM maintenance_logs WHERE id = %s", (log_id,))
            log = cursor.fetchone()
            cursor.close()
            return log
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def create_maintenance_log(self, log_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO maintenance_logs (
                    vehicle_id, maintenance_type, category,
                    description, service_date, cost, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                log_data.get('vehicle_id'),
                log_data.get('maintenance_type'),
                log_data.get('category'),
                log_data.get('description'),
                log_data.get('service_date'),
                log_data.get('cost', 0),
                log_data.get('status', 'In Progress')
            )
            cursor.execute(query, values)
            self.connection.commit()
            log_id = cursor.lastrowid
            cursor.close()
            return log_id
        except Error as e:
            print(f"❌ Error: {e}")
            return None
    
    def update_maintenance_log(self, log_id, log_data):
        try:
            cursor = self.get_cursor()
            fields = []
            values = []
            allowed_fields = [
                'maintenance_type', 'category', 'description',
                'service_date', 'cost', 'status'
            ]
            for field in allowed_fields:
                if field in log_data and log_data[field] is not None:
                    fields.append(f"{field} = %s")
                    values.append(log_data[field])
            if not fields:
                return True
            values.append(log_id)
            query = f"UPDATE maintenance_logs SET {', '.join(fields)} WHERE id = %s"
            cursor.execute(query, values)
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    def delete_maintenance_log(self, log_id):
        try:
            cursor = self.get_cursor()
            cursor.execute("DELETE FROM maintenance_logs WHERE id = %s", (log_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"❌ Error: {e}")
            return False
    
    # ==========================================
    # SYSTEM LOGS
    # ==========================================
    
    def get_system_logs(self, limit=50):
        try:
            cursor = self.get_cursor()
            cursor.execute("SELECT * FROM system_logs ORDER BY id DESC LIMIT %s", (limit,))
            logs = cursor.fetchall()
            cursor.close()
            return logs
        except Error as e:
            print(f"❌ Error: {e}")
            return []
    
    def create_system_log(self, log_data):
        try:
            cursor = self.get_cursor()
            query = """
                INSERT INTO system_logs (type, title, description, time)
                VALUES (%s, %s, %s, %s)
            """
            values = (
                log_data.get('type'),
                log_data.get('title'),
                log_data.get('description'),
                log_data.get('time')
            )
            cursor.execute(query, values)
            self.connection.commit()
            log_id = cursor.lastrowid
            cursor.close()
            return log_id
        except Error as e:
            print(f"❌ Error: {e}")
            return None

# ==========================================
# FLASK APP
# ==========================================

app = Flask(__name__)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'my-secret-key-123')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-456')
    JWT_ACCESS_TOKEN_EXPIRES = 86400

app.config.from_object(Config)

# CORS - सभी origins allow
CORS(app, 
     origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', '*'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-CSRF-TOKEN'])

jwt = JWTManager(app)

# Initialize Database
db = Database()

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def generate_tracking_id(id_num):
    prefix = 'TRK'
    year = datetime.now().year
    padded_id = str(id_num).zfill(4)
    return f"{prefix}-{year}-{padded_id}"

def generate_challan_number():
    prefix = 'CHL'
    date = datetime.now()
    year = date.year
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    random_num = str(random.randint(0, 9999)).zfill(4)
    return f"{prefix}-{year}{month}{day}-{random_num}"

def generate_lr_number():
    date = datetime.now()
    year = date.year
    month = str(date.month).zfill(2)
    day = str(date.day).zfill(2)
    random_num = str(random.randint(0, 9999)).zfill(4)
    return f"LR{year}{month}{day}{random_num}"

# ==========================================
# ✅ DRIVER ROUTES - FULL CRUD
# ==========================================

@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    """Get all drivers"""
    try:
        drivers = db.get_all_drivers()
        print(f"📥 Fetching drivers: {len(drivers)} found")
        return jsonify({
            'success': True,
            'data': drivers,
            'count': len(drivers)
        })
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/drivers/<int:driver_id>', methods=['GET'])
def get_driver(driver_id):
    """Get single driver"""
    try:
        driver = db.get_driver_by_id(driver_id)
        if not driver:
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        return jsonify({'success': True, 'data': driver})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/drivers', methods=['POST'])
def create_driver():
    """Create new driver - FormData support"""
    try:
        # Check if FormData or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            print("📥 FormData received")
        else:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        print(f"📝 Creating driver: {data.get('email')}")
        
        # Validate
        required = ['fullName', 'email', 'phone', 'password']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Phone validation
        phone = data.get('phone', '')
        if len(phone) != 10 or not phone.isdigit():
            return jsonify({'success': False, 'message': 'Phone must be 10 digits'}), 400
        
        # Check duplicate
        if db.get_driver_by_email(data['email']):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        driver_data = {
            'full_name': data.get('fullName'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'password': data.get('password'),  # Plain text as per DB
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
            'police_verification': data.get('policeVerification', 'Pending')
        }
        
        driver_id = db.create_driver(driver_data)
        if driver_id:
            return jsonify({
                'success': True,
                'message': 'Driver registered successfully',
                'driverId': str(driver_id)
            }), 201
        else:
            return jsonify({'success': False, 'message': 'Failed to create driver'}), 500
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/drivers/<int:driver_id>', methods=['PUT'])
def update_driver(driver_id):
    """Update driver"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        driver_data = {}
        fields = ['full_name', 'email', 'phone', 'dob', 'experience', 'license_number',
                 'bank_name', 'account_number', 'ifsc_code', 'bank_branch', 'aadhar_card',
                 'pan_card', 'medical_report', 'police_verification']
        for field in fields:
            if data.get(field) is not None:
                driver_data[field] = data.get(field)
        
        if db.update_driver(driver_id, driver_data):
            return jsonify({
                'success': True,
                'message': 'Driver updated successfully',
                'driver': db.get_driver_by_id(driver_id)
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to update driver'}), 400
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/drivers/<int:driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    """Delete driver"""
    try:
        if not db.get_driver_by_id(driver_id):
            return jsonify({'success': False, 'message': 'Driver not found'}), 404
        
        if db.delete_driver(driver_id):
            return jsonify({'success': True, 'message': 'Driver deleted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to delete driver'}), 400
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# AUTH ROUTES
# ==========================================

@app.route('/api/auth/login', methods=['POST'])
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

# ==========================================
# SHIPMENT ROUTES
# ==========================================

@app.route('/api/shipments', methods=['GET'])
@jwt_required()
def get_shipments():
    try:
        shipments = db.get_all_shipments()
        return jsonify({'success': True, 'data': shipments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/shipments', methods=['POST'])
@jwt_required()
def create_shipment():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        lr_number = data.get('lr_number') or generate_lr_number()
        challan_number = generate_challan_number()
        
        if db.get_shipment_by_lr_number(lr_number):
            return jsonify({'success': False, 'message': 'LR number already exists'}), 400
        
        shipment_data = {
            'lr_number': lr_number,
            'destination': data.get('destination'),
            'client': data.get('client'),
            'weight': data.get('weight', 0),
            'driver_id': data.get('driver_id'),
            'vehicle_id': data.get('vehicle_id'),
            'eta': data.get('eta'),
            'status': data.get('status', 'Loading'),
            'notes': data.get('notes', ''),
            'challan_number': challan_number,
            'pickup_location': data.get('pickup_location'),
            'delivery_location': data.get('delivery_location'),
            'freight_charge': data.get('freight_charge', 0),
            'gst': data.get('gst', 0),
            'payment_mode': data.get('payment_mode', 'cash')
        }
        
        shipment_id = db.create_shipment(shipment_data)
        tracking_id = generate_tracking_id(shipment_id)
        db.update_shipment_tracking_id(shipment_id, tracking_id)
        
        return jsonify({
            'success': True,
            'message': 'Shipment created successfully',
            'data': db.get_shipment_by_id(shipment_id)
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
# ==========================================
# VEHICLE ROUTES - FULL CRUD
# ==========================================

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles"""
    try:
        vehicles = db.get_all_vehicles()
        print(f"📥 Fetching vehicles: {len(vehicles)} found")
        return jsonify({
            'success': True,
            'data': vehicles,
            'count': len(vehicles)
        })
    except Exception as e:
        print(f"❌ Error fetching vehicles: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    """Get single vehicle by ID"""
    try:
        vehicle = db.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        return jsonify({'success': True, 'data': vehicle})
    except Exception as e:
        print(f"❌ Error fetching vehicle: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    """Create a new vehicle"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        # Validate required fields
        required = ['vehicleId', 'vehicleType', 'companyName', 'modelYear', 'licensePlate', 'pucNumber']
        for field in required:
            if not data.get(field):
                return jsonify({
                    'success': False, 
                    'message': f'{field} is required'
                }), 400
        
        # Prepare vehicle data
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
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to add vehicle'
            }), 500
            
    except Exception as e:
        print(f"❌ Error creating vehicle: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update a vehicle"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        # Check if vehicle exists
        existing = db.get_vehicle_by_id(vehicle_id)
        if not existing:
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        
        # Prepare update data - match frontend field names
        vehicle_data = {}
        
        # Map frontend field names to database field names
        field_mapping = {
            'vehicle_id': 'vehicle_id',
            'type': 'type',
            'company_name': 'company_name',
            'year': 'year',
            'license_plate': 'license_plate',
            'puc_number': 'puc_certificate_number',
            'notes': 'notes'
        }
        
        for frontend_field, db_field in field_mapping.items():
            if data.get(frontend_field) is not None:
                vehicle_data[db_field] = data.get(frontend_field)
        
        # Also check for alternative field names from frontend
        if data.get('vehicleId'):
            vehicle_data['vehicle_id'] = data.get('vehicleId')
        if data.get('vehicleType'):
            vehicle_data['type'] = data.get('vehicleType')
        if data.get('companyName'):
            vehicle_data['company_name'] = data.get('companyName')
        if data.get('modelYear'):
            vehicle_data['year'] = data.get('modelYear')
        if data.get('licensePlate'):
            vehicle_data['license_plate'] = data.get('licensePlate')
        if data.get('pucNumber'):
            vehicle_data['puc_certificate_number'] = data.get('pucNumber')
        
        success = db.update_vehicle(vehicle_id, vehicle_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Vehicle updated successfully',
                'data': db.get_vehicle_by_id(vehicle_id)
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to update vehicle'
            }), 400
            
    except Exception as e:
        print(f"❌ Error updating vehicle: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete a vehicle"""
    try:
        # Check if vehicle exists
        existing = db.get_vehicle_by_id(vehicle_id)
        if not existing:
            return jsonify({'success': False, 'message': 'Vehicle not found'}), 404
        
        success = db.delete_vehicle(vehicle_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Vehicle deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to delete vehicle'
            }), 400
            
    except Exception as e:
        print(f"❌ Error deleting vehicle: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
# ==========================================
# HOME ROUTE
# ==========================================

@app.route('/', methods=['GET'])
def home():
    return '''
    <h1>🚛 FleetChain Backend API</h1>
    <p>Server is running!</p>
    <h3>Available Endpoints:</h3>
    <ul>
        <li>GET /api/drivers - Get all drivers</li>
        <li>POST /api/drivers - Create driver</li>
        <li>GET /api/drivers/:id - Get single driver</li>
        <li>PUT /api/drivers/:id - Update driver</li>
        <li>DELETE /api/drivers/:id - Delete driver</li>
        <li>POST /api/auth/login - Login</li>
        <li>GET /api/shipments - Get shipments</li>
        <li>POST /api/shipments - Create shipment</li>
        <li>GET /api/vehicles - Get vehicles</li>
        <li>POST /api/vehicles - Create vehicle</li>
    </ul>
    <p>📡 API base: http://localhost:5000/api/</p>
    '''

# ==========================================
# ERROR HANDLERS
# ==========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ==========================================
# START SERVER
# ==========================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Flask Backend Server starting on http://localhost:{port}")
    print(f"📡 API endpoints available at http://localhost:{port}/api/")
    
    app.run(debug=True, host='0.0.0.0', port=port)
    from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from config import Config
from database import Database

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# CORS Configuration
CORS(app, 
     origins=Config.CORS_ORIGINS,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-CSRF-TOKEN'])

# JWT Setup
jwt = JWTManager(app)

# Initialize Database
db = Database()

# ==========================================
# Register Blueprints (Routes)
# ==========================================
from routes import (
    auth_bp, driver_bp, vehicle_bp, 
    shipment_bp, payment_bp, maintenance_bp, log_bp
)

app.register_blueprint(auth_bp)
app.register_blueprint(driver_bp)
app.register_blueprint(vehicle_bp)
app.register_blueprint(shipment_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(maintenance_bp)
app.register_blueprint(log_bp)

# ==========================================
# Home Route
# ==========================================
@app.route('/', methods=['GET'])
def home():
    return '''
    <h1>🚛 FleetChain Hybrid Web3 Backend (Flask)</h1>
    <p>Server is running perfectly!</p>
    <h3>Available Endpoints:</h3>
    <ul>
        <li>POST /api/auth/login - Login</li>
        <li>GET /api/drivers - Get all drivers</li>
        <li>POST /api/drivers - Create driver</li>
        <li>GET /api/drivers/:id - Get single driver</li>
        <li>PUT /api/drivers/:id - Update driver</li>
        <li>DELETE /api/drivers/:id - Delete driver</li>
        <li>GET /api/vehicles - Get all vehicles</li>
        <li>POST /api/vehicles - Create vehicle</li>
        <li>PUT /api/vehicles/:id - Update vehicle</li>
        <li>DELETE /api/vehicles/:id - Delete vehicle</li>
        <li>GET /api/shipments - Get all shipments</li>
        <li>POST /api/shipments - Create shipment</li>
        <li>GET /api/payments - Get all payments</li>
        <li>POST /api/payments - Create payment</li>
        <li>GET /api/maintenance - Get maintenance logs</li>
        <li>POST /api/maintenance - Create maintenance log</li>
        <li>GET /api/logs - Get system logs</li>
    </ul>
    <p>📡 API base URL: http://localhost:5000/api/</p>
    '''

# ==========================================
# Error Handlers
# ==========================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ==========================================
# Start Server
# ==========================================
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Flask Backend Server starting on http://localhost:{port}")
    print(f"📡 API endpoints available at http://localhost:{port}/api/")
    app.run(debug=True, host='0.0.0.0', port=port)
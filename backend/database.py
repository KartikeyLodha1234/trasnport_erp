import mysql.connector
from mysql.connector import Error
from config import Config
import bcrypt
from datetime import datetime

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
        self.initialize_tables()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                pool_name='mypool',
                pool_size=10,
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            print("✅ Database connection successful")
        except Error as e:
            print(f"❌ Error connecting to database: {e}")
            self.connection = None
    
    def get_connection(self):
        if not self.connection or not self.connection.is_connected():
            self.connect()
        return self.connection
    
    def get_cursor(self):
        """Get dictionary cursor for MySQL"""
        conn = self.get_connection()
        if conn:
            return conn.cursor(dictionary=True)
        return None
    
    def execute_query(self, query, params=None):
        conn = self.get_connection()
        cursor = None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            conn.commit()
            return cursor
        except Error as e:
            print(f"❌ Error executing query: {e}")
            if cursor:
                cursor.close()
            return None
    
    def fetch_all(self, query, params=None):
        cursor = self.execute_query(query, params)
        if cursor:
            results = cursor.fetchall()
            cursor.close()
            return results
        return []
    
    def fetch_one(self, query, params=None):
        cursor = self.execute_query(query, params)
        if cursor:
            result = cursor.fetchone()
            cursor.close()
            return result
        return None
    
    def insert(self, query, params=None):
        cursor = self.execute_query(query, params)
        if cursor:
            last_id = cursor.lastrowid
            cursor.close()
            return last_id
        return None
    
    def initialize_tables(self):
        """Create tables if they don't exist"""
        tables = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role ENUM('admin', 'driver', 'client') DEFAULT 'driver',
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS drivers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                dob DATE,
                experience INT DEFAULT 0,
                license_number VARCHAR(100),
                bank_name VARCHAR(255),
                account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                bank_branch VARCHAR(255),
                aadhar_card VARCHAR(20),
                pan_card VARCHAR(20),
                medical_report VARCHAR(50) DEFAULT 'Pending',
                police_verification VARCHAR(50) DEFAULT 'Pending',
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                license_file_path VARCHAR(500),
                police_file_path VARCHAR(500),
                bank_file_path VARCHAR(500),
                medical_file_path VARCHAR(500),
                aadhar_file_path VARCHAR(500),
                wallet_balance DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS vehicles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id VARCHAR(50) UNIQUE,
                type VARCHAR(100),
                company_name VARCHAR(255),
                year VARCHAR(10),
                license_plate VARCHAR(50) UNIQUE,
                puc_certificate_number VARCHAR(100),
                puc_expiry_date DATE,
                upload_puc_document_copy_file_path VARCHAR(500),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS shipments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lr_number VARCHAR(50) UNIQUE,
                tracking_id VARCHAR(50),
                challan_number VARCHAR(50),
                booking_date DATE,
                destination VARCHAR(255),
                client VARCHAR(255),
                weight DECIMAL(10,2),
                driver_id INT,
                vehicle_id INT,
                eta DATE,
                status ENUM('pending', 'in_transit', 'delivered', 'cancelled', 'loading') DEFAULT 'pending',
                notes TEXT,
                pickup_location VARCHAR(255),
                delivery_location VARCHAR(255),
                freight_charge DECIMAL(10,2),
                gst DECIMAL(5,2),
                payment_mode VARCHAR(50),
                goods_desc TEXT,
                packages INT,
                weight_type VARCHAR(20),
                invoice_no VARCHAR(100),
                invoice_value DECIMAL(10,2),
                eway_bill VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT NOT NULL,
                maintenance_type VARCHAR(100),
                category VARCHAR(100),
                description TEXT,
                service_date DATE,
                cost DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'In Progress',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                driver_id INT NOT NULL,
                shipment_id INT,
                amount DECIMAL(10,2) NOT NULL,
                checkpoint VARCHAR(255),
                upi_id VARCHAR(255),
                upi_ref VARCHAR(255),
                note TEXT,
                status ENUM('pending','completed','failed') DEFAULT 'pending',
                paid_by VARCHAR(255) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50),
                title VARCHAR(255),
                description TEXT,
                time VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        ]
        
        for table_sql in tables:
            try:
                self.execute_query(table_sql)
            except Error as e:
                print(f"❌ Error creating table: {e}")
    
    # ============ AUTH METHODS ============
    
    def authenticate_driver(self, email, password):
        driver = self.fetch_one(
            "SELECT id, full_name, email, phone, password FROM drivers WHERE email = %s",
            (email,)
        )
        if driver and driver.get('password') == password:
            del driver['password']
            return driver
        return None
    
    def get_driver_by_email(self, email):
        return self.fetch_one("SELECT * FROM drivers WHERE email = %s", (email,))
    
    def get_driver_by_id(self, driver_id):
        return self.fetch_one(
            "SELECT id, full_name, email, phone, dob, experience, license_number, "
            "bank_name, account_number, ifsc_code, bank_branch, aadhar_card, pan_card, "
            "medical_report, police_verification, city, state, pincode, "
            "wallet_balance, created_at FROM drivers WHERE id = %s",
            (driver_id,)
        )
    
    # ============ DRIVER METHODS ============
    
    def get_all_drivers(self):
        return self.fetch_all("""
            SELECT id, full_name, email, phone, experience, license_number,
                   bank_name, account_number, ifsc_code, bank_branch,
                   aadhar_card, pan_card, medical_report, police_verification,
                   DATE_FORMAT(dob, '%%Y-%%m-%%d') as dob, 
                   city, state, pincode, wallet_balance,
                   license_file_path, police_file_path, bank_file_path,
                   medical_file_path, aadhar_file_path
            FROM drivers ORDER BY id DESC
        """)
    
    def create_driver(self, data):
        query = """
            INSERT INTO drivers (
                full_name, email, phone, password, dob, experience,
                license_number, bank_name, account_number, ifsc_code,
                bank_branch, aadhar_card, pan_card, medical_report,
                police_verification, city, state, pincode
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get('full_name'), data.get('email'), data.get('phone'),
            data.get('password'), data.get('dob'), data.get('experience', 0),
            data.get('license_number'), data.get('bank_name'), data.get('account_number'),
            data.get('ifsc_code'), data.get('bank_branch'), data.get('aadhar_card'),
            data.get('pan_card'), data.get('medical_report', 'Pending'),
            data.get('police_verification', 'Pending'), data.get('city'),
            data.get('state'), data.get('pincode')
        )
        return self.insert(query, params)
    
    def update_driver(self, driver_id, data):
        fields = []
        values = []
        allowed_fields = [
            'full_name', 'email', 'phone', 'dob', 'experience',
            'license_number', 'bank_name', 'account_number', 'ifsc_code',
            'bank_branch', 'aadhar_card', 'pan_card', 'medical_report',
            'police_verification', 'city', 'state', 'pincode'
        ]
        for field in allowed_fields:
            if field in data and data[field] is not None:
                fields.append(f"{field} = %s")
                values.append(data[field])
        if not fields:
            return False
        query = f"UPDATE drivers SET {', '.join(fields)} WHERE id = %s"
        values.append(driver_id)
        cursor = self.execute_query(query, tuple(values))
        return cursor is not None
    
    def delete_driver(self, driver_id):
        cursor = self.execute_query("DELETE FROM drivers WHERE id = %s", (driver_id,))
        return cursor is not None
    
    # ============ VEHICLE METHODS ============
    
    def get_all_vehicles(self):
        cursor = self.execute_query("SELECT * FROM vehicles ORDER BY id DESC")
        if cursor:
            results = cursor.fetchall()
            cursor.close()
            return results
        return []
    
    def get_vehicle_by_id(self, vehicle_id):
        return self.fetch_one("SELECT * FROM vehicles WHERE id = %s", (vehicle_id,))
    
    def create_vehicle(self, data):
        query = """
            INSERT INTO vehicles (
                vehicle_id, type, company_name, year,
                license_plate, puc_certificate_number, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get('vehicle_id'), data.get('type'), data.get('company_name'),
            data.get('year'), data.get('license_plate'), data.get('puc_certificate_number'),
            data.get('notes')
        )
        return self.insert(query, params)
    
    def update_vehicle(self, vehicle_id, data):
        fields = []
        values = []
        allowed_fields = [
            'vehicle_id', 'type', 'company_name', 'year',
            'license_plate', 'puc_certificate_number', 'notes'
        ]
        for field in allowed_fields:
            if field in data and data[field] is not None:
                fields.append(f"{field} = %s")
                values.append(data[field])
        if not fields:
            return False
        query = f"UPDATE vehicles SET {', '.join(fields)} WHERE id = %s"
        values.append(vehicle_id)
        cursor = self.execute_query(query, tuple(values))
        return cursor is not None
    
    def delete_vehicle(self, vehicle_id):
        cursor = self.execute_query("DELETE FROM vehicles WHERE id = %s", (vehicle_id,))
        return cursor is not None
    
    # ============ SHIPMENT METHODS ============
    
    def get_all_shipments(self):
        return self.fetch_all("""
            SELECT s.*, d.full_name as driver_name, d.phone as driver_phone,
                   d.email as driver_email, v.vehicle_id as vehicle_code,
                   v.license_plate, v.type as vehicle_type
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            ORDER BY s.id DESC
        """)
    
    def get_shipment_by_id(self, shipment_id):
        return self.fetch_one("""
            SELECT s.*, d.full_name as driver_name, d.phone as driver_phone,
                   d.email as driver_email, v.vehicle_id as vehicle_code,
                   v.license_plate, v.type as vehicle_type
            FROM shipments s
            LEFT JOIN drivers d ON s.driver_id = d.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = %s
        """, (shipment_id,))
    
    def get_shipment_by_lr_number(self, lr_number):
        return self.fetch_one("SELECT id FROM shipments WHERE lr_number = %s", (lr_number,))
    
    def create_shipment(self, data):
        query = """
            INSERT INTO shipments (
                lr_number, booking_date, destination, client, weight,
                driver_id, vehicle_id, eta, status, notes, pickup_location,
                delivery_location, freight_charge, gst, payment_mode,
                goods_desc, packages, weight_type, invoice_no, invoice_value,
                eway_bill, challan_number
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get('lr_number'), data.get('booking_date'), data.get('destination'),
            data.get('client'), data.get('weight', 0), data.get('driver_id'),
            data.get('vehicle_id'), data.get('eta'), data.get('status', 'pending'),
            data.get('notes', ''), data.get('pickup_location'), data.get('delivery_location'),
            data.get('freight_charge', 0), data.get('gst', 0), data.get('payment_mode', 'cash'),
            data.get('goods_desc', ''), data.get('packages', 0), data.get('weight_type', 'kg'),
            data.get('invoice_no'), data.get('invoice_value', 0), data.get('eway_bill'),
            data.get('challan_number')
        )
        return self.insert(query, params)
    
    def update_shipment_tracking_id(self, shipment_id, tracking_id):
        cursor = self.execute_query(
            "UPDATE shipments SET tracking_id = %s WHERE id = %s",
            (tracking_id, shipment_id)
        )
        return cursor is not None
    
    def update_shipment(self, shipment_id, data):
        fields = []
        values = []
        field_map = {
            'destination': 'destination', 'client': 'client', 'weight': 'weight',
            'driver_id': 'driver_id', 'vehicle_id': 'vehicle_id', 'eta': 'eta',
            'status': 'status', 'notes': 'notes', 'pickup_location': 'pickup_location',
            'delivery_location': 'delivery_location', 'freight_charge': 'freight_charge',
            'gst': 'gst', 'payment_mode': 'payment_mode', 'goods_desc': 'goods_desc',
            'packages': 'packages', 'weight_type': 'weight_type', 'invoice_no': 'invoice_no',
            'invoice_value': 'invoice_value', 'eway_bill': 'eway_bill'
        }
        for key, db_field in field_map.items():
            if key in data and data[key] is not None:
                fields.append(f"{db_field} = %s")
                values.append(data[key])
        if not fields:
            return False
        query = f"UPDATE shipments SET {', '.join(fields)} WHERE id = %s"
        values.append(shipment_id)
        cursor = self.execute_query(query, tuple(values))
        return cursor is not None
    
    def delete_shipment(self, shipment_id):
        cursor = self.execute_query("DELETE FROM shipments WHERE id = %s", (shipment_id,))
        return cursor is not None
    
    # ============ PAYMENT METHODS ============
    
    def get_all_payments(self):
        return self.fetch_all("""
            SELECT p.*, d.full_name as driver_name, d.email as driver_email,
                   s.destination, s.tracking_id
            FROM payments p
            LEFT JOIN drivers d ON p.driver_id = d.id
            LEFT JOIN shipments s ON p.shipment_id = s.id
            ORDER BY p.created_at DESC
        """)
    
    def get_driver_payments(self, driver_id):
        return self.fetch_all("""
            SELECT p.*, s.destination, s.tracking_id
            FROM payments p
            LEFT JOIN shipments s ON p.shipment_id = s.id
            WHERE p.driver_id = %s
            ORDER BY p.created_at DESC
        """, (driver_id,))
    
    def create_payment(self, data):
        query = """
            INSERT INTO payments (driver_id, shipment_id, amount, checkpoint,
                                 upi_id, upi_ref, note, status, paid_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get('driver_id'), data.get('shipment_id'), data.get('amount'),
            data.get('checkpoint'), data.get('upi_id'), data.get('upi_ref'),
            data.get('note'), data.get('status', 'completed'), data.get('paid_by', 'admin')
        )
        return self.insert(query, params)
    
    def delete_payment(self, payment_id):
        cursor = self.execute_query("DELETE FROM payments WHERE id = %s", (payment_id,))
        return cursor is not None
    
    # ============ MAINTENANCE LOGS ============
    
    def get_all_maintenance_logs(self):
        return self.fetch_all("""
            SELECT ml.*, v.vehicle_id, v.license_plate, v.company_name, v.type as vehicle_type
            FROM maintenance_logs ml
            LEFT JOIN vehicles v ON ml.vehicle_id = v.id
            ORDER BY ml.created_at DESC
        """)
    
    def get_maintenance_log_by_id(self, log_id):
        return self.fetch_one("""
            SELECT ml.*, v.vehicle_id, v.license_plate, v.company_name
            FROM maintenance_logs ml
            LEFT JOIN vehicles v ON ml.vehicle_id = v.id
            WHERE ml.id = %s
        """, (log_id,))
    
    def create_maintenance_log(self, data):
        query = """
            INSERT INTO maintenance_logs (
                vehicle_id, maintenance_type, category, description,
                service_date, cost, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data.get('vehicle_id'), data.get('maintenance_type'), data.get('category'),
            data.get('description'), data.get('service_date'), data.get('cost', 0),
            data.get('status', 'In Progress')
        )
        return self.insert(query, params)
    
    def update_maintenance_log(self, log_id, data):
        fields = []
        values = []
        allowed_fields = ['maintenance_type', 'category', 'description', 'service_date', 'cost', 'status']
        for field in allowed_fields:
            if field in data and data[field] is not None:
                fields.append(f"{field} = %s")
                values.append(data[field])
        if not fields:
            return False
        query = f"UPDATE maintenance_logs SET {', '.join(fields)} WHERE id = %s"
        values.append(log_id)
        cursor = self.execute_query(query, tuple(values))
        return cursor is not None
    
    def delete_maintenance_log(self, log_id):
        cursor = self.execute_query("DELETE FROM maintenance_logs WHERE id = %s", (log_id,))
        return cursor is not None
    
    # ============ SYSTEM LOGS ============
    
    def get_system_logs(self, limit=50):
        return self.fetch_all(
            "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT %s",
            (limit,)
        )
    
    def create_system_log(self, data):
        query = "INSERT INTO system_logs (type, title, description, time) VALUES (%s, %s, %s, %s)"
        params = (
            data.get('type'), data.get('title'), data.get('description'), data.get('time')
        )
        return self.insert(query, params)
    
    def close(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ Database connection closed")
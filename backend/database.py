import pyodbc
import sqlite3
import os
import json
from decimal import Decimal
from config import Config
import time
from datetime import datetime

DB_PATH = 'transport.db'


class Database:

    def __init__(self):
        self.connection = None
        self.max_retries = 3

        self.connect()

        # Ensure required columns/tables
        self.ensure_challan_columns()
        self.ensure_vehicle_driver_column()
        self.ensure_routes_columns()
        self.ensure_shipment_columns()
        self.ensure_expenses_table()  # <-- NEW: Add this line

    def connect(self):
        """Establish database connection with retry logic"""
        for attempt in range(self.max_retries):
            try:
                conn_str = Config.get_connection_string()

                # ✅ Add these options to avoid connection issues
                self.connection = pyodbc.connect(
                    conn_str,
                    timeout=30,
                    autocommit=False,
                    # ✅ Ensure connection is not pooled
                    pool=False
                )

                print("✅ MSSQL Database connected successfully!")

                cursor = self.connection.cursor()

                cursor.execute("SELECT DB_NAME()")
                db_name = cursor.fetchone()[0]

                print(f"🔍 Database: {db_name}")

                self.ensure_all_columns(cursor)

                cursor.close()

                self.test_connection()

                return True

            except pyodbc.Error as e:
                print(
                    f"❌ Database connection attempt "
                    f"{attempt + 1} failed: {e}"
                )

                self.connection = None

                if attempt < self.max_retries - 1:
                    print("⏳ Retrying in 2 seconds...")
                    time.sleep(2)
                else:
                    print("❌ All connection attempts failed!")
                    return False

            except Exception as e:
                print(f"❌ Unexpected error: {e}")
                self.connection = None
                return False

        return False

    # ============================================================
    # NEW: ENSURE EXPENSES TABLE
    # ============================================================
    def ensure_expenses_table(self):
        """Ensure expenses table exists with all required columns"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available for expenses table check")
                return False

            # Check if expenses table exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'expenses'
            """)
            
            table_exists = cursor.fetchone()[0]
            
            if table_exists == 0:
                print("📦 Creating expenses table...")
                
                # Create expenses table
                cursor.execute("""
                    CREATE TABLE expenses (
                        expense_id INT IDENTITY(1,1) PRIMARY KEY,
                        challan_id INT NOT NULL,
                        category NVARCHAR(50) NOT NULL,
                        amount DECIMAL(12,2) NOT NULL,
                        expense_date DATE NOT NULL,
                        payment_method NVARCHAR(50) DEFAULT 'cash',
                        vendor NVARCHAR(255) NULL,
                        description NVARCHAR(MAX) NULL,
                        receipt_number NVARCHAR(100) NULL,
                        created_at DATETIME DEFAULT GETDATE()
                    )
                """)
                self.connection.commit()
                print("✅ Expenses table created")
                
                # Add foreign key constraint - use id column
                try:
                    cursor.execute("""
                        ALTER TABLE expenses
                        ADD CONSTRAINT fk_expenses_challan
                        FOREIGN KEY (challan_id) 
                        REFERENCES challans(id)
                        ON DELETE CASCADE
                    """)
                    self.connection.commit()
                    print("✅ Foreign key constraint added (referencing challans.id)")
                except Exception as e:
                    print(f"⚠️ Could not add foreign key: {e}")
                
                # Add indexes
                try:
                    cursor.execute("""
                        CREATE INDEX idx_expenses_challan_id 
                        ON expenses(challan_id)
                    """)
                    cursor.execute("""
                        CREATE INDEX idx_expenses_expense_date 
                        ON expenses(expense_date)
                    """)
                    cursor.execute("""
                        CREATE INDEX idx_expenses_category 
                        ON expenses(category)
                    """)
                    self.connection.commit()
                    print("✅ Indexes created on expenses table")
                except Exception as e:
                    print(f"⚠️ Could not create indexes: {e}")
                    
            else:
                print("✅ Expenses table already exists")
                self.ensure_expenses_columns(cursor)
            
            cursor.close()
            return True
            
        except Exception as e:
            print(f"❌ Error ensuring expenses table: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False
            
        except Exception as e:
            print(f"❌ Error ensuring expenses table: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False

    def ensure_expenses_columns(self, cursor):
        """Ensure all required columns exist in expenses table"""
        try:
            columns_to_check = {
                'payment_method': 'NVARCHAR(50) DEFAULT "cash"',
                'vendor': 'NVARCHAR(255) NULL',
                'description': 'NVARCHAR(MAX) NULL',
                'receipt_number': 'NVARCHAR(100) NULL',
                'created_at': 'DATETIME DEFAULT GETDATE()'
            }
            
            for col_name, col_type in columns_to_check.items():
                try:
                    cursor.execute(f"SELECT COL_LENGTH('expenses', '{col_name}')")
                    if cursor.fetchone()[0] is None:
                        cursor.execute(f"ALTER TABLE expenses ADD [{col_name}] {col_type}")
                        self.connection.commit()
                        print(f"✅ Added column {col_name} to expenses")
                except Exception as e:
                    print(f"⚠️ Could not add {col_name} to expenses: {e}")
                    
        except Exception as e:
            print(f"⚠️ Error ensuring expenses columns: {e}")

    def ensure_all_columns(self, cursor):
        """Ensure all required columns exist"""
        try:
            cursor.execute("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'drivers'
            """)
            if cursor.fetchone()[0] == 0:
                print("⚠️ drivers table not found, skipping column checks")
                return

            columns_to_check = {
                'drivers': [
                    ('route_id', 'INT NULL'),
                    ('status', "NVARCHAR(20) DEFAULT 'active'")
                ],
                'vehicles': [
                    ('vehicle_id', 'NVARCHAR(50)'),
                    ('type', 'NVARCHAR(50)'),
                    ('company_name', 'NVARCHAR(100)'),
                    ('year', 'INT'),
                    ('license_plate', 'NVARCHAR(50)'),
                    ('puc_certificate_number', 'NVARCHAR(100)'),
                    ('puc_expiry_date', 'DATE'),
                    ('upload_puc_document_copy_file_path', 'NVARCHAR(500)'),
                    ('notes', 'NVARCHAR(MAX)'),
                    ('status', "NVARCHAR(20) DEFAULT 'active'"),
                    ('driver_id', 'INT NULL')
                ],
                'clients': [
                    ('status', "NVARCHAR(20) DEFAULT 'active'")
                ]
            }

            for table, columns in columns_to_check.items():
                for col_name, col_type in columns:
                    try:
                        cursor.execute(f"SELECT COL_LENGTH('{table}', '{col_name}')")
                        result = cursor.fetchone()
                        if result is None or result[0] is None:
                            cursor.execute(f"ALTER TABLE {table} ADD [{col_name}] {col_type}")
                            self.connection.commit()
                            print(f"✅ Added {col_name} to {table}")
                    except Exception as e:
                        print(f"⚠️ Could not add {col_name} to {table}: {e}")

        except Exception as e:
            print(f"⚠️ Error in ensure_all_columns: {e}")

    def ensure_vehicle_driver_column(self):
        """Add driver_id column to vehicles table if it doesn't exist"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute("SELECT COL_LENGTH('vehicles', 'driver_id')")
            result = cursor.fetchone()
            if result is None or result[0] is None:
                cursor.execute("ALTER TABLE vehicles ADD driver_id INT NULL")
                self.connection.commit()
                print("✅ Added driver_id column to vehicles table")
            else:
                print("✅ driver_id column already exists in vehicles table")

            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error adding driver_id column: {e}")
            return False

    def ensure_routes_columns(self):
        """
        Ensure the routes table has every column the /shipments/routes
        endpoint (get_routes) and the freight-calculation logic depend on.
        """
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'routes'
            """)
            if cursor.fetchone()[0] == 0:
                print("⚠️ routes table not found, skipping column checks")
                cursor.close()
                return False

            columns_to_add = {
                'rate_per_kg': 'DECIMAL(18,2) DEFAULT 0',
                'rate_per_ton': 'DECIMAL(18,2) DEFAULT 0',
                'minimum_charge': 'DECIMAL(18,2) DEFAULT 0',
                'price': 'DECIMAL(18,2) DEFAULT 0',
                'distance_km': 'DECIMAL(18,2) DEFAULT 0',
                'estimated_days': 'INT DEFAULT 1',
                'via': 'NVARCHAR(255) NULL',
                'stoppage': 'NVARCHAR(255) NULL',
                'status': "NVARCHAR(20) DEFAULT 'active'",
            }

            for col_name, col_type in columns_to_add.items():
                try:
                    cursor.execute(f"SELECT COL_LENGTH('routes', '{col_name}')")
                    result = cursor.fetchone()
                    if result is None or result[0] is None:
                        cursor.execute(
                            f"ALTER TABLE routes ADD [{col_name}] {col_type}"
                        )
                        self.connection.commit()
                        print(f"✅ Added {col_name} to routes")
                except Exception as e:
                    print(f"⚠️ Could not add {col_name} to routes: {e}")

            cursor.close()
            return True

        except Exception as e:
            print(f"❌ Error ensuring routes columns: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def test_connection(self):
        """Test database connection"""
        try:
            cursor = self.get_cursor()
            if cursor:
                cursor.execute("SELECT COUNT(*) as count FROM drivers")
                count = cursor.fetchone()[0]
                print(f"   ✅ Total drivers: {count}")
                cursor.close()
        except Exception as e:
            print(f"⚠️ Test error: {e}")

    def get_cursor(self):
        """Get database cursor with connection check"""
        if self.connection is None:
            print("⚠️ No database connection, attempting to reconnect...")
            if not self.connect():
                return None

        try:
            cursor = self.connection.cursor()
            return cursor
        except Exception as e:
            print(f"❌ Error getting cursor: {e}")
            self.connection = None
            return None

    def serialize(self, data):
        """Serialize data for JSON response"""
        if isinstance(data, list):
            return [self.serialize(item) for item in data]
        if isinstance(data, dict):
            serialized = {}
            for key, value in data.items():
                if isinstance(value, Decimal):
                    serialized[key] = str(value)
                elif hasattr(value, "isoformat"):
                    serialized[key] = value.isoformat()
                else:
                    serialized[key] = value
            return serialized
        if isinstance(data, Decimal):
            return str(data)
        if hasattr(data, "isoformat"):
            return data.isoformat()
        return data

    # ==========================================
    # AUTHENTICATION
    # ==========================================

    def authenticate_driver(self, email, password):
        """Authenticate user"""
        try:
            if email == Config.ADMIN_EMAIL and password == Config.ADMIN_PASSWORD:
                return {
                    "id": 0,
                    "full_name": "Admin",
                    "email": Config.ADMIN_EMAIL,
                    "phone": "",
                    "role": "admin"
                }

            cursor = self.get_cursor()
            if not cursor:
                return None

            cursor.execute(
                "SELECT id, full_name, email, phone FROM drivers WHERE email = ? AND password = ?",
                (email, password)
            )
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return None

            return {
                "id": row[0],
                "full_name": row[1],
                "email": row[2],
                "phone": row[3],
                "role": "driver"
            }

        except Exception as e:
            print(f"❌ Auth error: {e}")
            return None

    # ==========================================
    # DRIVER METHODS
    # ==========================================

    def get_all_drivers(self, page=1, page_size=50, search=None):
        """Get all drivers"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []

            # ✅ route_id included so the frontend can auto-fill a driver's
            # route when creating a challan (see AllShipments.jsx driver
            # select handler).
            query = """
                SELECT id, full_name, email, phone, license_number,
                       status, wallet_balance, route_id, created_at
                FROM drivers
                ORDER BY id ASC
            """
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching drivers: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_driver_by_id(self, driver_id):
        """Get single driver by ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                SELECT id, full_name, email, phone, license_number,
                       status, wallet_balance, route_id, created_at
                FROM drivers
                WHERE id = ?
                """,
                (driver_id,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def get_driver_by_email(self, email):
        """Find a driver by email (for duplicate check)"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                "SELECT id, full_name, email FROM drivers WHERE email = ?",
                (email,)
            )
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return {
                "id": row[0],
                "full_name": row[1],
                "email": row[2]
            }
        except Exception as e:
            print(f"❌ Error fetching driver by email: {e}")
            return None

    def get_driver_by_phone(self, phone):
        """Find a driver by phone number"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                "SELECT id, full_name, phone FROM drivers WHERE phone = ?",
                (phone,)
            )
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return {
                "id": row[0],
                "full_name": row[1],
                "phone": row[2]
            }
        except Exception as e:
            print(f"❌ Error fetching driver by phone: {e}")
            return None

    def create_driver(self, data):
        """Create new driver"""
        try:
            print("=" * 50)
            print("🔍 DATABASE: create_driver called")
            print(f"  Data received: {data}")

            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return None

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'drivers'")
            if cursor.fetchone()[0] == 0:
                print("❌ drivers table does not exist!")
                return None

            cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'drivers'")
            columns = [row[0] for row in cursor.fetchall()]
            print(f"🔍 Available columns: {columns}")

            insert_fields = ["full_name", "email", "phone", "password", "status"]
            values = [
                data.get("full_name"),
                data.get("email"),
                data.get("phone"),
                data.get("password", "default123"),
                data.get("status", "active")
            ]

            optional_fields = [
                "dob", "experience", "license_number", "bank_name",
                "account_number", "ifsc_code", "bank_branch", "aadhar_card",
                "pan_card", "medical_report", "police_verification",
                "emergency_contact", "address_proof", "route_id", "wallet_balance"
            ]

            for field in optional_fields:
                if field in columns:
                    value = data.get(field)
                    if value is not None and value != "":
                        insert_fields.append(field)
                        values.append(value)

            placeholders = ", ".join(["?"] * len(insert_fields))
            field_names = ", ".join(insert_fields)

            query = f"""
                INSERT INTO drivers ({field_names})
                OUTPUT INSERTED.id
                VALUES ({placeholders})
            """

            print(f"🔍 Query: {query}")
            print(f"🔍 Values: {values}")

            cursor.execute(query, values)
            row = cursor.fetchone()
            driver_id = row[0] if row else None
            print(f"🔍 Driver ID created: {driver_id}")

            self.connection.commit()
            cursor.close()
            return driver_id

        except Exception as e:
            print(f"❌ Error creating driver: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return None

    def update_driver(self, driver_id, data):
        """Update driver"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []
            for key, value in data.items():
                if value is not None and value != "":  # ✅ don't write empty strings
                    fields.append(f"{key} = ?")
                    values.append(value)

            if not fields:
                cursor.close()
                return True

            values.append(driver_id)

            cursor.execute(
                f"UPDATE drivers SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating driver: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False

    def update_driver_active_status(self, driver_id, status):
        """Update driver active status"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute(
                "UPDATE drivers SET status = ? WHERE id = ?",
                (status, driver_id)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating driver status: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_driver(self, driver_id):
        """Delete driver"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM drivers WHERE id = ?", (driver_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting driver: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def get_driver_stats(self):
        """Get driver statistics"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return {}

            stats = {}
            cursor.execute("SELECT COUNT(*) FROM drivers")
            stats["TotalDrivers"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM drivers WHERE status = 'active'")
            stats["ActiveDrivers"] = cursor.fetchone()[0]

            cursor.close()
            return stats
        except Exception as e:
            print(f"❌ Error: {e}")
            return {}

    def search_drivers(self, search_term):
        """Search drivers by name, email, phone, or license"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            pattern = f"%{search_term}%"
            cursor.execute(
                """
                SELECT id, full_name, email, phone, license_number, status
                FROM drivers
                WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR license_number LIKE ?
                ORDER BY id ASC
                """,
                (pattern, pattern, pattern, pattern)
            )
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error searching drivers: {e}")
            return []

    # ==========================================
    # VEHICLE METHODS
    # ==========================================

    def get_vehicle_by_code(self, vehicle_code):
        """Get vehicle by vehicle_code (VEH-0023)"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None

            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_id,
                    v.type,
                    v.company_name,
                    v.year,
                    v.license_plate,
                    v.puc_certificate_number,
                    v.puc_expiry_date,
                    v.status,
                    v.created_at,
                    v.driver_id,
                    d.full_name as driver_name,
                    d.phone as driver_phone
                FROM vehicles v
                LEFT JOIN drivers d ON v.driver_id = d.id
                WHERE v.vehicle_id = ?
            """, (vehicle_code,))

            columns = [col[0] for col in cursor.description]  # ✅ read before fetch/close
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return None

            return self.serialize(dict(zip(columns, row)))

        except Exception as e:
            print(f"❌ Error fetching vehicle by code: {e}")
            return None

    def get_vehicles_by_driver(self, driver_id):
        """Get vehicles assigned to a specific driver"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []

            try:
                driver_id = int(driver_id)
            except (ValueError, TypeError):
                return []

            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_id,
                    v.type,
                    v.company_name,
                    v.year,
                    v.license_plate,
                    v.puc_certificate_number,
                    v.puc_expiry_date,
                    v.status,
                    v.driver_id
                FROM vehicles v
                WHERE v.driver_id = ?
                AND (v.status = 'active' OR v.status IS NULL)
                ORDER BY v.id ASC
            """, (driver_id,))

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()

            return self.serialize([
                dict(zip(columns, row))
                for row in rows
            ])

        except Exception as e:
            print(f"❌ Error fetching vehicles by driver: {e}")
            return []

    def get_all_vehicles(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []

            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_id,
                    v.type,
                    v.company_name,
                    v.year,
                    v.license_plate,
                    v.puc_certificate_number,
                    v.puc_expiry_date,
                    v.status,
                    v.created_at,
                    v.driver_id,
                    ISNULL(d.full_name, 'Unassigned') as driver_name,
                    d.phone as driver_phone
                FROM vehicles v
                LEFT JOIN drivers d ON v.driver_id = d.id
                ORDER BY v.id ASC
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()

            result = []
            for row in rows:
                vehicle_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    vehicle_dict[col] = value
                result.append(vehicle_dict)

            return result

        except Exception as e:
            print(f"❌ Error fetching vehicles: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_vehicle_by_id(self, vehicle_id):
        """Get single vehicle with driver info"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_id,
                    v.type,
                    v.company_name,
                    v.year,
                    v.license_plate,
                    v.puc_certificate_number,
                    v.puc_expiry_date,
                    v.notes,
                    v.upload_puc_document_copy_file_path,
                    v.status,
                    v.created_at,
                    v.driver_id,
                    d.full_name as driver_name,
                    d.phone as driver_phone
                FROM vehicles v
                LEFT JOIN drivers d ON v.driver_id = d.id
                WHERE v.id = ?
            """, (vehicle_id,))
            columns = [col[0] for col in cursor.description]  # ✅ read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    def create_vehicle(self, data):
        """Create new vehicle with driver_id"""
        try:
            print("=" * 50)
            print("🔍 DATABASE: create_vehicle called")
            print(f"  Data received: {data}")

            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return None

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'vehicles'")
            table_exists = cursor.fetchone()[0]
            print(f"🔍 Vehicles table exists: {table_exists}")

            if table_exists == 0:
                print("❌ Vehicles table does not exist!")
                return None

            cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vehicles'")
            columns = [row[0] for row in cursor.fetchall()]
            print(f"🔍 Columns in vehicles: {columns}")

            year = data.get("year")
            if year:
                try:
                    year = int(year)
                except (ValueError, TypeError):
                    year = None

            driver_id = data.get("driver_id")
            print(f"🔍 Raw driver_id from data: {driver_id}")

            if driver_id == "":
                driver_id = None
            elif driver_id:
                try:
                    driver_id = int(driver_id)
                    print(f"🔍 Parsed driver_id: {driver_id}")
                except (ValueError, TypeError):
                    driver_id = None
                    print(f"⚠️ Invalid driver_id, setting to None")

            print(f"  Inserting: type={data.get('type')}, company={data.get('company_name')}, year={year}, driver_id={driver_id}")

            cursor.execute(
                """
                INSERT INTO vehicles (vehicle_id, type, company_name, year, license_plate,
                                    puc_certificate_number, puc_expiry_date, notes, status, driver_id)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    None,
                    data.get("type"),
                    data.get("company_name"),
                    year,
                    data.get("license_plate"),
                    data.get("puc_certificate_number"),
                    data.get("puc_expiry_date"),
                    data.get("notes"),
                    data.get("status", "active"),
                    driver_id
                )
            )

            row = cursor.fetchone()
            if row:
                vehicle_pk = row[0]
                print(f"  Vehicle ID from DB: {vehicle_pk}")
            else:
                print("❌ No row returned from INSERT")
                return None

            generated_code = f"VEH-{vehicle_pk:04d}"
            print(f"  Generated vehicle_id: {generated_code}")
            cursor.execute(
                "UPDATE vehicles SET vehicle_id = ? WHERE id = ?",
                (generated_code, vehicle_pk)
            )
            self.connection.commit()
            print("✅ Transaction committed")

            cursor.close()
            print(f"✅ Returning vehicle_pk: {vehicle_pk}")
            print("=" * 50)
            return vehicle_pk

        except Exception as e:
            print(f"❌ Error creating vehicle: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return None

    def update_vehicle(self, vehicle_id, data):
        """Update vehicle including driver_id"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []

            if "year" in data and data["year"] is not None:
                try:
                    year = int(data["year"])
                    fields.append("year = ?")
                    values.append(year)
                except (ValueError, TypeError):
                    pass

            if "driver_id" in data:
                driver_id = data["driver_id"]
                if driver_id == "":
                    driver_id = None
                elif driver_id:
                    try:
                        driver_id = int(driver_id)
                    except (ValueError, TypeError):
                        driver_id = None
                fields.append("driver_id = ?")
                values.append(driver_id)

            for key in ["type", "company_name", "license_plate", "puc_certificate_number",
                       "puc_expiry_date", "notes", "status", "upload_puc_document_copy_file_path"]:
                if key in data and data[key] is not None:
                    fields.append(f"{key} = ?")
                    values.append(data[key])

            if not fields:
                return True

            values.append(vehicle_id)

            cursor.execute(
                f"UPDATE vehicles SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating vehicle: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False

    def delete_vehicle(self, vehicle_id):
        """Delete vehicle"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting vehicle: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # CLIENT METHODS
    # ==========================================

    def get_all_clients(self):
        """Get all clients"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute(
                "SELECT id, company_name, email, phone, address, status, created_at FROM clients ORDER BY id ASC"
            )
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching clients: {e}")
            return []

    def get_client_by_id(self, client_id):
        """Get single client"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                "SELECT id, company_name, email, phone, address, status, created_at FROM clients WHERE id = ?",
                (client_id,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    def create_client(self, data):
        """Create new client"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                INSERT INTO clients (company_name, email, phone, address, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    data.get("company_name"),
                    data.get("email"),
                    data.get("phone"),
                    data.get("address"),
                    data.get("status", "active")
                )
            )
            row = cursor.fetchone()
            client_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return client_id
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_client(self, client_id, data):
        """Update client"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []
            for key, value in data.items():
                if value is not None and value != "":
                    fields.append(f"{key} = ?")
                    values.append(value)

            if not fields:
                cursor.close()
                return True

            values.append(client_id)

            cursor.execute(
                f"UPDATE clients SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating client: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_client(self, client_id):
        """Delete client"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM clients WHERE id = ?", (client_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting client: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # SHIPMENT METHODS
    # ==========================================
    def ensure_shipment_columns(self):
        """Ensure required shipment columns exist"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'shipments'
            """)

            if cursor.fetchone()[0] == 0:
                print("⚠️ shipments table not found")
                cursor.close()
                return False

            columns_to_add = {
                "challan_number": "NVARCHAR(50) NULL",
                "pickup_location": "NVARCHAR(255) NULL",
                "delivery_location": "NVARCHAR(255) NULL",
                "goods_desc": "NVARCHAR(MAX) NULL",
                "weight_type": "NVARCHAR(50) NULL",
                "route_id": "INT NULL",        # ✅ needed for challan auto-fill / edit form
                "notes": "NVARCHAR(MAX) NULL", # ✅ used by the shipment edit form
            }

            for col_name, col_type in columns_to_add.items():
                cursor.execute(
                    "SELECT COL_LENGTH('shipments', ?)",
                    (col_name,)
                )

                result = cursor.fetchone()

                if result is None or result[0] is None:
                    cursor.execute(
                        f"ALTER TABLE shipments ADD [{col_name}] {col_type}"
                    )
                    self.connection.commit()
                    print(f"✅ Added {col_name} to shipments")

            cursor.close()
            return True

        except Exception as e:
            print(f"❌ Error ensuring shipment columns: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def get_all_shipments(self):
        """Get all shipments"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            # ✅ route_id + notes included so the frontend (AllShipments.jsx)
            # can actually display/edit the route a shipment is assigned to,
            # instead of always falling back to "N/A".
            cursor.execute("""
                SELECT id, lr_number, tracking_id, booking_date, destination, client,
                       weight, driver_id, vehicle_id, status, freight_charge,
                       payment_mode, created_at, updated_at, route_id, notes
                FROM shipments
                ORDER BY id ASC
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching shipments: {e}")
            return []

    def get_shipment_by_id(self, shipment_id):
        """Get single shipment"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            # ✅ route_id + notes included — same reason as get_all_shipments.
            cursor.execute(
                """
                SELECT id, lr_number, tracking_id, booking_date, destination, client,
                       weight, driver_id, vehicle_id, status, freight_charge,
                       payment_mode, created_at, updated_at, route_id, notes
                FROM shipments
                WHERE id = ?
                """,
                (shipment_id,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ FIX: read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def create_shipment(self, data):
        """Create new shipment"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                INSERT INTO shipments (
                    lr_number, tracking_id, booking_date, destination, client,
                    weight, driver_id, vehicle_id, status, freight_charge,
                    payment_mode
                )
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data.get("lr_number"),
                    data.get("tracking_id"),
                    data.get("booking_date"),
                    data.get("destination"),
                    data.get("client"),
                    data.get("weight", 0),
                    data.get("driver_id"),
                    data.get("vehicle_id"),
                    data.get("status", "pending"),
                    data.get("freight_charge", 0),
                    data.get("payment_mode", "cash")
                )
            )
            row = cursor.fetchone()
            shipment_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return shipment_id
        except Exception as e:
            print(f"❌ Error creating shipment: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_shipment(self, shipment_id, data):
        """Update shipment"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []
            for key, value in data.items():
                # ✅ FIX: skip empty strings too, not just None. Previously an
                # empty ETA ("") or empty route_id got written literally as
                # '' into columns that aren't NVARCHAR (e.g. eta DATETIME,
                # route_id INT), causing a SQL Server conversion error and a
                # 500 on PUT /shipments/{id}.
                if key == "eta" and value == "":
                    value = None
                if value is not None and value != "":
                    fields.append(f"{key} = ?")
                    values.append(value)
                elif key == "eta" and value is None:
                    # allow explicitly clearing the ETA
                    fields.append("eta = ?")
                    values.append(None)

            if not fields:
                cursor.close()
                return True

            values.append(shipment_id)

            cursor.execute(
                f"UPDATE shipments SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating shipment: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False

    def delete_shipment(self, shipment_id):
        """Delete shipment"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM shipments WHERE id = ?", (shipment_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting shipment: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # PAYMENT METHODS
    # ==========================================

    def get_all_payments(self):
        """Get all payments"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT * FROM payments ORDER BY id ASC")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching payments: {e}")
            return []

    def create_payment(self, data):
        """Create payment"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                INSERT INTO payments (driver_id, shipment_id, amount, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?)
                """,
                (
                    data.get("driver_id"),
                    data.get("shipment_id"),
                    data.get("amount", 0),
                    data.get("status", "completed")
                )
            )
            row = cursor.fetchone()
            payment_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return payment_id
        except Exception as e:
            print(f"❌ Error creating payment: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    # ==========================================
    # MAINTENANCE METHODS
    # ==========================================

    def get_all_maintenance_logs(self):
        """Get all maintenance logs"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT * FROM maintenance_logs ORDER BY id ASC")
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching maintenance logs: {e}")
            return []

    def create_maintenance_log(self, data):
        """Create maintenance log"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                INSERT INTO maintenance_logs (vehicle_id, description, service_date, cost, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    data.get("vehicle_id"),
                    data.get("description"),
                    data.get("service_date"),
                    data.get("cost", 0),
                    data.get("status", "pending")
                )
            )
            row = cursor.fetchone()
            log_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return log_id
        except Exception as e:
            print(f"❌ Error creating maintenance log: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    # ==========================================
    # SYSTEM LOGS
    # ==========================================

    def get_system_logs(self, limit=50):
        """Get system logs"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute(
                "SELECT TOP (?) * FROM system_logs ORDER BY id DESC",
                (limit,)
            )
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching logs: {e}")
            return []

    # ==========================================
    # BRANCH METHODS
    # ==========================================
    def get_all_branches(self):
        """Get all branches"""
        cursor = None
        try:
            print("🔍 DATABASE: get_all_branches called")
            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return []

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'branches'")
            if cursor.fetchone()[0] == 0:
                print("❌ branches table does not exist!")
                return []

            cursor.execute("""
                SELECT id, name, address, city, state, created_at
                FROM branches
                ORDER BY id ASC
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

            result = []
            for row in rows:
                branch_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    branch_dict[col] = value
                result.append(branch_dict)

            print(f"✅ Found {len(result)} branches")
            return result
        except Exception as e:
            print(f"❌ Error fetching branches: {e}")
            import traceback
            traceback.print_exc()
            return []
        finally:
            if cursor:
                cursor.close()

    def get_branch_by_id(self, branch_id):
        """Get single branch by ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                SELECT id, name, address, city, state, created_at
                FROM branches
                WHERE id = ?
                """,
                (branch_id,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error fetching branch: {e}")
            return None

    def create_branch(self, data):
        """Create new branch"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None

            cursor.execute(
                """
                INSERT INTO branches (name, address, city, state)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?)
                """,
                (
                    data.get("name"),
                    data.get("address"),
                    data.get("city"),
                    data.get("state")
                )
            )
            row = cursor.fetchone()
            branch_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return branch_id
        except Exception as e:
            print(f"❌ Error creating branch: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_branch(self, branch_id, data):
        """Update branch"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []
            allowed_fields = ["name", "address", "city", "state"]

            for key, value in data.items():
                if key in allowed_fields and value is not None:
                    fields.append(f"{key} = ?")
                    values.append(value)

            if not fields:
                return True

            values.append(branch_id)

            cursor.execute(
                f"UPDATE branches SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating branch: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_branch(self, branch_id):
        """Delete branch"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM branches WHERE id = ?", (branch_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting branch: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # PARTY METHODS
    # ==========================================

    def get_all_parties(self):
        """Get all parties"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("""
                SELECT id, name, type, email, phone, address, city, state, gstin, status, created_at
                FROM parties
                ORDER BY id ASC
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching parties: {e}")
            return []

    def get_party_by_id(self, party_id):
        """Get single party by ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute(
                """
                SELECT id, name, type, email, phone, address, city, state, gstin, status, created_at
                FROM parties
                WHERE id = ?
                """,
                (party_id,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error fetching party: {e}")
            return None

    def create_party(self, data):
        """Create new party"""
        try:
            print(f"🔍 Creating party with data: {data}")

            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return None

            cursor.execute(
                """
                INSERT INTO parties (name, type, email, phone, address, city, state, gstin, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data.get("name"),
                    data.get("type", "both"),
                    data.get("email", ""),
                    data.get("phone", ""),
                    data.get("address", ""),
                    data.get("city", ""),
                    data.get("state", ""),
                    data.get("gstin", ""),
                    data.get("status", "active")
                )
            )
            row = cursor.fetchone()
            party_id = row[0] if row else None
            print(f"🔍 Party ID created: {party_id}")

            self.connection.commit()
            cursor.close()
            return party_id

        except Exception as e:
            print(f"❌ Error creating party: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_party(self, party_id, data):
        """Update party"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            fields = []
            values = []
            allowed_fields = ["name", "type", "email", "phone", "address", "city", "state", "gstin", "status"]

            for key, value in data.items():
                if key in allowed_fields and value is not None:
                    fields.append(f"{key} = ?")
                    values.append(value)

            if not fields:
                return True

            values.append(party_id)

            cursor.execute(
                f"UPDATE parties SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating party: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_party(self, party_id):
        """Delete party"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM parties WHERE id = ?", (party_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting party: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # ROUTE METHODS
    # ==========================================
    def get_all_routes(self):
        """Get all routes"""
        cursor = None
        try:
            print("🔍 DATABASE: get_all_routes called")
            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return []

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'routes'")
            if cursor.fetchone()[0] == 0:
                print("❌ routes table does not exist!")
                return []

            cursor.execute("""
                SELECT id, pickup_location, destination, via, stoppage,
                       status, distance_km, rate_per_kg, rate_per_ton,
                       minimum_charge, price, estimated_days,
                       created_at
                FROM routes
                ORDER BY id ASC
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

            result = []
            for row in rows:
                route_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    route_dict[col] = value
                result.append(route_dict)

            print(f"✅ Found {len(result)} routes")
            return result

        except Exception as e:
            print(f"❌ Error fetching routes: {e}")
            import traceback
            traceback.print_exc()
            return []
        finally:
            if cursor:
                cursor.close()

    def get_route_by_id(self, route_id):
        """Get single route by ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None

            cursor.execute(
                """
                SELECT id, pickup_location, destination, via, stoppage,
                    status, distance_km, rate_per_kg, rate_per_ton,
                    minimum_charge, price, estimated_days,
                    created_at
                FROM routes
                WHERE id = ?
                """,
                (route_id,)
            )

            columns = [col[0] for col in cursor.description]  # already correct: before fetch
            row = cursor.fetchone()
            cursor.close()

            if not row:
                return None

            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error fetching route: {e}")
            return None

    def create_route(self, data):
        """Create new route"""
        try:
            print("🔍 DATABASE: create_route called")
            print(f"  Data received: {data}")

            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return None

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'routes'")
            if cursor.fetchone()[0] == 0:
                print("❌ routes table does not exist!")
                return None

            cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'routes'")
            columns = [row[0] for row in cursor.fetchall()]
            print(f"🔍 Available columns: {columns}")

            cursor.execute(
                """
                INSERT INTO routes (
                    pickup_location, destination, via, stoppage, status,
                    distance_km, rate_per_kg, rate_per_ton, minimum_charge,
                    price, estimated_days
                )
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data.get("pickup_location"),
                    data.get("destination"),
                    data.get("via", ""),
                    data.get("stoppage", ""),
                    data.get("status", "active"),
                    data.get("distance_km", 0),
                    data.get("rate_per_kg", 0),
                    data.get("rate_per_ton", 0),
                    data.get("minimum_charge", 0),
                    data.get("price", 0),
                    data.get("estimated_days", 1)
                )
            )

            row = cursor.fetchone()
            route_id = row[0] if row else None
            print(f"🔍 Route ID created: {route_id}")

            self.connection.commit()
            cursor.close()
            return route_id

        except Exception as e:
            print(f"❌ Error creating route: {e}")
            import traceback
            traceback.print_exc()
            if self.connection:
                self.connection.rollback()
            return None

    def update_route(self, route_id, data):
        """Update route"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute(
                """
                UPDATE routes SET
                    pickup_location = ?,
                    destination = ?,
                    via = ?,
                    stoppage = ?,
                    status = ?,
                    distance_km = ?,
                    rate_per_kg = ?,
                    rate_per_ton = ?,
                    minimum_charge = ?,
                    price = ?,
                    estimated_days = ?
                WHERE id = ?
                """,
                (
                    data.get("pickup_location"),
                    data.get("destination"),
                    data.get("via", ""),
                    data.get("stoppage", ""),
                    data.get("status", "active"),
                    data.get("distance_km", 0),
                    data.get("rate_per_kg", 0),
                    data.get("rate_per_ton", 0),
                    data.get("minimum_charge", 0),
                    data.get("price", 0),
                    data.get("estimated_days", 1),
                    route_id
                )
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating route: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_route(self, route_id):
        """Delete route"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM routes WHERE id = ?", (route_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting route: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # CITY METHODS
    # ==========================================

    def get_all_cities(self):
        """Get all cities"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available in get_all_cities")
                return []

            cursor.execute("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'cities'
            """)
            table_exists = cursor.fetchone()[0]

            if not table_exists:
                print("❌ cities table does not exist! Creating one...")
                cursor.execute("""
                    CREATE TABLE cities (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        name NVARCHAR(100) NOT NULL,
                        state NVARCHAR(100) NOT NULL,
                        pincode NVARCHAR(10),
                        status NVARCHAR(20) DEFAULT 'active',
                        created_at DATETIME DEFAULT GETDATE()
                    )
                """)
                self.connection.commit()
                print("✅ Created cities table")

                sample_cities = [
                    ('Mumbai', 'Maharashtra', '400001'),
                    ('Delhi', 'Delhi', '110001'),
                    ('Bangalore', 'Karnataka', '560001'),
                    ('Chennai', 'Tamil Nadu', '600001'),
                    ('Hyderabad', 'Telangana', '500001'),
                    ('Kolkata', 'West Bengal', '700001'),
                    ('Pune', 'Maharashtra', '411001'),
                    ('Ahmedabad', 'Gujarat', '380001'),
                    ('Jaipur', 'Rajasthan', '302001'),
                    ('Lucknow', 'Uttar Pradesh', '226001'),
                    ('Chandigarh', 'Chandigarh', '160001'),
                    ('Bhopal', 'Madhya Pradesh', '462001'),
                    ('Indore', 'Madhya Pradesh', '452001'),
                    ('Nagpur', 'Maharashtra', '440001'),
                    ('Patna', 'Bihar', '800001'),
                    ('Varanasi', 'Uttar Pradesh', '221001'),
                    ('Agra', 'Uttar Pradesh', '282001'),
                    ('Surat', 'Gujarat', '395001'),
                    ('Vadodara', 'Gujarat', '390001'),
                    ('Ludhiana', 'Punjab', '141001'),
                ]

                for city in sample_cities:
                    cursor.execute(
                        "INSERT INTO cities (name, state, pincode, status) VALUES (?, ?, ?, 'active')",
                        (city[0], city[1], city[2])
                    )
                self.connection.commit()
                print(f"✅ Inserted {len(sample_cities)} sample cities")

            cursor.execute("""
                SELECT id, name, state, pincode, status, created_at
                FROM cities
                WHERE status = 'active' OR status IS NULL
                ORDER BY name ASC
            """)

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            cursor.close()

            result = []
            for row in rows:
                city_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    city_dict[col] = value
                result.append(city_dict)

            print(f"✅ Found {len(result)} cities")
            return result

        except Exception as e:
            print(f"❌ Error fetching cities: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_city_by_id(self, city_id):
        """Get single city by ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor in get_city_by_id")
                return None

            cursor.execute("SELECT COL_LENGTH('cities', 'pincode')")
            has_pincode = cursor.fetchone()[0] is not None

            cursor.execute("SELECT COL_LENGTH('cities', 'status')")
            has_status = cursor.fetchone()[0] is not None

            select_fields = ["id", "name", "state"]
            if has_pincode:
                select_fields.append("pincode")
            if has_status:
                select_fields.append("status")
            select_fields.append("created_at")

            query = f"SELECT {', '.join(select_fields)} FROM cities WHERE id = ?"
            print(f"🔍 get_city_by_id query: {query}, id: {city_id}")

            cursor.execute(query, (city_id,))
            columns = [col[0] for col in cursor.description]  # ✅ FIX: read before close
            row = cursor.fetchone()
            cursor.close()

            if not row:
                print(f"❌ No city found with id: {city_id}")
                return None

            result = self.serialize(dict(zip(columns, row)))
            print(f"✅ get_city_by_id result: {result}")
            return result

        except Exception as e:
            print(f"❌ Error fetching city: {e}")
            import traceback
            traceback.print_exc()
            return None

    def create_city(self, data):
        """Create new city"""
        try:
            print(f"🔍 Creating city with data: {data}")

            cursor = self.get_cursor()
            if not cursor:
                print("❌ No cursor available")
                return None

            cursor.execute("SELECT COL_LENGTH('cities', 'pincode')")
            has_pincode = cursor.fetchone()[0] is not None

            cursor.execute("SELECT COL_LENGTH('cities', 'status')")
            has_status = cursor.fetchone()[0] is not None

            print(f"🔍 Has pincode: {has_pincode}, Has status: {has_status}")

            if has_pincode and has_status:
                cursor.execute(
                    """
                    INSERT INTO cities (name, state, pincode, status)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        data.get("name"),
                        data.get("state"),
                        data.get("pincode"),
                        data.get("status", "active")
                    )
                )
            elif has_pincode and not has_status:
                cursor.execute(
                    """
                    INSERT INTO cities (name, state, pincode)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?)
                    """,
                    (
                        data.get("name"),
                        data.get("state"),
                        data.get("pincode")
                    )
                )
            elif not has_pincode and has_status:
                cursor.execute(
                    """
                    INSERT INTO cities (name, state, status)
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?)
                    """,
                    (
                        data.get("name"),
                        data.get("state"),
                        data.get("status", "active")
                    )
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO cities (name, state)
                    OUTPUT INSERTED.id
                    VALUES (?, ?)
                    """,
                    (
                        data.get("name"),
                        data.get("state")
                    )
                )

            row = cursor.fetchone()
            city_id = row[0] if row else None
            print(f"🔍 City ID created: {city_id}")

            self.connection.commit()
            cursor.close()
            return city_id

        except Exception as e:
            print(f"❌ Error creating city: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_city(self, city_id, data):
        """Update city"""
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute("SELECT COL_LENGTH('cities', 'pincode')")
            has_pincode = cursor.fetchone()[0] is not None

            cursor.execute("SELECT COL_LENGTH('cities', 'status')")
            has_status = cursor.fetchone()[0] is not None

            fields = []
            values = []

            if "name" in data and data["name"] is not None:
                fields.append("name = ?")
                values.append(data["name"])

            if "state" in data and data["state"] is not None:
                fields.append("state = ?")
                values.append(data["state"])

            if has_pincode and "pincode" in data and data["pincode"] is not None:
                fields.append("pincode = ?")
                values.append(data["pincode"])

            if has_status and "status" in data and data["status"] is not None:
                fields.append("status = ?")
                values.append(data["status"])

            if not fields:
                return True

            values.append(city_id)

            cursor.execute(
                f"UPDATE cities SET {', '.join(fields)} WHERE id = ?",
                values
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating city: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    def delete_city(self, city_id):
        """Delete city"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM cities WHERE id = ?", (city_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting city: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # SHIPMENT METHODS (continued)
    # ==========================================

    def get_shipment_by_lr_number(self, lr_number):
        """Get shipment by LR number"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            # ✅ route_id + notes included — same reason as get_all_shipments.
            cursor.execute(
                """
                SELECT id, lr_number, tracking_id, booking_date, destination, client,
                    weight, driver_id, vehicle_id, status, freight_charge,
                    payment_mode, created_at, updated_at, route_id, notes
                FROM shipments
                WHERE lr_number = ?
                """,
                (lr_number,)
            )
            columns = [col[0] for col in cursor.description]  # ✅ FIX: read before close
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error fetching shipment by LR number: {e}")
            return None

    def update_shipment_tracking_id(self, shipment_id, tracking_id):
        """Update shipment tracking ID"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute(
                "UPDATE shipments SET tracking_id = ? WHERE id = ?",
                (tracking_id, shipment_id)
            )
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating shipment tracking id: {e}")
            if self.connection:
                self.connection.rollback()
            return False

    # ==========================================
    # Challans
    # ==========================================

    def ensure_challan_columns(self):
        """Ensure challans table has all required columns"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False

            cursor.execute("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'challans'")
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                    CREATE TABLE challans (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        challan_no NVARCHAR(50) NOT NULL UNIQUE,
                        challan_date DATE NOT NULL,
                        driver_id INT NULL,
                        vehicle_id INT NULL,
                        total_freight DECIMAL(18,2) DEFAULT 0,
                        total_weight DECIMAL(18,2) DEFAULT 0,
                        advance_paid DECIMAL(18,2) DEFAULT 0,
                        status NVARCHAR(20) DEFAULT 'active',
                        created_at DATETIME DEFAULT GETDATE()
                    )
                """)
                self.connection.commit()
                print("✅ Created challans table")
                cursor.close()
                return True

            # Add missing columns
            columns_to_add = {
                'challan_date': 'DATE NULL',
                'total_freight': 'DECIMAL(18,2) DEFAULT 0',
                'total_weight': 'DECIMAL(18,2) DEFAULT 0',
                'status': "NVARCHAR(20) DEFAULT 'active'"
            }

            for col_name, col_type in columns_to_add.items():
                try:
                    cursor.execute(f"SELECT COL_LENGTH('challans', '{col_name}')")
                    if cursor.fetchone()[0] is None:
                        cursor.execute(f"ALTER TABLE challans ADD {col_name} {col_type}")
                        self.connection.commit()
                        print(f"✅ Added column {col_name} to challans")
                except Exception as e:
                    print(f"⚠️ Could not add {col_name}: {e}")

            # ✅ FIX: some deployments of this table have a legacy `date`
            # column (separate from `challan_date`) that's NOT NULL. The
            # INSERT in create_challan_transactional never populated it,
            # causing: "Cannot insert the value NULL into column 'date'".
            # Make it nullable if it exists, so future inserts never break
            # on it regardless of whether the app code fills it in.
            try:
                cursor.execute("SELECT COL_LENGTH('challans', 'date')")
                if cursor.fetchone()[0] is not None:
                    cursor.execute("ALTER TABLE challans ALTER COLUMN [date] DATE NULL")
                    self.connection.commit()
                    print("✅ Made legacy 'date' column on challans nullable")
            except Exception as e:
                print(f"⚠️ Could not alter legacy 'date' column: {e}")

            cursor.close()
            return True

        except Exception as e:
            print(f"❌ Error ensuring challan columns: {e}")
            return False

    def create_challan_transactional(self, data):
        """Create challan and assign selected shipments"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None, "Database connection failed"

            challan_no = data.get("challan_no")
            driver_id = data.get("driver_id")
            vehicle_id = data.get("vehicle_id")

            try:
                driver_id = int(driver_id) if driver_id else None
            except (ValueError, TypeError):
                driver_id = None

            try:
                vehicle_id = int(vehicle_id) if vehicle_id else None
            except (ValueError, TypeError):
                vehicle_id = None

            # ✅ FIX: the frontend (AllShipments.jsx generateChallan) sends
            # route_id in the challan payload, but this function used to
            # never read it — so a challan's shipments kept whatever route
            # (or lack of one) they already had, and the Route column in
            # AllShipments always showed "N/A" for challan-created LRs.
            route_id = data.get("route_id")
            try:
                route_id = int(route_id) if route_id else None
            except (ValueError, TypeError):
                route_id = None

            advance_paid = float(data.get("advance_paid", 0) or 0)
            total_freight = float(data.get("total_freight", 0) or 0)
            total_weight = float(data.get("total_weight", 0) or 0)

            challan_date = data.get(
                "date",
                datetime.now().strftime("%Y-%m-%d")
            )

            shipment_ids = data.get("shipment_ids", [])

            if not challan_no:
                return None, "Challan number is required"

            if not driver_id:
                return None, "Driver is required"

            if not vehicle_id:
                return None, "Vehicle is required"

            if not shipment_ids:
                return None, "At least one shipment is required"

            # ----------------------------------
            # Validate driver
            # ----------------------------------
            cursor.execute(
                "SELECT id FROM drivers WHERE id = ?",
                (driver_id,)
            )

            if not cursor.fetchone():
                return None, "Selected driver does not exist"

            # ----------------------------------
            # Validate vehicle belongs to driver
            # ----------------------------------
            cursor.execute(
                """
                SELECT id
                FROM vehicles
                WHERE id = ?
                AND driver_id = ?
                """,
                (vehicle_id, driver_id)
            )

            if not cursor.fetchone():
                return None, "Selected vehicle is not assigned to this driver"

            # ----------------------------------
            # Create challan
            # ✅ FIX: some tables have a legacy NOT NULL `date` column
            # distinct from `challan_date`. Populate both with the same
            # value so the insert never fails on it, regardless of whether
            # ensure_challan_columns has run its ALTER COLUMN fix yet.
            # ----------------------------------
            has_legacy_date_col = False
            try:
                cursor.execute("SELECT COL_LENGTH('challans', 'date')")
                has_legacy_date_col = cursor.fetchone()[0] is not None
            except Exception:
                has_legacy_date_col = False

            if has_legacy_date_col:
                cursor.execute(
                    """
                    INSERT INTO challans (
                        challan_no,
                        challan_date,
                        [date],
                        driver_id,
                        vehicle_id,
                        total_freight,
                        total_weight,
                        advance_paid,
                        status
                    )
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        challan_no,
                        challan_date,
                        challan_date,
                        driver_id,
                        vehicle_id,
                        total_freight,
                        total_weight,
                        advance_paid,
                        "active"
                    )
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO challans (
                        challan_no,
                        challan_date,
                        driver_id,
                        vehicle_id,
                        total_freight,
                        total_weight,
                        advance_paid,
                        status
                    )
                    OUTPUT INSERTED.id
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        challan_no,
                        challan_date,
                        driver_id,
                        vehicle_id,
                        total_freight,
                        total_weight,
                        advance_paid,
                        "active"
                    )
                )

            row = cursor.fetchone()
            challan_id = row[0] if row else None

            if not challan_id:
                self.connection.rollback()
                return None, "Failed to create challan"

            # ----------------------------------
            # Assign shipments
            # ----------------------------------
            placeholders = ",".join(["?"] * len(shipment_ids))

            query = f"""
                UPDATE shipments
                SET
                    challan_number = ?,
                    status = 'in-transit',
                    driver_id = ?,
                    vehicle_id = ?,
                    route_id = ?
                WHERE id IN ({placeholders})
            """

            params = [
                challan_no,
                driver_id,
                vehicle_id,
                route_id
            ] + shipment_ids

            cursor.execute(query, params)

            updated_count = cursor.rowcount

            if updated_count <= 0:
                self.connection.rollback()
                return None, "No shipments were updated"

            self.connection.commit()
            cursor.close()

            print(
                f"✅ Challan {challan_no} created. "
                f"Shipments updated: {updated_count}"
            )

            return challan_id, None

        except Exception as e:
            print(f"❌ Error in create_challan_transactional: {e}")

            import traceback
            traceback.print_exc()

            if self.connection:
                self.connection.rollback()

            return None, str(e)

    def get_challan_with_details(self, challan_no):
        """Get challan with driver, vehicle, and shipment details"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None

            cursor.execute("""
                SELECT
                    c.*,
                    d.full_name as driver_name,
                    d.phone as driver_phone,
                    v.vehicle_id as vehicle_code,
                    v.license_plate
                FROM challans c
                LEFT JOIN drivers d ON c.driver_id = d.id
                LEFT JOIN vehicles v ON c.vehicle_id = v.id
                WHERE c.challan_no = ?
            """, (challan_no,))

            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()

            if not row:
                cursor.close()
                return None

            challan = dict(zip(columns, row))

            # Get shipments
            cursor.execute("""
                SELECT
                    id, lr_number, pickup_location, delivery_location, destination,
                    client, goods_desc, weight, weight_type, freight_charge,
                    payment_mode, status
                FROM shipments
                WHERE challan_number = ?
            """, (challan_no,))

            shipment_columns = [col[0] for col in cursor.description]
            shipment_rows = cursor.fetchall()
            cursor.close()

            challan['shipments'] = [dict(zip(shipment_columns, row)) for row in shipment_rows]

            for key, val in challan.items():
                if hasattr(val, "isoformat"):
                    challan[key] = str(val)
                if hasattr(val, "__class__") and val.__class__.__name__ == "Decimal":
                    challan[key] = float(val)

            return challan
        except Exception as e:
            print(f"❌ Error in get_challan_with_details: {e}")
            return None


# ==========================================
# CREATE SINGLETON INSTANCE
# ==========================================
db = Database()
print("✅ Database instance created and ready!")
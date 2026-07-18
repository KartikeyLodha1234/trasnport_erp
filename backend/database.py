# database.py - Updated with stored procedure support
import pyodbc
import json
from decimal import Decimal
from config import Config

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            conn_str = Config.get_connection_string()
            self.connection = pyodbc.connect(conn_str)
            self.connection.autocommit = False
            print("✅ MSSQL Database connected successfully!")
            print(f"   Database: {Config.DB_NAME}")
            print(f"   Server: {Config.DB_HOST}")
            print("   Authentication: Windows Authentication")
            
            self.test_connection()
        except Exception as e:
            print(f"❌ Database connection error: {e}")
            self.connection = None
    
    def test_connection(self):
        """Test database connection and check tables"""
        try:
            cursor = self.get_cursor()
            if cursor:
                cursor.execute("SELECT COUNT(*) as count FROM drivers")
                count = cursor.fetchone()[0]
                print(f"   Total drivers in database: {count}")
                cursor.close()
        except Exception as e:
            print(f"⚠️ Error testing connection: {e}")
    
    def get_cursor(self):
        if not self.connection:
            self.connect()
        if self.connection:
            return self.connection.cursor()
        return None

    def serialize(self, data):
        if isinstance(data, list):
            return [self.serialize(item) for item in data]
        if isinstance(data, dict):
            serialized = {}
            for key, value in data.items():
                if isinstance(value, Decimal):
                    serialized[key] = str(value)
                elif hasattr(value, 'isoformat'):
                    serialized[key] = value.isoformat()
                else:
                    serialized[key] = value
            return serialized
        if isinstance(data, Decimal):
            return str(data)
        if hasattr(data, 'isoformat'):
            return data.isoformat()
        return data
    
    def execute_procedure(self, proc_name, params=None):
        """Execute a stored procedure and return results"""
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            
            if params:
                cursor.execute(f"EXEC {proc_name} " + ", ".join(["?"] * len(params)), params)
            else:
                cursor.execute(f"EXEC {proc_name}")
            
            results = []
            while True:
                try:
                    columns = [column[0] for column in cursor.description] if cursor.description else []
                    rows = cursor.fetchall()
                    if rows:
                        result_set = []
                        for row in rows:
                            result_set.append(self.serialize(dict(zip(columns, row))))
                        results.append(self.serialize(result_set))
                    if not cursor.nextset():
                        break
                except Exception:
                    break
            
            self.connection.commit()
            cursor.close()
            return results if results else None
        except Exception as e:
            print(f"❌ Error executing procedure {proc_name}: {e}")
            return None
    
    def execute_procedure_single(self, proc_name, params=None):
        """Execute a stored procedure and return first result set"""
        results = self.execute_procedure(proc_name, params)
        return self.serialize(results[0]) if results else None

    # ==========================================
    # CLIENT METHODS
    # ==========================================

    def get_all_clients(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT id, company_name, email, phone, address, status, created_at, updated_at FROM clients ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching clients: {e}")
            return []

    def get_client_stats(self):
        try:
            clients = self.get_all_clients()
            return {
                'total_clients': len(clients),
                'active_clients': sum(1 for item in clients if str(item.get('status', '')).lower() == 'active')
            }
        except Exception as e:
            print(f"❌ Error fetching client stats: {e}")
            return {'total_clients': 0, 'active_clients': 0}

    def create_client(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO clients (company_name, email, phone, address, status) 
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?)
            """, (
                data.get('company_name'), 
                data.get('email'), 
                data.get('phone'), 
                data.get('address'), 
                data.get('status', 'Active')
            ))
            row = cursor.fetchone()
            client_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return client_id
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            self.connection.rollback()
            return None

    def get_client_by_id(self, client_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id, company_name, email, phone, address, status, created_at, updated_at FROM clients WHERE id = ?", (client_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching client by id: {e}")
            return None

    def update_client(self, client_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(client_id)
            cursor.execute(f"UPDATE clients SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating client: {e}")
            self.connection.rollback()
            return False

    def delete_client(self, client_id):
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
            self.connection.rollback()
            return False

    def search_clients(self, search_term):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            pattern = f"%{search_term}%"
            cursor.execute("SELECT id, company_name, email, phone, address, status, created_at, updated_at FROM clients WHERE company_name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY id ASC", (pattern, pattern, pattern))
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error searching clients: {e}")
            return []

    def filter_clients_by_status(self, status):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT id, company_name, email, phone, address, status, created_at, updated_at FROM clients WHERE LOWER(status) = LOWER(?) ORDER BY id ASC", (status,))
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error filtering clients by status: {e}")
            return []

    # ==========================================
    # VEHICLE METHODS
    # ==========================================

    def get_all_vehicles(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("""
                SELECT id, vehicle_id, type, company_name, year, license_plate,
                       puc_certificate_number, puc_expiry_date, upload_puc_document_copy_file_path,
                       notes, created_at, updated_at
                FROM vehicles
                ORDER BY id ASC
            """)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching vehicles: {e}")
            return []

    def get_vehicle_by_id(self, vehicle_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                SELECT id, vehicle_id, type, company_name, year, license_plate,
                       puc_certificate_number, puc_expiry_date, upload_puc_document_copy_file_path,
                       notes, created_at, updated_at
                FROM vehicles
                WHERE id = ?
            """, (vehicle_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description] if cursor.description else []
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching vehicle by id: {e}")
            return None

    def create_vehicle(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO vehicles (
                    vehicle_id, type, company_name, year, license_plate,
                    puc_certificate_number, puc_expiry_date, upload_puc_document_copy_file_path, notes
                )
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('vehicle_id'),
                data.get('type'),
                data.get('company_name'),
                data.get('year'),
                data.get('license_plate'),
                data.get('puc_certificate_number'),
                data.get('puc_expiry_date'),
                data.get('upload_puc_document_copy_file_path'),
                data.get('notes')
            ))
            row = cursor.fetchone()
            vehicle_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return vehicle_id
        except Exception as e:
            print(f"❌ Error creating vehicle: {e}")
            self.connection.rollback()
            return None

    def update_vehicle(self, vehicle_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(vehicle_id)
            cursor.execute(f"UPDATE vehicles SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating vehicle: {e}")
            self.connection.rollback()
            return False

    def delete_vehicle(self, vehicle_id):
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
            self.connection.rollback()
            return False

    # ==========================================
    # SHIPMENT METHODS
    # ==========================================

       # ==========================================
    # SHIPMENT METHODS
    # ==========================================

    def get_all_shipments(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("""
                SELECT id, lr_number, tracking_id, challan_number, booking_date, destination, client,
                       consignor_id, consignee_id,
                       weight, driver_id, vehicle_id, eta, status, notes, pickup_location,
                       delivery_location, freight_charge, loading_charges, unloading_charges,
                       other_charges, discount, gst, payment_mode, goods_desc, packages,
                       weight_type, invoice_no, invoice_value, eway_bill, created_at, updated_at
                FROM shipments
                ORDER BY id ASC
            """)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching shipments: {e}")
            return []

    def get_shipment_by_id(self, shipment_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                SELECT id, lr_number, tracking_id, challan_number, booking_date, destination, client,
                       consignor_id, consignee_id,
                       weight, driver_id, vehicle_id, eta, status, notes, pickup_location,
                       delivery_location, freight_charge, loading_charges, unloading_charges,
                       other_charges, discount, gst, payment_mode, goods_desc, packages,
                       weight_type, invoice_no, invoice_value, eway_bill, created_at, updated_at
                FROM shipments
                WHERE id = ?
            """, (shipment_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            cursor.close()
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error fetching shipment by id: {e}")
            return None

    def get_shipment_by_lr_number(self, lr_number):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id FROM shipments WHERE lr_number = ?", (lr_number,))
            row = cursor.fetchone()
            cursor.close()
            return row[0] if row else None
        except Exception as e:
            print(f"❌ Error fetching shipment by lr number: {e}")
            return None

    def create_shipment(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO shipments (
                    lr_number, tracking_id, challan_number, booking_date, destination, client,
                    consignor_id, consignee_id,
                    weight, driver_id, vehicle_id, eta, status, notes, pickup_location,
                    delivery_location, freight_charge, loading_charges, unloading_charges,
                    other_charges, discount, gst, payment_mode, goods_desc, packages,
                    weight_type, invoice_no, invoice_value, eway_bill
                )
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('lr_number'),
                data.get('tracking_id'),
                data.get('challan_number'),
                data.get('booking_date'),
                data.get('destination'),
                data.get('client'),
                data.get('consignor_id'),
                data.get('consignee_id'),
                data.get('weight', 0),
                data.get('driver_id'),
                data.get('vehicle_id'),
                data.get('eta'),
                data.get('status', 'pending'),
                data.get('notes', ''),
                data.get('pickup_location'),
                data.get('delivery_location'),
                data.get('freight_charge', 0),
                data.get('loading_charges', 0),
                data.get('unloading_charges', 0),
                data.get('other_charges', 0),
                data.get('discount', 0),
                data.get('gst', 0),
                data.get('payment_mode', 'cash'),
                data.get('goods_desc', ''),
                data.get('packages', 0),
                data.get('weight_type', 'kg'),
                data.get('invoice_no'),
                data.get('invoice_value', 0),
                data.get('eway_bill')
            ))
            row = cursor.fetchone()
            shipment_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return shipment_id
        except Exception as e:
            print(f"❌ Error creating shipment: {e}")
            self.connection.rollback()
            return None

    def update_shipment(self, shipment_id, data):
        try:
            if not data:
                return False
            clean_data = {k: v for k, v in data.items() if v is not None and v != ''}
            if not clean_data:
                return True
            
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in clean_data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(shipment_id)
            cursor.execute(f"UPDATE shipments SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating shipment: {e}")
            self.connection.rollback()
            return False

    def update_shipment_tracking_id(self, shipment_id, tracking_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("UPDATE shipments SET tracking_id = ? WHERE id = ?", (tracking_id, shipment_id))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating shipment tracking id: {e}")
            self.connection.rollback()
            return False

    def delete_shipment(self, shipment_id):
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
            self.connection.rollback()
            return False
    # ==========================================
    # DRIVER AUTHENTICATION
    # ==========================================

    def authenticate_driver(self, email, password):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id, full_name, email, phone FROM drivers WHERE email = ? AND password = ?", (email, password))
            row = cursor.fetchone()
            cursor.close()
            if not row:
                return None
            columns = [column[0] for column in cursor.description] if cursor.description else []
            return self.serialize(dict(zip(columns, row)))
        except Exception as e:
            print(f"❌ Error authenticating driver: {e}")
            return None

    # ==========================================
    # PAYMENT METHODS
    # ==========================================

    def get_all_payments(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT * FROM payments ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching payments: {e}")
            return []

    def get_driver_payments(self, driver_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT * FROM payments WHERE driver_id = ? ORDER BY id ASC", (driver_id,))
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching driver payments: {e}")
            return []

    def create_payment(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO payments (driver_id, shipment_id, amount, checkpoint_name, upi_id, upi_ref, note, status, paid_by)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('driver_id'),
                data.get('shipment_id'),
                data.get('amount'),
                data.get('checkpoint_name'),
                data.get('upi_id'),
                data.get('upi_ref'),
                data.get('note'),
                data.get('status', 'completed'),
                data.get('paid_by', 'admin')
            ))
            row = cursor.fetchone()
            payment_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return payment_id
        except Exception as e:
            print(f"❌ Error creating payment: {e}")
            self.connection.rollback()
            return None

    def delete_payment(self, payment_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM payments WHERE id = ?", (payment_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting payment: {e}")
            self.connection.rollback()
            return False

    # ==========================================
    # MAINTENANCE LOG METHODS
    # ==========================================

    def get_all_maintenance_logs(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT * FROM maintenance_logs ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching maintenance logs: {e}")
            return []

    def get_maintenance_log_by_id(self, log_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT * FROM maintenance_logs WHERE id = ?", (log_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching maintenance log by id: {e}")
            return None

    def create_maintenance_log(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO maintenance_logs (vehicle_id, maintenance_type, category, description, service_date, cost, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('vehicle_id'),
                data.get('maintenance_type'),
                data.get('category'),
                data.get('description'),
                data.get('service_date'),
                data.get('cost', 0),
                data.get('status', 'In Progress')
            ))
            row = cursor.fetchone()
            log_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return log_id
        except Exception as e:
            print(f"❌ Error creating maintenance log: {e}")
            self.connection.rollback()
            return None

    def update_maintenance_log(self, log_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(log_id)
            cursor.execute(f"UPDATE maintenance_logs SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating maintenance log: {e}")
            self.connection.rollback()
            return False

    def delete_maintenance_log(self, log_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return False
            cursor.execute("DELETE FROM maintenance_logs WHERE id = ?", (log_id,))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error deleting maintenance log: {e}")
            self.connection.rollback()
            return False

    # ==========================================
    # SYSTEM LOG METHODS
    # ==========================================

    def get_system_logs(self, limit=50):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT TOP (?) * FROM system_logs ORDER BY id DESC", (limit,))
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching system logs: {e}")
            return []

    def create_system_log(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO system_logs (type, title, description, time)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?)
            """, (
                data.get('type'),
                data.get('title'),
                data.get('description'),
                data.get('time')
            ))
            row = cursor.fetchone()
            log_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return log_id
        except Exception as e:
            print(f"❌ Error creating system log: {e}")
            self.connection.rollback()
            return None

    # ==========================================
    # BRANCH METHODS
    # ==========================================

    def get_all_branches(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT id, name, address, city, state, created_at FROM branches ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching branches: {e}")
            return []

    def get_branch_by_id(self, branch_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id, name, address, city, state, created_at FROM branches WHERE id = ?", (branch_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching branch by id: {e}")
            return None

    def create_branch(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO branches (name, address, city, state)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?)
            """, (
                data.get('name'), data.get('address'), data.get('city'), data.get('state')
            ))
            row = cursor.fetchone()
            branch_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return branch_id
        except Exception as e:
            print(f"❌ Error creating branch: {e}")
            self.connection.rollback()
            return None

    def update_branch(self, branch_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(branch_id)
            cursor.execute(f"UPDATE branches SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating branch: {e}")
            self.connection.rollback()
            return False

    def delete_branch(self, branch_id):
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
            self.connection.rollback()
            return False

      # ==========================================
    # PARTY METHODS
    # ==========================================

    def get_all_parties(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT id, name, type, email, phone, address, city, state, gstin, status, created_at FROM parties ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching parties: {e}")
            return []

    def get_party_by_id(self, party_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id, name, type, email, phone, address, city, state, gstin, status, created_at FROM parties WHERE id = ?", (party_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching party by id: {e}")
            return None

    def create_party(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO parties (name, type, email, phone, address, city, state, gstin, status)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('name'), 
                data.get('type', 'both'), 
                data.get('email'), 
                data.get('phone'), 
                data.get('address'),
                data.get('city'),
                data.get('state'),
                data.get('gstin'),
                data.get('status', 'active')
            ))
            row = cursor.fetchone()
            party_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return party_id
        except Exception as e:
            print(f"❌ Error creating party: {e}")
            self.connection.rollback()
            return None

    def update_party(self, party_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(party_id)
            cursor.execute(f"UPDATE parties SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating party: {e}")
            self.connection.rollback()
            return False

    def delete_party(self, party_id):
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
            self.connection.rollback()
            return False
    # ==========================================
    # CITY METHODS
    # ==========================================

    def get_all_cities(self):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            cursor.execute("SELECT id, name, state, created_at FROM cities ORDER BY id ASC")
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            cursor.close()
            return self.serialize([dict(zip(columns, row)) for row in rows])
        except Exception as e:
            print(f"❌ Error fetching cities: {e}")
            return []

    def get_city_by_id(self, city_id):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("SELECT id, name, state, created_at FROM cities WHERE id = ?", (city_id,))
            row = cursor.fetchone()
            if not row:
                cursor.close()
                return None
            columns = [column[0] for column in cursor.description]
            result = self.serialize(dict(zip(columns, row)))
            cursor.close()
            return result
        except Exception as e:
            print(f"❌ Error fetching city by id: {e}")
            return None

    def create_city(self, data):
        try:
            cursor = self.get_cursor()
            if not cursor:
                return None
            cursor.execute("""
                INSERT INTO cities (name, state)
                OUTPUT INSERTED.id
                VALUES (?, ?)
            """, (data.get('name'), data.get('state')))
            row = cursor.fetchone()
            city_id = row[0] if row else None
            self.connection.commit()
            cursor.close()
            return city_id
        except Exception as e:
            print(f"❌ Error creating city: {e}")
            self.connection.rollback()
            return None

    def update_city(self, city_id, data):
        try:
            if not data:
                return False
            cursor = self.get_cursor()
            if not cursor:
                return False
            fields = []
            values = []
            for key, value in data.items():
                fields.append(f"{key} = ?")
                values.append(value)
            values.append(city_id)
            cursor.execute(f"UPDATE cities SET {', '.join(fields)} WHERE id = ?", values)
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            print(f"❌ Error updating city: {e}")
            self.connection.rollback()
            return False

    def delete_city(self, city_id):
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
            self.connection.rollback()
            return False

    # ==========================================
    # DRIVER METHODS (Using Stored Procedures)
    # ==========================================
    
    def get_all_drivers(self, page=1, page_size=50, search=None):
        """Get all drivers with pagination using stored procedure"""
        params = [page, page_size, search]
        result = self.execute_procedure_single('sp_GetAllDrivers', params)
        if result:
            return result

        try:
            cursor = self.get_cursor()
            if not cursor:
                return []
            query = """
                SELECT id, full_name, email, phone, dob, experience, license_number,
                       bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
                       pan_card, medical_report, police_verification, created_at
                FROM drivers
                ORDER BY id ASC
            """
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            drivers = [dict(zip(columns, row)) for row in rows]
            cursor.close()
            return drivers
        except Exception as e:
            print(f"❌ Error fetching drivers directly: {e}")
            return []
    
    def get_driver_by_id(self, driver_id):
        """Get driver by ID using stored procedure"""
        result = self.execute_procedure_single('sp_GetDriverById', [driver_id])
        return result[0] if result else None
    
    def get_driver_by_email(self, email):
        """Get driver by email using stored procedure"""
        result = self.execute_procedure_single('sp_GetDriverByEmail', [email])
        return result[0] if result else None
    
    def get_driver_by_phone(self, phone):
        """Get driver by phone using stored procedure"""
        result = self.execute_procedure_single('sp_GetDriverByPhone', [phone])
        return result[0] if result else None
    def create_driver(self, data):
        """Create a new driver using stored procedure"""
        try:
            params = [
                data.get('full_name'),
                data.get('email'),
                data.get('phone'),
                data.get('password'),
                data.get('dob'),
                data.get('experience', 0),
                data.get('license_number'),
                data.get('bank_name'),
                data.get('account_number'),
                data.get('ifsc_code'),
                data.get('bank_branch'),
                data.get('emergency_contact'),
                data.get('address_proof'),
                data.get('aadhar_card'),
                data.get('pan_card'),
                data.get('medical_report', 'Pending'),
                data.get('police_verification', 'Pending'),
                data.get('license_file_path'),
                data.get('police_file_path'),
                data.get('bank_file_path'),
                data.get('medical_file_path'),
                data.get('aadhar_file_path'),
                data.get('wallet_balance', 0.00)
            ]
            
            cursor = self.get_cursor()
            if not cursor:
                return None
            
            cursor.execute("""
                DECLARE @NewDriverId INT;
                EXEC sp_CreateDriver 
                    @FullName = ?,
                    @Email = ?,
                    @Phone = ?,
                    @Password = ?,
                    @Dob = ?,
                    @Experience = ?,
                    @LicenseNumber = ?,
                    @BankName = ?,
                    @AccountNumber = ?,
                    @IfscCode = ?,
                    @BankBranch = ?,
                    @EmergencyContact = ?,
                    @AddressProof = ?,
                    @AadharCard = ?,
                    @PanCard = ?,
                    @MedicalReport = ?,
                    @PoliceVerification = ?,
                    @LicenseFilePath = ?,
                    @PoliceFilePath = ?,
                    @BankFilePath = ?,
                    @MedicalFilePath = ?,
                    @AadharFilePath = ?,
                    @WalletBalance = ?,
                    @NewDriverId = @NewDriverId OUTPUT;
                SELECT @NewDriverId AS NewDriverId;
            """, params)
            
            result = cursor.fetchone()
            cursor.close()
            self.connection.commit()
            
            return result[0] if result else None
            
        except Exception as e:
            print(f"❌ Error creating driver: {e}")
            self.connection.rollback()
            return None
    
    def update_driver(self, driver_id, data):
        """Update driver using stored procedure"""
        try:
            params = [
                driver_id,
                data.get('full_name'),
                data.get('email'),
                data.get('phone'),
                data.get('password'),
                data.get('dob'),
                data.get('experience'),
                data.get('license_number'),
                data.get('bank_name'),
                data.get('account_number'),
                data.get('ifsc_code'),
                data.get('bank_branch'),
                data.get('emergency_contact'),
                data.get('address_proof'),
                data.get('aadhar_card'),
                data.get('pan_card'),
                data.get('medical_report'),
                data.get('police_verification'),
                data.get('license_file_path'),
                data.get('police_file_path'),
                data.get('bank_file_path'),
                data.get('medical_file_path'),
                data.get('aadhar_file_path'),
                data.get('wallet_balance')
            ]
            
            result = self.execute_procedure_single('sp_UpdateDriver', params)
            return result[0] if result else None
            
        except Exception as e:
            print(f"❌ Error updating driver: {e}")
            self.connection.rollback()
            return None
    
    def delete_driver(self, driver_id, force_delete=False):
        """Delete driver using stored procedure"""
        try:
            params = [driver_id, 1 if force_delete else 0]
            result = self.execute_procedure_single('sp_DeleteDriver', params)
            return result is not None
            
        except Exception as e:
            print(f"❌ Error deleting driver: {e}")
            self.connection.rollback()
            return False
    
    def search_drivers(self, search_term, page=1, page_size=50):
        """Search drivers using stored procedure"""
        try:
            result = self.execute_procedure_single('sp_SearchDrivers', [search_term, page, page_size])
            return result if result else []
        except:
            try:
                cursor = self.get_cursor()
                if not cursor:
                    return []
                search_term = f"%{search_term}%"
                cursor.execute("""
                    SELECT id, full_name, email, phone, dob, experience, license_number,
                           bank_name, account_number, ifsc_code, bank_branch, emergency_contact, address_proof, aadhar_card,
                           pan_card, medical_report, police_verification, created_at
                    FROM drivers 
                    WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR license_number LIKE ?
                    ORDER BY id ASC
                """, (search_term, search_term, search_term, search_term))
                columns = [column[0] for column in cursor.description]
                results = []
                for row in cursor.fetchall():
                    driver = dict(zip(columns, row))
                    if driver.get('created_at'):
                        driver['created_at'] = str(driver['created_at'])
                    if driver.get('dob'):
                        driver['dob'] = str(driver['dob'])
                    results.append(driver)
                cursor.close()
                return results
            except Exception as e:
                print(f"❌ Error searching drivers: {e}")
                return []
    
    def get_driver_stats(self):
        """Get driver statistics using stored procedure"""
        result = self.execute_procedure_single('sp_GetDriverStats')
        return result[0] if result else {
            'TotalDrivers': 0,
            'MedicalApproved': 0,
            'MedicalPending': 0,
            'PoliceApproved': 0,
            'PolicePending': 0,
            'TotalWalletBalance': 0,
            'AvgWalletBalance': 0,
            'ExperiencedDrivers': 0,
            'NewDrivers': 0
        }
    
    def update_driver_wallet(self, driver_id, amount, operation):
        """Update driver wallet using stored procedure"""
        try:
            result = self.execute_procedure_single('sp_UpdateDriverWallet', [driver_id, amount, operation])
            return result[0] if result else None
            
        except Exception as e:
            print(f"❌ Error updating wallet: {e}")
            self.connection.rollback()
            return None
    
    def get_driver_with_history(self, driver_id):
        """Get driver with shipment and transaction history"""
        try:
            results = self.execute_procedure('sp_GetDriverWithHistory', [driver_id])
            if results:
                return {
                    'driver': results[0][0] if len(results) > 0 and results[0] else None,
                    'shipments': results[1] if len(results) > 1 else [],
                    'transactions': results[2] if len(results) > 2 else []
                }
            return None
            
        except Exception as e:
            print(f"❌ Error getting driver history: {e}")
            return None
    
    def bulk_insert_drivers(self, driver_data):
        """Bulk insert drivers using stored procedure"""
        try:
            json_data = json.dumps(driver_data)
            result = self.execute_procedure_single('sp_BulkInsertDrivers', [json_data])
            return result[0] if result else None
            
        except Exception as e:
            print(f"❌ Error in bulk insert: {e}")
            self.connection.rollback()
            return None
    
    def get_drivers_by_status(self, medical_status=None, police_status=None):
        """Get drivers by verification status"""
        result = self.execute_procedure_single('sp_GetDriversByStatus', [medical_status, police_status])
        return result if result else []
    
    def get_driver_wallet_transactions(self, driver_id, page=1, page_size=20):
        """Get driver wallet transactions"""
        result = self.execute_procedure_single('sp_GetDriverWalletTransactions', [driver_id, page, page_size])
        return result if result else []
    
    def update_driver_status(self, driver_id, medical_status=None, police_status=None):
        """Update driver verification status"""
        try:
            result = self.execute_procedure_single('sp_UpdateDriverStatus', [driver_id, medical_status, police_status])
            return result[0] if result else None
            
        except Exception as e:
            print(f"❌ Error updating driver status: {e}")
            self.connection.rollback()
            return None
    
    def get_driver_summary(self, driver_id):
        """Get driver summary"""
        try:
            results = self.execute_procedure('sp_GetDriverSummary', [driver_id])
            if results:
                return {
                    'driver_info': results[0][0] if len(results) > 0 and results[0] else None,
                    'shipment_summary': results[1][0] if len(results) > 1 and results[1] else None,
                    'transaction_summary': results[2][0] if len(results) > 2 and results[2] else None
                }
            return None
            
        except Exception as e:
            print(f"❌ Error getting driver summary: {e}")
            return None
    
    def check_driver_availability(self, driver_id, from_date=None, to_date=None):
        """Check driver availability"""
        result = self.execute_procedure_single('sp_CheckDriverAvailability', [driver_id, from_date, to_date])
        return result[0] if result else None
    
    def get_drivers_with_low_balance(self, threshold=100.00):
        """Get drivers with low wallet balance"""
        result = self.execute_procedure_single('sp_GetDriversWithLowBalance', [threshold])
        return result if result else []
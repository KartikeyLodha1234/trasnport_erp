import pyodbc
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get connection parameters from .env
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'transport')
DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')

print(f"🔍 Testing connection to: {DB_HOST}/{DB_NAME}")
print(f"📌 Driver: {DB_DRIVER}")

try:
    # Connection string for Windows Authentication
    connection_string = (
        f"DRIVER={DB_DRIVER};"
        f"SERVER={DB_HOST};"
        f"DATABASE={DB_NAME};"
        f"Trusted_Connection=yes;"
    )
    
    print("Connecting...")
    conn = pyodbc.connect(connection_string)
    print("✅ Connection successful!")
    
    # Test query
    cursor = conn.cursor()
    cursor.execute("SELECT @@VERSION")
    version = cursor.fetchone()
    print(f"📊 SQL Server Version: {version[0][:100]}...")
    
    # Check if vehicles table exists
    cursor.execute("""
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'vehicles'
    """)
    table_exists = cursor.fetchone()[0]
    
    if table_exists:
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        count = cursor.fetchone()[0]
        print(f"🚗 Vehicles table found with {count} records")
    else:
        print("⚠️ Vehicles table not found - will be created by Flask")
    
    conn.close()
    print("✅ All tests passed!")
    
except pyodbc.Error as e:
    print(f"❌ Database Error: {e}")
    print("\n💡 Troubleshooting Tips:")
    print("1. Check if SQL Server is running (Services -> SQL Server)")
    print("2. Check if ODBC Driver 17 is installed")
    print("3. Try using 'localhost\\SQLEXPRESS' if using Express edition")
    print("4. Check Windows Firewall is not blocking port 1433")
    
except Exception as e:
    print(f"❌ Error: {e}")
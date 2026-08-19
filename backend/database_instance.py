# database_instance.py
from database import Database

try:
    db = Database()
    if db.connection:
        print("✅ Database instance created successfully")
    else:
        print("⚠️ Database instance created but connection failed")
except Exception as e:
    print(f"❌ Failed to create database instance: {e}")
    db = None
# test_vehicle.py
from database import db

# Check if method exists
if hasattr(db, 'create_vehicle'):
    print("✅ create_vehicle method found!")
else:
    print("❌ create_vehicle method NOT found!")
    print("Available methods:")
    for method in dir(db):
        if not method.startswith('_'):
            print(f"  - {method}")
    exit()

# Test create_vehicle
data = {
    "type": "heavy",
    "company_name": "Test Company",
    "license_plate": "TEST-123",
    "year": 2025,
    "puc_certificate_number": "PUC-123",
    "puc_expiry_date": "2026-12-31",
    "status": "active"
}

print("Testing create_vehicle...")
print(f"Data: {data}")

try:
    result = db.create_vehicle(data)
    print(f"Result: {result}")
    
    if result:
        print(f"✅ Vehicle created with ID: {result}")
        vehicle = db.get_vehicle_by_id(result)
        print(f"Vehicle: {vehicle}")
    else:
        print("❌ create_vehicle returned None")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
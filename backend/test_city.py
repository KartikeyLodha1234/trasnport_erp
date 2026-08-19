# test_city.py
from database import db

# Test create city
data = {
    "name": "Test City",
    "state": "Test State",
    "pincode": "123456",
    "status": "active"
}

print("Testing create_city...")
city_id = db.create_city(data)
print(f"City ID: {city_id}")

# Test get all cities
print("\nGetting all cities...")
cities = db.get_all_cities()
print(f"Cities: {cities}")
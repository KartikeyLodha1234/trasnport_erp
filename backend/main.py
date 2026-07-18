from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.driver_routes import router as driver_router
from routes.vehicle_routes import router as vehicle_router
from routes.shipment_routes import router as shipment_router
from routes.payment_routes import router as payment_router
from routes.maintenance_routes import router as maintenance_router
from routes.log_routes import router as log_router
from routes.client_routes import router as client_router
from routes.route_routes import router as route_router
from routes.branch_routes import router as branch_router
from routes.party_routes import router as party_router
from routes.city_routes import router as city_router
from routes.vehicle_routes import get_vehicles, create_vehicle
from routes.shipment_routes import get_shipments, create_shipment
from routes.branch_routes import get_branches, create_branch
from routes.party_routes import get_parties, create_party
from routes.city_routes import get_cities, create_city

app = FastAPI(
    title="FleetChain API",
    description="Hybrid Web3 Fleet Management System",
    version="1.0.0",
    redirect_slashes=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,        prefix="/api/auth",        tags=["Auth"])
app.include_router(driver_router,      prefix="/api/drivers",     tags=["Drivers"])
app.include_router(vehicle_router,     prefix="/api/vehicles",    tags=["Vehicles"])
app.include_router(shipment_router,    prefix="/api/shipments",   tags=["Shipments"])
app.include_router(payment_router,     prefix="/api/payments",    tags=["Payments"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(log_router,         prefix="/api/logs",        tags=["Logs"])
app.include_router(client_router,      prefix="/api/clients",     tags=["Clients"])
app.include_router(route_router,       prefix="/api/routes",      tags=["Routes"])
app.include_router(branch_router,      prefix="/api/branches",    tags=["Branches"])
app.include_router(party_router,       prefix="/api/parties",     tags=["Parties"])
app.include_router(city_router,        prefix="/api/cities",      tags=["Cities"])

# App-level aliases for non-trailing-slash collection routes
# These forward to the existing router handlers so both /api/x and /api/x/ work
@app.get("/api/vehicles")
def vehicles_no_slash():
    return get_vehicles()

@app.post("/api/vehicles")
def vehicles_create_no_slash(data: dict):
    return create_vehicle(data)

@app.get("/api/shipments")
def shipments_no_slash():
    return get_shipments()

@app.post("/api/shipments")
def shipments_create_no_slash(data: dict):
    return create_shipment(data)

@app.get("/api/branches")
def branches_no_slash():
    return get_branches()

@app.post("/api/branches")
def branches_create_no_slash(data: dict):
    return create_branch(data)

@app.get("/api/parties")
def parties_no_slash():
    return get_parties()

@app.post("/api/parties")
def parties_create_no_slash(data: dict):
    return create_party(data)

@app.get("/api/cities")
def cities_no_slash():
    return get_cities()

@app.post("/api/cities")
def cities_create_no_slash(data: dict):
    return create_city(data)

@app.get("/", tags=["Health"])
def home():
    return {
        "message": "FleetChain Backend Running",
        "docs": "http://localhost:8001/docs"
    }
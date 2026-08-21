# main.py
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
from routes.expenses_routes import router as expenses_router
from routes import challan_routes

# Import database
from database import db

app = FastAPI(
    title="FleetChain API",
    description="Hybrid Web3 Fleet Management System",
    version="1.0.0",
    redirect_slashes=False,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(challan_routes.router, prefix="/api/challans", tags=["challans"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(driver_router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(vehicle_router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(shipment_router, prefix="/api/shipments", tags=["Shipments"])
app.include_router(payment_router, prefix="/api/payments", tags=["Payments"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(log_router, prefix="/api/logs", tags=["Logs"])
app.include_router(client_router, prefix="/api/clients", tags=["Clients"])
app.include_router(route_router, prefix="/api/routes", tags=["Routes"])  # ✅ Use route_router
app.include_router(branch_router, prefix="/api/branches", tags=["Branches"])
app.include_router(party_router, prefix="/api/parties", tags=["Parties"])
app.include_router(city_router, prefix="/api/cities", tags=["Cities"])
app.include_router(
    expenses_router,
    prefix="/api/expenses",
    tags=["Expenses"]
)
@app.get("/")
def home():
    return {
        "message": "FleetChain Backend Running",
        "docs": "http://localhost:8000/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

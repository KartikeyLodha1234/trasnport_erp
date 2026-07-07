from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
driver_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')
vehicle_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')
shipment_bp = Blueprint('shipments', __name__, url_prefix='/api/shipments')
payment_bp = Blueprint('payments', __name__, url_prefix='/api/payments')
maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')
log_bp = Blueprint('logs', __name__, url_prefix='/api/logs')

# Import routes - ✅ ये सही तरीका है
from routes import auth_routes
from routes import driver_routes
from routes import vehicle_routes
from routes import shipment_routes
from routes import payment_routes
from routes import maintenance_routes
from routes import log_routes
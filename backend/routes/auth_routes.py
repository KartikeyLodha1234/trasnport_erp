# routes/auth_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
from database import Database
import os

router = APIRouter()
db = Database()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-456")
ALGORITHM = "HS256"

# ── Request model ──
class LoginRequest(BaseModel):
    email: str
    password: str

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(body: LoginRequest):
    email = body.email
    password = body.password

    # Admin check
    admin_email = os.getenv("ADMIN_EMAIL", "admin@cargomax.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if email == admin_email and password == admin_password:
        token = create_token({"email": email, "role": "admin", "name": "Admin"})
        return {
            "success": True,
            "message": "Admin login successful",
            "token": token,
            "role": "admin",
            "user": {"name": "Admin", "email": email, "role": "admin"}
        }

    # Driver check
    driver = db.authenticate_driver(email, password)
    if driver:
        token = create_token({
            "id": driver["id"],
            "email": driver["email"],
            "role": "driver",
            "name": driver["full_name"]
        })
        return {
            "success": True,
            "message": "Driver login successful",
            "token": token,
            "role": "driver",
            "user": {
                "id": driver["id"],
                "name": driver["full_name"],
                "email": driver["email"],
                "phone": driver["phone"],
                "role": "driver"
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")
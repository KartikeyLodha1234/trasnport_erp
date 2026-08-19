from fastapi import APIRouter
from pydantic import BaseModel
from database import db  # ← Yeh change karo (database_instance ki jagah database)
from jose import jwt
from datetime import datetime, timedelta
from config import Config

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    try:
        user = db.authenticate_driver(request.email, request.password)  # ← db use karo
        
        if not user:
            return {
                "success": False,
                "message": "Invalid credentials",
                "token": None,
                "role": None,
                "user": None
            }
        
        token_data = {
            "sub": user.get("email"),
            "id": user.get("id"),
            "role": user.get("role", "driver"),
            "exp": datetime.utcnow() + timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
        }
        
        token = jwt.encode(token_data, Config.JWT_SECRET_KEY, algorithm="HS256")
        
        return {
            "success": True,
            "token": token,
            "role": user.get("role", "driver"),
            "user": {
                "id": user.get("id"),
                "name": user.get("full_name", "User"),
                "email": user.get("email"),
                "phone": user.get("phone", ""),
                "role": user.get("role", "driver")
            },
            "message": "Login successful"
        }
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return {
            "success": False,
            "message": f"Server error: {str(e)}",
            "token": None,
            "role": None,
            "user": None
        }
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'my-secret-key-123')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-456')
    JWT_ACCESS_TOKEN_EXPIRES = 86400
    CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', '*']
    
    # MSSQL Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_NAME = os.getenv('DB_NAME', 'transport')
    DB_PORT = os.getenv('DB_PORT', '1433')
    DB_USER = os.getenv('DB_USER', 'SA')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'Password@12345')
    DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')

    # Admin
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@cargomax.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

    # AWS S3
    AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME', 'fleet-bucket')

    # Blockchain
    POLYGON_RPC_URL = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology')
    BACKEND_PRIVATE_KEY = os.getenv('BACKEND_PRIVATE_KEY', '')
    COMPLIANCE_VAULT_ADDRESS = os.getenv('COMPLIANCE_VAULT_ADDRESS', '')
    FLEET_ESCROW_ADDRESS = os.getenv('FLEET_ESCROW_ADDRESS', '')

    @staticmethod
    def get_connection_string():
        return (
            f"DRIVER={{{Config.DB_DRIVER}}};"
            f"SERVER={Config.DB_HOST},{Config.DB_PORT};"
            f"DATABASE={Config.DB_NAME};"
            f"UID={Config.DB_USER};"
            f"PWD={Config.DB_PASSWORD};"
            f"TrustServerCertificate=yes;"
        )
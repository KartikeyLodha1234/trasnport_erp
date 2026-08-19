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
    # Leave blank for a named SQL Server instance such as KRISH\SQLEXPRESS.
    DB_PORT = os.getenv('DB_PORT', '1434')
    DB_USER = os.getenv('DB_USER', 'sa')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'password@12345')
    DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')
    DB_TRUSTED_CONNECTION = os.getenv('DB_TRUSTED_CONNECTION', 'no').lower() in ('1', 'true', 'yes')
    DB_ENCRYPT = os.getenv('DB_ENCRYPT', 'no')

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
        server = Config.DB_HOST if not Config.DB_PORT else f"{Config.DB_HOST},{Config.DB_PORT}"
        credentials = (
            "Trusted_Connection=yes;"
            if Config.DB_TRUSTED_CONNECTION
            else f"UID={Config.DB_USER};PWD={Config.DB_PASSWORD};"
        )
        return (
            f"DRIVER={{{Config.DB_DRIVER}}};"
            f"SERVER={server};"
            f"DATABASE={Config.DB_NAME};"
            f"{credentials}"
            f"Encrypt={Config.DB_ENCRYPT};"
            f"TrustServerCertificate=yes;"
        )

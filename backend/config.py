import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'my-secret-key-123')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-456')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)  # 24 hours
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'logistics_db')
    
    # Admin Configuration
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@cargomax.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
    
    # CORS Configuration
    CORS_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
        '*'
    ]
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = 'uploads/'
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
    
    # AWS S3 Configuration
    AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'DUMMY_KEY')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'DUMMY_SECRET')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME', 'my-fleet-bucket')
    
    # Web3 / Polygon Configuration
    POLYGON_RPC_URL = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology')
    BACKEND_API_PRIVATE_KEY = os.getenv('BACKEND_API_PRIVATE_KEY', '0x0000000000000000000000000000000000000000')
    COMPLIANCE_VAULT_ADDRESS = os.getenv('COMPLIANCE_VAULT_ADDRESS', '0x0000000000000000000000000000000000000000')
    
    @staticmethod
    def init_app(app):
        """Initialize app with configuration"""
        # Create upload folder if it doesn't exist
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)
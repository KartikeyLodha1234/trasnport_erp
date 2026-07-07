import boto3
import os
from botocore.exceptions import ClientError
from io import BytesIO

class S3Service:
    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'ap-south-1')
        self.access_key = os.getenv('AWS_ACCESS_KEY_ID', 'DUMMY_KEY')
        self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'DUMMY_SECRET')
        self.bucket_name = os.getenv('AWS_BUCKET_NAME', 'my-fleet-bucket')
        
        if self.access_key != 'DUMMY_KEY' and self.secret_key != 'DUMMY_SECRET':
            self.s3_client = boto3.client(
                's3',
                region_name=self.region,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key
            )
            print("✅ AWS S3 Client Initialized.")
        else:
            self.s3_client = None
            print("⚠️ AWS S3 Client: Running in Local Mock Mode.")
    
    def upload_file(self, file_data, file_name, folder='drivers'):
        """Upload a file to S3"""
        if not self.s3_client:
            # Mock upload
            return {
                'success': True,
                'url': f'https://{self.bucket_name}.s3.amazonaws.com/{folder}/{file_name}',
                'message': 'Mock upload'
            }
        
        try:
            key = f"{folder}/{file_name}"
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                key,
                ExtraArgs={'ACL': 'public-read'}
            )
            url = f"https://{self.bucket_name}.s3.amazonaws.com/{key}"
            return {'success': True, 'url': url}
        except ClientError as e:
            print(f"S3 upload error: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_file_url(self, file_key):
        """Get public URL for a file"""
        if not self.s3_client:
            return f"https://{self.bucket_name}.s3.amazonaws.com/{file_key}"
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=3600
            )
            return url
        except ClientError as e:
            print(f"Error generating URL: {e}")
            return None
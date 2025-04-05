import os
from pymongo import MongoClient

class Config:
    API_URL = "https://detect.roboflow.com"
    API_KEY = os.getenv('ROBOFLOW_API_KEY')
    MODEL_ID = "yolov8-3hm9w/1"

    SMTP_SERVER = 'smtp.gmail.com'
    SMTP_PORT = 587
    EMAIL_USER = os.getenv('Email')
    EMAIL_PASSWORD = os.getenv('Password')

    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # MongoDB Connection
    MONGO_URI = "mongodb://localhost:27017"
    DB_NAME = "UrbanFix"
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db["Users"]  # Ensure Users collection is initialized

# Ensure UPLOAD_DIR is accessible at the module level
UPLOAD_DIR = Config.UPLOAD_DIR

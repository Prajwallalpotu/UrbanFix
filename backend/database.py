import os
from pymongo import MongoClient

# MongoDB connection details
MONGO_URI = os.getenv('MONGO_URI')  # Use MONGO_URI from .env
DB_NAME = "UrbanFix"

# Initialize MongoDB client and database
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Access the Users collection
users_collection = db["Users"]

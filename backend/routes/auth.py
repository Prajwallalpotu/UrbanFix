from flask import Blueprint, request, jsonify
from config import Config
from werkzeug.security import check_password_hash
from bson.objectid import ObjectId

auth_bp = Blueprint("auth", __name__)
users_collection = Config.db["Users"]

# Ensure admin user exists
if not users_collection.find_one({"name": "admin"}):
    users_collection.insert_one({
        "name": "admin",
        "password": "admin",
        "user_id": str(ObjectId()),  # Generate user ID
        "role": "admin"
    })

@auth_bp.route("/auth/login", methods=["POST"])  # Ensure the route matches the frontend request
def login():
    data = request.json
    user = users_collection.find_one({"name": data.get("username")})

    if user and user["password"] == data.get("password"):  # No hashing for now
        return jsonify({"message": "Login successful", "user_id": user["user_id"]}), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

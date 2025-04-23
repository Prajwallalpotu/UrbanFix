from flask import Blueprint, request, jsonify
from config import Config
from bson.objectid import ObjectId
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)
users_collection = Config.db["Users"]

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email") or data.get("username")  # Support both "email" and "username" for admin
    password = data.get("password")

    # Allow admin login without DB check
    if email == "admin@example.com" and password == "admin":
        return jsonify({"message": "Login successful", "user_id": "admin"}), 200

    # Regular user authentication (check database)
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"message": "User not found"}), 401

        if check_password_hash(user["password"], password):
            return jsonify({"message": "Login successful", "user_id": user["user_id"]}), 200
        else:
            return jsonify({"message": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"message": "Database error", "error": str(e)}), 500

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required."}), 400

    try:
        # Check if the email is already registered
        if users_collection.find_one({"email": email}):
            return jsonify({"message": "Email is already registered."}), 400

        # Create a new user
        user_id = str(uuid.uuid4())
        new_user = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "password": generate_password_hash(password),  # Hash the password
            "role": "user"
        }
        users_collection.insert_one(new_user)
        return jsonify({"message": "User registered successfully.", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"message": "Error registering user.", "error": str(e)}), 500

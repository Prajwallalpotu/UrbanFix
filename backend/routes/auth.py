from flask import Blueprint, request, jsonify
from config import Config
from bson.objectid import ObjectId

auth_bp = Blueprint("auth", __name__)
users_collection = Config.db["Users"]

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Allow admin login without DB check
    if username == "admin" and password == "admin":
        return jsonify({"message": "Login successful", "user_id": "admin"}), 200

    # Regular user authentication (check database)
    try:
        user = users_collection.find_one({"name": username})
    except Exception as e:
        return jsonify({"message": "Database error"}), 500

    if user and user["password"] == password:
        return jsonify({"message": "Login successful", "user_id": user["user_id"]}), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

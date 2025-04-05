from flask import Blueprint, jsonify, request
from config import Config
from bson.objectid import ObjectId

user_bp = Blueprint("user", __name__)
users_collection = Config.db["Users"]

@user_bp.route("/user/profile/<user_id>", methods=["GET"]) 
def get_profile(user_id):
    try:
        # Special case for admin user
        if user_id == "admin":
            return jsonify({
                "user_id": "admin",
                "name": "Administrator",
                "email": "admin@example.com",  # Add email for admin
                "role": "admin"
            }), 200

        user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
        
        if user:
            return jsonify(user), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@user_bp.route("/user/profile/<user_id>", methods=["PUT"])
def update_profile(user_id):
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")

        if not name or not email:
            return jsonify({"message": "All fields are required."}), 400

        result = users_collection.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "email": email}}
        )

        if result.matched_count == 0:
            return jsonify({"message": "User not found."}), 404

        return jsonify({"message": "Profile updated successfully."}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
@user_bp.route("/user/complaints/<user_id>", methods=["GET"])
def get_complaints(user_id):
    try:
        user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "complaints": 1})
        if not user or "complaints" not in user or not user["complaints"]:
            return jsonify({"message": "No complaints yet"}), 200
        return jsonify({"complaints": user["complaints"]}), 200
    except Exception as e:
        return jsonify({"message": "Error in fetching data: " + str(e)}), 500

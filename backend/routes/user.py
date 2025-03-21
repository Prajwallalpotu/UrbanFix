from flask import Blueprint, jsonify, request
from config import Config
from bson.objectid import ObjectId

user_bp = Blueprint("user", __name__)
users_collection = Config.db["Users"]

@user_bp.route("/user/profile/<user_id>", methods=["GET"]) 
def get_profile(user_id):
    try:
        user = users_collection.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
        
        if user:
            return jsonify(user), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

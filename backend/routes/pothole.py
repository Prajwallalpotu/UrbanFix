from flask import Blueprint, request, jsonify
import logging
import os
import uuid
import cv2
import numpy as np
import base64
from utils.detection import infer_on_image
from utils.email import send_email
from config import UPLOAD_DIR

pothole_bp = Blueprint('pothole', __name__)
logger = logging.getLogger(__name__)

@pothole_bp.route('/detect', methods=['POST'])
def detect_potholes():
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    latitude = request.form.get('latitude', 'Unknown')
    longitude = request.form.get('longitude', 'Unknown')
    logger.info(f"Received image with coordinates: {latitude}, {longitude}")

    if file.filename == '':
        logger.error("No file selected for uploading")
        return jsonify({"error": "No file selected for uploading"}), 400

    try:
        file_content = file.read()
        logger.info(f'File content length: {len(file_content)}')

        if not file_content:
            logger.error("File content is empty")
            return jsonify({"error": "File content is empty"}), 400

        result, temp_image_path = infer_on_image(file_content)
        logger.info(f'Inference result: {result}')

        np_img = np.frombuffer(file_content, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            logger.error("Failed to decode image")
            return jsonify({"error": "Failed to decode image"}), 400

        predictions = result.get('predictions', [])
        logger.info(f"Processing {len(predictions)} predictions")
        
        for prediction in predictions:
            x, y = prediction['x'], prediction['y']
            w, h = prediction['width'], prediction['height']
            confidence = prediction['confidence']
            class_name = prediction['class']
            top_left = (int(x - w / 2), int(y - h / 2))
            bottom_right = (int(x + w / 2), int(y + h / 2))
            cv2.rectangle(image, top_left, bottom_right, (0, 255, 0), 2)
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(image, label, (top_left[0], top_left[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        processed_img_filename = f'processed_{uuid.uuid4()}.jpg'
        processed_img_path = os.path.join(UPLOAD_DIR, processed_img_filename)
        cv2.imwrite(processed_img_path, image)
        logger.info(f"Saved processed image to {processed_img_path}")

        _, buffer = cv2.imencode('.jpg', image)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        img_data_url = f"data:image/jpeg;base64,{img_base64}"

        response_data = {
            "potholesDetected": len(predictions) > 0,
            "detectionsCount": len(predictions),
            "imageUrl": img_data_url,
            "processedImagePath": processed_img_path,
            "message": "Potholes detected" if len(predictions) > 0 else "No potholes found"
        }
        
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error during detection: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@pothole_bp.route('/send-email', methods=['POST'])
def send_email_endpoint():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        message = data.get('message', '')
        latitude = data.get('latitude', 'Unknown')
        longitude = data.get('longitude', 'Unknown')
        image_id = data.get('imageId', '')

        if not image_id:
            processed_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith('processed_')]
            if processed_files:
                processed_files.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOAD_DIR, x)), reverse=True)
                image_path = os.path.join(UPLOAD_DIR, processed_files[0])
            else:
                return jsonify({"error": "No processed image found"}), 400
        else:
            processed_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith('processed_')]
            if processed_files:
                image_path = os.path.join(UPLOAD_DIR, processed_files[0])
            else:
                return jsonify({"error": "No processed image found"}), 400
        
        result = send_email(image_path, message, latitude, longitude)
        
        if "error" in result:
            return jsonify(result), 500
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error sending email: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

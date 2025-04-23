# --- START OF FILE pothole.py ---

from flask import Blueprint, request, jsonify
import logging
import os
import uuid
import cv2
import numpy as np
import base64
from utils.detection import infer_on_image # Assuming this returns detections correctly
from utils.email import send_email
from config import UPLOAD_DIR
# from bson.objectid import ObjectId # Not used in detect_potholes
from datetime import datetime
from database import users_collection # Used in send_email_endpoint
from collections import Counter

# Get a logger specific to this blueprint
pothole_bp = Blueprint('pothole', __name__)
logger = logging.getLogger(__name__) # Ensures logs from this file are tagged correctly
logger.setLevel(logging.DEBUG) # Ensure this logger specifically handles DEBUG messages

# --- Severity Thresholds (Relative Area and Confidence) ---
SEVERITY_THRESHOLDS = {
    "Minor": {"area": 0.01, "confidence": 0.3},    # Small area or low confidence
    "Moderate": {"area": 0.05, "confidence": 0.6}, # Medium area and moderate confidence
    "Severe": {"area": 1.0, "confidence": 0.8}     # Large area or high confidence
}
# --- ---

# --- Severity Colors (BGR format for OpenCV) ---
SEVERITY_COLORS = {
    "Minor": (0, 255, 0),      # Green
    "Moderate": (0, 165, 255), # Orange
    "Severe": (0, 0, 255)      # Red
}
# --- ---

def get_severity(bbox_area, img_area, confidence):
    """Determines severity based on relative area and confidence score."""
    if img_area == 0: # Avoid division by zero
        logger.warning("Image area is zero, cannot calculate severity.")
        return "Unknown"
    relative_area = bbox_area / img_area
    logger.debug(f"Calculating severity: BBox Area={bbox_area:.2f}, Img Area={img_area:.2f}, Relative Area={relative_area:.6f}, Confidence={confidence:.2f}")
    if relative_area >= SEVERITY_THRESHOLDS["Severe"]["area"] or confidence >= SEVERITY_THRESHOLDS["Severe"]["confidence"]:
        severity = "Severe"
    elif relative_area >= SEVERITY_THRESHOLDS["Moderate"]["area"] and confidence >= SEVERITY_THRESHOLDS["Moderate"]["confidence"]:
        severity = "Moderate"
    else:
        severity = "Minor"
    logger.debug(f"Determined Severity: {severity}")
    return severity

@pothole_bp.route('/detect', methods=['POST'])
def detect_potholes():
    logger.info("Received request for /detect endpoint.")
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    latitude = request.form.get('latitude', 'Unknown')
    longitude = request.form.get('longitude', 'Unknown')
    logger.info(f"Received image upload request. Filename: '{file.filename}', Coordinates: Lat={latitude}, Lon={longitude}")

    if file.filename == '':
        logger.error("No file selected for uploading (filename is empty)")
        return jsonify({"error": "No file selected for uploading"}), 400

    try:
        file_content = file.read()
        file_size = len(file_content)
        logger.info(f'Read file content, size: {file_size} bytes')

        if not file_content:
            logger.error("File content is empty after reading")
            return jsonify({"error": "File content is empty"}), 400

        # --- Run Inference ---
        logger.debug("Calling infer_on_image...")
        result, temp_image_path = infer_on_image(file_content)
        logger.debug(f"infer_on_image returned result type: {type(result)}")
        if isinstance(result, dict):
            logger.debug(f"Inference result keys: {result.keys()}")
            # Log a sample of the predictions if they exist
            if 'predictions' in result and isinstance(result['predictions'], list) and result['predictions']:
                logger.debug(f"Sample prediction data (first one): {result['predictions'][0]}")
            elif 'predictions' in result:
                logger.debug(f"Prediction data type: {type(result['predictions'])}")
            else:
                logger.debug("No 'predictions' key in inference result.")
        else:
            logger.warning("Inference result was not a dictionary.")


        # --- Decode Image for Processing and Drawing ---
        logger.debug("Decoding image buffer with OpenCV...")
        np_img = np.frombuffer(file_content, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            logger.error("cv2.imdecode failed to decode image buffer.")
            return jsonify({"error": "Invalid image format or failed to decode"}), 400
        logger.info(f"Image decoded successfully. Shape: {image.shape}")

        # --- Get Image Dimensions ---
        img_height, img_width = image.shape[:2]
        img_area = float(img_height * img_width)
        logger.debug(f"Image Dimensions: Width={img_width}, Height={img_height}, Area={img_area}")
        if img_area == 0:
            logger.warning("Image area calculated as zero. Severity calculation will fail.")


        predictions = result.get('predictions', [])
        if not isinstance(predictions, list):
            logger.error(f"Expected 'predictions' to be a list, but got {type(predictions)}. Processing cannot continue.")
            predictions = [] # Fallback to empty list

        logger.info(f"Processing {len(predictions)} predictions found in inference result.")

        # --- Store Severity Counts ---
        severity_counts = Counter()
        processed_predictions_data = [] # Store predictions with severity info for the response
        # --- ---

        # --- Draw on Image ---
        logger.debug("Starting loop to draw predictions on image...")
        for i, prediction in enumerate(predictions):
            logger.debug(f"--- Processing Prediction #{i+1} ---")
            logger.debug(f"Raw prediction data: {prediction}")

            # Basic validation of prediction structure
            if not isinstance(prediction, dict) or not all(k in prediction for k in ['x', 'y', 'width', 'height', 'confidence', 'class']):
                logger.warning(f"Skipping prediction #{i+1} due to invalid structure or missing keys: {prediction}")
                continue

            try:
                # Extract and validate data types
                x = float(prediction['x'])
                y = float(prediction['y'])
                w = float(prediction['width'])
                h = float(prediction['height'])
                confidence = float(prediction['confidence'])
                class_name = str(prediction['class']) # Ensure class name is string

                logger.debug(f"Prediction #{i+1}: x={x:.2f}, y={y:.2f}, w={w:.2f}, h={h:.2f}, conf={confidence:.2f}, class='{class_name}'")

                # --- Calculate BBox Area and Severity ---
                bbox_area = w * h
                if bbox_area <= 0 or w <= 0 or h <= 0:
                    logger.warning(f"Prediction #{i+1}: Invalid dimensions (w={w}, h={h}), skipping severity calculation and drawing.")
                    continue

                severity = get_severity(bbox_area, img_area, confidence) # This logs internally now
                severity_counts[severity] += 1
                prediction['severity'] = severity # Add severity to the data we'll return in JSON
                processed_predictions_data.append(prediction)


                # --- Get Bounding Box Coords ---
                x_min = int(x - w / 2)
                y_min = int(y - h / 2)
                x_max = int(x + w / 2)
                y_max = int(y + h / 2)
                top_left = (x_min, y_min)
                bottom_right = (x_max, y_max)
                logger.debug(f"Prediction #{i+1}: Calculated Box Coords: top_left={top_left}, bottom_right={bottom_right}")

                # --- Get Color and Label ---
                color = SEVERITY_COLORS.get(severity, (255, 255, 255)) # Default to white if severity unknown
                label = f"{class_name} ({severity} {confidence:.2f})"
                logger.debug(f"Prediction #{i+1}: Label='{label}', Color={color} (BGR)")

                # --- Draw Rectangle ---
                logger.debug(f"Prediction #{i+1}: Drawing rectangle...")
                cv2.rectangle(image, top_left, bottom_right, color, 2) # Thickness 2

                # --- Draw Label Text with Background ---
                logger.debug(f"Prediction #{i+1}: Calculating text size for label...")
                (label_width, label_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                logger.debug(f"Prediction #{i+1}: Text size: width={label_width}, height={label_height}, baseline={baseline}")

                # Position label slightly above the box, handle top edge collision
                label_y_pos = max(y_min - 10, label_height + 10) # Ensure text isn't cut off at top
                label_x_pos = x_min
                logger.debug(f"Prediction #{i+1}: Calculated Label Position: x={label_x_pos}, y={label_y_pos}")

                # Draw background rectangle for text
                cv2.rectangle(
                    image,
                    (label_x_pos, label_y_pos - label_height - 5),
                    (label_x_pos + label_width, label_y_pos + 5),
                    color,
                    -1  # Fill rectangle
                )

                # Draw the actual text
                logger.debug(f"Prediction #{i+1}: Drawing text label...")
                cv2.putText(image, label, (label_x_pos, label_y_pos), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2) # White text
                logger.debug(f"Prediction #{i+1}: Successfully drawn box and label.")

            except (TypeError, KeyError, ValueError) as draw_err:
                logger.error(f"Error processing/drawing prediction #{i+1}: {prediction}. Error: {draw_err}", exc_info=True)
                continue # Skip this prediction and proceed with others
        # --- End Drawing Loop ---
        logger.debug("Finished processing and drawing all valid predictions.")


        # --- Save and Encode Processed Image ---
        processed_img_filename = f'processed_{uuid.uuid4()}.jpg'
        processed_img_path = os.path.join(UPLOAD_DIR, processed_img_filename)
        save_success = False
        try:
            logger.debug(f"Attempting to save processed image to: {processed_img_path}")
            save_success = cv2.imwrite(processed_img_path, image)
            if not save_success:
                logger.error(f"cv2.imwrite failed to save image to {processed_img_path}. Check permissions and path validity.")
            else:
                logger.info(f"Saved processed image with detections to {processed_img_path}")
        except Exception as imwrite_err:
            logger.error(f"Exception during cv2.imwrite to {processed_img_path}: {imwrite_err}", exc_info=True)


        logger.debug("Encoding processed image to base64...")
        _, buffer = cv2.imencode('.jpg', image)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        img_data_url = f"data:image/jpeg;base64,{img_base64}"
        logger.debug(f"Encoded image to data URL (length: {len(img_data_url)})")
        # --- ---

        # --- Prepare Response ---
        potholes_found = len(processed_predictions_data) > 0 # Base on actually processed predictions
        message = "No potholes found or processed."
        if potholes_found:
            severity_summary = ", ".join([f"{count} {sev}" for sev, count in sorted(severity_counts.items())]) # Sort for consistent order
            message = f"Potholes detected: {severity_summary}"
            if len(predictions) != len(processed_predictions_data):
                message += f" ({len(predictions) - len(processed_predictions_data)} original predictions skipped due to errors)."


        response_data = {
            "potholesDetected": potholes_found,
            "detectionsCount": len(processed_predictions_data),
            "severityCounts": dict(severity_counts),
            "predictions": processed_predictions_data,
            "imageUrl": img_data_url, # Crucial: this MUST contain the drawings
            "processedImagePath": processed_img_path if save_success else None,
            "message": message
        }
        logger.debug(f"Prepared JSON response data: {response_data}")
        # --- ---

        logger.info("Detection process completed successfully. Sending JSON response.")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Unhandled error during detection endpoint processing: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred during pothole detection."}), 500


# ============================================================
# == send_email_endpoint - Logging added for context ==
# ============================================================
@pothole_bp.route('/send-email', methods=['POST'])
def send_email_endpoint():
    logger.info("Received request for /send-email endpoint.")
    try:
        data = request.json
        if not data:
            logger.warning("Send-email request received with no JSON data.")
            return jsonify({"error": "No data provided"}), 400
        logger.debug(f"Received email data: {data}")

        message = data.get('message', '')
        latitude = data.get('latitude', 'Unknown')
        longitude = data.get('longitude', 'Unknown')
        user_id = request.headers.get('User-Id')
        logger.debug(f"User-Id from header: {user_id}")

        if not user_id:
            logger.warning("Send-email request received without User-Id header.")
            return jsonify({"error": "User ID is required"}), 400

        # --- Finding the image path (using the potentially flawed 'latest' method) ---
        image_path = None
        try:
            logger.debug(f"Searching for processed images in UPLOAD_DIR: {UPLOAD_DIR}")
            processed_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith('processed_') and f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if not processed_files:
                logger.error("No processed image found in UPLOAD_DIR for sending email.")
                return jsonify({"error": "No processed image found to send"}), 400

            processed_files.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOAD_DIR, x)), reverse=True)
            image_path = os.path.join(UPLOAD_DIR, processed_files[0])
            logger.info(f"Using latest processed image for email: {image_path}")

            if not os.path.exists(image_path):
                logger.error(f"Latest processed image path determined ({image_path}), but file does not exist.")
                return jsonify({"error": "Could not find the image file to attach."}), 404
            logger.debug(f"Confirmed image file exists at: {image_path}")

        except OSError as dir_err:
            logger.error(f"Error accessing UPLOAD_DIR ({UPLOAD_DIR}): {dir_err}", exc_info=True)
            return jsonify({"error": "Server error accessing image storage."}), 500
        # --- ---

        # --- Send email ---
        logger.info(f"Attempting to send email for user {user_id} with image {os.path.basename(image_path)}")
        result = send_email(image_path, message, latitude, longitude)
        logger.debug(f"send_email helper function returned: {result}")

        if isinstance(result, dict) and "error" in result:
            logger.error(f"Error sending email via helper function: {result.get('error', 'Unknown error')}")
            return jsonify({"error": f"Failed to send email: {result.get('error', 'details unavailable')}"}), 500
        elif result is False or result is None: # Handle boolean/None failure
            logger.error(f"send_email helper indicated failure (returned {result}).")
            return jsonify({"error": "Failed to send email due to an internal issue."}), 500

        logger.info("Email sending successful (based on helper function response).")
        # --- ---

        # --- Store complaint in the database ---
        complaint_id = str(uuid.uuid4())
        complaint_data = {
            "complaint_id": complaint_id,
            "image_path": image_path, # Store the specific path used
            "latitude": latitude,
            "longitude": longitude,
            "message": message,
            "timestamp": datetime.utcnow()
        }
        logger.debug(f"Preparing to log complaint data: {complaint_data}")

        try:
            update_result = users_collection.update_one(
                {"user_id": user_id},
                {"$push": {"complaints": complaint_data}},
                upsert=True
            )
            logger.info(f"Complaint logged for user {user_id}. DB Op Details: Matched={update_result.matched_count}, Modified={update_result.modified_count}, UpsertedId={update_result.upserted_id}")
        except Exception as db_err:
            logger.error(f"Failed to store complaint in database for user {user_id}: {db_err}", exc_info=True)
            # Return success but indicate DB logging failure
            return jsonify({"success": True, "message": "Email sent, but failed to log complaint history.", "complaint_id": None, "db_error": str(db_err)}), 207

        # --- ---
        logger.info(f"Email sent and complaint logged successfully. Complaint ID: {complaint_id}")
        return jsonify({"success": True, "message": "Email sent and complaint logged successfully", "complaint_id": complaint_id})

    except Exception as e:
        logger.error(f"Unhandled error in send-email endpoint: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected server error occurred while sending the report: {str(e)}"}), 500

@pothole_bp.route('/locations', methods=['GET'])
def get_pothole_locations():
    try:
        all_users = users_collection.find({}, {"complaints": 1, "_id": 0})
        locations = []
        
        for user in all_users:
            if "complaints" in user:
                for complaint in user["complaints"]:
                    if "latitude" in complaint and "longitude" in complaint:
                        locations.append({
                            "latitude": complaint["latitude"],
                            "longitude": complaint["longitude"],
                            "message": complaint.get("message", ""),
                            "timestamp": complaint.get("timestamp", ""),
                            "severity": complaint.get("severity", "Unknown"),
                            "status": complaint.get("status", "Pending")
                        })
        
        return jsonify({"locations": locations})
    except Exception as e:
        logger.error(f"Error fetching pothole locations: {e}")
        return jsonify({"error": "Failed to fetch pothole locations"}), 500

# --- END OF FILE pothole.py ---
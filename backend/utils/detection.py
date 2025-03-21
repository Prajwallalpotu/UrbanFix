import os
import uuid
import logging
from inference_sdk import InferenceHTTPClient
from config import Config

logger = logging.getLogger(__name__)
client = InferenceHTTPClient(api_url=Config.API_URL, api_key=Config.API_KEY)

def infer_on_image(file_content):
    image_path = os.path.join(Config.UPLOAD_DIR, f'temp_image_{uuid.uuid4()}.jpg')
    with open(image_path, 'wb') as temp_file:
        temp_file.write(file_content)

    logger.info(f"Saved temporary image to {image_path}")

    try:
        result = client.infer(image_path, model_id=Config.MODEL_ID)
        if not isinstance(result, dict):
            raise ValueError("Inference did not return a valid dictionary response")
        
        predictions_count = len(result.get('predictions', []))
        logger.info(f"Inference completed with {predictions_count} predictions")
        return result, image_path

    except Exception as e:
        logger.error(f"Inference failed: {e}")
        os.remove(image_path)
        return {}, image_path

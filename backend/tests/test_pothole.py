import unittest
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_URL = os.getenv("BASE_URL")

class PotholeTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not BASE_URL:
            raise ValueError("BASE_URL is not set. Please check your .env file.")

    def test_detect_potholes(self):
        file_path = './uploads/temp_image_2d37a6f3-d819-47bc-bba6-14626f50318f.jpg'
        if not os.path.exists(file_path):
            self.skipTest(f"File not found: {file_path}")
        with open(file_path, 'rb') as file:
            files = {'file': file}
            data = {'latitude': '12.9716', 'longitude': '77.5946'}
            response = requests.post(f"{BASE_URL}/detect", files=files, data=data)
            self.assertEqual(response.status_code, 200)
            self.assertIn("potholesDetected", response.json())

    def test_send_email(self):
        response = requests.post(f"{BASE_URL}/send-email", json={
            "message": "Test message",
            "latitude": "12.9716",
            "longitude": "77.5946",
            "imageId": "test_image_id"
        }, headers={"User-Id": "test_user_id"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json())

if __name__ == '__main__':
    unittest.main()

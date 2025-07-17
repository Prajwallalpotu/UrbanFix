import unittest
import requests

import os

BASE_URL = "http://localhost:5001"

class FunctionalTests(unittest.TestCase):

    def test_login(self):
        response = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@example.com", "password": "admin"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("user_id", response.json())

    def test_get_profile(self):
        user_id = "admin"  # Use "admin" as the test user ID
        response = requests.get(f"{BASE_URL}/user/profile/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("user_id", response.json())

    def test_detect_potholes(self):
        files = {'file': open('./uploads/temp_image_70799a2c-ed1b-42db-b1f0-c80093a34ef1.jpg', 'rb')}
        data = {'latitude': '12.9716', 'longitude': '77.5946'}
        response = requests.post(f"{BASE_URL}/detect", files=files, data=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("potholesDetected", response.json())

if __name__ == '__main__':
    unittest.main()

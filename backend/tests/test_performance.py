import unittest
import requests
import time
import os

BASE_URL = os.getenv("BASE_URL")

class PerformanceTests(unittest.TestCase):

    def test_login_performance(self):
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
        end_time = time.time()
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 1)  # Response time should be less than 1 second

    def test_detect_potholes_performance(self):
        files = {'file': open('./uploads/temp_image_6e7627d6-8a7a-49ca-8d22-00f0e2440c20.jpg', 'rb')}
        data = {'latitude': '12.9716', 'longitude': '77.5946'}
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/detect", files=files, data=data)
        end_time = time.time()
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 5)  # Response time should be less than 5 seconds

if __name__ == '__main__':
    unittest.main()

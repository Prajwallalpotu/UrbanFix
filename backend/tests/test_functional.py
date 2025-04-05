import unittest
import requests

BASE_URL = "http://localhost:5001"

class FunctionalTests(unittest.TestCase):

    def test_login(self):
        response = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("user_id", response.json())

    def test_get_profile(self):
        user_id = "67dc64eddf25608bb0abdf49"
        response = requests.get(f"{BASE_URL}/user/profile/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("user_id", response.json())

    def test_detect_potholes(self):
        files = {'file': open('./uploads/temp_image_6e7627d6-8a7a-49ca-8d22-00f0e2440c20.jpg', 'rb')}
        data = {'latitude': '12.9716', 'longitude': '77.5946'}
        response = requests.post(f"{BASE_URL}/detect", files=files, data=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("potholesDetected", response.json())

if __name__ == '__main__':
    unittest.main()

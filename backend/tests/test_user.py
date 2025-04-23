import unittest
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_URL = os.getenv("BASE_URL")

class UserTests(unittest.TestCase):

    def test_get_profile(self):
        user_id = "test_user_id"
        response = requests.get(f"{BASE_URL}/user/profile/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("name", response.json())

    def test_update_profile(self):
        user_id = "test_user_id"
        response = requests.put(f"{BASE_URL}/user/profile/{user_id}", json={
            "name": "Updated Name",
            "email": "updatedemail@example.com"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

if __name__ == '__main__':
    unittest.main()

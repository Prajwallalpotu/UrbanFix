import unittest
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_URL = os.getenv("BASE_URL")

class AuthTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure test user exists
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": "testuser@example.com",
            "password": "password123",
            "name": "Test User"
        })

    def test_register_user(self):
        response = requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "password123"
        })
        if response.status_code == 400:  # Handle already registered case
            self.assertIn("Email is already registered", response.json()["message"])
        else:
            self.assertEqual(response.status_code, 201)
            self.assertIn("user_id", response.json())

    def test_login_user(self):
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "testuser@example.com",
            "password": "password123"
        })
        self.assertEqual(response.status_code, 200)

    def test_login_invalid_user(self):
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn("message", response.json())

if __name__ == '__main__':
    unittest.main()

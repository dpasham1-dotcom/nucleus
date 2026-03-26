import os
from google import genai

api_key = "AIzaSyBwHZ6_LZtR-WvdBmPx4FknAa8lSQ6GfGs"
client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print("FAILED with Exception:", type(e).__name__)
    print("Error Details:", str(e))

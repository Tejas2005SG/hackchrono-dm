from motor.motor_asyncio import AsyncIOMotorClient

import os

MONGO_DETAILS = "mongodb+srv://tbhangale9:fikJx8lCxmfXIzXt@devai.2jrgv4y.mongodb.net/?retryWrites=true&w=majority&appName=devai"
print("Mongodb connected successfully")

client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.get_database("test")
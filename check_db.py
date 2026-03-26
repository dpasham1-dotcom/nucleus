import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(".env")

async def test_db():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client["nucleus"]
    
    # Check for indexes
    indexes = await db.user_sessions.index_information()
    print("user_sessions indexes:", indexes)
    
asyncio.run(test_db())

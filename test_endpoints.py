import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os

MONGO_URL = "mongodb+srv://dpasham1_db_user:vPpJKM4pxmKH6sU2@nucleus-db.0ptund6.mongodb.net/?appName=nucleus-db"
client = AsyncIOMotorClient(MONGO_URL)
db = client["test_database"] # Based on .env

async def test_week_summary():
    user_id = "test_user_123" # Mock
    today = datetime.now(timezone.utc).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    
    logs = await db.calorie_logs.find(
        {"user_id": user_id, "date": {"$in": dates}},
        {"_id": 0}
    ).to_list(100)
    
    weight_logs = await db.weight_logs.find(
        {"user_id": user_id, "date": {"$in": dates}},
        {"_id": 0}
    ).to_list(100)
    
    weights_by_date = {w["date"]: w["weight"] for w in weight_logs}
    
    summary = []
    for d in dates:
        day_logs = [l for l in logs if l.get("date") == d]
        cals = sum(l.get("calories", 0) or 0 for l in day_logs)
        summary.append({
            "date": d,
            "calories": cals,
            "weight": weights_by_date.get(d)
        })
    print("test_week_summary OK:", len(summary))

async def test_recent_meals():
    user_id = "test_user_123"
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$description",
            "meal_type": {"$first": "$meal_type"},
            "calories": {"$first": "$calories"},
            "protein": {"$first": "$protein"},
            "carbs": {"$first": "$carbs"},
            "fat": {"$first": "$fat"},
            "last_eaten": {"$first": "$date"}
        }},
        {"$sort": {"last_eaten": -1}},
        {"$limit": 50}
    ]
    recent_meals = await db.calorie_logs.aggregate(pipeline).to_list(100)
    print("test_recent_meals OK:", len(recent_meals))

async def test_daily_summary():
    date = "2026-03-24"
    user_id = "test_user_123"
    
    logs = await db.calorie_logs.find(
        {"user_id": user_id, "date": date},
        {"_id": 0}
    ).to_list(100)
    
    weight_log = await db.weight_logs.find_one({"user_id": user_id, "date": date}, {"_id": 0})
    current_weight = weight_log.get("weight") if weight_log else None
    
    total_calories = sum(l.get("calories", 0) or 0 for l in logs)
    print("test_daily_summary OK:", current_weight, total_calories)

async def main():
    try:
        await test_week_summary()
        await test_recent_meals()
        await test_daily_summary()
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())

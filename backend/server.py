from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AI SERVICE ====================

class AIService:
    """AI service layer with caching for Gemini API calls"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        self.provider = os.environ.get('AI_PROVIDER', 'gemini')
        self.model = os.environ.get('AI_MODEL', 'gemini-2.0-flash')
    
    def _get_cache_key(self, prompt: str, feature: str) -> str:
        """Generate cache key from prompt and feature"""
        content = f"{feature}:{prompt}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _get_cached_response(self, cache_key: str) -> Optional[str]:
        """Check MongoDB cache for existing response"""
        cached = await db.ai_cache.find_one(
            {"cache_key": cache_key},
            {"_id": 0}
        )
        if cached:
            return cached.get("response")
        return None
    
    async def _cache_response(self, cache_key: str, prompt: str, response: str, feature: str):
        """Store response in MongoDB cache"""
        await db.ai_cache.update_one(
            {"cache_key": cache_key},
            {"$set": {
                "cache_key": cache_key,
                "prompt": prompt,
                "response": response,
                "feature": feature,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    
    async def generate(self, prompt: str, feature: str, system_prompt: str = None) -> str:
        """Generate AI response with caching"""
        cache_key = self._get_cache_key(prompt, feature)
        
        # Check cache first
        cached = await self._get_cached_response(cache_key)
        if cached:
            logger.info(f"AI cache hit for feature: {feature}")
            return cached
        
        # Call AI API
        try:
            from google import genai
            
            client = genai.Client(api_key=self.api_key)
            
            # Combine system prompt with user prompt since basic generate_content is simpler
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"
                
            response = client.models.generate_content(
                model=self.model,
                contents=full_prompt,
            )
            
            response_text = response.text
            
            # Cache the response
            await self._cache_response(cache_key, prompt, response_text, feature)
            
            return response_text
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

ai_service = AIService()

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Habit Models
class HabitCreate(BaseModel):
    name: str
    color: str = "#7C9A6E"
    icon: str = "check"
    group: str = "Morning"
    why_started: Optional[str] = None

class Habit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    habit_id: str = Field(default_factory=lambda: f"habit_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    color: str = "#7C9A6E"
    icon: str = "check"
    group: str = "Morning"
    why_started: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completions: List[str] = []
    freeze_days: List[str] = []

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    group: Optional[str] = None
    why_started: Optional[str] = None

class HabitCompletion(BaseModel):
    date: str
    completed: bool
    freeze: bool = False

# Task Models
class TaskCreate(BaseModel):
    title: str
    estimated_time: Optional[int] = None
    priority: str = "medium"
    tags: List[str] = []
    scheduled_time: Optional[str] = None
    date: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    estimated_time: Optional[int] = None
    priority: str = "medium"
    tags: List[str] = []
    scheduled_time: Optional[str] = None
    date: str
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    estimated_time: Optional[int] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    scheduled_time: Optional[str] = None
    date: Optional[str] = None
    completed: Optional[bool] = None

# Brain Dump Model
class BrainDumpItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str = Field(default_factory=lambda: f"dump_{uuid.uuid4().hex[:12]}")
    user_id: str
    text: str
    date: str
    processed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrainDumpCreate(BaseModel):
    text: str
    date: str

# Daily Intention Model
class IntentionUpdate(BaseModel):
    intention: str

# Link Vault Models
class LinkCreate(BaseModel):
    url: str
    title: str
    category: str = "resource"  # job-lead, article, resource, tool, inspiration, watch-later
    source: str = "manual"  # linkedin, twitter, whatsapp, reddit, newsletter, manual
    note: Optional[str] = None
    company: Optional[str] = None  # for job leads
    role: Optional[str] = None  # for job leads
    deadline: Optional[str] = None  # for job leads
    tags: List[str] = []

class Link(BaseModel):
    model_config = ConfigDict(extra="ignore")
    link_id: str = Field(default_factory=lambda: f"link_{uuid.uuid4().hex[:12]}")
    user_id: str
    url: str
    title: str
    category: str = "resource"
    source: str = "manual"
    status: str = "saved"  # saved, reviewed, applied, read, archived
    note: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[List[str]] = None

# Calorie Tracker Models
class CalorieLogCreate(BaseModel):
    description: str
    date: str
    meal_type: str = "meal"  # breakfast, lunch, dinner, snack, meal

class CalorieLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    log_id: str = Field(default_factory=lambda: f"cal_{uuid.uuid4().hex[:12]}")
    user_id: str
    description: str
    date: str
    meal_type: str = "meal"
    calories: Optional[int] = None
    protein: Optional[int] = None
    carbs: Optional[int] = None
    fat: Optional[int] = None
    ai_analysis: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Daily Weight Models
class WeightLogCreate(BaseModel):
    weight: float
    date: str

class WeightLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    weight_id: str = Field(default_factory=lambda: f"weight_{uuid.uuid4().hex[:12]}")
    user_id: str
    weight: float
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Vocabulary Models
class WordCreate(BaseModel):
    word: str
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    source_context: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []

class Word(BaseModel):
    model_config = ConfigDict(extra="ignore")
    word_id: str = Field(default_factory=lambda: f"word_{uuid.uuid4().hex[:12]}")
    user_id: str
    word: str
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    usage_tips: Optional[str] = None
    source_context: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    mastery_level: str = "new"  # new, familiar, owned
    used_in_writing: bool = False
    used_in_speech: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WordUpdate(BaseModel):
    definition: Optional[str] = None
    example_sentence: Optional[str] = None
    usage_tips: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    mastery_level: Optional[str] = None
    used_in_writing: Optional[bool] = None
    used_in_speech: Optional[bool] = None

# Ideas Models
class IdeaCreate(BaseModel):
    title: str
    content: Optional[str] = None
    tags: List[str] = []
    idea_type: str = "raw"  # raw, blog-post, project, business, personal, career, random

class Idea(BaseModel):
    model_config = ConfigDict(extra="ignore")
    idea_id: str = Field(default_factory=lambda: f"idea_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    content: Optional[str] = None
    tags: List[str] = []
    idea_type: str = "raw"
    status: str = "raw"  # raw, exploring, in-progress, shipped, archived
    starred: bool = False
    linked_ideas: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    idea_type: Optional[str] = None
    status: Optional[str] = None
    starred: Optional[bool] = None
    linked_ideas: Optional[List[str]] = None

# BQ Practice Models
class BQQuestionCreate(BaseModel):
    question: str
    theme: str = "general"  # problem-solving, teamwork, leadership, failure, growth, conflict, goals

class BQQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str = Field(default_factory=lambda: f"bq_{uuid.uuid4().hex[:12]}")
    user_id: str
    question: str
    theme: str = "general"
    is_custom: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class STARAnswerCreate(BaseModel):
    question_id: str
    question_text: str
    situation: str
    task: str
    action: str
    result: str
    tags: List[str] = []

class STARAnswer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    answer_id: str = Field(default_factory=lambda: f"star_{uuid.uuid4().hex[:12]}")
    user_id: str
    question_id: str
    question_text: str
    situation: str
    task: str
    action: str
    result: str
    tags: List[str] = []
    confidence: int = 3  # 1-5
    ai_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class STARAnswerUpdate(BaseModel):
    situation: Optional[str] = None
    task: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    tags: Optional[List[str]] = None
    confidence: Optional[int] = None
    ai_feedback: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Extract and validate the current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    auth_data = auth_response.json()
    email = auth_data.get("email")
    name = auth_data.get("name", "User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by auth provider")
    
    existing_user = await db.users.find_one(
        {"email": email},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user.get("user_id")
        if not user_id:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "user_id": user_id,
                "name": name,
                "picture": auth_data.get("picture")
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": auth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = auth_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    # Add token to response so frontend can save it in localStorage for mobile support
    user_doc["session_token"] = session_token
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== HABIT ROUTES ====================

@api_router.get("/habits", response_model=List[Habit])
async def get_habits(user: User = Depends(get_current_user)):
    habits = await db.habits.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return habits

@api_router.post("/habits", response_model=Habit)
async def create_habit(habit_data: HabitCreate, user: User = Depends(get_current_user)):
    habit = Habit(user_id=user.user_id, **habit_data.model_dump())
    habit_doc = habit.model_dump()
    habit_doc["created_at"] = habit_doc["created_at"].isoformat()
    await db.habits.insert_one(habit_doc)
    return habit

@api_router.put("/habits/{habit_id}", response_model=Habit)
async def update_habit(habit_id: str, habit_data: HabitUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in habit_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.habits.update_one(
        {"habit_id": habit_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    return habit

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: User = Depends(get_current_user)):
    result = await db.habits.delete_one({"habit_id": habit_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted"}

@api_router.post("/habits/{habit_id}/toggle")
async def toggle_habit_completion(habit_id: str, completion: HabitCompletion, user: User = Depends(get_current_user)):
    habit = await db.habits.find_one({"habit_id": habit_id, "user_id": user.user_id}, {"_id": 0})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    completions = habit.get("completions", [])
    freeze_days = habit.get("freeze_days", [])
    date_str = completion.date
    
    if completion.freeze:
        if date_str in freeze_days:
            freeze_days.remove(date_str)
        else:
            freeze_days.append(date_str)
            if date_str in completions:
                completions.remove(date_str)
    else:
        if completion.completed:
            if date_str not in completions:
                completions.append(date_str)
            if date_str in freeze_days:
                freeze_days.remove(date_str)
        else:
            if date_str in completions:
                completions.remove(date_str)
    
    await db.habits.update_one(
        {"habit_id": habit_id},
        {"$set": {"completions": completions, "freeze_days": freeze_days}}
    )
    
    updated_habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    return updated_habit

# ==================== TASK ROUTES ====================

@api_router.get("/tasks")
async def get_tasks(date: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if date:
        query["date"] = date
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(500)
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, user: User = Depends(get_current_user)):
    task = Task(user_id=user.user_id, **task_data.model_dump())
    task_doc = task.model_dump()
    task_doc["created_at"] = task_doc["created_at"].isoformat()
    await db.tasks.insert_one(task_doc)
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in task_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.tasks.update_one(
        {"task_id": task_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    result = await db.tasks.delete_one({"task_id": task_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ==================== BRAIN DUMP ROUTES ====================

@api_router.get("/brain-dump")
async def get_brain_dump(date: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if date:
        query["date"] = date
    items = await db.brain_dump.find(query, {"_id": 0}).to_list(500)
    return items

@api_router.post("/brain-dump")
async def create_brain_dump_item(item_data: BrainDumpCreate, user: User = Depends(get_current_user)):
    item = BrainDumpItem(user_id=user.user_id, **item_data.model_dump())
    item_doc = item.model_dump()
    item_doc["created_at"] = item_doc["created_at"].isoformat()
    await db.brain_dump.insert_one(item_doc)
    return item

@api_router.delete("/brain-dump/{item_id}")
async def delete_brain_dump_item(item_id: str, user: User = Depends(get_current_user)):
    result = await db.brain_dump.delete_one({"item_id": item_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# ==================== AI PRIORITIZE TASKS ====================

@api_router.post("/tasks/ai-prioritize")
async def ai_prioritize_tasks(request: Request, user: User = Depends(get_current_user)):
    body = await request.json()
    tasks_text = body.get("tasks", "")
    date = body.get("date", datetime.now(timezone.utc).date().isoformat())
    
    if not tasks_text.strip():
        raise HTTPException(status_code=400, detail="No tasks provided")
    
    prompt = f"""Given these tasks from a brain dump, categorize each into the Eisenhower Matrix:
- urgent-important: Do First (urgent AND important)
- important: Schedule (important but NOT urgent)
- urgent: Delegate (urgent but NOT important)  
- neither: Eliminate (neither urgent nor important)

Tasks:
{tasks_text}

Return a JSON array with each task and its priority. Format:
[{{"title": "task name", "priority": "urgent-important", "estimated_time": 30}}]

Only return the JSON array, nothing else."""

    response = await ai_service.generate(prompt, "task_prioritize", 
        "You are a productivity expert helping prioritize tasks using the Eisenhower Matrix.")
    
    try:
        # Parse JSON from response
        import re
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            tasks_list = json.loads(json_match.group())
            
            # Create tasks in database
            created_tasks = []
            for task_data in tasks_list:
                task = Task(
                    user_id=user.user_id,
                    title=task_data.get("title", "Untitled"),
                    priority=task_data.get("priority", "medium"),
                    estimated_time=task_data.get("estimated_time"),
                    date=date
                )
                task_doc = task.model_dump()
                task_doc["created_at"] = task_doc["created_at"].isoformat()
                await db.tasks.insert_one(task_doc)
                created_tasks.append(task)
            
            return {"tasks": [t.model_dump() for t in created_tasks], "raw_response": response}
    except Exception as e:
        logger.error(f"Error parsing AI response: {e}")
    
    return {"raw_response": response, "tasks": []}

# ==================== DAILY INTENTION ROUTES ====================

@api_router.get("/intention/{date}")
async def get_intention(date: str, user: User = Depends(get_current_user)):
    intention = await db.intentions.find_one(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    )
    if not intention:
        return {"user_id": user.user_id, "date": date, "intention": ""}
    return intention

@api_router.put("/intention/{date}")
async def update_intention(date: str, data: IntentionUpdate, user: User = Depends(get_current_user)):
    await db.intentions.update_one(
        {"user_id": user.user_id, "date": date},
        {"$set": {
            "intention": data.intention,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    intention = await db.intentions.find_one(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    )
    return intention

# ==================== LINK VAULT ROUTES ====================

@api_router.get("/links")
async def get_links(
    category: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    query = {"user_id": user.user_id}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    
    links = await db.links.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return links

@api_router.post("/links", response_model=Link)
async def create_link(link_data: LinkCreate, user: User = Depends(get_current_user)):
    link = Link(user_id=user.user_id, **link_data.model_dump())
    link_doc = link.model_dump()
    link_doc["created_at"] = link_doc["created_at"].isoformat()
    await db.links.insert_one(link_doc)
    return link

@api_router.put("/links/{link_id}", response_model=Link)
async def update_link(link_id: str, link_data: LinkUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in link_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.links.update_one(
        {"link_id": link_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    
    link = await db.links.find_one({"link_id": link_id}, {"_id": 0})
    return link

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, user: User = Depends(get_current_user)):
    result = await db.links.delete_one({"link_id": link_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    return {"message": "Link deleted"}

@api_router.post("/links/bulk-archive")
async def bulk_archive_links(request: Request, user: User = Depends(get_current_user)):
    body = await request.json()
    link_ids = body.get("link_ids", [])
    
    result = await db.links.update_many(
        {"link_id": {"$in": link_ids}, "user_id": user.user_id},
        {"$set": {"status": "archived"}}
    )
    return {"archived_count": result.modified_count}

# ==================== CALORIE TRACKER ROUTES ====================

@api_router.get("/calories")
async def get_calorie_logs(date: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if date:
        query["date"] = date
    logs = await db.calorie_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return logs

@api_router.post("/calories", response_model=CalorieLog)
async def create_calorie_log(log_data: CalorieLogCreate, user: User = Depends(get_current_user)):
    log = CalorieLog(user_id=user.user_id, **log_data.model_dump())
    log_doc = log.model_dump()
    log_doc["created_at"] = log_doc["created_at"].isoformat()
    await db.calorie_logs.insert_one(log_doc)
    return log

@api_router.post("/calories/{log_id}/estimate")
async def estimate_calories(log_id: str, user: User = Depends(get_current_user)):
    log = await db.calorie_logs.find_one({"log_id": log_id, "user_id": user.user_id}, {"_id": 0})
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    prompt = f"""Estimate the nutritional content for this meal:
"{log['description']}"

Return a JSON object with:
- calories: total estimated calories (number)
- protein: grams of protein (number)
- carbs: grams of carbohydrates (number)
- fat: grams of fat (number)
- analysis: brief explanation of the estimate (string)

Be realistic and consider typical Indian portion sizes if the food appears to be Indian cuisine.
Only return the JSON object, nothing else."""

    response = await ai_service.generate(prompt, "calorie_estimate",
        "You are a nutritionist expert who estimates calories and macros from food descriptions.")
    
    try:
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            nutrition = json.loads(json_match.group())
            
            await db.calorie_logs.update_one(
                {"log_id": log_id},
                {"$set": {
                    "calories": nutrition.get("calories"),
                    "protein": nutrition.get("protein"),
                    "carbs": nutrition.get("carbs"),
                    "fat": nutrition.get("fat"),
                    "ai_analysis": nutrition.get("analysis", response)
                }}
            )
            
            updated_log = await db.calorie_logs.find_one({"log_id": log_id}, {"_id": 0})
            return updated_log
    except Exception as e:
        logger.error(f"Error parsing calorie estimate: {e}")
    
    # Fallback - store raw response
    await db.calorie_logs.update_one(
        {"log_id": log_id},
        {"$set": {"ai_analysis": response}}
    )
    updated_log = await db.calorie_logs.find_one({"log_id": log_id}, {"_id": 0})
    return updated_log

@api_router.delete("/calories/{log_id}")
async def delete_calorie_log(log_id: str, user: User = Depends(get_current_user)):
    result = await db.calorie_logs.delete_one({"log_id": log_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

@api_router.get("/calories/daily-summary/{date}")
async def get_daily_calorie_summary(date: str, user: User = Depends(get_current_user)):
    logs = await db.calorie_logs.find(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    ).to_list(100)
    
    weight_log = await db.weight_logs.find_one({"user_id": user.user_id, "date": date}, {"_id": 0})
    current_weight = weight_log.get("weight") if weight_log else None
    
    total_calories = sum(l.get("calories", 0) or 0 for l in logs)
    total_protein = sum(l.get("protein", 0) or 0 for l in logs)
    total_carbs = sum(l.get("carbs", 0) or 0 for l in logs)
    total_fat = sum(l.get("fat", 0) or 0 for l in logs)
    
    return {
        "date": date,
        "meals": len(logs),
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fat": total_fat,
        "logs": logs,
        "weight": current_weight
    }

@api_router.get("/calories/week-summary")
async def get_week_summary(user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    
    logs = await db.calorie_logs.find(
        {"user_id": user.user_id, "date": {"$in": dates}},
        {"_id": 0}
    ).to_list(100)
    
    weight_logs = await db.weight_logs.find(
        {"user_id": user.user_id, "date": {"$in": dates}},
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
    
    return summary

@api_router.get("/calories/recent-meals")
async def get_recent_meals(user: User = Depends(get_current_user)):
    # Find unique meal descriptions
    pipeline = [
        {"$match": {"user_id": user.user_id}},
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
    return recent_meals

@api_router.post("/weight", response_model=WeightLog)
async def create_or_update_weight_log(log_data: WeightLogCreate, user: User = Depends(get_current_user)):
    log_dict = log_data.model_dump()
    result = await db.weight_logs.update_one(
        {"user_id": user.user_id, "date": log_dict["date"]},
        {"$set": {"weight": log_dict["weight"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        log = WeightLog(user_id=user.user_id, **log_dict)
        doc = log.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.weight_logs.insert_one(doc)
    
    updated_log = await db.weight_logs.find_one(
        {"user_id": user.user_id, "date": log_dict["date"]}, 
        {"_id": 0}
    )
    return WeightLog(**updated_log) 


# ==================== VOCABULARY ROUTES ====================

@api_router.get("/vocabulary")
async def get_vocabulary(
    mastery: Optional[str] = None,
    tag: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    query = {"user_id": user.user_id}
    if mastery:
        query["mastery_level"] = mastery
    if tag:
        query["tags"] = tag
    
    words = await db.vocabulary.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return words

@api_router.post("/vocabulary", response_model=Word)
async def create_word(word_data: WordCreate, user: User = Depends(get_current_user)):
    word = Word(user_id=user.user_id, **word_data.model_dump())
    word_doc = word.model_dump()
    word_doc["created_at"] = word_doc["created_at"].isoformat()
    await db.vocabulary.insert_one(word_doc)
    return word

@api_router.put("/vocabulary/{word_id}", response_model=Word)
async def update_word(word_id: str, word_data: WordUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in word_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.vocabulary.update_one(
        {"word_id": word_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Word not found")
    
    word = await db.vocabulary.find_one({"word_id": word_id}, {"_id": 0})
    return word

@api_router.delete("/vocabulary/{word_id}")
async def delete_word(word_id: str, user: User = Depends(get_current_user)):
    result = await db.vocabulary.delete_one({"word_id": word_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Word not found")
    return {"message": "Word deleted"}

@api_router.post("/vocabulary/{word_id}/generate")
async def generate_word_definition(word_id: str, user: User = Depends(get_current_user)):
    word_doc = await db.vocabulary.find_one({"word_id": word_id, "user_id": user.user_id}, {"_id": 0})
    if not word_doc:
        raise HTTPException(status_code=404, detail="Word not found")
    
    prompt = f"""For the word "{word_doc['word']}", provide:
1. A clear, concise definition
2. An example sentence showing proper usage
3. Tips for remembering and using this word effectively

Return as JSON:
{{"definition": "...", "example_sentence": "...", "usage_tips": "..."}}

Only return the JSON object, nothing else."""

    response = await ai_service.generate(prompt, "vocabulary_generate",
        "You are an English language expert helping someone build their vocabulary.")
    
    try:
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            
            await db.vocabulary.update_one(
                {"word_id": word_id},
                {"$set": {
                    "definition": data.get("definition"),
                    "example_sentence": data.get("example_sentence"),
                    "usage_tips": data.get("usage_tips")
                }}
            )
            
            updated = await db.vocabulary.find_one({"word_id": word_id}, {"_id": 0})
            return updated
    except Exception as e:
        logger.error(f"Error parsing vocabulary response: {e}")
    
    raise HTTPException(status_code=500, detail="Failed to generate definition")

@api_router.get("/vocabulary/word-of-day")
async def get_word_of_day(user: User = Depends(get_current_user)):
    # Get a random unmastered word
    words = await db.vocabulary.find(
        {"user_id": user.user_id, "mastery_level": {"$ne": "owned"}},
        {"_id": 0}
    ).to_list(100)
    
    if not words:
        return None
    
    import random
    return random.choice(words)

# ==================== IDEAS ROUTES ====================

@api_router.get("/ideas")
async def get_ideas(
    status: Optional[str] = None,
    idea_type: Optional[str] = None,
    starred: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    query = {"user_id": user.user_id}
    if status:
        query["status"] = status
    if idea_type:
        query["idea_type"] = idea_type
    if starred is not None:
        query["starred"] = starred
    
    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return ideas

@api_router.post("/ideas", response_model=Idea)
async def create_idea(idea_data: IdeaCreate, user: User = Depends(get_current_user)):
    idea = Idea(user_id=user.user_id, **idea_data.model_dump())
    idea_doc = idea.model_dump()
    idea_doc["created_at"] = idea_doc["created_at"].isoformat()
    await db.ideas.insert_one(idea_doc)
    return idea

@api_router.put("/ideas/{idea_id}", response_model=Idea)
async def update_idea(idea_id: str, idea_data: IdeaUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in idea_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.ideas.update_one(
        {"idea_id": idea_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    idea = await db.ideas.find_one({"idea_id": idea_id}, {"_id": 0})
    return idea

@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str, user: User = Depends(get_current_user)):
    result = await db.ideas.delete_one({"idea_id": idea_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    return {"message": "Idea deleted"}

@api_router.post("/ideas/{idea_id}/expand")
async def expand_idea(idea_id: str, user: User = Depends(get_current_user)):
    idea = await db.ideas.find_one({"idea_id": idea_id, "user_id": user.user_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    prompt = f"""Expand this idea into a structured note:
Title: "{idea['title']}"
{f"Current content: {idea['content']}" if idea.get('content') else ""}

Create a well-structured expansion with:
1. A brief summary of the idea
2. Key points or components
3. Potential challenges or considerations
4. Next steps to explore or implement

Return the expanded content as a markdown-formatted string (not JSON)."""

    response = await ai_service.generate(prompt, "idea_expand",
        "You are a creative thinking partner helping someone develop their ideas.")
    
    await db.ideas.update_one(
        {"idea_id": idea_id},
        {"$set": {"content": response, "status": "exploring"}}
    )
    
    updated = await db.ideas.find_one({"idea_id": idea_id}, {"_id": 0})
    return updated

@api_router.get("/ideas/resurface")
async def resurface_old_idea(user: User = Depends(get_current_user)):
    # Get an idea from 30+ days ago that's still in raw status
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    ideas = await db.ideas.find(
        {
            "user_id": user.user_id,
            "status": "raw",
            "created_at": {"$lt": thirty_days_ago}
        },
        {"_id": 0}
    ).to_list(50)
    
    if not ideas:
        return None
    
    import random
    return random.choice(ideas)

# ==================== BQ PRACTICE ROUTES ====================

# Default questions bank
DEFAULT_BQ_QUESTIONS = [
    {"question": "Tell me about a time you faced a difficult problem at work. How did you solve it?", "theme": "problem-solving"},
    {"question": "Describe a situation where you had to work with a difficult team member.", "theme": "teamwork"},
    {"question": "Give an example of when you took initiative on a project.", "theme": "leadership"},
    {"question": "Tell me about a time you failed. What did you learn?", "theme": "failure"},
    {"question": "Describe a situation where you had to learn something quickly.", "theme": "growth"},
    {"question": "Tell me about a time you disagreed with your manager.", "theme": "conflict"},
    {"question": "Describe your biggest professional achievement.", "theme": "goals"},
    {"question": "Tell me about a time you had to meet a tight deadline.", "theme": "problem-solving"},
    {"question": "Give an example of when you went above and beyond.", "theme": "leadership"},
    {"question": "Describe a situation where you had to adapt to change.", "theme": "growth"},
    {"question": "Tell me about a time you had to persuade someone.", "theme": "leadership"},
    {"question": "Describe a project you're most proud of.", "theme": "goals"},
    {"question": "Tell me about a time you received critical feedback.", "theme": "growth"},
    {"question": "Give an example of when you had to prioritize multiple tasks.", "theme": "problem-solving"},
    {"question": "Describe a situation where you had to collaborate with different teams.", "theme": "teamwork"},
]

@api_router.get("/bq/questions")
async def get_bq_questions(theme: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if theme:
        query["theme"] = theme
    
    custom_questions = await db.bq_questions.find(query, {"_id": 0}).to_list(100)
    
    # Combine with default questions
    default_questions = [
        {**q, "question_id": f"default_{i}", "is_custom": False}
        for i, q in enumerate(DEFAULT_BQ_QUESTIONS)
        if not theme or q["theme"] == theme
    ]
    
    return custom_questions + default_questions

@api_router.post("/bq/questions", response_model=BQQuestion)
async def create_bq_question(question_data: BQQuestionCreate, user: User = Depends(get_current_user)):
    question = BQQuestion(user_id=user.user_id, **question_data.model_dump())
    question_doc = question.model_dump()
    question_doc["created_at"] = question_doc["created_at"].isoformat()
    await db.bq_questions.insert_one(question_doc)
    return question

@api_router.delete("/bq/questions/{question_id}")
async def delete_bq_question(question_id: str, user: User = Depends(get_current_user)):
    result = await db.bq_questions.delete_one({"question_id": question_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted"}

@api_router.get("/bq/answers")
async def get_star_answers(
    question_id: Optional[str] = None,
    tag: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    query = {"user_id": user.user_id}
    if question_id:
        query["question_id"] = question_id
    if tag:
        query["tags"] = tag
    
    answers = await db.star_answers.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return answers

@api_router.post("/bq/answers", response_model=STARAnswer)
async def create_star_answer(answer_data: STARAnswerCreate, user: User = Depends(get_current_user)):
    answer = STARAnswer(user_id=user.user_id, **answer_data.model_dump())
    answer_doc = answer.model_dump()
    answer_doc["created_at"] = answer_doc["created_at"].isoformat()
    await db.star_answers.insert_one(answer_doc)
    return answer

@api_router.put("/bq/answers/{answer_id}", response_model=STARAnswer)
async def update_star_answer(answer_id: str, answer_data: STARAnswerUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in answer_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.star_answers.update_one(
        {"answer_id": answer_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    answer = await db.star_answers.find_one({"answer_id": answer_id}, {"_id": 0})
    return answer

@api_router.delete("/bq/answers/{answer_id}")
async def delete_star_answer(answer_id: str, user: User = Depends(get_current_user)):
    result = await db.star_answers.delete_one({"answer_id": answer_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Answer not found")
    return {"message": "Answer deleted"}

@api_router.post("/bq/answers/{answer_id}/feedback")
async def get_star_feedback(answer_id: str, user: User = Depends(get_current_user)):
    answer = await db.star_answers.find_one({"answer_id": answer_id, "user_id": user.user_id}, {"_id": 0})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    prompt = f"""Review this STAR method answer for a behavioral interview question.

Question: {answer['question_text']}

Situation: {answer['situation']}
Task: {answer['task']}
Action: {answer['action']}
Result: {answer['result']}

Provide constructive feedback on:
1. Clarity and specificity of the situation
2. How well the task was defined
3. Quality and detail of the actions taken
4. Impact and measurability of the results
5. Overall structure and flow
6. Suggestions for improvement

Be encouraging but specific with improvement areas."""

    response = await ai_service.generate(prompt, "bq_feedback",
        "You are an experienced career coach helping someone prepare for behavioral interviews.")
    
    await db.star_answers.update_one(
        {"answer_id": answer_id},
        {"$set": {"ai_feedback": response}}
    )
    
    updated = await db.star_answers.find_one({"answer_id": answer_id}, {"_id": 0})
    return updated

@api_router.get("/bq/practice-session")
async def get_practice_session(theme: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get 5 random questions for a practice session"""
    questions = await get_bq_questions(theme, user)
    
    import random
    selected = random.sample(questions, min(5, len(questions)))
    return selected

# ==================== GLOBAL SEARCH ====================

@api_router.get("/search")
async def global_search(q: str, user: User = Depends(get_current_user)):
    """Search across all modules"""
    if not q or len(q) < 2:
        return {"results": []}
    
    results = []
    
    # Search habits
    habits = await db.habits.find(
        {"user_id": user.user_id, "name": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(10)
    for h in habits:
        results.append({"type": "habit", "data": h})
    
    # Search tasks
    tasks = await db.tasks.find(
        {"user_id": user.user_id, "title": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(10)
    for t in tasks:
        results.append({"type": "task", "data": t})
    
    # Search links
    links = await db.links.find(
        {"user_id": user.user_id, "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"note": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).to_list(10)
    for l in links:
        results.append({"type": "link", "data": l})
    
    # Search vocabulary
    words = await db.vocabulary.find(
        {"user_id": user.user_id, "$or": [
            {"word": {"$regex": q, "$options": "i"}},
            {"definition": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).to_list(10)
    for w in words:
        results.append({"type": "word", "data": w})
    
    # Search ideas
    ideas = await db.ideas.find(
        {"user_id": user.user_id, "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).to_list(10)
    for i in ideas:
        results.append({"type": "idea", "data": i})
    
    # Search BQ answers
    answers = await db.star_answers.find(
        {"user_id": user.user_id, "$or": [
            {"situation": {"$regex": q, "$options": "i"}},
            {"action": {"$regex": q, "$options": "i"}},
            {"result": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).to_list(10)
    for a in answers:
        results.append({"type": "bq_answer", "data": a})
    
    return {"results": results[:50], "query": q}

# ==================== WEEKLY REVIEW ====================

@api_router.post("/weekly-review")
async def generate_weekly_review(request: Request, user: User = Depends(get_current_user)):
    """Generate AI-powered weekly summary"""
    body = await request.json()
    week_start = body.get("week_start")  # ISO date string
    
    if not week_start:
        # Default to last 7 days
        week_start = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
    
    week_end = (datetime.fromisoformat(week_start) + timedelta(days=6)).date().isoformat()
    
    # Gather week's data
    habits = await db.habits.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    tasks = await db.tasks.find(
        {"user_id": user.user_id, "date": {"$gte": week_start, "$lte": week_end}},
        {"_id": 0}
    ).to_list(500)
    ideas = await db.ideas.find(
        {"user_id": user.user_id, "created_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(100)
    words = await db.vocabulary.find(
        {"user_id": user.user_id, "created_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(100)
    calories = await db.calorie_logs.find(
        {"user_id": user.user_id, "date": {"$gte": week_start, "$lte": week_end}},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate stats
    completed_tasks = len([t for t in tasks if t.get("completed")])
    total_tasks = len(tasks)
    
    habit_completions = 0
    for habit in habits:
        for comp in habit.get("completions", []):
            if week_start <= comp <= week_end:
                habit_completions += 1
    
    total_calories = sum(c.get("calories", 0) or 0 for c in calories)
    avg_calories = total_calories // 7 if calories else 0
    
    prompt = f"""Generate a weekly review summary for a productivity app user.

Week: {week_start} to {week_end}

Data:
- Tasks: {completed_tasks}/{total_tasks} completed
- Habit completions: {habit_completions} check-ins across {len(habits)} habits
- New ideas captured: {len(ideas)}
- New words learned: {len(words)}
- Average daily calories: {avg_calories}

Create an encouraging, insightful weekly summary that:
1. Highlights wins and progress
2. Identifies patterns or areas for improvement
3. Suggests focus areas for next week
4. Ends with a motivating message

Keep it concise but meaningful."""

    response = await ai_service.generate(prompt, "weekly_review",
        "You are a supportive productivity coach helping someone reflect on their week.")
    
    # Store the review
    review_doc = {
        "review_id": f"review_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "week_start": week_start,
        "week_end": week_end,
        "summary": response,
        "stats": {
            "tasks_completed": completed_tasks,
            "tasks_total": total_tasks,
            "habit_completions": habit_completions,
            "ideas_captured": len(ideas),
            "words_learned": len(words),
            "avg_calories": avg_calories
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weekly_reviews.insert_one(review_doc)
    
    return {
        "review_id": review_doc["review_id"],
        "week_start": week_start,
        "week_end": week_end,
        "summary": response,
        "stats": review_doc["stats"]
    }

@api_router.get("/weekly-reviews")
async def get_weekly_reviews(user: User = Depends(get_current_user)):
    reviews = await db.weekly_reviews.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(52)
    return reviews

# ==================== OBSIDIAN EXPORT ====================

@api_router.get("/export/daily-note/{date}")
async def export_daily_note(date: str, user: User = Depends(get_current_user)):
    """Generate Obsidian-compatible daily note"""
    
    # Gather all data for the date
    intention = await db.intentions.find_one(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    )
    
    habits = await db.habits.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    tasks = await db.tasks.find({"user_id": user.user_id, "date": date}, {"_id": 0}).to_list(100)
    ideas = await db.ideas.find(
        {"user_id": user.user_id, "created_at": {"$regex": f"^{date}"}},
        {"_id": 0}
    ).to_list(100)
    words = await db.vocabulary.find(
        {"user_id": user.user_id, "created_at": {"$regex": f"^{date}"}},
        {"_id": 0}
    ).to_list(100)
    calories = await db.calorie_logs.find(
        {"user_id": user.user_id, "date": date},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate habit streaks
    def calculate_streak(habit, check_date):
        completions = habit.get("completions", [])
        freeze_days = habit.get("freeze_days", [])
        streak = 0
        current = datetime.fromisoformat(check_date)
        for i in range(90):
            d = (current - timedelta(days=i)).date().isoformat()
            if d in completions or d in freeze_days:
                streak += 1
            else:
                break
        return streak
    
    # Build markdown
    lines = [
        "---",
        f"date: {date}",
        "tags: [daily-note, nucleus]",
        "---",
        "",
        "## 🌅 Intention",
        intention.get("intention", "_No intention set_") if intention else "_No intention set_",
        "",
        "## ✅ Habits"
    ]
    
    for habit in habits:
        completed = date in habit.get("completions", [])
        streak = calculate_streak(habit, date)
        checkbox = "[x]" if completed else "[ ]"
        streak_text = f" 🔥 {streak}-day streak" if streak > 0 and completed else ""
        lines.append(f"- {checkbox} {habit['name']}{streak_text}")
    
    lines.extend(["", "## 📋 Tasks Completed"])
    completed_tasks = [t for t in tasks if t.get("completed")]
    pending_tasks = [t for t in tasks if not t.get("completed")]
    
    for task in completed_tasks:
        lines.append(f"- [x] {task['title']}")
    for task in pending_tasks:
        lines.append(f"- [ ] {task['title']} → carries over tomorrow")
    
    if not tasks:
        lines.append("_No tasks for this day_")
    
    lines.extend(["", "## 💡 Ideas Captured"])
    for idea in ideas:
        tags = " ".join([f"#{t}" for t in idea.get("tags", [])])
        lines.append(f"- [[{idea['title']}]] — {tags}")
    if not ideas:
        lines.append("_No ideas captured_")
    
    lines.extend(["", "## 📖 Words Learned"])
    for word in words:
        definition = word.get("definition", "_definition pending_")
        lines.append(f"- **{word['word']}** — {definition}")
    if not words:
        lines.append("_No new words_")
    
    lines.extend(["", "## 🍱 Calories"])
    total_cal = sum(c.get("calories", 0) or 0 for c in calories)
    total_protein = sum(c.get("protein", 0) or 0 for c in calories)
    total_carbs = sum(c.get("carbs", 0) or 0 for c in calories)
    total_fat = sum(c.get("fat", 0) or 0 for c in calories)
    
    if calories:
        lines.append(f"- Total: {total_cal} kcal | Protein: {total_protein}g | Carbs: {total_carbs}g | Fat: {total_fat}g")
    else:
        lines.append("_No meals logged_")
    
    lines.extend([
        "",
        "## 🌙 End of Day",
        f"Proud of: _",
        f"Carries over: {', '.join([t['title'] for t in pending_tasks]) if pending_tasks else 'Nothing'}_"
    ])
    
    markdown = "\n".join(lines)
    
    return {
        "date": date,
        "filename": f"{date}.md",
        "content": markdown
    }

@api_router.get("/export/all-data")
async def export_all_data(user: User = Depends(get_current_user)):
    """Export all user data as JSON for backup"""
    
    data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": user.model_dump(),
        "habits": await db.habits.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000),
        "tasks": await db.tasks.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "intentions": await db.intentions.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000),
        "brain_dump": await db.brain_dump.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "links": await db.links.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "vocabulary": await db.vocabulary.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "ideas": await db.ideas.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "calorie_logs": await db.calorie_logs.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "bq_questions": await db.bq_questions.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000),
        "star_answers": await db.star_answers.find({"user_id": user.user_id}, {"_id": 0}).to_list(10000),
        "weekly_reviews": await db.weekly_reviews.find({"user_id": user.user_id}, {"_id": 0}).to_list(100),
    }
    
    return data

# ==================== STATS ROUTES ====================

@api_router.get("/stats")
async def get_stats(user: User = Depends(get_current_user)):
    habits = await db.habits.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    today = datetime.now(timezone.utc).date()
    max_streak = 0
    for habit in habits:
        completions = sorted(habit.get("completions", []))
        freeze_days = habit.get("freeze_days", [])
        streak = 0
        current_date = today
        for i in range(90):
            date_str = (current_date - timedelta(days=i)).isoformat()
            if date_str in completions or date_str in freeze_days:
                streak += 1
            else:
                break
        max_streak = max(max_streak, streak)
    
    task_count = await db.tasks.count_documents({"user_id": user.user_id})
    completed_tasks = await db.tasks.count_documents({"user_id": user.user_id, "completed": True})
    idea_count = await db.ideas.count_documents({"user_id": user.user_id})
    word_count = await db.vocabulary.count_documents({"user_id": user.user_id})
    link_count = await db.links.count_documents({"user_id": user.user_id})
    
    return {
        "habits_streak": max_streak,
        "habits_total": len(habits),
        "tasks_completed": completed_tasks,
        "tasks_total": task_count,
        "ideas_captured": idea_count,
        "words_collected": word_count,
        "links_saved": link_count
    }

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Nucleus API", "version": "2.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

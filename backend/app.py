import os
import json
import re
import requests
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from rapidfuzz import process
from datetime import date

# Local imports
from database import SessionLocal, engine
from models import Base, User, FoodLog, WeightLog
from schemas import UserCreate, UserLogin, FoodLogCreate, FoodLogUpdate, WeightLogCreate
from auth import hash_password, verify_password

# Initialize environment and DB tables
load_dotenv()
Base.metadata.create_all(bind=engine)

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

app = FastAPI()

# ── Database Dependency ──────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Email validation helpers ─────────────────────────────────────────────────

# Basic RFC-5322-ish pattern, good enough for app-level checks
EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")

# Domains that are syntactically valid but are well-known fakes / disposable /
# typo domains people use during testing. Extend this list as needed.
BLOCKED_DOMAINS = {
    "gal.com", "test.com", "fake.com", "example.com", "abc.com",
    "mailinator.com", "tempmail.com", "yopmail.com", "guerrillamail.com",
    "10minutemail.com", "throwaway.email", "trashmail.com",
}


def is_valid_email_format(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))


def has_valid_domain(email: str) -> bool:
    """
    Reject obviously-fake domains. Also tries an MX-record DNS lookup
    so domains like 'gal.com' (no mail server) get rejected even if
    they're not in BLOCKED_DOMAINS.
    """
    domain = email.split("@")[-1].lower()

    if domain in BLOCKED_DOMAINS:
        return False

    try:
        import dns.resolver
        try:
            dns.resolver.resolve(domain, "MX")
            return True
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            # Fall back to A record — some domains route mail without MX
            try:
                dns.resolver.resolve(domain, "A")
                return True
            except Exception:
                return False
    except ImportError:
        # dnspython not installed — skip DNS check, rely on BLOCKED_DOMAINS only
        return True
    except Exception:
        # Any unexpected DNS error — don't hard-block, just allow
        return True


def validate_signup_email(email: str) -> str:
    email = email.strip().lower()

    if not is_valid_email_format(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if not has_valid_domain(email):
        raise HTTPException(status_code=400, detail="This email domain doesn't appear to accept mail. Please use a real email address.")

    return email


# ── Password validation ──────────────────────────────────────────────────────

def validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one letter.")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")


# ── Numeric field validation ─────────────────────────────────────────────────

def validate_profile_numbers(user: UserCreate) -> None:
    if user.age <= 0 or user.age > 120:
        raise HTTPException(status_code=400, detail="Please enter a valid age.")
    if user.weight <= 0 or user.weight > 500:
        raise HTTPException(status_code=400, detail="Please enter a valid weight (kg).")
    if user.height <= 0 or user.height > 300:
        raise HTTPException(status_code=400, detail="Please enter a valid height (cm).")
    if user.target_weight is not None and (user.target_weight <= 0 or user.target_weight > 500):
        raise HTTPException(status_code=400, detail="Please enter a valid target weight (kg).")


def get_healthy_weight_range(height_cm):
    height_m = height_cm / 100
    min_weight = 18.5 * (height_m ** 2)
    max_weight = 24.9 * (height_m ** 2)
    return round(min_weight, 1), round(max_weight, 1)


def get_suggested_goal_weight(user):
    weight = float(user.weight)
    height = float(user.height)
    min_w, max_w = get_healthy_weight_range(height)
    training_goal = str(user.training_goal)

    if training_goal == "Muscle Growth":
        return round(min(max_w * 0.95, max_w))
    elif training_goal in ["Athleticism", "Hybrid"]:
        return round((min_w + max_w) / 2)
    else:  # Overall Health
        return round((min_w + max_w) / 2)


def calculate_targets(user):
    weight = float(user.weight)
    height = float(user.height)
    age = int(user.age)

    gender = str(user.gender).lower()
    goal = str(user.goal)
    activity = str(user.activity_level)
    training_goal = str(user.training_goal)
    
    # 1. Clean Definition of Weight Difference upfront
    weight_difference = round(float(user.target_weight or 0) - weight, 1)

    # 2. Base BMR Calculation
    if gender == "male":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

    activity_multipliers = {
        "Sedentary": 1.2,
        "Lightly Active": 1.375,
        "Moderately Active": 1.55,
        "Very Active": 1.725,
        "Extremely Active": 1.9,
    }

    tdee = bmr * activity_multipliers.get(activity, 1.55)

    # 3. Dynamic Weight Tuning Evaluation (Ensuring clean indentation contexts)
    if goal in ["Gain Weight", "Gain Muscle"]:
        if weight_difference > 10:
            calories = tdee + 500
        elif weight_difference > 5:
            calories = tdee + 300
        else:
            calories = tdee + 250 if goal == "Gain Muscle" else tdee + 500

    elif goal == "Lose Weight":
        if weight_difference < -10:
            calories = tdee - 700
        elif weight_difference < -5:
            calories = tdee - 500
        else:
            calories = tdee - 500

    else:
        calories = tdee

    # 4. Protein Multipliers
    protein_multipliers = {
        "Overall Health": 1.2,
        "Muscle Growth": 2.0,
        "Athleticism": 1.8,
        "Hybrid": 1.7,
    }
    protein = weight * protein_multipliers.get(training_goal, 1.6)

    # 5. Fat Multipliers 
    fat_multipliers = {
        "Overall Health": 0.8,
        "Muscle Growth": 0.9,
        "Athleticism": 0.7,
        "Hybrid": 0.8,
    }
    fat = weight * fat_multipliers.get(training_goal, 0.8)

    # Remaining calories become carbs with structural floor constraints
    protein_calories = protein * 4
    fat_calories = fat * 9
    
    carbs = (calories - protein_calories - fat_calories) / 4
    carbs = max(carbs, 50)

    # Water Metrics
    water = weight * 0.04
    if activity in ["Very Active", "Extremely Active"]:
        water += 0.5

    min_weight, max_weight = get_healthy_weight_range(height)
    suggested_goal_weight = get_suggested_goal_weight(user)

    return {
        "calories": round(calories),
        "protein": round(protein),
        "carbs": round(carbs),
        "fat": round(fat),
        "water": round(water, 1),
        "healthy_weight_min": min_weight,
        "healthy_weight_max": max_weight,
        "suggested_goal_weight": suggested_goal_weight,
        "weight_difference": weight_difference
    }


# ── CORS Middleware ──────────────────────────────────────────────────────────

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Welcome to NutrAI!"}


@app.get("/suggest")
def suggest(food: str):
    if not os.path.exists("foods.json"):
        return []

    with open("foods.json", "r", encoding="utf-8") as f:
        nutrition_data = json.load(f)

    query = food.lower()
    matches = []
    for item in nutrition_data.values():
        food_name = item.get("name") or item.get("food_name")
        if food_name and query in food_name.lower():
            matches.append(food_name)

    return matches[:10]


@app.get("/calories")
def calories(food: str):
    if not os.path.exists("foods.json"):
        return {"error": "Database file missing"}

    with open("foods.json", "r", encoding="utf-8") as f:
        nutrition_data = json.load(f)

    foods = {}
    for item in nutrition_data.values():
        food_name = item.get("name") or item.get("food_name")
        if food_name:
            foods[food_name] = item

    match = process.extractOne(food, foods.keys(), score_cutoff=60)
    if not match:
        return {"error": "Food not found"}

    return foods[match[0]]


@app.get("/add-meal")
def add_meal(food: str, quantity: int):
    if not os.path.exists("foods.json"):
        return {"error": "Database file missing"}

    with open("foods.json", "r", encoding="utf-8") as f:
        nutrition_data = json.load(f)

    query = food.lower()
    for item in nutrition_data.values():
        name = item.get("name") or item.get("food_name")
        if name and query in name.lower():
            return {
                "food":            name,
                "quantity":        quantity,
                "total_calories":  item.get("calories", 0) * quantity,
                "total_protein":   item.get("protein",  0) * quantity,
                "total_carbs":     item.get("carbs",    0) * quantity,
                "total_fat":       item.get("fat",      0) * quantity,
            }

    return {"error": "Food not found"}


@app.get("/food-image")
def food_image(food: str):
    if not PEXELS_API_KEY:
        return {"image_url": None}

    headers = {"Authorization": PEXELS_API_KEY}
    try:
        response = requests.get(
            f"https://api.pexels.com/v1/search?query={food}&per_page=1",
            headers=headers,
            timeout=5,
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("photos"):
                return {"image_url": data["photos"][0]["src"]["large"]}
    except Exception as e:
        print(f"Pexels fetching error: {e}")

    return {"image_url": None}


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id":             user.id,
            "name":           user.name,
            "email":          user.email,
            "age":            user.age,
            "weight":         user.weight,
            "target_weight":  user.target_weight,
            "height":         user.height,
            "goal":           user.goal,
            "activity_level": user.activity_level,
            "training_goal":  user.training_goal,
        }
        for user in users
    ]


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@app.get("/nutrition-plan/{user_id}")
@app.get("/targets/{user_id}")
def get_targets(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return calculate_targets(user)


@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    email = validate_signup_email(user.email)
    validate_password(user.password)
    validate_profile_numbers(user)

    name = user.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Please enter your name.")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    new_user = User(
        gender=         user.gender,
        name=           name,
        email=          email,
        password=       hash_password(user.password),
        age=            user.age,
        weight=         user.weight,
        target_weight=  user.target_weight,
        height=         user.height,
        goal=           user.goal,
        activity_level= user.activity_level,
        training_goal=  user.training_goal,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user_id": new_user.id,
    }


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    email = user.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()

    invalid_credentials = HTTPException(status_code=401, detail="Invalid email or password.")

    if not existing_user:
        raise invalid_credentials

    if not verify_password(user.password, existing_user.password):
        raise invalid_credentials

    return {
        "message":        "Login successful",
        "user_id":        existing_user.id,
        "name":           existing_user.name,
        "goal":           existing_user.goal,
        "weight":         existing_user.weight,
        "target_weight":  existing_user.target_weight,
        "height":         existing_user.height,
        "age":            existing_user.age,
        "activity_level": existing_user.activity_level,
        "gender":         existing_user.gender,
        "training_goal":  existing_user.training_goal,
    }


@app.post("/food-log")
def add_food_log(log: FoodLogCreate, db: Session = Depends(get_db)):
    with open("foods.json", "r", encoding="utf-8") as f:
        nutrition_data = json.load(f)

    matched_food = None
    for item in nutrition_data.values():
        name = item.get("name") or item.get("food_name")
        if name and name.lower() == log.food_name.lower():
            matched_food = item
            break

    if not matched_food:
        raise HTTPException(status_code=404, detail="Food not found")

    new_log = FoodLog(
        user_id=   log.user_id,
        food_name= matched_food.get("name") or matched_food.get("food_name"),
        calories=  matched_food["calories"] * log.quantity,
        protein=   matched_food["protein"]  * log.quantity,
        carbs=     matched_food["carbs"]    * log.quantity,
        fat=       matched_food["fat"]      * log.quantity,
        quantity=  log.quantity,
        date=      str(date.today()),
    )
    db.add(new_log)
    db.commit()

    return {"message": "Food added successfully"}


@app.get("/food-log/{user_id}")
def get_food_logs(user_id: int, db: Session = Depends(get_db)):
    today_str = str(date.today())
    logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.date    == today_str,
    ).all()

    return [
        {
            "id":        log.id,
            "food_name": log.food_name,
            "calories":  log.calories,
            "protein":   log.protein,
            "carbs":     log.carbs,
            "fat":       log.fat,
            "quantity":  log.quantity,
            "date":      log.date,
        }
        for log in logs
    ]


@app.delete("/food-log/{log_id}")
def delete_food_log(log_id: int, db: Session = Depends(get_db)):
    food = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food log not found")
    db.delete(food)
    db.commit()
    return {"message": "Food deleted successfully"}


@app.put("/food-log/{log_id}")
def update_food_log(log_id: int, update: FoodLogUpdate, db: Session = Depends(get_db)):
    log = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Food log not found")

    with open("foods.json", "r", encoding="utf-8") as f:
        nutrition_data = json.load(f)

    matched_food = None
    for item in nutrition_data.values():
        name = item.get("name") or item.get("food_name")
        if name and name.lower() == log.food_name.lower():
            matched_food = item
            break

    if not matched_food:
        raise HTTPException(status_code=404, detail="Food not found")

    log.quantity = update.quantity
    log.calories = matched_food["calories"] * update.quantity
    log.protein  = matched_food["protein"]  * update.quantity
    log.carbs    = matched_food["carbs"]    * update.quantity
    log.fat      = matched_food["fat"]      * update.quantity

    db.commit()
    return {"message": "Food updated successfully"}


@app.post("/weight-log")
def add_weight_log(weight_data: WeightLogCreate, db: Session = Depends(get_db)):
    new_log = WeightLog(
        user_id= weight_data.user_id,
        weight=  weight_data.weight,
        date=    str(date.today()),
    )
    db.add(new_log)
    
    # Sync core metric weight changes to profile
    user = db.query(User).filter(User.id == weight_data.user_id).first()
    if user:
        user.weight = weight_data.weight

    db.commit()
    db.refresh(new_log)
    return {"message": "Weight logged successfully"}


@app.get("/weight-log/{user_id}")
def get_weight_logs(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(WeightLog).filter(WeightLog.user_id == user_id).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "weight": log.weight,
            "date": log.date
        }
        for log in logs
    ]
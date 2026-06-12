from pydantic import BaseModel
target_weight: float

class UserLogin(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    weight: int
    height: int
    goal: str
    training_goal: str
    activity_level: str
    gender: str
    target_weight: float
    


class FoodLogCreate(BaseModel):
    user_id: int
    food_name: str
    quantity: int

class FoodLogUpdate(BaseModel):
    quantity: int

class WeightLogCreate(BaseModel):
    user_id: int
    weight: float


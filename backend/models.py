from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base
from sqlalchemy import Float



Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)
    email = Column(String, unique=True)

    password = Column(String)

    age = Column(Integer)

    weight = Column(Integer)

    target_weight = Column(Float)

    height = Column(Integer)

    goal = Column(String)

    training_goal = Column(String)

    activity_level = Column(String)

    gender = Column(String)
    






class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    food_name = Column(String)

    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)

    quantity = Column(Integer)

    date = Column(String)


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    weight = Column(Float)

    date = Column(String)

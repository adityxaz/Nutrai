import json

with open("database/fruits.json", "r") as f:
    fruits = json.load(f)

def search_fruit(name):
    name = name.lower()

    for fruit_id, data in fruits.items():
        if data["name"].lower() == name:
            return data

    return None
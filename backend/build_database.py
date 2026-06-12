import json

with open("datasets/fruits.json", "r", encoding="utf-8") as f:
    fruits = json.load(f)

with open("datasets/vegetables.json", "r", encoding="utf-8") as f:
    vegetables = json.load(f)

with open("datasets/pulses.json", "r", encoding="utf-8") as f:
    pulses = json.load(f)

with open("datasets/dairy.json", "r", encoding="utf-8") as f:
    dairy = json.load(f)

with open("datasets/poultry.json", "r", encoding="utf-8") as f:
    poultry = json.load(f)

with open("datasets/grains.json", "r", encoding="utf-8") as f:
    grains = json.load(f)

with open("datasets/cafe.json", "r", encoding="utf-8") as f:
    cafe = json.load(f)

all_foods = {}

all_foods.update(fruits)
all_foods.update(vegetables)
all_foods.update(pulses)
all_foods.update(dairy)
all_foods.update(poultry)
all_foods.update(grains)
all_foods.update(cafe)

with open("foods.json", "w", encoding="utf-8") as f:
    json.dump(all_foods, f, indent=2)

print(f"Saved {len(all_foods)} foods")
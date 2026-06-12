import pandas as pd
import json

df = pd.read_csv("IFCT.csv")

foods = {}

for _, row in df.iterrows():
    try:
        name = str(row["name"]).strip()

        protein = row["Protein [g]|protcnt|PROXIMATE PRINCIPLES AND DIETARY FIBRE"]
        fat = row["Total Fat [g]|fatce|PROXIMATE PRINCIPLES AND DIETARY FIBRE"]
        carbs = row["Carbohydrate [g]|choavldf|PROXIMATE PRINCIPLES AND DIETARY FIBRE"]

        energy_kj = row["Energy [kJ]|enerc|PROXIMATE PRINCIPLES AND DIETARY FIBRE"]
        calories = float(energy_kj) / 4.184 if pd.notna(energy_kj) else 0

        foods[name.lower()] = {
            "protein": round(float(protein), 2) if pd.notna(protein) else 0,
            "fat": round(float(fat), 2) if pd.notna(fat) else 0,
            "carbs": round(float(carbs), 2) if pd.notna(carbs) else 0,
            "calories": round(calories, 2)
        }

    except:
        pass

with open("ifct_foods.json", "w", encoding="utf-8") as f:
    json.dump(foods, f, indent=2)

print(f"Saved {len(foods)} foods")
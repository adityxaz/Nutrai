"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugars?: number;
}

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

const MACRO_CONFIG = [
  { key: "calories", label: "Calories", emoji: "🔥", unit: "kcal", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  { key: "protein",  label: "Protein",  emoji: "💪", unit: "g",    color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  { key: "carbs",    label: "Carbs",    emoji: "🍚", unit: "g",    color: "#EC4899", bg: "rgba(236,72,153,0.08)" },
  { key: "fat",      label: "Fat",      emoji: "🥑", unit: "g",    color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  { key: "fiber",    label: "Fiber",    emoji: "🌾", unit: "g",    color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { key: "sugars",   label: "Sugars",   emoji: "🍬", unit: "g",    color: "#F472B6", bg: "rgba(244,114,182,0.08)" },
];

function DietContent() {
  const searchParams = useSearchParams();
  const foodFromUrl = searchParams.get("food");

  const [food, setFood]                   = useState("");
  const [data, setData]                   = useState<NutritionData | null>(null);
  const [suggestions, setSuggestions]     = useState<string[]>([]);
  const [loading, setLoading]             = useState(false);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<any>(null);
  const [drinkSize, setDrinkSize]         = useState("");
  const [imageUrl, setImageUrl]           = useState("");

  const chartData = [
    { name: "Protein", value: data?.protein ?? 0 },
    { name: "Carbs",   value: data?.carbs   ?? 0 },
    { name: "Fat",     value: data?.fat     ?? 0 },
    ...(data?.fiber  !== undefined ? [{ name: "Fiber",  value: data.fiber  }] : []),
    ...(data?.sugars !== undefined ? [{ name: "Sugars", value: data.sugars }] : []),
  ];

  const getSuggestions = async (value: string) => {
    setFood(value);
    if (value.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/suggest?food=${encodeURIComponent(value)}`);
      if (!res.ok) return;
      setSuggestions(await res.json());
    } catch (err) { console.error(err); }
  };

  const searchFoodByName = async (foodName: string) => {
    if (!foodName.trim()) return;
    setSuggestions([]);
    setLoading(true);
    try {
      const [res, imgRes] = await Promise.all([
        fetch(`${API_BASE}/calories?food=${encodeURIComponent(foodName)}`),
        fetch(`${API_BASE}/food-image?food=${encodeURIComponent(foodName)}`),
      ]);
      const result   = await res.json();
      const imgData  = await imgRes.json();
      setImageUrl(imgData.image_url);

      if (result.category === "Beverage") {
        setSelectedDrink(result);
        setShowDrinkModal(true);
      } else {
        setData(result);
        setDrinkSize("");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (foodFromUrl) { setFood(foodFromUrl); searchFoodByName(foodFromUrl); }
  }, [foodFromUrl]);

  const calculateDrink = (multiplier: number, size: string) => {
    if (!selectedDrink) return;
    setDrinkSize(size);
    setData({
      ...selectedDrink,
      calories: selectedDrink.calories * multiplier,
      protein:  selectedDrink.protein  * multiplier,
      carbs:    selectedDrink.carbs    * multiplier,
      fat:      selectedDrink.fat      * multiplier,
      fiber:    selectedDrink.fiber  ? selectedDrink.fiber  * multiplier : undefined,
      sugars:   selectedDrink.sugars ? selectedDrink.sugars * multiplier : undefined,
    });
    setShowDrinkModal(false);
  };

  return (
    <>
      <style>{`
        /* ── Page ── */
        .dp-page {
          min-height: 100vh;
          background: #080810;
          color: #F0EEFF;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Top ambient glow */
        .dp-page::before {
          content: "";
          position: fixed;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(109,40,217,0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .dp-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Hero header ── */
        .dp-hero {
          text-align: center;
          margin-bottom: 48px;
        }
        .dp-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(167,139,250,0.6);
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          padding: 5px 14px;
          border-radius: 99px;
          margin-bottom: 18px;
        }
        .dp-hero h1 {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 700;
          letter-spacing: -1.5px;
          line-height: 1.1;
          margin: 0 0 12px;
          background: linear-gradient(135deg, #F0EEFF 30%, #A78BFA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dp-hero p {
          font-size: 17px;
          color: rgba(196,181,253,0.5);
          margin: 0;
          font-weight: 400;
          letter-spacing: -0.2px;
        }

        /* ── Search ── */
        .dp-search-wrap {
          position: relative;
          width: 100%;
          max-width: 640px;
          margin-bottom: 48px;
        }
        .dp-search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(167,139,250,0.5);
          pointer-events: none;
        }
        .dp-search {
          width: 100%;
          padding: 16px 20px 16px 52px;
          border-radius: 18px;
          background: rgba(28,16,48,0.6);
          border: 1px solid rgba(139,92,246,0.2);
          color: #F0EEFF;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          box-sizing: border-box;
        }
        .dp-search::placeholder { color: rgba(167,139,250,0.35); }
        .dp-search:focus {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12), 0 4px 24px rgba(0,0,0,0.3);
        }

        /* Suggestions */
        .dp-suggestions {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: rgba(18,10,32,0.97);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 16px;
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(16px);
        }
        .dp-suggestion-item {
          padding: 13px 20px;
          cursor: pointer;
          font-size: 14.5px;
          color: rgba(196,181,253,0.8);
          transition: background 0.15s ease, color 0.15s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dp-suggestion-item:hover {
          background: rgba(139,92,246,0.1);
          color: #E9D5FF;
        }
        .dp-suggestion-item + .dp-suggestion-item {
          border-top: 1px solid rgba(139,92,246,0.07);
        }

        /* ── Skeleton ── */
        .dp-skeleton {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
        }
        @media (max-width: 768px) { .dp-skeleton { grid-template-columns: 1fr; } }
        .dp-skel-card {
          border-radius: 24px;
          height: 480px;
          background: linear-gradient(
            110deg,
            rgba(28,16,48,0.6) 0%,
            rgba(40,20,64,0.4) 50%,
            rgba(28,16,48,0.6) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
          border: 1px solid rgba(139,92,246,0.08);
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Results grid ── */
        .dp-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
          animation: fadeUp 0.4s ease both;
        }
        @media (max-width: 768px) { .dp-results { grid-template-columns: 1fr; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Card ── */
        .dp-card {
          background: linear-gradient(145deg, rgba(22,12,42,0.9) 0%, rgba(12,8,24,0.95) 100%);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .dp-card-title {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(167,139,250,0.5);
          margin-bottom: 20px;
        }

        /* ── Food image ── */
        .dp-food-img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(139,92,246,0.1);
        }

        /* ── Food name ── */
        .dp-food-name {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #F0EEFF;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dp-drink-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #A78BFA;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
          padding: 4px 12px;
          border-radius: 99px;
          margin-bottom: 16px;
        }

        /* ── Macro rows ── */
        .dp-macros { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
        .dp-macro-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 14px;
          transition: background 0.15s ease;
        }
        .dp-macro-row:hover { filter: brightness(1.08); }
        .dp-macro-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14.5px;
          color: rgba(224,214,255,0.75);
        }
        .dp-macro-left span { font-size: 18px; }
        .dp-macro-val {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        /* ── Progress bar inside macro ── */
        .dp-bar-wrap {
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          margin-top: 6px;
          overflow: hidden;
        }
        .dp-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        /* ── Chart card ── */
        .dp-chart-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.4px;
          color: #F0EEFF;
          margin-bottom: 4px;
        }
        .dp-chart-sub {
          font-size: 13px;
          color: rgba(167,139,250,0.5);
          margin-bottom: 24px;
        }
        .dp-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }
        .dp-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(196,181,253,0.7);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(139,92,246,0.1);
          padding: 4px 10px;
          border-radius: 99px;
        }
        .dp-legend-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Tooltip ── */
        .dp-tooltip {
          background: rgba(18,10,32,0.96) !important;
          border: 1px solid rgba(139,92,246,0.25) !important;
          border-radius: 12px !important;
          color: #E9D5FF !important;
          font-family: inherit !important;
          font-size: 13px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
          padding: 8px 14px !important;
        }

        /* ── Drink modal ── */
        .dp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .dp-modal {
          background: linear-gradient(145deg, rgba(22,12,42,0.98) 0%, rgba(12,8,24,1) 100%);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 28px;
          padding: 36px 32px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
          animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dp-modal-emoji { font-size: 48px; text-align: center; margin-bottom: 12px; }
        .dp-modal-title {
          font-size: 26px;
          font-weight: 700;
          text-align: center;
          letter-spacing: -0.5px;
          color: #F0EEFF;
          margin-bottom: 6px;
        }
        .dp-modal-sub {
          font-size: 14px;
          text-align: center;
          color: rgba(167,139,250,0.6);
          margin-bottom: 28px;
        }
        .dp-size-btns { display: flex; flex-direction: column; gap: 10px; }
        .dp-size-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(28,16,48,0.7);
          border: 1px solid rgba(139,92,246,0.12);
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
          width: 100%;
          text-align: left;
        }
        .dp-size-btn:hover {
          background: rgba(109,40,217,0.2);
          border-color: rgba(139,92,246,0.35);
          transform: translateY(-1px);
        }
        .dp-size-btn-left { display: flex; align-items: center; gap: 12px; }
        .dp-size-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: rgba(139,92,246,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .dp-size-name {
          font-size: 16px;
          font-weight: 600;
          color: #E9D5FF;
          letter-spacing: -0.2px;
        }
        .dp-size-ml {
          font-size: 13px;
          color: rgba(167,139,250,0.5);
          margin-top: 1px;
        }
        .dp-size-arrow {
          color: rgba(139,92,246,0.5);
          font-size: 18px;
        }
      `}</style>

      <main className="dp-page">
        <div className="dp-inner">

          {/* ── Hero ── */}
          <div className="dp-hero">
            <div className="dp-hero-eyebrow"> presented by Nutrai </div>
            <h1>Nutrition Search</h1>
            <p>Search any food and get an instant nutrition breakdown</p>
          </div>

          {/* ── Search ── */}
          <div className="dp-search-wrap">
            <svg className="dp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search foods, e.g. chicken breast, oats..."
              value={food}
              className="dp-search"
              onChange={(e) => getSuggestions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setSuggestions([]); searchFoodByName(food); }
              }}
            />
            {suggestions.length > 0 && (
              <div className="dp-suggestions">
                {suggestions.map((item, i) => (
                  <div key={i} className="dp-suggestion-item"
                    onClick={() => { setFood(item); setSuggestions([]); searchFoodByName(item); }}>
                    <span>🔍</span> {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Skeleton ── */}
          {loading && (
            <div className="dp-skeleton">
              <div className="dp-skel-card" />
              <div className="dp-skel-card" />
            </div>
          )}

          {/* ── Results ── */}
          {data && !loading && (() => {
            const maxMacro = Math.max(data.protein, data.carbs, data.fat, data.fiber ?? 0, data.sugars ?? 0);
            return (
              <div className="dp-results">

                {/* Nutrition card */}
                <div className="dp-card">
                  <div className="dp-card-title">📋 Nutrition Facts</div>

                  {imageUrl && (
                    <img src={imageUrl} alt={food} className="dp-food-img" />
                  )}

                  <div className="dp-food-name">
                    🍎 {food.charAt(0).toUpperCase() + food.slice(1)}
                  </div>

                  {drinkSize && (
                    <div className="dp-drink-badge">🥤 {drinkSize}</div>
                  )}

                  <div className="dp-macros">
                    {MACRO_CONFIG.map(({ key, label, emoji, unit, color, bg }) => {
                      const val = data[key as keyof NutritionData];
                      if (val === undefined) return null;
                      const pct = key === "calories" ? 100 : Math.min(100, (Number(val) / maxMacro) * 100);
                      return (
                        <div key={key} className="dp-macro-row" style={{ background: bg }}>
                          <div className="dp-macro-left">
                            <span>{emoji}</span>
                            <div>
                              <div>{label}</div>
                              <div className="dp-bar-wrap" style={{ width: 80 }}>
                                <div className="dp-bar-fill" style={{ width: `${pct}%`, background: color }} />
                              </div>
                            </div>
                          </div>
                          <div className="dp-macro-val" style={{ color }}>
                            {Number(val).toFixed(key === "calories" ? 0 : 1)}<span style={{ fontSize: 12, opacity: 0.6, marginLeft: 2 }}>{unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart card */}
                <div className="dp-card">
                  <div className="dp-chart-title">📊 Macro Breakdown</div>
                  <div className="dp-chart-sub">Visual distribution of macronutrients</div>

                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ percent }: { percent?: number }) =>
                          (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                      >
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(18,10,32,0.96)",
                          border: "1px solid rgba(139,92,246,0.25)",
                          borderRadius: 12,
                          color: "#E9D5FF",
                          fontFamily: "inherit",
                          fontSize: 13,
                        }}
                        formatter={(value, name) => [`${Number(value).toFixed(1)}g`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="dp-legend">
                    {chartData.map((item, i) => (
                      <div key={i} className="dp-legend-item">
                        <div className="dp-legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      </main>

      {/* ── Drink size modal ── */}
      {showDrinkModal && (
        <div className="dp-modal-backdrop">
          <div className="dp-modal">
            <div className="dp-modal-emoji">🥤</div>
            <div className="dp-modal-title">Choose Your Size</div>
            <div className="dp-modal-sub">{selectedDrink?.food_name}</div>

            <div className="dp-size-btns">
              {[
                { label: "Small",  ml: "250ml",  multiplier: 2.5, emoji: "🥛" },
                { label: "Medium", ml: "400ml",  multiplier: 4,   emoji: "🧃" },
                { label: "Large",  ml: "600ml",  multiplier: 6,   emoji: "🫙" },
              ].map(({ label, ml, multiplier, emoji }) => (
                <button
                  key={label}
                  className="dp-size-btn"
                  onClick={() => calculateDrink(multiplier, `${label} (${ml})`)}
                >
                  <div className="dp-size-btn-left">
                    <div className="dp-size-icon">{emoji}</div>
                    <div>
                      <div className="dp-size-name">{label}</div>
                      <div className="dp-size-ml">{ml}</div>
                    </div>
                  </div>
                  <div className="dp-size-arrow">›</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DietPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DietContent />
    </Suspense>
  );
}
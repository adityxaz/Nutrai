"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const router = useRouter();
  const [food, setFood] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const goToDiet = () => {
    if (!food.trim()) return;
    router.push(`/diet?food=${encodeURIComponent(food)}`);
  };

  const getSuggestions = async (value: string) => {
    setFood(value);
    if (value.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/suggest?food=${encodeURIComponent(value)}`);
      if (!res.ok) return;
      setSuggestions(await res.json());
    } catch { /* ignore */ }
  };

  const today = new Date();
  const dayNum  = today.getDate().toString().padStart(2, "0");
  const month   = today.toLocaleString("default", { month: "long" }).toUpperCase();
  const year    = today.getFullYear();
  const weekday = today.toLocaleString("default", { weekday: "long" });

  return (
    <main className="shell">

      {/* ── LOGOUT ── */}
      <button
        className="logout-btn"
        onClick={() => { localStorage.removeItem("user"); window.location.href = "/signup"; }}
      >
        Logout
      </button>

      {/* ── SIDEBAR ── */}
      <Sidebar />

      {/* ── MAIN ── */}
      <div className="main-content">

        {/* TOP ROW */}
        <div className="top-row">
          <div>
            <div className="greeting-eyebrow">{weekday} · {month} {dayNum}</div>
            <h1 className="greeting-name">Good Evening,<br />Aditya 👋</h1>
            <p className="greeting-sub">You&apos;re 340 kcal away from your goal today</p>
          </div>
          <div className="date-badge">
            <div className="date-day">{dayNum}</div>
            <div className="date-label">{month} {year}</div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search foods, drinks, meals..."
            value={food}
            onChange={(e) => getSuggestions(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") goToDiet(); }}
          />
          {suggestions.length > 0 && (
            <div className="suggestions-drop">
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setFood(item);
                    setSuggestions([]);
                    router.push(`/diet?food=${encodeURIComponent(item)}`);
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATS STRIP */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div><span className="stat-value">1,860</span><span className="stat-unit">kcal</span></div>
            <div className="stat-label">Calories</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "72%", background: "linear-gradient(90deg,#f97316,#ef4444)" }} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🥩</div>
            <div><span className="stat-value">142</span><span className="stat-unit">g</span></div>
            <div className="stat-label">Protein</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "85%", background: "linear-gradient(90deg,#8b5cf6,#6d28d9)" }} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <div><span className="stat-value">2.1</span><span className="stat-unit">L</span></div>
            <div className="stat-label">Water</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "70%", background: "linear-gradient(90deg,#38bdf8,#0ea5e9)" }} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div><span className="stat-value">8,240</span><span className="stat-unit">steps</span></div>
            <div className="stat-label">Steps</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "82%", background: "linear-gradient(90deg,#34d399,#10b981)" }} /></div>
          </div>
        </div>

        {/* MID ROW */}
        <div className="mid-row">

          {/* Macros card */}
          <div className="macros-card">
            <div className="ring-wrap">
              <svg className="ring" width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#ring-grad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="314" strokeDashoffset="88"
                />
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="ring-center">
                <div className="ring-cal">72%</div>
                <div className="ring-sub">of goal</div>
              </div>
            </div>
            <div className="macro-list">
              <div className="macro-heading">Today&apos;s Macros</div>
              {[
                { name: "Carbs",   val: "204g", pct: "68%", color: "#f97316" },
                { name: "Protein", val: "142g", pct: "85%", color: "#8b5cf6" },
                { name: "Fat",     val: "48g",  pct: "55%", color: "#34d399" },
                { name: "Fiber",   val: "14g",  pct: "40%", color: "#38bdf8" },
              ].map((m) => (
                <div key={m.name} className="macro-row">
                  <div className="macro-dot" style={{ background: m.color }} />
                  <div className="macro-name">{m.name}</div>
                  <div className="macro-bar-bg">
                    <div className="macro-bar-fill" style={{ width: m.pct, background: m.color }} />
                  </div>
                  <div className="macro-val">{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal card */}
          <div className="goal-card">
            <div>
              <div className="goal-eyebrow">Current Goal</div>
              <div className="goal-name">Gain Muscle</div>
              <div className="goal-desc">High protein, caloric surplus with progressive overload training.</div>
            </div>
            <div className="goal-badge">🏋️ Push Day Today</div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="bottom-row">
          <div className="bottom-card">
            <div className="card-eyebrow">Today&apos;s Tasks</div>
            {[
              { label: "Morning Workout", done: true },
              { label: "Drink 3L Water",  done: false },
              { label: "Hit Protein Goal",done: false },
              { label: "Log Dinner",      done: false },
            ].map((t) => (
              <div key={t.label} className="task-item">
                <div className={`task-check ${t.done ? "done" : ""}`}>{t.done ? "✓" : ""}</div>
                <span style={{ color: t.done ? "#555" : "#888", textDecoration: t.done ? "line-through" : "none" }}>{t.label}</span>
              </div>
            ))}
          </div>

          <div className="bottom-card">
            <div className="card-eyebrow">Suggested Meals</div>
            {[
              { emoji: "🍳", name: "Egg White Omelette", cal: "180 kcal" },
              { emoji: "🍗", name: "Grilled Chicken Bowl", cal: "420 kcal" },
              { emoji: "🥗", name: "Quinoa Salad", cal: "310 kcal" },
            ].map((m) => (
              <div key={m.name} className="task-item" style={{ cursor: "pointer" }}>
                <span style={{ fontSize: "18px" }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize: "13px", color: "#ccc" }}>{m.name}</div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>{m.cal}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bottom-card">
            <div className="card-eyebrow">Activity</div>
            <div className="card-title">Push Day</div>
            <div className="card-sub">Chest · Shoulders · Triceps<br />Est. 480 kcal burned</div>
            <button className="workout-btn">View Workout →</button>
          </div>
        </div>

      </div>

      {/* ── STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .shell {
          display: flex;
          min-height: 100vh;
          background: #08080d;
          font-family: 'Sora', sans-serif;
          color: white;
          position: relative;
        }

        /* ── Logout ── */
        .logout-btn {
          position: fixed; top: 16px; right: 20px; z-index: 100;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #555; font-size: 12px; font-family: 'Sora', sans-serif;
          padding: 8px 16px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
          background: rgba(239,68,68,0.06);
        }

        /* ── Main content ── */
        .main-content {
          flex: 1;
          padding: 36px 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .main-content::-webkit-scrollbar { width: 0; }

        /* ── Top row ── */
        .top-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: start;
        }
        .greeting-eyebrow {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: #444; font-weight: 500; margin-bottom: 8px;
        }
        .greeting-name {
          font-size: 36px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15;
          background: linear-gradient(120deg, #fff 0%, #c4b5fd 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .greeting-sub { font-size: 13px; color: #555; margin-top: 8px; }
        .date-badge {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 16px 22px; text-align: right;
        }
        .date-day { font-size: 32px; font-weight: 700; letter-spacing: -0.04em; }
        .date-label { font-size: 10px; color: #444; margin-top: 2px; letter-spacing: 0.1em; }

        /* ── Search ── */
        .search-wrap { position: relative; }
        .search-icon {
          position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
          font-size: 16px; color: #333; pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 16px 20px 16px 50px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: white; font-family: 'Sora', sans-serif; font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: #333; }
        .search-input:focus {
          border-color: rgba(139,92,246,0.45);
          background: rgba(139,92,246,0.05);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .suggestions-drop {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 50;
          background: #111118; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .suggestion-item {
          padding: 14px 20px; font-size: 14px; color: #aaa; cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: rgba(139,92,246,0.1); color: white; }

        /* ── Stats row ── */
        .stats-row {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
        }
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, transform 0.25s;
          cursor: default;
        }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
        }
        .stat-card:hover { border-color: rgba(139,92,246,0.25); transform: translateY(-2px); }
        .stat-icon { font-size: 20px; margin-bottom: 12px; }
        .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
        .stat-unit { font-size: 12px; color: #555; margin-left: 2px; }
        .stat-label { font-size: 10px; color: #444; margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
        .stat-bar { margin-top: 14px; height: 3px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .stat-fill { height: 100%; border-radius: 99px; }

        /* ── Mid row ── */
        .mid-row { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }

        /* Macros */
        .macros-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 26px;
          display: flex; gap: 28px; align-items: center;
        }
        .ring-wrap { position: relative; flex-shrink: 0; }
        .ring { transform: rotate(-90deg); }
        .ring-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .ring-cal { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
        .ring-sub { font-size: 10px; color: #555; letter-spacing: 0.06em; text-transform: uppercase; }
        .macro-list { flex: 1; display: flex; flex-direction: column; gap: 14px; }
        .macro-heading { font-size: 14px; font-weight: 600; color: white; margin-bottom: 2px; }
        .macro-row { display: flex; align-items: center; gap: 10px; }
        .macro-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .macro-name { font-size: 12px; color: #666; width: 56px; }
        .macro-bar-bg { flex: 1; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
        .macro-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        .macro-val { font-size: 12px; color: #888; font-weight: 500; width: 38px; text-align: right; }

        /* Goal */
        .goal-card {
          background: linear-gradient(145deg, rgba(139,92,246,0.1), rgba(109,40,217,0.05));
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 22px; padding: 26px;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .goal-eyebrow { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #7c3aed; margin-bottom: 8px; }
        .goal-name { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
        .goal-desc { font-size: 12px; color: #555; margin-top: 8px; line-height: 1.6; }
        .goal-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.22);
          border-radius: 999px; padding: 7px 14px;
          font-size: 11px; color: #c4b5fd; font-weight: 500;
          margin-top: 20px; width: fit-content;
        }

        /* ── Bottom row ── */
        .bottom-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .bottom-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px; padding: 22px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .bottom-card:hover { border-color: rgba(139,92,246,0.22); transform: translateY(-2px); }
        .card-eyebrow { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin-bottom: 16px; }
        .card-title { font-size: 16px; font-weight: 600; color: white; margin-bottom: 6px; }
        .card-sub { font-size: 12px; color: #555; line-height: 1.6; }
        .task-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 13px; color: #888;
        }
        .task-item:last-child { border-bottom: none; }
        .task-check {
          width: 20px; height: 20px; border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          font-size: 11px;
        }
        .task-check.done {
          background: linear-gradient(135deg,#8b5cf6,#6d28d9);
          border-color: transparent; color: white;
        }
        .workout-btn {
          margin-top: 16px; padding: 10px 16px; width: 100%;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 12px; font-size: 12px; color: #a78bfa;
          font-family: 'Sora', sans-serif; cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          text-align: center;
        }
        .workout-btn:hover {
          background: rgba(139,92,246,0.18);
          border-color: rgba(139,92,246,0.35);
        }
      `}</style>
    </main>
  );
}
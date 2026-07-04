"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    router.replace(user ? "/dashboard" : "/signup");
  }, [router]);

  return (
    <div
      style={{
        background: "#08080d",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "Sora, sans-serif",
      }}
    >
      Loading...
    </div>
  );
}

// ── This is app/dashboard/page.tsx ──

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface FoodLogItem {
  id: number | string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  date: string;
}

interface TaskItem {
  id: number;
  text: string;
  done: boolean;
}

export default function DashboardPage() {
  const [history, setHistory]         = useState<{ date: string; calories: number }[]>([]);
  const [tasks, setTasks]             = useState<TaskItem[]>([]);
  const [isHydrated, setIsHydrated]   = useState(false);
  const [newTask, setNewTask]         = useState("");
  const [userGoal, setUserGoal]       = useState("");
  const [foodLogs, setFoodLogs]       = useState<FoodLogItem[]>([]);
  const [userName, setUserName]       = useState<string>("User");
  const [greeting, setGreeting]       = useState<string>("Welcome");
  const [food, setFood]               = useState<string>("");
  const [quantity, setQuantity]       = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [targets, setTargets]         = useState({ calories: 0, protein: 0, water: 0 });

  const router = useRouter();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const refreshLogs = async (userId: string | number) => {
    try {
      const res = await fetch(`${API_BASE}/food-log/${userId}`);
      if (res.ok) setFoodLogs(await res.json());
    } catch (err) { console.error("Error refreshing logs:", err); }
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    setIsHydrated(true);

    const storedUser = localStorage.getItem("user");
    if (!storedUser) { router.replace("/signup"); return; }

    const user = JSON.parse(storedUser);
    setUserName(user.name || "User");
    setUserGoal(user.goal || "");

    const hrs = new Date().getHours();
    if (hrs < 12)      setGreeting("Good Morning");
    else if (hrs < 17) setGreeting("Good Afternoon");
    else               setGreeting("Good Evening");

    fetch(`${API_BASE}/targets/${user.user_id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setTargets({ calories: d.calories ?? 0, protein: d.protein ?? 0, water: d.water ?? 0 }))
      .catch((e) => console.error("targets:", e));

    refreshLogs(user.user_id);
  }, []);

  // ── Group history ─────────────────────────────────────────────────────────
  useEffect(() => {
    const grouped: Record<string, number> = {};
    foodLogs.forEach((f) => {
      const d = f.date || new Date().toISOString().split("T")[0];
      grouped[d] = (grouped[d] || 0) + Number(f.calories || 0);
    });
    setHistory(
      Object.entries(grouped)
        .map(([date, calories]) => ({ date, calories }))
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }, [foodLogs]);

  // ── Sync tasks ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isHydrated) localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks, isHydrated]);

  // ── Food actions ──────────────────────────────────────────────────────────
  const addFood = async (foodName: string) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await fetch(`${API_BASE}/food-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, food_name: foodName, quantity }),
    });
    await refreshLogs(user.user_id);
    setFood(""); setQuantity(1); setSuggestions([]);
  };

  const updateQuantity = async (log: FoodLogItem, newQty: number) => {
    if (newQty < 1) { deleteFood(log.id); return; }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      await fetch(`${API_BASE}/food-log/${log.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      await refreshLogs(user.user_id);
    } catch (e) { console.error(e); }
  };

  const deleteFood = async (id: number | string) => {
    try {
      await fetch(`${API_BASE}/food-log/${id}`, { method: "DELETE" });
      setFoodLogs((prev) => prev.filter((f) => f.id !== id));
    } catch (e) { console.error(e); }
  };

  const getSuggestions = async (value: string) => {
    setFood(value);
    if (value.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/suggest?food=${encodeURIComponent(value)}`);
      if (res.ok) setSuggestions(await res.json());
    } catch { /* ignore */ }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const consumedCalories = foodLogs.reduce((s, f) => s + Number(f.calories || 0), 0);
  const consumedProtein  = foodLogs.reduce((s, f) => s + Number(f.protein  || 0), 0);
  const consumedCarbs    = foodLogs.reduce((s, f) => s + Number(f.carbs    || 0), 0);
  const consumedFat      = foodLogs.reduce((s, f) => s + Number(f.fat      || 0), 0);

  const macroCompletionPct = targets.calories > 0 ? Math.min((consumedCalories / targets.calories) * 100, 100) : 0;
  const carbTarget = Math.round((targets.calories * 0.5) / 4);
  const fatTarget  = Math.round((targets.calories * 0.25) / 9);

  const averageCalories = history.length > 0
    ? Math.round(history.reduce((s, d) => s + d.calories, 0) / history.length)
    : 0;
  const bestDay = history.length > 0
    ? history.reduce((best, cur) => (cur.calories > best.calories ? cur : best))
    : null;

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask("");
  };
  const toggleTask = (id: number) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  // ── Dates ─────────────────────────────────────────────────────────────────
  const today   = new Date();
  const dayNum  = today.getDate().toString().padStart(2, "0");
  const month   = today.toLocaleString("default", { month: "long" }).toUpperCase();
  const year    = today.getFullYear();
  const weekday = today.toLocaleString("default", { weekday: "long" });

  const goalDescriptions: Record<string, string> = {
    "💪 Gain Muscle":    "High protein intake with a moderate calorie surplus to maximize muscle growth.",
    "📈 Gain Weight":    "Calorie surplus focused on steady and healthy weight gain.",
    "⚖️ Maintain Weight": "Balanced nutrition to maintain your current body weight and health.",
    "🔥 Lose Fat":       "Calorie deficit while preserving muscle mass through adequate protein intake.",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="shell">

      {/* LOGOUT */}
      <button
        className="logout-btn"
        onClick={() => { localStorage.removeItem("user"); router.push("/signup"); }}
      >
        Logout
      </button>

      {/* MAIN CONTENT */}
      <div className="main-content">

        {/* GREETING */}
        <div className="top-row">
          <div>
            <div className="greeting-eyebrow">{weekday} · {month} {dayNum}</div>
            <h1 className="greeting-name">{greeting},<br />{userName} 👋</h1>
            <p className="greeting-sub">
              You&apos;re {Math.max(0, targets.calories - Math.round(consumedCalories)).toLocaleString()} kcal away from your goal today
            </p>
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
            onKeyDown={(e) => { if (e.key === "Enter" && food.trim()) router.push(`/diet?food=${encodeURIComponent(food)}`); }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <button className="qty-adjust-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span style={{ fontSize: "13px", color: "#aaa" }}>Qty: {quantity}</span>
            <button className="qty-adjust-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions-drop">
              {suggestions.map((item, i) => (
                <div key={i} className="suggestion-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ cursor: "pointer", flex: 1 }} onClick={() => { setFood(item); setSuggestions([]); router.push(`/diet?food=${encodeURIComponent(item)}`); }}>
                    {item}
                  </span>
                  <button
                    onClick={() => addFood(item)}
                    style={{ background: "#8b5cf6", border: "none", color: "white", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATS STRIP */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <span className="stat-value">{Math.round(consumedCalories).toLocaleString()}</span>
            <span className="stat-unit"> / {targets.calories.toLocaleString()} kcal</span>
            <div className="stat-label">Calories</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${macroCompletionPct}%`, background: "linear-gradient(90deg,#f97316,#ef4444)" }} /></div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🥩</div>
            <span className="stat-value">{Math.round(consumedProtein)}</span>
            <span className="stat-unit"> / {targets.protein}g</span>
            <div className="stat-label">Protein</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${targets.protein > 0 ? Math.min((consumedProtein / targets.protein) * 100, 100) : 0}%`, background: "linear-gradient(90deg,#8b5cf6,#6d28d9)" }} /></div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <span className="stat-value">{targets.water}</span>
            <span className="stat-unit"> L target</span>
            <div className="stat-label">Water</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "70%", background: "linear-gradient(90deg,#38bdf8,#0ea5e9)" }} /></div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <span className="stat-value">8,240</span>
            <span className="stat-unit"> steps</span>
            <div className="stat-label">Steps</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: "82%", background: "linear-gradient(90deg,#34d399,#10b981)" }} /></div>
          </div>
        </div>

        {/* MID ROW */}
        <div className="mid-row">
          <div className="macros-card">
            <div className="ring-wrap">
              <svg className="ring" width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ring-grad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="314" strokeDashoffset={314 - (314 * macroCompletionPct) / 100} />
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="ring-center">
                <div className="ring-cal">{Math.round(macroCompletionPct)}%</div>
                <div className="ring-sub">of goal</div>
              </div>
            </div>

            <div className="macro-list">
              <div className="macro-heading">Today&apos;s Macros</div>
              {[
                { name: "Carbs",   val: `${Math.round(consumedCarbs)}g`,   pct: `${carbTarget > 0 ? Math.min((consumedCarbs / carbTarget) * 100, 100) : 0}%`,           color: "#f97316" },
                { name: "Protein", val: `${Math.round(consumedProtein)}g`, pct: `${targets.protein > 0 ? Math.min((consumedProtein / targets.protein) * 100, 100) : 0}%`, color: "#8b5cf6" },
                { name: "Fat",     val: `${Math.round(consumedFat)}g`,     pct: `${fatTarget > 0 ? Math.min((consumedFat / fatTarget) * 100, 100) : 0}%`,                 color: "#34d399" },
              ].map((m) => (
                <div key={m.name} className="macro-row">
                  <div className="macro-dot" style={{ background: m.color }} />
                  <div className="macro-name">{m.name}</div>
                  <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ width: m.pct, background: m.color }} /></div>
                  <div className="macro-val">{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="goal-card">
            <div>
              <div className="goal-eyebrow">Current Goal</div>
              <div className="goal-name">{userGoal}</div>
              <div className="goal-desc">{goalDescriptions[userGoal] || "Stay consistent with your nutrition goals."}</div>
            </div>
            <div className="goal-badge">
              {userGoal === "💪 Gain Muscle"    && "💪 Muscle Building"}
              {userGoal === "📈 Gain Weight"    && "📈 Calorie Surplus"}
              {userGoal === "⚖️ Maintain Weight" && "⚖️ Balanced Nutrition"}
              {userGoal === "🔥 Lose Fat"       && "🔥 Fat Loss"}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="bottom-row">

          {/* Nutrition History + Analytics */}
          <div className="bottom-card">
            <div className="card-eyebrow">Nutrition History</div>
            {history.length === 0 ? (
              <div style={{ color: "#444", fontSize: "13px" }}>No history yet</div>
            ) : (
              history.map((day) => (
                <div key={day.date} className="task-item" style={{ justifyContent: "space-between" }}>
                  <span>📅 {day.date}</span>
                  <span style={{ color: "#a78bfa" }}>🔥 {Math.round(day.calories)} kcal</span>
                </div>
              ))
            )}
            <div style={{ marginTop: "20px" }}>
              <div className="card-eyebrow">Analytics</div>
              <div className="task-item" style={{ justifyContent: "space-between" }}>
                <span>📊 Avg Calories</span><span style={{ color: "#a78bfa" }}>{averageCalories} kcal</span>
              </div>
              <div className="task-item" style={{ justifyContent: "space-between" }}>
                <span>⚡ Logging Streak</span><span style={{ color: "#a78bfa" }}>{history.length} days</span>
              </div>
              {bestDay && (
                <div className="task-item" style={{ justifyContent: "space-between" }}>
                  <span>🏆 Best Day</span><span style={{ color: "#a78bfa" }}>{bestDay.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bottom-card">
            <div className="card-eyebrow">Today&apos;s Tasks</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                placeholder="Add a task..."
                style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "12px", outline: "none", fontFamily: "'Sora',sans-serif" }}
              />
              <button onClick={addTask} style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "#fff", border: "none", padding: "0 14px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontFamily: "'Sora',sans-serif" }}>
                Add
              </button>
            </div>
            {tasks.length === 0 && <div style={{ color: "#444", fontSize: "13px" }}>No tasks yet</div>}
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div
                  className={`task-check ${task.done ? "done" : ""}`}
                  onClick={() => toggleTask(task.id)}
                  style={{ cursor: "pointer" }}
                >
                  {task.done ? "✓" : ""}
                </div>
                <span style={{ color: task.done ? "#555" : "#888", textDecoration: task.done ? "line-through" : "none", flex: 1 }}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>

          {/* Food Log + Activity */}
          <div className="bottom-card">
            <div className="card-eyebrow">Today&apos;s Food Log</div>
            {foodLogs.length === 0 ? (
              <div style={{ color: "#444", fontSize: "13px" }}>No foods logged today</div>
            ) : (
              foodLogs.map((log) => (
                <div key={log.id} className="task-item" style={{ justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "16px", flexShrink: 0 }}>🍽️</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.food_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#555" }}>{Math.round(log.calories || 0)} kcal</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <button className="log-qty-btn" onClick={() => updateQuantity(log, Number(log.quantity || 1) - 1)}>-</button>
                    <span style={{ fontSize: "12px", color: "#aaa", minWidth: "16px", textAlign: "center" }}>{log.quantity}</span>
                    <button className="log-qty-btn" onClick={() => updateQuantity(log, Number(log.quantity || 1) + 1)}>+</button>
                    <button className="log-delete-btn" onClick={() => deleteFood(log.id)}>✕</button>
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: "20px" }}>
              <div className="card-eyebrow">Activity</div>
              <div className="card-title">Push Day</div>
              <div className="card-sub">Chest · Shoulders · Triceps<br />Est. 480 kcal burned</div>
              <button className="workout-btn" onClick={() => router.push("/workout")}>View Workout →</button>
            </div>
          </div>

        </div>
      </div>

      {/* STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .shell { display:flex; min-height:100vh; background:#08080d; font-family:'Sora',sans-serif; color:white; position:relative; }

        .logout-btn { position:fixed; top:16px; right:20px; z-index:100; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); color:#555; font-size:12px; font-family:'Sora',sans-serif; padding:8px 16px; border-radius:10px; cursor:pointer; transition:all .2s; }
        .logout-btn:hover { border-color:rgba(239,68,68,.3); color:#f87171; background:rgba(239,68,68,.06); }

        .main-content { flex:1; padding:36px 40px; overflow-y:auto; display:flex; flex-direction:column; gap:22px; }
        .main-content::-webkit-scrollbar { width:0; }

        .top-row { display:grid; grid-template-columns:1fr auto; gap:20px; align-items:start; }
        .greeting-eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#444; font-weight:500; margin-bottom:8px; }
        .greeting-name { font-size:36px; font-weight:700; letter-spacing:-.03em; line-height:1.15; background:linear-gradient(120deg,#fff 0%,#c4b5fd 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .greeting-sub { font-size:13px; color:#555; margin-top:8px; }
        .date-badge { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:16px 22px; text-align:right; }
        .date-day { font-size:32px; font-weight:700; letter-spacing:-.04em; }
        .date-label { font-size:10px; color:#444; margin-top:2px; letter-spacing:.1em; }

        .search-wrap { position:relative; }
        .search-icon { position:absolute; left:18px; top:27px; transform:translateY(-50%); font-size:16px; color:#333; pointer-events:none; }
        .search-input { width:100%; padding:16px 20px 16px 50px; border-radius:18px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); color:white; font-family:'Sora',sans-serif; font-size:14px; outline:none; transition:border-color .2s,background .2s,box-shadow .2s; }
        .search-input::placeholder { color:#333; }
        .search-input:focus { border-color:rgba(139,92,246,.45); background:rgba(139,92,246,.05); box-shadow:0 0 0 3px rgba(139,92,246,.1); }

        .qty-adjust-btn { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:#aaa; border-radius:6px; width:24px; height:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all .2s; }
        .qty-adjust-btn:hover { background:rgba(139,92,246,.2); color:white; border-color:#8b5cf6; }

        .log-qty-btn { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); color:#888; border-radius:4px; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:all .15s; }
        .log-qty-btn:hover { background:rgba(255,255,255,.1); color:white; }
        .log-delete-btn { background:transparent; border:none; color:#ef4444; padding:4px; cursor:pointer; font-size:11px; margin-left:4px; opacity:.6; transition:opacity .15s; }
        .log-delete-btn:hover { opacity:1; }

        .suggestions-drop { position:absolute; top:54px; left:0; right:0; z-index:50; background:#111118; border:1px solid rgba(255,255,255,.08); border-radius:16px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,.5); }
        .suggestion-item { padding:14px 20px; font-size:14px; color:#aaa; cursor:pointer; transition:background .15s,color .15s; border-bottom:1px solid rgba(255,255,255,.04); }
        .suggestion-item:last-child { border-bottom:none; }
        .suggestion-item:hover { background:rgba(139,92,246,.1); color:white; }

        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .stat-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:22px; position:relative; overflow:hidden; transition:border-color .25s,transform .25s; cursor:default; }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); }
        .stat-card:hover { border-color:rgba(139,92,246,.25); transform:translateY(-2px); }
        .stat-icon { font-size:20px; margin-bottom:12px; }
        .stat-value { font-size:26px; font-weight:700; letter-spacing:-.03em; }
        .stat-unit { font-size:12px; color:#555; }
        .stat-label { font-size:10px; color:#444; margin-top:4px; letter-spacing:.08em; text-transform:uppercase; }
        .stat-bar { margin-top:14px; height:3px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden; }
        .stat-fill { height:100%; border-radius:99px; transition:width .8s ease; }

        .mid-row { display:grid; grid-template-columns:2fr 1fr; gap:14px; }
        .macros-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:26px; display:flex; gap:28px; align-items:center; }
        .ring-wrap { position:relative; flex-shrink:0; }
        .ring { transform:rotate(-90deg); }
        .ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ring-cal { font-size:22px; font-weight:700; letter-spacing:-.03em; }
        .ring-sub { font-size:10px; color:#555; letter-spacing:.06em; text-transform:uppercase; }
        .macro-list { flex:1; display:flex; flex-direction:column; gap:14px; }
        .macro-heading { font-size:14px; font-weight:600; color:white; margin-bottom:2px; }
        .macro-row { display:flex; align-items:center; gap:10px; }
        .macro-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .macro-name { font-size:12px; color:#666; width:65px; }
        .macro-bar-bg { flex:1; height:4px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden; }
        .macro-bar-fill { height:100%; border-radius:99px; transition:width .6s ease; }
        .macro-val { font-size:12px; color:#888; font-weight:500; width:65px; text-align:right; }

        .goal-card { background:linear-gradient(145deg,rgba(139,92,246,.1),rgba(109,40,217,.05)); border:1px solid rgba(139,92,246,.2); border-radius:22px; padding:26px; display:flex; flex-direction:column; justify-content:space-between; }
        .goal-eyebrow { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#7c3aed; margin-bottom:8px; }
        .goal-name { font-size:22px; font-weight:700; letter-spacing:-.02em; }
        .goal-desc { font-size:12px; color:#555; margin-top:8px; line-height:1.6; }
        .goal-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.22); border-radius:999px; padding:7px 14px; font-size:11px; color:#c4b5fd; font-weight:500; margin-top:20px; width:fit-content; }

        .bottom-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .bottom-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:22px; transition:border-color .25s,transform .25s; }
        .bottom-card:hover { border-color:rgba(139,92,246,.22); transform:translateY(-2px); }
        .card-eyebrow { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#444; margin-bottom:16px; }
        .card-title { font-size:16px; font-weight:600; color:white; margin-bottom:6px; }
        .card-sub { font-size:12px; color:#555; line-height:1.6; }
        .task-item { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.04); font-size:13px; color:#888; }
        .task-item:last-child { border-bottom:none; }
        .task-check { width:20px; height:20px; border-radius:7px; border:1px solid rgba(255,255,255,.12); flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; }
        .task-check.done { background:linear-gradient(135deg,#8b5cf6,#6d28d9); border-color:transparent; color:white; }
        .workout-btn { margin-top:16px; padding:10px 16px; width:100%; background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.2); border-radius:12px; font-size:12px; color:#a78bfa; font-family:'Sora',sans-serif; cursor:pointer; transition:background .2s,border-color .2s; text-align:center; }
        .workout-btn:hover { background:rgba(139,92,246,.18); border-color:rgba(139,92,246,.35); }
      `}</style>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function StatsPage() {
  const [weight, setWeight]       = useState("");
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [user, setUser]           = useState<any>(null);
  const [history, setHistory]     = useState<any[]>([]);
  const [targets, setTargets]     = useState({ calories: 0, protein: 0, water: 0 });

  // ── Derived values ──────────────────────────────────────────────────────
  const currentWeight   = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0;
  const startingWeight  = weightLogs.length > 0 ? weightLogs[0].weight : 0;
  const goalWeight      = user?.target_weight ?? currentWeight ?? 0;
  const totalChange     = Math.abs(goalWeight - startingWeight);
  const currentChange   = Math.abs(currentWeight - startingWeight);
  const progressPercent = totalChange > 0 ? Math.min((currentChange / totalChange) * 100, 100) : 0;
  const weightDiff      = weightLogs.length > 0 ? (currentWeight - startingWeight).toFixed(1) : "0";

  // ── Chart math ─────────────────────────────────────────────────────────
  const CHART_W = 460;
  const CHART_H = 160;
  const PAD_L   = 28;
  const PAD_B   = 18;
  const INNER_W = CHART_W - PAD_L - 10;
  const INNER_H = CHART_H - PAD_B - 10;

  const chartPoints = (() => {
    if (weightLogs.length < 2) return [];
    const vals   = weightLogs.map((l: any) => Number(l.weight));
    const minVal = Math.min(...vals) - 0.5;
    const maxVal = Math.max(...vals) + 0.5;
    const range  = maxVal - minVal || 1;
    return weightLogs.map((log: any, i: number) => ({
      x: PAD_L + (i / (weightLogs.length - 1)) * INNER_W,
      y: 10 + INNER_H - ((Number(log.weight) - minVal) / range) * INNER_H,
      weight: log.weight,
      date:   log.date,
    }));
  })();

  const polyline = chartPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = chartPoints.length > 0
    ? `M${chartPoints[0].x},${chartPoints[0].y} ` +
      chartPoints.slice(1).map((p) => `L${p.x},${p.y}`).join(" ") +
      ` L${chartPoints[chartPoints.length - 1].x},${CHART_H - PAD_B} L${chartPoints[0].x},${CHART_H - PAD_B} Z`
    : "";

  // ── Data fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setUser(parsed);

    fetch(`${API_BASE}/weight-log/${parsed.user_id}`)
      .then((r) => r.json()).then(setWeightLogs)
      .catch(console.error);

    fetch(`${API_BASE}/targets/${parsed.user_id}`)
      .then((r) => r.json()).then(setTargets)
      .catch(console.error);

    fetch(`${API_BASE}/food-log/${parsed.user_id}`)
      .then((r) => r.json()).then(setHistory)
      .catch(console.error);
  }, []);

  const logWeight = async () => {
    if (!weight || !user) return;
    try {
      const res = await fetch(`${API_BASE}/weight-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          weight:  parseFloat(weight),
          date:    new Date().toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        const updated = await fetch(`${API_BASE}/weight-log/${user.user_id}`).then((r) => r.json());
        setWeightLogs(updated);
        setWeight("");
      }
    } catch (e) { console.error(e); }
  };

  if (!user) {
    return (
      <main style={{ background: "#08080d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#555", fontFamily: "'Sora',sans-serif", fontSize: "14px" }}>Loading…</div>
      </main>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const hrs = new Date().getHours();
  const timeLabel = hrs < 12 ? "Morning" : hrs < 17 ? "Afternoon" : "Evening";

  return (
    <main className="stats-page">

      {/* ── TOP ── */}
      <div className="top-row">
        <div>
          <div className="page-eyebrow">Overview · {new Date().toLocaleString("default",{month:"long"})} {new Date().getFullYear()}</div>
          <h1 className="page-title">Your Stats 📊</h1>
          <p className="page-sub">Tracking your progress toward the goal</p>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <span className="stat-value">{weightLogs.length > 0 ? currentWeight : "—"}</span>
          <span className="stat-unit"> kg</span>
          <div className="stat-label">Current Weight</div>
          <div className="stat-bar"><div className="stat-fill" style={{ width:`${progressPercent}%`, background:"linear-gradient(90deg,#8b5cf6,#6d28d9)" }} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <span className="stat-value">{goalWeight}</span>
          <span className="stat-unit"> kg</span>
          <div className="stat-label">Target Weight</div>
          <div className="stat-bar"><div className="stat-fill" style={{ width:"100%", background:"linear-gradient(90deg,#34d399,#10b981)" }} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">{Number(weightDiff) <= 0 ? "📉" : "📈"}</div>
          <span className="stat-value">{Number(weightDiff) > 0 ? "+" : ""}{weightDiff}</span>
          <span className="stat-unit"> kg</span>
          <div className="stat-label">Total Change</div>
          <div className="stat-bar"><div className="stat-fill" style={{ width:`${Math.min(Math.abs(Number(weightDiff))*10,100)}%`, background:"linear-gradient(90deg,#38bdf8,#0ea5e9)" }} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <span className="stat-value">{targets.calories.toLocaleString()}</span>
          <span className="stat-unit"> kcal</span>
          <div className="stat-label">Daily Target</div>
          <div className="stat-bar"><div className="stat-fill" style={{ width:"78%", background:"linear-gradient(90deg,#f97316,#ef4444)" }} /></div>
        </div>
      </div>

      {/* ── PROFILE + TARGETS ── */}
      <div className="mid-row">
        <div className="card profile-card">
          <div className="card-eyebrow">Profile</div>
          <div className="avatar-ring">{user.name?.[0]?.toUpperCase() ?? "U"}</div>
          <div className="profile-name">{user.name}</div>
          <div style={{ fontSize:"12px", color:"#555", marginTop:"4px" }}>{user.activity_level} · {user.age} yrs</div>
          <div className="profile-goal">🏋️ {user.goal}</div>
        </div>

        <div className="card">
          <div className="card-eyebrow">Daily Targets</div>
          {[
            { icon:"🔥", label:"Calories", value:`${targets.calories} kcal`, bg:"rgba(249,115,22,.1)" },
            { icon:"🥩", label:"Protein",  value:`${targets.protein} g`,     bg:"rgba(139,92,246,.1)" },
            { icon:"💧", label:"Water",    value:`${targets.water} L`,       bg:"rgba(56,189,248,.1)" },
          ].map((t) => (
            <div key={t.label} className="target-row">
              <div className="target-icon-wrap" style={{ background:t.bg }}>{t.icon}</div>
              <div>
                <div className="target-label">{t.label}</div>
                <div className="target-value">{t.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WEIGHT CHART + PROGRESS ── */}
      <div className="mid-row">

        {/* SVG Chart */}
        <div className="card">
          <div className="card-eyebrow">Weight Over Time</div>
          {weightLogs.length < 2 ? (
            <div style={{ color:"#444", fontSize:"13px", padding:"20px 0", textAlign:"center" }}>
              Log at least 2 entries to see your chart
            </div>
          ) : (
            <div className="chart-wrap">
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="100%" overflow="visible">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                {[0.2, 0.4, 0.6, 0.8].map((t) => (
                  <line key={t} x1={PAD_L} y1={10 + INNER_H * t} x2={CHART_W - 10} y2={10 + INNER_H * t}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}

                {/* Area */}
                <path d={areaPath} fill="url(#areaGrad)" />

                {/* Line */}
                <polyline points={polyline} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots */}
                {chartPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4"
                    fill={i === chartPoints.length - 1 ? "#a78bfa" : "#8b5cf6"}
                    stroke="#08080d" strokeWidth="2" />
                ))}

                {/* X-axis labels — show first, middle, last */}
{[...new Set([
  0,
  Math.floor((weightLogs.length - 1) / 2),
  weightLogs.length - 1
])].map((idx) => {

  const p = chartPoints[idx];

  if (!p) return null;

  return (
    <text
      key={idx}
      x={p.x}
      y={CHART_H}
      textAnchor="middle"
      style={{
        fontSize: "10px",
        fill: "#444",
        fontFamily: "'Sora',sans-serif"
      }}
    >
      {weightLogs[idx]?.date?.slice(5)}
    </text>
  );
})}
              </svg>
            </div>
          )}
        </div>

        {/* Progress + Log input */}
        <div className="card">
          <div className="card-eyebrow">Goal Progress</div>
          <div className="progress-big">{Math.round(progressPercent)}%</div>
          <div style={{ fontSize:"12px", color:"#555" }}>Toward target weight of {goalWeight} kg</div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width:`${progressPercent}%` }} />
          </div>
          <div className="progress-row">
            <span>Start: {startingWeight} kg</span>
            <span>Now: {currentWeight} kg</span>
            <span>Goal: {goalWeight} kg</span>
          </div>

          {/* On-track badge */}
          <div className="ontrack-badge">
            <div style={{ fontSize:"10px", letterSpacing:".12em", textTransform:"uppercase", color:"#34d399", marginBottom:"6px" }}>
              {progressPercent >= 100 ? "🎉 Goal Reached!" : "On Track"}
            </div>
            <div style={{ fontSize:"13px", color:"#aaa", lineHeight:"1.6" }}>
              {weightLogs.length > 0
                ? <>Changed <span style={{ color:"white", fontWeight:600 }}>{Math.abs(Number(weightDiff))} kg</span> — <span style={{ color:"white", fontWeight:600 }}>{Math.abs(goalWeight - currentWeight).toFixed(1)} kg</span> to go!</>
                : "Start logging your weight to track progress."}
            </div>
          </div>

          {/* Log input */}
          <div style={{ marginTop:"20px" }}>
            <div className="card-eyebrow">Log Today&apos;s Weight</div>
            <div className="log-row">
              <input
                className="log-input"
                type="number"
                placeholder="e.g. 74.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") logWeight(); }}
              />
              <button className="log-btn" onClick={logWeight}>Log</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── WEIGHT LOG + NUTRITION HISTORY ── */}
      <div className="mid-row">

        <div className="card">
          <div className="card-eyebrow">Weight Log</div>
          {weightLogs.length === 0 ? (
            <div style={{ color:"#444", fontSize:"13px", padding:"10px 0" }}>No weight entries yet</div>
          ) : (
            <div className="scroll-list">
              {[...weightLogs].reverse().map((log: any, i: number, arr: any[]) => {
                const prev  = arr[i + 1];
                const delta = prev ? (Number(log.weight) - Number(prev.weight)).toFixed(1) : null;
                const up    = delta !== null && Number(delta) > 0;
                return (
                  <div key={`${log.id}-${log.date}`} className="weight-row">
                    <span style={{ color:"#666", fontSize:"12px" }}>{log.date}</span>
                    <span className="weight-val">{log.weight} kg</span>
                    {delta !== null && (
                      <span className={`weight-delta ${up ? "delta-up" : "delta-down"}`}>
                        {up ? "▲" : "▼"} {Math.abs(Number(delta))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-eyebrow">Nutrition History</div>
          {history.length === 0 ? (
            <div style={{ color:"#444", fontSize:"13px", padding:"10px 0" }}>No food logged yet</div>
          ) : (
            <div className="scroll-list">
              {history.map((item: any) => (
                <div key={item.id} className="history-item">
                  <div className="history-left">
                    <div className="history-icon">🍽️</div>
                    <div>
                      <div className="history-name">{item.food_name}</div>
                      <div className="history-date">{item.date}</div>
                    </div>
                  </div>
                  <div className="history-cal">{item.calories} kcal</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .stats-page {
          min-height: 100vh;
          background: #08080d;
          font-family: 'Sora', sans-serif;
          color: white;
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        /* Top */
        .top-row { display:flex; justify-content:space-between; align-items:flex-start; }
        .page-eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .page-title {
          font-size:36px; font-weight:700; letter-spacing:-.03em;
          background:linear-gradient(120deg,#fff 0%,#c4b5fd 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .page-sub { font-size:13px; color:#555; margin-top:6px; }

        /* Stats strip */
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .stat-card {
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:22px; padding:22px; position:relative; overflow:hidden;
          transition:border-color .25s,transform .25s; cursor:default;
        }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); }
        .stat-card:hover { border-color:rgba(139,92,246,.25); transform:translateY(-2px); }
        .stat-icon { font-size:20px; margin-bottom:12px; }
        .stat-value { font-size:26px; font-weight:700; letter-spacing:-.03em; }
        .stat-unit { font-size:12px; color:#555; }
        .stat-label { font-size:10px; color:#444; margin-top:4px; letter-spacing:.08em; text-transform:uppercase; }
        .stat-bar { margin-top:14px; height:3px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden; }
        .stat-fill { height:100%; border-radius:99px; transition:width .8s ease; }

        /* Grid rows */
        .mid-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        /* Card base */
        .card {
          background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07);
          border-radius:22px; padding:26px; position:relative; overflow:hidden;
          transition:border-color .25s,transform .25s;
        }
        .card:hover { border-color:rgba(139,92,246,.18); }
        .card-eyebrow { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#444; margin-bottom:16px; }

        /* Profile */
        .profile-card {
          background:linear-gradient(145deg,rgba(139,92,246,.1),rgba(109,40,217,.05));
          border:1px solid rgba(139,92,246,.2);
        }
        .avatar-ring {
          width:56px; height:56px; border-radius:50%;
          background:linear-gradient(135deg,#8b5cf6,#6d28d9);
          display:flex; align-items:center; justify-content:center;
          font-size:22px; font-weight:700; margin-bottom:14px;
          box-shadow:0 0 20px rgba(139,92,246,.3);
        }
        .profile-name { font-size:22px; font-weight:700; letter-spacing:-.03em; }
        .profile-goal {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.22);
          border-radius:999px; padding:5px 12px;
          font-size:11px; color:#c4b5fd; font-weight:500; margin-top:10px;
        }

        /* Targets */
        .target-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.04); }
        .target-row:last-child { border-bottom:none; }
        .target-icon-wrap { width:36px; height:36px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .target-label { font-size:12px; color:#555; }
        .target-value { font-size:15px; font-weight:600; }

        /* Chart */
        .chart-wrap { width:100%; height:160px; margin-top:8px; }

        /* Progress */
        .progress-big { font-size:36px; font-weight:700; letter-spacing:-.04em; margin-bottom:4px; }
        .progress-track { width:100%; height:6px; background:rgba(255,255,255,.06); border-radius:99px; overflow:hidden; margin:14px 0 6px; }
        .progress-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,#8b5cf6,#a78bfa); transition:width .8s ease; }
        .progress-row { display:flex; justify-content:space-between; font-size:11px; color:#555; }
        .ontrack-badge { margin-top:18px; padding:14px; background:rgba(52,211,153,.05); border:1px solid rgba(52,211,153,.13); border-radius:14px; }

        /* Log input */
        .log-row { display:flex; gap:10px; }
        .log-input {
          flex:1; padding:12px 16px; border-radius:14px;
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
          color:white; font-family:'Sora',sans-serif; font-size:14px; outline:none;
          transition:border-color .2s,box-shadow .2s;
        }
        .log-input::placeholder { color:#333; }
        .log-input:focus { border-color:rgba(139,92,246,.45); box-shadow:0 0 0 3px rgba(139,92,246,.1); }
        .log-btn {
          padding:12px 20px; border-radius:14px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:white;
          font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
          box-shadow:0 0 20px rgba(139,92,246,.3); transition:transform .15s,box-shadow .15s;
        }
        .log-btn:hover { transform:scale(1.03); box-shadow:0 0 30px rgba(139,92,246,.5); }

        /* Scroll list */
        .scroll-list { max-height:260px; overflow-y:auto; }
        .scroll-list::-webkit-scrollbar { width:0; }

        /* Weight log rows */
        .weight-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:9px 12px; border-radius:12px;
          background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.04);
          margin-bottom:6px; font-size:13px; color:#888;
        }
        .weight-val { font-weight:600; color:#c4b5fd; }
        .weight-delta { font-size:11px; padding:2px 8px; border-radius:99px; }
        .delta-up   { background:rgba(239,68,68,.1);  color:#f87171; }
        .delta-down { background:rgba(52,211,153,.1); color:#34d399; }

        /* Nutrition history */
        .history-item { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.04); }
        .history-item:last-child { border-bottom:none; }
        .history-left { display:flex; align-items:center; gap:10px; }
        .history-icon { width:34px; height:34px; border-radius:10px; background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.18); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
        .history-name { font-size:13px; color:#ccc; }
        .history-date { font-size:11px; color:#444; margin-top:2px; }
        .history-cal  { font-size:13px; font-weight:500; color:#a78bfa; white-space:nowrap; }
      `}</style>
    </main>
  );
}
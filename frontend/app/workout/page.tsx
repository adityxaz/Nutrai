"use client";

import { useEffect, useState } from "react";
import { exercises } from "@/data/exercises";
import { workoutPlans } from "@/data/workoutPlans";

export default function WorkoutPage() {
  const [user, setUser]                    = useState<any>({});
  const [completedExercises, setCompleted] = useState<string[]>([]);
  const [isHydrated, setIsHydrated]        = useState(false);
  const [selectedExercise, setSelected]    = useState<any>(null);
  const [closing, setClosing]              = useState(false);

  const today              = new Date();
  const dayName            = today.toLocaleDateString("en-US", { weekday: "long" });
  const dayOfMonth         = today.getDate().toString().padStart(2, "0");
  const formattedMonthYear = today.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();

  useEffect(() => {
    const storedUser      = localStorage.getItem("user");
    const storedCompleted = localStorage.getItem("completedExercises");
    if (storedUser)      setUser(JSON.parse(storedUser));
    if (storedCompleted) setCompleted(JSON.parse(storedCompleted));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const trainingGoal   = user.training_goal || "Muscle Growth";
  const selectedPlan   = workoutPlans[trainingGoal as keyof typeof workoutPlans];
  const todayWorkout   = selectedPlan?.[dayName as keyof typeof selectedPlan];
  const totalExercises = todayWorkout?.exercises.length || 0;
  const completedCount = todayWorkout?.exercises.filter((id: string) => completedExercises.includes(id)).length || 0;
  const completionPct  = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const toggleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = completedExercises.includes(id)
      ? completedExercises.filter((x) => x !== id)
      : [...completedExercises, id];
    setCompleted(updated);
    localStorage.setItem("completedExercises", JSON.stringify(updated));
  };

  const openModal  = (ex: any) => { setClosing(false); setSelected(ex); };
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setSelected(null); setClosing(false); }, 260);
  };

  if (!isHydrated) {
    return (
      <main style={{ background: "#08080d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#555", fontFamily: "'Sora',sans-serif", fontSize: "14px" }}>Loading…</span>
      </main>
    );
  }

  return (
    <main className="workout-page">

      {/* TOP */}
      <div className="top-row">
        <div>
          <div className="page-eyebrow">{dayName} · {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          <h1 className="page-title">Gym 🏋️</h1>
          <p className="page-sub">{todayWorkout?.title || "Rest Day"} — {todayWorkout ? "Active Routine" : "No scheduled targets"}</p>
        </div>
        <div className="date-badge">
          <div className="date-day">{dayOfMonth}</div>
          <div className="date-label">{formattedMonthYear}</div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        {[
          { icon: "🔥", value: "4",                  unit: "day streak",        label: "Streak",        pct: "57%", color: "linear-gradient(90deg,#f97316,#ef4444)" },
          { icon: "✅", value: "3",                  unit: "/ 7",               label: "This Week",     pct: "43%", color: "linear-gradient(90deg,#34d399,#10b981)" },
          { icon: "⚡", value: `${completedCount}`,  unit: `/ ${totalExercises}`,label: "Today's Done",  pct: `${completionPct}%`, color: "linear-gradient(90deg,#8b5cf6,#6d28d9)" },
          { icon: "⏱️",value: "~55",                 unit: "min",               label: "Est. Duration", pct: "80%", color: "linear-gradient(90deg,#38bdf8,#0ea5e9)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div><span className="stat-value">{s.value}</span><span className="stat-unit"> {s.unit}</span></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: s.pct, background: s.color }} /></div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">

        {/* Exercise panel */}
        <div className="exercises-panel">
          <div className="panel-eyebrow">Today&apos;s Exercises</div>
          <div className="panel-title">{todayWorkout?.title || "No Routine"}</div>
          <div className="panel-sub">{todayWorkout ? "Tap a card to view instructions" : "Enjoy your rest day 😴"}</div>

          {!todayWorkout ? (
            <div className="rest-card">
              <div className="rest-emoji">😴</div>
              <div className="rest-title">Rest Day</div>
              <div className="rest-sub">Recovery is part of the process.</div>
            </div>
          ) : (
            <div className="exercise-grid">
              {todayWorkout.exercises.map((exerciseId: string, index: number) => {
                const exercise = exercises[exerciseId as keyof typeof exercises];
                if (!exercise) return null;
                const done = completedExercises.includes(exerciseId);

                return (
                  <div
                    key={exerciseId}
                    className={`ex-card ${done ? "ex-card-done" : ""}`}
                    onClick={() => openModal(exercise)}
                  >
                    {/* ── IMAGE ── */}
                    <div className="ex-img-wrap">
                      {exercise.image ? (
                        <img
                          src={exercise.image}
                          alt={exercise.name}
                          className="ex-img"
                        />
                      ) : (
                        <div className="ex-img-placeholder">💪</div>
                      )}

                      {/* dark gradient so text below is readable even on white images */}
                      <div className="ex-img-gradient" />

                      {done && (
                        <div className="ex-done-overlay">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      <div className="ex-num-badge">{index + 1}</div>
                    </div>

                    {/* ── INFO ── */}
                    <div className="ex-info">
                      <div className="ex-info-top">
                        <div className="ex-name">{exercise.name}</div>
                        <div className="ex-muscles">{exercise.muscles?.join(" · ")}</div>
                        <div className="ex-sets-label">{exercise.sets || 4} sets · {exercise.reps || 10} reps</div>
                      </div>

                      <div
                        className={`ex-checkbox ${done ? "ex-checkbox-done" : ""}`}
                        onClick={(e) => toggleComplete(e, exerciseId)}
                      >
                        {done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="right-col">

          <div className="ring-card">
            <div className="panel-eyebrow">Completion</div>
            <div className="ring-wrap">
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11" />
                <circle cx="65" cy="65" r="54" fill="none"
                  stroke="url(#ringG)" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray="339"
                  strokeDashoffset={339 - (339 * completionPct) / 100}
                  style={{ transition: "stroke-dashoffset 0.7s ease" }}
                />
                <defs>
                  <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="ring-center">
                <div className="ring-pct">{completionPct}%</div>
                <div className="ring-sub">done</div>
              </div>
            </div>
            <div className="ring-label">{completedCount} of {totalExercises} exercises</div>
            <div className="workout-badge">💪 {todayWorkout?.title || "Rest Day"}</div>
          </div>

          <div className="week-card">
            <div className="panel-eyebrow">This Week</div>
            <div className="week-strip">
              {["M","T","W","T","F","S","S"].map((d, i) => {
                const todayIdx = (today.getDay() + 6) % 7;
                const isToday  = i === todayIdx;
                const isPast   = i < todayIdx;
                return (
                  <div key={i} className="week-day">
                    <div className={`week-dot ${isToday ? "week-dot-today" : isPast ? "week-dot-past" : "week-dot-future"}`}>{d}</div>
                    <div className="week-day-label" style={{ color: isToday ? "#a78bfa" : "#444" }}>{isToday ? "Today" : ""}</div>
                  </div>
                );
              })}
            </div>
            <div className="week-footer">
              <span>🔥 4 day streak</span>
              <span style={{ color: "#a78bfa" }}>3 / 7 done</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {selectedExercise && (
        <div
          className={`modal-overlay ${closing ? "overlay-out" : "overlay-in"}`}
          onClick={handleClose}
        >
          <div
            className={`modal-box ${closing ? "modal-out" : "modal-in"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={handleClose}>✕</button>

            {/* ── Modal image: dark bg so white/transparent images look clean ── */}
            <div className="modal-img-wrap">
              {selectedExercise.image ? (
                <img src={selectedExercise.image} alt={selectedExercise.name} className="modal-img" />
              ) : (
                <div className="modal-img-placeholder">💪</div>
              )}
              <div className="modal-img-fade" />
            </div>

            <div className="modal-header">
              <div className="modal-name">{selectedExercise.name}</div>
              <div className="modal-muscles">{selectedExercise.muscles?.join(" · ")}</div>
            </div>

            <div className="modal-divider" />

            <div className="modal-stats">
              {[
                { label: "Sets", value: selectedExercise.sets || "4" },
                { label: "Reps", value: selectedExercise.reps || "10" },
                { label: "Rest", value: selectedExercise.rest || "60s", highlight: true },
              ].map((s) => (
                <div key={s.label} className="modal-stat-box">
                  <div className="modal-stat-label">{s.label}</div>
                  <div className="modal-stat-val" style={{ color: s.highlight ? "#a78bfa" : "white" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="modal-instr-title">Instructions</div>
            <ol className="modal-instr-list">
              {selectedExercise.instructions?.length > 0
                ? selectedExercise.instructions.map((step: string, i: number) => (
                    <li key={i} className="modal-instr-item">
                      <span className="modal-instr-num">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))
                : <li className="modal-instr-empty">No instructions available.</li>
              }
            </ol>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .workout-page {
          min-height:100vh; background:#08080d;
          font-family:'Sora',sans-serif; color:white;
          padding:36px 40px; display:flex; flex-direction:column; gap:22px;
        }

        .top-row { display:flex; justify-content:space-between; align-items:flex-start; }
        .page-eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#444; margin-bottom:8px; }
        .page-title {
          font-size:36px; font-weight:700; letter-spacing:-.03em;
          background:linear-gradient(120deg,#fff 0%,#c4b5fd 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .page-sub { font-size:13px; color:#555; margin-top:6px; }
        .date-badge { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:14px 20px; text-align:right; }
        .date-day { font-size:30px; font-weight:700; letter-spacing:-.04em; }
        .date-label { font-size:10px; color:#444; margin-top:2px; letter-spacing:.1em; }

        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .stat-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:20px; position:relative; overflow:hidden; transition:border-color .25s,transform .25s; }
        .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); }
        .stat-card:hover { border-color:rgba(139,92,246,.25); transform:translateY(-2px); }
        .stat-icon { font-size:18px; margin-bottom:10px; }
        .stat-value { font-size:24px; font-weight:700; letter-spacing:-.03em; }
        .stat-unit { font-size:11px; color:#555; }
        .stat-label { font-size:10px; color:#444; margin-top:3px; letter-spacing:.08em; text-transform:uppercase; }
        .stat-bar { margin-top:12px; height:3px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden; }
        .stat-fill { height:100%; border-radius:99px; transition:width .8s ease; }

        .main-grid { display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:start; }

        .exercises-panel { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:24px; padding:26px; }
        .panel-eyebrow { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#444; margin-bottom:6px; }
        .panel-title { font-size:18px; font-weight:700; letter-spacing:-.02em; }
        .panel-sub { font-size:12px; color:#555; margin-top:4px; margin-bottom:20px; }

        .exercise-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }

        /* ── Exercise card ── */
        .ex-card {
          border-radius:24px; overflow:hidden;
          background:#0d0d14;
          border:1px solid rgba(255,255,255,.07);
          cursor:pointer;
          transition:transform .2s, border-color .2s, box-shadow .2s;
          display:flex; flex-direction:column;
        }
        .ex-card:hover { transform:translateY(-4px); border-color:rgba(139,92,246,.4); box-shadow:0 16px 40px rgba(139,92,246,.14); }
        .ex-card-done { border-color:rgba(52,211,153,.3) !important; }

        /* Image wrapper — fixed height, dark bg eliminates checkerboard */
        .ex-img-wrap {
          position:relative;
          width:100%; height:200px;
          background:#111118;          /* dark solid bg — no checkerboard */
          overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        .ex-img {
          width:100%; height:100%;
          object-fit:contain;           /* show whole figure, never crop */
          object-position:center;
          display:block;
          /* mix-blend-mode removes white backgrounds on PNG/GIF anatomy images */
          mix-blend-mode:luminosity;
          filter:brightness(1.05) contrast(1.05);
          transition:transform .35s ease;
        }
        .ex-card:hover .ex-img { transform:scale(1.06); }
        .ex-img-placeholder { font-size:40px; }

        /* Subtle dark vignette at bottom of image */
        .ex-img-gradient {
          position:absolute; bottom:0; left:0; right:0; height:60px;
          background:linear-gradient(to bottom, transparent, #0d0d14);
          pointer-events:none;
        }

        .ex-done-overlay {
          position:absolute; inset:0;
          background:rgba(16,185,129,.3);
          display:flex; align-items:center; justify-content:center;
          backdrop-filter:blur(3px);
        }
        .ex-num-badge {
          position:absolute; top:10px; left:10px;
          width:26px; height:26px; border-radius:8px;
          background:rgba(0,0,0,.65); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.12);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; color:white;
        }

        /* Info section */
        .ex-info { padding:14px 14px 14px; display:flex; justify-content:space-between; align-items:flex-end; gap:10px; }
        .ex-info-top { flex:1; }
        .ex-name { font-size:14px; font-weight:600; color:#e5e7eb; line-height:1.3; }
        .ex-muscles { font-size:11px; color:#555; margin-top:3px; }
        .ex-sets-label { font-size:11px; color:#6b7280; margin-top:6px; font-family:monospace; }

        .ex-checkbox {
          width:26px; height:26px; border-radius:9px; flex-shrink:0;
          border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .2s, border-color .2s, transform .15s;
        }
        .ex-checkbox:hover { border-color:rgba(139,92,246,.5); transform:scale(1.1); }
        .ex-checkbox-done { background:linear-gradient(135deg,#10b981,#059669) !important; border-color:transparent !important; }

        .rest-card { text-align:center; padding:48px 26px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.05); border-radius:20px; margin-top:8px; }
        .rest-emoji { font-size:48px; margin-bottom:14px; }
        .rest-title { font-size:18px; font-weight:600; color:#888; }
        .rest-sub { font-size:12px; color:#444; margin-top:6px; }

        .right-col { display:flex; flex-direction:column; gap:14px; }

        .ring-card { background:linear-gradient(145deg,rgba(139,92,246,.1),rgba(109,40,217,.05)); border:1px solid rgba(139,92,246,.2); border-radius:22px; padding:24px; text-align:center; }
        .ring-wrap { position:relative; width:130px; height:130px; margin:16px auto 12px; }
        .ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ring-pct { font-size:24px; font-weight:700; letter-spacing:-.03em; }
        .ring-sub { font-size:10px; color:#555; text-transform:uppercase; letter-spacing:.06em; }
        .ring-label { font-size:13px; color:#888; margin-bottom:10px; }
        .workout-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.22); border-radius:999px; padding:6px 14px; font-size:11px; color:#c4b5fd; font-weight:500; }

        .week-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:22px; }
        .week-strip { display:flex; justify-content:space-between; margin-top:10px; }
        .week-day { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .week-dot { width:34px; height:34px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; }
        .week-dot-today  { background:rgba(139,92,246,.18); border:1px solid rgba(139,92,246,.35); color:#a78bfa; }
        .week-dot-past   { background:linear-gradient(135deg,#8b5cf6,#6d28d9); color:white; }
        .week-dot-future { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); color:#444; }
        .week-day-label  { font-size:9px; height:12px; }
        .week-footer { display:flex; justify-content:space-between; font-size:12px; color:#555; margin-top:14px; }

        /* ── Modal ── */
        .modal-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(14px); }
        .overlay-in  { animation:overlay-in  .3s ease forwards; }
        .overlay-out { animation:overlay-out .26s ease forwards; }
        @keyframes overlay-in  { from{background:rgba(5,3,10,0)}    to{background:rgba(5,3,10,.88)} }
        @keyframes overlay-out { from{background:rgba(5,3,10,.88)}  to{background:rgba(5,3,10,0)}  }

        .modal-box {
          position:relative; z-index:51; width:100%; max-width:520px;
          background:linear-gradient(160deg,rgba(18,11,34,.98) 0%,rgba(9,5,18,.99) 100%);
          border:1px solid rgba(139,92,246,.25); border-radius:28px;
          box-shadow:0 0 80px rgba(139,92,246,.15), 0 40px 80px rgba(0,0,0,.7);
          overflow:hidden;
        }
        .modal-in  { animation:modal-in  .4s cubic-bezier(.34,1.56,.64,1) both; }
        .modal-out { animation:modal-out .26s ease both; }
        @keyframes modal-in  { from{opacity:0;transform:translateY(28px) scale(.94)} to{opacity:1;transform:none} }
        @keyframes modal-out { from{opacity:1;transform:none} to{opacity:0;transform:translateY(16px) scale(.96)} }

        .modal-close {
          position:absolute; top:14px; right:14px; z-index:10;
          width:32px; height:32px; border-radius:50%;
          border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.55);
          color:#888; font-size:13px; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:background .2s, color .2s; backdrop-filter:blur(8px);
        }
        .modal-close:hover { background:rgba(139,92,246,.25); color:#c4b5fd; border-color:rgba(139,92,246,.45); }

        /* Modal image: dark bg + contain so anatomy images never crop weirdly */
        .modal-img-wrap {
          position:relative; width:100%; height:240px;
          background:#111118;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
        }
        .modal-img {
          width:100%; height:100%;
          object-fit:contain;
          object-position:center;
          mix-blend-mode:luminosity;
          filter:brightness(1.05) contrast(1.05);
        }
        .modal-img-fade {
          position:absolute; bottom:0; left:0; right:0; height:80px;
          background:linear-gradient(to bottom, transparent, rgba(18,11,34,.98));
          pointer-events:none;
        }
        .modal-img-placeholder { font-size:64px; }

        .modal-header { padding:18px 22px 0; }
        .modal-name   { font-size:22px; font-weight:700; letter-spacing:-.03em; }
        .modal-muscles { font-size:12px; color:#555; margin-top:5px; }

        .modal-divider { height:1px; background:linear-gradient(to right,transparent,rgba(139,92,246,.3),transparent); margin:16px 22px; }

        .modal-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:0 22px; }
        .modal-stat-box { text-align:center; padding:14px; border-radius:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); }
        .modal-stat-label { font-size:10px; color:#555; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px; }
        .modal-stat-val   { font-size:20px; font-weight:700; letter-spacing:-.02em; }

        .modal-instr-title { font-size:13px; font-weight:600; padding:18px 22px 10px; color:#888; letter-spacing:.06em; text-transform:uppercase; }
        .modal-instr-list  { padding:0 22px 22px; max-height:160px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; list-style:none; margin:0; }
        .modal-instr-list::-webkit-scrollbar { width:0; }
        .modal-instr-item  { display:flex; gap:10px; font-size:13px; color:#aaa; line-height:1.65; }
        .modal-instr-num   { color:#a78bfa; font-weight:700; font-family:monospace; flex-shrink:0; }
        .modal-instr-empty { font-size:13px; color:#444; font-style:italic; }
      `}</style>
    </main>
  );
}
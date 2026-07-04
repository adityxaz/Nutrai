"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { exercises } from "@/data/exercises";

export default function ExercisePage() {
  const params   = useParams();
  const router   = useRouter();
  const exercise = exercises[params.exercise as keyof typeof exercises];

  const [completed, setCompleted]   = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("completedExercises") || "[]");
    setCompleted(saved.includes(params.exercise));
  }, [params.exercise]);

  const toggleComplete = () => {
    const saved: string[] = JSON.parse(localStorage.getItem("completedExercises") || "[]");
    let updated: string[];
    if (saved.includes(params.exercise as string)) {
      updated = saved.filter((id) => id !== params.exercise);
      setCompleted(false); setJustMarked(false);
    } else {
      updated = [...saved, params.exercise as string];
      setCompleted(true); setJustMarked(true);
      setTimeout(() => setJustMarked(false), 1800);
    }
    localStorage.setItem("completedExercises", JSON.stringify(updated));
  };

  if (!exercise) {
    return (
      <main style={{ background:"#08080d", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", fontFamily:"'Sora',sans-serif", color:"#555" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>🤷</div>
          <div style={{ fontSize:"18px", fontWeight:600, color:"#888" }}>Exercise not found</div>
          <button onClick={() => router.back()} style={{ marginTop:"20px", padding:"10px 24px", borderRadius:"12px", background:"rgba(139,92,246,.15)", border:"1px solid rgba(139,92,246,.3)", color:"#a78bfa", fontSize:"13px", cursor:"pointer", fontFamily:"'Sora',sans-serif" }}>
            ← Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ex-page">

      <button className="back-btn" onClick={() => router.back()}>← Back</button>

      {/* ── HERO: dark bg + contain so anatomy images show fully without cropping ── */}
      <div className="hero-wrap">
        {exercise.image ? (
          <img src={exercise.image} alt={exercise.name} className="hero-img" />
        ) : (
          <div className="hero-placeholder"><span style={{ fontSize:"80px" }}>💪</span></div>
        )}
        <div className="hero-fade" />
        {completed && <div className="hero-done-badge">✓ Completed</div>}
      </div>

      {/* ── CONTENT ── */}
      <div className="content">

        <div className="title-row">
          <div className="page-eyebrow">Exercise Detail</div>
          <h1 className="ex-title">{exercise.name}</h1>
          <p className="ex-muscles-sub">{exercise.muscles?.join(" · ")}</p>
        </div>

        <div className="stat-chips">
          {[
            { icon:"🔁", label:"Sets", value: exercise.sets  || "4"   },
            { icon:"⚡", label:"Reps", value: exercise.reps  || "10"  },
            { icon:"⏱️", label:"Rest", value: exercise.rest  || "60s" },
          ].map((s) => (
            <div key={s.label} className="chip">
              <div className="chip-icon">{s.icon}</div>
              <div className="chip-value">{s.value}</div>
              <div className="chip-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-card">
          <div className="section-eyebrow">Instructions</div>
          <ol className="instr-list">
            {exercise.instructions?.length > 0
              ? exercise.instructions.map((step: string, i: number) => (
                  <li key={i} className="instr-item">
                    <div className="instr-num">{i + 1}</div>
                    <div className="instr-text">{step}</div>
                  </li>
                ))
              : <li className="instr-empty">No instructions available for this movement.</li>
            }
          </ol>
        </div>

        {exercise.muscles?.length > 0 && (
          <div className="section-card">
            <div className="section-eyebrow">Target Muscles</div>
            <div className="muscle-chips">
              {exercise.muscles.map((m: string, i: number) => (
                <span key={i} className="muscle-chip">{m}</span>
              ))}
            </div>
          </div>
        )}

        <button
          className={`complete-btn ${completed ? "complete-btn-done" : ""} ${justMarked ? "complete-btn-pulse" : ""}`}
          onClick={toggleComplete}
        >
          {justMarked ? (
            <span className="btn-inner">🎉 Marked as Complete!</span>
          ) : completed ? (
            <span className="btn-inner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              Completed — Tap to Undo
            </span>
          ) : (
            <span className="btn-inner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              Mark as Complete
            </span>
          )}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; }

        .ex-page { min-height:100vh; background:#08080d; font-family:'Sora',sans-serif; color:white; position:relative; }

        .back-btn {
          position:fixed; top:20px; left:24px; z-index:30;
          padding:8px 16px; border-radius:12px;
          background:rgba(0,0,0,.55); backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,.1);
          color:#aaa; font-size:13px; font-family:'Sora',sans-serif; cursor:pointer;
          transition:color .2s, border-color .2s;
        }
        .back-btn:hover { color:white; border-color:rgba(139,92,246,.4); }

        /* Hero: dark solid bg so white/transparent PNGs have a clean backdrop */
        .hero-wrap {
          position:relative; width:100%; height:420px;
          background:#111118;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
        }
        .hero-img {
          width:100%; height:100%;
          object-fit:contain;           /* never crops, shows full figure */
          object-position:center;
          display:block;
          mix-blend-mode:luminosity;    /* blends white backgrounds away */
          filter:brightness(1.05) contrast(1.08);
        }
        .hero-placeholder { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
        .hero-fade {
          position:absolute; bottom:0; left:0; right:0; height:220px;
          background:linear-gradient(to bottom, transparent, #08080d);
          pointer-events:none;
        }
        .hero-done-badge {
          position:absolute; top:68px; right:20px;
          padding:6px 14px; border-radius:999px;
          background:rgba(16,185,129,.2); border:1px solid rgba(16,185,129,.35);
          color:#34d399; font-size:12px; font-weight:600; backdrop-filter:blur(8px);
        }

        .content { max-width:660px; margin:0 auto; padding:0 28px 60px; margin-top:-100px; position:relative; z-index:10; }

        .title-row { margin-bottom:24px; }
        .page-eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#555; margin-bottom:8px; }
        .ex-title {
          font-size:36px; font-weight:700; letter-spacing:-.03em; line-height:1.1;
          background:linear-gradient(120deg,#fff 0%,#c4b5fd 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .ex-muscles-sub { font-size:13px; color:#555; margin-top:6px; }

        .stat-chips { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        .chip { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:18px; display:flex; flex-direction:column; align-items:center; gap:4px; transition:border-color .2s,transform .2s; }
        .chip:hover { border-color:rgba(139,92,246,.3); transform:translateY(-2px); }
        .chip-icon  { font-size:20px; }
        .chip-value { font-size:22px; font-weight:700; letter-spacing:-.03em; color:white; }
        .chip-label { font-size:10px; color:#444; letter-spacing:.1em; text-transform:uppercase; }

        .section-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:22px; padding:24px; margin-bottom:14px; position:relative; overflow:hidden; }
        .section-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent); }
        .section-eyebrow { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#444; margin-bottom:16px; }

        .instr-list  { display:flex; flex-direction:column; gap:12px; list-style:none; padding:0; margin:0; }
        .instr-item  { display:flex; gap:14px; align-items:flex-start; }
        .instr-num   { width:26px; height:26px; border-radius:8px; flex-shrink:0; background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.2); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#a78bfa; }
        .instr-text  { font-size:14px; color:#aaa; line-height:1.65; padding-top:3px; }
        .instr-empty { font-size:13px; color:#444; font-style:italic; }

        .muscle-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .muscle-chip  { padding:5px 14px; border-radius:999px; background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.2); font-size:12px; color:#c4b5fd; font-weight:500; }

        .complete-btn {
          width:100%; padding:17px; border-radius:18px; border:none; cursor:pointer;
          font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:white;
          background:linear-gradient(135deg,#8b5cf6,#6d28d9);
          box-shadow:0 0 30px rgba(139,92,246,.4),inset 0 1px 0 rgba(255,255,255,.12);
          transition:transform .15s,box-shadow .2s; margin-top:6px;
        }
        .complete-btn:hover { transform:scale(1.02); box-shadow:0 0 50px rgba(139,92,246,.6),inset 0 1px 0 rgba(255,255,255,.12); }
        .complete-btn:active { transform:scale(0.98); }
        .complete-btn-done { background:linear-gradient(135deg,#065f46,#059669)!important; box-shadow:0 0 30px rgba(16,185,129,.3),inset 0 1px 0 rgba(255,255,255,.1)!important; }
        .complete-btn-done:hover { box-shadow:0 0 45px rgba(16,185,129,.45),inset 0 1px 0 rgba(255,255,255,.1)!important; }
        @keyframes pulse-once { 0%{transform:scale(1)} 40%{transform:scale(1.03)} 100%{transform:scale(1)} }
        .complete-btn-pulse { animation:pulse-once .4s ease; }
        .btn-inner { display:flex; align-items:center; justify-content:center; gap:8px; }

        /* ══════════════════════ MOBILE ══════════════════════ */
        @media (max-width: 768px) {
          .back-btn { top:14px; left:14px; padding:7px 14px; font-size:12px; }

          .hero-wrap { height: 260px; }
          .hero-done-badge { top: 56px; right: 14px; font-size: 11px; }

          .content {
            padding: 0 18px 128px; /* extra bottom room clears the fixed mobile tab bar */
            margin-top: -56px;
          }

          .ex-title { font-size: 26px; }
          .ex-muscles-sub { font-size: 12px; }

          .stat-chips { gap: 8px; margin-bottom: 16px; }
          .chip { padding: 14px 8px; border-radius: 14px; }
          .chip-value { font-size: 18px; }
          .chip-icon { font-size: 17px; }

          .section-card { padding: 18px; border-radius: 18px; margin-bottom: 10px; }
          .instr-text { font-size: 13px; }

          .complete-btn { padding: 15px; font-size: 14px; }
        }
      `}</style>
    </main>
  );
}
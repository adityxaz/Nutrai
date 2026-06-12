"use client";

import { useRef, useState, useEffect } from "react";

const foodCards = [
  { emoji: "🥗", label: "Salads", cal: "120 kcal" },
  { emoji: "🍛", label: "Curries", cal: "340 kcal" },
  { emoji: "🥑", label: "Avocado", cal: "160 kcal" },
  { emoji: "🍱", label: "Bento", cal: "450 kcal" },
  { emoji: "🫙", label: "Ghee", cal: "900 kcal" },
  { emoji: "🥦", label: "Broccoli", cal: "34 kcal" },
  { emoji: "🍗", label: "Chicken", cal: "165 kcal" },
  { emoji: "🫐", label: "Berries", cal: "57 kcal" },
  { emoji: "🥚", label: "Eggs", cal: "155 kcal" },
  { emoji: "🍠", label: "Sweet Potato", cal: "86 kcal" },
  { emoji: "🐟", label: "Fish", cal: "184 kcal" },
  { emoji: "🌾", label: "Grains", cal: "350 kcal" },
];

const allCards = [...foodCards, ...foodCards];

const API_BASE = "http://127.0.0.1:8000";

export default function SignupPage() {
  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [age, setAge]                     = useState("");
  const [weight, setWeight]               = useState("");
  const [targetWeight, setTargetWeight]   = useState("");
  const [height, setHeight]               = useState("");
  const [gender, setGender]               = useState("");
  const [selectedGoal, setSelectedGoal]   = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [trainingGoal, setTrainingGoal]   = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin]   = useState(false);
  const [closing, setClosing]       = useState(false);
  const [step, setStep]             = useState(1);
  const [errorMsg, setErrorMsg]     = useState("");

  const trackRef = useRef<HTMLDivElement>(null);

  // ── Validation ───────────────────────────────────────────────────────────
  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  const isStep1Valid = !!(name.trim() && email && password && isEmailValid && isPasswordValid);
  const isStep2Valid = !!(selectedGoal && trainingGoal);
  const isStep3Valid = !!(age && weight && targetWeight && height && gender);
  const isStep4Valid = !!activityLevel;

  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;

  // ── Redirect if already logged in ──────────────────────────────────────
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) window.location.href = "/";
  }, []);

  // ── Lock scroll while modal open ────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = (showSignup || showLogin) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSignup, showLogin]);

  // ── Escape closes modals ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseSignup();
        setShowLogin(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function handleCloseSignup() {
    setClosing(true);
    setTimeout(() => { setShowSignup(false); setClosing(false); setErrorMsg(""); }, 300);
  }

  // ── API calls ────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!isFormValid) return;
    setErrorMsg("");

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          age: Number(age),
          weight: Number(weight),
          target_weight: Number(targetWeight),
          height: Number(height),
          gender,
          goal: selectedGoal,
          activity_level: activityLevel,
          training_goal: trainingGoal,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSignup(false);
        setShowLogin(true);
        setPassword("");
        setErrorMsg("");
        alert("Account created successfully! Please log in.");
      } else {
        // FastAPI HTTPException returns { detail: "..." }
        setErrorMsg(data.detail || data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not reach the server. Please try again.");
    }
  };

  const handleLogin = async () => {
    setErrorMsg("");
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "/";
      } else {
        setErrorMsg(data.detail || data.error || "Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not reach the server. Please try again.");
    }
  };

  return (
    <main
      className="min-h-screen text-white overflow-hidden relative"
      style={{ background: "#05030a", fontFamily: "'DM Serif Display', Georgia, serif" }}
    >
      {/* ── BLOB BACKGROUND ── */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="blob b4" />
      <div className="blob b5" />
      <div className="blob b6" />
      <div className="grain" />

      {/* ── HERO ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pb-56">
        <div className="badge-pill">Beta Version</div>

        <h1 className="hero-logo">
          <span>Nutr</span>
          <span className="logo-gradient">ai</span>
        </h1>

        <p className="hero-tagline">Your AI Nutrition Companion</p>
        <p className="hero-sub">Personalized nutrition, powered by intelligence</p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
          <button className="cta-primary" onClick={() => { setStep(1); setErrorMsg(""); setShowSignup(true); }}>
            Get Started Free
          </button>
          <button className="cta-ghost" onClick={() => { setErrorMsg(""); setShowLogin(true); }}>
            Login →
          </button>
        </div>

        <p className="social-proof">
          Join <span className="social-num">12,000+</span> people tracking smarter
        </p>
      </div>

      {/* ── FOOD SCROLL STRIP ── */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 z-20">
        <div className="fade-left" />
        <div className="fade-right" />
        <div className="overflow-hidden w-full">
          <div
            ref={trackRef}
            className="flex gap-4"
            style={{ width: "max-content", animation: "food-scroll 32s linear infinite" }}
          >
            {allCards.map((card, i) => (
              <div key={i} className="food-card">
                <span style={{ fontSize: "2.8rem" }}>{card.emoji}</span>
                <span className="food-label">{card.label}</span>
                <span className="food-cal">{card.cal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div className="modal-overlay overlay-in" onClick={(e) => { if (e.target === e.currentTarget) { setShowLogin(false); setErrorMsg(""); } }}>
          <div className="modal-box modal-in">
            <button className="modal-close" onClick={() => { setShowLogin(false); setErrorMsg(""); }}>✕</button>

            <div className="modal-logo-wrap">
              <div className="modal-logo">🥗</div>
              <h2 className="modal-title">Welcome Back</h2>
              <p className="modal-subtitle">Please enter your registered email and password.</p>
            </div>

            <div className="modal-divider" />

            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            <div className="field-group">
              <div className="field-wrap">
                <span className="field-icon">✉️</span>
                <input
                  className="field-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
              </div>

              <div className="field-wrap">
                <span className="field-icon">🔒</span>
                <input
                  className="field-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
              </div>
            </div>

            <button className="modal-submit" onClick={handleLogin}>Login</button>
          </div>
        </div>
      )}

      {/* ── SIGNUP MODAL ── */}
      {showSignup && (
        <div className={`modal-overlay ${closing ? "overlay-out" : "overlay-in"}`} onClick={(e) => { if (e.target === e.currentTarget) handleCloseSignup(); }}>
          <div className={`modal-box ${closing ? "modal-out" : "modal-in"}`}>
            <button className="modal-close" onClick={handleCloseSignup}>✕</button>

            <div className="modal-logo-wrap">
              <div className="modal-logo">🥗</div>
              <h2 className="modal-title">Create Account</h2>
              <p className="modal-subtitle">Step {step} of 4</p>
            </div>

            <div className="modal-divider" />

            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            {/* STEP 1: Credentials */}
            {step === 1 && (
              <>
                <div className="field-group">
                  <div className="field-wrap">
                    <span className="field-icon">👤</span>
                    <input
                      className="field-input"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="field-wrap">
                    <span className="field-icon">✉️</span>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {email.length > 0 && !isEmailValid && (
                    <p className="field-error">Please enter a valid email address</p>
                  )}

                  <div className="field-wrap">
                    <span className="field-icon">🔒</span>
                    <input
                      className="field-input"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {password.length > 0 && !isPasswordValid && (
                    <p className="field-error">Password must be 8+ characters with a letter and a number</p>
                  )}
                </div>

                <button
                  className="modal-submit"
                  style={{ opacity: isStep1Valid ? 1 : 0.5, cursor: isStep1Valid ? "pointer" : "not-allowed" }}
                  disabled={!isStep1Valid}
                  onClick={() => { setErrorMsg(""); setStep(2); }}
                >
                  Continue →
                </button>
              </>
            )}

            {/* STEP 2: Goals */}
            {step === 2 && (
              <>
                <h3 className="step-heading">What&apos;s your goal?</h3>

                <div className="option-grid">
                  {["💪 Gain Muscle", "🔥 Lose Fat", "⚖️ Maintain Weight", "❤️ Eat Healthier"].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setSelectedGoal(goal)}
                      className={`option-btn ${selectedGoal === goal ? "option-btn-active" : ""}`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>

                <h3 className="step-heading" style={{ marginTop: "22px" }}>Training focus?</h3>

                <div className="field-wrap">
                  <select
                    className="field-input select-input"
                    value={trainingGoal}
                    onChange={(e) => setTrainingGoal(e.target.value)}
                  >
                    <option value="" style={{ background: "#160d2a" }}>Select Training Goal</option>
                    <option style={{ background: "#160d2a" }} value="Overall Health">Overall Health</option>
                    <option style={{ background: "#160d2a" }} value="Muscle Growth">Muscle Growth</option>
                    <option style={{ background: "#160d2a" }} value="Athleticism">Athleticism</option>
                    <option style={{ background: "#160d2a" }} value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="step-nav">
                  <button className="nav-btn" onClick={() => setStep(1)}>← Back</button>
                  <button
                    className="modal-submit nav-submit"
                    style={{ opacity: isStep2Valid ? 1 : 0.5, cursor: isStep2Valid ? "pointer" : "not-allowed" }}
                    disabled={!isStep2Valid}
                    onClick={() => setStep(3)}
                  >
                    Next Step →
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Health Metrics */}
            {step === 3 && (
              <>
                <h3 className="step-heading">Tell us about yourself</h3>

                <div className="field-group">
                  <div className="field-wrap">
                    <input
                      className="field-input no-icon"
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="field-wrap">
                    <input
                      className="field-input no-icon"
                      type="number"
                      placeholder="Weight (kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  <div className="field-wrap">
                    <input
                      className="field-input no-icon"
                      type="number"
                      placeholder="Target Weight (kg)"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                    />
                  </div>

                  <div className="field-wrap">
                    <input
                      className="field-input no-icon"
                      type="number"
                      placeholder="Height (cm)"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>

                  <div className="field-wrap">
                    <select
                      className="field-input select-input no-icon"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="" style={{ background: "#160d2a" }}>Select Gender</option>
                      <option style={{ background: "#160d2a" }}>Male</option>
                      <option style={{ background: "#160d2a" }}>Female</option>
                    </select>
                  </div>
                </div>

                <div className="step-nav">
                  <button className="nav-btn" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="modal-submit nav-submit"
                    style={{ opacity: isStep3Valid ? 1 : 0.5, cursor: isStep3Valid ? "pointer" : "not-allowed" }}
                    disabled={!isStep3Valid}
                    onClick={() => setStep(4)}
                  >
                    Next Step →
                  </button>
                </div>
              </>
            )}

            {/* STEP 4: Activity Level */}
            {step === 4 && (
              <>
                <h3 className="step-heading">How active are you?</h3>

                <div className="option-grid">
                  {["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivityLevel(level)}
                      className={`option-btn ${activityLevel === level ? "option-btn-active" : ""}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="step-nav">
                  <button className="nav-btn" onClick={() => setStep(3)}>← Back</button>
                  <button
                    className="modal-submit nav-submit"
                    style={{ opacity: isFormValid ? 1 : 0.5, cursor: isFormValid ? "pointer" : "not-allowed" }}
                    disabled={!isFormValid}
                    onClick={handleSignup}
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Blobs ── */
        .blob { position: fixed; border-radius: 50%; pointer-events: none; will-change: transform, opacity; z-index: 0; }
        .b1 { width: 600px; height: 600px; top: -150px; left: -180px; background: radial-gradient(circle, rgba(139,92,246,0.65), rgba(109,40,217,0.2) 55%, transparent 75%); filter: blur(90px); animation: drift1 20s ease-in-out infinite; }
        .b2 { width: 500px; height: 500px; bottom: -100px; right: -120px; background: radial-gradient(circle, rgba(192,132,252,0.5), rgba(139,92,246,0.15) 55%, transparent 75%); filter: blur(80px); animation: drift2 25s ease-in-out infinite; }
        .b3 { width: 380px; height: 380px; top: 50%; left: 50%; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(167,139,250,0.4), rgba(124,58,237,0.1) 55%, transparent 75%); filter: blur(70px); animation: drift3 16s ease-in-out infinite; }
        .b4 { width: 260px; height: 260px; top: 15%; right: 10%; background: radial-gradient(circle, rgba(216,180,254,0.35), transparent 70%); filter: blur(60px); animation: drift4 28s ease-in-out infinite; }
        .b5 { width: 340px; height: 220px; bottom: 15%; left: 10%; background: radial-gradient(ellipse, rgba(91,33,182,0.45), transparent 70%); filter: blur(70px); animation: drift5 22s ease-in-out infinite; }
        .b6 { width: 200px; height: 200px; top: 35%; left: 5%; background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%); filter: blur(50px); animation: drift6 18s ease-in-out infinite; }
        @keyframes drift1 { 0%{transform:translate(0px,0px);opacity:.6} 25%{transform:translate(80px,100px);opacity:1} 50%{transform:translate(160px,30px);opacity:.5} 75%{transform:translate(60px,130px);opacity:.9} 100%{transform:translate(0px,0px);opacity:.6} }
        @keyframes drift2 { 0%{transform:translate(0px,0px);opacity:.7} 30%{transform:translate(-100px,-80px);opacity:.35} 60%{transform:translate(-60px,-150px);opacity:.9} 100%{transform:translate(0px,0px);opacity:.7} }
        @keyframes drift3 { 0%{transform:translate(-50%,-50%) scale(1);opacity:.25} 35%{transform:translate(-50%,-50%) scale(1.35);opacity:.65} 65%{transform:translate(-50%,-50%) scale(.75);opacity:.15} 100%{transform:translate(-50%,-50%) scale(1);opacity:.25} }
        @keyframes drift4 { 0%{transform:translate(0px,0px);opacity:.15} 50%{transform:translate(-80px,100px);opacity:.75} 100%{transform:translate(0px,0px);opacity:.15} }
        @keyframes drift5 { 0%{transform:translate(0px,0px) scaleX(1);opacity:.45} 35%{transform:translate(100px,-50px) scaleX(1.5);opacity:.85} 70%{transform:translate(30px,40px) scaleX(.8);opacity:.25} 100%{transform:translate(0px,0px) scaleX(1);opacity:.45} }
        @keyframes drift6 { 0%{transform:translate(0px,0px);opacity:.2} 40%{transform:translate(60px,-80px);opacity:.65} 80%{transform:translate(20px,40px);opacity:.1} 100%{transform:translate(0px,0px);opacity:.2} }

        /* ── Grain ── */
        .grain { position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.04; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 128px; }

        /* ── Hero typography ── */
        .badge-pill { margin-bottom: 1.75rem; padding: 6px 18px; border-radius: 999px; font-family: monospace; font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase; color: #c4b5fd; border: 1px solid rgba(139,92,246,0.4); background: rgba(139,92,246,0.08); }
        .hero-logo { font-size: 6rem; line-height: 1; font-weight: bold; text-align: center; letter-spacing: -0.04em; color: white; }
        .logo-gradient { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-tagline { font-family: 'DM Sans', sans-serif; font-size: 1.5rem; font-weight: 300; color: #d1d5db; margin-top: 1rem; text-align: center; }
        .hero-sub { font-family: 'DM Sans', sans-serif; font-size: 0.88rem; color: #6b7280; letter-spacing: 0.02em; margin-top: 0.5rem; text-align: center; }
        .social-proof { font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #4b5563; margin-top: 2rem; }
        .social-num { color: #a78bfa; font-weight: 600; }

        /* ── CTA Buttons ── */
        .cta-primary { padding: 14px 36px; border-radius: 999px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 600; color: white; background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 0 40px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.15); transition: transform 0.2s, box-shadow 0.2s; }
        .cta-primary:hover { transform: scale(1.05); box-shadow: 0 0 60px rgba(139,92,246,0.65), inset 0 1px 0 rgba(255,255,255,0.15); }
        .cta-primary:active { transform: scale(0.97); }
        .cta-ghost { padding: 14px 36px; border-radius: 999px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500; color: #9ca3af; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); transition: color 0.2s, border-color 0.2s; }
        .cta-ghost:hover { color: #c4b5fd; border-color: rgba(139,92,246,0.5); }

        /* ── Food scroll ── */
        @keyframes food-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .food-card { flex-shrink: 0; width: 176px; height: 176px; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(139,92,246,0.15); background: linear-gradient(145deg, #0f0a1a 0%, #0a0614 100%); transition: border-color 0.3s, background 0.3s, box-shadow 0.3s; cursor: default; }
        .food-card:hover { border-color: rgba(139,92,246,0.5); background: linear-gradient(145deg, #180f2e 0%, #110a20 100%); box-shadow: 0 0 24px rgba(139,92,246,0.18); }
        .food-label { font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500; color: #d1d5db; }
        .food-cal { font-family: monospace; font-size: 0.75rem; color: #7c3aed; }
        .fade-left, .fade-right { position: absolute; top: 0; bottom: 0; width: 160px; z-index: 10; pointer-events: none; }
        .fade-left  { left: 0;  background: linear-gradient(to right, #05030a, transparent); }
        .fade-right { right: 0; background: linear-gradient(to left,  #05030a, transparent); }

        /* ── Modal overlay ── */
        .modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 20px; }
        .overlay-in  { animation: overlay-fade-in 0.3s ease forwards; }
        .overlay-out { animation: overlay-fade-out 0.3s ease forwards; }
        @keyframes overlay-fade-in  { from { background: rgba(5,3,10,0);   } to { background: rgba(5,3,10,0.82); } }
        @keyframes overlay-fade-out { from { background: rgba(5,3,10,0.82); } to { background: rgba(5,3,10,0);   } }

        /* ── Modal box ── */
        .modal-box { position: relative; z-index: 52; width: 460px; max-width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 28px; padding: 40px; background: linear-gradient(160deg, rgba(22,13,42,0.97) 0%, rgba(9,5,18,0.98) 100%); border: 1px solid rgba(139,92,246,0.25); box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(139,92,246,0.18), 0 40px 80px rgba(0,0,0,0.65); }
        .modal-box::-webkit-scrollbar { width: 0; }
        .modal-in  { animation: modal-spring-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .modal-out { animation: modal-spring-out 0.28s cubic-bezier(0.4,0,1,1) both; }
        @keyframes modal-spring-in  { from { opacity: 0; transform: translateY(32px) scale(0.93); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes modal-spring-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(20px) scale(0.95); } }

        /* ── Modal close ── */
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #6b7280; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s, border-color 0.2s; font-family: sans-serif; }
        .modal-close:hover { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.45); color: #c4b5fd; }

        /* ── Modal header ── */
        .modal-logo-wrap { text-align: center; margin-bottom: 6px; }
        .modal-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 30px; font-weight: bold; letter-spacing: -0.03em; color: white; margin-bottom: 5px; }
        .modal-title { font-size: 1.75rem; font-weight: 600; color: white; margin-top: 5px; font-family: 'DM Sans', sans-serif; }
        .modal-subtitle { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #6b7280; margin-bottom: 22px; margin-top: 4px; }
        .modal-divider { height: 1px; background: linear-gradient(to right, transparent, rgba(139,92,246,0.4), transparent); margin-bottom: 24px; }

        /* ── Error banner ── */
        .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; text-align: center; }

        /* ── Fields ── */
        .field-group { display: flex; flex-direction: column; gap: 12px; }
        .field-wrap  { position: relative; }
        .field-icon  { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 15px; pointer-events: none; color: #4b5563; transition: color 0.2s; }
        .field-wrap:focus-within .field-icon { color: #a78bfa; }
        .field-input { width: 100%; padding: 14px 16px 14px 46px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; }
        .field-input.no-icon { padding-left: 16px; }
        .field-input::placeholder { color: #4b5563; }
        .field-input:focus { border-color: rgba(139,92,246,0.55); background: rgba(139,92,246,0.06); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
        .select-input { appearance: none; cursor: pointer; }
        .field-error { color: #f87171; font-size: 12px; font-family: 'DM Sans', sans-serif; margin: -4px 0 0 4px; }

        /* ── Step heading ── */
        .step-heading { text-align: center; margin-bottom: 14px; color: #d1d5db; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500; }

        /* ── Option grid ── */
        .option-grid { display: grid; gap: 10px; }
        .option-btn { padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: white; text-align: left; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: border-color 0.2s, background 0.2s; }
        .option-btn:hover { border-color: rgba(139,92,246,0.35); }
        .option-btn-active { border-color: #8b5cf6 !important; background: rgba(139,92,246,0.15) !important; }

        /* ── Step nav ── */
        .step-nav { display: flex; gap: 10px; margin-top: 20px; }
        .nav-btn { flex: 1; padding: 15px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: white; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: border-color 0.2s; }
        .nav-btn:hover { border-color: rgba(139,92,246,0.35); }
        .nav-submit { flex: 2; margin-top: 0; }

        /* ── Submit ── */
        .modal-submit { width: 100%; margin-top: 20px; padding: 15px; border-radius: 14px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; color: white; background: linear-gradient(135deg, #8b5cf6, #6d28d9); box-shadow: 0 0 30px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.12); transition: transform 0.15s, box-shadow 0.15s; }
        .modal-submit:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 55px rgba(139,92,246,0.65), inset 0 1px 0 rgba(255,255,255,0.12); }
        .modal-submit:active:not(:disabled) { transform: scale(0.98); }
        .modal-submit:disabled { transform: none !important; }
      `}</style>
    </main>
  );
}
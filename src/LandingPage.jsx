export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ticker { display: flex; animation: ticker 25s linear infinite; white-space: nowrap; }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .glow { text-shadow: 0 0 40px rgba(74,222,128,0.5); }
        .feature-card { background: #0f0f1a; border: 1px solid #1e1e30; border-radius: 14px; padding: 24px; transition: border-color 0.2s; }
        .feature-card:hover { border-color: #4ade8044; }
        .badge-pill { background: #13131f; border: 1px solid #1e1e30; border-radius: 40px; padding: 10px 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin: 6px; }
        .cta-btn { background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 12px; color: #060f06; cursor: pointer; font-family: inherit; font-size: 18px; font-weight: 800; padding: 18px 48px; transition: opacity 0.2s, transform 0.15s; display: inline-block; }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .nav-btn { background: none; border: 1.5px solid #2a2a3a; border-radius: 8px; color: #888; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; padding: 8px 20px; transition: all 0.2s; }
        .nav-btn:hover { border-color: #4ade80; color: #4ade80; }
        @media (max-width: 600px) {
          .hero-title { font-size: 72px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(8,8,16,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a2e", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚽</span>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 2 }}>YOU vs AI</div>
          </div>
        </div>
        <button className="nav-btn" onClick={onGetStarted}>Sign In</button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(26,122,26,0.08) 0%, transparent 65%)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, background: "radial-gradient(ellipse at 20% 0%, rgba(255,255,200,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(255,255,200,0.04) 0%, transparent 50%)", pointerEvents: "none" }}/>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#f59e0b", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 1, background: "#f59e0b", opacity: 0.4, display: "inline-block" }}/>
          FIFA World Cup 2026 · 48 Teams · You vs AI
          <span style={{ width: 30, height: 1, background: "#f59e0b", opacity: 0.4, display: "inline-block" }}/>
        </div>

        <div className="hero-title" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 120, lineHeight: 0.9, marginBottom: 16, letterSpacing: 2 }}>
          <div style={{ color: "#f0f0f0" }}>CAN YOU</div>
          <div className="glow" style={{ color: "#4ade80" }}>BEAT</div>
          <div style={{ color: "#f0f0f0" }}>THE AI?</div>
        </div>

        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#333", letterSpacing: 6, marginBottom: 32 }}>YOU &nbsp;vs&nbsp; 🤖</div>

        <p style={{ fontSize: 18, color: "#777", maxWidth: 520, lineHeight: 1.7, marginBottom: 48 }}>
          Predict World Cup 2026 scorelines. The AI makes its own call.<br/>
          <strong style={{ color: "#f0f0f0" }}>Who gets closer to the real result?</strong>
        </p>

        <button className="cta-btn" onClick={onGetStarted}>⚡ Start Predicting Free</button>
        <div style={{ fontSize: 12, color: "#444", marginTop: 14 }}>No card required · Takes 30 seconds</div>

        {/* Sample scoreboard */}
        <div style={{ marginTop: 60, background: "#0f0f1a", border: "1px solid #1e1e30", borderRadius: 16, padding: "20px 32px", display: "inline-flex", alignItems: "center", gap: 32 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🇩🇪</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Germany</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: "#4ade80", lineHeight: 1 }}>2</div>
            <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginTop: 4 }}>👤 YOU</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#222" }}>—</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🇨🇮</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Ivory Coast</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: "#f59e0b", lineHeight: 1 }}>1</div>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginTop: 4 }}>🤖 AI</div>
          </div>
          <div style={{ width: 1, background: "#1e1e30", alignSelf: "stretch" }}/>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Result</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "#f0f0f0", lineHeight: 1 }}>2–1</div>
            <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginTop: 8 }}>🏆 You won!</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: "#0d0d18", borderTop: "1px solid #1a1a2e", borderBottom: "1px solid #1a1a2e", overflow: "hidden", padding: "10px 0" }}>
        <div className="ticker">
          {["🇧🇷 Brazil vs 🇦🇷 Argentina","🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs 🇫🇷 France","🇩🇪 Germany vs 🇵🇹 Portugal","🇪🇸 Spain vs 🇳🇱 Netherlands","🇺🇸 USA vs 🇲🇽 Mexico","🇯🇵 Japan vs 🇰🇷 Korea Republic","🇸🇳 Senegal vs 🇲🇦 Morocco","🇧🇷 Brazil vs 🇦🇷 Argentina","🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs 🇫🇷 France","🇩🇪 Germany vs 🇵🇹 Portugal","🇪🇸 Spain vs 🇳🇱 Netherlands","🇺🇸 USA vs 🇲🇽 Mexico","🇯🇵 Japan vs 🇰🇷 Korea Republic","🇸🇳 Senegal vs 🇲🇦 Morocco"].map((t, i) => (
            <div key={i} style={{ padding: "0 32px", fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 1, borderRight: "1px solid #1a1a2e" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid #1a1a2e" }}>
        {[
          { num: "48", label: "Teams to predict", color: "#4ade80" },
          { num: "104", label: "Matches", color: "#4ade80" },
          { num: "1", label: "AI to beat", color: "#f59e0b" },
          { num: "Free", label: "Always", color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "32px 16px", borderRight: "1px solid #1a1a2e" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: s.color, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, lineHeight: 1, marginBottom: 48 }}>Three steps.<br/>One winner.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { icon: "🏆", title: "Pick the match", desc: "Choose any World Cup 2026 fixture from all 12 groups. 48 nations, 104 matches to predict." },
            { icon: "⚽", title: "Lock in your score", desc: "Enter your predicted scoreline before the AI reveals its call. Your prediction is sealed first." },
            { icon: "🤖", title: "See who got closer", desc: "Log the real result. The closer prediction wins. Beat the AI enough times and earn a rank." },
          ].map((s, i) => (
            <div key={i} className="feature-card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: 16, fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, color: "rgba(255,255,255,0.03)", lineHeight: 1 }}>{i+1}</div>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 24px", background: "#0d0d18", borderTop: "1px solid #1a1a2e", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", marginBottom: 12 }}>What you get</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, lineHeight: 1, marginBottom: 48 }}>More than<br/>a scoreline.</div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: "🏟️", title: "3D Pitch View", desc: "Every prediction reveals a live pitch with the AI's starting lineup and formation." },
              { icon: "🤖", title: "AI Match Verdict", desc: "The AI gives you a brutally honest breakdown — key players, tactical battle, wildcard factor." },
              { icon: "📊", title: "Head-to-Head Record", desc: "Track every prediction. Your record vs the AI updates after every match." },
              { icon: "🏅", title: "Earn Your Rank", desc: "From Sunday League Scout to AI Destroyer — climb the badge ladder by beating the machine." },
              { icon: "📤", title: "Challenge Friends", desc: "Share your prediction vs the AI's call before kickoff. Let the group chat decide." },
              { icon: "🆓", title: "Completely Free", desc: "No subscription. No ads. Just you, the AI, and 104 World Cup matches to call." },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section style={{ padding: "80px 24px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", marginBottom: 12 }}>Badge system</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, lineHeight: 1, marginBottom: 8 }}>Beat the AI.<br/><span style={{ color: "#4ade80" }}>Earn your rank.</span></div>
        <p style={{ color: "#555", fontSize: 15, marginBottom: 32 }}>Six ranks from first prediction to tournament legend.</p>
        <div>
          {[
            { icon: "⚽", name: "Sunday League Scout", color: "#888" },
            { icon: "🤖", name: "AI Beater", color: "#60a5fa" },
            { icon: "🎯", name: "Sharp Eye", color: "#a78bfa" },
            { icon: "🔥", name: "On Fire", color: "#f97316" },
            { icon: "🧠", name: "Analyst", color: "#4ade80" },
            { icon: "👑", name: "AI Destroyer", color: "#fbbf24" },
          ].map(b => (
            <span key={b.name} className="badge-pill" style={{ color: b.color, borderColor: b.color + "33" }}>
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center", background: "#0d0d18", borderTop: "1px solid #1a1a2e" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, lineHeight: 0.95, marginBottom: 20 }}>
          YOUR CALL<br/><span style={{ color: "#4ade80" }}>OR THE AI'S?</span>
        </div>
        <p style={{ fontSize: 16, color: "#666", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
          48 teams. 104 matches. One tournament to prove you see football better than a machine.
        </p>
        <button className="cta-btn" onClick={onGetStarted}>⚡ Start Predicting Free</button>
        <div style={{ fontSize: 12, color: "#444", marginTop: 14 }}>No card required · Takes 30 seconds</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1a1a2e", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2, marginBottom: 8 }}>⚽ DEEP433</div>
        <div style={{ fontSize: 12, color: "#444" }}>YOU vs AI · FIFA World Cup 2026 · deep433.com</div>
      </footer>
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0010", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ticker { display: flex; animation: ticker 25s linear infinite; white-space: nowrap; }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .cta-btn { background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 12px; color: #060f06; cursor: pointer; font-family: inherit; font-size: 17px; font-weight: 800; padding: 16px 40px; transition: opacity 0.2s, transform 0.15s; }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .ghost-btn { background: none; border: 1.5px solid #3a2a5a; border-radius: 10px; color: #888; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 24px; transition: all 0.2s; }
        .ghost-btn:hover { border-color: #7c3aed; color: #a78bfa; }
        .card { background: #13102a; border: 1px solid #2a1f4a; border-radius: 14px; }
        .score-card { background: linear-gradient(135deg, #1a1035, #0f1a2e); border: 1px solid #2a2a4a; border-radius: 12px; padding: 16px; }
        .pts-card { background: #13102a; border: 1px solid #2a1f4a; border-radius: 12px; padding: 24px; text-align: center; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .pts-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-title { font-size: 56px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1f4a", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚽</span>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700 }}>YOU vs AI</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="ghost-btn" onClick={onGetStarted}>Sign In</button>
          <button className="cta-btn" style={{ fontSize: 13, padding: "10px 20px" }} onClick={onGetStarted}>Sign Up Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "100px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a0a2e", border: "1px solid #7c3aed44", borderRadius: 40, padding: "6px 16px", marginBottom: 24 }}>
              <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: 1 }}>GAMEWEEK 1 LIVE · WORLD CUP 2026</span>
            </div>

            <div className="hero-title" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, lineHeight: 0.95, marginBottom: 24 }}>
              <div style={{ color: "#f0f0f0" }}>THE ULTIMATE</div>
              <div style={{ color: "#7c3aed" }}>YOU VS AI</div>
              <div style={{ color: "#f0f0f0" }}>LEAGUE</div>
            </div>

            <p style={{ fontSize: 17, color: "#888", lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Predict scorelines every gameweek. Earn points like FPL. Climb global rankings and <strong style={{ color: "#f0f0f0" }}>crush the machine.</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {[
                "Lock predictions before the Saturday deadline",
                "Create private mini-leagues to beat your mates",
                "The AI competes in every league as your rival",
                "Verified World Cup squads — no hallucinated players",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 15, color: "#888" }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="cta-btn" onClick={onGetStarted}>⚡ Join the League Free</button>
              <button className="ghost-btn" onClick={onGetStarted}>Sign In</button>
            </div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 12 }}>No card required · 30 seconds to set up</div>
          </div>

          {/* Right — Fixture Hub preview */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>🎯 FIXTURE HUB</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#1a1000", border: "1px solid #f59e0b44", borderRadius: 6, padding: "3px 10px" }}>⏱️ DEADLINE: SAT 11:30</div>
              </div>

              {/* Fixture rows */}
              {[
                { home: "England", away: "Croatia", yours: "2-1", ai: "1-1", pts: "+5pts", win: true },
                { home: "France", away: "Senegal", yours: "2-0", ai: "2-1", pts: "+2pts", win: true },
                { home: "Brazil", away: "Morocco", yours: "1-0", ai: "2-0", pts: null, win: false },
                { home: "Germany", away: "Curaçao", yours: "7-1", ai: "3-0", pts: "+5pts", win: true },
                { home: "USA", away: "Paraguay", yours: "4-1", ai: "2-0", pts: "+2pts", win: true },
                { home: "Sweden", away: "Tunisia", yours: "5-1", ai: "2-0", pts: "+2pts", win: true },
              ].map((f, i) => (
                <div key={i} className="score-card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#555", flex: 1 }}>{f.home} vs {f.away}</span>
                    {f.pts && <span style={{ fontSize: 11, fontWeight: 800, color: "#4ade80", background: "#0a1a0a", border: "1px solid #4ade8033", borderRadius: 6, padding: "2px 8px" }}>{f.pts}</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
                    <div style={{ background: "#0a0020", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>👤 YOURS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{f.yours}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#333", fontWeight: 700 }}>VS</div>
                    <div style={{ background: "#0a0020", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>🤖 AI</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{f.ai}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mini league */}
              <div style={{ marginTop: 16, background: "#0a0020", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🏆 Friends Mini-League</div>
                {[
                  { pos: 1, name: "Alex (You)", pts: 78, you: true },
                  { pos: 2, name: "Deep433 AI Bot", pts: 72, ai: true },
                  { pos: 3, name: "Marcus", pts: 65 },
                ].map(p => (
                  <div key={p.pos} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #1a1a3a" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.you ? "#4ade80" : p.ai ? "#f59e0b" : "#444", width: 20 }}>{p.pos}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.you ? "#4ade80" : p.ai ? "#f59e0b" : "#888", flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: p.you ? "#4ade80" : p.ai ? "#f59e0b" : "#555" }}>{p.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: "#0d0018", borderTop: "1px solid #2a1f4a", borderBottom: "1px solid #2a1f4a", overflow: "hidden", padding: "10px 0" }}>
        <div className="ticker">
          {["🇧🇷 Brazil vs 🇦🇷 Argentina","🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs 🇫🇷 France","🇩🇪 Germany vs 🇵🇹 Portugal","🇪🇸 Spain vs 🇳🇱 Netherlands","🇺🇸 USA vs 🇲🇽 Mexico","🇯🇵 Japan vs 🇰🇷 Korea","🇸🇳 Senegal vs 🇲🇦 Morocco","🇧🇷 Brazil vs 🇦🇷 Argentina","🏴󠁧󠁢󠁥󠁮󠁧󠁿 England vs 🇫🇷 France","🇩🇪 Germany vs 🇵🇹 Portugal","🇪🇸 Spain vs 🇳🇱 Netherlands","🇺🇸 USA vs 🇲🇽 Mexico","🇯🇵 Japan vs 🇰🇷 Korea","🇸🇳 Senegal vs 🇲🇦 Morocco"].map((t, i) => (
            <div key={i} style={{ padding: "0 32px", fontSize: 11, fontWeight: 700, color: "#3a2a5a", textTransform: "uppercase", letterSpacing: 1, borderRight: "1px solid #1a1a2e" }}>{t}</div>
          ))}
        </div>
      </div>

      {/* SCORING */}
      <section style={{ padding: "80px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#7c3aed", textTransform: "uppercase", marginBottom: 12 }}>Scoring Rules</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1 }}>FPL-Optimized<br/>Scoring Engine</div>
        </div>
        <div className="pts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { pts: "+5", label: "Exact Scoreline", icon: "🎯", color: "#4ade80" },
            { pts: "+2", label: "Correct Outcome", icon: "✅", color: "#60a5fa" },
            { pts: "+1", label: "Goal Differential", icon: "⚽", color: "#a78bfa" },
            { pts: "👑", label: "AI Double-Down Boost", icon: "🚀", color: "#f59e0b" },
          ].map(p => (
            <div key={p.label} className="pts-card">
              <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: p.color, lineHeight: 1, marginBottom: 8 }}>{p.pts}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center", background: "#0d0018", borderTop: "1px solid #2a1f4a" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, lineHeight: 0.95, marginBottom: 20 }}>
          JOIN THE<br/><span style={{ color: "#7c3aed" }}>LEAGUE.</span><br/>BEAT THE<br/><span style={{ color: "#4ade80" }}>MACHINE.</span>
        </div>
        <p style={{ fontSize: 16, color: "#666", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px" }}>
          World Cup 2026 is live. Every match is a chance to outsmart the AI and prove you know football better.
        </p>
        <button className="cta-btn" style={{ fontSize: 18, padding: "18px 48px" }} onClick={onGetStarted}>⚡ Join Free — World Cup 2026</button>
        <div style={{ fontSize: 12, color: "#444", marginTop: 14 }}>No card required · Takes 30 seconds</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #2a1f4a", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2, marginBottom: 8 }}>⚽ DEEP433</div>
        <div style={{ fontSize: 12, color: "#444" }}>YOU vs AI · FIFA World Cup 2026 · deep433.com</div>
      </footer>
    </div>
  );
}

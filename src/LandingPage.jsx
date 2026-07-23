import { useEffect, useState } from "react";

// Nationality -> ISO code for flag images (flagcdn.com), covers common WC nations
const NATION_FLAG_CODES = {
  "Argentina": "ar", "France": "fr", "Brazil": "br", "England": "gb-eng",
  "Spain": "es", "Portugal": "pt", "Germany": "de", "Netherlands": "nl",
  "Belgium": "be", "Croatia": "hr", "Morocco": "ma", "Italy": "it",
  "Uruguay": "uy", "Colombia": "co", "Senegal": "sn", "Japan": "jp",
  "Korea Republic": "kr", "USA": "us", "Mexico": "mx", "Switzerland": "ch",
  "Denmark": "dk", "Ecuador": "ec", "Poland": "pl", "Ghana": "gh",
  "Nigeria": "ng", "Egypt": "eg", "Algeria": "dz", "Tunisia": "tn",
  "Norway": "no", "Sweden": "se", "Austria": "at", "Wales": "gb-wls",
  "Scotland": "gb-sct", "Ukraine": "ua", "Serbia": "rs", "Turkey": "tr",
};

function useTopScorers(leagueId, type = "scorers") {
  const [players, setPlayers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/top-scorers?leagueId=${leagueId}&type=${type}`);
        const d = await r.json();
        setPlayers((d.players || []).slice(0, 10));
      } catch {}
      setLoaded(true);
    }
    load();
  }, [leagueId, type]);
  return { players, loaded };
}

function useBestOfEurope(sortBy = "cleanSheets") {
  const [teams, setTeams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/team-stats?mode=eurotop10`);
        const d = await r.json();
        const sorted = [...(d.teams || [])].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
        setTeams(sorted.slice(0, 10));
      } catch {}
      setLoaded(true);
    }
    load();
  }, [sortBy]);
  return { teams, loaded };
}

function useFixtures(leagueId) {
  const [fixtures, setFixtures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/fixtures?leagueId=${leagueId}&full=true`);
        const d = await r.json();
        const all = d.fixtures || [];

        // Prioritize fixtures that haven't been played yet, soonest first —
        // full=true returns the whole season, so without this the widget
        // could show random past matches instead of what's coming up next.
        const upcoming = all.filter(f => f.status !== "FT").sort((a, b) => new Date(a.date) - new Date(b.date));
        const recent = all.filter(f => f.status === "FT").sort((a, b) => new Date(b.date) - new Date(a.date));
        const ordered = upcoming.length > 0 ? upcoming : recent;

        setFixtures(ordered.slice(0, 6));
      } catch {}
      setLoaded(true);
    }
    load();
  }, [leagueId]);
  return { fixtures, loaded };
}

export default function LandingPage({ onGetStarted }) {

  const [fixtureLeague, setFixtureLeague] = useState("pl");
  const { fixtures, loaded: fixturesLoaded } = useFixtures(fixtureLeague);
  const { players: topScorers, loaded: scorersLoaded } = useTopScorers("wc2026", "scorers");
  const { players: topAssists, loaded: assistsLoaded } = useTopScorers("wc2026", "assists");
  const { teams: bestOfEurope, loaded: europeLoaded } = useBestOfEurope("cleanSheets");
  const { teams: topGoalsClubs, loaded: goalsLoaded } = useBestOfEurope("goalsFor");
  const FIXTURE_LEAGUES = [
    { id: "pl", label: "Premier League" },
    { id: "laliga", label: "La Liga" },
    { id: "seriea", label: "Serie A" },
    { id: "bundesliga", label: "Bundesliga" },
    { id: "ligue1", label: "Ligue 1" },
    { id: "ucl", label: "Champions League" },
    { id: "communityshield", label: "Community Shield" },
    { id: "dflsupercup", label: "DFL-Supercup" },
    { id: "tropheedeschampions", label: "Trophée des Champions" },
    { id: "supercoppa", label: "Supercoppa Italiana" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0010", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .cta-btn { background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 12px; color: #060f06; cursor: pointer; font-family: inherit; font-size: 17px; font-weight: 800; padding: 16px 40px; transition: opacity 0.2s, transform 0.15s; text-decoration: none; display: inline-block; }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .ghost-btn { background: none; border: 1.5px solid #3a2a5a; border-radius: 10px; color: #888; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 24px; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .ghost-btn:hover { border-color: #7c3aed; color: #a78bfa; }
        .post-card { display: block; background: #13102a; border: 1px solid #2a1f4a; border-radius: 14px; padding: 22px; text-decoration: none; transition: border-color 0.2s, transform 0.15s; }
        .post-card:hover { border-color: #4ade80; transform: translateY(-2px); }
        .predict-strip { background: linear-gradient(135deg, #13102a, #0d0018); border: 1px solid #2a1f4a; border-radius: 16px; padding: 28px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .posts-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 17px !important; }
          .preview-list { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1f4a", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700 }}>DATA-DRIVEN FOOTBALL INSIGHTS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="ghost-btn" onClick={onGetStarted}>Predict a Match</button>
        </div>
      </nav>

      {/* HERO — compact strip, fixtures/predictions are the real front door */}
      <section style={{ padding: "90px 24px 20px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div className="hero-title" style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", lineHeight: 1.4, marginBottom: 10 }}>
          The stats have spoken. <span style={{ color: "#7c3aed" }}>The AI has its call.</span> <span style={{ color: "#4ade80" }}>What's yours?</span>
        </div>
        <p style={{ fontSize: 14, color: "#777", lineHeight: 1.5, marginBottom: 0 }}>
          Predict this matchday's fixtures below, or explore everything else Deep433 offers further down.
        </p>
      </section>

      {/* FIXTURES — main traffic driver, sits at the top */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#f0f0f0" }}>Upcoming Fixtures</div>
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {FIXTURE_LEAGUES.map(l => (
            <button
              key={l.id}
              onClick={() => setFixtureLeague(l.id)}
              style={{
                background: fixtureLeague === l.id ? "#4ade8022" : "none",
                border: `1px solid ${fixtureLeague === l.id ? "#4ade80" : "#2a1f4a"}`,
                borderRadius: 20, color: fixtureLeague === l.id ? "#4ade80" : "#888",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "6px 14px",
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {!fixturesLoaded && <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>Loading fixtures…</div>}
        {fixturesLoaded && fixtures.length === 0 && (
          <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>No upcoming fixtures found for this competition right now.</div>
        )}

        {(() => {
          const groups = {};
          fixtures.forEach(f => {
            if (!groups[f.date]) groups[f.date] = [];
            groups[f.date].push(f);
          });
          const dateFormatter = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
          const timeFormatter = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

          return Object.keys(groups).map(date => (
            <div key={date} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                {dateFormatter(date)}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {groups[date].map((f, i) => (
                  <div key={i} style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{f.home} <span style={{ color: "#555" }}>vs</span> {f.away}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#888" }}>{timeFormatter(f.kickoff)}</span>
                      {f.status === "FT" ? (
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{f.fulltimeScore?.home}-{f.fulltimeScore?.away}</span>
                      ) : (
                        <button onClick={onGetStarted} style={{ background: "#4ade80", border: "none", borderRadius: 6, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800, padding: "5px 12px" }}>Predict →</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <button className="cta-btn" onClick={onGetStarted}>⚡ Predict a Match</button>
          <a href="/blog" className="ghost-btn">📰 Read the Latest</a>
          <a href="/leaderboard" className="ghost-btn">🏆 Community Leaderboard</a>
          <a href="/submit" className="ghost-btn">✍️ Write & Get Paid</a>
        </div>
      </section>

      {/* PREVIEW CARDS — a taste of Graphics tab tools */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "10px 20px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

          {/* World Cup Top Scorers */}
          <div style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🥇 World Cup Top Scorers</div>
            {!scorersLoaded && <div style={{ color: "#666", fontSize: 13 }}>Loading…</div>}
            {scorersLoaded && topScorers.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>Not available right now.</div>}
            <div className="preview-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              {topScorers.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e1830", gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    {NATION_FLAG_CODES[p.nationality] && <img src={`https://flagcdn.com/w20/${NATION_FLAG_CODES[p.nationality]}.png`} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {p.name}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", flexShrink: 0 }}>{p.goals}</span>
                </div>
              ))}
            </div>
          </div>

          {/* World Cup Top Assists */}
          <div style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🎯 World Cup Top Assists</div>
            {!assistsLoaded && <div style={{ color: "#666", fontSize: 13 }}>Loading…</div>}
            {assistsLoaded && topAssists.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>Not available right now.</div>}
            <div className="preview-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              {topAssists.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e1830", gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    {NATION_FLAG_CODES[p.nationality] && <img src={`https://flagcdn.com/w20/${NATION_FLAG_CODES[p.nationality]}.png`} alt="" style={{ width: 14, height: 10, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {p.name}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#a855f7", flexShrink: 0 }}>{p.assists}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best of Europe */}
          <div style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🏆 Best of Europe · Clean Sheets</div>
            {!europeLoaded && <div style={{ color: "#666", fontSize: 13 }}>Loading…</div>}
            {europeLoaded && bestOfEurope.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>Not available right now.</div>}
            <div className="preview-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              {bestOfEurope.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e1830", gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {t.team}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", flexShrink: 0 }}>{t.cleanSheets}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best of Europe — Goals */}
          <div style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>⚽ Best of Europe · Top Goals</div>
            {!goalsLoaded && <div style={{ color: "#666", fontSize: 13 }}>Loading…</div>}
            {goalsLoaded && topGoalsClubs.length === 0 && <div style={{ color: "#666", fontSize: 13 }}>Not available right now.</div>}
            <div className="preview-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              {topGoalsClubs.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1e1830", gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {t.team}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", flexShrink: 0 }}>{t.goalsFor}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onGetStarted} style={{ background: "none", border: "none", fontSize: 13, color: "#4ade80", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Build your own cards in Graphics →</button>
        </div>
      </section>

      {/* What's Inside — full site map for new visitors */}
      <section style={{ background: "#f6f7f5", padding: "48px 20px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 6 }}>Everything Deep433 Has To Offer</div>
            <div style={{ fontSize: 14, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>What's Inside</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
            { icon: "⚡", title: "Predict", desc: "Make your call before kickoff, compare against 433's AI prediction.", href: "/" },
            { icon: "🔴", title: "Live Scores", desc: "Real-time scores across every major league and tournament.", href: "/" },
            { icon: "🏆", title: "Bracket", desc: "Follow knockout tournaments through to the final.", href: "/" },
            { icon: "🎖", title: "Season Awards", desc: "End-of-season leaders across goals, assists, clean sheets and more.", href: "/" },
            { icon: "📊", title: "Graphics", desc: "Build your own player and team comparison cards, free to use.", href: "/" },
            { icon: "🆚", title: "You vs AI", desc: "Track your prediction record against 433 all season long.", href: "/" },
            { icon: "🏅", title: "Badges", desc: "Earn badges as you build your prediction history.", href: "/" },
            { icon: "📋", title: "History", desc: "Every prediction you've made, all in one place.", href: "/" },
            { icon: "📰", title: "Blog", desc: "Data-driven previews, recaps, and community-written takes.", href: "/blog" },
            { icon: "🏆", title: "Leaderboard", desc: "See how this round's Community Takes writers ranked.", href: "/leaderboard" },
            { icon: "✍️", title: "Write & Get Paid", desc: "Submit your own take on a big match, get published, get paid.", href: "/submit" },
          ].map(item => (
            <a key={item.title} href={item.href} style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "18px 16px", transition: "transform 0.15s" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12.5, color: "#777", lineHeight: 1.5 }}>{item.desc}</div>
            </a>
          ))}
          </div>
        </div>
      </section>

      {/* BLOG CTA — no previews here, just a single link into the blog itself */}
      <section style={{ padding: "20px 24px 80px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <a href="/blog" style={{ display: "block", background: "linear-gradient(135deg, #1a1035, #0f0a20)", border: "1px solid #2a1f4a", borderRadius: 16, padding: "32px", textDecoration: "none", transition: "border-color 0.2s" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0", marginBottom: 8 }}>📰 Read Community Takes</div>
          <div style={{ fontSize: 14, color: "#888" }}>Match breakdowns, previews, and fan-written takes — all on the blog.</div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Visit the blog →</div>
        </a>
      </section>

      {/* PREDICT STRIP */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="predict-strip">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>Your Turn</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Done reading? Make your own prediction.</div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>Lock in a scoreline, see how it compares to the AI's guess — no account needed.</div>
          </div>
          <button className="cta-btn" onClick={onGetStarted}>⚡ Predict Now</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #2a1f4a", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
        </div>
        <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>Data-driven football insights, brought to you by deep433.com</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 4 }}>
          <a href="/blog" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>Read the Journal →</a>
          <a href="/leaderboard" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>Leaderboard →</a>
          <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" aria-label="Follow Deep433 on X" style={{ display: "inline-flex", color: "#888" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

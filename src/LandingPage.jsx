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

// ─── STATIC STATS — hardcoded since this data is final/unchanging ──────────
// World Cup 2026 and the 2025-26 European season are both finished — no live
// API needed. PLACEHOLDER VALUES BELOW: replace with real numbers once
// Joseph provides them, then this comment can be removed.
const STATIC_STATS = {
  scorers: [
    { name: "Kylian Mbappé", nationality: "France", apps: 8, goals: 10 },
    { name: "L. Messi", nationality: "Argentina", apps: 7, goals: 8 },
    { name: "J. Bellingham", nationality: "England", apps: 8, goals: 7 },
    { name: "E. Haaland", nationality: "Norway", apps: 5, goals: 7 },
    { name: "O. Dembélé, H. Kane", nationality: "", goals: 6 },
  ],
  assists: [
    { name: "M. Olise", nationality: "France", apps: 8, assists: 7 },
    { name: "Kylian Mbappé", nationality: "France", apps: 8, assists: 4 },
    { name: "L. Messi", nationality: "Argentina", apps: 8, assists: 4 },
    { name: "Brahim Díaz", nationality: "Morocco", apps: 6, assists: 4 },
    { name: "Bruno Guimarães", nationality: "Brazil", apps: 5, assists: 4 },
  ],
  cleanSheets: [
    { team: "Arsenal", logo: "", cleanSheets: 19 },
    { team: "Inter", logo: "", cleanSheets: 18 },
    { team: "Paris Saint-Germain", logo: "", cleanSheets: 18 },
    { team: "Manchester City", logo: "", cleanSheets: 16 },
    { team: "Barcelona", logo: "", cleanSheets: 15 },
  ],
  topGoals: [
    { team: "Bayern München", logo: "", goalsFor: 122 },
    { team: "Barcelona", logo: "", goalsFor: 95 },
    { team: "Inter", logo: "", goalsFor: 89 },
    { team: "Manchester City", logo: "", goalsFor: 77 },
    { team: "Real Madrid", logo: "", goalsFor: 77 },
  ],
  wins: [
    { team: "Barcelona", logo: "", wins: 31 },
    { team: "Bayern München", logo: "", wins: 28 },
    { team: "Real Madrid", logo: "", wins: 27 },
    { team: "Inter", logo: "", wins: 27 },
    { team: "Arsenal", logo: "", wins: 26 },
  ],
  goalsConceded: [
    { team: "Arsenal", logo: "", goalsAgainst: 27 },
    { team: "Paris Saint-Germain", logo: "", goalsAgainst: 29 },
    { team: "Borussia Dortmund", logo: "", goalsAgainst: 34 },
    { team: "Man City, Real Madrid, Inter, Lens", logo: "", goalsAgainst: 35 },
    { team: "Barcelona, Napoli, Bayern München", logo: "", goalsAgainst: 36 },
  ],
  // Real, verified data (researched earlier)
  plRecordSignings: [
    { player: "Alexander Isak", club: "Liverpool", fee: "£125m" },
    { player: "Morgan Rogers", club: "Chelsea", fee: "£117m" },
    { player: "Florian Wirtz", club: "Liverpool", fee: "£116.5m" },
    { player: "Elliot Anderson", club: "Man City", fee: "£116m" },
    { player: "Moises Caicedo", club: "Chelsea", fee: "£115m" },
  ],
  // PLACEHOLDER — replace with real data
  plTopScorers2526: [
    { name: "E. Haaland", team: "Manchester City", goals: 27 },
    { name: "Thiago", team: "Brentford", goals: 22 },
    { name: "João Pedro", team: "Chelsea", goals: 15 },
    { name: "O. Watkins", team: "Aston Villa", goals: 14 },
    { name: "M. Gibbs-White", team: "Nottingham Forest", goals: 14 },
  ],
  // PLACEHOLDER — replace with real data
  mvp: [
    { name: "Erling Haaland", team: "Manchester City", value: "€220m" },
    { name: "Lamine Yamal", team: "FC Barcelona", value: "€220m" },
    { name: "Kylian Mbappé", team: "Real Madrid", value: "€200m" },
    { name: "Michael Olise", team: "Bayern Munich", value: "€170m" },
    { name: "Jude Bellingham", team: "Real Madrid", value: "€160m" },
  ],
  // PLACEHOLDER — replace with real data
  youngMvp: [
    { name: "Player Name", team: "Team", age: 0, value: "€0m" },
    { name: "Player Name", team: "Team", age: 0, value: "€0m" },
    { name: "Player Name", team: "Team", age: 0, value: "€0m" },
    { name: "Player Name", team: "Team", age: 0, value: "€0m" },
    { name: "Player Name", team: "Team", age: 0, value: "€0m" },
  ],
  // PLACEHOLDER — single winner, replace with real data
  ballonDor: { name: "Ousmane Dembélé", team: "Paris Saint-Germain", year: "2025" },
};

function useFixtures(leagueId) {
  const [fixtures, setFixtures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let ignore = false;
    setLoaded(false);
    async function load() {
      try {
        const r = await fetch(`/api/fixtures?leagueId=${leagueId}&full=true`);
        const d = await r.json();
        const all = d.fixtures || [];

        // Prioritize fixtures that haven't been played yet, soonest first —
        // full=true returns the whole season, so without this the widget
        // could show random past matches instead of what's coming up next.
        const upcoming = all.filter(f => f.status !== "finished").sort((a, b) => new Date(a.date) - new Date(b.date));
        const recent = all.filter(f => f.status === "finished").sort((a, b) => new Date(b.date) - new Date(a.date));
        const ordered = upcoming.length > 0 ? upcoming : recent;

        if (!ignore) setFixtures(ordered.slice(0, 6));
      } catch {
        if (!ignore) setFixtures([]);
      }
      if (!ignore) setLoaded(true);
    }
    load();
    return () => { ignore = true; };
  }, [leagueId]);
  return { fixtures, loaded };
}

export default function LandingPage({ onGetStarted }) {

  const [fixtureLeague, setFixtureLeague] = useState("pl");
  const [cupsMenuOpen, setCupsMenuOpen] = useState(false);
  const { fixtures, loaded: fixturesLoaded } = useFixtures(fixtureLeague);
  const [statsView, setStatsView] = useState("scorers");
  const FIXTURE_LEAGUES = [
    { id: "pl", label: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: "laliga", label: "La Liga", emoji: "🇪🇸" },
    { id: "seriea", label: "Serie A", emoji: "🇮🇹" },
    { id: "bundesliga", label: "Bundesliga", emoji: "🇩🇪" },
    { id: "ligue1", label: "Ligue 1", emoji: "🇫🇷" },
    { id: "ucl", label: "Champions League", emoji: "🏆" },
  ];

  const FIXTURE_CUPS = [
    { id: "communityshield", label: "Community Shield", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { id: "dflsupercup", label: "DFL-Supercup", emoji: "🇩🇪" },
    { id: "tropheedeschampions", label: "Trophée des Champions", emoji: "🇫🇷" },
    { id: "supercoppa", label: "Supercoppa Italiana", emoji: "🇮🇹" },
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
        .nav-cta-btn { background: #4ade80; border: none; border-radius: 8px; color: #0a0f0a; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 800; padding: 8px 14px; white-space: nowrap; flex-shrink: 0; transition: background 0.2s; }
        .nav-cta-btn:hover { background: #22c55e; }
        .post-card { display: block; background: #13102a; border: 1px solid #2a1f4a; border-radius: 14px; padding: 22px; text-decoration: none; transition: border-color 0.2s, transform 0.15s; }
        .post-card:hover { border-color: #4ade80; transform: translateY(-2px); }
        .predict-strip { background: linear-gradient(135deg, #13102a, #0d0018); border: 1px solid #2a1f4a; border-radius: 16px; padding: 28px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .posts-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 17px !important; }
        }
        @media (max-width: 480px) {
          .nav-subtitle { display: none !important; }
          .nav-cta-btn { font-size: 11px !important; padding: 7px 10px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1f4a", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div className="nav-subtitle" style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700 }}>DATA-DRIVEN FOOTBALL INSIGHTS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="nav-cta-btn" onClick={onGetStarted}>Predict a Match</button>
        </div>
      </nav>

      {/* HERO — compact strip, fixtures/predictions are the real front door */}
      <section style={{ padding: "90px 24px 20px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div className="hero-title" style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", lineHeight: 1.4, marginBottom: 10 }}>
          The data has spoken. <span style={{ color: "#7c3aed" }}>The AI has its call.</span> <span style={{ color: "#4ade80" }}>What's yours?</span>
        </div>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5, marginBottom: 0 }}>
          Powered by real football data — stats, records, and predictions in one place.
        </p>
      </section>

      {/* STATS WIDGET — single toggle-based card, static data (no API) */}
      <section style={{ maxWidth: 560, margin: "0 auto", padding: "10px 20px 40px" }}>
        <div style={{ background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 16, padding: 22, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#f0f0f0" }}>📊 Records</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>
                World Cup stats, Europe's best, market values, and Premier League history — all in one place.
              </div>
            </div>
            <img src="/deep433.jpg" alt="Deep433" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, marginTop: 4 }}>
              {statsView === "scorers" && "World Cup Top Scorers"}
              {statsView === "assists" && "World Cup Top Assists"}
              {statsView === "cleanSheets" && "Best of Europe · Clean Sheets"}
              {statsView === "topGoals" && "Best of Europe · Top Goals"}
              {statsView === "wins" && "Best of Europe · Most Wins"}
              {statsView === "goalsConceded" && "Best of Europe · Fewest Goals Conceded"}
              {statsView === "plRecordSignings" && "Premier League · Record Signings"}
              {statsView === "plTopScorers2526" && "Premier League · Top Scorers 2025/26"}
              {statsView === "mvp" && "Most Valuable Players"}
              {statsView === "youngMvp" && "Most Valuable Young Players"}
              {statsView === "ballonDor" && "Current Ballon d'Or Winner"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {(statsView === "scorers" || statsView === "assists") && "2026 Tournament"}
              {(statsView === "cleanSheets" || statsView === "topGoals" || statsView === "wins" || statsView === "goalsConceded" || statsView === "plTopScorers2526") && "2025/2026 Season"}
              {statsView === "plRecordSignings" && "All-Time"}
              {(statsView === "mvp" || statsView === "youngMvp" || statsView === "ballonDor") && "Current"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { id: "scorers", label: "Scorers", emoji: "🥇", color: "#fbbf24" },
              { id: "assists", label: "Assists", emoji: "🎯", color: "#a855f7" },
              { id: "cleanSheets", label: "Clean Sheets", emoji: "🧤", color: "#60a5fa" },
              { id: "topGoals", label: "Top Goals", emoji: "⚽", color: "#4ade80" },
              { id: "wins", label: "Wins", emoji: "🏆", color: "#fbbf24" },
              { id: "goalsConceded", label: "Fewest Conceded", emoji: "🛡️", color: "#4ade80" },
              { id: "plRecordSignings", label: "PL Record Fees", emoji: "💰", color: "#4ade80" },
              { id: "plTopScorers2526", label: "PL Scorers 25/26", emoji: "⚡", color: "#4ade80" },
              { id: "mvp", label: "Most Valuable", emoji: "💎", color: "#60a5fa" },
              { id: "youngMvp", label: "Most Valuable U21", emoji: "🌟", color: "#a855f7" },
              { id: "ballonDor", label: "Ballon d'Or", emoji: "🏆", color: "#fbbf24" },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setStatsView(btn.id)}
                style={{
                  background: statsView === btn.id ? `${btn.color}22` : "none",
                  border: `1px solid ${statsView === btn.id ? btn.color : "#2a1f4a"}`,
                  borderRadius: 20, color: statsView === btn.id ? btn.color : "#94a3b8",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "6px 12px",
                }}
              >
                {btn.emoji} {btn.label}
              </button>
            ))}
          </div>

          <div>
            {(statsView === "scorers" ? STATIC_STATS.scorers : []).map((p, i) => (
              statsView === "scorers" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {NATION_FLAG_CODES[p.nationality] && <img src={`https://flagcdn.com/w20/${NATION_FLAG_CODES[p.nationality]}.png`} alt="" style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />}
                    {i + 1}. {p.name} {p.apps && <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.apps} apps</span>}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{p.goals}</span>
                </div>
              )
            ))}
            {(statsView === "assists" ? STATIC_STATS.assists : []).map((p, i) => (
              statsView === "assists" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {NATION_FLAG_CODES[p.nationality] && <img src={`https://flagcdn.com/w20/${NATION_FLAG_CODES[p.nationality]}.png`} alt="" style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />}
                    {i + 1}. {p.name} {p.apps && <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.apps} apps</span>}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#a855f7" }}>{p.assists}</span>
                </div>
              )
            ))}
            {(statsView === "cleanSheets" ? STATIC_STATS.cleanSheets : []).map((t, i) => (
              statsView === "cleanSheets" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                    {i + 1}. {t.team}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>{t.cleanSheets}</span>
                </div>
              )
            ))}
            {(statsView === "topGoals" ? STATIC_STATS.topGoals : []).map((t, i) => (
              statsView === "topGoals" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                    {i + 1}. {t.team}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{t.goalsFor}</span>
                </div>
              )
            ))}
            {(statsView === "wins" ? STATIC_STATS.wins : []).map((t, i) => (
              statsView === "wins" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                    {i + 1}. {t.team}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{t.wins}</span>
                </div>
              )
            ))}
            {(statsView === "goalsConceded" ? STATIC_STATS.goalsConceded : []).map((t, i) => (
              statsView === "goalsConceded" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                    {t.logo && <img src={t.logo} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                    {i + 1}. {t.team}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#f87171" }}>{t.goalsAgainst}</span>
                </div>
              )
            ))}
            {(statsView === "plRecordSignings" ? STATIC_STATS.plRecordSignings : []).map((p, i) => (
              statsView === "plRecordSignings" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0" }}>{i + 1}. {p.player} <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.club}</span></span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{p.fee}</span>
                </div>
              )
            ))}
            {(statsView === "plTopScorers2526" ? STATIC_STATS.plTopScorers2526 : []).map((p, i) => (
              statsView === "plTopScorers2526" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0" }}>{i + 1}. {p.name} <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.team}</span></span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{p.goals}</span>
                </div>
              )
            ))}
            {(statsView === "mvp" ? STATIC_STATS.mvp : []).map((p, i) => (
              statsView === "mvp" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0" }}>{i + 1}. {p.name} <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.team}</span></span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>{p.value}</span>
                </div>
              )
            ))}
            {(statsView === "youngMvp" ? STATIC_STATS.youngMvp : []).map((p, i) => (
              statsView === "youngMvp" && (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #1e1830" : "none" }}>
                  <span style={{ fontSize: 14, color: "#f0f0f0" }}>{i + 1}. {p.name} <span style={{ color: "#94a3b8", fontSize: 12 }}>· {p.team}, {p.age}y</span></span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>{p.value}</span>
                </div>
              )
            ))}
            {statsView === "ballonDor" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0" }}>{STATIC_STATS.ballonDor.name}</div>
                <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>{STATIC_STATS.ballonDor.team} · {STATIC_STATS.ballonDor.year}</div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={onGetStarted} style={{ background: "none", border: "none", fontSize: 13, color: "#4ade80", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>More Stats →</button>
          </div>
        </div>
      </section>

      {/* FIXTURES — second priority after Records, since data is Deep433's core identity */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#f0f0f0" }}>Upcoming Fixtures</div>
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 24, position: "relative" }}>
          {FIXTURE_LEAGUES.map(l => (
            <button
              key={l.id}
              onClick={() => { setFixtureLeague(l.id); setCupsMenuOpen(false); }}
              style={{
                background: fixtureLeague === l.id ? "#4ade8022" : "none",
                border: `1px solid ${fixtureLeague === l.id ? "#4ade80" : "#2a1f4a"}`,
                borderRadius: 20, color: fixtureLeague === l.id ? "#4ade80" : "#94a3b8",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "6px 14px",
              }}
            >
              {l.emoji} {l.label}
            </button>
          ))}

          {/* Cups folded into one dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCupsMenuOpen(o => !o)}
              style={{
                background: FIXTURE_CUPS.some(c => c.id === fixtureLeague) ? "#4ade8022" : "none",
                border: `1px solid ${FIXTURE_CUPS.some(c => c.id === fixtureLeague) ? "#4ade80" : "#2a1f4a"}`,
                borderRadius: 20, color: FIXTURE_CUPS.some(c => c.id === fixtureLeague) ? "#4ade80" : "#94a3b8",
                cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "6px 14px",
              }}
            >
              🏆 Cups {cupsMenuOpen ? "▲" : "▼"}
            </button>
            {cupsMenuOpen && (
              <div style={{ position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "#13102a", border: "1px solid #2a1f4a", borderRadius: 10, padding: 6, display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
                {FIXTURE_CUPS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setFixtureLeague(c.id); setCupsMenuOpen(false); }}
                    style={{
                      background: fixtureLeague === c.id ? "#4ade8022" : "none",
                      border: "none", borderRadius: 8, color: fixtureLeague === c.id ? "#4ade80" : "#f0f0f0",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "8px 12px", textAlign: "left",
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!fixturesLoaded && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading fixtures…</div>}
        {fixturesLoaded && fixtures.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No upcoming fixtures found for this competition right now.</div>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{f.home} <span style={{ color: "#94a3b8" }}>vs</span> {f.away}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>{timeFormatter(f.kickoff)}</span>
                      {f.status === "finished" ? (
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

      {/* What's Inside — full site map for new visitors */}
      <section style={{ background: "#f6f7f5", padding: "48px 20px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 6 }}>One App, Every Angle on Football</div>
            <div style={{ fontSize: 14, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Your Toolkit</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
            { icon: "⚡", title: "Predict", desc: "Make your call before kickoff, compare against 433's AI prediction.", href: "/" },
            { icon: "🔴", title: "Live Scores", desc: "Real-time scores across every major league and tournament.", href: "/" },
            { icon: "🆚", title: "You vs AI", desc: "Track your prediction record against 433 all season long.", href: "/" },
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
          <div style={{ fontSize: 14, color: "#94a3b8" }}>Match breakdowns, previews, and fan-written takes — all on the blog.</div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Visit the blog →</div>
        </a>
      </section>

      {/* PREDICT STRIP */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="predict-strip">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>Your Turn</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Done reading? Make your own prediction.</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>Lock in a scoreline, see how it compares to the AI's guess — no account needed.</div>
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
          <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" aria-label="Follow Deep433 on X" style={{ display: "inline-flex", color: "#94a3b8" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

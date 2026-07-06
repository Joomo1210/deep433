import { useState, useRef, useEffect } from "react";

const LEAGUE_OPTIONS = [
  { id: "wc2026", label: "World Cup 2026" },
  { id: "pl",     label: "Premier League" },
  { id: "laliga", label: "La Liga" },
  { id: "seriea", label: "Serie A" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "ligue1", label: "Ligue 1" },
  { id: "ucl",    label: "Champions League" },
];

// ─── FIXTURE PICKER ──────────────────────────────────────────────────────────
function FixturePicker({ onSelect }) {
  const [leagueId, setLeagueId] = useState("wc2026");
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setFixtures([]);
    fetch(`/api/fixtures?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => setFixtures(d.fixtures || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leagueId]);

  const getDateLabel = (dateStr) => {
    const now = new Date();
    const localDate = (d) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth()+1).padStart(2,"0");
      const dy = String(d.getDate()).padStart(2,"0");
      return `${yr}-${mo}-${dy}`;
    };
    const today = localDate(now);
    const yesterday = localDate(new Date(now.getTime() - 86400000));
    const tomorrow = localDate(new Date(now.getTime() + 86400000));
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  const filtered = search.trim()
    ? fixtures.filter(f => f.home.toLowerCase().includes(search.toLowerCase()) || f.away.toLowerCase().includes(search.toLowerCase()))
    : fixtures;

  const byDate = filtered.reduce((acc, f) => {
    const label = getDateLabel(f.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(f);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* League selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.map(l => (
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="🔍 Search team..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 13, padding: "9px 14px", outline: "none", fontFamily: "inherit" }}
      />

      {loading && <div style={{ fontSize: 12, color: "#555", textAlign: "center" }}>Loading fixtures...</div>}

      {/* Fixture list */}
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(byDate).map(([date, dateFixtures]) => (
          <div key={date}>
            <div style={{ fontSize: 10, color: date === "Today" ? "#4ade80" : date === "Yesterday" ? "#888" : date === "Tomorrow" ? "#f59e0b" : "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "6px 0 4px" }}>{date}</div>
            {dateFixtures.map((f, i) => (
              <div
                key={i}
                onClick={() => onSelect(f)}
                style={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {f.homeLogo && <img src={f.homeLogo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>{f.home}</span>
                </div>
                <div style={{ textAlign: "center", fontSize: 11 }}>
                  {f.status === "finished"
                    ? <span style={{ color: "#888", fontWeight: 800 }}>{f.score.home}-{f.score.away}</span>
                    : f.status === "live"
                    ? <span style={{ color: "#ef4444", fontWeight: 700 }}>🔴 LIVE</span>
                    : <span style={{ color: "#555" }}>{new Date(f.kickoff).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST</span>
                  }
                  <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>{f.round}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>{f.away}</span>
                  {f.awayLogo && <img src={f.awayLogo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const LEAGUE_LOGOS = {
  wc2026:     "https://media.api-sports.io/football/leagues/1.png",
  pl:         "https://media.api-sports.io/football/leagues/39.png",
  laliga:     "https://media.api-sports.io/football/leagues/140.png",
  seriea:     "https://media.api-sports.io/football/leagues/135.png",
  bundesliga: "https://media.api-sports.io/football/leagues/78.png",
  ligue1:     "https://media.api-sports.io/football/leagues/61.png",
  ucl:        "https://media.api-sports.io/football/leagues/2.png",
};

const ratingColor = (r) => {
  const n = parseFloat(r);
  if (!n) return "#555";
  if (n >= 8) return "#4ade80";
  if (n >= 7) return "#f59e0b";
  if (n >= 6) return "#f97316";
  return "#f87171";
};

function StatRow({ label, home, away, icon }) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a || 1;
  const homePct = Math.round((h / total) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#4ade80", minWidth: 36 }}>{home ?? "0"}</span>
        <span style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{icon && icon + " "}{label}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b", minWidth: 36, textAlign: "right" }}>{away ?? "0"}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${homePct}%`, background: "#4ade80" }} />
        <div style={{ width: `${100 - homePct}%`, background: "#f59e0b", opacity: 0.5 }} />
      </div>
    </div>
  );
}

function GraphicCard({ children, cardRef, label }) {
  return (
    <div>
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 60%, #0a0f0a 100%)",
          border: "1px solid #1e1e30",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
        <div style={{ position: "absolute", top: 12, right: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
          <span style={{ fontSize: 8, color: "#555" }}>deep433.com</span>
        </div>
        {/* Centre background watermark */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 0,
        }}>
          <div style={{
            fontSize: 72, fontWeight: 900, color: "#4ade80", opacity: 0.04,
            letterSpacing: 6, textTransform: "uppercase", userSelect: "none",
            transform: "rotate(-15deg)", whiteSpace: "nowrap",
          }}>
            DEEP433
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#555", textAlign: "center", marginTop: 8 }}>{label}</div>
    </div>
  );
}

// ─── MATCH STATS GRAPHIC ────────────────────────────────────────────────────
function MatchStatsGraphic() {
  const cardRef = useRef(null);
  const [fixtureId, setFixtureId] = useState("");
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (f) => {
    setSelectedFixture(f);
    setFixtureId(f.fixtureId);
    setData(null);
    setError("");
  };

  const fetch_ = async (id) => {
    const fid = id || fixtureId;
    if (!fid) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/match-stats?fixtureId=${fid}`);
      const d = await r.json();
      if (!d.available) throw new Error("No stats available for this fixture yet — try after kickoff");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-match-stats-${fixtureId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed — try screenshotting manually"); }
    setDownloading(false);
  };

  const s = data;
  const KEY_STATS = [
    { key: "possession",   label: "Possession",    icon: "⚽" },
    { key: "shotsTotal",   label: "Total Shots",   icon: "🎯" },
    { key: "shotsOnGoal",  label: "Shots on Target", icon: "🥅" },
    { key: "corners",      label: "Corners",       icon: "🚩" },
    { key: "fouls",        label: "Fouls",         icon: "⚠️" },
    { key: "saves",        label: "Saves",         icon: "🧤" },
    { key: "passAccuracy", label: "Pass Accuracy", icon: "🎯" },
    { key: "yellowCards",  label: "Yellow Cards",  icon: "🟨" },
    { key: "offsides",     label: "Offsides",      icon: "🚫" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={() => fetch_()} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading stats..." : "Load Match Stats"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

      {s && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {s.home.logo && <img src={s.home.logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{s.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Match Stats</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.away.logo && <img src={s.away.logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{s.away.team}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 14 }} />
              {KEY_STATS.map(stat => (
                <StatRow
                  key={stat.key}
                  label={stat.label}
                  icon={stat.icon}
                  home={s.home.stats[stat.key]}
                  away={s.away.stats[stat.key]}
                />
              ))}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── PLAYER RATINGS GRAPHIC ─────────────────────────────────────────────────
function PlayerRatingsGraphic() {
  const cardRef = useRef(null);
  const [fixtureId, setFixtureId] = useState("");
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("home");

  const handleSelect = (f) => {
    setSelectedFixture(f);
    setFixtureId(f.fixtureId);
    setData(null);
    setError("");
  };

  const fetch_ = async () => {
    if (!fixtureId) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/player-ratings?fixtureId=${fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No player ratings available yet — try after kickoff");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-player-ratings-${fixtureId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const teamData = data?.[selectedTeam];
  const players = teamData?.players?.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading ratings..." : "Load Player Ratings"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            {["home", "away"].map(t => (
              <button key={t} onClick={() => setSelectedTeam(t)} style={{ flex: 1, background: selectedTeam === t ? "#4ade80" : "none", border: `1px solid ${selectedTeam === t ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: selectedTeam === t ? "#0a0f0a" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "8px" }}>
                {data[t]?.team}
              </button>
            ))}
          </div>

          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 8 }}>
                {teamData?.logo && <img src={teamData.logo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#f0f0f0" }}>{teamData?.team}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>Player Ratings</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 12 }} />
              {players.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f0f1a" }}>
                  <div style={{ width: 24, textAlign: "center", fontSize: 11, color: "#555", fontWeight: 700 }}>{i + 1}</div>
                  {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>
                      {p.position} · {p.minutesPlayed}'
                      {p.goals ? ` · ⚽ ${p.goals}` : ""}
                      {p.assists ? ` · 🎯 ${p.assists}` : ""}
                      {p.yellowCards ? " · 🟨" : ""}
                      {p.redCards ? " · 🟥" : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: ratingColor(p.rating), minWidth: 40, textAlign: "right" }}>
                    {p.rating ? parseFloat(p.rating).toFixed(1) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TOP SCORERS GRAPHIC ─────────────────────────────────────────────────────
function TopScorersGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [type, setType] = useState("scorers");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const fetch_ = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/top-scorers?leagueId=${leagueId}&type=${type}`);
      const d = await r.json();
      if (!d.available) throw new Error("No data available");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-${type}-${leagueId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const typeLabels = { scorers: "Top Scorers", assists: "Top Assists", cards: "Most Booked" };
  const typeIcons =  { scorers: "⚽", assists: "🎯", cards: "🟨" };
  const statLabel =  { scorers: "GOALS", assists: "ASSISTS", cards: "CARDS" };

  const getStatValue = (p) => {
    if (type === "scorers") return p.goals || 0;
    if (type === "assists") return p.assists || 0;
    return (p.yellowCards || 0);
  };

  const getSecondary = (p) => {
    if (type === "scorers") return p.appearances ? `${p.appearances} apps` : null;
    if (type === "assists") return p.appearances ? `${p.appearances} apps` : null;
    return p.redCards ? `${p.redCards}🟥` : null;
  };

  const rankColor = (i) => {
    if (i === 0) return "#FFD700"; // Gold
    if (i === 1) return "#C0C0C0"; // Silver
    if (i === 2) return "#CD7F32"; // Bronze
    return "#555";
  };

  const rankBg = (i) => {
    if (i === 0) return "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))";
    if (i === 1) return "linear-gradient(135deg, rgba(192,192,192,0.06), rgba(192,192,192,0.01))";
    if (i === 2) return "linear-gradient(135deg, rgba(205,127,50,0.06), rgba(205,127,50,0.01))";
    return "transparent";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["scorers", "assists", "cards"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, background: type === t ? "#a855f7" : "none", border: `1px solid ${type === t ? "#a855f7" : "#2a2a3a"}`, borderRadius: 8, color: type === t ? "#fff" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "8px" }}>
            {typeIcons[t]} {typeLabels[t]}
          </button>
        ))}
      </div>
      <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "10px" }}>
        {loading ? "Loading..." : "Load Leaderboard"}
      </button>
      {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 8 }}>
                {LEAGUE_LOGOS[leagueId] && <img src={LEAGUE_LOGOS[leagueId]} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#f0f0f0" }}>{typeLabels[type]}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
                <div style={{ fontSize: 9, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{statLabel[type]}</div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 8 }} />

              {data.players.map((p, i) => {
                const isTop3 = i < 3;
                const secondary = getSecondary(p);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: isTop3 ? "10px 8px" : "7px 4px",
                    borderBottom: "1px solid #0f0f1a",
                    background: rankBg(i),
                    borderRadius: isTop3 ? 8 : 0,
                    marginBottom: isTop3 ? 4 : 0,
                    border: i === 0 ? "1px solid rgba(255,215,0,0.15)" : i === 1 ? "1px solid rgba(192,192,192,0.1)" : i === 2 ? "1px solid rgba(205,127,50,0.1)" : "none",
                  }}>
                    {/* Rank — golden boot for scorers, medals for others */}
                    <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                      {i < 3 && type === "scorers" ? (
                        <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          {/* Boot shape */}
                          <path d="M20 70 L20 30 Q20 20 30 20 L55 20 Q65 20 65 30 L65 50 L80 50 Q90 50 90 60 L90 75 Q90 85 80 85 L25 85 Q15 85 15 75 L15 70 Z"
                            fill={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"}
                            stroke={i === 0 ? "#B8860B" : i === 1 ? "#A0A0A0" : "#8B4513"}
                            strokeWidth="3"
                          />
                          {/* Sole */}
                          <path d="M15 78 Q15 88 25 88 L80 88 Q90 88 90 78 L90 82 Q90 90 80 90 L25 90 Q15 90 15 82 Z"
                            fill={i === 0 ? "#B8860B" : i === 1 ? "#909090" : "#8B4513"}
                          />
                          {/* Laces */}
                          <line x1="30" y1="35" x2="55" y2="35" stroke={i === 0 ? "#B8860B" : i === 1 ? "#909090" : "#8B4513"} strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="30" y1="42" x2="55" y2="42" stroke={i === 0 ? "#B8860B" : i === 1 ? "#909090" : "#8B4513"} strokeWidth="2.5" strokeLinecap="round"/>
                          <line x1="30" y1="49" x2="55" y2="49" stroke={i === 0 ? "#B8860B" : i === 1 ? "#909090" : "#8B4513"} strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <span style={{ fontSize: isTop3 ? 16 : 12, color: rankColor(i), fontWeight: 900 }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </span>
                      )}
                    </div>
                    {/* Photo */}
                    {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: isTop3 ? 36 : 28, height: isTop3 ? 36 : 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: isTop3 ? `1.5px solid ${rankColor(i)}44` : "none" }} />}
                    {/* Name + team */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isTop3 ? 14 : 12, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        {p.teamLogo && <img src={p.teamLogo} alt="" crossOrigin="anonymous" style={{ width: 12, height: 12, objectFit: "contain" }} />}
                        <span style={{ fontSize: 10, color: "#555" }}>{p.team}</span>
                        {secondary && <span style={{ fontSize: 9, color: "#444", marginLeft: 4 }}>· {secondary}</span>}
                      </div>
                    </div>
                    {/* Stat value */}
                    <div style={{ fontSize: isTop3 ? 28 : 20, fontWeight: 900, color: "#4ade80", minWidth: 36, textAlign: "right", flexShrink: 0 }}>
                      {getStatValue(p)}
                    </div>
                  </div>
                );
              })}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TEAM STATS GRAPHIC ──────────────────────────────────────────────────────
function TeamStatsGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("pl");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null); // { id, name, logo }
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const searchTeams = async (query) => {
    if (query.length < 3) { setTeamSuggestions([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/team-search?query=${encodeURIComponent(query)}`);
      const d = await r.json();
      setTeamSuggestions(d.teams || []);
    } catch {}
    setSearching(false);
  };

  const fetch_ = async () => {
    if (!selectedTeam) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/team-stats?leagueId=${leagueId}&teamId=${selectedTeam.id}`);
      const d = await r.json();
      if (!d.available) throw new Error("No stats available for this team in this competition");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-team-stats-${data?.team}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const formDot = (r) => (
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: r === "W" ? "#4ade80" : r === "D" ? "#a78bfa" : "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(1).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setData(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      {/* Team search */}
      <div style={{ position: "relative" }}>
        <input
          placeholder="Search team name e.g. Arsenal, Barcelona..."
          value={selectedTeam ? selectedTeam.name : teamSearch}
          onChange={e => {
            setTeamSearch(e.target.value);
            setSelectedTeam(null);
            setData(null);
            searchTeams(e.target.value);
          }}
          style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${selectedTeam ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 14, padding: "10px 14px", outline: "none", fontFamily: "inherit" }}
        />
        {searching && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555" }}>Searching...</div>}
        {teamSuggestions.length > 0 && !selectedTeam && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 10, marginTop: 4, maxHeight: 200, overflowY: "auto" }}>
            {teamSuggestions.map(t => (
              <div key={t.id} onClick={() => { setSelectedTeam(t); setTeamSearch(t.name); setTeamSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
                {t.logo && <img src={t.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{t.country}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeam && (
        <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "10px" }}>
          {loading ? "Loading..." : `Load ${selectedTeam.name} Stats`}
        </button>
      )}

      {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, marginTop: 8 }}>
                {data.logo && <img src={data.logo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f0f0f0" }}>{data.team}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label} · Season Stats</div>
                </div>
              </div>

              {data.form && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Form</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {data.form.slice(-10).split("").map((r, i) => <div key={i}>{formDot(r)}</div>)}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 14 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Played",        value: data.played,          color: "#f0f0f0" },
                  { label: "Wins",          value: data.wins,            color: "#4ade80" },
                  { label: "Draws",         value: data.draws,           color: "#a78bfa" },
                  { label: "Losses",        value: data.losses,          color: "#f87171" },
                  { label: "Goals For",     value: data.goalsFor,        color: "#4ade80" },
                  { label: "Goals Against", value: data.goalsAgainst,    color: "#f87171" },
                  { label: "Clean Sheets",  value: data.cleanSheets,     color: "#60a5fa" },
                  { label: "Avg Scored",    value: data.avgGoalsFor,     color: "#4ade80" },
                  { label: "Avg Conceded",  value: data.avgGoalsAgainst, color: "#f87171" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#13131f", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value ?? "—"}</div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {(data.biggestWin || data.biggestLoss) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {data.biggestWin && <div style={{ background: "#4ade8011", border: "1px solid #4ade8022", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 4 }}>Biggest Win</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{data.biggestWin}</div>
                  </div>}
                  {data.biggestLoss && <div style={{ background: "#f8717111", border: "1px solid #f8717122", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#f87171", marginBottom: 4 }}>Biggest Loss</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#f87171" }}>{data.biggestLoss}</div>
                  </div>}
                </div>
              )}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── RECAP CARD ──────────────────────────────────────────────────────────────
function RecapGraphic({ history = [] }) {
  const cardRef = useRef(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [variant, setVariant] = useState("square");
  const [downloading, setDownloading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState("");

  const isLandscape = variant === "landscape";

  const handleSelect = async (f) => {
    setSelectedFixture(f);
    setError("");
    setMatchData(null);
    const fs = (f.score?.home != null && f.score?.away != null)
      ? `${f.score.home}-${f.score.away}` : null;
    if (!fs) { setError("No final score available — match may not be finished yet."); return; }
    const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const pred = history.find(h =>
      (norm(h.home_team) === norm(f.home) && norm(h.away_team) === norm(f.away)) ||
      (norm(h.home_team) === norm(f.away) && norm(h.away_team) === norm(f.home))
    );

    // Fetch goalscorers from match stats
    let homeGoals = [];
    let awayGoals = [];
    if (f.fixtureId) {
      try {
        const r = await fetch(`/api/match-stats?fixtureId=${f.fixtureId}`);
        const d = await r.json();
        // Also fetch events for goalscorers
        const er = await fetch(`/api/live-scores?leagueId=wc2026&date=${f.date}`);
        const ed = await er.json();
        const liveMatch = (ed.matches || []).find(m =>
          norm(m.home) === norm(f.home) || norm(m.away) === norm(f.home)
        );
        if (liveMatch?.events) {
          liveMatch.events.filter(e => e.type === "Goal").forEach(e => {
            const scorer = `${e.label?.split("(")[0]?.trim()} ${e.minute}'`;
            if (norm(e.team) === norm(f.home)) homeGoals.push(scorer);
            else awayGoals.push(scorer);
          });
        }
      } catch {}
    }

    setMatchData({
      finalScore: fs,
      yourPrediction: pred?.user_prediction || null,
      aiPrediction: pred?.ai_prediction || null,
      homeGoals,
      awayGoals,
      competition: "World Cup 2026",
      round: f.round || "",
    });
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-recap-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const fs = matchData?.finalScore || "0-0";
  const [fs0, fs1] = fs.split("-").map(n => parseInt(n) || 0);
  const yourPrediction = matchData?.yourPrediction;
  const aiPrediction = matchData?.aiPrediction;
  const finalScore = matchData?.finalScore;

  const getOutcome = (pred) => {
    if (!pred || !matchData?.finalScore) return null;
    const [p0, p1] = pred.split("-").map(n => parseInt(n) || 0);
    if (p0 === fs0 && p1 === fs1) return { icon: "✅", label: "Exact", color: "#4ade80" };
    const homeWon = fs0 > fs1;
    const awayWon = fs1 > fs0;
    const draw = fs0 === fs1;
    const correct = (homeWon && p0 > p1) || (awayWon && p1 > p0) || (draw && p0 === p1);
    if (correct) return { icon: "🟡", label: "Outcome ✓", color: "#f59e0b" };
    return { icon: "❌", label: "Missed", color: "#f87171" };
  };

  const yourResult = getOutcome(yourPrediction);
  const aiResult = getOutcome(aiPrediction);

  const CardContent = () => (
    <div style={{
      width: isLandscape ? Math.min(760, window.innerWidth - 32) : Math.min(480, window.innerWidth - 32),
      aspectRatio: isLandscape ? "16/9" : "1/1",
      background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 60%, #0a0f0a 100%)",
      borderRadius: 14, overflow: "hidden", position: "relative",
      display: "flex", flexDirection: isLandscape ? "row" : "column",
      border: "1px solid #1e1e30", fontFamily: "'Inter',sans-serif",
    }}>
      {/* Brand bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
      <div style={{ position: "absolute", top: 12, right: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
        <span style={{ fontSize: 9, color: "#555" }}>deep433.com</span>
      </div>
      {/* Watermark */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ fontSize: 60, fontWeight: 900, color: "#4ade80", opacity: 0.04, letterSpacing: 4, transform: "rotate(-15deg)", userSelect: "none" }}>DEEP433</div>
      </div>

      {isLandscape ? (
        <>
          {/* Left: final score hero */}
          <div style={{ width: "50%", padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #1a1a2a", position: "relative", zIndex: 1 }}>
            {/* Enhanced header */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>{matchData?.competition}</div>
              <div style={{ fontSize: 11, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", fontWeight: 900 }}>{selectedFixture?.round}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Full Time</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
            </div>
            {/* Team names + goalscorers */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8 }}>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{g}</div>)}
              </div>
            </div>
          </div>
          {/* Right: predictions */}
          <div style={{ flex: 1, padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Predictions</div>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#f59e0b" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: p.color, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: p.color }}>{p.pred || "—"}</div>
                </div>
                {p.result && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{p.result.icon}</div>
                    <div style={{ fontSize: 8, color: p.result.color, fontWeight: 700, marginTop: 2 }}>{p.result.label}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 12, paddingTop: 32, position: "relative", zIndex: 1 }}>
          {/* Enhanced header + final score */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>{matchData?.competition}</div>
            <div style={{ fontSize: 10, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 900 }}>{selectedFixture?.round}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
              <div>
                <div style={{ fontSize: 8, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Full Time</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
            </div>
            {/* Team names + goalscorers */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 8, color: "#555", marginTop: 1 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 8, color: "#555", marginTop: 1 }}>{g}</div>)}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "#1a1a2a" }} />
          {/* Predictions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#818cf8" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: p.color, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: p.color, marginBottom: 4 }}>{p.pred || "—"}</div>
                {p.result && (
                  <>
                    <div style={{ fontSize: 16 }}>{p.result.icon}</div>
                    <div style={{ fontSize: 8, color: p.result.color, fontWeight: 700, marginTop: 2 }}>{p.result.label}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setMatchData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

          {matchData && !matchData.yourPrediction && (
            <div style={{ fontSize: 12, color: "#f59e0b", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 8, padding: "10px 14px" }}>
              ⚠️ No prediction found for this match in your history. Make a prediction first to use the Recap card.
            </div>
          )}

          {matchData && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                {["square", "landscape"].map(v => (
                  <button key={v} onClick={() => setVariant(v)} style={{ flex: 1, background: variant === v ? "#4ade8022" : "none", border: `1px solid ${variant === v ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: variant === v ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "8px" }}>
                    {v === "square" ? "1:1 Square" : "16:9 Landscape"}
                  </button>
                ))}
              </div>

              <div ref={cardRef}>
                <CardContent />
              </div>

              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
                {downloading ? "Generating..." : "⬇ Download Recap Card"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── BRACKET GRAPHIC ─────────────────────────────────────────────────────────
function BracketGraphic({ history = [] }) {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 7 manual selectors: 4 QF + 2 SF + 1 Final
  const [sel, setSel] = useState({ qf1:"", qf2:"", qf3:"", qf4:"", sf1:"", sf2:"", fin:"" });
  const setS = (key) => (val) => setSel(prev => ({ ...prev, [key]: val }));

  const CUP_LEAGUES = [
    { id: "wc2026", label: "World Cup 2026" },
    { id: "ucl",    label: "Champions League" },
    { id: "uel",    label: "Europa League" },
    { id: "facup",  label: "FA Cup" },
    { id: "copadelrey", label: "Copa del Rey" },
    { id: "afcon",  label: "AFCON" },
    { id: "copamerica", label: "Copa America" },
  ];

  useEffect(() => {
    setLoading(true); setRounds([]);
    setSel({ qf1:"", qf2:"", qf3:"", qf4:"", sf1:"", sf2:"", fin:"" });
    fetch(`/api/bracket?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => setRounds(d.rounds || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leagueId]);

  const norm = s => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const getUserPred = (m) => m && history.find(h =>
    (norm(h.home_team) === norm(m.home) && norm(h.away_team) === norm(m.away)) ||
    (norm(h.home_team) === norm(m.away) && norm(h.away_team) === norm(m.home))
  );

  const getMatch = (val) => {
    if (!val) return null;
    const [roundName, mi] = val.split(":::");
    const r = rounds.find(r => r.round === roundName);
    return r?.matches[parseInt(mi)] || null;
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-bracket-${leagueId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const Node = ({ val, w = 155 }) => {
    const m = getMatch(val);
    const pred = getUserPred(m);
    const isF = m?.status === "finished";
    const isL = m?.status === "live";
    const hw = isF && m.score.home > m.score.away;
    const aw = isF && m.score.away > m.score.home;

    if (!m) return (
      <div style={{ width: w, background: "#0d0d18", border: "1px dashed #1e1e30", borderRadius: 8, padding: "14px 8px", textAlign: "center" }}>
        <span style={{ fontSize: 9, color: "#333" }}>Select match</span>
      </div>
    );

    return (
      <div style={{ width: w, background: "#13131f", border: `1.5px solid ${pred ? "#4ade80" : isL ? "#ef4444" : "#1e1e30"}`, borderRadius: 8, overflow: "hidden", boxShadow: pred ? "0 0 8px rgba(74,222,128,0.2)" : "none", flexShrink: 0 }}>
        {isL && <div style={{ height: 2, background: "#ef4444" }} />}
        {[{ name: m.home, logo: m.homeLogo, score: m.score?.home, won: hw }, { name: m.away, logo: m.awayLogo, score: m.score?.away, won: aw }].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 7px", background: t.won ? "#4ade8012" : "transparent", borderBottom: i === 0 ? "1px solid #0f0f1a" : "none" }}>
            {t.logo ? <img src={t.logo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} /> : <div style={{ width: 16, height: 16, background: "#1a1a2a", borderRadius: "50%", flexShrink: 0 }} />}
            <span style={{ fontSize: 10, fontWeight: t.won ? 800 : 600, color: t.won ? "#4ade80" : "#f0f0f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name || "TBD"}</span>
            {(isF || isL) && <span style={{ fontSize: 11, fontWeight: 900, color: t.won ? "#4ade80" : "#888" }}>{t.score ?? 0}</span>}
          </div>
        ))}
        <div style={{ padding: "2px 7px", background: "#0d0d18", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 7, color: isL ? "#ef4444" : "#555", fontWeight: 700 }}>
            {isL ? "🔴 LIVE" : isF ? m.statusRaw : new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          {pred && <span style={{ fontSize: 7, color: "#4ade80" }}>✓ {pred.user_prediction}</span>}
        </div>
      </div>
    );
  };

  const Arr = () => (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", flexShrink: 0 }}>
      <div style={{ width: 10, height: 1, background: "#2a2a3a" }} />
      <span style={{ fontSize: 10, color: "#333" }}>›</span>
    </div>
  );

  const DropDown = ({ label, skey }) => (
    <div>
      <div style={{ fontSize: 9, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <select value={sel[skey]} onChange={e => setS(skey)(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 6, color: "#f0f0f0", fontSize: 12, padding: "7px 10px", outline: "none", fontFamily: "inherit" }}>
        <option value="">— Select —</option>
        {rounds.map(r => (
          <optgroup key={r.round} label={r.round}>
            {r.matches.map((m, i) => (
              <option key={m.fixtureId} value={`${r.round}:::${i}`}>
                {m.home || "TBD"} vs {m.away || "TBD"} {m.status === "finished" ? `(${m.score.home}-${m.score.away})` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );

  const hasAny = Object.values(sel).some(v => v);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CUP_LEAGUES.map(l => (
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "20px 0" }}>Loading...</div>}

      {!loading && rounds.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DropDown label="QF Match 1 (top left)" skey="qf1" />
            <DropDown label="QF Match 2 (bottom left)" skey="qf2" />
            <DropDown label="QF Match 3 (top right)" skey="qf3" />
            <DropDown label="QF Match 4 (bottom right)" skey="qf4" />
            <DropDown label="SF Match 1 (top)" skey="sf1" />
            <DropDown label="SF Match 2 (bottom)" skey="sf2" />
            <DropDown label="🏆 Final" skey="fin" />
          </div>

          <div ref={cardRef} style={{ background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 60%, #0a0f0a 100%)", border: "1px solid #1e1e30", borderRadius: 14, overflow: "hidden", position: "relative", padding: "28px 16px 16px", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
            <div style={{ position: "absolute", top: 10, right: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
              <span style={{ fontSize: 7, color: "#555" }}>deep433.com</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
                {CUP_LEAGUES.find(l => l.id === leagueId)?.label}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", overflowX: "auto" }}>
              {/* QF column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
                <div style={{ fontSize: 8, color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 6 }}>Quarter-Final</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 12 }}>
                    <Node val={sel.qf1} />
                    <Node val={sel.qf2} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 12 }}>
                    <Node val={sel.qf3} />
                    <Node val={sel.qf4} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 60, padding: "0 2px", flexShrink: 0 }}>
                <Arr /><Arr />
              </div>
              {/* SF column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
                <div style={{ fontSize: 8, color: "#a855f7", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 6 }}>Semi-Final</div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 48 }}>
                  <Node val={sel.sf1} />
                  <Node val={sel.sf2} />
                </div>
              </div>
              <div style={{ padding: "0 2px", flexShrink: 0, alignSelf: "center" }}><Arr /></div>
              {/* Final */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 8, color: "#f59e0b", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 6 }}>🏆 Final</div>
                <Node val={sel.fin} w={170} />
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{ fontSize: 7, color: "#333" }}>🟢 Green border = your prediction · deep433.com</span>
            </div>
          </div>

          <button onClick={download} disabled={downloading || !hasAny} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%", opacity: !hasAny ? 0.4 : 1 }}>
            {downloading ? "Generating..." : "⬇ Download Bracket Card"}
          </button>
        </>
      )}
    </div>
  );
}



// ─── DEEP INSIGHTS GRAPHIC ───────────────────────────────────────────────────
function DeepInsightsGraphic() {
  const cardRef = useRef(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (f) => {
    setSelectedFixture(f);
    setInsights(null);
    setError("");
    if (!f.fixtureId) { setError("No fixture ID available"); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/fixture-insights?fixtureId=${f.fixtureId}&home=${encodeURIComponent(f.home)}&away=${encodeURIComponent(f.away)}`);
      const d = await r.json();
      if (!d.comparison) throw new Error("No insights available for this fixture yet");
      setInsights(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, { backgroundColor: "#0a0a0f", scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `deep433-insights-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const norm100 = (a, b) => {
    const av = parseFloat(a) || 0;
    const bv = parseFloat(b) || 0;
    const total = av + bv || 1;
    return { a: Math.round((av / total) * 100), b: Math.round((bv / total) * 100) };
  };

  const StatBar = ({ label, homeVal, awayVal, home, away }) => {
    const { a, b } = norm100(homeVal, awayVal);
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{a}%</span>
          <span style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{b}%</span>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${a}%`, background: "#4ade80" }} />
          <div style={{ width: `${b}%`, background: "#f59e0b", opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#444" }}>
          <span>{home?.split(" ")[0]}</span><span>{away?.split(" ")[0]}</span>
        </div>
      </div>
    );
  };

  const dotColor = (r) => r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171";

  const H2HRow = ({ team, results, ppg, logo }) => (
    <div style={{ background: "#0d0d18", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {logo && <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, objectFit: "contain" }} />}
          <span style={{ fontSize: 12, fontWeight: 800, color: "#f0f0f0" }}>{team}</span>
        </div>
        <span style={{ fontSize: 10, color: "#555" }}>PPG: <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{ppg}</span></span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {results.map((r, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: dotColor(r), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#4ade80" }}>W {results.filter(r => r === "W").length}</span>
          <span style={{ fontSize: 10, color: "#60a5fa" }}>D {results.filter(r => r === "D").length}</span>
          <span style={{ fontSize: 10, color: "#f87171" }}>L {results.filter(r => r === "L").length}</span>
        </div>
      </div>
    </div>
  );

  const parseH2H = (h2h, homeTeam, awayTeam) => {
    const norm = s => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    return h2h.map(r => {
      const parts = r.match(/^(.+?)\s+(\d+)-(\d+)\s+(.+)$/);
      if (!parts) return { result: "D" };
      const matchHome = parts[1].trim();
      const hg = parseInt(parts[2]);
      const ag = parseInt(parts[3]);
      if (hg === ag) return "D";
      const homeTeamWon = (norm(matchHome) === norm(homeTeam) && hg > ag) || (norm(matchHome) !== norm(homeTeam) && ag > hg);
      return homeTeamWon ? "W" : "L";
    });
  };

  const home = selectedFixture?.home;
  const away = selectedFixture?.away;
  const h2hResults = insights?.h2h?.length ? parseH2H(insights.h2h, home, away) : [];
  const awayResults = h2hResults.map(r => r === "W" ? "L" : r === "L" ? "W" : "D");
  const homePPG = h2hResults.length ? (h2hResults.reduce((a, r) => a + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / h2hResults.length).toFixed(2) : "0.00";
  const awayPPG = awayResults.length ? (awayResults.reduce((a, r) => a + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / awayResults.length).toFixed(2) : "0.00";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setInsights(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "20px 0" }}>Loading insights...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

          {insights && (
            <>
              <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
                <div style={{ padding: "22px 18px 18px" }}>
                  {/* Match header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>{home}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{selectedFixture.round}</div>
                      <div style={{ fontSize: 11, color: "#333", fontWeight: 700 }}>vs</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#f59e0b" }}>{away}</span>
                      {selectedFixture.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>📊 Deep Insights</div>

                  {/* Stat bars */}
                  {insights.comparison?.attackHome && (
                    <StatBar label="Attack" homeVal={insights.comparison.attackHome} awayVal={insights.comparison.attackAway} home={home} away={away} />
                  )}
                  {insights.comparison?.defenceHome && (
                    <StatBar label="Defence" homeVal={insights.comparison.defenceHome} awayVal={insights.comparison.defenceAway} home={home} away={away} />
                  )}
                  {insights.comparison?.formHome && (
                    <StatBar label="Form" homeVal={insights.comparison.formHome} awayVal={insights.comparison.formAway} home={home} away={away} />
                  )}

                  {/* H2H */}
                  {h2hResults.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>Recent H2H</div>
                      <H2HRow team={home} results={h2hResults} ppg={homePPG} logo={selectedFixture.homeLogo} />
                      <H2HRow team={away} results={awayResults} ppg={awayPPG} logo={selectedFixture.awayLogo} />
                    </>
                  )}
                </div>
              </GraphicCard>
              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
                {downloading ? "Generating..." : "⬇ Download PNG"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── MATCH PITCH VIEW GRAPHIC ────────────────────────────────────────────────
function MatchPitchViewGraphic() {
  const cardRef = useRef(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (f) => {
    setSelectedFixture(f);
    setLineup(null);
    setError("");
    if (!f.fixtureId) { setError("No fixture ID available"); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/match-lineup?fixtureId=${f.fixtureId}`);
      const d = await r.json();
      if (!d.available || !d.home?.players?.length) throw new Error("Lineup not confirmed yet — check back closer to kickoff");
      setLineup(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        document.head.appendChild(s);
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
      }
      const canvas = await window.html2canvas(cardRef.current, {
        backgroundColor: "#0a3d1f", scale: 2, useCORS: true, logging: false,
        allowTaint: false,
      });
      const link = document.createElement("a");
      link.download = `deep433-lineup-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed — try screenshotting manually"); }
    setDownloading(false);
  };

  // Grid format from API: "row:col" where row=depth, col=horizontal position
  const groupByRow = (players) => {
    const rows = {};
    (players || []).forEach(p => {
      if (!p.grid) return;
      const parts = p.grid.split(":");
      const row = parseInt(parts[0]);
      const col = parseInt(parts[1]);
      if (!rows[row]) rows[row] = [];
      rows[row].push({ ...p, col });
    });
    return Object.entries(rows)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, players]) => players.sort((a, b) => a.col - b.col));
  };

  const PlayerNode = ({ player, color }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 52 }}>
      <div style={{ position: "relative" }}>
        {player.photo ? (
          <img
            src={player.photo}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}`, display: "block" }}
          />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "22", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 900, color }}>{player.number}</span>
          </div>
        )}
        {player.photo && (
          <div style={{ position: "absolute", bottom: -2, right: -2, background: color, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, fontWeight: 900, color: "#0a0a0f" }}>{player.number}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 8, fontWeight: 700, color: "#f0f0f0", textAlign: "center", lineHeight: 1.2, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {player.name?.split(" ").slice(-1)[0]}
      </div>
    </div>
  );

  const TeamRows = ({ players, color, reverse = false }) => {
    const rows = groupByRow(players);
    const displayRows = reverse ? [...rows].reverse() : rows;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
        {displayRows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {row.map((p, pi) => <PlayerNode key={pi} player={p} color={color} />)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setLineup(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "20px 0" }}>Loading lineup...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

          {lineup && (
            <>
              <div
                ref={cardRef}
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 420,
                  margin: "0 auto",
                  borderRadius: 14,
                  overflow: "hidden",
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                {/* Pitch background SVG */}
                <svg viewBox="0 0 420 680" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
                  {/* Pitch */}
                  <rect width="420" height="680" fill="#0a3d1f" />
                  {/* Pitch outline */}
                  <rect x="20" y="20" width="380" height="640" fill="none" stroke="#1a6b3a" strokeWidth="2" rx="2" />
                  {/* Centre line */}
                  <line x1="20" y1="340" x2="400" y2="340" stroke="#1a6b3a" strokeWidth="2" />
                  {/* Centre circle */}
                  <circle cx="210" cy="340" r="55" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="340" r="3" fill="#1a6b3a" />
                  {/* Top penalty area */}
                  <rect x="100" y="20" width="220" height="90" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <rect x="155" y="20" width="110" height="40" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="95" r="4" fill="#1a6b3a" />
                  {/* Top penalty arc */}
                  <path d="M 170 110 A 55 55 0 0 1 250 110" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  {/* Bottom penalty area */}
                  <rect x="100" y="570" width="220" height="90" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <rect x="155" y="640" width="110" height="40" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="585" r="4" fill="#1a6b3a" />
                  {/* Bottom penalty arc */}
                  <path d="M 170 570 A 55 55 0 0 0 250 570" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  {/* Grass stripes */}
                  {[0,1,2,3,4,5,6].map(i => (
                    <rect key={i} x="20" y={20 + i * 91} width="380" height="45" fill={i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"} />
                  ))}
                </svg>

                {/* Players overlaid on pitch */}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "24px 8px" }}>
                  {/* Brand */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
                  <div style={{ position: "absolute", top: 8, right: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
                  </div>

                  {/* Watermark */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: "#4ade80", opacity: 0.04, letterSpacing: 4, transform: "rotate(-15deg)", userSelect: "none" }}>DEEP433</div>
                  </div>

                  {/* Home team header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
                    {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#4ade80" }}>{selectedFixture.home}</span>
                    <span style={{ fontSize: 9, color: "#555" }}>{lineup.home?.formation}</span>
                  </div>

                  {/* Home team players */}
                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.home?.players} color="#4ade80" reverse={false} />
                  </div>

                  {/* Centre line label */}
                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 8, color: "#1a6b3a", fontWeight: 700, letterSpacing: 2 }}>· · · · · · · · · · · · · ·</span>
                  </div>

                  {/* Away team players */}
                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.away?.players} color="#f59e0b" reverse={true} />
                  </div>

                  {/* Away team header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: 4 }}>
                    {selectedFixture.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b" }}>{selectedFixture.away}</span>
                    <span style={{ fontSize: 9, color: "#555" }}>{lineup.away?.formation}</span>
                  </div>
                </div>
              </div>

              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "12px", width: "100%" }}>
                {downloading ? "Generating..." : "⬇ Download Pitch View PNG"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function DataGraphics({ history = [], supabase }) {
  const [activeSection, setActiveSection] = useState("match");

  const sections = [
    { id: "insights", label: "📊 Deep Insights" },
    { id: "pitch",    label: "⚽ Pitch View" },
    { id: "match",    label: "📈 Match Stats" },
    { id: "player",   label: "⭐ Player Ratings" },
    { id: "top",      label: "🥇 Leaderboard" },
    { id: "team",     label: "🛡 Team Stats" },
    { id: "recap",    label: "📋 Recap" },
    { id: "bracket",  label: "🏆 Bracket" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ background: activeSection === s.id ? "#a855f722" : "none", border: `1px solid ${activeSection === s.id ? "#a855f7" : "#2a2a3a"}`, borderRadius: 20, color: activeSection === s.id ? "#a855f7" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "insights" && <DeepInsightsGraphic />}
      {activeSection === "pitch"    && <MatchPitchViewGraphic />}
      {activeSection === "match"    && <MatchStatsGraphic />}
      {activeSection === "player"   && <PlayerRatingsGraphic />}
      {activeSection === "top"      && <TopScorersGraphic />}
      {activeSection === "team"     && <TeamStatsGraphic />}
      {activeSection === "recap"    && <RecapGraphic history={history} />}
      {activeSection === "bracket"  && <BracketGraphic history={history} />}
    </div>
  );
}

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
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
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
        {children}
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
  const typeValues = { scorers: (p) => `${p.goals} goals`, assists: (p) => `${p.assists} assists`, cards: (p) => `${(p.yellowCards || 0)}🟨 ${p.redCards || 0}🟥` };

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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 8 }}>
                {LEAGUE_LOGOS[leagueId] && <img src={LEAGUE_LOGOS[leagueId]} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#f0f0f0" }}>{typeLabels[type]}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 12 }} />
              {data.players.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f0f1a" }}>
                  <div style={{ width: 22, textAlign: "center", fontSize: 13, color: i < 3 ? "#f59e0b" : "#555", fontWeight: 900 }}>{i + 1}</div>
                  {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      {p.teamLogo && <img src={p.teamLogo} alt="" crossOrigin="anonymous" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                      <span style={{ fontSize: 10, color: "#555" }}>{p.team}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80", minWidth: 50, textAlign: "right" }}>{typeValues[type](p)}</div>
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

  const handleSelect = (f) => {
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
    setMatchData({
      finalScore: fs,
      yourPrediction: pred?.user_prediction || null,
      aiPrediction: pred?.ai_prediction || null,
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
    if (!pred || !finalScore) return null;
    const [p0, p1] = pred.split("-").map(n => parseInt(n) || 0);
    const correct = (fs0 > fs1 && p0 > p1) || (fs1 > fs0 && p1 > p0) || (fs0 === fs1 && p0 === p1);
    return correct ? "✅" : "❌";
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

      {isLandscape ? (
        <>
          {/* Left: final score hero */}
          <div style={{ width: "45%", padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #1a1a2a" }}>
            <div style={{ fontSize: 11, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontWeight: 900 }}>{selectedFixture?.round || "Match Recap"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Full Time</div>
                <div style={{ fontSize: 64, fontWeight: 900, color: "#f0f0f0", lineHeight: 1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 12, fontWeight: 700, color: "#888" }}>
              <span style={{ color: "#4ade80" }}>{selectedFixture?.home}</span>
              <span style={{ color: "#f59e0b" }}>{selectedFixture?.away}</span>
            </div>
          </div>
          {/* Right: predictions */}
          <div style={{ flex: 1, padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Predictions</div>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#f59e0b" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: p.color, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: p.color }}>{p.pred || "—"}</div>
                </div>
                {p.result && <div style={{ fontSize: 20, fontWeight: 900 }}>{p.result}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 14, paddingTop: 36 }}>
          {/* Final score — dominant hero */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 900 }}>{selectedFixture?.round || "Match Recap"}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
              <div>
                <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Full Time</div>
                <div style={{ fontSize: 68, fontWeight: 900, color: "#f0f0f0", lineHeight: 1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#4ade80" }}>{selectedFixture?.home}</span>
              <span style={{ color: "#f59e0b" }}>{selectedFixture?.away}</span>
            </div>
          </div>
          <div style={{ height: 1, background: "#1a1a2a" }} />
          {/* Predictions side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#818cf8" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: p.color, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: p.color, marginBottom: 4 }}>{p.pred || "—"}</div>
                {p.result && <div style={{ fontSize: 18, fontWeight: 900 }}>{p.result}</div>}
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

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function DataGraphics({ history = [], supabase }) {
  const [activeSection, setActiveSection] = useState("match");

  const sections = [
    { id: "match",  label: "📊 Match Stats" },
    { id: "player", label: "⭐ Player Ratings" },
    { id: "top",    label: "🥇 Leaderboard" },
    { id: "team",   label: "🛡 Team Stats" },
    { id: "recap",  label: "📋 Recap" },
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

      {activeSection === "match"  && <MatchStatsGraphic />}
      {activeSection === "player" && <PlayerRatingsGraphic />}
      {activeSection === "top"    && <TopScorersGraphic />}
      {activeSection === "team"   && <TeamStatsGraphic />}
      {activeSection === "recap"  && <RecapGraphic history={history} />}
    </div>
  );
}

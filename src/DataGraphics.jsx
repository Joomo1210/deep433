import { useState, useRef, useEffect } from "react";
import DeepInsightsPanel from "./DeepInsightsPanel";

const LEAGUE_OPTIONS = [
  { id: "wc2026", label: "FIFA World Cup 2026" },
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
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        placeholder="🔍 Search team..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 14px", outline: "none", fontFamily: "inherit" }}
      />

      {loading && <div style={{ fontSize: 15, color: "#555", textAlign: "center" }}>Loading fixtures...</div>}

      {/* Fixture list */}
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(byDate).map(([date, dateFixtures]) => (
          <div key={date}>
            <div style={{ fontSize: 13, color: date === "Today" ? "#4ade80" : date === "Yesterday" ? "#888" : date === "Tomorrow" ? "#f59e0b" : "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "6px 0 4px" }}>{date}</div>
            {dateFixtures.map((f, i) => (
              <div
                key={i}
                onClick={() => onSelect(f)}
                style={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {f.homeLogo && <img src={f.homeLogo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{f.home}</span>
                </div>
                <div style={{ textAlign: "center", fontSize: 14 }}>
                  {f.status === "finished"
                    ? <span style={{ color: "#888", fontWeight: 800 }}>{f.score.home}-{f.score.away}</span>
                    : f.status === "live"
                    ? <span style={{ color: "#ef4444", fontWeight: 700 }}>🔴 LIVE</span>
                    : <span style={{ color: "#555" }}>{new Date(f.kickoff).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST</span>
                  }
                  <div style={{ fontSize: 12, color: "#333", marginTop: 2 }}>{f.round}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{f.away}</span>
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
        <span style={{ fontSize: 17, fontWeight: 800, color: "#4ade80", minWidth: 36 }}>{home ?? "0"}</span>
        <span style={{ fontSize: 13, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{icon && icon + " "}{label}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#f59e0b", minWidth: 36, textAlign: "right" }}>{away ?? "0"}</span>
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
          maxWidth: 460,
          margin: "0 auto",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
        <div style={{ position: "absolute", top: 12, right: 14, zIndex: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
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
      <div style={{ fontSize: 13, color: "#555", textAlign: "center", marginTop: 8 }}>{label}</div>
    </div>
  );
}

// ─── MATCH STATS GRAPHIC ────────────────────────────────────────────────────
// ─── Animated count-up hook ──────────────────────────────────────────────────
function useCountUp(target, duration = 900, trigger = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) { setValue(target); return; }
    let raf;
    const start = performance.now();
    const from = 0;
    const to = parseFloat(target) || 0;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(from + (to - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return value;
}

// ─── Animated comparison bar (home vs away) ──────────────────────────────────
function AnimatedStatBar({ label, homeVal, awayVal, unit = "", animate }) {
  const hv = parseFloat(homeVal) || 0;
  const av = parseFloat(awayVal) || 0;
  const total = hv + av || 1;
  const homePct = (hv / total) * 100;
  const awayPct = 100 - homePct;
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setExpanded(true), 60); return () => clearTimeout(t); }, []);
  const displayHv = useCountUp(hv, 900, animate);
  const displayAv = useCountUp(av, 900, animate);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{displayHv.toFixed(unit === "%" ? 0 : (Number.isInteger(hv) ? 0 : 1))}{unit}</span>
        <span style={{ fontSize: 12, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{displayAv.toFixed(unit === "%" ? 0 : (Number.isInteger(av) ? 0 : 1))}{unit}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "#1a1a24" }}>
        <div style={{ width: expanded ? `${homePct}%` : "0%", background: "#4ade80", transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
        <div style={{ width: expanded ? `${awayPct}%` : "0%", background: "#f59e0b", opacity: 0.6, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s" }} />
      </div>
    </div>
  );
}

// ─── Bento box wrapper ────────────────────────────────────────────────────────
function BentoBox({ title, icon, color, children, span }) {
  return (
    <div style={{
      background: "#13131f",
      border: `1px solid ${color}22`,
      borderRadius: 10,
      padding: "12px 14px",
      gridColumn: span ? "span " + span : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 14, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function MatchStatsGraphic() {
  const cardRef = useRef(null);
  const [fixtureId, setFixtureId] = useState("");
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(true);

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
      setAnimate(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    // Ensure bars/numbers are in their settled state before capturing
    setAnimate(false);
    await new Promise(res => setTimeout(res, 120));
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={() => fetch_()} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading stats..." : "Load Match Stats"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {s && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              {/* Team header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {s.home.logo && <img src={s.home.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{s.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Match Stats</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.away.logo && <img src={s.away.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>{s.away.team}</div>
                </div>
              </div>

              {/* HERO: Possession — large signature card */}
              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "16px 18px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, textAlign: "center" }}>⚽ Possession</div>
                <PossessionHero home={s.home.stats.possession} awayVal={s.away.stats.possession} animate={animate} />
              </div>

              {/* Bento grid — 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <BentoBox title="Attack" icon="🎯" color="#4ade80">
                  <AnimatedStatBar label="Total Shots" homeVal={s.home.stats.shotsTotal} awayVal={s.away.stats.shotsTotal} animate={animate} />
                  <AnimatedStatBar label="On Target" homeVal={s.home.stats.shotsOnGoal} awayVal={s.away.stats.shotsOnGoal} animate={animate} />
                  <AnimatedStatBar label="Corners" homeVal={s.home.stats.corners} awayVal={s.away.stats.corners} animate={animate} />
                </BentoBox>

                <BentoBox title="Discipline" icon="🟨" color="#f59e0b">
                  <AnimatedStatBar label="Fouls" homeVal={s.home.stats.fouls} awayVal={s.away.stats.fouls} animate={animate} />
                  <AnimatedStatBar label="Yellow Cards" homeVal={s.home.stats.yellowCards} awayVal={s.away.stats.yellowCards} animate={animate} />
                  <AnimatedStatBar label="Offsides" homeVal={s.home.stats.offsides} awayVal={s.away.stats.offsides} animate={animate} />
                </BentoBox>
              </div>

              <BentoBox title="Efficiency" icon="🧤" color="#818cf8">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <AnimatedStatBar label="Pass Accuracy" homeVal={s.home.stats.passAccuracy} awayVal={s.away.stats.passAccuracy} unit="%" animate={animate} />
                  <AnimatedStatBar label="Saves" homeVal={s.home.stats.saves} awayVal={s.away.stats.saves} animate={animate} />
                </div>
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Possession hero — large animated numbers + bar ──────────────────────────
function PossessionHero({ home, awayVal, animate }) {
  const hv = parseFloat(home) || 50;
  const av = parseFloat(awayVal) || (100 - hv);
  const total = hv + av || 1;
  const homePct = (hv / total) * 100;
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setExpanded(true), 60); return () => clearTimeout(t); }, []);
  const displayHv = useCountUp(homePct, 1000, animate);
  const displayAv = useCountUp(100 - homePct, 1000, animate);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", lineHeight: 1 }}>{Math.round(displayHv)}%</span>
        <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>{Math.round(displayAv)}%</span>
      </div>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#1a1a24" }}>
        <div style={{ width: expanded ? `${homePct}%` : "0%", background: "linear-gradient(90deg,#22c55e,#4ade80)", transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
        <div style={{ width: expanded ? `${100 - homePct}%` : "0%", background: "linear-gradient(90deg,#f59e0b,#fbbf24)", opacity: 0.7, transition: "width 1s cubic-bezier(0.16,1,0.3,1) 0.05s" }} />
      </div>
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
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading ratings..." : "Load Player Ratings"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            {["home", "away"].map(t => (
              <button key={t} onClick={() => setSelectedTeam(t)} style={{ flex: 1, background: selectedTeam === t ? "#4ade80" : "none", border: `1px solid ${selectedTeam === t ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: selectedTeam === t ? "#0a0f0a" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px" }}>
                {data[t]?.team}
              </button>
            ))}
          </div>

          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 8 }}>
                {teamData?.logo && <img src={teamData.logo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f0f0f0" }}>{teamData?.team}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>Player Ratings</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 12 }} />
              {players.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f0f1a" }}>
                  <div style={{ width: 24, textAlign: "center", fontSize: 14, color: "#555", fontWeight: 700 }}>{i + 1}</div>
                  {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>
                      {p.position} · {p.minutesPlayed}'
                      {p.goals ? ` · ⚽ ${p.goals}` : ""}
                      {p.assists ? ` · 🎯 ${p.assists}` : ""}
                      {p.yellowCards ? " · 🟨" : ""}
                      {p.redCards ? " · 🟥" : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: ratingColor(p.rating), minWidth: 40, textAlign: "right" }}>
                    {p.rating ? parseFloat(p.rating).toFixed(1) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
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
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["scorers", "assists", "cards"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, background: type === t ? "#a855f7" : "none", border: `1px solid ${type === t ? "#a855f7" : "#2a2a3a"}`, borderRadius: 8, color: type === t ? "#fff" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px" }}>
            {typeIcons[t]} {typeLabels[t]}
          </button>
        ))}
      </div>
      <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
        {loading ? "Loading..." : "Load Leaderboard"}
      </button>
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 8 }}>
                {LEAGUE_LOGOS[leagueId] && <img src={LEAGUE_LOGOS[leagueId]} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f0f0f0" }}>{typeLabels[type]}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
                <div style={{ fontSize: 12, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{statLabel[type]}</div>
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
                        <span style={{ fontSize: 13, color: "#555" }}>{p.team}</span>
                        {secondary && <span style={{ fontSize: 12, color: "#444", marginLeft: 4 }}>· {secondary}</span>}
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
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
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
      const r = await fetch(`/api/team-stats?mode=teamsearch&query=${encodeURIComponent(query)}`);
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
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: r === "W" ? "#4ade80" : r === "D" ? "#a78bfa" : "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(1).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setData(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
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
          style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${selectedTeam ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 17, padding: "10px 14px", outline: "none", fontFamily: "inherit" }}
        />
        {searching && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#555" }}>Searching...</div>}
        {teamSuggestions.length > 0 && !selectedTeam && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 10, marginTop: 4, maxHeight: 200, overflowY: "auto" }}>
            {teamSuggestions.map(t => (
              <div key={t.id} onClick={() => { setSelectedTeam(t); setTeamSearch(t.name); setTeamSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
                {t.logo && <img src={t.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{t.name}</div>
                  <div style={{ fontSize: 14, color: "#555" }}>{t.country}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeam && (
        <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
          {loading ? "Loading..." : `Load ${selectedTeam.name} Stats`}
        </button>
      )}

      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, marginTop: 8 }}>
                {data.logo && <img src={data.logo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0" }}>{data.team}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label} · Season Stats</div>
                </div>
              </div>

              {data.form && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Form</div>
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
                    <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value ?? "—"}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {(data.biggestWin || data.biggestLoss) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {data.biggestWin && <div style={{ background: "#4ade8011", border: "1px solid #4ade8022", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#4ade80", marginBottom: 4 }}>Biggest Win</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#4ade80" }}>{data.biggestWin}</div>
                  </div>}
                  {data.biggestLoss && <div style={{ background: "#f8717111", border: "1px solid #f8717122", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#f87171", marginBottom: 4 }}>Biggest Loss</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#f87171" }}>{data.biggestLoss}</div>
                  </div>}
                </div>
              )}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
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
    let keyStat = null;

    if (f.fixtureId) {
      try {
        // Fetch match stats and events in parallel
        const [statsRes, eventsRes] = await Promise.all([
          fetch(`/api/match-stats?fixtureId=${f.fixtureId}`),
          fetch(`/api/match-events?fixtureId=${f.fixtureId}`),
        ]);
        const statsData = await statsRes.json();
        const eventsData = await eventsRes.json();

        // Extract goals (excluding missed penalties) and cards
        (eventsData.events || [])
          .filter(e => {
            if (e.type === "Goal" && e.detail === "Missed Penalty") return false;
            return e.type === "Goal" || e.type === "Card";
          })
          .forEach(e => {
            // Scorer is before the bracket e.g. "Kane (Bellingham)" -> "Kane"
            const scorerFull = e.label?.split("(")[0]?.trim() || "";
            const surname = scorerFull.split(" ").slice(-1)[0]?.trim();
            const time = `${e.minute}'`;
            const entry = `${e.icon} ${surname} ${time}`;
            if (norm(e.team) === norm(f.home)) homeGoals.push(entry);
            else awayGoals.push(entry);
          });

        // Generate key stat from match stats
        if (statsData.available) {
          const home = statsData.home;
          const away = statsData.away;
          const homePoss = parseFloat(home.stats?.possession) || 0;
          const awayPoss = parseFloat(away.stats?.possession) || 0;
          const homeShotsOn = home.stats?.shotsOnGoal || 0;
          const awayShotsOn = away.stats?.shotsOnGoal || 0;
          const homeSaves = home.stats?.saves || 0;
          const awaySaves = away.stats?.saves || 0;

          // Pick the most interesting stat
          if (homePoss >= 65) keyStat = `${home.team} had ${homePoss}% of the ball`;
          else if (awayPoss >= 65) keyStat = `${away.team} had ${awayPoss}% of the ball`;
          else if (awaySaves >= 5) keyStat = `${away.team} keeper made ${awaySaves} saves`;
          else if (homeSaves >= 5) keyStat = `${home.team} keeper made ${homeSaves} saves`;
          else if (homeShotsOn + awayShotsOn <= 4) keyStat = `Only ${homeShotsOn + awayShotsOn} shots on target — a tight affair`;
          else if (homeShotsOn >= 8) keyStat = `${home.team} fired ${homeShotsOn} shots on target`;
          else if (awayShotsOn >= 8) keyStat = `${away.team} fired ${awayShotsOn} shots on target`;
          else keyStat = `${home.team} ${homePoss}% · ${away.team} ${awayPoss}% possession`;
        }
      } catch {}
    }

    setMatchData({
      finalScore: fs,
      yourPrediction: pred?.user_prediction || null,
      aiPrediction: pred?.ai_prediction || null,
      homeGoals,
      awayGoals,
      keyStat,
      competition: "FIFA World Cup 2026",
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
        <span style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
        
      </div>
      {/* Logo watermark — corner */}
      <div style={{ position: "absolute", bottom: 10, left: 10, pointerEvents: "none", zIndex: 0 }}>
        <img src="/deep433.jpg" alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, opacity: 0.35, objectFit: "contain", borderRadius: "50%", userSelect: "none" }} />
      </div>

      {isLandscape ? (
        <>
          {/* Left: final score hero */}
          <div style={{ width: "50%", padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #1a1a2a", position: "relative", zIndex: 1 }}>
            {/* Enhanced header */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: "#999", letterSpacing: 2, textTransform: "uppercase" }}>{matchData?.competition}</div>
              <div style={{ fontSize: 16, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", fontWeight: 900 }}>{selectedFixture?.round}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Full Time</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1, letterSpacing: -1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
            </div>
            {/* Team names + goalscorers */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8 }}>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#aaa", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#aaa", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
            </div>
          </div>
          {/* Right: predictions */}
          <div style={{ flex: 1, padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 15, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Predictions</div>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#f59e0b" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, color: p.color, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: p.color }}>{p.pred || "—"}</div>
                </div>
                {p.result && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22 }}>{p.result.icon}</div>
                    <div style={{ fontSize: 14, color: p.result.color, fontWeight: 700, marginTop: 2 }}>{p.result.label}</div>
                  </div>
                )}
              </div>
            ))}
            <div style={{ background: "#0d0d18", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
              {matchData?.keyStat && (
                <div style={{ marginBottom: selectedFixture?.venue ? 4 : 0 }}>
                  <span style={{ fontSize: 16, color: "#818cf8", fontWeight: 700 }}>📊 </span>
                  <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>{matchData.keyStat}</span>
                </div>
              )}
              {selectedFixture?.venue && (
                <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>📍 {selectedFixture.venue}{selectedFixture.city ? ", " + selectedFixture.city : ""}</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 12, paddingTop: 32, position: "relative", zIndex: 1 }}>
          {/* Enhanced header + final score */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#999", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>{matchData?.competition}</div>
            <div style={{ fontSize: 15, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 900 }}>{selectedFixture?.round}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
              <div>
                <div style={{ fontSize: 14, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Full Time</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1, letterSpacing: -1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
            </div>
            {/* Team names + goalscorers */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#aaa", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#aaa", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "#1a1a2a" }} />
          {/* Predictions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "👤 Your Call", pred: yourPrediction, result: yourResult, color: "#4ade80" }, { label: "🤖 AI Predicted", pred: aiPrediction, result: aiResult, color: "#818cf8" }].map(p => (
              <div key={p.label} style={{ background: "#13131f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: p.color, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: p.color, marginBottom: 4, letterSpacing: -0.5 }}>{p.pred || "—"}</div>
                {p.result && (
                  <>
                    <div style={{ fontSize: 20 }}>{p.result.icon}</div>
                    <div style={{ fontSize: 14, color: p.result.color, fontWeight: 700, marginTop: 2 }}>{p.result.label}</div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Key stat + venue banner */}
          <div style={{ background: "#0d0d18", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
            {matchData?.keyStat && (
              <div style={{ marginBottom: selectedFixture?.venue ? 4 : 0 }}>
                <span style={{ fontSize: 16, color: "#818cf8", fontWeight: 700 }}>📊 </span>
                <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>{matchData.keyStat}</span>
              </div>
            )}
            {selectedFixture?.venue && (
              <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600 }}>📍 {selectedFixture.venue}{selectedFixture.city ? ", " + selectedFixture.city : ""}</div>
            )}
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
            <span style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setMatchData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#999", cursor: "pointer", fontFamily: "inherit", fontSize: 16, padding: "4px 10px" }}>Change</button>
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 18 }}>{error}</div>}

          {matchData && !matchData.yourPrediction && (
            <div style={{ fontSize: 17, color: "#f59e0b", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 8, padding: "10px 14px" }}>
              ⚠️ No prediction found for this match in your history. Make a prediction first to use the Recap card.
            </div>
          )}

          {matchData && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                {["square", "landscape"].map(v => (
                  <button key={v} onClick={() => setVariant(v)} style={{ flex: 1, background: variant === v ? "#4ade8022" : "none", border: `1px solid ${variant === v ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: variant === v ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 700, padding: "8px" }}>
                    {v === "square" ? "1:1 Square" : "16:9 Landscape"}
                  </button>
                ))}
              </div>

              <div ref={cardRef}>
                <CardContent />
              </div>

              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 19, fontWeight: 800, padding: "12px", width: "100%" }}>
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
    { id: "wc2026", label: "FIFA World Cup 2026" },
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

  const TrophyIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      {/* Globe/top of trophy */}
      <circle cx="50" cy="22" r="11" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx="50" cy="19" r="4" fill="#FFF3B0" opacity="0.7" />
      {/* Spiral bands rising from base to globe — FIFA trophy's signature look */}
      <path d="M38 78 C 30 68, 30 58, 40 50 C 50 42, 50 34, 44 28"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      <path d="M62 78 C 70 68, 70 58, 60 50 C 50 42, 50 34, 56 28"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 80 C 50 68, 50 58, 50 50 C 50 42, 50 36, 50 30"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      {/* Outline strokes for depth */}
      <path d="M38 78 C 30 68, 30 58, 40 50 C 50 42, 50 34, 44 28"
            fill="none" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M62 78 C 70 68, 70 58, 60 50 C 50 42, 50 34, 56 28"
            fill="none" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" />
      {/* Base cone widening down */}
      <path d="M35 80 L65 80 L58 96 L42 96 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      {/* Pedestal */}
      <rect x="38" y="96" width="24" height="6" fill="#2a2a3a" />
      <rect x="32" y="102" width="36" height="8" rx="2" fill="#1a1a2a" stroke="#333" strokeWidth="1" />
      {/* Shine accents */}
      <path d="M46 32 C 44 40, 44 48, 48 54" fill="none" stroke="#FFF3B0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );

  const Node = ({ val, w = 155 }) => {
    const m = getMatch(val);
    const pred = getUserPred(m);
    const isF = m?.status === "finished";
    const isL = m?.status === "live";
    const hw = isF && m.score.home > m.score.away;
    const aw = isF && m.score.away > m.score.home;

    if (!m) return (
      <div style={{ width: w, background: "#161622", border: "1px dashed #2a2a3a", borderRadius: 8, padding: "14px 8px", textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Select match</span>
      </div>
    );

    return (
      <div style={{ width: w, background: "#181826", border: `2px solid ${pred ? "#4ade80" : isL ? "#ef4444" : "#333"}`, borderRadius: 8, overflow: "hidden", boxShadow: pred ? "0 0 10px rgba(74,222,128,0.35)" : "none", flexShrink: 0 }}>
        {isL && <div style={{ height: 2, background: "#ef4444" }} />}
        {[{ name: m.home, logo: m.homeLogo, score: m.score?.home, won: hw }, { name: m.away, logo: m.awayLogo, score: m.score?.away, won: aw }].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", background: t.won ? "#4ade8020" : "transparent", borderBottom: i === 0 ? "1px solid #26263a" : "none" }}>
            {t.logo ? <img src={t.logo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} /> : <div style={{ width: 18, height: 18, background: "#26263a", borderRadius: "50%", flexShrink: 0 }} />}
            <span style={{ fontSize: 14, fontWeight: t.won ? 900 : 700, color: t.won ? "#4ade80" : "#f5f5f5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name || "TBD"}</span>
            {(isF || isL) && <span style={{ fontSize: 16, fontWeight: 900, color: t.won ? "#4ade80" : "#ccc" }}>{t.score ?? 0}</span>}
          </div>
        ))}
        <div style={{ padding: "3px 8px", background: "#0d0d18", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: isL ? "#ff6b6b" : "#999", fontWeight: 700 }}>
            {isL ? "🔴 LIVE" : isF ? m.statusRaw : new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          {pred && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ {pred.user_prediction}</span>}
        </div>
      </div>
    );
  };

  const Arr = () => (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", flexShrink: 0 }}>
      <div style={{ width: 10, height: 2, background: "#4a4a5a" }} />
      <span style={{ fontSize: 16, color: "#888", fontWeight: 900 }}>›</span>
    </div>
  );

  const DropDown = ({ label, skey }) => (
    <div>
      <div style={{ fontSize: 12, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <select value={sel[skey]} onChange={e => setS(skey)(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 6, color: "#f0f0f0", fontSize: 15, padding: "7px 10px", outline: "none", fontFamily: "inherit" }}>
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
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 16, padding: "20px 0" }}>Loading...</div>}

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
              <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
              
            </div>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, color: "#f0f0f0", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
                {CUP_LEAGUES.find(l => l.id === leagueId)?.label}
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", maxWidth: 460, margin: "0 auto", padding: "10px 0" }}>
              {/* Grid: 3 columns x 2 rows, Final spans center */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 170px 1fr", gridTemplateRows: "auto auto", gap: "16px 12px", alignItems: "center" }}>

                {/* Top-left: QF1 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quarter-Final</div>
                  <Node val={sel.qf1} w={140} />
                </div>

                {/* Top-center: SF1 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Semi-Final</div>
                  <Node val={sel.sf1} w={150} />
                </div>

                {/* Top-right: QF3 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quarter-Final</div>
                  <Node val={sel.qf3} w={140} />
                </div>

                {/* Bottom-left: QF2 */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Node val={sel.qf2} w={140} />
                </div>

                {/* Bottom-center: SF2 */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Node val={sel.sf2} w={150} />
                </div>

                {/* Bottom-right: QF4 */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <Node val={sel.qf4} w={140} />
                </div>
              </div>

              {/* Final — dead centre, overlaid */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 }}>
                  <TrophyIcon size={18} />
                  <span style={{ fontSize: 15, color: "#fbbf24", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5 }}>Final</span>
                </div>
                <Node val={sel.fin} w={180} />
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "#999", fontWeight: 600 }}>🟢 Green border = your prediction</span>
            </div>
          </div>

          <button onClick={download} disabled={downloading || !hasAny} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%", opacity: !hasAny ? 0.4 : 1 }}>
            {downloading ? "Generating..." : "⬇ Download Bracket Card"}
          </button>
        </>
      )}
    </div>
  );
}



// ─── DEEP INSIGHTS GRAPHIC ───────────────────────────────────────────────────
function DeepInsightsGraphic({ history = [] }) {
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
          <span style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>{a}%</span>
          <span style={{ fontSize: 13, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b" }}>{b}%</span>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${a}%`, background: "#4ade80" }} />
          <div style={{ width: `${b}%`, background: "#f59e0b", opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 13, color: "#aaa" }}>
          <span style={{ color: "#4ade80", fontWeight: 600 }}>{home?.split(" ")[0]}</span><span style={{ color: "#f59e0b", fontWeight: 600 }}>{away?.split(" ")[0]}</span>
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
          <span style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0" }}>{team}</span>
        </div>
        <span style={{ fontSize: 13, color: "#555" }}>PPG: <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{ppg}</span></span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {results.map((r, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: dotColor(r), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#4ade80" }}>W {results.filter(r => r === "W").length}</span>
          <span style={{ fontSize: 13, color: "#60a5fa" }}>D {results.filter(r => r === "D").length}</span>
          <span style={{ fontSize: 13, color: "#f87171" }}>L {results.filter(r => r === "L").length}</span>
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
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setInsights(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 16, padding: "20px 0" }}>Loading insights...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

          {insights && (
            <>
              <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
                <div style={{ padding: "22px 18px 18px" }}>
                  {/* Competition label */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                    <img src="/fifa.png" alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />
                    <span style={{ fontSize: 12, color: "#ccc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>FIFA World Cup 2026</span>
                  </div>
                  {/* Match header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{home}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{selectedFixture.round}</div>
                      <div style={{ fontSize: 14, color: "#555", fontWeight: 700 }}>vs</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{away}</span>
                      {selectedFixture.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                    </div>
                  </div>

                  {(() => {
                    const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                    const pred = selectedFixture.status !== "finished"
                      ? history.find(h =>
                          (norm(h.home_team) === norm(home) && norm(h.away_team) === norm(away)) ||
                          (norm(h.home_team) === norm(away) && norm(h.away_team) === norm(home))
                        )
                      : null;
                    return (
                      <DeepInsightsPanel
                        insights={insights}
                        homeTeam={home}
                        awayTeam={away}
                        aiPrediction={pred?.ai_prediction}
                        userPrediction={pred?.user_prediction}
                        leagueId="wc2026"
                      />
                    );
                  })()}
                </div>
              </GraphicCard>
              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
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
            <span style={{ fontSize: 16, fontWeight: 900, color }}>{player.number}</span>
          </div>
        )}
        {player.photo && (
          <div style={{ position: "absolute", bottom: -2, right: -2, background: color, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: "#0a0a0f" }}>{player.number}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#f0f0f0", textAlign: "center", lineHeight: 1.2, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setLineup(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 16, padding: "20px 0" }}>Loading lineup...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

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
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#4ade80", letterSpacing: 1 }}>DEEP433</span>
                  </div>

                  {/* Watermark — corner */}
                  <div style={{ position: "absolute", bottom: 10, left: 10, pointerEvents: "none" }}>
                    <img src="/deep433.jpg" alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, opacity: 0.35, objectFit: "contain", borderRadius: "50%", userSelect: "none" }} />
                  </div>

                  {/* Home team header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
                    {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{selectedFixture.home}</span>
                    <span style={{ fontSize: 12, color: "#555" }}>{lineup.home?.formation}</span>
                  </div>

                  {/* Home team players */}
                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.home?.players} color="#4ade80" reverse={false} />
                  </div>

                  {/* Centre line label */}
                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 11, color: "#1a6b3a", fontWeight: 700, letterSpacing: 2 }}>· · · · · · · · · · · · · ·</span>
                  </div>

                  {/* Away team players */}
                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.away?.players} color="#f59e0b" reverse={true} />
                  </div>

                  {/* Away team header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: 4 }}>
                    {selectedFixture.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{selectedFixture.away}</span>
                    <span style={{ fontSize: 12, color: "#555" }}>{lineup.away?.formation}</span>
                  </div>
                </div>
              </div>

              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
                {downloading ? "Generating..." : "⬇ Download Pitch View PNG"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── PLAYER HEAD-TO-HEAD GRAPHIC ─────────────────────────────────────────────
  function PlayerSearchBox({ label, search, setSearch, suggestions, setSuggestions, player, setPlayer, searching, slot, color, onSearch }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 13, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <input
        placeholder="Search player..."
        value={player ? player.name : search}
        onChange={e => {
          setSearch(e.target.value);
          setPlayer(null);
          onSearch(e.target.value, slot);
        }}
        style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${player ? color : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 12px", outline: "none", fontFamily: "inherit" }}
      />
      {searching && <div style={{ position: "absolute", right: 10, top: 38, fontSize: 13, color: "#555" }}>...</div>}
      {suggestions.length > 0 && !player && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 20, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map(p => (
            <div key={p.id} onClick={() => { setPlayer(p); setSearch(p.name); setSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
              {p.photo && <img src={p.photo} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#555" }}>{p.team}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerH2HGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [suggestions1, setSuggestions1] = useState([]);
  const [suggestions2, setSuggestions2] = useState([]);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [searching1, setSearching1] = useState(false);
  const [searching2, setSearching2] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statsMode, setStatsMode] = useState("competition"); // competition | season
  const [seasonLoading, setSeasonLoading] = useState(false);

  const searchPlayer = async (query, slot) => {
    if (query.length < 3) {
      slot === 1 ? setSuggestions1([]) : setSuggestions2([]);
      return;
    }
    slot === 1 ? setSearching1(true) : setSearching2(true);
    try {
      const r = await fetch(`/api/team-stats?mode=playersearch&query=${encodeURIComponent(query)}&leagueId=${leagueId}`);
      const d = await r.json();
      slot === 1 ? setSuggestions1(d.players || []) : setSuggestions2(d.players || []);
    } catch {}
    slot === 1 ? setSearching1(false) : setSearching2(false);
  };

  // Fetch season-aggregated stats when toggled to Season mode
  const fetchSeasonStats = async (player, setPlayer) => {
    if (!player?.id) return;
    setSeasonLoading(true);
    try {
      const season = leagueId === "wc2026" ? 2026 : 2025;
      const r = await fetch(`/api/team-stats?mode=playerseason&playerId=${player.id}&season=${season}`);
      const d = await r.json();
      if (d.available) setPlayer(prev => ({ ...prev, ...d, _seasonData: d }));
    } catch {}
    setSeasonLoading(false);
  };

  const toggleStatsMode = async (newMode) => {
    setStatsMode(newMode);
    if (newMode === "season") {
      if (player1 && !player1._seasonData) await fetchSeasonStats(player1, setPlayer1);
      if (player2 && !player2._seasonData) await fetchSeasonStats(player2, setPlayer2);
    }
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
      link.download = `deep433-h2h-${player1?.name}-vs-${player2?.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const CompareRow = ({ label, val1, val2, higherIsBetter = true }) => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #0f0f1a" }}>
        <span style={{ flex: 1, textAlign: "right", fontSize: 20, fontWeight: p1Better ? 900 : 700, color: "#4ade80", opacity: p1Better ? 1 : 0.65, paddingRight: 12 }}>{val1 ?? "—"}</span>
        <span style={{ fontSize: 13, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, width: 90, textAlign: "center" }}>{label}</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 20, fontWeight: p2Better ? 900 : 700, color: "#f59e0b", opacity: p2Better ? 1 : 0.65, paddingLeft: 12 }}>{val2 ?? "—"}</span>
      </div>
    );
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setPlayer1(null); setPlayer2(null); setSearch1(""); setSearch2(""); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PlayerSearchBox label="Player 1" search={search1} setSearch={setSearch1} suggestions={suggestions1} setSuggestions={setSuggestions1} player={player1} setPlayer={setPlayer1} searching={searching1} slot={1} color="#4ade80" onSearch={searchPlayer} />
        <PlayerSearchBox label="Player 2" search={search2} setSearch={setSearch2} suggestions={suggestions2} setSuggestions={setSuggestions2} player={player2} setPlayer={setPlayer2} searching={searching2} slot={2} color="#f59e0b" onSearch={searchPlayer} />
      </div>

      {player1 && player2 && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            {["competition", "season"].map(m => (
              <button key={m} onClick={() => toggleStatsMode(m)} disabled={seasonLoading} style={{ flex: 1, background: statsMode === m ? "#4ade8022" : "none", border: `1px solid ${statsMode === m ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: statsMode === m ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px", textTransform: "capitalize" }}>
                {seasonLoading && m === "season" ? "Loading..." : m === "competition" ? "🏆 This Competition" : "📅 Full Season"}
              </button>
            ))}
          </div>

          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {statsMode === "season" ? "📅 Full Season Comparison" : `🏆 ${LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label} Stats`}
                </span>
              </div>
              {/* Player headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {player1.photo && <img src={player1.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{player1.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{player1.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#333" }}>VS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {player2.photo && <img src={player2.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{player2.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{player2.team}</div>
                </div>
              </div>

              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 10 }} />

              {/* HERO: Rating comparison */}
              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>⭐ Rating</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#4ade80" }}>{player1.rating ? parseFloat(player1.rating).toFixed(1) : "—"}</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>{player2.rating ? parseFloat(player2.rating).toFixed(1) : "—"}</span>
                </div>
              </div>

              {/* Bento grid — 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <BentoBox title="Attack" icon="🎯" color="#4ade80">
                  <CompareRow label="Goals" val1={player1.goals} val2={player2.goals} />
                  <CompareRow label="Assists" val1={player1.assists} val2={player2.assists} />
                  <CompareRow label="Shots" val1={player1.shots} val2={player2.shots} />
                  <CompareRow label="On Target" val1={player1.shotsOnTarget} val2={player2.shotsOnTarget} />
                </BentoBox>

                <BentoBox title="Creativity" icon="🎨" color="#60a5fa">
                  <CompareRow label="Key Passes" val1={player1.keyPasses} val2={player2.keyPasses} />
                  <CompareRow label="Dribbles" val1={player1.dribbles} val2={player2.dribbles} />
                  <CompareRow label="Apps" val1={player1.appearances} val2={player2.appearances} />
                </BentoBox>
              </div>

              <BentoBox title="Workrate & Caution" icon="⚔️" color="#c084fc">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <CompareRow label="Tackles" val1={player1.tackles} val2={player2.tackles} />
                  <CompareRow label="Cards" val1={player1.yellowCards} val2={player2.yellowCards} higherIsBetter={false} />
                </div>
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── GOLDEN GLOVE RACE (CLEAN SHEETS) ────────────────────────────────────────
function GoldenGloveGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const KNOCKOUT_LEAGUES = ["wc2026", "ucl", "uel", "facup", "copadelrey", "afcon", "copamerica"];

  const fetchCleanSheets = async () => {
    setLoading(true); setError(""); setStandings(null);
    try {
      const r = await fetch(`/api/fixtures?leagueId=${leagueId}&full=true`);
      const d = await r.json();
      const fixtures = (d.fixtures || []).filter(f => f.status === "finished");

      if (!fixtures.length) throw new Error("No completed fixtures yet for this competition");

      // Aggregate clean sheets per team
      const teamMap = {};
      fixtures.forEach(f => {
        const homeGoals = f.score?.home ?? 0;
        const awayGoals = f.score?.away ?? 0;

        if (!teamMap[f.home]) teamMap[f.home] = { name: f.home, logo: f.homeLogo, cleanSheets: 0, played: 0, goalsConceded: 0 };
        if (!teamMap[f.away]) teamMap[f.away] = { name: f.away, logo: f.awayLogo, cleanSheets: 0, played: 0, goalsConceded: 0 };

        teamMap[f.home].played++;
        teamMap[f.away].played++;
        teamMap[f.home].goalsConceded += awayGoals;
        teamMap[f.away].goalsConceded += homeGoals;

        if (awayGoals === 0) teamMap[f.home].cleanSheets++;
        if (homeGoals === 0) teamMap[f.away].cleanSheets++;
      });

      // For knockout competitions, filter to only currently-active teams
      let activeNames = null;
      if (KNOCKOUT_LEAGUES.includes(leagueId)) {
        try {
          const br = await fetch(`/api/bracket?leagueId=${leagueId}`);
          const bd = await br.json();
          const names = new Set();
          (bd.rounds || []).forEach(round => {
            round.matches.forEach(m => {
              if (m.home) names.add(m.home);
              if (m.away) names.add(m.away);
            });
          });
          if (names.size > 0) activeNames = names;
        } catch {}
      }

      let teams = Object.values(teamMap);
      if (activeNames) teams = teams.filter(t => activeNames.has(t.name));

      const sorted = teams
        .sort((a, b) => b.cleanSheets - a.cleanSheets || a.goalsConceded - b.goalsConceded)
        .slice(0, 10);

      setStandings(sorted);
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
      link.download = `deep433-golden-glove-${leagueId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setStandings(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      <button onClick={fetchCleanSheets} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
        {loading ? "Loading..." : "Load Golden Glove Race"}
      </button>
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {standings && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 8 }}>
                {LEAGUE_LOGOS[leagueId] && <img src={LEAGUE_LOGOS[leagueId]} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f0f0f0" }}>Golden Glove Race</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
                <div style={{ fontSize: 12, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Clean Sheets</div>
              </div>

              {(() => {
                const maxCS = Math.max(...standings.map(t => t.cleanSheets), 1);
                return standings.map((team, i) => {
                  const barPct = (team.cleanSheets / maxCS) * 100;
                  return (
                    <div key={team.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        {team.logo && <img src={team.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} />}
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#FFD700" }}>{team.cleanSheets}</span>
                      </div>
                      <div style={{ height: 8, background: "#1a1a24", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          width: `${Math.max(barPct, 4)}%`, height: "100%",
                          background: "linear-gradient(90deg, #B8860B, #FFD700)",
                          borderRadius: 4,
                        }} />
                      </div>
                      <div style={{ fontSize: 13, color: "#999", marginTop: 3, fontWeight: 600 }}>{team.played} played · {team.goalsConceded} conceded</div>
                    </div>
                  );
                });
              })()}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
// ─── MATCH HEAD-TO-HEAD GRAPHIC ──────────────────────────────────────────────
function MatchH2HGraphic() {
  const cardRef = useRef(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [matchPlayers, setMatchPlayers] = useState(null);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (f) => {
    setSelectedFixture(f);
    setMatchPlayers(null);
    setPlayer1(null);
    setPlayer2(null);
    setError("");
    if (!f.fixtureId) { setError("No fixture ID available"); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/player-ratings?fixtureId=${f.fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("Player stats not available yet — check back after the match");
      setMatchPlayers(d);
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
      link.download = `deep433-matchh2h-${player1?.name}-vs-${player2?.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const MatchCompareRow = ({ label, val1, val2, higherIsBetter = true, unit = "" }) => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontSize: 20, fontWeight: p1Better ? 900 : 700, color: "#4ade80", opacity: p1Better ? 1 : 0.65 }}>{val1 != null ? val1 + unit : "—"}</span>
        <span style={{ fontSize: 13, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: p2Better ? 900 : 700, color: "#f59e0b", opacity: p2Better ? 1 : 0.65 }}>{val2 != null ? val2 + unit : "—"}</span>
      </div>
    );
  };

  const PlayerPicker = ({ team, selected, onSelect, color }) => (
    <div>
      <div style={{ fontSize: 13, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{team?.team}</div>
      <select
        value={selected?.name || ""}
        onChange={e => onSelect(team?.players?.find(p => p.name === e.target.value) || null)}
        style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${selected ? color : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 12px", outline: "none", fontFamily: "inherit" }}
      >
        <option value="">— Select player —</option>
        {team?.players?.map(p => <option key={p.name} value={p.name}>{p.name} ({p.rating ? parseFloat(p.rating).toFixed(1) : "—"})</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setMatchPlayers(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 16, padding: "20px 0" }}>Loading player stats...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

          {matchPlayers && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <PlayerPicker team={matchPlayers.home} selected={player1} onSelect={setPlayer1} color="#4ade80" />
              <PlayerPicker team={matchPlayers.away} selected={player2} onSelect={setPlayer2} color="#f59e0b" />
            </div>
          )}
        </>
      )}

      {player1 && player2 && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: "#f0f0f0", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>
                  🏆 FIFA World Cup 2026
                </div>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  📋 {selectedFixture.home} vs {selectedFixture.away}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  {player1.photo && <img src={player1.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{player1.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{matchPlayers.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#333" }}>VS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {player2.photo && <img src={player2.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{player2.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{matchPlayers.away.team}</div>
                </div>
              </div>

              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 10 }} />

              {/* HERO: Rating comparison */}
              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>⭐ Match Rating</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#4ade80" }}>{player1.rating ? parseFloat(player1.rating).toFixed(1) : "—"}</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>{player2.rating ? parseFloat(player2.rating).toFixed(1) : "—"}</span>
                </div>
              </div>

              {/* Bento grid — 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <BentoBox title="Attack" icon="🎯" color="#4ade80">
                  <MatchCompareRow label="Goals" val1={player1.goals} val2={player2.goals} />
                  <MatchCompareRow label="Assists" val1={player1.assists} val2={player2.assists} />
                  <MatchCompareRow label="Shots" val1={player1.shots} val2={player2.shots} />
                  <MatchCompareRow label="On Target" val1={player1.shotsOnGoal} val2={player2.shotsOnGoal} />
                </BentoBox>

                <BentoBox title="Creativity" icon="🎨" color="#818cf8">
                  <MatchCompareRow label="Key Passes" val1={player1.keyPasses} val2={player2.keyPasses} />
                  <MatchCompareRow label="Pass Acc" val1={player1.passAccuracy} val2={player2.passAccuracy} unit="%" />
                  <MatchCompareRow label="Dribbles" val1={player1.dribbles} val2={player2.dribbles} />
                </BentoBox>
              </div>

              <BentoBox title="Workrate & Caution" icon="⚔️" color="#c084fc">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <MatchCompareRow label="Minutes" val1={player1.minutesPlayed} val2={player2.minutesPlayed} />
                  <MatchCompareRow label="Tackles" val1={player1.tackles} val2={player2.tackles} />
                </div>
                <MatchCompareRow label="Cards" val1={player1.yellowCards} val2={player2.yellowCards} higherIsBetter={false} />
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TRANSFER FIT GRAPHIC ────────────────────────────────────────────────────
  function PlayerSearchSlot({ label, search, setSearch, suggestions, setSuggestions, player, searching, slot, color, onSelect, onClear, onSearch }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <input
        placeholder="Search player..."
        value={player ? player.name : search}
        onChange={e => {
          setSearch(e.target.value);
          onClear();
          onSearch(e.target.value, slot);
        }}
        style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${player ? color : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 13, padding: "9px 12px", outline: "none", fontFamily: "inherit" }}
      />
      {searching && <div style={{ position: "absolute", right: 10, top: 38, fontSize: 10, color: "#555" }}>...</div>}
      {suggestions.length > 0 && !player && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 20, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map(p => (
            <div key={p.id} onClick={() => onSelect(p, slot)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
              {p.photo && <img src={p.photo} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{p.team}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TransferFitGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("pl");

  const [searchTarget, setSearchTarget] = useState("");
  const [suggestTarget, setSuggestTarget] = useState([]);
  const [target, setTarget] = useState(null);
  const [searchingTarget, setSearchingTarget] = useState(false);

  const [searchIncumbent, setSearchIncumbent] = useState("");
  const [suggestIncumbent, setSuggestIncumbent] = useState([]);
  const [incumbent, setIncumbent] = useState(null);
  const [searchingIncumbent, setSearchingIncumbent] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const searchPlayer = async (query, slot) => {
    if (query.length < 3) {
      slot === "target" ? setSuggestTarget([]) : setSuggestIncumbent([]);
      return;
    }
    slot === "target" ? setSearchingTarget(true) : setSearchingIncumbent(true);
    try {
      const r = await fetch(`/api/team-stats?mode=playersearch&query=${encodeURIComponent(query)}&leagueId=${leagueId}`);
      const d = await r.json();
      slot === "target" ? setSuggestTarget(d.players || []) : setSuggestIncumbent(d.players || []);
    } catch {}
    slot === "target" ? setSearchingTarget(false) : setSearchingIncumbent(false);
  };

  const selectPlayer = async (player, slot) => {
    setSeasonLoading(true);
    try {
      const season = leagueId === "wc2026" ? 2026 : 2025;
      const r = await fetch(`/api/team-stats?mode=playerseason&playerId=${player.id}&season=${season}`);
      const d = await r.json();
      const enriched = d.available ? { ...player, ...d } : player;
      if (slot === "target") { setTarget(enriched); setSuggestTarget([]); setSearchTarget(enriched.name); }
      else { setIncumbent(enriched); setSuggestIncumbent([]); setSearchIncumbent(enriched.name); }
    } catch {
      if (slot === "target") setTarget(player); else setIncumbent(player);
    }
    setSeasonLoading(false);
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
      link.download = `deep433-transfer-fit-${target?.name}-vs-${incumbent?.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const FitRow = ({ label, val1, val2, higherIsBetter = true }) => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontSize: 18, fontWeight: p1Better ? 900 : 700, color: "#a855f7", opacity: p1Better ? 1 : 0.65 }}>{val1 ?? "—"}</span>
        <span style={{ fontSize: 10, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: p2Better ? 900 : 700, color: "#4ade80", opacity: p2Better ? 1 : 0.65 }}>{val2 ?? "—"}</span>
      </div>
    );
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setTarget(null); setIncumbent(null); setSearchTarget(""); setSearchIncumbent(""); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px" }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#666" }}>Compare a transfer target against a current squad player in a similar role.</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PlayerSearchSlot label="🎯 Transfer Target" search={searchTarget} setSearch={setSearchTarget} suggestions={suggestTarget} setSuggestions={setSuggestTarget} player={target} searching={searchingTarget} slot="target" color="#a855f7" onSelect={selectPlayer} onClear={() => setTarget(null)} onSearch={searchPlayer} />
        <PlayerSearchSlot label="🏠 Current Squad" search={searchIncumbent} setSearch={setSearchIncumbent} suggestions={suggestIncumbent} setSuggestions={setSuggestIncumbent} player={incumbent} searching={searchingIncumbent} slot="incumbent" color="#4ade80" onSelect={selectPlayer} onClear={() => setIncumbent(null)} onSearch={searchPlayer} />
      </div>

      {seasonLoading && <div style={{ textAlign: "center", color: "#555", fontSize: 12 }}>Loading season stats...</div>}

      {target && incumbent && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>🔄 Transfer Fit — Full Season</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  {target.photo && <img src={target.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #a855f7", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#a855f7" }}>{target.name}</div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{target.team}</div>
                  <div style={{ fontSize: 9, color: "#a855f7", fontWeight: 700, marginTop: 2, opacity: 0.7 }}>TARGET</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#333" }}>VS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {incumbent.photo && <img src={incumbent.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>{incumbent.name}</div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{incumbent.team}</div>
                  <div style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, marginTop: 2, opacity: 0.7 }}>SQUAD</div>
                </div>
              </div>

              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 10 }} />

              <div style={{
                background: "linear-gradient(135deg, #a855f714, #4ade800e)",
                border: "1px solid #a855f733",
                borderRadius: 12, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>⭐ Season Rating</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#a855f7" }}>{target.rating ? parseFloat(target.rating).toFixed(1) : "—"}</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#4ade80" }}>{incumbent.rating ? parseFloat(incumbent.rating).toFixed(1) : "—"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <BentoBox title="Output" icon="⚽" color="#a855f7">
                  <FitRow label="Goals" val1={target.goals} val2={incumbent.goals} />
                  <FitRow label="Assists" val1={target.assists} val2={incumbent.assists} />
                  <FitRow label="Apps" val1={target.appearances} val2={incumbent.appearances} />
                </BentoBox>

                <BentoBox title="Progression" icon="🎨" color="#60a5fa">
                  <FitRow label="Key Passes" val1={target.keyPasses} val2={incumbent.keyPasses} />
                  <FitRow label="Dribbles" val1={target.dribbles} val2={incumbent.dribbles} />
                  <FitRow label="Shots" val1={target.shots} val2={incumbent.shots} />
                </BentoBox>
              </div>

              <BentoBox title="Defensive Work" icon="🛡️" color="#f59e0b">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <FitRow label="Tackles" val1={target.tackles} val2={incumbent.tackles} />
                  <FitRow label="Cards" val1={target.yellowCards} val2={incumbent.yellowCards} higherIsBetter={false} />
                </div>
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#a855f7,#818cf8)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TEAM SEARCH SLOT (standalone, avoids re-render focus bug) ──────────────
function TeamSearchSlot({ label, search, setSearch, suggestions, team, searching, slot, color, onSelect, onClear, onSearch }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <input
        placeholder="Search team..."
        value={team ? team.name : search}
        onChange={e => {
          setSearch(e.target.value);
          onClear();
          onSearch(e.target.value, slot);
        }}
        style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${team ? color : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 13, padding: "9px 12px", outline: "none", fontFamily: "inherit" }}
      />
      {searching && <div style={{ position: "absolute", right: 10, top: 38, fontSize: 10, color: "#555" }}>...</div>}
      {suggestions.length > 0 && !team && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 20, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map(t => (
            <div key={t.id} onClick={() => onSelect(t, slot)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
              {t.logo && <img src={t.logo} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>{t.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GOAL TIMING GRAPHIC ──────────────────────────────────────────────────────
function GoalTimingGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("pl");

  const [search1, setSearch1] = useState("");
  const [suggest1, setSuggest1] = useState([]);
  const [team1, setTeam1] = useState(null);
  const [searching1, setSearching1] = useState(false);
  const [stats1, setStats1] = useState(null);

  const [search2, setSearch2] = useState("");
  const [suggest2, setSuggest2] = useState([]);
  const [team2, setTeam2] = useState(null);
  const [searching2, setSearching2] = useState(false);
  const [stats2, setStats2] = useState(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const INTERVALS = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90"];

  const searchTeam = async (query, slot) => {
    if (query.length < 3) {
      slot === 1 ? setSuggest1([]) : setSuggest2([]);
      return;
    }
    slot === 1 ? setSearching1(true) : setSearching2(true);
    try {
      const r = await fetch(`/api/team-stats?mode=teamsearch&query=${encodeURIComponent(query)}`);
      const d = await r.json();
      slot === 1 ? setSuggest1(d.teams || []) : setSuggest2(d.teams || []);
    } catch {}
    slot === 1 ? setSearching1(false) : setSearching2(false);
  };

  const selectTeam = async (t, slot) => {
    setLoading(true);
    if (slot === 1) { setTeam1(t); setSuggest1([]); setSearch1(t.name); }
    else { setTeam2(t); setSuggest2([]); setSearch2(t.name); }
    try {
      const r = await fetch(`/api/team-stats?leagueId=${leagueId}&teamId=${t.id}`);
      const d = await r.json();
      if (slot === 1) setStats1(d.available ? d : null);
      else setStats2(d.available ? d : null);
    } catch {}
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
      link.download = `deep433-goal-timing-${team1?.name}-vs-${team2?.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const getVal = (obj, key) => {
    if (!obj) return 0;
    return parseInt(obj[key]?.total) || 0;
  };

  const IntervalBar = ({ label, val1, val2, max, color1, color2 }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: color1 }}>{val1}</span>
        <span style={{ fontSize: 10, color: "#999", fontWeight: 700 }}>{label}'</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: color2 }}>{val2}</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ flex: 1, height: 7, background: "#1a1a24", borderRadius: 4, overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${max ? (val1 / max) * 100 : 0}%`, background: color1, borderRadius: 4 }} />
        </div>
        <div style={{ flex: 1, height: 7, background: "#1a1a24", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${max ? (val2 / max) * 100 : 0}%`, background: color2, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(1).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setTeam1(null); setTeam2(null); setStats1(null); setStats2(null); setSearch1(""); setSearch2(""); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TeamSearchSlot label="Team 1" search={search1} setSearch={setSearch1} suggestions={suggest1} team={team1} searching={searching1} slot={1} color="#4ade80" onSelect={selectTeam} onClear={() => setTeam1(null)} onSearch={searchTeam} />
        <TeamSearchSlot label="Team 2" search={search2} setSearch={setSearch2} suggestions={suggest2} team={team2} searching={searching2} slot={2} color="#f59e0b" onSelect={selectTeam} onClear={() => setTeam2(null)} onSearch={searchTeam} />
      </div>

      {loading && <div style={{ textAlign: "center", color: "#555", fontSize: 12 }}>Loading...</div>}

      {stats1 && stats2 && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {stats1.logo && <img src={stats1.logo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{stats1.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>⏱️ Goal Timing</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {stats2.logo && <img src={stats2.logo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{stats2.team}</div>
                </div>
              </div>

              <BentoBox title="Goals Scored" icon="⚽" color="#4ade80">
                {(() => {
                  const vals1 = INTERVALS.map(k => getVal(stats1.goalIntervalsFor, k));
                  const vals2 = INTERVALS.map(k => getVal(stats2.goalIntervalsFor, k));
                  const max = Math.max(...vals1, ...vals2, 1);
                  return INTERVALS.map((label, i) => (
                    <IntervalBar key={label} label={label} val1={vals1[i]} val2={vals2[i]} max={max} color1="#4ade80" color2="#f59e0b" />
                  ));
                })()}
              </BentoBox>

              <div style={{ height: 10 }} />

              <BentoBox title="Goals Conceded" icon="🥅" color="#f87171">
                {(() => {
                  const vals1 = INTERVALS.map(k => getVal(stats1.goalIntervalsAgainst, k));
                  const vals2 = INTERVALS.map(k => getVal(stats2.goalIntervalsAgainst, k));
                  const max = Math.max(...vals1, ...vals2, 1);
                  return INTERVALS.map((label, i) => (
                    <IntervalBar key={label} label={label} val1={vals1[i]} val2={vals2[i]} max={max} color1="#4ade80" color2="#f59e0b" />
                  ));
                })()}
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── HALFTIME RECAP GRAPHIC ──────────────────────────────────────────────────
function HalftimeRecapGraphic() {
  const cardRef = useRef(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (f) => {
    setSelectedFixture(f);
    setEvents(null);
    setError("");
    if (f.status === "upcoming") { setError("This match hasn't kicked off yet"); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/match-events?fixtureId=${f.fixtureId}`);
      const d = await r.json();
      setEvents(d.events || []);
    } catch (e) { setError("Could not load match events"); }
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
      link.download = `deep433-ht-recap-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  function normalizeTeam(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

  const firstHalfEvents = (events || []).filter(e => {
    if (e.type === "Goal" && e.detail === "Missed Penalty") return false;
    const min = parseInt(e.minute) || 0;
    return min <= 45 && (e.type === "Goal" || e.type === "Card");
  }).sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));

  const htHomeGoals = firstHalfEvents.filter(e => e.type === "Goal" && normalizeTeam(e.team) === normalizeTeam(selectedFixture?.home)).length;
  const htAwayGoals = firstHalfEvents.filter(e => e.type === "Goal" && normalizeTeam(e.team) === normalizeTeam(selectedFixture?.away)).length;

  const hasReachedHT = selectedFixture && (selectedFixture.status === "live" || selectedFixture.status === "finished");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
          <button onClick={() => { setSelectedFixture(null); setEvents(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#999", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "4px 10px" }}>Change</button>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "20px 0" }}>Loading match events...</div>}
      {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

      {events && hasReachedHT && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#ccc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{selectedFixture.round}</span>
              </div>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>⏱ Halftime Recap</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 18 }}>
                <div style={{ textAlign: "center" }}>
                  {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{selectedFixture.home}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 10px" }}>
                  <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>HT</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#f0f0f0", letterSpacing: -1 }}>{htHomeGoals}-{htAwayGoals}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {selectedFixture.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{selectedFixture.away}</div>
                </div>
              </div>

              <BentoBox title="First Half Events" icon="📋" color="#60a5fa">
                {firstHalfEvents.length === 0 && (
                  <div style={{ fontSize: 12, color: "#999", textAlign: "center", padding: "8px 0" }}>No goals or cards in the first half</div>
                )}
                {firstHalfEvents.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < firstHalfEvents.length - 1 ? "1px solid #1a1a2a" : "none" }}>
                    <span style={{ fontSize: 12, color: "#999", minWidth: 30, fontWeight: 700 }}>{e.minute}'</span>
                    <span style={{ fontSize: 14 }}>{e.icon}</span>
                    <span style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600, flex: 1 }}>{(e.label || "").split("(")[0].trim()}</span>
                    <span style={{ fontSize: 11, color: normalizeTeam(e.team) === normalizeTeam(selectedFixture.home) ? "#4ade80" : "#f59e0b", fontWeight: 700 }}>
                      {(e.team || "").split(" ").slice(-1)[0]}
                    </span>
                  </div>
                ))}
              </BentoBox>

              {selectedFixture.status === "finished" && (
                <div style={{ background: "#13131f", borderRadius: 10, padding: "12px 14px", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#ccc", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Full Time</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0", letterSpacing: -0.5 }}>{selectedFixture.score?.home}-{selectedFixture.score?.away}</span>
                </div>
              )}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
        </>
      )}

      {events && !hasReachedHT && (
        <div style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "20px 0" }}>This match hasn't reached halftime yet</div>
      )}
    </div>
  );
}

export default function DataGraphics({ history = [], supabase }) {
  const [activeSection, setActiveSection] = useState("match");

  const sections = [
    { id: "insights", label: "📊 Brief Insights" },
    { id: "pitch",    label: "⚽ Pitch View" },
    { id: "h2h",      label: "🆚 Player H2H" },
    { id: "matchh2h", label: "📋 Match H2H" },
    { id: "glove",    label: "Golden Glove" },
    { id: "transfer", label: "🔄 Transfer Fit" },
    { id: "timing",   label: "⏱️ Goal Timing" },
    { id: "halftime", label: "⏸ Halftime Recap" },
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
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ background: activeSection === s.id ? "#a855f722" : "none", border: `1px solid ${activeSection === s.id ? "#a855f7" : "#2a2a3a"}`, borderRadius: 20, color: activeSection === s.id ? "#a855f7" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "7px 14px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "insights" && <DeepInsightsGraphic history={history} />}
      {activeSection === "pitch"    && <MatchPitchViewGraphic />}
      {activeSection === "h2h"      && <PlayerH2HGraphic />}
      {activeSection === "matchh2h" && <MatchH2HGraphic />}
      {activeSection === "glove"    && <GoldenGloveGraphic />}
      {activeSection === "transfer" && <TransferFitGraphic />}
      {activeSection === "timing"   && <GoalTimingGraphic />}
      {activeSection === "halftime" && <HalftimeRecapGraphic />}
      {activeSection === "match"    && <MatchStatsGraphic />}
      {activeSection === "player"   && <PlayerRatingsGraphic />}
      {activeSection === "top"      && <TopScorersGraphic />}
      {activeSection === "team"     && <TeamStatsGraphic />}
      {activeSection === "recap"    && <RecapGraphic history={history} />}
      {activeSection === "bracket"  && <BracketGraphic history={history} />}
    </div>
  );
}

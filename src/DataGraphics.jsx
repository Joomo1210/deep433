import { useState, useRef, useEffect } from "react";
import DeepInsightsPanel from "./DeepInsightsPanel";

// Country name -> ISO code, for flag images (flagcdn.com) — covers national teams
const TEAM_FLAG_CODES = {
  "Mexico": "mx", "South Africa": "za", "Korea Republic": "kr", "Czechia": "cz",
  "Canada": "ca", "Bosnia and Herzegovina": "ba", "USA": "us", "Paraguay": "py",
  "Qatar": "qa", "Switzerland": "ch", "Brazil": "br", "Morocco": "ma",
  "Haiti": "ht", "Scotland": "gb-sct", "Australia": "au", "Türkiye": "tr",
  "Germany": "de", "Curaçao": "cw", "Netherlands": "nl", "Japan": "jp",
  "Côte d'Ivoire": "ci", "Ecuador": "ec", "Sweden": "se", "Tunisia": "tn",
  "Spain": "es", "Cabo Verde": "cv", "Belgium": "be", "Egypt": "eg",
  "Saudi Arabia": "sa", "Uruguay": "uy", "IR Iran": "ir", "New Zealand": "nz",
  "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
  "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
  "Portugal": "pt", "Congo DR": "cd", "England": "gb-eng", "Croatia": "hr",
  "Ghana": "gh", "Panama": "pa", "Uzbekistan": "uz", "Colombia": "co",
};

// ─── Shared mobile-safe download function ────────────────────────────────────
async function downloadCardImage(cardElement, filename, bgColor = "#0a0a0f", transparent = false) {
  if (!cardElement) return;
  if (!window.html2canvas) {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(s);
    await new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
  }
  const canvas = await window.html2canvas(cardElement, { backgroundColor: transparent ? null : bgColor, scale: 2, useCORS: true, logging: false });

  if (navigator.canShare && navigator.share) {
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch {
      // User cancelled share sheet, or share failed — fall through to standard download
    }
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

const LEAGUE_OPTIONS = [
  { id: "wc2026", label: "FIFA World Cup 2026" },
  { id: "pl",     label: "Premier League" },
  { id: "laliga", label: "La Liga" },
  { id: "seriea", label: "Serie A" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "ligue1", label: "Ligue 1" },
  { id: "ucl",    label: "Champions League" },
  { id: "friendlies", label: "Club Friendlies" },
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
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.map(l => (
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      <input
        placeholder="🔍 Search team..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 14px", outline: "none", fontFamily: "inherit" }}
      />

      {loading && <div style={{ fontSize: 15, color: "#e2e8f0", textAlign: "center" }}>Loading fixtures...</div>}

      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(byDate).map(([date, dateFixtures]) => (
          <div key={date}>
            <div style={{ fontSize: 13, color: date === "Today" ? "#4ade80" : date === "Yesterday" ? "#e2e8f0" : date === "Tomorrow" ? "#f59e0b" : "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "6px 0 4px" }}>{date}</div>
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
                    ? <span style={{ color: "#e2e8f0", fontWeight: 800 }}>{f.score.home}-{f.score.away}</span>
                    : f.status === "live"
                    ? <span style={{ color: "#ef4444", fontWeight: 700 }}>🔴 LIVE</span>
                    : <span style={{ color: "#e2e8f0" }}>{new Date(f.kickoff).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST</span>
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
  if (!n) return "#e2e8f0";
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
        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{icon && icon + " "}{label}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#f59e0b", minWidth: 36, textAlign: "right" }}>{away ?? "0"}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${homePct}%`, background: "#4ade80" }} />
        <div style={{ width: `${100 - homePct}%`, background: "#f59e0b", opacity: 0.5 }} />
      </div>
    </div>
  );
}

function GraphicCard({ children, cardRef, label, light = false }) {
  return (
    <div>
      <div
        ref={cardRef}
        style={{
          background: light ? "#ffffff" : "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 60%, #0a0f0a 100%)",
          border: light ? "1px solid #e5e5e5" : "1px solid #1e1e30",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Inter',sans-serif",
          width: "100%",
          maxWidth: typeof window !== "undefined" ? Math.min(460, window.innerWidth - 32) : 460,
          margin: "0 auto",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
        <div style={{ position: "absolute", top: 10, right: 12, zIndex: 2 }}>
          <img src="/deep433.jpg" alt="Deep433" crossOrigin="anonymous" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 0,
        }}>
          <div style={{
            fontSize: 72, fontWeight: 900, color: light ? "#a855f7" : "#4ade80", opacity: light ? 0.05 : 0.04,
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
      <div style={{ fontSize: 13, color: "#e2e8f0", textAlign: "center", marginTop: 8 }}>{label}</div>
    </div>
  );
}

// ─── MATCH STATS GRAPHIC ────────────────────────────────────────────────────
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, trigger]);
  return value;
}

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
        <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{displayAv.toFixed(unit === "%" ? 0 : (Number.isInteger(av) ? 0 : 1))}{unit}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "#1a1a24" }}>
        <div style={{ width: expanded ? `${homePct}%` : "0%", background: "#4ade80", transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
        <div style={{ width: expanded ? `${awayPct}%` : "0%", background: "#f59e0b", opacity: 0.6, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s" }} />
      </div>
    </div>
  );
}

function BentoBox({ title, icon, color, children, span, light = false }) {
  return (
    <div style={{
      background: light ? "#f8f8fa" : "#13131f",
      border: `1px solid ${color}${light ? "44" : "22"}`,
      borderRadius: 10,
      padding: "12px 14px",
      gridColumn: span ? "span " + span : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, minWidth: 0 }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 14, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
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
      const r = await fetch(`/api/fixture-data?type=stats&fixtureId=${fid}`);
      const d = await r.json();
      if (!d.available) throw new Error("No stats available for this fixture yet — try after kickoff");
      setData(d);
      setAnimate(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    setAnimate(false);
    await new Promise(res => setTimeout(res, 120));
    try {
      await downloadCardImage(cardRef.current, `deep433-match-stats-${fixtureId}.png`, undefined, transparent);
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
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {s.home.logo && <img src={s.home.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{s.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Match Stats</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.away.logo && <img src={s.away.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>{s.away.team}</div>
                </div>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "16px 18px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, textAlign: "center" }}>⚽ Possession</div>
                <PossessionHero home={s.home.stats.possession} awayVal={s.away.stats.possession} animate={animate} />
              </div>

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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

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
      const r = await fetch(`/api/fixture-data?type=ratings&fixtureId=${fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No player ratings available yet — try after kickoff");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-player-ratings-${fixtureId}.png`, undefined, transparent);
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
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
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
              <button key={t} onClick={() => setSelectedTeam(t)} style={{ flex: 1, background: selectedTeam === t ? "#4ade80" : "none", border: `1px solid ${selectedTeam === t ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: selectedTeam === t ? "#0a0f0a" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px" }}>
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
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>Player Ratings</div>
                </div>
              </div>
              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 12 }} />
              {players.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #0f0f1a" }}>
                  <div style={{ width: 24, textAlign: "center", fontSize: 14, color: "#e2e8f0", fontWeight: 700 }}>{i + 1}</div>
                  {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>
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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-${type}-${leagueId}.png`, undefined, transparent);
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
    if (i === 0) return "#FFD700";
    if (i === 1) return "#C0C0C0";
    if (i === 2) return "#CD7F32";
    return "#e2e8f0";
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
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["scorers", "assists", "cards"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, background: type === t ? "#a855f7" : "none", border: `1px solid ${type === t ? "#a855f7" : "#2a2a3a"}`, borderRadius: 8, color: type === t ? "#fff" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 8 }}>
                {LEAGUE_LOGOS[leagueId] && <img src={LEAGUE_LOGOS[leagueId]} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f0f0f0" }}>{typeLabels[type]}</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
                <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{statLabel[type]}</div>
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
                    <div style={{ width: 28, textAlign: "center", flexShrink: 0 }}>
                      {i < 3 && type === "scorers" ? (
                        <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 70 L20 30 Q20 20 30 20 L55 20 Q65 20 65 30 L65 50 L80 50 Q90 50 90 60 L90 75 Q90 85 80 85 L25 85 Q15 85 15 75 L15 70 Z"
                            fill={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"}
                            stroke={i === 0 ? "#B8860B" : i === 1 ? "#A0A0A0" : "#8B4513"}
                            strokeWidth="3"
                          />
                          <path d="M15 78 Q15 88 25 88 L80 88 Q90 88 90 78 L90 82 Q90 90 80 90 L25 90 Q15 90 15 82 Z"
                            fill={i === 0 ? "#B8860B" : i === 1 ? "#909090" : "#8B4513"}
                          />
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
                    {p.photo && <img src={p.photo} alt="" crossOrigin="anonymous" style={{ width: isTop3 ? 36 : 28, height: isTop3 ? 36 : 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: isTop3 ? `1.5px solid ${rankColor(i)}44` : "none" }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isTop3 ? 14 : 12, fontWeight: 700, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        {p.teamLogo && <img src={p.teamLogo} alt="" crossOrigin="anonymous" style={{ width: 12, height: 12, objectFit: "contain" }} />}
                        <span style={{ fontSize: 13, color: "#e2e8f0" }}>{p.team}</span>
                        {secondary && <span style={{ fontSize: 12, color: "#444", marginLeft: 4 }}>· {secondary}</span>}
                      </div>
                    </div>
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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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
  const [selectedTeam, setSelectedTeam] = useState(null);
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-team-stats-${data?.team}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const formDot = (r) => (
    <div style={{ width: 18, height: 18, borderRadius: "50%", background: r === "W" ? "#4ade80" : r === "D" ? "#a78bfa" : "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#0a0a0f", flexShrink: 0 }}>{r}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(1).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setData(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

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
        {searching && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#e2e8f0" }}>Searching...</div>}
        {teamSuggestions.length > 0 && !selectedTeam && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 10, marginTop: 4, maxHeight: 200, overflowY: "auto" }}>
            {teamSuggestions.map(t => (
              <div key={t.id} onClick={() => { setSelectedTeam(t); setTeamSearch(t.name); setTeamSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
                {t.logo && <img src={t.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{t.name}</div>
                  <div style={{ fontSize: 14, color: "#e2e8f0" }}>{t.country}</div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, marginTop: 8 }}>
                {data.logo && <img src={data.logo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0" }}>{data.team}</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>
                    {LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label} {data.seasonUsed}/{parseInt(data.seasonUsed) + 1} · Final Stats
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {data.position && (
                  <div style={{ background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                    POS: <span style={{ color: "#4ade80" }}>{data.position}{data.position === 1 ? "st" : data.position === 2 ? "nd" : data.position === 3 ? "rd" : "th"}</span>
                  </div>
                )}
                <div style={{ background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                  PTS: <span style={{ color: "#4ade80" }}>{(data.wins || 0) * 3 + (data.draws || 0)}</span>
                </div>
                <div style={{ background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                  GD: <span style={{ color: (data.goalsFor - data.goalsAgainst) >= 0 ? "#4ade80" : "#f87171" }}>{(data.goalsFor - data.goalsAgainst) >= 0 ? "+" : ""}{data.goalsFor - data.goalsAgainst}</span>
                </div>
                <div style={{ background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                  RECORD: <span style={{ color: "#e2e8f0" }}>{data.wins}W - {data.draws}D - {data.losses}L</span>
                </div>
              </div>

              {data.form && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Final 10 Match Form</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
                    <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── PASSING BREAKDOWN GRAPHIC ───────────────────────────────────────────────
function PassingBreakdownGraphic() {
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

  const fetch_ = async () => {
    if (!fixtureId) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/fixture-data?type=stats&fixtureId=${fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No stats available for this fixture yet — try after kickoff");
      setData(d);
      setAnimate(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    setAnimate(false);
    await new Promise(res => setTimeout(res, 120));
    try {
      await downloadCardImage(cardRef.current, `deep433-passing-${fixtureId}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
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
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading stats..." : "Load Passing Breakdown"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}
      {s && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {s.home.logo && <img src={s.home.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{s.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Passing Breakdown</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.away.logo && <img src={s.away.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>{s.away.team}</div>
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "16px 18px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, textAlign: "center" }}>🎯 Pass Accuracy</div>
                <AnimatedStatBar label="Accuracy" homeVal={s.home.stats.passAccuracy} awayVal={s.away.stats.passAccuracy} unit="%" animate={animate} />
              </div>
              <BentoBox title="Passing Volume" icon="🔁" color="#60a5fa">
                <AnimatedStatBar label="Total Passes" homeVal={s.home.stats.passesTotal} awayVal={s.away.stats.passesTotal} animate={animate} />
                <AnimatedStatBar label="Accurate Passes" homeVal={s.home.stats.passesAccurate} awayVal={s.away.stats.passesAccurate} animate={animate} />
              </BentoBox>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── SHOT PLACEMENT GRAPHIC ──────────────────────────────────────────────────
function ShotPlacementGraphic() {
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

  const fetch_ = async () => {
    if (!fixtureId) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/fixture-data?type=stats&fixtureId=${fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No stats available for this fixture yet — try after kickoff");
      setData(d);
      setAnimate(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    setAnimate(false);
    await new Promise(res => setTimeout(res, 120));
    try {
      await downloadCardImage(cardRef.current, `deep433-shot-placement-${fixtureId}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
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
            <button onClick={() => { setSelectedFixture(null); setData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>
          {!data && (
            <button onClick={fetch_} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
              {loading ? "Loading stats..." : "Load Shot Placement"}
            </button>
          )}
        </>
      )}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}
      {s && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {s.home.logo && <img src={s.home.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>{s.home.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Shot Placement</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.away.logo && <img src={s.away.logo} alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 4, display: "block", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>{s.away.team}</div>
                </div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033",
                borderRadius: 12, padding: "16px 18px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, textAlign: "center" }}>🎯 Total Shots</div>
                <AnimatedStatBar label="Shots" homeVal={s.home.stats.shotsTotal} awayVal={s.away.stats.shotsTotal} animate={animate} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <BentoBox title="On Target" icon="🥅" color="#4ade80">
                  <AnimatedStatBar label="On Target" homeVal={s.home.stats.shotsOnGoal} awayVal={s.away.stats.shotsOnGoal} animate={animate} />
                  <AnimatedStatBar label="Off Target" homeVal={s.home.stats.shotsOffGoal} awayVal={s.away.stats.shotsOffGoal} animate={animate} />
                  <AnimatedStatBar label="Blocked" homeVal={s.home.stats.shotsBlocked} awayVal={s.away.stats.shotsBlocked} animate={animate} />
                </BentoBox>
                <BentoBox title="Zones" icon="📍" color="#a855f7">
                  <AnimatedStatBar label="Inside Box" homeVal={s.home.stats.shotsInsideBox} awayVal={s.away.stats.shotsInsideBox} animate={animate} />
                  <AnimatedStatBar label="Outside Box" homeVal={s.home.stats.shotsOutsideBox} awayVal={s.away.stats.shotsOutsideBox} animate={animate} />
                </BentoBox>
              </div>
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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

    let homeGoals = [];
    let awayGoals = [];
    let keyStat = null;

    if (f.fixtureId) {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          fetch(`/api/fixture-data?type=stats&fixtureId=${f.fixtureId}`),
          fetch(`/api/fixture-data?type=events&fixtureId=${f.fixtureId}`),
        ]);
        const statsData = await statsRes.json();
        const eventsData = await eventsRes.json();

        (eventsData.events || [])
          .filter(e => {
            if (e.type === "Goal" && e.detail === "Missed Penalty") return false;
            return e.type === "Goal" || e.type === "Card";
          })
          .forEach(e => {
            const scorerFull = e.label?.split("(")[0]?.trim() || "";
            const surname = scorerFull.split(" ").slice(-1)[0]?.trim();
            const min = parseInt(e.minute) || 0;
            const time = min > 90 ? `ET ${min - 90}'` : `${min}'`;
            const entry = `${e.icon} ${surname} ${time}`;
            if (norm(e.team) === norm(f.home)) homeGoals.push(entry);
            else awayGoals.push(entry);
          });

        if (statsData.available) {
          const home = statsData.home;
          const away = statsData.away;
          const homePoss = parseFloat(home.stats?.possession) || 0;
          const awayPoss = parseFloat(away.stats?.possession) || 0;
          const homeShotsOn = home.stats?.shotsOnGoal || 0;
          const awayShotsOn = away.stats?.shotsOnGoal || 0;
          const homeSaves = home.stats?.saves || 0;
          const awaySaves = away.stats?.saves || 0;

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
      regulationScore: (f.fulltimeScore?.home != null && f.fulltimeScore?.away != null)
        ? `${f.fulltimeScore.home}-${f.fulltimeScore.away}`
        : fs,
      yourPrediction: pred?.user_prediction || null,
      aiPrediction: pred?.ai_prediction || null,
      homeGoals,
      awayGoals,
      keyStat,
      competition: "FIFA World Cup 2026",
      round: f.round || "",
    });
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-recap-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const fs = matchData?.finalScore || "0-0";
  const regScore = matchData?.regulationScore || fs;
  const [rs0, rs1] = regScore.split("-").map(n => parseInt(n) || 0);
  const [fs0, fs1] = fs.split("-").map(n => parseInt(n) || 0);
  const wentToExtraTime = regScore !== fs;
  const yourPrediction = matchData?.yourPrediction;
  const aiPrediction = matchData?.aiPrediction;
  const finalScore = matchData?.finalScore;

  const getOutcome = (pred) => {
    if (!pred || !matchData?.finalScore) return null;
    const [p0, p1] = pred.split("-").map(n => parseInt(n) || 0);
    if (p0 === rs0 && p1 === rs1) return { icon: "✅", label: "Exact", color: "#4ade80" };
    const homeWon = rs0 > rs1;
    const awayWon = rs1 > rs0;
    const draw = rs0 === rs1;
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
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
      <div style={{ position: "absolute", top: 12, right: 14, zIndex: 2, display: "flex", alignItems: "center", gap: 6 }}>
        <img src="/deep433.jpg" alt="Deep433" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
      </div>

      {isLandscape ? (
        <>
          <div style={{ width: "50%", padding: "36px 20px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #1a1a2a", position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: "#e2e8f0", letterSpacing: 2, textTransform: "uppercase" }}>{matchData?.competition}</div>
              <div style={{ fontSize: 16, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", fontWeight: 900 }}>{selectedFixture?.round}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Full Time{wentToExtraTime ? " (AET)" : ""}</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1, letterSpacing: -1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8, position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 0 }}>
                <img src="/deep433.jpg" alt="" crossOrigin="anonymous" style={{ width: 34, height: 34, opacity: 0.3, objectFit: "contain", borderRadius: "50%", userSelect: "none" }} />
              </div>
              <div style={{ textAlign: "left", flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#e2e8f0", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#e2e8f0", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "36px 20px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Predictions</div>
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
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#e2e8f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>{matchData?.competition}</div>
            <div style={{ fontSize: 15, color: "#f0f0f0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 900 }}>{selectedFixture?.round}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
              {selectedFixture?.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
              <div>
                <div style={{ fontSize: 14, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Full Time{wentToExtraTime ? " (AET)" : ""}</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#f0f0f0", lineHeight: 1, letterSpacing: -1 }}>{fs0}-{fs1}</div>
              </div>
              {selectedFixture?.awayLogo && <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 0 }}>
                <img src="/deep433.jpg" alt="" crossOrigin="anonymous" style={{ width: 30, height: 30, opacity: 0.28, objectFit: "contain", borderRadius: "50%", userSelect: "none" }} />
              </div>
              <div style={{ textAlign: "left", flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>{selectedFixture?.home}</div>
                {matchData?.homeGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#e2e8f0", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
              <div style={{ textAlign: "right", flex: 1, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{selectedFixture?.away}</div>
                {matchData?.awayGoals?.map((g, i) => <div key={i} style={{ fontSize: 15, color: "#e2e8f0", marginTop: 3, fontWeight: 600 }}>{g}</div>)}
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "#1a1a2a" }} />
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
            <button onClick={() => { setSelectedFixture(null); setMatchData(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 16, padding: "4px 10px" }}>Change</button>
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
                  <button key={v} onClick={() => setVariant(v)} style={{ flex: 1, background: variant === v ? "#4ade8022" : "none", border: `1px solid ${variant === v ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: variant === v ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 700, padding: "8px" }}>
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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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

  const [sel, setSel] = useState({ sf1:"", sf2:"", fin:"" });
  const [finalist1, setFinalist1] = useState("");
  const [finalist2, setFinalist2] = useState("");
  const [predictedChampion, setPredictedChampion] = useState("");
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
    setSel({ sf1:"", sf2:"", fin:"" });
    setFinalist1(""); setFinalist2(""); setPredictedChampion("");
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-bracket-${leagueId}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const TrophyIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="22" r="11" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      <circle cx="50" cy="19" r="4" fill="#FFF3B0" opacity="0.7" />
      <path d="M38 78 C 30 68, 30 58, 40 50 C 50 42, 50 34, 44 28"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      <path d="M62 78 C 70 68, 70 58, 60 50 C 50 42, 50 34, 56 28"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 80 C 50 68, 50 58, 50 50 C 50 42, 50 36, 50 30"
            fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
      <path d="M38 78 C 30 68, 30 58, 40 50 C 50 42, 50 34, 44 28"
            fill="none" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M62 78 C 70 68, 70 58, 60 50 C 50 42, 50 34, 56 28"
            fill="none" stroke="#B8860B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M35 80 L65 80 L58 96 L42 96 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
      <rect x="38" y="96" width="24" height="6" fill="#2a2a3a" />
      <rect x="32" y="102" width="36" height="8" rx="2" fill="#1a1a2a" stroke="#333" strokeWidth="1" />
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
        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>Select match</span>
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
          <span style={{ fontSize: 11, color: isL ? "#ff6b6b" : "#e2e8f0", fontWeight: 700 }}>
            {isL ? "🔴 LIVE" : isF ? m.statusRaw : new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          {pred && <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ {pred.user_prediction}</span>}
        </div>
      </div>
    );
  };

  const DropDown = ({ label, skey }) => (
    <div>
      <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
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

  const hasAny = Object.values(sel).some(v => v) || finalist1 || finalist2 || predictedChampion;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CUP_LEAGUES.map(l => (
          <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
            {l.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", color: "#e2e8f0", fontSize: 16, padding: "20px 0" }}>Loading...</div>}

      {!loading && rounds.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DropDown label="Semi-Final 1" skey="sf1" />
            <DropDown label="Semi-Final 2" skey="sf2" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(() => {
              const m = getMatch(sel.sf1);
              return (
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Who advances? (SF1)</div>
                  <select value={finalist1} onChange={e => setFinalist1(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 6, color: "#f0f0f0", fontSize: 15, padding: "7px 10px", outline: "none", fontFamily: "inherit" }}>
                    <option value="">— Select —</option>
                    {m?.home && <option value="home">{m.home}</option>}
                    {m?.away && <option value="away">{m.away}</option>}
                  </select>
                </div>
              );
            })()}
            {(() => {
              const m = getMatch(sel.sf2);
              return (
                <div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Who advances? (SF2)</div>
                  <select value={finalist2} onChange={e => setFinalist2(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 6, color: "#f0f0f0", fontSize: 15, padding: "7px 10px", outline: "none", fontFamily: "inherit" }}>
                    <option value="">— Select —</option>
                    {m?.home && <option value="home">{m.home}</option>}
                    {m?.away && <option value="away">{m.away}</option>}
                  </select>
                </div>
              );
            })()}
          </div>

          {(() => {
            const m1 = getMatch(sel.sf1);
            const m2 = getMatch(sel.sf2);
            const f1Name = finalist1 === "home" ? m1?.home : finalist1 === "away" ? m1?.away : null;
            const f2Name = finalist2 === "home" ? m2?.home : finalist2 === "away" ? m2?.away : null;
            return (
              <div>
                <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>🏆 Predicted Champion</div>
                <select value={predictedChampion} onChange={e => setPredictedChampion(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 6, color: "#f0f0f0", fontSize: 15, padding: "7px 10px", outline: "none", fontFamily: "inherit" }}>
                  <option value="">— Select —</option>
                  {f1Name && <option value="1">{f1Name}</option>}
                  {f2Name && <option value="2">{f2Name}</option>}
                </select>
              </div>
            );
          })()}

          <div ref={cardRef} style={{ background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 60%, #0a0f0a 100%)", border: "1px solid #1e1e30", borderRadius: 14, overflow: "hidden", position: "relative", padding: "28px 16px 16px", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
            <div style={{ position: "absolute", top: 10, right: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <img src="/deep433.jpg" alt="Deep433" crossOrigin="anonymous" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
            </div>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, color: "#f0f0f0", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
                {CUP_LEAGUES.find(l => l.id === leagueId)?.label}
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", padding: "10px 0" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Semi-Final</div>
                  <Node val={sel.sf1} w={165} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Semi-Final</div>
                  <Node val={sel.sf2} w={165} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 20, color: "#4a4a5a", fontWeight: 900 }}>▼</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Final</div>
                {(() => {
                  const m1 = getMatch(sel.sf1);
                  const m2 = getMatch(sel.sf2);
                  const f1Name = finalist1 === "home" ? m1?.home : finalist1 === "away" ? m1?.away : null;
                  const f1Logo = finalist1 === "home" ? m1?.homeLogo : finalist1 === "away" ? m1?.awayLogo : null;
                  const f2Name = finalist2 === "home" ? m2?.home : finalist2 === "away" ? m2?.away : null;
                  const f2Logo = finalist2 === "home" ? m2?.homeLogo : finalist2 === "away" ? m2?.awayLogo : null;

                  if (!f1Name || !f2Name) {
                    return (
                      <div style={{ width: 190, background: "#161622", border: "1px dashed #2a2a3a", borderRadius: 8, padding: "14px 8px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>Pick both finalists above</span>
                      </div>
                    );
                  }
                  return (
                    <div style={{ width: 190, background: "#181826", border: "2px solid #333", borderRadius: 8, overflow: "hidden" }}>
                      {[{ name: f1Name, logo: f1Logo }, { name: f2Name, logo: f2Logo }].map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 10px", borderBottom: i === 0 ? "1px solid #26263a" : "none" }}>
                          {t.logo ? <img src={t.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} /> : <div style={{ width: 20, height: 20, background: "#26263a", borderRadius: "50%", flexShrink: 0 }} />}
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const m1 = getMatch(sel.sf1);
                const m2 = getMatch(sel.sf2);
                const f1Name = finalist1 === "home" ? m1?.home : finalist1 === "away" ? m1?.away : null;
                const f1Logo = finalist1 === "home" ? m1?.homeLogo : finalist1 === "away" ? m1?.awayLogo : null;
                const f2Name = finalist2 === "home" ? m2?.home : finalist2 === "away" ? m2?.away : null;
                const f2Logo = finalist2 === "home" ? m2?.homeLogo : finalist2 === "away" ? m2?.awayLogo : null;
                const champion = predictedChampion === "1" ? { name: f1Name, logo: f1Logo } : predictedChampion === "2" ? { name: f2Name, logo: f2Logo } : null;
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 20, color: "#4a4a5a", fontWeight: 900 }}>▼</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <TrophyIcon size={22} />
                      <span style={{ fontSize: 15, color: "#fbbf24", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5 }}>Champion</span>
                    </div>
                    {champion ? (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.02))",
                        border: "1px solid rgba(255,215,0,0.3)", borderRadius: 12, padding: "16px 28px",
                      }}>
                        {champion.logo && <img src={champion.logo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: "contain" }} />}
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#FFD700" }}>{champion.name}</span>
                      </div>
                    ) : (
                      <div style={{ width: 190, background: "#161622", border: "1px dashed #2a2a3a", borderRadius: 8, padding: "18px 8px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>Pick your Champion above</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>🟢 Green border = your prediction</span>
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-insights-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const home = selectedFixture?.home;
  const away = selectedFixture?.away;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!selectedFixture ? (
        <FixturePicker onSelect={handleSelect} />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#13131f", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{selectedFixture.home} vs {selectedFixture.away}</span>
            <button onClick={() => { setSelectedFixture(null); setInsights(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#e2e8f0", fontSize: 16, padding: "20px 0" }}>Loading insights...</div>}
          {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

          {insights && (
            <>
              <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
                <div style={{ padding: "22px 18px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                    <img src="/fifa.png" alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, objectFit: "contain" }} />
                    <span style={{ fontSize: 12, color: "#ccc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>FIFA World Cup 2026</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {selectedFixture.homeLogo && <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{home}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{selectedFixture.round}</div>
                      <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700 }}>vs</div>
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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-lineup-${selectedFixture?.home}-vs-${selectedFixture?.away}.png`, "#0a3d1f", transparent);
    } catch { alert("Download failed — try screenshotting manually"); }
    setDownloading(false);
  };

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
            <button onClick={() => { setSelectedFixture(null); setLineup(null); setError(""); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "4px 10px" }}>Change</button>
          </div>

          {loading && <div style={{ textAlign: "center", color: "#e2e8f0", fontSize: 16, padding: "20px 0" }}>Loading lineup...</div>}
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
                <svg viewBox="0 0 420 680" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
                  <rect width="420" height="680" fill="#0a3d1f" />
                  <rect x="20" y="20" width="380" height="640" fill="none" stroke="#1a6b3a" strokeWidth="2" rx="2" />
                  <line x1="20" y1="340" x2="400" y2="340" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="340" r="55" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="340" r="3" fill="#1a6b3a" />
                  <rect x="100" y="20" width="220" height="90" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <rect x="155" y="20" width="110" height="40" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="95" r="4" fill="#1a6b3a" />
                  <path d="M 170 110 A 55 55 0 0 1 250 110" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <rect x="100" y="570" width="220" height="90" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <rect x="155" y="640" width="110" height="40" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  <circle cx="210" cy="585" r="4" fill="#1a6b3a" />
                  <path d="M 170 570 A 55 55 0 0 0 250 570" fill="none" stroke="#1a6b3a" strokeWidth="2" />
                  {[0,1,2,3,4,5,6].map(i => (
                    <rect key={i} x="20" y={20 + i * 91} width="380" height="45" fill={i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"} />
                  ))}
                </svg>

                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "24px 8px" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#4ade80,#a855f7,#f59e0b)" }} />
                  <div style={{ position: "absolute", top: 8, right: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <img src="/deep433.jpg" alt="Deep433" crossOrigin="anonymous" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                  </div>

                  {selectedFixture.homeLogo && (
                    <div style={{ position: "absolute", top: "9%", right: "18%", zIndex: 0, opacity: 0.6 }}>
                      <img src={selectedFixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, objectFit: "contain" }} />
                    </div>
                  )}
                  {selectedFixture.awayLogo && (
                    <div style={{ position: "absolute", bottom: "9%", right: "18%", zIndex: 0, opacity: 0.6 }}>
                      <img src={selectedFixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, objectFit: "contain" }} />
                    </div>
                  )}

                  <div style={{ position: "absolute", bottom: 10, left: 10, pointerEvents: "none" }}>
                    <img src="/deep433.jpg" alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, opacity: 0.35, objectFit: "contain", borderRadius: "50%", userSelect: "none" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{selectedFixture.home}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0" }}>{lineup.home?.formation}</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.home?.players} color="#4ade80" reverse={false} />
                  </div>

                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 11, color: "#1a6b3a", fontWeight: 700, letterSpacing: 2 }}>· · · · · · · · · · · · · ·</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <TeamRows players={lineup.away?.players} color="#f59e0b" reverse={true} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{selectedFixture.away}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0" }}>{lineup.away?.formation}</span>
                  </div>
                </div>
              </div>

              <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
                {downloading ? "Generating..." : "⬇ Download Pitch View PNG"}
              </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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
      {searching && <div style={{ position: "absolute", right: 10, top: 38, fontSize: 13, color: "#e2e8f0" }}>...</div>}
      {suggestions.length > 0 && !player && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 20, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map(p => (
            <div key={p.id} onClick={() => { setPlayer(p); setSearch(p.name); setSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
              {p.photo && <img src={p.photo} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{p.team}</div>
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
  const [statsMode, setStatsMode] = useState("competition");
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

  const fetchSeasonStats = async (player, setPlayer) => {
    if (!player?.id) return;
    setSeasonLoading(true);
    try {
      const season = leagueId === "wc2026" ? 2026 : 2025;
      const r = await fetch(`/api/team-stats?mode=playerseason&playerId=${player.id}&season=${season}${season === 2026 ? '&onlyLeagueId=1' : ''}`);
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-h2h-${player1?.name}-vs-${player2?.name}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const CompareRow = ({ label, val1, val2, higherIsBetter = true }) => {
    const v1 = parseFloat(val1) || 0;
    const v2 = parseFloat(val2) || 0;
    const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
    const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #0f0f1a" }}>
        <span style={{ flex: 1, textAlign: "right", fontSize: 20, fontWeight: p1Better ? 900 : 700, color: "#4ade80", opacity: p1Better ? 1 : 0.65, paddingRight: 12 }}>{val1 ?? "—"}</span>
        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, width: 90, textAlign: "center" }}>{label}</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 20, fontWeight: p2Better ? 900 : 700, color: "#f59e0b", opacity: p2Better ? 1 : 0.65, paddingLeft: 12 }}>{val2 ?? "—"}</span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setPlayer1(null); setPlayer2(null); setSearch1(""); setSearch2(""); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
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
              <button key={m} onClick={() => toggleStatsMode(m)} disabled={seasonLoading} style={{ flex: 1, background: statsMode === m ? "#4ade8022" : "none", border: `1px solid ${statsMode === m ? "#4ade80" : "#2a2a3a"}`, borderRadius: 8, color: statsMode === m ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "8px", textTransform: "capitalize" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16, marginTop: 8 }}>
                <div style={{ textAlign: "center" }}>
                  {player1.photo && <img src={player1.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{player1.name}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{player1.team}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#333" }}>VS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  {player2.photo && <img src={player2.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{player2.name}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{player2.team}</div>
                </div>
              </div>

              <div style={{ height: 1, background: "#1a1a2a", marginBottom: 10 }} />

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
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
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

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-golden-glove-${leagueId}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setStandings(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
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
                  <div style={{ fontSize: 13, color: "#e2e8f0" }}>{LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label}</div>
                </div>
                <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Clean Sheets</div>
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
                      <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 3, fontWeight: 600 }}>{team.played} played · {team.goalsConceded} conceded</div>
                    </div>
                  );
                });
              })()}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── MATCH HEAD-TO-HEAD (TWO PLAYERS FROM ONE FIXTURE) ───────────────────────
function MatchH2HGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [fixture, setFixture] = useState(null);
  const [lineup, setLineup] = useState(null);
  const [loadingLineup, setLoadingLineup] = useState(false);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const loadLineup = async (f) => {
    setFixture(f); setLineup(null); setPlayer1(null); setPlayer2(null); setError("");
    setLoadingLineup(true);
    try {
      const r = await fetch(`/api/match-lineup?fixtureId=${f.fixtureId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No lineup/ratings available for this fixture yet");
      setLineup(d);
    } catch (e) { setError(e.message); }
    setLoadingLineup(false);
  };

  const allPlayers = lineup ? [
    ...(lineup.home?.players || []).map(p => ({ ...p, teamName: lineup.home.name, side: "home" })),
    ...(lineup.away?.players || []).map(p => ({ ...p, teamName: lineup.away.name, side: "away" })),
  ] : [];

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-match-h2h-${fixture?.home}-vs-${fixture?.away}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setFixture(null); setLineup(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      <FixturePicker leagueId={leagueId} onSelect={loadLineup} selected={fixture} />
      {loadingLineup && <div style={{ color: "#e2e8f0", fontSize: 15 }}>Loading lineup...</div>}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {lineup && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <PlayerSearchBox
            label="Player 1" color="#4ade80" slot={1}
            search={player1?.name || ""} setSearch={() => {}}
            suggestions={allPlayers.filter(p => !player1 || p.name !== player1.name)}
            setSuggestions={() => {}}
            player={player1} setPlayer={setPlayer1}
            searching={false}
            onSearch={() => {}}
          />
          <PlayerSearchBox
            label="Player 2" color="#f59e0b" slot={2}
            search={player2?.name || ""} setSearch={() => {}}
            suggestions={allPlayers.filter(p => !player2 || p.name !== player2.name)}
            setSuggestions={() => {}}
            player={player2} setPlayer={setPlayer2}
            searching={false}
            onSearch={() => {}}
          />
        </div>
      )}

      {player1 && player2 && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>Match Head-to-Head</span>
                <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 4 }}>{fixture.home} vs {fixture.away}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  {player1.photo && <img src={player1.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#4ade80" }}>{player1.name}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0" }}>{player1.teamName}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#333" }}>VS</div>
                <div style={{ textAlign: "center" }}>
                  {player2.photo && <img src={player2.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b" }}>{player2.name}</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0" }}>{player2.teamName}</div>
                </div>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #4ade8014, #f59e0b0e)",
                border: "1px solid #4ade8033", borderRadius: 12, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: ratingColor(player1.rating) }}>{player1.rating ? parseFloat(player1.rating).toFixed(1) : "—"}</span>
                  <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase" }}>Rating</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: ratingColor(player2.rating) }}>{player2.rating ? parseFloat(player2.rating).toFixed(1) : "—"}</span>
                </div>
              </div>

              <StatRow label="Goals" val1={player1.goals} val2={player2.goals} />
              <StatRow label="Assists" val1={player1.assists} val2={player2.assists} />
              <StatRow label="Shots" val1={player1.shots} val2={player2.shots} />
              <StatRow label="Passes" val1={player1.passes} val2={player2.passes} />
              <StatRow label="Tackles" val1={player1.tackles} val2={player2.tackles} />
              <StatRow label="Duels Won" val1={player1.duelsWon} val2={player2.duelsWon} />
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TRANSFER FIT (COMPARE TRANSFER TARGET VS INCUMBENT) ────────────────────
function SoloStatRow({ label, val1, val2, higherIsBetter = true }) {
  const v1 = parseFloat(val1) || 0;
  const v2 = parseFloat(val2) || 0;
  const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
  const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #0f0f1a" }}>
      <span style={{ flex: 1, textAlign: "right", fontSize: 20, fontWeight: p1Better ? 900 : 700, color: "#4ade80", opacity: p1Better ? 1 : 0.65, paddingRight: 12 }}>{val1 ?? "—"}</span>
      <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, width: 90, textAlign: "center" }}>{label}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 20, fontWeight: p2Better ? 900 : 700, color: "#f59e0b", opacity: p2Better ? 1 : 0.65, paddingLeft: 12 }}>{val2 ?? "—"}</span>
    </div>
  );
}

function PlayerSearchSlot({ label, color, player, setPlayer, leagueId }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async (query) => {
    setSearch(query);
    setPlayer(null);
    if (query.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/team-stats?mode=playersearch&query=${encodeURIComponent(query)}&leagueId=${leagueId}`);
      const d = await r.json();
      setSuggestions(d.players || []);
    } catch {}
    setSearching(false);
  };

  return (
    <PlayerSearchBox
      label={label} color={color} slot={label}
      search={search} setSearch={setSearch}
      suggestions={suggestions} setSuggestions={setSuggestions}
      player={player} setPlayer={setPlayer}
      searching={searching}
      onSearch={doSearch}
    />
  );
}

function TeamThenPlayerPicker({ label, color, leagueId, player, setPlayer }) {
  return <PlayerSearchSlot label={label} color={color} player={player} setPlayer={setPlayer} leagueId={leagueId} />;
}

function TransferFitGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("pl");
  const [incumbent, setIncumbent] = useState(null);
  const [target, setTarget] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-transfer-fit-${target?.name}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setIncumbent(null); setTarget(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TeamThenPlayerPicker label="Incumbent" color="#4ade80" leagueId={leagueId} player={incumbent} setPlayer={setIncumbent} />
        <TeamThenPlayerPicker label="Transfer Target" color="#f59e0b" leagueId={leagueId} player={target} setPlayer={setTarget} />
      </div>

      {incumbent && target && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>🔁 Transfer Fit Check</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  {incumbent.photo && <img src={incumbent.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #4ade80", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>{incumbent.name}</div>
                  <div style={{ fontSize: 11, color: "#e2e8f0" }}>{incumbent.team}</div>
                  <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>Incumbent</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#333" }}>→</div>
                <div style={{ textAlign: "center" }}>
                  {target.photo && <img src={target.photo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #f59e0b", margin: "0 auto 8px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#f59e0b" }}>{target.name}</div>
                  <div style={{ fontSize: 11, color: "#e2e8f0" }}>{target.team}</div>
                  <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>Target</div>
                </div>
              </div>

              <SoloStatRow label="Goals" val1={incumbent.goals} val2={target.goals} />
              <SoloStatRow label="Assists" val1={incumbent.assists} val2={target.assists} />
              <SoloStatRow label="Apps" val1={incumbent.appearances} val2={target.appearances} />
              <SoloStatRow label="Rating" val1={incumbent.rating ? parseFloat(incumbent.rating).toFixed(1) : null} val2={target.rating ? parseFloat(target.rating).toFixed(1) : null} />
              <SoloStatRow label="Key Passes" val1={incumbent.keyPasses} val2={target.keyPasses} />
              <SoloStatRow label="Dribbles" val1={incumbent.dribbles} val2={target.dribbles} />
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── SHARED: LEAGUE / TEAM SEARCH SLOTS ──────────────────────────────────────
function LeagueSearchSlot({ leagueId, setLeagueId }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {LEAGUE_OPTIONS.map(l => (
        <button key={l.id} onClick={() => setLeagueId(l.id)} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
          {LEAGUE_LOGOS[l.id] && <img src={LEAGUE_LOGOS[l.id]} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
          {l.label}
        </button>
      ))}
    </div>
  );
}

function TeamSearchSlot({ label, color, leagueId, team, setTeam }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async (query) => {
    setSearch(query);
    setTeam(null);
    if (query.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/team-stats?mode=teamsearch&query=${encodeURIComponent(query)}&leagueId=${leagueId}`);
      const d = await r.json();
      setSuggestions(d.teams || []);
    } catch {}
    setSearching(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 13, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <input
        placeholder="Search team..."
        value={team ? team.name : search}
        onChange={e => doSearch(e.target.value)}
        style={{ width: "100%", background: "#1a1a24", border: `1.5px solid ${team ? color : "#2a2a3a"}`, borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 12px", outline: "none", fontFamily: "inherit" }}
      />
      {searching && <div style={{ position: "absolute", right: 10, top: 38, fontSize: 13, color: "#e2e8f0" }}>...</div>}
      {suggestions.length > 0 && !team && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 8, zIndex: 20, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map(t => (
            <div key={t.id} onClick={() => { setTeam(t); setSearch(t.name); setSuggestions([]); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #1a1a2a" }}>
              {t.logo && <img src={t.logo} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />}
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>{t.name}</span>
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
  const [team, setTeam] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const BANDS = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90"];

  const load = async () => {
    if (!team) return;
    setLoading(true); setError(""); setData(null);
    try {
      const r = await fetch(`/api/team-stats?mode=goaltiming&teamId=${team.id}&leagueId=${leagueId}`);
      const d = await r.json();
      if (!d.available) throw new Error("No goal timing data available for this team");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-goal-timing-${team?.name}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <LeagueSearchSlot leagueId={leagueId} setLeagueId={(id) => { setLeagueId(id); setTeam(null); setData(null); }} />
      <TeamSearchSlot label="Team" color="#4ade80" leagueId={leagueId} team={team} setTeam={setTeam} />

      <button onClick={load} disabled={loading || !team} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px", opacity: !team ? 0.5 : 1 }}>
        {loading ? "Loading..." : "Load Goal Timing"}
      </button>
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                {team.logo && <img src={team.logo} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#f0f0f0" }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Goal Timing Breakdown</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚽ Goals Scored</div>
              {(() => {
                const max = Math.max(...BANDS.map(b => data.scored?.[b] || 0), 1);
                return BANDS.map(b => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#e2e8f0", width: 46 }}>{b}'</span>
                    <div style={{ flex: 1, height: 14, background: "#1a1a24", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(((data.scored?.[b] || 0) / max) * 100, data.scored?.[b] ? 4 : 0)}%`, height: "100%", background: "linear-gradient(90deg,#4ade80,#22c55e)" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", width: 20, textAlign: "right" }}>{data.scored?.[b] || 0}</span>
                  </div>
                ));
              })()}

              <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 8px" }}>🥅 Goals Conceded</div>
              {(() => {
                const max = Math.max(...BANDS.map(b => data.conceded?.[b] || 0), 1);
                return BANDS.map(b => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#e2e8f0", width: 46 }}>{b}'</span>
                    <div style={{ flex: 1, height: 14, background: "#1a1a24", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(((data.conceded?.[b] || 0) / max) * 100, data.conceded?.[b] ? 4 : 0)}%`, height: "100%", background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", width: 20, textAlign: "right" }}>{data.conceded?.[b] || 0}</span>
                  </div>
                ));
              })()}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── HALFTIME RECAP GRAPHIC ──────────────────────────────────────────────────
function HalftimeRecapGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("wc2026");
  const [fixture, setFixture] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const load = async (f) => {
    setFixture(f); setData(null); setError("");
    setLoading(true);
    try {
      const r = await fetch(`/api/fixture-data?fixtureId=${f.fixtureId}&type=halftime`);
      const d = await r.json();
      if (!d.available) throw new Error("Halftime data not available for this fixture yet");
      setData(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-halftime-${fixture?.home}-vs-${fixture?.away}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {LEAGUE_OPTIONS.slice(0, 7).map(l => (
          <button key={l.id} onClick={() => { setLeagueId(l.id); setFixture(null); setData(null); }} style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: leagueId === l.id ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "5px 12px" }}>
            {l.label}
          </button>
        ))}
      </div>

      <FixturePicker leagueId={leagueId} onSelect={load} selected={fixture} />
      {loading && <div style={{ color: "#e2e8f0", fontSize: 15 }}>Loading...</div>}
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>⏱ Halftime</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "10px 0 18px" }}>
                <div style={{ textAlign: "center" }}>
                  {fixture.homeLogo && <img src={fixture.homeLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginTop: 4 }}>{fixture.home}</div>
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#f0f0f0" }}>{data.htScore?.home ?? 0} - {data.htScore?.away ?? 0}</div>
                <div style={{ textAlign: "center" }}>
                  {fixture.awayLogo && <img src={fixture.awayLogo} alt="" crossOrigin="anonymous" style={{ width: 40, height: 40, objectFit: "contain" }} />}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginTop: 4 }}>{fixture.away}</div>
                </div>
              </div>

              {(data.events || []).length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a2a", paddingTop: 10 }}>
                  <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Key Events</div>
                  {data.events.map((ev, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "#e2e8f0", marginBottom: 6 }}>
                      <span style={{ color: "#818cf8", fontWeight: 700, width: 32 }}>{ev.minute}'</span>
                      <span>{ev.icon} {ev.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── TEAM STATS COMPARE (SIDE BY SIDE SEASON PROFILES) ───────────────────────
function TeamStatsCompareGraphic() {
  const cardRef = useRef(null);
  const [leagueId, setLeagueId] = useState("pl");
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-team-compare-${team1?.name}-vs-${team2?.name}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <LeagueSearchSlot leagueId={leagueId} setLeagueId={(id) => { setLeagueId(id); setTeam1(null); setTeam2(null); }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TeamSearchSlot label="Team 1" color="#4ade80" leagueId={leagueId} team={team1} setTeam={setTeam1} />
        <TeamSearchSlot label="Team 2" color="#f59e0b" leagueId={leagueId} team={team2} setTeam={setTeam2} />
      </div>

      {team1 && team2 && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  {team1.logo && <img src={team1.logo} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>{team1.name}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#333" }}>VS</div>
                <div style={{ textAlign: "center" }}>
                  {team2.logo && <img src={team2.logo} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: "contain", margin: "0 auto 6px" }} />}
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#f59e0b" }}>{team2.name}</div>
                </div>
              </div>

              <SoloStatRow label="Played" val1={team1.played} val2={team2.played} />
              <SoloStatRow label="Won" val1={team1.won} val2={team2.won} />
              <SoloStatRow label="Goals For" val1={team1.goalsFor} val2={team2.goalsFor} />
              <SoloStatRow label="Goals Against" val1={team1.goalsAgainst} val2={team2.goalsAgainst} higherIsBetter={false} />
              <SoloStatRow label="Clean Sheets" val1={team1.cleanSheets} val2={team2.cleanSheets} />
              <SoloStatRow label="Avg Possession" val1={team1.avgPossession} val2={team2.avgPossession} />
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── BEST OF EUROPE (CROSS-LEAGUE TOP TEAMS) ─────────────────────────────────
function BestOfEuropeGraphic() {
  const cardRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const EURO_LEAGUES = ["pl", "laliga", "seriea", "bundesliga", "ligue1"];

  const load = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const results = await Promise.allSettled(
        EURO_LEAGUES.map(id => fetch(`/api/team-stats?mode=leaguetop&leagueId=${id}`).then(r => r.json()).then(d => ({ id, ...d })))
      );
      const top = results
        .filter(r => r.status === "fulfilled" && r.value.available)
        .map(r => r.value.team)
        .filter(Boolean);
      if (!top.length) throw new Error("No standings data available yet");
      top.sort((a, b) => (b.points || 0) - (a.points || 0));
      setData(top);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-best-of-europe.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={load} disabled={loading} style={{ background: "#4ade80", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "10px" }}>
        {loading ? "Loading..." : "Load Best of Europe"}
      </button>
      {error && <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>}

      {data && (
        <>
          <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
            <div style={{ padding: "22px 18px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>🌍 Best of Europe — League Leaders</span>
              </div>
              {data.map((team, i) => (
                <div key={team.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < data.length - 1 ? "1px solid #1a1a2a" : "none" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#818cf8", width: 20 }}>{i + 1}</span>
                  {team.logo && <img src={team.logo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, objectFit: "contain" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0" }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: "#e2e8f0" }}>{team.league}</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>{team.points} pts</span>
                </div>
              ))}
            </div>
          </GraphicCard>
          <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
            {downloading ? "Generating..." : "⬇ Download PNG"}
          </button>
          <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
            {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── ZONE OF INFLUENCE (MANUAL HEATMAP) ──────────────────────────────────────
const ZONE_PRESETS = {
  "Deep Playmaker": [[10, 60], [20, 40], [20, 80], [35, 60]],
  "Box-to-Box": [[30, 60], [50, 60], [65, 40], [65, 80]],
  "Wide Winger": [[60, 15], [75, 15], [85, 10], [70, 25]],
  "Advanced Striker": [[80, 60], [90, 45], [90, 75], [95, 60]],
  "Wing-Back": [[40, 10], [55, 10], [45, 5], [60, 15]],
};

function intensityFor(x, y, points) {
  let maxD = 0;
  points.forEach(([px, py]) => {
    const d = Math.hypot(x - px, y - py);
    if (d > maxD) maxD = d;
  });
  return maxD;
}

function ZoneOfInfluenceGraphic() {
  const cardRef = useRef(null);
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [preset, setPreset] = useState("Box-to-Box");
  const [downloading, setDownloading] = useState(false);

  const points = ZONE_PRESETS[preset];

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-zone-of-influence-${playerName || "player"}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input placeholder="Player name" value={playerName} onChange={e => setPlayerName(e.target.value)} style={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 12px", outline: "none", fontFamily: "inherit" }} />
      <input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} style={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 12px", outline: "none", fontFamily: "inherit" }} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.keys(ZONE_PRESETS).map(p => (
          <button key={p} onClick={() => setPreset(p)} style={{ background: preset === p ? "#4ade8022" : "none", border: `1px solid ${preset === p ? "#4ade80" : "#2a2a3a"}`, borderRadius: 16, color: preset === p ? "#4ade80" : "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "5px 12px" }}>
            {p}
          </button>
        ))}
      </div>

      <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
        <div style={{ padding: "22px 18px 18px" }}>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>🗺 Zone of Influence</span>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f0f0f0", marginTop: 4 }}>{playerName || "Player Name"}</div>
            <div style={{ fontSize: 12, color: "#e2e8f0" }}>{teamName || "Team"}</div>
          </div>

          <svg viewBox="0 0 100 70" style={{ width: "100%", background: "#0B1F17", borderRadius: 8 }}>
            <rect x="1" y="1" width="98" height="68" fill="none" stroke="#2a4a3a" strokeWidth="0.5" />
            <line x1="50" y1="1" x2="50" y2="69" stroke="#2a4a3a" strokeWidth="0.5" />
            <circle cx="50" cy="35" r="8" fill="none" stroke="#2a4a3a" strokeWidth="0.5" />
            <rect x="1" y="20" width="14" height="30" fill="none" stroke="#2a4a3a" strokeWidth="0.5" />
            <rect x="85" y="20" width="14" height="30" fill="none" stroke="#2a4a3a" strokeWidth="0.5" />
            {Array.from({ length: 20 }).map((_, i) =>
              Array.from({ length: 14 }).map((_, j) => {
                const x = i * 5 + 2.5, y = j * 5 + 2.5;
                const d = intensityFor(x, y, points);
                const opacity = Math.max(0, 1 - d / 35);
                if (opacity < 0.05) return null;
                return <rect key={`${i}-${j}`} x={x - 2.5} y={y - 2.5} width="5" height="5" fill="#4ade80" opacity={opacity * 0.7} />;
              })
            )}
            <polygon points={points.map(p => p.join(",")).join(" ")} fill="#4ade8033" stroke="#4ade80" strokeWidth="0.8" />
          </svg>
          <div style={{ fontSize: 12, color: "#e2e8f0", textAlign: "center", marginTop: 8 }}>{preset} zone — analyst's read, not tracking data</div>
        </div>
      </GraphicCard>
      <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
        {downloading ? "Generating..." : "⬇ Download PNG"}
      </button>
      <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
        {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
      </button>
    </div>
  );
}

// ─── QUICK VS (FAST ATTACKER-VS-DEFENDER CARD) ───────────────────────────────
function QuickVSGraphic() {
  const cardRef = useRef(null);
  const [name1, setName1] = useState("");
  const [team1, setTeam1] = useState("");
  const [stat1, setStat1] = useState("");
  const [label1, setLabel1] = useState("Goals");
  const [name2, setName2] = useState("");
  const [team2, setTeam2] = useState("");
  const [stat2, setStat2] = useState("");
  const [label2, setLabel2] = useState("Tackles");
  const [downloading, setDownloading] = useState(false);

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-quick-vs-${name1 || "p1"}-vs-${name2 || "p2"}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const inputStyle = { background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 15, padding: "8px 10px", outline: "none", fontFamily: "inherit", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700, textTransform: "uppercase" }}>Player 1</div>
          <input placeholder="Name" value={name1} onChange={e => setName1(e.target.value)} style={inputStyle} />
          <input placeholder="Team" value={team1} onChange={e => setTeam1(e.target.value)} style={inputStyle} />
          <input placeholder="Stat label (e.g. Goals)" value={label1} onChange={e => setLabel1(e.target.value)} style={inputStyle} />
          <input placeholder="Value" value={stat1} onChange={e => setStat1(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>Player 2</div>
          <input placeholder="Name" value={name2} onChange={e => setName2(e.target.value)} style={inputStyle} />
          <input placeholder="Team" value={team2} onChange={e => setTeam2(e.target.value)} style={inputStyle} />
          <input placeholder="Stat label (e.g. Tackles)" value={label2} onChange={e => setLabel2(e.target.value)} style={inputStyle} />
          <input placeholder="Value" value={stat2} onChange={e => setStat2(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
        <div style={{ padding: "26px 18px" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>⚡ Quick VS</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>{name1 || "Player 1"}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 10 }}>{team1 || "Team"}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#f0f0f0" }}>{stat1 || "—"}</div>
              <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>{label1}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#333", padding: "0 10px" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b" }}>{name2 || "Player 2"}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 10 }}>{team2 || "Team"}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#f0f0f0" }}>{stat2 || "—"}</div>
              <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>{label2}</div>
            </div>
          </div>
        </div>
      </GraphicCard>
      <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
        {downloading ? "Generating..." : "⬇ Download PNG"}
      </button>
      <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
        {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
      </button>
    </div>
  );
}

// ─── BEYOND THE SCORESHEET (UNSUNG PERFORMANCE SPOTLIGHT) ────────────────────
function BeyondScoresheetGraphic() {
  const cardRef = useRef(null);
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [blurb, setBlurb] = useState("");
  const [stat1, setStat1] = useState("");
  const [statLabel1, setStatLabel1] = useState("");
  const [stat2, setStat2] = useState("");
  const [statLabel2, setStatLabel2] = useState("");
  const [stat3, setStat3] = useState("");
  const [statLabel3, setStatLabel3] = useState("");
  const [downloading, setDownloading] = useState(false);

  const download = async (transparent = false) => {
    setDownloading(true);
    try {
      await downloadCardImage(cardRef.current, `deep433-beyond-scoresheet-${name || "player"}.png`, undefined, transparent);
    } catch { alert("Download failed"); }
    setDownloading(false);
  };

  const inputStyle = { background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 15, padding: "8px 10px", outline: "none", fontFamily: "inherit", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input placeholder="Player name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input placeholder="Team" value={team} onChange={e => setTeam(e.target.value)} style={inputStyle} />
        <input placeholder="Role (e.g. Holding Midfielder)" value={role} onChange={e => setRole(e.target.value)} style={inputStyle} />
      </div>
      <textarea placeholder="Why this performance mattered..." value={blurb} onChange={e => setBlurb(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <input placeholder="Label" value={statLabel1} onChange={e => setStatLabel1(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
          <input placeholder="Value" value={stat1} onChange={e => setStat1(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <input placeholder="Label" value={statLabel2} onChange={e => setStatLabel2(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
          <input placeholder="Value" value={stat2} onChange={e => setStat2(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <input placeholder="Label" value={statLabel3} onChange={e => setStatLabel3(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
          <input placeholder="Value" value={stat3} onChange={e => setStat3(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <GraphicCard cardRef={cardRef} label="Tap Download to save and share">
        <div style={{ padding: "24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>🔍 Beyond The Scoresheet</span>
          </div>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#f0f0f0" }}>{name || "Player Name"}</div>
            <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>{team || "Team"} · {role || "Role"}</div>
          </div>
          {blurb && (
            <div style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.5, textAlign: "center", marginBottom: 16, fontStyle: "italic" }}>
              "{blurb}"
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, borderTop: "1px solid #1a1a2a", paddingTop: 14 }}>
            {[[statLabel1, stat1], [statLabel2, stat2], [statLabel3, stat3]].map(([lbl, val], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>{val || "—"}</div>
                <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700, textTransform: "uppercase" }}>{lbl || "Stat"}</div>
              </div>
            ))}
          </div>
        </div>
      </GraphicCard>
      <button onClick={download} disabled={downloading} style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)", border: "none", borderRadius: 8, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 800, padding: "12px", width: "100%" }}>
        {downloading ? "Generating..." : "⬇ Download PNG"}
      </button>
      <button onClick={() => download(true)} disabled={downloading} style={{ background: "none", border: "1px dashed #666", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px", width: "100%", marginTop: 6 }}>
        {downloading ? "Generating..." : "⬇ Download Transparent PNG"}
      </button>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function DataGraphics({ history = [], supabase }) {
  const [activeSection, setActiveSection] = useState("matchstats");

  const sections = [
    { id: "matchstats", label: "📊 Match Stats" },
    { id: "playerratings", label: "⭐ Player Ratings" },
    { id: "leaderboard", label: "🏆 Leaderboard" },
    { id: "teamstats", label: "📈 Team Stats" },
    { id: "teamcompare", label: "⚔️ Team Compare" },
    { id: "recap", label: "🤖 Recap" },
    { id: "bracket", label: "🏟️ Bracket" },
    { id: "insights", label: "🧠 Deep Insights" },
    { id: "pitchview", label: "🟩 Pitch View" },
    { id: "playerh2h", label: "🆚 Player H2H" },
    { id: "matchh2h", label: "🥊 Match H2H" },
    { id: "goldenglove", label: "🧤 Golden Glove" },
    { id: "transferfit", label: "🔁 Transfer Fit" },
    { id: "goaltiming", label: "⏱ Goal Timing" },
    { id: "halftime", label: "⏸ Halftime Recap" },
    { id: "besteurope", label: "🌍 Best of Europe" },
    { id: "zoneofinfluence", label: "🗺 Zone of Influence" },
    { id: "quickvs", label: "⚡ Quick VS" },
    { id: "beyondscoresheet", label: "🔍 Beyond The Scoresheet" },
    { id: "passing", label: "🔁 Passing Breakdown" },
    { id: "shotplacement", label: "🎯 Shot Placement" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 4 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              background: activeSection === s.id ? "#C8FF4D" : "#1a1a24",
              border: "none", borderRadius: 20,
              color: activeSection === s.id ? "#0a0a0f" : "#e2e8f0",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              padding: "7px 14px",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "matchstats" && <MatchStatsGraphic />}
      {activeSection === "playerratings" && <PlayerRatingsGraphic />}
      {activeSection === "leaderboard" && <TopScorersGraphic />}
      {activeSection === "teamstats" && <TeamStatsGraphic />}
      {activeSection === "teamcompare" && <TeamStatsCompareGraphic />}
      {activeSection === "recap" && <RecapGraphic history={history} supabase={supabase} />}
      {activeSection === "bracket" && <BracketGraphic />}
      {activeSection === "insights" && <DeepInsightsGraphic />}
      {activeSection === "pitchview" && <MatchPitchViewGraphic />}
      {activeSection === "playerh2h" && <PlayerH2HGraphic />}
      {activeSection === "matchh2h" && <MatchH2HGraphic />}
      {activeSection === "goldenglove" && <GoldenGloveGraphic />}
      {activeSection === "transferfit" && <TransferFitGraphic />}
      {activeSection === "goaltiming" && <GoalTimingGraphic />}
      {activeSection === "halftime" && <HalftimeRecapGraphic />}
      {activeSection === "besteurope" && <BestOfEuropeGraphic />}
      {activeSection === "zoneofinfluence" && <ZoneOfInfluenceGraphic />}
      {activeSection === "quickvs" && <QuickVSGraphic />}
      {activeSection === "beyondscoresheet" && <BeyondScoresheetGraphic />}
      {activeSection === "passing" && <PassingBreakdownGraphic />}
      {activeSection === "shotplacement" && <ShotPlacementGraphic />}
    </div>
  );
}

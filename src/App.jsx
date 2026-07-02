import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://idisdztwpvedtnroiian.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXNkenR3cHZlZHRucm9paWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTczOTQsImV4cCI6MjA5NzAzMzM5NH0.YmF0DqWmopuJs9Ci1hdFi0XDMoWRD0yfVwOuuG7WVyE"
);

const LEAGUES = [
  { id: "wc2026", label: "🏆 World Cup 2026", short: "World Cup 2026" },
  { id: "pl", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League", short: "Premier League" },
  { id: "laliga", label: "🇪🇸 La Liga", short: "La Liga" },
  { id: "seriea", label: "🇮🇹 Serie A", short: "Serie A" },
  { id: "bundesliga", label: "🇩🇪 Bundesliga", short: "Bundesliga" },
  { id: "ligue1", label: "🇫🇷 Ligue 1", short: "Ligue 1" },
  { id: "ucl", label: "⭐ Champions League", short: "Champions League" },
  { id: "uel", label: "🟠 Europa League", short: "Europa League" },
  { id: "facup", label: "🏆 FA Cup", short: "FA Cup" },
  { id: "copadelrey", label: "👑 Copa del Rey", short: "Copa del Rey" },
  { id: "afcon", label: "🌍 AFCON", short: "AFCON" },
  { id: "copamerica", label: "🌎 Copa America", short: "Copa America" },
];

const WC_FIXTURES = [
  { date: "Sun 28 Jun", kickoff: "2026-06-28T19:00:00Z", home: "South Africa", away: "Canada", group: "Round of 32", venue: "SoFi Stadium" },
  { date: "Mon 29 Jun", kickoff: "2026-06-29T17:00:00Z", home: "Brazil", away: "Japan", group: "Round of 32", venue: "NRG Stadium" },
  { date: "Mon 29 Jun", kickoff: "2026-06-29T20:30:00Z", home: "Germany", away: "Paraguay", group: "Round of 32", venue: "Gillette Stadium" },
  { date: "Tue 30 Jun", kickoff: "2026-06-30T01:00:00Z", home: "Netherlands", away: "Morocco", group: "Round of 32", venue: "Estadio BBVA" },
  { date: "Tue 30 Jun", kickoff: "2026-06-30T17:00:00Z", home: "Côte d'Ivoire", away: "Norway", group: "Round of 32", venue: "AT&T Stadium" },
  { date: "Tue 30 Jun", kickoff: "2026-06-30T21:00:00Z", home: "France", away: "Sweden", group: "Round of 32", venue: "MetLife Stadium" },
  { date: "Wed 1 Jul", kickoff: "2026-07-01T01:00:00Z", home: "Mexico", away: "Ecuador", group: "Round of 32", venue: "Estadio Azteca" },
  { date: "Wed 1 Jul", kickoff: "2026-07-01T16:00:00Z", home: "England", away: "Congo DR", group: "Round of 32", venue: "Mercedes-Benz Stadium" },
  { date: "Thu 3 Jul", kickoff: "2026-07-02T21:00:00Z", home: "Portugal", away: "Croatia", group: "Round of 32", venue: "Toronto Stadium" },
  { date: "Thu 2 Jul", kickoff: "2026-07-02T00:00:00Z", home: "USA", away: "Bosnia and Herzegovina", group: "Round of 32", venue: "Levi's Stadium" },
  { date: "Thu 2 Jul", kickoff: "2026-07-02T19:00:00Z", home: "Spain", away: "Austria", group: "Round of 32", venue: "SoFi Stadium" },
  { date: "Fri 3 Jul", kickoff: "2026-07-03T03:00:00Z", home: "Switzerland", away: "Algeria", group: "Round of 32", venue: "BC Place" },
  { date: "Fri 3 Jul", kickoff: "2026-07-03T18:00:00Z", home: "Australia", away: "Egypt", group: "Round of 32", venue: "AT&T Stadium" },
  { date: "Fri 3 Jul", kickoff: "2026-07-03T22:00:00Z", home: "Argentina", away: "Cabo Verde", group: "Round of 32", venue: "Hard Rock Stadium" },
  { date: "Sat 4 Jul", kickoff: "2026-07-04T01:30:00Z", home: "Colombia", away: "Ghana", group: "Round of 32", venue: "Arrowhead Stadium" },
];

const BADGE_DEFS = [
  { icon: "⚽", name: "Sunday League Scout", desc: "First prediction made", color: "#888", condition: (s) => s.total >= 1 },
  { icon: "🤖", name: "AI Beater", desc: "Beat the AI once", color: "#60a5fa", condition: (s) => s.beatAI >= 1 },
  { icon: "🎯", name: "Sharp Eye", desc: "Beat the AI 3 times", color: "#a78bfa", condition: (s) => s.beatAI >= 3 },
  { icon: "🔥", name: "On Fire", desc: "Beat the AI 5 times", color: "#f97316", condition: (s) => s.beatAI >= 5 },
  { icon: "🧠", name: "Analyst", desc: "Beat the AI 10 times", color: "#4ade80", condition: (s) => s.beatAI >= 10 },
  { icon: "👑", name: "AI Destroyer", desc: "Beat the AI 20 times", color: "#fbbf24", condition: (s) => s.beatAI >= 20 },
];

function getRank(stats) {
  const earned = BADGE_DEFS.filter(b => b.condition(stats));
  return earned.length > 0 ? earned[earned.length - 1] : null;
}

function computeStats(history) {
  const verified = history.filter(h => h.actual_score);
  const userCorrect = verified.filter(h => h.user_prediction === h.actual_score).length;
  const aiCorrect = verified.filter(h => h.ai_prediction === h.actual_score).length;
  const beatAI = verified.filter(h => h.result === "user").length;
  return { total: history.length, verified: verified.length, userCorrect, aiCorrect, beatAI };
}

const TEAM_FLAGS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Korea Republic": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "USA": "🇺🇸", "Paraguay": "🇵🇾",
  "Qatar": "🇶🇦", "Switzerland": "🇨🇭", "Brazil": "🇧🇷", "Morocco": "🇲🇦",
  "Haiti": "🇭🇹", "Scotland": "🏴 SCO", "Australia": "🇦🇺", "Türkiye": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Côte d'Ivoire": "🇨🇮", "Ecuador": "🇪🇨", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cabo Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "England": "🏴 ENG", "Croatia": "🇭🇷",
  "Ghana": "🇬🇭", "Panama": "🇵🇦", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
};


function PitchView({ homeTeam, awayTeam, homeFormation, awayFormation, homeLineupNames, awayLineupNames, lineupSource }) {
  const homeFlag = TEAM_FLAGS[homeTeam] || "🏳️";
  const awayFlag = TEAM_FLAGS[awayTeam] || "🏳️";

  const parseFormation = (f) => {
    if (!f) return [4, 3, 3];
    return f.split("-").map(Number);
  };

  const hForm = parseFormation(homeFormation);
  const aForm = parseFormation(awayFormation);

  const surname = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1];
  };

  const splitIntoRows = (names, formation) => {
    if (!names || !names.length) return [];
    const rows = [1, ...formation];
    const result = [];
    let idx = 0;
    rows.forEach((count, rowIdx) => {
      const rowNames = names.slice(idx, idx + count);
      const label = rowIdx === 0 ? "GK" : rowIdx === rows.length - 1 ? "ATT" : rowIdx === 1 ? "DEF" : "MID";
      result.push({ label, names: rowNames });
      idx += count;
    });
    return result;
  };

  const homeRows = splitIntoRows(homeLineupNames, hForm);
  const awayRows = splitIntoRows(awayLineupNames, aForm);

  const PlayerRow = ({ row, border, flag, isAway }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginBottom: 8 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: isAway ? "#ffffff" : border, letterSpacing: 1, textTransform: "uppercase", opacity: 0.8 }}>{row.label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 5 }}>
        {row.names.map((name, i) => (
          <div key={i} style={{ background: "rgba(0,0,0,0.82)", border: "1px solid " + border + "66", borderRadius: 4, padding: "4px 10px", fontSize: 14, fontWeight: 700, color: isAway ? "#a855f7" : "#ffffff", whiteSpace: "nowrap" }}>
            {name ? surname(name) : flag}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", borderRadius: 10, overflow: "hidden" }}>
      {lineupSource && (
        <div style={{ textAlign: "center", padding: "6px", background: "#0d0d18" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: lineupSource === "confirmed" ? "#22c55e22" : "#f59e0b22", color: lineupSource === "confirmed" ? "#4ade80" : "#f59e0b", border: "1px solid " + (lineupSource === "confirmed" ? "#22c55e44" : "#f59e0b44") }}>
            {lineupSource === "confirmed" ? "✓ CONFIRMED LINEUP" : "LIKELY LINEUP"}
          </span>
        </div>
      )}

      <div style={{ background: "repeating-linear-gradient(180deg,#1a7a1a 0px,#1a7a1a 28px,#1f8c1f 28px,#1f8c1f 56px)", padding: "12px 14px 8px" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", background: "rgba(0,0,0,0.65)", padding: "4px 12px", borderRadius: 6 }}>{homeFlag} {homeTeam} · {homeFormation || "4-3-3"}</span>
        </div>
        {homeRows.map((row, i) => <PlayerRow key={i} row={row} border="#4ade80" flag={homeFlag} isAway={false} />)}
      </div>

      <div style={{ background: "#0d0d18", display: "flex", alignItems: "center", gap: 8, padding: "5px 14px" }}>
        <div style={{ flex: 1, height: 1, background: "#1e1e30" }} />
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "2px solid #2a2a4a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, height: 1, background: "#1e1e30" }} />
      </div>

      <div style={{ background: "repeating-linear-gradient(180deg,#1f8c1f 0px,#1f8c1f 28px,#1a7a1a 28px,#1a7a1a 56px)", padding: "8px 14px 12px" }}>
        {[...awayRows].reverse().map((row, i) => <PlayerRow key={i} row={row} border="#a855f7" flag={awayFlag} isAway={true} />)}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", background: "rgba(0,0,0,0.65)", padding: "4px 12px", borderRadius: 6 }}>{awayFlag} {awayTeam} · {awayFormation || "4-3-3"}</span>
        </div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleEmail = async () => {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://deep433.com" } });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚽</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", textShadow: "0 0 30px rgba(74,222,128,0.4)" }}>DEEP433</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>PUNDITS VS FANS · PREDICT NOW</div>
        </div>
        <div style={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 16, padding: 24 }}>
          <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", background: "#fff", border: "none", borderRadius: 10, color: "#111", cursor: "pointer", fontSize: 15, fontWeight: 700, padding: "13px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit" }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e30" }} />
            <span style={{ color: "#555", fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e30" }} />
          </div>
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 10, color: "#f0f0f0", fontSize: 15, padding: "12px 16px", outline: "none", marginBottom: 10, fontFamily: "inherit" }}/>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmail()} style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 10, color: "#f0f0f0", fontSize: 15, padding: "12px 16px", outline: "none", marginBottom: 16, fontFamily: "inherit" }}/>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {message && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>{message}</div>}
          <button onClick={handleEmail} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #4ade80, #22c55e)", border: "none", borderRadius: 10, color: "#0a0f0a", fontSize: 16, fontWeight: 800, padding: "13px", cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
            {mode === "login" ? (<>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>Sign up free</button></>) : (<>Already have an account? <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>Sign in</button></>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FootballPredictor() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [tab, setTab] = useState("predict");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [userHome, setUserHome] = useState("");
  const [userAway, setUserAway] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userPrediction, setUserPrediction] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [loggingIdx, setLoggingIdx] = useState(null);
  const [logScore, setLogScore] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState("wc2026");
  const [step, setStep] = useState(1);
  const [fixtureSearch, setFixtureSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [liveData, setLiveData] = useState([]);
  const [liveEvents, setLiveEvents] = useState({});
  const [expandedLive, setExpandedLive] = useState(null); // fixtureId of expanded match
  const [confirmedLineup, setConfirmedLineup] = useState(null);
  const [lineupFetching, setLineupFetching] = useState(false);
  const [viewingPitch, setViewingPitch] = useState(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [savedPredictionId, setSavedPredictionId] = useState(null);
  const [deepInsights, setDeepInsights] = useState(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);

  const isWorldCup = selectedLeague === "wc2026";
  const leagueLabel = LEAGUES.find(l => l.id === selectedLeague)?.short || "World Cup 2026";

  const ESTIMATED_MATCH_MINUTES = 105; // 90 min + halftime/stoppage buffer

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const findFixture = (homeTeam, awayTeam) => {
    const h = normalize(homeTeam);
    const a = normalize(awayTeam);
    return WC_FIXTURES.find(f =>
      (normalize(f.home) === h && normalize(f.away) === a) ||
      (normalize(f.home) === a && normalize(f.away) === h)
    );
  };

  const findLiveFixture = (homeTeam, awayTeam) => {
    const h = normalize(homeTeam);
    const a = normalize(awayTeam);
    return liveData.find(f =>
      (normalize(f.home) === h && normalize(f.away) === a) ||
      (normalize(f.home) === a && normalize(f.away) === h)
    );
  };

  const getMatchStatus = (homeTeam, awayTeam) => {
    const live = findLiveFixture(homeTeam, awayTeam);
    if (live) return live.status; // "upcoming" | "live" | "finished" — straight from the API

    const fixture = findFixture(homeTeam, awayTeam);
    if (!fixture || !fixture.kickoff) return "unknown";
    const now = new Date();
    const kickoff = new Date(fixture.kickoff);
    const finish = new Date(kickoff.getTime() + ESTIMATED_MATCH_MINUTES * 60000);
    if (now < kickoff) return "upcoming";
    if (now < finish) return "live";
    return "finished";
  };

  const isLocked = (homeTeam, awayTeam) => {
    const status = getMatchStatus(homeTeam, awayTeam);
    return status === "live" || status === "finished";
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setAuthLoading(false);
      if (session) loadHistory(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadHistory(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Poll live scores every 3 minutes for the currently selected league
  useEffect(() => {
    if (!session) return;

    const fetchLive = async () => {
      const today = new Date().toISOString().split("T")[0];
      try {
        const res = await fetch(`/api/live-scores?leagueId=${selectedLeague}&date=${today}`);
        if (!res.ok) return; // league not supported on free tier, or other error — fail quietly
        const data = await res.json();
        setLiveData(data.fixtures || []);
      } catch {
        // network error — keep using whatever liveData we already have
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, selectedLeague]);

  // matches that don't have a logged result yet, and fill it in automatically.
  useEffect(() => {
    if (!liveData.length || !history.length) return;

    history.forEach(h => {
      if (h.actual_score) return; // already logged

      const live = findLiveFixture(h.home_team, h.away_team);
      if (!live || live.status !== "finished") return;
      if (live.score.home == null || live.score.away == null) return;

      const score = `${live.score.home}-${live.score.away}`;
      logResult(h.id, score);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData, history]);

  const loadHistory = async (userId) => {
    const { data } = await supabase.from("predictions").select("*, confirmed_lineup").eq("user_id", userId).order("created_at", { ascending: false });
    if (data) setHistory(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setHistory([]); setStep(1); setResult(null);
    setHomeTeam(""); setAwayTeam("");
  };

  const stats = computeStats(history);
  const rank = getRank(stats);
  const badges = BADGE_DEFS.map(b => ({ ...b, earned: b.condition(stats) }));

  const confidenceColor = (c) => c === "High" ? "#22c55e" : c === "Medium" ? "#f59e0b" : "#ef4444";
  const outcomeColor = (o) => o === "Home Win" ? "#60a5fa" : o === "Away Win" ? "#f87171" : "#a78bfa";
  const resultColor = (r) => r === "user" ? "#4ade80" : r === "ai" ? "#f87171" : r === "tie" ? "#f59e0b" : "#555";

  const selectFixture = (fix) => {
    setHomeTeam(fix.home);
    setAwayTeam(fix.away);
    setFixtureSearch("");
  };

  const hasExistingPrediction = (homeTeam, awayTeam) => {
    const h = normalize(homeTeam);
    const a = normalize(awayTeam);
    return history.some(item =>
      (normalize(item.home_team) === h && normalize(item.away_team) === a) ||
      (normalize(item.home_team) === a && normalize(item.away_team) === h)
    );
  };

  const goToStep2 = () => {
    if (!homeTeam || !awayTeam) { setError("Enter both team names."); return; }
    if (hasExistingPrediction(homeTeam, awayTeam)) {
      setError("You've already predicted this match — check History to edit it.");
      return;
    }
    const status = getMatchStatus(homeTeam, awayTeam);
    if (status === "live") { setError("This match is already in progress — predictions are closed."); return; }
    if (status === "finished") { setError("This match has finished — predictions are closed."); return; }
    setError(""); setStep(2);
  };

  const submitAndReveal = async () => {
    if (userHome === "" || userAway === "") { setError("Enter your predicted score."); return; }
    const up = `${userHome}-${userAway}`;
    setUserPrediction(up);
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam, awayTeam, league: leagueLabel, fixtureId: selectedFixtureId || findLiveFixture(homeTeam, awayTeam)?.fixtureId || null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Error ${res.status}`); }
      const parsed = await res.json();
      setResult(parsed);
      setStep(3);
      const aiPrediction = (parsed.scoreline || "").replace(" - ", "-").replace(" – ", "-");
      const { data: saved } = await supabase.from("predictions").insert({
        user_id: session.user.id, home_team: homeTeam, away_team: awayTeam,
        user_prediction: up, ai_prediction: aiPrediction, ai_verdict: parsed.verdict,
        ai_data: parsed,
      }).select().single();
      if (saved) {
        setHistory(prev => [saved, ...prev]);
        setSavedPredictionId(saved.id);
      }
    } catch (e) { setError(e.message || "Something went wrong. Try again."); }
    setLoading(false);
  };

  const resetPredict = () => {
    setStep(1); setResult(null); setHomeTeam(""); setAwayTeam("");
    setUserHome(""); setUserAway(""); setUserPrediction(""); setError(""); setFixtureSearch("");
    setSelectedFixtureId(null); setDeepInsights(null);
  };

  const logResult = async (id, score) => {
    const item = history.find(h => h.id === id);
    if (!item) return;
    try {
      const [uh, ua] = item.user_prediction.split("-").map(Number);
      const [ah, aa] = item.ai_prediction.split("-").map(Number);
      const [rh, ra] = score.split("-").map(Number);
      const userDiff = Math.abs(uh-rh)+Math.abs(ua-ra);
      const aiDiff = Math.abs(ah-rh)+Math.abs(aa-ra);
      const r = userDiff < aiDiff ? "user" : aiDiff < userDiff ? "ai" : "tie";
      await supabase.from("predictions").update({ actual_score: score, result: r }).eq("id", id);
      setHistory(prev => prev.map(h => h.id === id ? { ...h, actual_score: score, result: r } : h));
    } catch {}
    setLoggingIdx(null); setLogScore("");
  };

  const deletePredict = async (id) => {
    await supabase.from("predictions").delete().eq("id", id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const editPredict = async (id, newScore) => {
    await supabase.from("predictions").update({ user_prediction: newScore }).eq("id", id);
    setHistory(prev => prev.map(h => h.id === id ? { ...h, user_prediction: newScore } : h));
    setLoggingIdx(null); setLogScore("");
  };

  const shareText = result && userPrediction ? `⚽ DEEP433 — YOU vs AI\n${leagueLabel}: ${homeTeam} vs ${awayTeam}\n\nMy prediction: ${userPrediction}\nAI prediction: ${result.scoreline}\n\n"${result.verdict?.slice(0, 100)}..."\n\nChallenge the AI at deep433.com` : "";
  const copyShare = () => { navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  // Group fixtures by date, filtered by search
  const filteredFixtures = fixtureSearch.trim()
    ? WC_FIXTURES.filter(f => f.home.toLowerCase().includes(fixtureSearch.toLowerCase()) || f.away.toLowerCase().includes(fixtureSearch.toLowerCase()))
    : WC_FIXTURES;

  const fixturesByDate = filteredFixtures.reduce((acc, f) => {
    if (!acc[f.date]) acc[f.date] = [];
    acc[f.date].push(f);
    return acc;
  }, {});

  // Look up fixtureId whenever home/away/league changes — try live data first, then API
  useEffect(() => {
    if (!homeTeam || !awayTeam || !session) return;
    const live = findLiveFixture(homeTeam, awayTeam);
    if (live?.fixtureId) { setSelectedFixtureId(live.fixtureId); return; }
    const fetchFixtureId = async () => {
      const now = new Date();
      const dates = [
        now.toISOString().split("T")[0],
        new Date(now.getTime() + 86400000).toISOString().split("T")[0],
        new Date(now.getTime() + 172800000).toISOString().split("T")[0],
      ];
      for (const date of dates) {
        try {
          const res = await fetch(`/api/live-scores?leagueId=${selectedLeague}&date=${date}`);
          const data = await res.json();
          const h = homeTeam.toLowerCase().replace(/[^a-z0-9]/g, "");
          const a = awayTeam.toLowerCase().replace(/[^a-z0-9]/g, "");
          const match = (data.fixtures || []).find(f =>
            (f.home.toLowerCase().replace(/[^a-z0-9]/g, "") === h && f.away.toLowerCase().replace(/[^a-z0-9]/g, "") === a) ||
            (f.home.toLowerCase().replace(/[^a-z0-9]/g, "") === a && f.away.toLowerCase().replace(/[^a-z0-9]/g, "") === h)
          );
          if (match?.fixtureId) { setSelectedFixtureId(match.fixtureId); return; }
        } catch {}
      }
      setSelectedFixtureId(null);
    };
    fetchFixtureId();
  }, [homeTeam, awayTeam, selectedLeague, session]);

  const fetchConfirmedLineup = async (home, away, league, predictionId) => {
    setLineupFetching(true);

    // Find the prediction ID — use passed ID, savedPredictionId, or look up from history
    const pid = predictionId || savedPredictionId || (() => {
      const h = normalize(home);
      const a = normalize(away);
      const match = history.find(item =>
        (normalize(item.home_team) === h && normalize(item.away_team) === a) ||
        (normalize(item.home_team) === a && normalize(item.away_team) === h)
      );
      return match?.id || null;
    })();
    const now = new Date();
    const dates = [
      new Date(now.getTime() - 86400000).toISOString().split("T")[0],
      now.toISOString().split("T")[0],
      new Date(now.getTime() + 86400000).toISOString().split("T")[0],
    ];
    for (const date of dates) {
      try {
        const res = await fetch(`/api/match-lineup?leagueId=${league}&date=${date}&home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`);
        const data = await res.json();
        if (data.available) {
          setConfirmedLineup(data);
          // Also update viewingPitch so the modal re-renders with confirmed data immediately
          setViewingPitch(prev => prev ? { ...prev, confirmed_lineup: data } : prev);
          // Save to localStorage as reliable fallback
          try {
            localStorage.setItem(`lineup_${home}_${away}`, JSON.stringify(data));
          } catch {}
          if (pid) {
            const { error } = await supabase.from("predictions")
              .update({ confirmed_lineup: data })
              .eq("id", pid);
            if (!error) {
              setHistory(prev => prev.map(h => h.id === pid
                ? { ...h, confirmed_lineup: data }
                : h
              ));
            }
          }
          setLineupFetching(false);
          return;
        }
      } catch {}
    }
    setLineupFetching(false);
  };

  // Once a prediction reveals (step 3), try fetching the real confirmed lineup.
  useEffect(() => {
    if (step !== 3 || !result) return;
    setDeepInsights(null);

    // Check if we already have a saved confirmed lineup in history
    const existingPrediction = savedPredictionId
      ? history.find(h => h.id === savedPredictionId)
      : null;

    if (existingPrediction?.confirmed_lineup) {
      setConfirmedLineup(existingPrediction.confirmed_lineup);
    } else {
      setConfirmedLineup(null);
      fetchConfirmedLineup(homeTeam, awayTeam, selectedLeague, savedPredictionId);
    }

    // Also fetch deep insights if we have a fixtureId
    const fid = selectedFixtureId || findLiveFixture(homeTeam, awayTeam)?.fixtureId;
    if (fid) {
      fetch(`/api/fixture-insights?fixtureId=${fid}`)
        .then(r => r.json())
        .then(data => { if (data.available) setDeepInsights(data); })
        .catch(() => {});
    }
  }, [step, result, homeTeam, awayTeam, selectedLeague]);

  const capStat = (val) => {
    if (!val) return val;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    const capped = Math.min(Math.max(num, 20), 70);
    return capped + '%';
  };

  const TABS = [
    { id: "predict", label: "⚡ Predict" },
    { id: "standings", label: "🏆 You vs AI" },
    { id: "badges", label: "🏅 Badges" },
    { id: "history", label: "📋 History" },
  ];

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #1e1e30", borderTop: "3px solid #4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) {
    if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    return <AuthScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .glow { text-shadow: 0 0 30px rgba(74,222,128,0.4); }
        .card { background: #13131f; border: 1px solid #1e1e30; border-radius: 14px; padding: 20px; }
        .score-input { background: #1a1a24; border: 2px solid #2a2a3a; border-radius: 10px; color: #f0f0f0; font-size: 32px; font-weight: 900; padding: 12px; width: 75px; outline: none; text-align: center; font-family: inherit; transition: border-color 0.2s; -moz-appearance: textfield; }
        .score-input::-webkit-outer-spin-button, .score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .score-input:focus { border-color: #4ade80; }
        .team-input { background: #1a1a24; border: 1.5px solid #2a2a3a; border-radius: 10px; color: #f0f0f0; font-size: 15px; padding: 12px 16px; width: 100%; outline: none; font-family: inherit; transition: border-color 0.2s; }
        .team-input:focus { border-color: #4ade80; }
        .team-input.away:focus { border-color: #f87171; }
        .team-input::placeholder { color: #444; }
        .search-input { background: #1a1a24; border: 1.5px solid #2a2a3a; border-radius: 10px; color: #f0f0f0; font-size: 14px; padding: 10px 14px; width: 100%; outline: none; font-family: inherit; }
        .search-input::placeholder { color: #444; }
        .predict-btn { background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 10px; color: #0a0f0a; font-size: 16px; font-weight: 800; padding: 14px 32px; cursor: pointer; width: 100%; transition: opacity 0.2s; font-family: inherit; }
        .predict-btn:hover { opacity: 0.9; }
        .predict-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ghost-btn { background: none; border: 1.5px solid #2a2a3a; border-radius: 10px; color: #666; font-size: 14px; font-weight: 600; padding: 12px; cursor: pointer; width: 100%; font-family: inherit; }
        .nav-tab { background: none; border: none; border-bottom: 2px solid transparent; color: #555; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; padding: 12px 4px; transition: all 0.15s; white-space: nowrap; }
        .nav-tab.active { border-bottom-color: #4ade80; color: #4ade80; }
        .tag { display: inline-block; border-radius: 6px; font-size: 12px; font-weight: 700; padding: 4px 10px; text-transform: uppercase; }
        .player-chip { background: #1a1a28; border: 1px solid #2a2a40; border-radius: 6px; font-size: 12px; padding: 5px 10px; color: #ccc; }
        .spinner { width: 36px; height: 36px; border: 3px solid #1e1e30; border-top: 3px solid #4ade80; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reveal-box { background: linear-gradient(135deg, #0d1f0d, #0f1a2e); border: 1px solid #2a3a2a; border-radius: 16px; padding: 24px; }
        .history-row { background: #0f0f1a; border: 1px solid #1a1a2a; border-radius: 10px; padding: 12px 14px; }
        .badge-card { background: #13131f; border: 1px solid #1e1e30; border-radius: 12px; padding: 16px 10px; text-align: center; }
        .badge-card.locked { opacity: 0.35; filter: grayscale(1); }
        .copy-btn { background: #4ade80; border: none; border-radius: 8px; color: #0a0f0a; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 800; padding: 12px 24px; width: 100%; transition: opacity 0.2s; }
        .log-input { background: #1a1a24; border: 1.5px solid #2a2a3a; border-radius: 6px; color: #f0f0f0; font-size: 13px; padding: 6px 10px; width: 80px; outline: none; font-family: inherit; text-align: center; }
        .league-btn { background: #1a1a24; border: 1.5px solid #2a2a3a; border-radius: 20px; color: #666; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; padding: 7px 14px; transition: all 0.12s; white-space: nowrap; }
        .league-btn.active { background: #4ade8018; border-color: #4ade80; color: #4ade80; }
        .fixture-row { background: #0f0f1a; border: 1px solid #1a1a2a; border-radius: 10px; padding: 10px 14px; cursor: pointer; transition: border-color 0.15s; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .fixture-row:hover { border-color: #4ade80; }
        .fixture-row.selected { border-color: #4ade80; background: #4ade8008; }
        .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #1a1a2a; transition: background 0.2s; }
        .step-dot.active { background: #4ade80; }
        .step-dot.done { background: #22c55e; }
      `}</style>

      <div style={{ background: "#0d0d18", borderBottom: "1px solid #1a1a2e", padding: "16px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚽</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#4ade80" }} className="glow">DEEP433</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>PUNDITS VS FANS · PREDICT NOW</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {rank && <div style={{ textAlign: "right" }}><div style={{ fontSize: 14 }}>{rank.icon}</div><div style={{ fontSize: 10, color: rank.color, fontWeight: 700 }}>{rank.name}</div></div>}
            <button onClick={signOut} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "5px 10px" }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ background: "#0d0d18", borderBottom: "1px solid #1a1a2e", overflowX: "auto" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", gap: 4, padding: "0 16px" }}>
          {TABS.map(t => <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      {/* Live ticker bar — shows when matches are live */}
      {liveData.filter(f => f.status === "live").length > 0 && (
        <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1a0000" }}>
          {liveData.filter(f => f.status === "live").map(f => (
            <div key={f.fixtureId}>
              {/* Collapsed ticker row */}
              <div
                onClick={() => setExpandedLive(expandedLive === f.fixtureId ? null : f.fixtureId)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", cursor: "pointer", maxWidth: 600, margin: "0 auto" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{f.elapsed}'</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", flex: 1 }}>
                  {f.home} <span style={{ color: "#4ade80" }}>{f.score.home ?? 0}</span>
                  <span style={{ color: "#555", margin: "0 4px" }}>-</span>
                  <span style={{ color: "#4ade80" }}>{f.score.away ?? 0}</span> {f.away}
                </span>
                {f.possession?.home && (
                  <span style={{ fontSize: 10, color: "#555" }}>⚽ {f.possession.home}</span>
                )}
                <span style={{ fontSize: 10, color: "#555" }}>{expandedLive === f.fixtureId ? "▲" : "▼"}</span>
              </div>

              {/* Expanded live card */}
              {expandedLive === f.fixtureId && (
                <div style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", padding: "12px 16px", maxWidth: 600, margin: "0 auto" }}>

                  {/* Score header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>{f.home}</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: "#4ade80" }}>{f.score.home ?? 0}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>🔴 LIVE</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#555" }}>{f.elapsed}'</div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{90 - (f.elapsed || 0) > 0 ? `~${90 - f.elapsed}' left` : f.statusRaw === "ET" ? "Extra time" : "Added time"}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>{f.away}</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: "#f59e0b" }}>{f.score.away ?? 0}</div>
                    </div>
                  </div>

                  {/* Possession bar */}
                  {f.possession?.home && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginBottom: 4 }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>{f.possession.home}</span>
                        <span style={{ color: "#888" }}>Possession</span>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>{f.possession.away}</span>
                      </div>
                      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: f.possession.home, background: "#4ade80" }} />
                        <div style={{ flex: 1, background: "#f59e0b" }} />
                      </div>
                    </div>
                  )}

                  {/* Cards summary */}
                  {(f.cards?.home?.yellow > 0 || f.cards?.away?.yellow > 0 || f.cards?.home?.red > 0 || f.cards?.away?.red > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {Array.from({ length: f.cards?.home?.yellow || 0 }).map((_, i) => <span key={i}>🟨</span>)}
                        {Array.from({ length: f.cards?.home?.red || 0 }).map((_, i) => <span key={i}>🟥</span>)}
                      </div>
                      <div style={{ fontSize: 10, color: "#555" }}>Cards</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {Array.from({ length: f.cards?.away?.yellow || 0 }).map((_, i) => <span key={i}>🟨</span>)}
                        {Array.from({ length: f.cards?.away?.red || 0 }).map((_, i) => <span key={i}>🟥</span>)}
                      </div>
                    </div>
                  )}

                  {/* Events timeline */}
                  {f.events?.length > 0 && (
                    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
                      <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Match Events</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                        {[...f.events].reverse().map((e, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: "#555", minWidth: 32, fontWeight: 700, fontSize: 11 }}>{e.minute}{e.extra}'</span>
                            <span style={{ fontSize: 14 }}>{e.icon}</span>
                            <span style={{ color: "#f0f0f0", fontWeight: 600, flex: 1 }}>{e.label}</span>
                            <span style={{ color: "#444", fontSize: 10 }}>{e.team?.split(" ").slice(-1)[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>
      )}

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {tab === "predict" && (
          <>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[1,2,3].map(s => <div key={s} className={`step-dot${step === s ? " active" : step > s ? " done" : ""}`} />)}
            </div>

            {step === 1 && (
              <div className="card">
                {/* League selector */}
                <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Competition</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {LEAGUES.map(l => (
                    <button key={l.id} className={`league-btn${selectedLeague === l.id ? " active" : ""}`}
                      onClick={() => { setSelectedLeague(l.id); setHomeTeam(""); setAwayTeam(""); setFixtureSearch(""); }}>
                      {l.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Set Up The Match</div>

                {/* Free text inputs always visible */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, marginBottom: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Home / Team 1</div>
                    <input className="team-input" placeholder="e.g. Brazil" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} />
                  </div>
                  <div style={{ color: "#333", fontWeight: 700, textAlign: "center", marginTop: 20 }}>vs</div>
                  <div>
                    <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Away / Team 2</div>
                    <input className="team-input away" placeholder="e.g. Argentina" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} />
                  </div>
                </div>

                {/* World Cup fixture quick-pick */}
                {isWorldCup && (
                  <>
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🏆 Or pick a World Cup fixture</div>
                    <input className="search-input" placeholder="🔍 Search team..." value={fixtureSearch} onChange={e => setFixtureSearch(e.target.value)} style={{ marginBottom: 12 }} />
                    <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {Object.entries(fixturesByDate).map(([date, fixtures]) => (
                        <div key={date}>
                          <div style={{ fontSize: 10, color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 4 }}>{date}</div>
                          {fixtures.map((f, i) => (
                            <div key={i} className={`fixture-row${homeTeam === f.home && awayTeam === f.away ? " selected" : ""}`} onClick={() => {
                              const status = getMatchStatus(f.home, f.away);
                              if (status === "upcoming" || status === "unknown") selectFixture(f);
                            }} style={{ marginBottom: 5, opacity: (getMatchStatus(f.home, f.away) === "finished" || getMatchStatus(f.home, f.away) === "live") ? 0.4 : 1, cursor: (getMatchStatus(f.home, f.away) === "finished" || getMatchStatus(f.home, f.away) === "live") ? "default" : "pointer" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                <span style={{ fontSize: 16 }}>{TEAM_FLAGS[f.home] || "🏳️"}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{f.home}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>vs</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{f.away}</span>
                                <span style={{ fontSize: 16 }}>{TEAM_FLAGS[f.away] || "🏳️"}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#555", minWidth: 60, textAlign: "right" }}>{f.group}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {error && <div style={{ color: "#f87171", fontSize: 13, margin: "12px 0" }}>{error}</div>}
                <button className="predict-btn" onClick={goToStep2} disabled={!homeTeam || !awayTeam} style={{ marginTop: 16 }}>
                  ⚡ Predict This Match
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="card">
                <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Your Prediction</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0", marginBottom: 4 }}>{homeTeam} vs {awayTeam}</div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 28 }}>{leagueLabel}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{homeTeam}</div>
                    <input className="score-input" type="number" min="0" max="20" placeholder="0" value={userHome} onChange={e => setUserHome(e.target.value)} />
                  </div>
                  <div style={{ fontSize: 28, color: "#333", fontWeight: 300, marginTop: 24 }}>—</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>{awayTeam}</div>
                    <input className="score-input" type="number" min="0" max="20" placeholder="0" value={userAway} onChange={e => setUserAway(e.target.value)} />
                  </div>
                </div>
                {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}
                <button className="predict-btn" onClick={submitAndReveal} disabled={loading} style={{ marginBottom: 10 }}>
                  {loading ? "AI is thinking..." : "🤖 Submit & See What AI Predicts"}
                </button>
                <button className="ghost-btn" onClick={() => setStep(1)}>← Back</button>
              </div>
            )}

            {loading && (
              <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
                <div className="spinner" style={{ marginBottom: 16 }} />
                <div style={{ color: "#555", fontSize: 13 }}>AI is analysing the match...</div>
              </div>
            )}

            {step === 3 && result && !loading && (
              <>
                <PitchView
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  homeFormation={confirmedLineup?.home?.formation || result.homeFormation}
                  awayFormation={confirmedLineup?.away?.formation || result.awayFormation}
                  homeLineupNames={confirmedLineup ? confirmedLineup.home.players.map(p => p.name) : result.homeLineup}
                  awayLineupNames={confirmedLineup ? confirmedLineup.away.players.map(p => p.name) : result.awayLineup}
                  lineupSource={confirmedLineup ? "confirmed" : "predicted"}
                />
                {!confirmedLineup && (
                  <button
                    onClick={() => fetchConfirmedLineup(homeTeam, awayTeam, selectedLeague, savedPredictionId)}
                    disabled={lineupFetching}
                    style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 8, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "8px 16px", width: "100%", marginTop: 4 }}
                  >
                    {lineupFetching ? "Checking for confirmed lineup..." : "🔄 Refresh Lineup"}
                  </button>
                )}

                <div className="reveal-box">
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16, textAlign: "center" }}>{homeTeam} vs {awayTeam} · {leagueLabel}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>👤 Your Call</div>
                      <div style={{ fontSize: 48, fontWeight: 900, color: "#4ade80" }}>{userPrediction}</div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 18, color: "#333", fontWeight: 700 }}>vs</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>🤖 AI Predicts</div>
                      <div style={{ fontSize: 48, fontWeight: 900, color: "#f59e0b" }}>{result.scoreline}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
                    <span className="tag" style={{ background: outcomeColor(result.outcome) + "22", color: outcomeColor(result.outcome), border: `1px solid ${outcomeColor(result.outcome)}44` }}>{result.outcome}</span>
                    <span className="tag" style={{ background: confidenceColor(result.confidence) + "22", color: confidenceColor(result.confidence), border: `1px solid ${confidenceColor(result.confidence)}44` }}>{result.confidence} Confidence</span>
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🤖 AI Verdict</div>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: "#ccc" }}>{result.verdict}</p>
                </div>

                <div className="card">
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚔️ Key Tactical Battle</div>
                  <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{result.keyBattle}</p>
                </div>

                <div className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🪑 Bench & Managers</div>

                  {/* Home bench */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{homeTeam}</span>
                      {confirmedLineup?.home?.coach && (
                        <span style={{ fontSize: 11, color: "#555" }}>👔 {confirmedLineup.home.coach}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                      {(confirmedLineup?.home?.substitutes || []).map((p, i) => (
                        <div key={i} style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                          <span style={{ color: "#4ade80", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                        </div>
                      ))}
                      {!confirmedLineup && <span style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>Available after lineup confirmation</span>}
                    </div>
                  </div>

                  {/* Away bench */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>{awayTeam}</span>
                      {confirmedLineup?.away?.coach && (
                        <span style={{ fontSize: 11, color: "#555" }}>👔 {confirmedLineup.away.coach}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                      {(confirmedLineup?.away?.substitutes || []).map((p, i) => (
                        <div key={i} style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                          <span style={{ color: "#a855f7", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                        </div>
                      ))}
                      {!confirmedLineup && <span style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>Available after lineup confirmation</span>}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ borderColor: "#2a1f00", background: "#13100a" }}>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🃏 Wildcard Factor</div>
                  <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{result.wildcard}</p>
                </div>

                {deepInsights && (
                  <div className="card" style={{ borderColor: "#3730a322", background: "#0f0f1f" }}>
                    <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>📊 Deep Insights</div>
                    <div style={{ fontSize: 13, color: "#aaa", marginBottom: 14, fontWeight: 600 }}>Statistical model — independent of AI verdict</div>

                    {/* Win probability intentionally hidden — API returns identical values across WC fixtures */}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {deepInsights.comparison?.attackHome && (
                        <div style={{ background: "#13131f", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 12, color: "#ccc", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Attack Rating</div>
                          <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>Relative attacking strength</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", minWidth: 34, textAlign: "right" }}>{capStat(deepInsights.comparison.attackHome)}</span>
                            <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex" }}>
                              <div style={{ width: deepInsights.comparison.attackHome, background: "#4ade80" }} />
                            </div>
                            <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex", flexDirection: "row-reverse" }}>
                              <div style={{ width: deepInsights.comparison.attackAway, background: "#f59e0b" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", minWidth: 34 }}>{capStat(deepInsights.comparison.attackAway)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#888" }}>
                            <span style={{ color: "#4ade80" }}>{homeTeam.split(" ")[0]}</span>
                            <span style={{ color: "#f59e0b" }}>{awayTeam.split(" ")[0]}</span>
                          </div>
                        </div>
                      )}
                      {deepInsights.comparison?.defenceHome && (
                        <div style={{ background: "#13131f", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ fontSize: 12, color: "#ccc", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Defence Rating</div>
                          <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>Relative defensive strength</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", minWidth: 34, textAlign: "right" }}>{capStat(deepInsights.comparison.defenceHome)}</span>
                            <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex" }}>
                              <div style={{ width: deepInsights.comparison.defenceHome, background: "#4ade80" }} />
                            </div>
                            <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex", flexDirection: "row-reverse" }}>
                              <div style={{ width: deepInsights.comparison.defenceAway, background: "#f59e0b" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", minWidth: 34 }}>{capStat(deepInsights.comparison.defenceAway)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#888" }}>
                            <span style={{ color: "#4ade80" }}>{homeTeam.split(" ")[0]}</span>
                            <span style={{ color: "#f59e0b" }}>{awayTeam.split(" ")[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {deepInsights.comparison?.formHome && (
                      <div style={{ background: "#13131f", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: "#ccc", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Current Form Index</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 6, fontWeight: 700 }}>{homeTeam}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0" }}>{deepInsights.comparison.formHome}</div>
                          </div>
                          <div style={{ fontSize: 13, color: "#ffffff", fontWeight: 700 }}>vs</div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 6, fontWeight: 700 }}>{awayTeam}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0" }}>{deepInsights.comparison.formAway}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {deepInsights.h2h?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent H2H</div>
                        {deepInsights.h2h.map((r, i) => (
                          <div key={i} style={{ fontSize: 13, color: "#666", padding: "5px 0", borderBottom: "1px solid #1a1a2a" }}>{r}</div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                <div className="card" style={{ borderColor: "#4ade8033" }}>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>📤 Challenge Your Friends</div>
                  <div style={{ background: "linear-gradient(135deg, #0d1a0d, #0a0a1f)", border: "1px solid #2a3a2a", borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>⚽ DEEP433 — YOU vs AI</div>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 12, textTransform: "uppercase" }}>{leagueLabel}: {homeTeam} vs {awayTeam}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>👤 MY CALL</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>{userPrediction}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>🤖 AI SAYS</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>{result.scoreline}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>deep433.com</div>
                  </div>
                  <button className="copy-btn" onClick={copyShare} style={{ marginBottom: 10 }}>{copied ? "✓ Copied!" : "📋 Copy & Share"}</button>
                  <button className="ghost-btn" onClick={resetPredict}>⚡ Predict Another Match</button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "standings" && (
          <>
            <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
              <div style={{ fontSize: 13, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Head to Head Record</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>👤 YOU</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: "#4ade80" }}>{stats.userCorrect}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>exact scores</div>
                </div>
                <div style={{ fontSize: 20, color: "#333", fontWeight: 700 }}>vs</div>
                <div>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>🤖 AI</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: "#f59e0b" }}>{stats.aiCorrect}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>exact scores</div>
                </div>
              </div>
              <div style={{ marginTop: 20, padding: "12px 20px", background: "#0f0f1a", borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: "#aaa" }}>You've beaten the AI <span style={{ color: "#4ade80", fontWeight: 700 }}>{stats.beatAI}</span> time{stats.beatAI !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ label: "Predictions Made", value: stats.total, color: "#60a5fa" }, { label: "Results Logged", value: stats.verified, color: "#a78bfa" }].map(s => (
                <div key={s.label} className="card" style={{ textAlign: "center", padding: "14px 10px" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {stats.total === 0 && <div style={{ textAlign: "center", color: "#444", fontSize: 14, padding: "32px 0" }}>Make your first prediction to start the battle!</div>}
          </>
        )}

        {tab === "badges" && (
          <>
            <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}>
              <div style={{ fontSize: 13, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Your Rank</div>
              {rank ? <div style={{ fontSize: 20, fontWeight: 900, color: rank.color }}>{rank.icon} {rank.name}</div> : <div style={{ fontSize: 16, color: "#444" }}>Beat the AI to earn your first badge</div>}
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{badges.filter(b => b.earned).length} of {badges.length} badges earned</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {badges.map(b => (
                <div key={b.name} className={`badge-card${b.earned ? "" : " locked"}`}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.earned ? b.color : "#555", marginBottom: 4, lineHeight: 1.3 }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.4 }}>{b.desc}</div>
                  {!b.earned && <div style={{ fontSize: 10, color: "#2a2a2a", marginTop: 6 }}>🔒 Locked</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "history" && (
          <>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Prediction History</div>
            <input className="search-input" placeholder="🔍 Search by team..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
            {history.length === 0 && <div style={{ textAlign: "center", color: "#444", fontSize: 14, padding: "40px 0" }}>No predictions yet — go predict a match!</div>}
            {history.filter(h => !historySearch.trim() || h.home_team.toLowerCase().includes(historySearch.toLowerCase()) || h.away_team.toLowerCase().includes(historySearch.toLowerCase())).map((h) => {
              const wc = resultColor(h.result);
              const matchStatus = getMatchStatus(h.home_team, h.away_team);
              return (
                <div key={h.id} className="history-row">
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 2 }}>{h.home_team} vs {h.away_team}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{new Date(h.created_at).toLocaleDateString("en-GB")}</div>
                    </div>
                    {h.ai_data && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => {
                          // Load from localStorage if available
                          const cached = (() => { try { const s = localStorage.getItem(`lineup_${h.home_team}_${h.away_team}`); return s ? JSON.parse(s) : null; } catch { return null; } })();
                          setViewingPitch(cached ? { ...h, confirmed_lineup: cached } : h);
                        }} style={{ background: "none", border: "1px solid #4ade8044", borderRadius: 6, color: "#4ade80", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "5px 10px", whiteSpace: "nowrap" }}>⚽ Pitch</button>
                        <button onClick={() => setViewingAnalysis(h)} style={{ background: "none", border: "1px solid #818cf844", borderRadius: 6, color: "#818cf8", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "5px 10px", whiteSpace: "nowrap" }}>📊 Analysis</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ flex: 1, textAlign: "center", background: "#13131f", borderRadius: 8, padding: "8px 4px" }}>
                      <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>👤 YOU</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>{h.user_prediction}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#333" }}>vs</div>
                    <div style={{ flex: 1, textAlign: "center", background: "#13131f", borderRadius: 8, padding: "8px 4px" }}>
                      <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>🤖 AI</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b" }}>{h.ai_prediction}</div>
                    </div>
                    {h.actual_score && (
                      <div style={{ flex: 1, textAlign: "center", background: "#13131f", borderRadius: 8, padding: "8px 4px" }}>
                        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, marginBottom: 4 }}>RESULT</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#f0f0f0" }}>{h.actual_score}</div>
                      </div>
                    )}
                  </div>
                  {h.result && (
                    <div style={{ textAlign: "center", padding: "8px", background: wc + "11", border: `1px solid ${wc}33`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: wc, marginBottom: 8 }}>
                      {h.result === "user" ? "🏆 You beat the AI!" : h.result === "ai" ? "🤖 AI wins this one" : "🤝 It's a tie"}
                    </div>
                  )}

                  {matchStatus === "live" && (
                    <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, textAlign: "center", padding: "6px", marginTop: 4 }}>🔴 Match in progress</div>
                  )}
                  {matchStatus === "live" && (() => {
                    const live = findLiveFixture(h.home_team, h.away_team);
                    const events = live?.events;
                    if (!events?.length) return null;
                    return (
                      <div style={{ marginTop: 8, background: "#0d0d18", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          🔴 Live — {live.elapsed}'
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {events.map((e, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                              <span style={{ color: "#555", minWidth: 32, fontWeight: 700 }}>{e.minute}{e.extra}'</span>
                              <span style={{ fontSize: 14 }}>{e.icon}</span>
                              <span style={{ color: "#f0f0f0", fontWeight: 600 }}>{e.label}</span>
                              <span style={{ color: "#555", fontSize: 11, marginLeft: "auto" }}>{e.team?.split(" ").pop()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {matchStatus === "finished" && !h.actual_score && (
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textAlign: "center", padding: "6px", marginTop: 4 }}>🏁 Match finished — log the final score below</div>
                  )}

                  {(matchStatus === "upcoming" || matchStatus === "unknown" || (matchStatus === "finished" && !h.actual_score)) && (
                    <>
                      {loggingIdx !== h.id && loggingIdx !== "edit-" + h.id && (
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          {!h.actual_score && (
                            <button onClick={() => setLoggingIdx(h.id)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 12px", flex: 2 }}>+ Log score</button>
                          )}
                          <button onClick={() => { setLoggingIdx("edit-" + h.id); setLogScore(h.user_prediction); }} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#60a5fa", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 12px", flex: 1 }}>✏️ Edit</button>
                          <button onClick={() => deletePredict(h.id)} style={{ background: "none", border: "1px solid #f8717133", borderRadius: 6, color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 12px", flex: 1 }}>🗑️ Delete</button>
                        </div>
                      )}
                      {!h.actual_score && loggingIdx === h.id && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                          <input className="log-input" placeholder="e.g. 2-1" value={logScore} onChange={e => setLogScore(e.target.value)} />
                          <button onClick={() => logResult(h.id, logScore)} style={{ background: "#4ade80", border: "none", borderRadius: 6, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px" }}>Save</button>
                          <button onClick={() => setLoggingIdx(null)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "7px 10px" }}>Cancel</button>
                        </div>
                      )}
                      {loggingIdx === "edit-" + h.id && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                          <input className="log-input" placeholder="e.g. 2-1" value={logScore} onChange={e => setLogScore(e.target.value)} />
                          <button onClick={() => editPredict(h.id, logScore)} style={{ background: "#60a5fa", border: "none", borderRadius: 6, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px" }}>Save</button>
                          <button onClick={() => setLoggingIdx(null)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "7px 10px" }}>Cancel</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {viewingPitch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 50, display: "flex", flexDirection: "column" }}>
          {/* Fixed header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#0d0d18", borderBottom: "1px solid #1a1a2a", flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 700 }}>{viewingPitch.home_team} vs {viewingPitch.away_team}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {!viewingPitch.confirmed_lineup && (
                <button
                  onClick={() => fetchConfirmedLineup(viewingPitch.home_team, viewingPitch.away_team, selectedLeague, viewingPitch.id)}
                  disabled={lineupFetching}
                  style={{ background: "none", border: "1px solid #f59e0b44", borderRadius: 6, color: "#f59e0b", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 12px" }}
                >
                  {lineupFetching ? "Checking..." : "🔄 Refresh Lineup"}
                </button>
              )}
              <button onClick={() => setViewingPitch(null)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#aaa", cursor: "pointer", fontFamily: "inherit", fontSize: 13, padding: "6px 14px" }}>✕ Close</button>
            </div>
          </div>
          {/* Scrollable pitch content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, maxWidth: 500, width: "100%", margin: "0 auto" }}>
            <PitchView
              homeTeam={viewingPitch.home_team}
              awayTeam={viewingPitch.away_team}
              homeFormation={viewingPitch.confirmed_lineup?.home?.formation || viewingPitch.ai_data?.homeFormation}
              awayFormation={viewingPitch.confirmed_lineup?.away?.formation || viewingPitch.ai_data?.awayFormation}
              homeLineupNames={viewingPitch.confirmed_lineup ? viewingPitch.confirmed_lineup.home.players.map(p => p.name) : viewingPitch.ai_data?.homeLineup}
              awayLineupNames={viewingPitch.confirmed_lineup ? viewingPitch.confirmed_lineup.away.players.map(p => p.name) : viewingPitch.ai_data?.awayLineup}
              lineupSource={viewingPitch.confirmed_lineup ? "confirmed" : "predicted"}
            />

            {/* Bench & Managers — shown when confirmed lineup is available */}
            {viewingPitch.confirmed_lineup && (
              <div className="card" style={{ marginTop: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🪑 Bench & Managers</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{viewingPitch.home_team}</span>
                    {viewingPitch.confirmed_lineup.home?.coach && (
                      <span style={{ fontSize: 11, color: "#555" }}>👔 {viewingPitch.confirmed_lineup.home.coach}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {(viewingPitch.confirmed_lineup.home?.substitutes || []).map((p, i) => (
                      <div key={i} style={{ background: "#1a1a28", border: "1px solid #4ade8044", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <span style={{ color: "#4ade80", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>{viewingPitch.away_team}</span>
                    {viewingPitch.confirmed_lineup.away?.coach && (
                      <span style={{ fontSize: 11, color: "#555" }}>👔 {viewingPitch.confirmed_lineup.away.coach}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {(viewingPitch.confirmed_lineup.away?.substitutes || []).map((p, i) => (
                      <div key={i} style={{ background: "#1a1a28", border: "1px solid #a855f744", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <span style={{ color: "#a855f7", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewingAnalysis && (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", zIndex: 50, overflowY: "auto" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 60px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 14, color: "#f0f0f0", fontWeight: 700 }}>{viewingAnalysis.home_team} vs {viewingAnalysis.away_team}</div>
              <button onClick={() => setViewingAnalysis(null)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#888", cursor: "pointer", fontFamily: "inherit", fontSize: 13, padding: "6px 14px" }}>✕ Close</button>
            </div>

            {/* Score comparison */}
            <div className="reveal-box">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>👤 Your Call</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#4ade80" }}>{viewingAnalysis.user_prediction}</div>
                </div>
                <div style={{ textAlign: "center", fontSize: 16, color: "#333" }}>vs</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>🤖 AI Predicts</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#f59e0b" }}>{viewingAnalysis.ai_prediction}</div>
                </div>
              </div>
              {viewingAnalysis.actual_score && (
                <div style={{ textAlign: "center", marginTop: 12, padding: "8px", background: resultColor(viewingAnalysis.result) + "11", borderRadius: 8, fontSize: 13, fontWeight: 700, color: resultColor(viewingAnalysis.result) }}>
                  Final: {viewingAnalysis.actual_score} · {viewingAnalysis.result === "user" ? "🏆 You beat the AI!" : viewingAnalysis.result === "ai" ? "🤖 AI wins" : "🤝 Tie"}
                </div>
              )}
            </div>

            {/* AI Verdict */}
            {viewingAnalysis.ai_data?.verdict && (
              <div className="card">
                <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🤖 AI Verdict</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#ccc" }}>{viewingAnalysis.ai_data.verdict}</p>
              </div>
            )}

            {/* Key battle */}
            {viewingAnalysis.ai_data?.keyBattle && (
              <div className="card">
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚔️ Key Tactical Battle</div>
                <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>{viewingAnalysis.ai_data.keyBattle}</p>
              </div>
            )}

            {/* Wildcard */}
            {viewingAnalysis.ai_data?.wildcard && (
              <div className="card" style={{ borderColor: "#2a1f00", background: "#13100a" }}>
                <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🃏 Wildcard</div>
                <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>{viewingAnalysis.ai_data.wildcard}</p>
              </div>
            )}

            {/* Bench & Managers — from saved confirmedLineup */}
            {viewingAnalysis.confirmed_lineup && (
              <div className="card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🪑 Bench & Managers</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{viewingAnalysis.home_team}</span>
                    {viewingAnalysis.confirmed_lineup.home?.coach && (
                      <span style={{ fontSize: 11, color: "#555" }}>👔 {viewingAnalysis.confirmed_lineup.home?.coach}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {(viewingAnalysis.confirmed_lineup.home?.substitutes || []).map((p, i) => (
                      <div key={i} style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <span style={{ color: "#4ade80", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>{viewingAnalysis.away_team}</span>
                    {viewingAnalysis.confirmed_lineup.away?.coach && (
                      <span style={{ fontSize: 11, color: "#555" }}>👔 {viewingAnalysis.confirmed_lineup.away?.coach}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {(viewingAnalysis.confirmed_lineup.away?.substitutes || []).map((p, i) => (
                      <div key={i} style={{ background: "#1a1a28", border: "1px solid #2a2a40", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#ccc", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <span style={{ color: "#a855f7", marginRight: 4, fontSize: 11 }}>{p.number}</span>{p.name?.split(" ").pop()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

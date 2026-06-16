import { useState, useEffect } from "react";
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
  { date: "Thu 11 Jun", home: "Mexico", away: "South Africa", group: "Group A", venue: "Mexico City", result: "2-0" },
  { date: "Fri 12 Jun", home: "Korea Republic", away: "Czechia", group: "Group A", venue: "Guadalajara", result: "2-1" },
  { date: "Fri 12 Jun", home: "Canada", away: "Bosnia and Herzegovina", group: "Group B", venue: "Toronto", result: "1-1" },
  { date: "Sat 13 Jun", home: "USA", away: "Paraguay", group: "Group D", venue: "Los Angeles", result: "4-1" },
  { date: "Sat 13 Jun", home: "Qatar", away: "Switzerland", group: "Group B", venue: "San Francisco", result: "1-1" },
  { date: "Sat 13 Jun", home: "Brazil", away: "Morocco", group: "Group C", venue: "New Jersey", result: "1-1" },
  { date: "Sun 14 Jun", home: "Haiti", away: "Scotland", group: "Group C", venue: "Boston", result: "0-1" },
  { date: "Sun 14 Jun", home: "Australia", away: "Türkiye", group: "Group D", venue: "Vancouver", result: "2-0" },
  { date: "Sun 14 Jun", home: "Germany", away: "Curaçao", group: "Group E", venue: "Houston", result: "7-1" },
  { date: "Sun 14 Jun", home: "Netherlands", away: "Japan", group: "Group F", venue: "Dallas", result: "2-2" },
  { date: "Mon 15 Jun", home: "Côte d'Ivoire", away: "Ecuador", group: "Group E", venue: "Philadelphia", result: "1-0" },
  { date: "Mon 15 Jun", home: "Sweden", away: "Tunisia", group: "Group F", venue: "Monterrey", result: "5-1" },
  { date: "Mon 15 Jun", home: "Spain", away: "Cabo Verde", group: "Group H", venue: "Atlanta", result: "0-0" },
  { date: "Mon 15 Jun", home: "Belgium", away: "Egypt", group: "Group G", venue: "Seattle", result: "1-1" },
  { date: "Mon 15 Jun", home: "Saudi Arabia", away: "Uruguay", group: "Group H", venue: "Miami", result: "1-1" },
  { date: "Tue 16 Jun", home: "IR Iran", away: "New Zealand", group: "Group G", venue: "Los Angeles", result: "2-2" },
  { date: "Tue 16 Jun", home: "France", away: "Senegal", group: "Group I", venue: "New Jersey" },
  { date: "Tue 16 Jun", home: "Iraq", away: "Norway", group: "Group I", venue: "Boston" },
  { date: "Wed 17 Jun", home: "Argentina", away: "Algeria", group: "Group J", venue: "Kansas City" },
  { date: "Wed 17 Jun", home: "Austria", away: "Jordan", group: "Group J", venue: "San Francisco" },
  { date: "Wed 17 Jun", home: "Portugal", away: "Congo DR", group: "Group K", venue: "Houston" },
  { date: "Wed 17 Jun", home: "England", away: "Croatia", group: "Group L", venue: "Dallas" },
  { date: "Thu 18 Jun", home: "Ghana", away: "Panama", group: "Group L", venue: "Toronto" },
  { date: "Thu 18 Jun", home: "Uzbekistan", away: "Colombia", group: "Group K", venue: "Mexico City" },
  { date: "Thu 18 Jun", home: "Czechia", away: "South Africa", group: "Group A", venue: "Atlanta" },
  { date: "Thu 18 Jun", home: "Switzerland", away: "Bosnia and Herzegovina", group: "Group B", venue: "Los Angeles" },
  { date: "Thu 18 Jun", home: "Canada", away: "Qatar", group: "Group B", venue: "Vancouver" },
  { date: "Fri 19 Jun", home: "Mexico", away: "Korea Republic", group: "Group A", venue: "Guadalajara" },
  { date: "Fri 19 Jun", home: "USA", away: "Australia", group: "Group D", venue: "Seattle" },
  { date: "Fri 19 Jun", home: "Scotland", away: "Morocco", group: "Group C", venue: "Boston" },
  { date: "Sat 20 Jun", home: "Brazil", away: "Haiti", group: "Group C", venue: "Philadelphia" },
  { date: "Sat 20 Jun", home: "Türkiye", away: "Paraguay", group: "Group D", venue: "San Francisco" },
  { date: "Sat 20 Jun", home: "Netherlands", away: "Sweden", group: "Group F", venue: "Houston" },
  { date: "Sat 20 Jun", home: "Germany", away: "Côte d'Ivoire", group: "Group E", venue: "Toronto" },
  { date: "Sun 21 Jun", home: "Ecuador", away: "Curaçao", group: "Group E", venue: "Kansas City" },
  { date: "Sun 21 Jun", home: "Tunisia", away: "Japan", group: "Group F", venue: "Monterrey" },
  { date: "Sun 21 Jun", home: "Spain", away: "Saudi Arabia", group: "Group H", venue: "Atlanta" },
  { date: "Sun 21 Jun", home: "Belgium", away: "IR Iran", group: "Group G", venue: "Los Angeles" },
  { date: "Sun 21 Jun", home: "Uruguay", away: "Cabo Verde", group: "Group H", venue: "Miami" },
  { date: "Mon 22 Jun", home: "New Zealand", away: "Egypt", group: "Group G", venue: "Vancouver" },
  { date: "Mon 22 Jun", home: "Argentina", away: "Austria", group: "Group J", venue: "Dallas" },
  { date: "Mon 22 Jun", home: "France", away: "Iraq", group: "Group I", venue: "Philadelphia" },
  { date: "Tue 23 Jun", home: "Norway", away: "Senegal", group: "Group I", venue: "New Jersey" },
  { date: "Tue 23 Jun", home: "Jordan", away: "Algeria", group: "Group J", venue: "San Francisco" },
  { date: "Tue 23 Jun", home: "Portugal", away: "Uzbekistan", group: "Group K", venue: "Houston" },
  { date: "Tue 23 Jun", home: "England", away: "Ghana", group: "Group L", venue: "Boston" },
  { date: "Wed 24 Jun", home: "Panama", away: "Croatia", group: "Group L", venue: "Toronto" },
  { date: "Wed 24 Jun", home: "Colombia", away: "Congo DR", group: "Group K", venue: "Guadalajara" },
  { date: "Wed 24 Jun", home: "Switzerland", away: "Canada", group: "Group B", venue: "Vancouver" },
  { date: "Wed 24 Jun", home: "Bosnia and Herzegovina", away: "Qatar", group: "Group B", venue: "Seattle" },
  { date: "Wed 24 Jun", home: "Scotland", away: "Brazil", group: "Group C", venue: "Miami" },
  { date: "Wed 24 Jun", home: "Morocco", away: "Haiti", group: "Group C", venue: "Atlanta" },
  { date: "Thu 25 Jun", home: "Czechia", away: "Mexico", group: "Group A", venue: "Mexico City" },
  { date: "Thu 25 Jun", home: "South Africa", away: "Korea Republic", group: "Group A", venue: "Monterrey" },
  { date: "Thu 25 Jun", home: "Curaçao", away: "Côte d'Ivoire", group: "Group E", venue: "Philadelphia" },
  { date: "Thu 25 Jun", home: "Ecuador", away: "Germany", group: "Group E", venue: "New Jersey" },
  { date: "Fri 26 Jun", home: "Japan", away: "Sweden", group: "Group F", venue: "Dallas" },
  { date: "Fri 26 Jun", home: "Tunisia", away: "Netherlands", group: "Group F", venue: "Kansas City" },
  { date: "Fri 26 Jun", home: "Türkiye", away: "USA", group: "Group D", venue: "Los Angeles" },
  { date: "Fri 26 Jun", home: "Paraguay", away: "Australia", group: "Group D", venue: "San Francisco" },
  { date: "Fri 26 Jun", home: "Norway", away: "France", group: "Group I", venue: "Boston" },
  { date: "Fri 26 Jun", home: "Senegal", away: "Iraq", group: "Group I", venue: "Toronto" },
  { date: "Sat 27 Jun", home: "Cabo Verde", away: "Saudi Arabia", group: "Group H", venue: "Houston" },
  { date: "Sat 27 Jun", home: "Uruguay", away: "Spain", group: "Group H", venue: "Guadalajara" },
  { date: "Sat 27 Jun", home: "Egypt", away: "IR Iran", group: "Group G", venue: "Seattle" },
  { date: "Sat 27 Jun", home: "New Zealand", away: "Belgium", group: "Group G", venue: "Vancouver" },
  { date: "Sat 27 Jun", home: "Panama", away: "England", group: "Group L", venue: "New Jersey" },
  { date: "Sat 27 Jun", home: "Croatia", away: "Ghana", group: "Group L", venue: "Philadelphia" },
  { date: "Sun 28 Jun", home: "Colombia", away: "Portugal", group: "Group K", venue: "Miami" },
  { date: "Sun 28 Jun", home: "Congo DR", away: "Uzbekistan", group: "Group K", venue: "Atlanta" },
  { date: "Sun 28 Jun", home: "Algeria", away: "Austria", group: "Group J", venue: "Kansas City" },
  { date: "Sun 28 Jun", home: "Jordan", away: "Argentina", group: "Group J", venue: "Dallas" },
];

const BADGE_DEFS = [
  { icon: "⚽", name: "Sunday League Scout", desc: "First prediction made", color: "#888", condition: (s) => s.total >= 1 },
  { icon: "🤖", name: "AI Beater", desc: "Beat the AI once", color: "#60a5fa", condition: (s) => s.beatAI >= 1 },
  { icon: "🎯", name: "Sharp Eye", desc: "Beat the AI 3 times", color: "#a78bfa", condition: (s) => s.beatAI >= 3 },
  { icon: "🔥", name: "On Fire", desc: "Beat the AI 5 times", color: "#f97316", condition: (s) => s.beatAI >= 5 },
  { icon: "🧠", name: "Analyst", desc: "Beat the AI 10 times", color: "#4ade80", condition: (s) => s.beatAI >= 10 },
  { icon: "👑", name: "AI Destroyer", desc: "Beat the AI 20 times", color: "#fbbf24", condition: (s) => s.beatAI >= 20 },
];

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
  "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Australia": "🇦🇺", "Türkiye": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Côte d'Ivoire": "🇨🇮", "Ecuador": "🇪🇨", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cabo Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷",
  "Ghana": "🇬🇭", "Panama": "🇵🇦", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
};

function PitchView({ homeTeam, awayTeam, homeFormation, awayFormation }) {
  const homeFlag = TEAM_FLAGS[homeTeam] || "🏳️";
  const awayFlag = TEAM_FLAGS[awayTeam] || "🏳️";
  const parseFormation = (f) => { if (!f) return [4,3,3]; return f.split("-").map(Number); };
  const hForm = parseFormation(homeFormation);
  const aForm = parseFormation(awayFormation);

  const getPlayerPositions = (formation, side) => {
    const rows = [1, ...formation];
    const positions = [];
    rows.forEach((count, rowIdx) => {
      const xPct = side === "home" ? 5 + (rowIdx / (rows.length - 1)) * 44 : 95 - (rowIdx / (rows.length - 1)) * 44;
      for (let i = 0; i < count; i++) {
        const yPct = count === 1 ? 50 : 15 + (i / (count - 1)) * 70;
        positions.push({ x: xPct, y: yPct });
      }
    });
    return positions;
  };

  const homePlayers = getPlayerPositions(hForm, "home");
  const awayPlayers = getPlayerPositions(aForm, "away");

  const PlayerPin = ({ x, y, flag, num, color, border }) => (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
      <div style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", background: color, border: `1.5px solid ${border}`, width: 22, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{flag}</div>
      <div style={{ fontSize: 7, fontWeight: 700, color: border, marginTop: 1, textShadow: "0 0 4px rgba(0,0,0,0.9)" }}>{num}</div>
    </div>
  );

  return (
    <div style={{ width: "100%", position: "relative", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, zIndex: 3, pointerEvents: "none", background: "radial-gradient(ellipse at 15% 0%, rgba(255,255,200,0.3) 0%, transparent 55%), radial-gradient(ellipse at 85% 0%, rgba(255,255,200,0.3) 0%, transparent 55%)" }}/>
      <div style={{ height: 50, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #0d0d1a 0%, #1a1228 50%, #251530 100%)" }}>
        {[8,25,75,92].map((l,i) => <div key={i} style={{ position: "absolute", left: `${l}%`, top: 0, width: 2, height: 38, background: "linear-gradient(180deg,#fffde0,#888)", boxShadow: "0 0 16px 6px rgba(255,253,200,0.35)" }}/>)}
        {Array.from({length:60}).map((_,i) => <div key={i} style={{ position:"absolute", left:`${1+Math.random()*98}%`, top:`${20+Math.random()*65}%`, width:3, height:3, borderRadius:"50%", background:`hsl(${Math.random()*360},55%,58%)`, opacity:0.45 }}/>)}
      </div>
      <div style={{ position:"absolute", left:0, top:50, bottom:0, width:11, background:"#111", zIndex:4, display:"flex", alignItems:"center", justifyContent:"center", writingMode:"vertical-rl" }}>
        <span style={{fontSize:5,fontWeight:900,color:"#4ade80",letterSpacing:1}}>DEEP433</span>
      </div>
      <div style={{ position:"absolute", right:0, top:50, bottom:0, width:11, background:"#111", zIndex:4, display:"flex", alignItems:"center", justifyContent:"center", writingMode:"vertical-rl" }}>
        <span style={{fontSize:5,fontWeight:900,color:"#f59e0b",letterSpacing:1}}>deep433.com</span>
      </div>
      <div style={{ perspective:"550px", perspectiveOrigin:"50% 0%", padding:"0 11px 8px" }}>
        <div style={{ transform:"rotateX(26deg)", transformOrigin:"top center", borderRadius:"0 0 8px 8px", overflow:"hidden", boxShadow:"0 25px 50px rgba(0,0,0,0.8)" }}>
          <div style={{ position:"relative", width:"100%", paddingBottom:"58%", background:"repeating-linear-gradient(90deg,#1a7a1a 0px,#1a7a1a 30px,#1f8c1f 30px,#1f8c1f 60px)" }}>
            <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}} viewBox="0 0 100 58" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="54" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <line x1="50" y1="2" x2="50" y2="56" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <circle cx="50" cy="29" r="9" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <circle cx="50" cy="29" r="0.8" fill="rgba(255,255,255,0.75)"/>
              <rect x="2" y="15" width="13" height="28" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <rect x="2" y="21" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <rect x="85" y="15" width="13" height="28" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <rect x="92" y="21" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.5"/>
              <rect x="0" y="24" width="2" height="10" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
              <rect x="98" y="24" width="2" height="10" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4"/>
            </svg>
            <div style={{position:"absolute",top:"2%",left:"2%",right:"2%",height:"6%",background:"#111",display:"flex",overflow:"hidden",borderRadius:1}}>
              {["DEEP433","deep433.com","YOU vs AI","WORLD CUP 2026","DEEP433","deep433.com"].map((t,i)=>(
                <div key={i} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #222"}}>
                  <span style={{fontSize:4,fontWeight:900,color:i%2===0?"#4ade80":"#f59e0b",whiteSpace:"nowrap"}}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{position:"absolute",bottom:"2%",left:"2%",right:"2%",height:"6%",background:"#111",display:"flex",overflow:"hidden",borderRadius:1}}>
              {["DEEP433","deep433.com","YOU vs AI","WORLD CUP 2026","DEEP433","deep433.com"].map((t,i)=>(
                <div key={i} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #222"}}>
                  <span style={{fontSize:4,fontWeight:900,color:i%2===0?"#f59e0b":"#4ade80",whiteSpace:"nowrap"}}>{t}</span>
                </div>
              ))}
            </div>
            {[[2.5,3],[97,3],[2.5,93],[97,93]].map(([x,y],i)=>(
              <div key={i} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:1.5,height:"7%",background:i<2?"#f59e0b":"#4ade80"}}>
                <div style={{width:5,height:3,background:i<2?"#f59e0b":"#4ade80",marginLeft:1.5}}/>
              </div>
            ))}
            {homePlayers.map((p,i)=><PlayerPin key={"h"+i} x={p.x} y={p.y} flag={homeFlag} num={i+1} color="#0f3460" border="#4ade80"/>)}
            {awayPlayers.map((p,i)=><PlayerPin key={"a"+i} x={p.x} y={p.y} flag={awayFlag} num={i+1} color="#3d0000" border="#f59e0b"/>)}
          </div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 14px",background:"#0d0d18"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#4ade80"}}>{homeFlag} {homeTeam} · {homeFormation||"4-3-3"}</span>
        <span style={{fontSize:11,fontWeight:700,color:"#f59e0b"}}>{awayTeam} {awayFlag} · {awayFormation||"4-3-3"}</span>
      </div>
    </div>
  );
}

function getRank(stats) {
  const earned = BADGE_DEFS.filter(b => b.condition(stats));
  return earned.length > 0 ? earned[earned.length - 1] : null;
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
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>YOU vs AI · FOOTBALL PREDICTOR</div>
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

  const isWorldCup = selectedLeague === "wc2026";
  const leagueLabel = LEAGUES.find(l => l.id === selectedLeague)?.short || "World Cup 2026";

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

  const loadHistory = async (userId) => {
    const { data } = await supabase.from("predictions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
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

  const goToStep2 = () => {
    if (!homeTeam || !awayTeam) { setError("Enter both team names."); return; }
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
        body: JSON.stringify({ homeTeam, awayTeam, league: leagueLabel }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Error ${res.status}`); }
      const parsed = await res.json();
      setResult(parsed);
      setStep(3);
      const aiPrediction = (parsed.scoreline || "").replace(" - ", "-").replace(" – ", "-");
      const { data: saved } = await supabase.from("predictions").insert({
        user_id: session.user.id, home_team: homeTeam, away_team: awayTeam,
        user_prediction: up, ai_prediction: aiPrediction, ai_verdict: parsed.verdict,
      }).select().single();
      if (saved) setHistory(prev => [saved, ...prev]);
    } catch (e) { setError(e.message || "Something went wrong. Try again."); }
    setLoading(false);
  };

  const resetPredict = () => {
    setStep(1); setResult(null); setHomeTeam(""); setAwayTeam("");
    setUserHome(""); setUserAway(""); setUserPrediction(""); setError(""); setFixtureSearch("");
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

  if (!session) return <AuthScreen />;

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
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>YOU vs AI · FOOTBALL PREDICTOR</div>
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
                          <div key={i} className={`fixture-row${homeTeam === f.home && awayTeam === f.away ? " selected" : ""}${f.result ? " played" : ""}`} onClick={() => !f.result && selectFixture(f)} style={{ marginBottom: 5, opacity: f.result ? 0.6 : 1, cursor: f.result ? "default" : "pointer" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                               
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{f.home}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>vs</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{f.away}</span>
                               
                              </div>
                              {f.result 
  ? <div style={{ fontSize: 11, fontWeight: 900, color: "#f59e0b", background: "#1a1400", border: "1px solid #f59e0b44", borderRadius: 6, padding: "2px 8px" }}>FT {f.result}</div>
  : <div style={{ fontSize: 10, color: "#555", minWidth: 60, textAlign: "right" }}>{f.group}</div>
}
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
                <PitchView homeTeam={homeTeam} awayTeam={awayTeam} homeFormation={result.homeFormation} awayFormation={result.awayFormation} />

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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="card">
                    <div style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>🔑 {homeTeam} Key Player</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>{result.homeKeyPlayer}</div>
                  </div>
                  <div className="card">
                    <div style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>🔑 {awayTeam} Key Player</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>{result.awayKeyPlayer}</div>
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚔️ Key Tactical Battle</div>
                  <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{result.keyBattle}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="card">
                    <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{homeTeam}</div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{result.homeFormation}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {result.homeLineup?.map((p, i) => <div key={i} className="player-chip"><span style={{ color: "#555", marginRight: 6, fontSize: 11 }}>{i+1}</span>{p}</div>)}
                    </div>
                  </div>
                  <div className="card">
                    <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{awayTeam}</div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{result.awayFormation}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {result.awayLineup?.map((p, i) => <div key={i} className="player-chip"><span style={{ color: "#555", marginRight: 6, fontSize: 11 }}>{i+1}</span>{p}</div>)}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ borderColor: "#2a1f00", background: "#13100a" }}>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🃏 Wildcard Factor</div>
                  <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{result.wildcard}</p>
                </div>

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
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Prediction History</div>
            {history.length === 0 && <div style={{ textAlign: "center", color: "#444", fontSize: 14, padding: "40px 0" }}>No predictions yet — go predict a match!</div>}
            {history.map((h) => {
              const wc = resultColor(h.result);
              return (
                <div key={h.id} className="history-row">
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 2 }}>{h.home_team} vs {h.away_team}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{new Date(h.created_at).toLocaleDateString("en-GB")}</div>
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
                  {!h.actual_score && loggingIdx !== h.id && (
                    <button onClick={() => setLoggingIdx(h.id)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 12px", width: "100%" }}>+ Log real score to see who won</button>
                  )}
                  {!h.actual_score && loggingIdx === h.id && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input className="log-input" placeholder="e.g. 2-1" value={logScore} onChange={e => setLogScore(e.target.value)} />
                      <button onClick={() => logResult(h.id, logScore)} style={{ background: "#4ade80", border: "none", borderRadius: 6, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px" }}>Save</button>
                      <button onClick={() => setLoggingIdx(null)} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#555", cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "7px 10px" }}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

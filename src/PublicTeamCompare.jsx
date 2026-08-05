import { useState } from "react";

const LEAGUE_OPTIONS = [
  { id: "pl", label: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "laliga", label: "La Liga", emoji: "🇪🇸" },
  { id: "seriea", label: "Serie A", emoji: "🇮🇹" },
  { id: "bundesliga", label: "Bundesliga", emoji: "🇩🇪" },
  { id: "ligue1", label: "Ligue 1", emoji: "🇫🇷" },
  { id: "ucl", label: "Champions League", emoji: "🏆" },
];

function TeamSearchSlot({ label, search, setSearch, suggestions, team, searching, slot, color, onSelect, onClear, onSearch }) {
  return (
    <div>
      <div style={{ fontSize: 13, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          value={search}
          onChange={e => onSearch(e.target.value, slot)}
          placeholder="Search team..."
          style={{ width: "100%", background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 10, color: "#f0f0f0", fontSize: 15, padding: "12px 16px", outline: "none", fontFamily: "inherit" }}
        />
        {searching && <div style={{ position: "absolute", right: 12, top: 12, fontSize: 13, color: "#94a3b8" }}>...</div>}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#13131f", border: "1px solid #2a2a3a", borderRadius: 10, marginTop: 4, maxHeight: 180, overflowY: "auto" }}>
            {suggestions.map(t => (
              <div key={t.id} onClick={() => onSelect(t, slot)} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#f0f0f0", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1a1a2a" }}>
                {t.logo && <img src={t.logo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
                <span>{t.name}</span>
                {t.country && <span style={{ color: "#555", fontSize: 12, marginLeft: "auto" }}>{t.country}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {team && (
        <button onClick={onClear} style={{ marginTop: 6, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          ✕ Clear
        </button>
      )}
    </div>
  );
}

export default function PublicTeamCompare({ onBack, onSignUp }) {
  const [leagueId, setLeagueId] = useState("pl");

  const [search1, setSearch1] = useState("");
  const [suggest1, setSuggest1] = useState([]);
  const [team1, setTeam1] = useState(null);
  const [searching1, setSearching1] = useState(false);
  const [data1, setData1] = useState(null);

  const [search2, setSearch2] = useState("");
  const [suggest2, setSuggest2] = useState([]);
  const [team2, setTeam2] = useState(null);
  const [searching2, setSearching2] = useState(false);
  const [data2, setData2] = useState(null);

  const [loading, setLoading] = useState(false);

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
      if (slot === 1) setData1(d.available ? d : null);
      else setData2(d.available ? d : null);
    } catch {}
    setLoading(false);
  };

  const formDot = (r) => (
    <div style={{ width: 18, height: 18, borderRadius: "50%", background: r === "W" ? "#4ade80" : r === "D" ? "#a78bfa" : "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0a0a0f", flexShrink: 0 }}>{r}</div>
  );

  const TeamBlock = ({ data, isFirst }) => (
    <div style={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 14, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {data.logo && <img src={data.logo} alt="" crossOrigin="anonymous" style={{ width: 36, height: 36, objectFit: "contain" }} />}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f0f0f0" }}>{data.team}</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            {LEAGUE_OPTIONS.find(l => l.id === leagueId)?.label} {data.seasonUsed}/{parseInt(data.seasonUsed) + 1} · Final Stats
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {data.position && (
          <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 8, padding: "5px 10px", fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>
            POS: <span style={{ color: "#4ade80" }}>{data.position}{data.position === 1 ? "st" : data.position === 2 ? "nd" : data.position === 3 ? "rd" : "th"}</span>
          </div>
        )}
        <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 8, padding: "5px 10px", fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>
          PTS: <span style={{ color: "#4ade80" }}>{(data.wins || 0) * 3 + (data.draws || 0)}</span>
        </div>
        <div style={{ background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 8, padding: "5px 10px", fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>
          GD: <span style={{ color: (data.goalsFor - data.goalsAgainst) >= 0 ? "#4ade80" : "#f87171" }}>{(data.goalsFor - data.goalsAgainst) >= 0 ? "+" : ""}{data.goalsFor - data.goalsAgainst}</span>
        </div>
      </div>

      {data.form && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Final 10 Match Form</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {data.form.slice(-10).split("").map((r, i) => <div key={i}>{formDot(r)}</div>)}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Played", value: data.played, color: "#f0f0f0" },
          { label: "Wins", value: data.wins, color: "#4ade80" },
          { label: "Draws", value: data.draws, color: "#a78bfa" },
          { label: "Losses", value: data.losses, color: "#f87171" },
          { label: "GF", value: data.goalsFor, color: "#4ade80" },
          { label: "GA", value: data.goalsAgainst, color: "#f87171" },
          { label: "Clean Sheets", value: data.cleanSheets, color: "#60a5fa" },
          { label: "Avg Scored", value: data.avgGoalsFor, color: "#4ade80" },
          { label: "Avg Conceded", value: data.avgGoalsAgainst, color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d0d18", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* NAV */}
      <div style={{ background: "#0d0d18", borderBottom: "1px solid #1a1a2e", padding: "16px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/deep433.jpg" alt="Deep433" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>DEEP433</div>
          </div>
          <button onClick={onBack} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 8, color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", fontSize: 14, padding: "6px 14px" }}>← Back</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f0f0f0", marginBottom: 6 }}>⚔️ Team Compare</div>
          <div style={{ fontSize: 14, color: "#94a3b8" }}>Compare any two teams' final stats from last season — free, no account needed.</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
          {LEAGUE_OPTIONS.map(l => (
            <button
              key={l.id}
              onClick={() => { setLeagueId(l.id); setTeam1(null); setTeam2(null); setData1(null); setData2(null); setSearch1(""); setSearch2(""); }}
              style={{ background: leagueId === l.id ? "#4ade8022" : "none", border: `1px solid ${leagueId === l.id ? "#4ade80" : "#2a2a3a"}`, borderRadius: 20, color: leagueId === l.id ? "#4ade80" : "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "6px 14px" }}
            >
              {l.emoji} {l.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <TeamSearchSlot label="Team 1" search={search1} setSearch={setSearch1} suggestions={suggest1} team={team1} searching={searching1} slot={1} color="#4ade80" onSelect={selectTeam} onClear={() => { setTeam1(null); setData1(null); setSearch1(""); }} onSearch={searchTeam} />
          <TeamSearchSlot label="Team 2" search={search2} setSearch={setSearch2} suggestions={suggest2} team={team2} searching={searching2} slot={2} color="#f59e0b" onSelect={selectTeam} onClear={() => { setTeam2(null); setData2(null); setSearch2(""); }} onSearch={searchTeam} />
        </div>

        {loading && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 15, padding: "20px 0" }}>Loading...</div>}

        {data1 && <TeamBlock data={data1} isFirst={true} />}
        {data2 && <TeamBlock data={data2} isFirst={!data1} />}

        {/* Soft CTA — encourages signup without blocking the free tool */}
        <div style={{ marginTop: 24, background: "linear-gradient(135deg, #13102a, #0d0018)", border: "1px solid #2a1f4a", borderRadius: 14, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0", marginBottom: 6 }}>Want live, in-progress season stats?</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 14 }}>Sign up free to unlock predictions, live scores, and more.</div>
          <button onClick={onSignUp} style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", border: "none", borderRadius: 10, color: "#0a0f0a", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 800, padding: "12px 28px" }}>
            Get Started Free →
          </button>
        </div>
      </div>
    </div>
  );
}

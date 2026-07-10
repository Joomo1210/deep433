// src/DeepInsightsPanel.jsx
// Single source of truth for the Deep Insights display — Attack/Defence bars + H2H with PPG.
// Used both in-app (Predict tab Step 3 reveal) and in the Graphics tab (downloadable card).

function capStat(val) {
  if (!val) return val;
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  const capped = Math.min(Math.max(num, 20), 70);
  return capped + "%";
}

function RatingBar({ title, subtitle, homeVal, awayVal, homeTeam, awayTeam }) {
  if (!homeVal) return null;
  return (
    <div style={{ background: "#13131f", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 15, color: "#ccc", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{subtitle}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#4ade80", minWidth: 34, textAlign: "right" }}>{capStat(homeVal)}</span>
        <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex" }}>
          <div style={{ width: homeVal, background: "#4ade80" }} />
        </div>
        <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex", flexDirection: "row-reverse" }}>
          <div style={{ width: awayVal, background: "#f59e0b" }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b", minWidth: 34 }}>{capStat(awayVal)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 13, color: "#888" }}>
        <span style={{ color: "#4ade80" }}>{homeTeam.split(" ")[0]}</span>
        <span style={{ color: "#f59e0b" }}>{awayTeam.split(" ")[0]}</span>
      </div>
    </div>
  );
}

function TeamH2HRow({ team, record, h2hResults, totalMatches }) {
  const dotColor = (r) => r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171";
  return (
    <div style={{ background: "#13131f", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f0" }}>{team}</span>
        <span style={{ fontSize: 14, color: "#555" }}>PPG: <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{totalMatches ? (record.pts / totalMatches).toFixed(2) : "0.00"}</span></span>
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {h2hResults.map((r, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: dotColor(r), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
        <span style={{ color: "#4ade80" }}>W {record.w}</span>
        <span style={{ color: "#60a5fa" }}>D {record.d}</span>
        <span style={{ color: "#f87171" }}>L {record.l}</span>
      </div>
    </div>
  );
}

// Parses a single H2H string like "Croatia 1-1 Portugal" into { home, hg, ag, away }
function parseH2HLine(r) {
  const parts = r.match(/^(.+?)\s+(\d+)-(\d+)\s+(.+)$/);
  if (!parts) return null;
  return { home: parts[1].trim(), hg: parseInt(parts[2]), ag: parseInt(parts[3]), away: parts[4].trim() };
}

const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function getH2HResult(match, perspective) {
  if (!match) return "D";
  const { home, hg, ag } = match;
  if (hg === ag) return "D";
  const perspWon = (normalize(home) === normalize(perspective) && hg > ag) || (normalize(home) !== normalize(perspective) && ag > hg);
  return perspWon ? "W" : "L";
}

export default function DeepInsightsPanel({ insights, homeTeam, awayTeam, showHeader = true, aiPrediction, userPrediction }) {
  if (!insights) return null;

  const parsed = insights.h2h?.length ? insights.h2h.map(parseH2HLine).filter(Boolean) : [];
  const totalMatches = parsed.length;

  const buildRecord = (team) => parsed.reduce((acc, m) => {
    const r = getH2HResult(m, team);
    if (r === "W") acc.w++; else if (r === "D") acc.d++; else acc.l++;
    acc.pts += r === "W" ? 3 : r === "D" ? 1 : 0;
    return acc;
  }, { w: 0, d: 0, l: 0, pts: 0 });

  const homeRecord = buildRecord(homeTeam);
  const awayRecord = buildRecord(awayTeam);

  return (
    <div>
      {showHeader && (
        <>
          <div style={{ fontSize: 14, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>📊 Deep Insights</div>
          <div style={{ fontSize: 16, color: "#aaa", marginBottom: 14, fontWeight: 600 }}>Statistical model — independent of AI verdict</div>
        </>
      )}

      {(aiPrediction || userPrediction) && (
        <div style={{ background: "#13131f", border: "1px solid #1a1a2a", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 10 }}>🔮 Predicted Scorelines</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 700, marginBottom: 4 }}>🤖 AI Verdict</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#818cf8" }}>{aiPrediction || "—"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>👤 My Pick</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>{userPrediction || "—"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <RatingBar
          title="Attack Rating"
          subtitle="Relative attacking strength"
          homeVal={insights.comparison?.attackHome}
          awayVal={insights.comparison?.attackAway}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
        <RatingBar
          title="Defence Rating"
          subtitle="Relative defensive strength"
          homeVal={insights.comparison?.defenceHome}
          awayVal={insights.comparison?.defenceAway}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </div>

      {totalMatches > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 15, color: "#ccc", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Recent H2H</div>
          <TeamH2HRow team={homeTeam} record={homeRecord} h2hResults={parsed.map(m => getH2HResult(m, homeTeam))} totalMatches={totalMatches} />
          <TeamH2HRow team={awayTeam} record={awayRecord} h2hResults={parsed.map(m => getH2HResult(m, awayTeam))} totalMatches={totalMatches} />
        </div>
      )}
    </div>
  );
}

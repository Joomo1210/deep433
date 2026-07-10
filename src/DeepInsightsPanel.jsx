// src/DeepInsightsPanel.jsx
// Single source of truth for the Deep Insights display — Attack/Defence bento boxes + H2H + Last 5 Form.
// Used both in-app (Predict tab Step 3 reveal) and in the Graphics tab (downloadable card).

function capStat(val) {
  if (!val) return val;
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  const capped = Math.min(Math.max(num, 20), 70);
  return capped + "%";
}

// ─── Self-contained bento box wrapper ────────────────────────────────────────
function BentoBox({ title, icon, color, children }) {
  return (
    <div style={{ background: "#13131f", border: `1px solid ${color}22`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 11, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function RatingBar({ subtitle, homeVal, awayVal, homeTeam, awayTeam }) {
  if (!homeVal) return null;
  return (
    <div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{subtitle}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#4ade80", minWidth: 38, textAlign: "right" }}>{capStat(homeVal)}</span>
        <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex" }}>
          <div style={{ width: homeVal, background: "#4ade80" }} />
        </div>
        <div style={{ flex: 1, height: 7, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex", flexDirection: "row-reverse" }}>
          <div style={{ width: awayVal, background: "#f59e0b" }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b", minWidth: 38 }}>{capStat(awayVal)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: "#888" }}>
        <span style={{ color: "#4ade80" }}>{homeTeam.split(" ")[0]}</span>
        <span style={{ color: "#f59e0b" }}>{awayTeam.split(" ")[0]}</span>
      </div>
    </div>
  );
}

function TeamH2HRow({ team, record, h2hResults, totalMatches, color }) {
  const dotColor = (r) => r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{team}</span>
        <span style={{ fontSize: 10, color: "#666" }}>PPG: <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{totalMatches ? (record.pts / totalMatches).toFixed(2) : "0.00"}</span></span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {h2hResults.map((r, i) => (
          <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: dotColor(r), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <span style={{ color: "#4ade80" }}>W {record.w}</span>
        <span style={{ color: "#60a5fa" }}>D {record.d}</span>
        <span style={{ color: "#f87171" }}>L {record.l}</span>
      </div>
    </div>
  );
}

function FormRow({ team, form, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 6 }}>{team}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {(form || "").split("").slice(-5).map((r, i) => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: 4,
            background: r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900, color: "#0a0a0f",
          }}>{r}</div>
        ))}
        {!form && <span style={{ fontSize: 11, color: "#555" }}>No recent form data</span>}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {showHeader && (
        <div>
          <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>📊 Deep Insights</div>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Statistical model — independent of AI verdict</div>
        </div>
      )}

      {(aiPrediction || userPrediction) && (
        <div style={{
          background: "linear-gradient(135deg, #818cf814, #4ade800e)",
          border: "1px solid #818cf833",
          borderRadius: 12, padding: "14px 16px",
        }}>
          <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 10 }}>🔮 Predicted Scorelines</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, marginBottom: 4 }}>🤖 AI Verdict</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#818cf8" }}>{aiPrediction || "—"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>👤 My Pick</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#4ade80" }}>{userPrediction || "—"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {insights.comparison?.attackHome && (
          <BentoBox title="Attack Rating" icon="⚔️" color="#4ade80">
            <RatingBar subtitle="Relative attacking strength" homeVal={insights.comparison.attackHome} awayVal={insights.comparison.attackAway} homeTeam={homeTeam} awayTeam={awayTeam} />
          </BentoBox>
        )}
        {insights.comparison?.defenceHome && (
          <BentoBox title="Defence Rating" icon="🛡️" color="#f59e0b">
            <RatingBar subtitle="Relative defensive strength" homeVal={insights.comparison.defenceHome} awayVal={insights.comparison.defenceAway} homeTeam={homeTeam} awayTeam={awayTeam} />
          </BentoBox>
        )}
      </div>

      {totalMatches > 0 && (
        <BentoBox title="Recent H2H" icon="📋" color="#60a5fa">
          <TeamH2HRow team={homeTeam} record={homeRecord} h2hResults={parsed.map(m => getH2HResult(m, homeTeam))} totalMatches={totalMatches} color="#4ade80" />
          <TeamH2HRow team={awayTeam} record={awayRecord} h2hResults={parsed.map(m => getH2HResult(m, awayTeam))} totalMatches={totalMatches} color="#f59e0b" />
        </BentoBox>
      )}

      {(insights.form?.home || insights.form?.away) && (
        <BentoBox title="Last 5 Matches" icon="📈" color="#c084fc">
          <FormRow team={homeTeam} form={insights.form.home} color="#4ade80" />
          <FormRow team={awayTeam} form={insights.form.away} color="#f59e0b" />
        </BentoBox>
      )}
    </div>
  );
}

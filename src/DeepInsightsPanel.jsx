// src/DeepInsightsPanel.jsx
// Single source of truth for the Deep Insights display — Attack/Defence bento boxes + H2H + Last 5 Form.
// Used both in-app (Predict tab Step 3 reveal) and in the Graphics tab (downloadable card).

import { useState, useEffect } from "react";

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
    <div style={{ background: "#13131f", border: `1px solid ${color}22`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function RatingBar({ subtitle, homeVal, awayVal, homeTeam, awayTeam }) {
  if (!homeVal) return null;
  return (
    <div>
      <div style={{ fontSize: 13, color: "#999", marginBottom: 6 }}>{subtitle}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#4ade80", minWidth: 32, textAlign: "right" }}>{capStat(homeVal)}</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex" }}>
          <div style={{ width: homeVal, background: "#4ade80" }} />
        </div>
        <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", background: "#1a1a2a", display: "flex", flexDirection: "row-reverse" }}>
          <div style={{ width: awayVal, background: "#f59e0b" }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#f59e0b", minWidth: 32 }}>{capStat(awayVal)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 13, color: "#aaa" }}>
        <span style={{ color: "#4ade80" }}>{homeTeam.split(" ")[0]}</span>
        <span style={{ color: "#f59e0b" }}>{awayTeam.split(" ")[0]}</span>
      </div>
    </div>
  );
}

function TeamH2HRow({ team, h2hResults, color }) {
  const dotColor = (r) => r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 5 }}>{team}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {h2hResults.map((r, i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: dotColor(r), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0a0a0f" }}>{r}</div>
        ))}
      </div>
    </div>
  );
}

function FormRow({ team, form, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 5 }}>{team}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {(form || "").split("").slice(-5).map((r, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: 4,
            background: r === "W" ? "#4ade80" : r === "D" ? "#60a5fa" : "#f87171",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 900, color: "#0a0a0f",
          }}>{r}</div>
        ))}
        {!form && <span style={{ fontSize: 13, color: "#999" }}>No recent form data</span>}
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

export default function DeepInsightsPanel({ insights, homeTeam, awayTeam, showHeader = true, aiPrediction, userPrediction, leagueId }) {
  const [realForm, setRealForm] = useState({ home: null, away: null });

  // Fetch real W/D/L form from team-stats endpoint (more accurate than the API's percentage field)
  useEffect(() => {
    if (!insights?.homeTeamId || !insights?.awayTeamId || !leagueId) return;
    setRealForm({ home: null, away: null });
    Promise.all([
      fetch(`/api/team-stats?leagueId=${leagueId}&teamId=${insights.homeTeamId}`).then(r => r.json()).catch(() => null),
      fetch(`/api/team-stats?leagueId=${leagueId}&teamId=${insights.awayTeamId}`).then(r => r.json()).catch(() => null),
    ]).then(([h, a]) => {
      setRealForm({
        home: h?.available ? h.form : null,
        away: a?.available ? a.form : null,
      });
    });
  }, [insights?.homeTeamId, insights?.awayTeamId, leagueId]);

  if (!insights) return null;

  const parsed = insights.h2h?.length ? insights.h2h.map(parseH2HLine).filter(Boolean) : [];
  const totalMatches = parsed.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {showHeader && (
        <div>
          <div style={{ fontSize: 15, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>📊 Brief Insights</div>
          <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>Statistical model — independent of AI verdict</div>
        </div>
      )}

      {(aiPrediction || userPrediction) && (
        <div style={{
          background: "linear-gradient(135deg, #818cf814, #4ade800e)",
          border: "1px solid #818cf833",
          borderRadius: 10, padding: "10px 12px",
        }}>
          <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 8 }}>🔮 Predicted Scorelines</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 700, marginBottom: 3 }}>🤖 AI Verdict</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#818cf8" }}>{aiPrediction || "—"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700, marginBottom: 3 }}>👤 My Pick</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>{userPrediction || "—"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {insights.comparison?.attackHome && (
          <BentoBox title="Attack" icon="⚔️" color="#4ade80">
            <RatingBar subtitle="Attacking strength" homeVal={insights.comparison.attackHome} awayVal={insights.comparison.attackAway} homeTeam={homeTeam} awayTeam={awayTeam} />
          </BentoBox>
        )}
        {insights.comparison?.defenceHome && (
          <BentoBox title="Defence" icon="🛡️" color="#f59e0b">
            <RatingBar subtitle="Defensive strength" homeVal={insights.comparison.defenceHome} awayVal={insights.comparison.defenceAway} homeTeam={homeTeam} awayTeam={awayTeam} />
          </BentoBox>
        )}
      </div>

      {totalMatches > 0 && (
        <BentoBox title="Recent H2H" icon="📋" color="#60a5fa">
          <TeamH2HRow team={homeTeam} h2hResults={parsed.map(m => getH2HResult(m, homeTeam))} color="#4ade80" />
          <TeamH2HRow team={awayTeam} h2hResults={parsed.map(m => getH2HResult(m, awayTeam))} color="#f59e0b" />
        </BentoBox>
      )}

      {(realForm.home || realForm.away) && (
        <BentoBox title="Last 5 Matches" icon="📈" color="#c084fc">
          <FormRow team={homeTeam} form={realForm.home} color="#4ade80" />
          <FormRow team={awayTeam} form={realForm.away} color="#f59e0b" />
        </BentoBox>
      )}
    </div>
  );
}

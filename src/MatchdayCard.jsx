import React from "react";

// Deep433 Matchday list card: kick-off, last-5 form and (when the API has them)
// bookmaker-average implied chances, for up to 5 matches per card.
// Pure presentational. `matches` is the array of /api/fixture-data?type=matchday
// responses, already sorted by kick-off.
// html2canvas-safe: fixed pixel sizes, flex/grid only, no filters or blend modes.

const HOME = "#4ade80";
const AWAY = "#f59e0b";
const DRAW = "#64748b";
const TEXT = "#f8fafc";
const SOFT = "#cbd5e1";
const PANEL = "#12121e";
const FORM = { W: "#22c55e", D: "#94a3b8", L: "#ef4444" };

const ukTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  } catch { return ""; }
};

function Dots({ form, align = "left" }) {
  const f = (form || "").split("");
  return (
    <div style={{ display: "flex", gap: 5, marginTop: 6, justifyContent: align === "right" ? "flex-end" : "flex-start", minHeight: 12 }}>
      {f.map((c, i) => (
        <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: FORM[c] || "#475569", display: "block" }} />
      ))}
    </div>
  );
}

function OddsStrip({ odds }) {
  const imp = odds.implied;
  const dec = odds.odds;
  const hasDec = dec && [dec.home, dec.draw, dec.away].every((n) => typeof n === "number" && n > 1);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "#1c1c2c" }}>
        <div style={{ width: `${imp.home}%`, background: HOME }} />
        <div style={{ width: `${imp.draw}%`, background: DRAW }} />
        <div style={{ flex: 1, background: AWAY }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", columnGap: 6, marginTop: 5, alignItems: "baseline" }}>
        <div style={{ textAlign: "left", fontSize: 15, fontWeight: 900, color: HOME }}>
          {imp.home}%{hasDec && <span style={{ fontSize: 12, fontWeight: 700, color: SOFT }}> · {dec.home.toFixed(2)}</span>}
        </div>
        <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: SOFT }}>
          {imp.draw}%{hasDec && <span style={{ fontSize: 12, fontWeight: 700 }}> · {dec.draw.toFixed(2)}</span>}
        </div>
        <div style={{ textAlign: "right", fontSize: 15, fontWeight: 900, color: AWAY }}>
          {imp.away}%{hasDec && <span style={{ fontSize: 12, fontWeight: 700, color: SOFT }}> · {dec.away.toFixed(2)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function MatchdayCard({ matches, title = "Matchday", dateLabel = "", pageLabel = "" }) {
  const anyOdds = matches.some((m) => m.odds && m.odds.implied);
  return (
    <div style={{ position: "relative", padding: "44px 16px 18px", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "radial-gradient(ellipse at 50% 0%, #22c55e30, transparent 70%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ display: "inline-block", padding: "6px 18px", borderRadius: 999, background: "linear-gradient(90deg,#16a34a,#22c55e)", color: "#04130a", fontSize: 22, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
            {title}
          </span>
          {dateLabel && <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: SOFT, marginTop: 8, textTransform: "uppercase" }}>{dateLabel}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {matches.map((m) => (
            <div key={m.fixtureId} style={{ background: PANEL, border: "1px solid #26263a", borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", columnGap: 10, alignItems: "center" }}>
                <div style={{ textAlign: "center", borderRight: "1px solid #26263a", paddingRight: 8 }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: HOME, lineHeight: 1 }}>{ukTime(m.kickoff)}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 12px minmax(0,1fr)", columnGap: 4, alignItems: "start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: TEXT, lineHeight: 1.15 }}>{m.home.name}</div>
                      <Dots form={m.home.form} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7c99", textAlign: "center", paddingTop: 3 }}>v</div>
                    <div style={{ minWidth: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: TEXT, lineHeight: 1.15 }}>{m.away.name}</div>
                      <Dots form={m.away.form} align="right" />
                    </div>
                  </div>
                </div>
              </div>
              {m.odds && m.odds.implied && <OddsStrip odds={m.odds} />}
              {m.league && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#8696b0", textTransform: "uppercase", marginTop: 6, textAlign: "center" }}>{m.league}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: SOFT, marginTop: 12, lineHeight: 1.5 }}>
          Dots: last 5 results, oldest to latest
          <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: FORM.W, margin: "0 3px 0 8px" }} />W
          <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: FORM.D, margin: "0 3px 0 6px" }} />D
          <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: FORM.L, margin: "0 3px 0 6px" }} />L
          {anyOdds && <div>Bars: chance of a home win, draw and away win (bookmaker average)</div>}
        </div>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: SOFT, marginTop: 8, letterSpacing: 0.6 }}>
          {pageLabel ? `${pageLabel} · ` : ""}Predict free on <span style={{ color: HOME, fontWeight: 900 }}>Deep433</span>
        </div>
      </div>
    </div>
  );
}

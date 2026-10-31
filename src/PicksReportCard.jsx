import React from "react";

// Deep433 picks report card: our calls for a day or week, graded as the matches finish.
// Pure presentational. `rows` come from PicksReportGraphic: each row has the fixture
// (names, kickoff), the call (pick, btts, goals) and the latest result from
// /api/fixture-data?type=result. Waiting matches show kick-off, live ones the live
// score, finished ones the 90-minute score with a tick or a cross.
// html2canvas-safe: fixed pixel sizes, flex/grid only, no filters or blend modes.

const GREEN = "#4ade80";
const RED = "#f87171";
const AMBER = "#f59e0b";
const GREY = "#64748b";
const TEXT = "#f8fafc";
const SOFT = "#cbd5e1";
const PANEL = "#12121e";

const FINAL = ["FT", "AET", "PEN"];
const LIVE = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
const VOID = ["PST", "CANC", "ABD", "AWD", "WO"];

export const PICK_OPTIONS = [
  { id: "1", label: "Home win" },
  { id: "X", label: "Draw" },
  { id: "2", label: "Away win" },
  { id: "1X", label: "Home win or draw" },
  { id: "X2", label: "Away win or draw" },
  { id: "", label: "No result call (goals only)" },
];

export function callLabel(call, home, away) {
  const parts = [];
  switch (call.pick) {
    case "1": parts.push(`${home} win`); break;
    case "2": parts.push(`${away} win`); break;
    case "X": parts.push("Draw"); break;
    case "1X": parts.push(`${home} win or draw`); break;
    case "X2": parts.push(`${away} win or draw`); break;
    default: break;
  }
  if (call.btts) parts.push("Both teams to score");
  if (call.goals === "over") parts.push("Over 2.5 goals");
  if (call.goals === "under") parts.push("Under 2.5 goals");
  return parts.join(" + ") || "No call set";
}

function callHolds(call, h, a) {
  const pickOk =
    call.pick === "1" ? h > a :
    call.pick === "2" ? a > h :
    call.pick === "X" ? h === a :
    call.pick === "1X" ? h >= a :
    call.pick === "X2" ? a >= h : true;
  const bttsOk = !call.btts || (h > 0 && a > 0);
  const goalsOk = call.goals === "over" ? h + a > 2.5 : call.goals === "under" ? h + a < 2.5 : true;
  return pickOk && bttsOk && goalsOk;
}

// state: waiting | live | landed | missed | void
export function gradeRow(row) {
  const r = row.result;
  if (!r || !r.available) return { state: "waiting", score: null };
  const s = r.status;
  if (VOID.includes(s)) return { state: "void", score: null };
  if (FINAL.includes(s)) {
    const h = r.ft && r.ft.home != null ? r.ft.home : r.goals?.home;
    const a = r.ft && r.ft.away != null ? r.ft.away : r.goals?.away;
    if (h == null || a == null) return { state: "waiting", score: null };
    return { state: callHolds(row.call, h, a) ? "landed" : "missed", score: `${h}-${a}`, note: s === "FT" ? "FT" : "90 min" };
  }
  if (LIVE.includes(s)) {
    const h = r.goals?.home ?? 0;
    const a = r.goals?.away ?? 0;
    return { state: "live", score: `${h}-${a}`, note: s === "HT" ? "HT" : r.elapsed ? `${r.elapsed}'` : "LIVE" };
  }
  return { state: "waiting", score: null };
}

const ukTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  } catch { return ""; }
};

function Badge({ state }) {
  if (state === "landed" || state === "missed") {
    const ok = state === "landed";
    return (
      <div style={{ width: 34, height: 34, borderRadius: 17, background: ok ? "#16a34a" : "#dc2626", color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: "34px", textAlign: "center" }}>
        {ok ? "✓" : "✗"}
      </div>
    );
  }
  const live = state === "live";
  return (
    <div style={{ minWidth: 34, padding: "0 6px", height: 22, borderRadius: 11, background: live ? "#f59e0b26" : "#64748b26", border: `1px solid ${live ? AMBER : GREY}`, color: live ? AMBER : SOFT, fontSize: 10, fontWeight: 900, letterSpacing: 0.8, lineHeight: "20px", textAlign: "center", textTransform: "uppercase" }}>
      {live ? "Live" : state === "void" ? "Off" : "Wait"}
    </div>
  );
}

export default function PicksReportCard({ rows, tallyRows, title = "Deep433 calls", dateLabel = "", pageLabel = "" }) {
  const graded = rows.map((r) => ({ row: r, g: gradeRow(r) }));
  const tallyGraded = (tallyRows || rows).map((r) => ({ row: r, g: gradeRow(r) }));
  const landed = tallyGraded.filter((x) => x.g.state === "landed").length;
  const missed = tallyGraded.filter((x) => x.g.state === "missed").length;
  const live = tallyGraded.filter((x) => x.g.state === "live").length;
  const waiting = tallyGraded.filter((x) => x.g.state === "waiting").length;
  const voided = tallyGraded.filter((x) => x.g.state === "void").length;
  const settled = landed + missed;
  const total = tallyGraded.length;
  const dot = { landed: "#16a34a", missed: "#dc2626", live: AMBER, waiting: "#334155", void: "#475569" };

  return (
    <div style={{ position: "relative", padding: "44px 16px 18px", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, background: "radial-gradient(ellipse at 50% 0%, #22c55e30, transparent 70%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ display: "inline-block", padding: "6px 18px", borderRadius: 999, background: "linear-gradient(90deg,#16a34a,#22c55e)", color: "#04130a", fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
            {title}
          </span>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: SOFT, marginTop: 8, textTransform: "uppercase" }}>
            Report card{dateLabel ? ` · ${dateLabel}` : ""}
          </div>
        </div>

        <div style={{ background: PANEL, border: "1px solid #26263a", borderRadius: 14, padding: "12px 14px", marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: TEXT, lineHeight: 1 }}>
            <span style={{ color: GREEN }}>{landed}</span>
            <span style={{ color: "#6b7c99", fontSize: 22 }}> of </span>
            {settled > 0 ? settled : total}
            <span style={{ fontSize: 15, fontWeight: 800, color: SOFT, letterSpacing: 1 }}> {settled > 0 ? "LANDED" : "CALLS"}</span>
          </div>
          <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 10 }}>
            {tallyGraded.map((x, i) => (
              <span key={i} style={{ display: "block", width: 22, height: 8, borderRadius: 4, background: dot[x.g.state] }} />
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: SOFT, marginTop: 8 }}>
            {[
              missed ? `${missed} missed` : "",
              live ? `${live} live` : "",
              waiting ? `${waiting} still to play` : "",
              voided ? `${voided} off` : "",
            ].filter(Boolean).join(" · ") || (settled === total ? "All settled" : "")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {graded.map(({ row, g }) => {
            const tint = g.state === "landed" ? "#16a34a" : g.state === "missed" ? "#dc2626" : g.state === "live" ? AMBER : "#26263a";
            return (
              <div key={row.fixtureId} style={{ background: PANEL, border: `1px solid ${tint}`, borderRadius: 14, padding: "10px 12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr) 46px", columnGap: 10, alignItems: "center" }}>
                  <div style={{ textAlign: "center", borderRight: "1px solid #26263a", paddingRight: 8 }}>
                    {g.score ? (
                      <>
                        <div style={{ fontSize: 20, fontWeight: 900, color: g.state === "live" ? AMBER : TEXT, lineHeight: 1 }}>{g.score}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: g.state === "live" ? AMBER : SOFT, marginTop: 4, letterSpacing: 1 }}>{g.note}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 19, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{ukTime(row.kickoff)}</div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TEXT, lineHeight: 1.2 }}>
                      {row.home} <span style={{ color: "#6b7c99", fontSize: 11, fontWeight: 800 }}>v</span> {row.away}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: GREEN, marginTop: 4, lineHeight: 1.25 }}>
                      Deep433 call: {callLabel(row.call, row.home, row.away)}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Badge state={g.state} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: SOFT, marginTop: 12, lineHeight: 1.5 }}>
          Calls are judged on the 90 minutes. Scores update as matches finish.
        </div>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: SOFT, marginTop: 8, letterSpacing: 0.6 }}>
          {pageLabel ? `${pageLabel} · ` : ""}Predict free on <span style={{ color: GREEN, fontWeight: 900 }}>Deep433</span>
        </div>
      </div>
    </div>
  );
}

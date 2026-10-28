import React, { useState, useEffect } from "react";

// Deep433 Match Stats card ("story" layout).
// Pure presentational: pass the object returned by /api/fixture-data?type=stats
// (plus optional s.defensive). It decides by itself whether the stats tell a
// different story from the scoreboard (a "shocker") and builds the headline,
// the three biggest gaps and the full mirrored breakdown.
//
// html2canvas-safe on purpose: no filters, no blend modes, no gradient text,
// only fixed pixel sizes and flex/grid, so the phone download matches desktop.

const HOME = "#4ade80";
const AWAY = "#f59e0b";
const RED = "#ef4444";
const TEXT = "#f8fafc";
const SOFT = "#cbd5e1";
const PANEL = "#12121e";

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};
const show = (v, unit = "") => {
  const n = num(v);
  if (n === null) return "–";
  return (Number.isInteger(n) ? String(n) : n.toFixed(1)) + unit;
};

// ── Story analysis ───────────────────────────────────────────────────────────
// Share of "who had the match" built from xG, shots, shots on target, shots in
// the box and possession. Weights are renormalised over whatever data exists.
function dominance(st) {
  const parts = [
    ["expectedGoals", 0.35],
    ["shotsTotal", 0.25],
    ["shotsOnGoal", 0.2],
    ["shotsInsideBox", 0.1],
    ["possession", 0.1],
  ];
  let w = 0, acc = 0;
  parts.forEach(([key, weight]) => {
    const h = num(st.home[key]);
    const a = num(st.away[key]);
    if (h === null || a === null || h + a === 0) return;
    acc += weight * (h / (h + a));
    w += weight;
  });
  if (!w) return 0;
  return (acc / w - 0.5) * 2; // -1 (away owned it) .. +1 (home owned it)
}

const GAP_CANDIDATES = [
  { key: "shotsTotal", label: "Shots", min: 2, smooth: 0.5 },
  { key: "shotsOnGoal", label: "On target", min: 2, smooth: 0.5 },
  { key: "shotsInsideBox", label: "Shots in box", min: 2, smooth: 0.5 },
  { key: "expectedGoals", label: "xG", min: 0.8, smooth: 0.1 },
  { key: "corners", label: "Corners", min: 3, smooth: 0.5 },
  { key: "passesTotal", label: "Passes", min: 50, smooth: 20 },
  { key: "saves", label: "Saves", min: 2, smooth: 0.5 },
];

function biggestGaps(s, count = 3) {
  const out = [];
  GAP_CANDIDATES.forEach((c) => {
    const h = num(s.home.stats[c.key]);
    const a = num(s.away.stats[c.key]);
    if (h === null || a === null) return;
    const hi = Math.max(h, a), lo = Math.min(h, a);
    if (hi < c.min) return;
    const score = (hi + c.smooth) / (lo + c.smooth);
    out.push({ ...c, h, a, hi, lo, score, lead: h >= a ? "home" : "away" });
  });
  out.sort((x, y) => y.score - x.score);
  return out.slice(0, count);
}

// Favourite according to the bookmaker average (s.odds), if present.
function favouriteFrom(s) {
  const o = s.odds && s.odds.available !== false ? s.odds.implied : null;
  if (!o) return null;
  const side = o.home >= o.away ? "home" : "away";
  return { side, pct: o[side], name: s[side].team };
}

export function buildStory(s) {
  const st = { home: s.home.stats, away: s.away.stats };
  const hg = num(s.goals?.home);
  const ag = num(s.goals?.away);
  const dom = dominance(st);
  const domSide = dom >= 0 ? "home" : "away";
  const dn = s[domSide].team;
  const un = s[domSide === "home" ? "away" : "home"].team;
  const scored = hg !== null && ag !== null;
  const gd = scored ? (domSide === "home" ? hg - ag : ag - hg) : 0; // from dominant side's view
  const clear = Math.abs(dom) >= 0.3;
  const statsShock = scored && clear && gd <= 0;
  const lost = statsShock && gd < 0;

  // Odds angle: the bookmaker favourite (55%+) failed to win.
  const fav = favouriteFrom(s);
  let oddsShock = false, favLost = false;
  if (fav && scored && fav.pct >= 55) {
    const favGd = fav.side === "home" ? hg - ag : ag - hg;
    oddsShock = favGd <= 0;
    favLost = favGd < 0;
  }
  const shocker = statsShock || oddsShock;

  const shotsHi = Math.max(num(st.home.shotsTotal) ?? 0, num(st.away.shotsTotal) ?? 0);
  const shotsLo = Math.min(num(st.home.shotsTotal) ?? 0, num(st.away.shotsTotal) ?? 0);
  const haveShots = num(st.home.shotsTotal) !== null && num(st.away.shotsTotal) !== null;

  let headline = "Full time. The numbers behind the score.";
  if (statsShock && haveShots) {
    headline = lost
      ? `${dn} had ${shotsHi} shots to ${shotsLo}. ${un} still won.`
      : `${dn} had ${shotsHi} shots to ${shotsLo}. It finished ${hg}-${ag}.`;
  } else if (statsShock) {
    headline = lost ? `${dn} ran the match. ${un} won it.` : `${dn} ran the match. It finished ${hg}-${ag}.`;
  } else if (oddsShock) {
    headline = favLost
      ? `${fav.name} were ${fav.pct}% favourites. They lost ${hg}-${ag}.`
      : `${fav.name} were ${fav.pct}% favourites. It finished ${hg}-${ag}.`;
  } else if (clear && haveShots) {
    headline = `${dn} controlled it: ${shotsHi} shots to ${shotsLo}.`;
  }
  return { dom, domSide, shocker, lost, headline, domName: dn, underName: un };
}

// ── Small pieces ─────────────────────────────────────────────────────────────
function Logo({ src, name, color, size = 52 }) {
  const [bad, setBad] = useState(false);
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  if (!src || bad) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `2px solid ${color}`, color, fontWeight: 900, fontSize: size * 0.3, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
        {initials}
      </div>
    );
  }
  return (
    <img src={src} alt="" crossOrigin="anonymous" onError={() => setBad(true)}
      style={{ width: size, height: size, objectFit: "contain", display: "block", margin: "0 auto" }} />
  );
}

function SectionTitle({ children, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 8px" }}>
      <div style={{ width: 4, height: 14, borderRadius: 2, background: color }} />
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: SOFT }}>{children}</div>
    </div>
  );
}

// Mirrored row: value | bar grows left from the centre | label | bar grows right | value
function MirrorRow({ label, h, a, unit = "", neutral = false, on, animate }) {
  const hn = num(h), an = num(a);
  if (hn === null && an === null) return null;
  const hv = hn ?? 0, av = an ?? 0;
  const max = Math.max(hv, av, 0.0001);
  const hw = on ? (hv / max) * 100 : 0;
  const aw = on ? (av / max) * 100 : 0;
  const hWin = !neutral && hv > av, aWin = !neutral && av > hv;
  const tr = animate ? "width 0.9s cubic-bezier(0.16,1,0.3,1)" : "none";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: SOFT, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "46px minmax(0,1fr) minmax(0,1fr) 46px", alignItems: "center", columnGap: 4 }}>
        <div style={{ textAlign: "left", fontSize: 18, fontWeight: 900, color: hWin ? HOME : neutral ? TEXT : SOFT }}>{show(h, unit)}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", height: 9, background: "#1c1c2c", borderRadius: "5px 0 0 5px" }}>
          <div style={{ width: `${hw}%`, height: 9, background: HOME, opacity: hWin || neutral ? 1 : 0.55, borderRadius: "5px 0 0 5px", transition: tr }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start", height: 9, background: "#1c1c2c", borderRadius: "0 5px 5px 0" }}>
          <div style={{ width: `${aw}%`, height: 9, background: AWAY, opacity: aWin || neutral ? 1 : 0.55, borderRadius: "0 5px 5px 0", transition: tr }} />
        </div>
        <div style={{ textAlign: "right", fontSize: 18, fontWeight: 900, color: aWin ? AWAY : neutral ? TEXT : SOFT }}>{show(a, unit)}</div>
      </div>
    </div>
  );
}

// ── The card ─────────────────────────────────────────────────────────────────
// part: "story" (card 1/2), "detail" (card 2/2) or "all" (one long card).
export default function MatchStatsCard({ s, headline = "", badgeMode = "auto", animate = true, part = "all" }) {
  const showStory = part !== "detail";
  const showDetail = part !== "story";
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 80); return () => clearTimeout(t); }, []);
  const settled = on || !animate;

  const story = buildStory(s);
  const showBadge = badgeMode === "on" ? true : badgeMode === "off" ? false : story.shocker;
  const title = (headline || "").trim() || story.headline;
  const st = { home: s.home.stats, away: s.away.stats };
  const hg = s.goals?.home, ag = s.goals?.away;
  const hasScore = hg !== null && hg !== undefined && ag !== null && ag !== undefined;
  const gaps = biggestGaps(s, 3);
  const oddsOk = !!(s.odds && s.odds.available !== false && s.odds.implied);
  const oddsImp = oddsOk ? s.odds.implied : null;
  const od = oddsOk ? s.odds.odds : null;
  const oddsDec = od && [od.home, od.draw, od.away].every((n) => typeof n === "number" && n > 1) ? od : null;
  const oddsFav = oddsOk ? favouriteFrom(s) : null;

  const hasXg = num(st.home.expectedGoals) !== null && num(st.away.expectedGoals) !== null;
  const xgDiff = hasXg ? Math.abs(num(st.home.expectedGoals) - num(st.away.expectedGoals)) : 0;
  const xgLead = hasXg ? (num(st.home.expectedGoals) >= num(st.away.expectedGoals) ? "home" : "away") : null;

  const hPoss = num(st.home.possession);
  const aPoss = num(st.away.possession);
  const hasPoss = hPoss !== null && aPoss !== null;
  const possHome = hasPoss ? (hPoss / ((hPoss + aPoss) || 1)) * 100 : 50;

  const accent = showBadge ? RED : "#818cf8";
  const tr = animate ? "width 1s cubic-bezier(0.16,1,0.3,1)" : "none";

  const groups = [
    { title: "Attack", color: HOME, rows: [
      ["Total shots", st.home.shotsTotal, st.away.shotsTotal],
      ["On target", st.home.shotsOnGoal, st.away.shotsOnGoal],
      ["Shots in the box", st.home.shotsInsideBox, st.away.shotsInsideBox],
      ["Corners", st.home.corners, st.away.corners],
    ] },
    { title: "Passing", color: "#818cf8", rows: [
      ["Total passes", st.home.passesTotal, st.away.passesTotal],
      ["Pass accuracy", st.home.passAccuracy, st.away.passAccuracy, "%"],
    ] },
    { title: "Defence", color: "#38bdf8", rows: [
      ["Saves", st.home.saves, st.away.saves],
      ...(s.defensive ? [
        ["Tackles", s.defensive.home.tackles, s.defensive.away.tackles],
        ["Interceptions", s.defensive.home.interceptions, s.defensive.away.interceptions],
      ] : []),
    ] },
    { title: "Discipline", color: AWAY, neutral: true, rows: [
      ["Fouls", st.home.fouls, st.away.fouls],
      ["Yellow cards", st.home.yellowCards, st.away.yellowCards],
      ["Red cards", st.home.redCards, st.away.redCards],
      ["Offsides", st.home.offsides, st.away.offsides],
    ] },
  ];

  return (
    <div style={{ position: "relative", padding: "44px 18px 20px", overflow: "hidden" }}>
      {/* mood glow */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, background: `radial-gradient(ellipse at 50% 0%, ${accent}40, transparent 70%)` }} />

      <div style={{ position: "relative" }}>
        {showStory && (<>
        {/* badge */}
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 999,
            background: showBadge ? "linear-gradient(90deg,#ef4444,#f97316)" : "#1e1e32",
            border: showBadge ? "none" : "1px solid #2e2e48",
            color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: 2.4, textTransform: "uppercase",
          }}>
            {showBadge ? "Stats shocker" : "Match stats"}
          </span>
        </div>

        {/* headline */}
        <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, lineHeight: 1.18, color: TEXT, margin: "12px 4px 16px" }}>
          {title}
        </div>

        {/* scoreboard */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "center", columnGap: 6 }}>
          <div style={{ textAlign: "center", minWidth: 0 }}>
            <Logo src={s.home.logo} name={s.home.team} color={HOME} />
            <div style={{ fontSize: 15, fontWeight: 800, color: HOME, marginTop: 6, lineHeight: 1.15 }}>{s.home.team}</div>
          </div>
          <div style={{ textAlign: "center", padding: "0 6px" }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: TEXT, lineHeight: 1, whiteSpace: "nowrap" }}>
              {hasScore ? `${hg} - ${ag}` : "vs"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: SOFT, marginTop: 6 }}>FULL TIME</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 0 }}>
            <Logo src={s.away.logo} name={s.away.team} color={AWAY} />
            <div style={{ fontSize: 15, fontWeight: 800, color: AWAY, marginTop: 6, lineHeight: 1.15 }}>{s.away.team}</div>
          </div>
        </div>

        {/* before kick-off: bookmaker average, shown as implied chance */}
        {oddsOk && (
          <div style={{ marginTop: 16, background: PANEL, border: "1px solid #26263a", borderRadius: 14, padding: "12px 12px 10px" }}>
            <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: SOFT }}>BEFORE KICK-OFF</div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", columnGap: 6, alignItems: "baseline", marginTop: 6 }}>
              <div style={{ textAlign: "left", fontSize: 26, fontWeight: 900, color: HOME, lineHeight: 1 }}>{oddsImp.home}%</div>
              <div style={{ textAlign: "center", fontSize: 16, fontWeight: 900, color: SOFT, lineHeight: 1 }}>{oddsImp.draw}%</div>
              <div style={{ textAlign: "right", fontSize: 26, fontWeight: 900, color: AWAY, lineHeight: 1 }}>{oddsImp.away}%</div>
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "#1c1c2c", marginTop: 8 }}>
              <div style={{ width: settled ? `${oddsImp.home}%` : "0%", background: HOME, transition: tr }} />
              <div style={{ width: settled ? `${oddsImp.draw}%` : "0%", background: "#64748b", transition: tr }} />
              <div style={{ flex: 1, background: AWAY }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", columnGap: 6, marginTop: 6, fontSize: 11, fontWeight: 700, color: SOFT }}>
              <div style={{ textAlign: "left" }}>{s.home.team} win</div>
              <div style={{ textAlign: "center" }}>Draw</div>
              <div style={{ textAlign: "right" }}>{s.away.team} win</div>
            </div>
            {oddsDec && (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", columnGap: 6, marginTop: 2, fontSize: 16, fontWeight: 900, color: TEXT }}>
                <div style={{ textAlign: "left" }}>{oddsDec.home.toFixed(2)}</div>
                <div style={{ textAlign: "center" }}>{oddsDec.draw.toFixed(2)}</div>
                <div style={{ textAlign: "right" }}>{oddsDec.away.toFixed(2)}</div>
              </div>
            )}
            {oddsFav && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, fontWeight: 800, color: TEXT }}>
                {oddsFav.name} were {oddsFav.pct}% favourites
              </div>
            )}
          </div>
        )}

        {/* scoreboard vs xG */}
        {hasXg && hasScore && (
          <div style={{ marginTop: 16, background: PANEL, border: `1px solid ${accent}55`, borderRadius: 14, padding: "12px 10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", columnGap: 8 }}>
              <div style={{ textAlign: "center", borderRight: "1px solid #26263a" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: SOFT }}>THE SCOREBOARD</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: TEXT, marginTop: 4, whiteSpace: "nowrap" }}>{hg} - {ag}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: SOFT }}>THE xG</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4, whiteSpace: "nowrap" }}>
                  <span style={{ color: HOME }}>{show(st.home.expectedGoals)}</span>
                  <span style={{ color: TEXT }}> - </span>
                  <span style={{ color: AWAY }}>{show(st.away.expectedGoals)}</span>
                </div>
              </div>
            </div>
            {xgDiff >= 0.5 && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: (xgLead === "home" ? HOME : AWAY), color: "#0a0a0f", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 }}>
                  {s[xgLead].team.toUpperCase()} +{xgDiff.toFixed(1)} xG
                </span>
              </div>
            )}
          </div>
        )}

        {/* biggest gaps */}
        {gaps.length > 0 && (
          <>
            <SectionTitle color={accent}>The biggest gaps</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${gaps.length}, minmax(0,1fr))`, columnGap: 8 }}>
              {gaps.map((g) => {
                const lead = g.lead === "home" ? HOME : AWAY;
                const ratio = g.lo > 0 ? `${(g.hi / g.lo).toFixed(1)}x` : "ZERO";
                return (
                  <div key={g.key} style={{ background: PANEL, border: "1px solid #26263a", borderTop: `3px solid ${lead}`, borderRadius: 12, padding: "10px 4px 10px", textAlign: "center", minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: SOFT, textTransform: "uppercase", whiteSpace: "nowrap" }}>{g.label}</div>
                    <div style={{ fontSize: (show(g.h) + show(g.a)).length > 5 ? 23 : 28, fontWeight: 900, lineHeight: 1.1, marginTop: 6, whiteSpace: "nowrap" }}>
                      <span style={{ color: HOME, opacity: g.lead === "home" ? 1 : 0.6 }}>{show(g.h)}</span>
                      <span style={{ color: SOFT, fontSize: 18 }}>-</span>
                      <span style={{ color: AWAY, opacity: g.lead === "away" ? 1 : 0.6 }}>{show(g.a)}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, background: lead, color: "#0a0a0f", fontSize: 12, fontWeight: 900 }}>{ratio}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* possession */}
        {hasPoss && (
          <>
            <SectionTitle color="#818cf8">Possession</SectionTitle>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: HOME, lineHeight: 1 }}>{Math.round(possHome)}%</span>
              <span style={{ fontSize: 30, fontWeight: 900, color: AWAY, lineHeight: 1 }}>{Math.round(100 - possHome)}%</span>
            </div>
            <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "#1c1c2c" }}>
              <div style={{ width: settled ? `${possHome}%` : "0%", background: HOME, transition: tr }} />
              <div style={{ width: 3, background: "#0a0a0f" }} />
              <div style={{ flex: 1, background: AWAY }} />
            </div>
          </>
        )}

        </>)}

        {showDetail && (<>
        {part === "detail" && (
          <>
            <div style={{ textAlign: "center", marginTop: 6 }}>
              <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "#1e1e32", border: "1px solid #2e2e48", color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: 2.4, textTransform: "uppercase" }}>The full picture</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "center", columnGap: 6, margin: "16px 0 6px" }}>
              <div style={{ textAlign: "center", minWidth: 0 }}>
                <Logo src={s.home.logo} name={s.home.team} color={HOME} size={38} />
                <div style={{ fontSize: 13, fontWeight: 800, color: HOME, marginTop: 4, lineHeight: 1.15 }}>{s.home.team}</div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: TEXT, lineHeight: 1, whiteSpace: "nowrap", padding: "0 6px" }}>{hasScore ? `${hg} - ${ag}` : "vs"}</div>
              <div style={{ textAlign: "center", minWidth: 0 }}>
                <Logo src={s.away.logo} name={s.away.team} color={AWAY} size={38} />
                <div style={{ fontSize: 13, fontWeight: 800, color: AWAY, marginTop: 4, lineHeight: 1.15 }}>{s.away.team}</div>
              </div>
            </div>
          </>
        )}
        {part !== "detail" && <SectionTitle color={accent}>The full picture</SectionTitle>}
        {part === "detail" && <div style={{ height: 8 }} />}
        {groups.map((g) => {
          const rows = g.rows.filter((r) => num(r[1]) !== null || num(r[2]) !== null);
          if (!rows.length) return null;
          return (
            <div key={g.title} style={{ background: PANEL, border: "1px solid #26263a", borderRadius: 12, padding: "10px 12px 2px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.6, color: g.color, textTransform: "uppercase", marginBottom: 8 }}>{g.title}</div>
              {rows.map((r) => (
                <MirrorRow key={r[0]} label={r[0]} h={r[1]} a={r[2]} unit={r[3] || ""} neutral={!!g.neutral} on={settled} animate={animate} />
              ))}
            </div>
          );
        })}

        </>)}

        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: SOFT, marginTop: 14, letterSpacing: 0.6 }}>
          {part === "story" ? "1/2 · Full breakdown on the next card" : part === "detail" ? <>2/2 · Predict free on <span style={{ color: HOME, fontWeight: 900 }}>Deep433</span></> : <>Predict free on <span style={{ color: HOME, fontWeight: 900 }}>Deep433</span></>}
        </div>
      </div>
    </div>
  );
}

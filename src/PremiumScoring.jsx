import { useState, useEffect, useMemo } from "react";

// Admin-only panel: score a Premium match by hand inside the app (no SQL).
// Rule: exact score 10 (includes the outcome), else correct outcome 5, plus 3 if the
// predicted total is on the same side of 2.5 as the real total. Max 13.
// No rationale = no Premium points.
const sign = (h, a) => (h > a ? "H" : h < a ? "A" : "D");
export function premiumPoints(pred, actual, rationale = true) {
  if (!rationale || pred.h === "" || pred.a === "" || actual.h === "" || actual.a === "") return 0;
  const ph = +pred.h, pa = +pred.a, ah = +actual.h, aa = +actual.a;
  let pts = 0;
  if (ph === ah && pa === aa) pts = 10;
  else if (sign(ph, pa) === sign(ah, aa)) pts = 5;
  if ((ph + pa > 2.5) === (ah + aa > 2.5)) pts += 3;
  return pts;
}

const box = { background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 10, padding: 12, marginTop: 14 };
const inp = { background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 14, padding: "8px 10px", outline: "none", fontFamily: "inherit" };
const num = { ...inp, width: 48, textAlign: "center", padding: "8px 4px" };
const lbl = { fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };

export default function PremiumScoring({ supabase, defaultBoard = "euro", onSaved }) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(defaultBoard);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [fh, setFh] = useState("");
  const [fa, setFa] = useState("");
  const [rows, setRows] = useState([{ q: "", uid: "", h: "", a: "", rat: true }]);
  const [existing, setExisting] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setBoard(defaultBoard); }, [defaultBoard]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: m } = await supabase.from("premium_matches").select("home, away, kickoff").order("kickoff", { ascending: false }).limit(20);
      setMatches(m || []);
      const { data: p } = await supabase.from("profiles").select("id, username, role").order("username");
      setPlayers((p || []).filter(x => x.username && x.role !== "admin"));
    })();
  }, [open, supabase]);

  const reason = home && away && fh !== "" && fa !== "" ? `Premium: ${home.trim()} ${fh}-${fa} ${away.trim()}` : null;

  const loadExisting = async () => {
    if (!reason) { setExisting([]); return; }
    const { data } = await supabase.from("bonus_points").select("id, user_id, points").eq("board", board).eq("reason", reason);
    setExisting(data || []);
  };
  useEffect(() => { if (open) loadExisting(); /* eslint-disable-next-line */ }, [open, board, reason]);

  const nameOf = (id) => players.find(p => p.id === id)?.username || id.slice(0, 8);
  const resolve = (r) => r.uid || players.find(p => p.username.toLowerCase() === r.q.trim().toLowerCase())?.id || "";
  const doneIds = useMemo(() => new Set(existing.map(e => e.user_id)), [existing]);

  const scored = rows.map(r => {
    const uid = resolve(r);
    const complete = uid && r.h !== "" && r.a !== "";
    return { ...r, uid, complete, pts: complete ? premiumPoints({ h: r.h, a: r.a }, { h: fh, a: fa }, r.rat) : 0, dup: uid && doneIds.has(uid) };
  });
  const toSave = scored.filter(r => r.complete && !r.dup && r.pts > 0);

  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    if (!reason || !toSave.length) return;
    setBusy(true); setMsg(null);
    const seen = new Set();
    const payload = toSave.filter(r => (seen.has(r.uid) ? false : seen.add(r.uid))).map(r => ({ user_id: r.uid, board, points: r.pts, reason }));
    const { error } = await supabase.from("bonus_points").insert(payload);
    setBusy(false);
    if (error) { setMsg({ ok: false, t: "Save failed: " + error.message }); return; }
    setMsg({ ok: true, t: `Saved ${payload.length} player${payload.length === 1 ? "" : "s"} for ${reason}.` });
    setRows([{ q: "", uid: "", h: "", a: "", rat: true }]);
    await loadExisting();
    onSaved && onSaved();
  };

  const removeOne = async (id) => {
    await supabase.from("bonus_points").delete().eq("id", id);
    await loadExisting(); onSaved && onSaved();
  };
  const removeAll = async () => {
    if (!reason || !window.confirm(`Remove ALL Premium points saved for "${reason}" on the ${board} board?`)) return;
    await supabase.from("bonus_points").delete().eq("board", board).eq("reason", reason);
    await loadExisting(); onSaved && onSaved();
  };

  return (
    <div style={box}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#F5C518" }}>⭐ Score a Premium match</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={lbl}>Board</div>
            <select value={board} onChange={e => setBoard(e.target.value)} style={inp}>
              <option value="weekly">Weekly league</option>
              <option value="euro">Euro Cups</option>
              <option value="monday">Monday Night</option>
            </select>
          </div>
          <div>
            <div style={lbl}>Match</div>
            <select value="" onChange={e => { const m = matches[+e.target.value]; if (m) { setHome(m.home); setAway(m.away); } }} style={{ ...inp, width: "100%", marginBottom: 6 }}>
              <option value="">Pick a Premium match…</option>
              {matches.map((m, i) => <option key={i} value={i}>{m.home} v {m.away} · {new Date(m.kickoff).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</option>)}
            </select>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input value={home} onChange={e => setHome(e.target.value)} placeholder="Home team" style={{ ...inp, flex: 1, minWidth: 110 }} />
              <input value={fh} onChange={e => setFh(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="-" style={num} />
              <span style={{ color: "#94a3b8" }}>-</span>
              <input value={fa} onChange={e => setFa(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="-" style={num} />
              <input value={away} onChange={e => setAway(e.target.value)} placeholder="Away team" style={{ ...inp, flex: 1, minWidth: 110 }} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Enter the FINAL score in the middle boxes.</div>
          </div>

          <div>
            <div style={lbl}>Players and their picks</div>
            <datalist id="prem-players">{players.map(p => <option key={p.id} value={p.username} />)}</datalist>
            {scored.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <input list="prem-players" value={r.q} onChange={e => setRow(i, { q: e.target.value, uid: "" })} placeholder="Player" style={{ ...inp, flex: 1, minWidth: 120, borderColor: r.q && !r.uid ? "#f87171" : "#2a2a3a" }} />
                <input value={r.h} onChange={e => setRow(i, { h: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="H" style={num} />
                <span style={{ color: "#94a3b8" }}>-</span>
                <input value={r.a} onChange={e => setRow(i, { a: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="A" style={num} />
                <label style={{ fontSize: 11, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 3 }}>
                  <input type="checkbox" checked={rows[i].rat} onChange={e => setRow(i, { rat: e.target.checked })} />Reason
                </label>
                <span style={{ minWidth: 54, textAlign: "center", fontSize: 13, fontWeight: 900, borderRadius: 6, padding: "4px 6px", background: r.dup ? "#475569" : r.pts > 0 ? "#F5C518" : "#2a2a3a", color: r.dup ? "#e2e8f0" : r.pts > 0 ? "#0A0F14" : "#94a3b8" }}>
                  {r.dup ? "done" : r.complete ? `+${r.pts}` : "–"}
                </span>
                <button onClick={() => setRows(rs => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setRows(rs => [...rs, { q: "", uid: "", h: "", a: "", rat: true }])} style={{ background: "none", border: "1px dashed #4ade80", borderRadius: 8, color: "#4ade80", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800, padding: "6px 12px" }}>+ Add player</button>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
              Exact 10, outcome 5, +3 for the right side of 2.5 goals (max 13). Untick Reason if they gave no rationale: no points. A red name means no matching player.
            </div>
          </div>

          <button onClick={save} disabled={busy || !reason || !toSave.length} style={{ background: toSave.length && reason ? "linear-gradient(135deg,#F5C518,#d4a017)" : "#2a2a3a", border: "none", borderRadius: 8, color: "#0A0F14", cursor: toSave.length && reason ? "pointer" : "default", fontFamily: "inherit", fontSize: 14, fontWeight: 900, padding: "10px" }}>
            {busy ? "Saving…" : reason ? `Save ${toSave.length} player${toSave.length === 1 ? "" : "s"} · ${reason}` : "Enter teams and final score"}
          </button>
          {msg && <div style={{ fontSize: 12, fontWeight: 700, color: msg.ok ? "#4ade80" : "#f87171" }}>{msg.t}</div>}

          {existing.length > 0 && (
            <div style={{ borderTop: "1px solid #2a2a3a", paddingTop: 10 }}>
              <div style={{ ...lbl, display: "flex", justifyContent: "space-between" }}>
                <span>Already scored for this match ({existing.length})</span>
                <button onClick={removeAll} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 800 }}>Remove all</button>
              </div>
              {existing.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#e2e8f0", padding: "3px 0" }}>
                  <span>{nameOf(e.user_id)}</span>
                  <span><b style={{ color: "#F5C518" }}>+{e.points}</b> <button onClick={() => removeOne(e.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

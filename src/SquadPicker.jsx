import { useState, useEffect, useMemo } from "react";

// Admin-only panel: pick a squad for the board you're looking at (for example the weekend's active X engagers).
// Paste their usernames (one per line or comma separated, "@" is ignored) or tick them from the list, then save.
// Turn "Squad only" on and that board's leaderboard shows only the squad. Turn it off and everyone is back.
const box = { background: "#0d0d18", border: "1px solid #2a2a3a", borderRadius: 10, padding: 12, marginTop: 14 };
const inp = { background: "#1a1a24", border: "1.5px solid #2a2a3a", borderRadius: 8, color: "#f0f0f0", fontSize: 14, padding: "8px 10px", outline: "none", fontFamily: "inherit" };
const lbl = { fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
const BOARD_NAMES = { weekly: "Weekly", euro: "Champions & Europa League", monday: "Monday Night", daily: "Daily" };

export default function SquadPicker({ supabase, board, onSaved }) {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [enabled, setEnabled] = useState(false);
  const [search, setSearch] = useState("");
  const [paste, setPaste] = useState("");
  const [missing, setMissing] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("id, username, role").order("username").range(0, 4999);
      setPlayers((p || []).filter(x => x.username && x.role !== "admin"));
      try {
        const { data: m } = await supabase.from("squad_members").select("user_id").eq("board", board);
        setPicked(new Set((m || []).map(x => x.user_id)));
        const { data: s } = await supabase.from("squad_settings").select("enabled").eq("board", board).maybeSingle();
        setEnabled(!!s?.enabled);
        setMsg("");
      } catch { setMsg("Run weekend_squad.sql in Supabase first."); }
    })();
  }, [open, board, supabase]);

  const byName = useMemo(() => {
    const m = new Map();
    players.forEach(p => m.set(p.username.trim().toLowerCase(), p));
    return m;
  }, [players]);

  const toggle = id => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const applyPaste = () => {
    const names = paste.split(/[\n,;]+/).map(s => s.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);
    const found = new Set(picked);
    const notFound = [];
    names.forEach(n => { const p = byName.get(n); if (p) found.add(p.id); else notFound.push(n); });
    setPicked(found);
    setMissing(notFound);
    setMsg(`${names.length - notFound.length} matched${notFound.length ? `, ${notFound.length} not found` : ""}. Press Save squad to keep them.`);
  };

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const del = await supabase.from("squad_members").delete().eq("board", board);
      if (del.error) throw del.error;
      const rows = [...picked].map(user_id => ({ board, user_id }));
      if (rows.length) { const ins = await supabase.from("squad_members").insert(rows); if (ins.error) throw ins.error; }
      const up = await supabase.from("squad_settings").upsert({ board, enabled: enabled && rows.length > 0, updated_at: new Date().toISOString() }, { onConflict: "board" });
      if (up.error) throw up.error;
      if (enabled && !rows.length) setEnabled(false);
      setMsg(`Saved ${rows.length} on the ${BOARD_NAMES[board] || board} squad. Squad only is ${enabled && rows.length ? "ON" : "OFF"}.`);
      onSaved && onSaved();
    } catch (e) { setMsg("Could not save: " + (e.message || e)); }
    setBusy(false);
  };

  const shown = players.filter(p => p.username.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 80);

  return (
    <div style={box}>
      <button onClick={() => setOpen(o => !o)} style={{ ...inp, cursor: "pointer", fontWeight: 800, width: "100%", textAlign: "left" }}>
        {open ? "▾" : "▸"} Squad for {BOARD_NAMES[board] || board} {open ? "" : "(hand-picked players)"}
      </button>
      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={lbl}>Paste usernames</div>
            <textarea style={{ ...inp, width: "100%", minHeight: 70, boxSizing: "border-box" }} placeholder={"one per line or comma separated\n@name is fine"} value={paste} onChange={e => setPaste(e.target.value)} />
            <button onClick={applyPaste} style={{ ...inp, cursor: "pointer", fontWeight: 700, marginTop: 6 }}>Match and tick</button>
            {missing.length > 0 && <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>Not found: {missing.join(", ")}. Check the spelling against their Deep433 username.</div>}
          </div>
          <div>
            <div style={lbl}>Or pick from the list ({picked.size} ticked)</div>
            <input style={{ ...inp, width: "100%", boxSizing: "border-box" }} placeholder="Search a username" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 6, border: "1px solid #2a2a3a", borderRadius: 8 }}>
              {shown.map(p => (
                <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", fontSize: 14, color: "#f0f0f0", cursor: "pointer", borderBottom: "1px solid #1a1a24" }}>
                  <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} />
                  {p.username}
                </label>
              ))}
              {!shown.length && <div style={{ padding: 10, fontSize: 13, color: "#94a3b8" }}>No players found.</div>}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#f0f0f0", fontWeight: 700 }}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            Squad only: this board shows just the ticked players
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={save} disabled={busy} style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800, padding: "10px 14px" }}>{busy ? "Saving..." : "Save squad"}</button>
            <button onClick={() => { setPicked(new Set()); setMissing([]); setMsg("Cleared. Press Save squad to confirm."); }} style={{ ...inp, cursor: "pointer", fontWeight: 700 }}>Clear ticks</button>
          </div>
          {msg && <div style={{ fontSize: 12, color: msg.startsWith("Could not") || msg.startsWith("Run ") ? "#f87171" : "#e2e8f0" }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}

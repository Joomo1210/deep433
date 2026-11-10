// /api/player-board.js
// Season stats for every player in one league, built for the Deep433 player "Stat of the day" cards.
//
// Request cost: the first page tells us how many pages there are, then one request per page of 20 players
// (about 25-30 for a 20-team league). The response is cached on Vercel for 24h, so repeat visits cost nothing.
//   /api/player-board?leagueId=pl
//
// Short keys keep the payload small:
//  n name, ph photo, tm team, lg team crest, pos position, mn minutes, ap appearances, rt rating,
//  g goals, a assists, sh shots, so shots on target, kp key passes, ps passes, tk tackles, ic interceptions,
//  bl blocks, du duels, dw duels won, dr dribbles attempted, ds dribbles completed, fc fouls committed,
//  fd fouls drawn, y yellow, r red, pn penalties scored, pm penalties missed, pw penalties won,
//  sv saves, cn goals conceded (keepers)

const LEAGUES = {
  pl:           { id: 39,  season: 2026, label: "Premier League" },
  championship: { id: 40,  season: 2026, label: "Championship" },
  laliga:       { id: 140, season: 2026, label: "La Liga" },
  seriea:       { id: 135, season: 2026, label: "Serie A" },
  bundesliga:   { id: 78,  season: 2026, label: "Bundesliga" },
  ligue1:       { id: 61,  season: 2026, label: "Ligue 1" },
  ucl:          { id: 2,   season: 2026, label: "Champions League" },
  uel:          { id: 3,   season: 2026, label: "Europa League" },
  uecl:         { id: 848, season: 2026, label: "Conference League" },
  scotprem:     { id: 179, season: 2026, label: "Scottish Premiership" },
  primeiraliga: { id: 94,  season: 2026, label: "Primeira Liga" },
  eredivisie:   { id: 88,  season: 2026, label: "Eredivisie" },
  belgianpro:   { id: 144, season: 2026, label: "Belgian Pro League" },
  superlig:     { id: 203, season: 2026, label: "Super Lig" },
  superleaguegr:{ id: 197, season: 2026, label: "Super League Greece" },
  austrianbl:   { id: 218, season: 2026, label: "Austrian Bundesliga" },
  swisssl:      { id: 207, season: 2026, label: "Swiss Super League" },
  danishsl:     { id: 119, season: 2026, label: "Danish Superliga" },
  eliteserien:  { id: 103, season: 2026, label: "Eliteserien", calendar: true }, // Norway plays a calendar-year season
  czechfl:      { id: 345, season: 2026, label: "Czech First League" },
  croatiahnl:   { id: 210, season: 2026, label: "Croatian HNL" },
  serbiasl:     { id: 286, season: 2026, label: "Serbian SuperLiga" },
  ukraine:      { id: 333, season: 2026, label: "Ukrainian Premier League" },
  ligue2:       { id: 62,  season: 2026, label: "Ligue 2" },
  bundesliga2:  { id: 79,  season: 2026, label: "2. Bundesliga" },
  serieb:       { id: 136, season: 2026, label: "Serie B" },
  segunda:      { id: 141, season: 2026, label: "Segunda Division" },
  npfl:         { id: 399, season: 2026, label: "NPFL" },
};

const num = v => (typeof v === "number" ? v : Number(v) || 0);

export default async function handler(req, res) {
  const { leagueId } = req.query;
  const base = LEAGUES[leagueId];
  // ?season=2025 asks for last season (only this season or the one before is allowed).
  const wanted = Number(req.query.season);
  const league = base && (wanted === base.season - 1) ? { ...base, season: wanted } : base;
  if (!league) return res.status(400).json({ error: `Unknown leagueId: ${leagueId}`, leagues: Object.keys(LEAGUES) });
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  const getPage = async page => {
    const r = await fetch(`https://v3.football.api-sports.io/players?league=${league.id}&season=${league.season}&page=${page}`, { headers: { "x-apisports-key": apiKey } });
    if (!r.ok) throw new Error(`API-Football ${r.status}`);
    const data = await r.json();
    const errCount = Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors || {}).length;
    if (errCount > 0) throw new Error(`API-Football: ${JSON.stringify(data.errors)}`);
    return data;
  };

  // A player can have more than one entry in a league (moved clubs mid-season): add them up, keep the latest club.
  const toRow = item => {
    const stats = (item.statistics || []).filter(s => num(s.games?.appearences) > 0 || num(s.games?.minutes) > 0);
    if (!stats.length) return null;
    const sum = fn => stats.reduce((t, s) => t + num(fn(s)), 0);
    const last = stats[stats.length - 1];
    const ratedMinutes = sum(s => (s.games?.rating ? num(s.games?.minutes) : 0));
    const rt = ratedMinutes ? stats.reduce((t, s) => t + (s.games?.rating ? num(s.games.rating) * num(s.games?.minutes) : 0), 0) / ratedMinutes : 0;
    return {
      n: item.player?.name, ph: item.player?.photo, tm: last.team?.name, lg: last.team?.logo, pos: last.games?.position,
      mn: sum(s => s.games?.minutes), ap: sum(s => s.games?.appearences), rt: Math.round(rt * 100) / 100,
      g: sum(s => s.goals?.total), a: sum(s => s.goals?.assists), sh: sum(s => s.shots?.total), so: sum(s => s.shots?.on),
      kp: sum(s => s.passes?.key), ps: sum(s => s.passes?.total), tk: sum(s => s.tackles?.total), ic: sum(s => s.tackles?.interceptions),
      bl: sum(s => s.tackles?.blocks), du: sum(s => s.duels?.total), dw: sum(s => s.duels?.won),
      dr: sum(s => s.dribbles?.attempts), ds: sum(s => s.dribbles?.success),
      fc: sum(s => s.fouls?.committed), fd: sum(s => s.fouls?.drawn), y: sum(s => s.cards?.yellow), r: sum(s => s.cards?.red),
      pn: sum(s => s.penalty?.scored), pm: sum(s => s.penalty?.missed), pw: sum(s => s.penalty?.won),
      sv: sum(s => s.goals?.saves), cn: sum(s => s.goals?.conceded),
    };
  };

  try {
    const first = await getPage(1);
    const totalPages = num(first.paging?.total) || 1;
    if (!(first.response || []).length) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ available: false, league: league.label });
    }
    const pages = { 1: first.response };
    // Batches of 10 so we stay under the per-minute limit; failed pages get one more try.
    const fetchPages = async list => {
      const failed = [];
      for (let i = 0; i < list.length; i += 10) {
        const batch = list.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(p => getPage(p)));
        results.forEach((r, j) => { if (r.status === "fulfilled") pages[batch[j]] = r.value.response || []; else failed.push(batch[j]); });
      }
      return failed;
    };
    const all = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    let failed = await fetchPages(all);
    if (failed.length) failed = await fetchPages(failed);

    const byId = new Map();
    Object.values(pages).flat().forEach(item => { const row = toRow(item); if (row) byId.set(item.player?.id, row); });
    const players = [...byId.values()];

    res.setHeader("Cache-Control", failed.length ? "public, s-maxage=300" : "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({
      available: true, league: league.label, season: league.season, calendar: !!league.calendar,
      generatedAt: new Date().toISOString(), pages: totalPages, missingPages: failed, players,
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Failed to build player board", detail: err.message });
  }
}

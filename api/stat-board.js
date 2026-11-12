// /api/stat-board.js
// Season stats for every team in one league, built for the Deep433 "Stat of the day" cards.
//
// Request cost: 1 standings call + 1 team-statistics call per team (about 21 for a 20-team league).
// The response is cached on Vercel for 24h, so repeat visits cost nothing.
//   /api/stat-board?leagueId=pl
//
// What comes back per team: played, goals for/against, clean sheets, failed to score,
// goals in minutes 76+ (late goals for), goals conceded in minutes 0-15, yellow/red cards,
// home and away points, longest win/draw/loss streaks, penalties, form.

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
const sumBuckets = (obj, keys) => keys.reduce((t, k) => t + num(obj?.[k]?.total), 0);

async function teamsHandler(req, res) {
  const { leagueId } = req.query;
  const league = LEAGUES[leagueId];
  if (!league) return res.status(400).json({ error: `Unknown leagueId: ${leagueId}`, leagues: Object.keys(LEAGUES) });

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  const get = async path => {
    const r = await fetch(`https://v3.football.api-sports.io/${path}`, { headers: { "x-apisports-key": apiKey } });
    if (!r.ok) throw new Error(`API-Football ${r.status}`);
    const data = await r.json();
    const errCount = Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors || {}).length;
    if (errCount > 0) throw new Error(`API-Football: ${JSON.stringify(data.errors)}`);
    return data.response || [];
  };

  try {
    const standings = await get(`standings?league=${league.id}&season=${league.season}`);
    const groups = standings?.[0]?.league?.standings || [];
    const table = groups.flat();
    if (!table.length) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ available: false, league: league.label });
    }

    const teams = table.map(row => ({
      id: row.team?.id,
      name: row.team?.name,
      logo: row.team?.logo,
      rank: row.rank,
      points: row.points,
      form: row.form,
    })).filter(t => t.id);

    const toRow = (t, s) => {
      const played = num(s.fixtures?.played?.total);
      const yellow = Object.values(s.cards?.yellow || {}).reduce((a, b) => a + num(b?.total), 0);
      const red = Object.values(s.cards?.red || {}).reduce((a, b) => a + num(b?.total), 0);
      return {
        team: t.name,
        logo: t.logo,
        rank: t.rank,
        points: t.points,
        form: t.form,
        played,
        goalsFor: num(s.goals?.for?.total?.total),
        goalsAgainst: num(s.goals?.against?.total?.total),
        cleanSheets: num(s.clean_sheet?.total),
        failedToScore: num(s.failed_to_score?.total),
        lateGoalsFor: sumBuckets(s.goals?.for?.minute, ["76-90", "91-105", "106-120"]),
        earlyGoalsAgainst: num(s.goals?.against?.minute?.["0-15"]?.total),
        yellow,
        red,
        homePoints: num(s.fixtures?.wins?.home) * 3 + num(s.fixtures?.draws?.home),
        awayPoints: num(s.fixtures?.wins?.away) * 3 + num(s.fixtures?.draws?.away),
        homePlayed: num(s.fixtures?.played?.home),
        awayPlayed: num(s.fixtures?.played?.away),
        winStreak: num(s.biggest?.streak?.wins),
        drawStreak: num(s.biggest?.streak?.draws),
        loseStreak: num(s.biggest?.streak?.loses),
        penScored: num(s.penalty?.scored?.total),
        penMissed: num(s.penalty?.missed?.total),
      };
    };

    // Batches of 10 so we stay well under the per-minute limit. Any team whose request
    // fails is tried once more, and anyone still missing is reported rather than dropped silently.
    const fetchBatch = async batch => {
      const done = [], failed = [];
      const results = await Promise.allSettled(
        batch.map(t => get(`teams/statistics?league=${league.id}&season=${league.season}&team=${t.id}`))
      );
      results.forEach((r, j) => {
        if (r.status === "fulfilled" && r.value && !Array.isArray(r.value)) done.push(toRow(batch[j], r.value));
        else failed.push(batch[j]);
      });
      return { done, failed };
    };
    const out = [];
    let retry = [];
    for (let i = 0; i < teams.length; i += 10) {
      const { done, failed } = await fetchBatch(teams.slice(i, i + 10));
      out.push(...done);
      retry.push(...failed);
    }
    let missing = [];
    if (retry.length) {
      const { done, failed } = await fetchBatch(retry);
      out.push(...done);
      missing = failed.map(t => t.name);
    }

    res.setHeader("Cache-Control", missing.length ? "public, s-maxage=300" : "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({
      available: true,
      league: league.label,
      season: league.season,
      calendar: !!league.calendar,
      generatedAt: new Date().toISOString(),
      expected: teams.length,
      missing,
      teams: out,
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Failed to build stat board", detail: err.message });
  }
}


// ───── Players (merged here so the project stays within the Hobby plan's 12 function limit) ─────
// /api/stat-board?type=players&leagueId=pl            all players, this season
// /api/stat-board?type=players&leagueId=pl&season=2025   last season
const PLAYER_LEAGUES = {
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


async function playersHandler(req, res) {
  const { leagueId } = req.query;
  const base = PLAYER_LEAGUES[leagueId];
  // ?season=2025 asks for last season (only this season or the one before is allowed).
  const wanted = Number(req.query.season);
  const league = base && (wanted === base.season - 1) ? { ...base, season: wanted } : base;
  if (!league) return res.status(400).json({ error: `Unknown leagueId: ${leagueId}`, leagues: Object.keys(PLAYER_LEAGUES) });
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
      id: item.player?.id, ag: num(item.player?.age), n: item.player?.name, ph: item.player?.photo, tm: last.team?.name, lg: last.team?.logo, pos: last.games?.position,
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
    const only = String(req.query.pages || "").split(",").map(Number).filter(n => n > 0);
    const pages = {};
    // Small batches with a pause between them, and up to three passes over anything that failed.
    const fetchPages = async list => {
      const failed = [];
      for (let i = 0; i < list.length; i += 5) {
        const batch = list.slice(i, i + 5);
        const results = await Promise.allSettled(batch.map(p => getPage(p)));
        results.forEach((r, j) => { if (r.status === "fulfilled") pages[batch[j]] = r.value.response || []; else failed.push(batch[j]); });
        if (i + 5 < list.length) await new Promise(r => setTimeout(r, 250));
      }
      return failed;
    };
    const retry = async list => {
      let failed = await fetchPages(list);
      for (let k = 0; k < 2 && failed.length; k++) { await new Promise(r => setTimeout(r, 700)); failed = await fetchPages(failed); }
      return failed;
    };
    const rowsOf = () => { const byId = new Map(); Object.values(pages).flat().forEach(item => { const row = toRow(item); if (row) byId.set(item.player?.id, row); }); return [...byId.values()]; };

    // ?pages=3,7 : only fetch those pages (used to fill in pages that failed on the first go).
    if (only.length) {
      const failed = await retry(only);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ available: true, partial: true, league: league.label, season: league.season, missingPages: failed, players: rowsOf() });
    }

    let first;
    try { first = await getPage(1); } catch { await new Promise(r => setTimeout(r, 700)); first = await getPage(1); }
    const totalPages = num(first.paging?.total) || 1;
    if (!(first.response || []).length) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ available: false, league: league.label });
    }
    pages[1] = first.response;
    const failed = await retry(Array.from({ length: totalPages - 1 }, (_, i) => i + 2));
    const players = rowsOf();

    res.setHeader("Cache-Control", failed.length ? "no-store" : "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({
      available: true, league: league.label, season: league.season, calendar: !!league.calendar,
      generatedAt: new Date().toISOString(), pages: totalPages, missingPages: failed, players,
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Failed to build player board", detail: err.message });
  }
}

export default async function handler(req, res) {
  if (req.query.type === "players") return playersHandler(req, res);
  return teamsHandler(req, res);
}

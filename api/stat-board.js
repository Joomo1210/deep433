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

export default async function handler(req, res) {
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

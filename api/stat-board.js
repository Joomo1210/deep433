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
  scotprem:     { id: 179, season: 2026, label: "Scottish Premiership" },
  ucl:          { id: 2,   season: 2026, label: "Champions League" },
  uel:          { id: 3,   season: 2026, label: "Europa League" },
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

    // Batches of 10 so we stay well under the per-minute limit.
    const out = [];
    for (let i = 0; i < teams.length; i += 10) {
      const batch = teams.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(t => get(`teams/statistics?league=${league.id}&season=${league.season}&team=${t.id}`))
      );
      results.forEach((r, j) => {
        const t = batch[j];
        if (r.status !== "fulfilled" || !r.value || Array.isArray(r.value)) return;
        const s = r.value;
        const played = num(s.fixtures?.played?.total);
        const yellow = Object.values(s.cards?.yellow || {}).reduce((a, b) => a + num(b?.total), 0);
        const red = Object.values(s.cards?.red || {}).reduce((a, b) => a + num(b?.total), 0);
        out.push({
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
        });
      });
    }

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({
      available: true,
      league: league.label,
      season: league.season,
      generatedAt: new Date().toISOString(),
      teams: out,
    });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Failed to build stat board", detail: err.message });
  }
}

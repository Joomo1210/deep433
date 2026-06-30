// /api/match-lineup.js
// Fetches real starting lineup + formation for ONE specific match, once announced.
// Usage: /api/match-lineup?leagueId=wc2026&date=2026-06-28&home=South%20Africa&away=Canada
//
// Lineups are usually only published 20-60 minutes before kickoff — until then,
// this will return { available: false } and the frontend should keep showing flags.

const LEAGUE_MAP = {
  wc2026:      "WC",
  pl:          "PL",
  laliga:      "PD",
  seriea:      "SA",
  bundesliga:  "BL1",
  ligue1:      "FL1",
  ucl:         "CL",
};

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export default async function handler(req, res) {
  const { leagueId, date, home, away } = req.query;

  if (!leagueId || !date || !home || !away) {
    return res.status(400).json({ error: "leagueId, date, home and away are required" });
  }

  const competitionCode = LEAGUE_MAP[leagueId];
  if (!competitionCode) {
    return res.status(400).json({ available: false, error: `League "${leagueId}" not supported` });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
  }

  try {
    // Step 1: find the match ID for this fixture on this date
    const listUrl = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?dateFrom=${date}&dateTo=${date}`;
    const listRes = await fetch(listUrl, { headers: { "X-Auth-Token": apiKey } });
    if (!listRes.ok) {
      return res.status(listRes.status).json({ available: false, error: "Could not fetch fixture list" });
    }
    const listData = await listRes.json();

    const h = normalize(home);
    const a = normalize(away);
    const match = (listData.matches || []).find(m =>
      (normalize(m.homeTeam?.name) === h && normalize(m.awayTeam?.name) === a) ||
      (normalize(m.homeTeam?.name) === a && normalize(m.awayTeam?.name) === h)
    );

    if (!match) {
      return res.status(200).json({ available: false, reason: "Match not found for that date" });
    }

    // Step 2: fetch the single match endpoint, which includes lineup data when published
    const matchUrl = `https://api.football-data.org/v4/matches/${match.id}`;
    const matchRes = await fetch(matchUrl, { headers: { "X-Auth-Token": apiKey } });
    if (!matchRes.ok) {
      return res.status(200).json({ available: false, reason: "Could not fetch match detail" });
    }
    const matchData = await matchRes.json();

    const homeLineup = matchData.homeTeam?.lineup;
    const awayLineup = matchData.awayTeam?.lineup;

    if (!homeLineup?.length || !awayLineup?.length) {
      return res.status(200).json({ available: false, reason: "Lineups not yet announced" });
    }

    return res.status(200).json({
      available: true,
      home: {
        formation: matchData.homeTeam?.formation || null,
        players: homeLineup.map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber })),
      },
      away: {
        formation: matchData.awayTeam?.formation || null,
        players: awayLineup.map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber })),
      },
    });
  } catch (err) {
    return res.status(500).json({ available: false, error: err.message });
  }
}

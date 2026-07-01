// /api/match-lineup.js
// Fetches confirmed starting lineup for one specific match using API-Football.
// Lineups available 20-40 minutes before kickoff.
// Usage: /api/match-lineup?leagueId=wc2026&date=2026-07-01&home=England&away=Congo%20DR

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2025 },
  laliga:      { id: 140, season: 2025 },
  seriea:      { id: 135, season: 2025 },
  bundesliga:  { id: 78,  season: 2025 },
  ligue1:      { id: 61,  season: 2025 },
  ucl:         { id: 2,   season: 2025 },
  uel:         { id: 3,   season: 2025 },
  facup:       { id: 45,  season: 2025 },
  copadelrey:  { id: 143, season: 2025 },
  afcon:       { id: 6,   season: 2025 },
  copamerica:  { id: 9,   season: 2024 },
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

  const league = LEAGUE_MAP[leagueId];
  if (!league) {
    return res.status(200).json({ available: false, error: `League "${leagueId}" not supported` });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    // Step 1: find the fixture ID for this match on this date
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}&date=${date}`;
    const fixturesRes = await fetch(fixturesUrl, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!fixturesRes.ok) {
      return res.status(200).json({ available: false, reason: "Could not fetch fixture list" });
    }

    const fixturesData = await fixturesRes.json();
    const h = normalize(home);
    const a = normalize(away);

    const match = (fixturesData.response || []).find(f =>
      (normalize(f.teams?.home?.name) === h && normalize(f.teams?.away?.name) === a) ||
      (normalize(f.teams?.home?.name) === a && normalize(f.teams?.away?.name) === h)
    );

    if (!match) {
      return res.status(200).json({ available: false, reason: "Match not found for that date" });
    }

    const fixtureId = match.fixture?.id;

    // Step 2: fetch lineups for this specific fixture
    const lineupUrl = `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`;
    const lineupRes = await fetch(lineupUrl, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!lineupRes.ok) {
      return res.status(200).json({ available: false, reason: "Could not fetch lineup data" });
    }

    const lineupData = await lineupRes.json();
    const lineups = lineupData.response || [];

    if (!lineups.length) {
      return res.status(200).json({ available: false, reason: "Lineups not yet announced" });
    }

    // Map home/away lineups — API returns them in home/away order matching the fixture
    const homeLineup = lineups.find(l => normalize(l.team?.name) === h) || lineups[0];
    const awayLineup = lineups.find(l => normalize(l.team?.name) === a) || lineups[1];

    if (!homeLineup?.startXI?.length || !awayLineup?.startXI?.length) {
      return res.status(200).json({ available: false, reason: "Lineups not yet announced" });
    }

    return res.status(200).json({
      available: true,
      home: {
        formation: homeLineup.formation || null,
        players: homeLineup.startXI.map(p => ({
          name: p.player?.name,
          number: p.player?.number,
          position: p.player?.pos,
        })),
      },
      away: {
        formation: awayLineup.formation || null,
        players: awayLineup.startXI.map(p => ({
          name: p.player?.name,
          number: p.player?.number,
          position: p.player?.pos,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ available: false, error: err.message });
  }
}

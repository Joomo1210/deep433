// /api/match-lineup.js
// Fetches confirmed lineup for a match.
// Mode 1: fixtureId only — returns full lineup with grid coords + player photos (for Pitch View)
// Mode 2: leagueId + date + home + away — searches by match details (for prediction history)

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2026 },
  laliga:      { id: 140, season: 2026 },
  seriea:      { id: 135, season: 2026 },
  bundesliga:  { id: 78,  season: 2026 },
  ligue1:      { id: 61,  season: 2026 },
  ucl:         { id: 2,   season: 2026 },
  uel:         { id: 3,   season: 2026 },
  facup:       { id: 45,  season: 2026 },
  copadelrey:  { id: 143, season: 2026 },
  afcon:       { id: 6,   season: 2025 },
  copamerica:  { id: 9,   season: 2024 },
  championship: { id: 40,  season: 2026 },
  segunda:      { id: 141, season: 2026 },
  ligue2:       { id: 62,  season: 2026 },
  bundesliga2:  { id: 79,  season: 2026 },
  serieb:       { id: 136, season: 2026 },
  npfl:         { id: 399, season: 2026 },
  scotprem:     { id: 179, season: 2026 },
};

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const mapTeam = (lineup, includeGrid = false) => ({
  team: lineup.team?.name,
  logo: lineup.team?.logo,
  formation: lineup.formation,
  coach: lineup.coach?.name,
  players: (lineup.startXI || []).map(p => ({
    name: p.player?.name,
    number: p.player?.number,
    position: p.player?.pos,
    ...(includeGrid ? { photo: p.player?.photo || null, grid: p.player?.grid || null } : {}),
  })),
  substitutes: (lineup.substitutes || []).map(p => ({
    name: p.player?.name,
    number: p.player?.number,
    position: p.player?.pos,
    ...(includeGrid ? { photo: p.player?.photo || null } : {}),
  })),
});

async function fetchLineupByFixtureId(fixtureId, apiKey) {
  const r = await fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`, {
    headers: { "x-apisports-key": apiKey }
  });
  const data = await r.json();
  return data.response || [];
}

export default async function handler(req, res) {
  const { fixtureId, leagueId, date, home, away } = req.query;
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  try {
    // Mode 1: direct fixtureId — pitch view with grid + photos
    if (fixtureId && !leagueId) {
      const lineups = await fetchLineupByFixtureId(fixtureId, apiKey);
      if (!lineups.length) return res.status(200).json({ available: false, reason: "Lineups not yet announced" });

      // Match each lineup entry to home/away by the fixture's own team name
      // rather than trusting array position — API-Football does not
      // guarantee lineups[0] is the home team, and blindly assuming so
      // risks mislabeling (or worse, mixing) squads if the order ever
      // differs. Reuses the same normalize()-based name matching Mode 2
      // below already relies on; homeTeam/awayTeam are optional query
      // params supplied by the caller for exactly this purpose.
      const { homeTeam: expectedHome, awayTeam: expectedAway } = req.query;
      let homeL, awayL;
      if (expectedHome || expectedAway) {
        const h = normalize(expectedHome);
        const a = normalize(expectedAway);
        homeL = lineups.find(l => normalize(l.team?.name) === h);
        awayL = lineups.find(l => normalize(l.team?.name) === a);
      }
      // Fall back to array order only if no team names were given, or the
      // name match failed to find both sides (keeps older callers working).
      if (!homeL || !awayL) {
        homeL = lineups[0];
        awayL = lineups[1];
      }

      if (!homeL?.startXI?.length) return res.status(200).json({ available: false, reason: "Lineups not yet announced" });

      return res.status(200).json({
        available: true,
        home: mapTeam(homeL, true),
        away: awayL ? mapTeam(awayL, true) : null,
        // Raw API response, unfiltered — lets the frontend offer a
        // "show raw data" debug view so a mislabeling or data issue can be
        // diagnosed directly against what API-Football actually sent,
        // rather than guessing from what ended up rendered on screen.
        _raw: lineups,
      });
    }

    // Mode 2: leagueId + date + home + away — search then fetch
    if (!leagueId || !date || !home || !away) {
      return res.status(400).json({ error: "Provide either fixtureId, or leagueId + date + home + away" });
    }

    const league = LEAGUE_MAP[leagueId];
    if (!league) return res.status(200).json({ available: false, error: `League "${leagueId}" not supported` });

    const fixturesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}&date=${date}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const fixturesData = await fixturesRes.json();
    const h = normalize(home);
    const a = normalize(away);

    const match = (fixturesData.response || []).find(f =>
      (normalize(f.teams?.home?.name) === h && normalize(f.teams?.away?.name) === a) ||
      (normalize(f.teams?.home?.name) === a && normalize(f.teams?.away?.name) === h)
    );

    if (!match) return res.status(200).json({ available: false, reason: "Match not found for that date" });

    const lineups = await fetchLineupByFixtureId(match.fixture?.id, apiKey);
    if (!lineups.length) return res.status(200).json({ available: false, reason: "Lineups not yet announced" });

    const homeLineup = lineups.find(l => normalize(l.team?.name) === h) || lineups[0];
    const awayLineup = lineups.find(l => normalize(l.team?.name) === a) || lineups[1];

    if (!homeLineup?.startXI?.length) return res.status(200).json({ available: false, reason: "Lineups not yet announced" });

    return res.status(200).json({
      available: true,
      home: mapTeam(homeLineup, false),
      away: awayLineup ? mapTeam(awayLineup, false) : null,
    });

  } catch (err) {
    return res.status(500).json({ available: false, error: err.message });
  }
}

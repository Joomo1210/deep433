// /api/live-scores.js
// Fetches fixtures + live status/scores from API-Football for any competition.
// Usage: /api/live-scores?leagueId=wc2026&date=2026-06-28&season=2026

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

function mapStatus(shortStatus) {
  const live = ["1H", "HT", "2H", "ET", "BT", "P", "INT"];
  const finished = ["FT", "AET", "PEN"];
  if (live.includes(shortStatus)) return "live";
  if (finished.includes(shortStatus)) return "finished";
  return "upcoming";
}

export default async function handler(req, res) {
  const { leagueId, date, season } = req.query;

  if (!leagueId || !date) {
    return res.status(400).json({ error: "leagueId and date are required" });
  }

  const league = LEAGUE_MAP[leagueId];
  if (!league) {
    return res.status(400).json({ error: `Unknown leagueId: ${leagueId}` });
  }

  const seasonToUse = season || league.season;
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const url = `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${seasonToUse}&date=${date}`;
    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "API-Football error", detail: text });
    }

    const data = await response.json();

    const fixtures = (data.response || []).map(f => ({
      home: f.teams?.home?.name,
      away: f.teams?.away?.name,
      status: mapStatus(f.fixture?.status?.short),
      statusRaw: f.fixture?.status?.short,
      elapsed: f.fixture?.status?.elapsed,
      kickoff: f.fixture?.date,
      fixtureId: f.fixture?.id,
      score: {
        home: f.goals?.home,
        away: f.goals?.away,
      },
    }));

    return res.status(200).json({ fixtures });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch live scores", detail: err.message });
  }
}

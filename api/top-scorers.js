// /api/top-scorers.js
// Fetches top scorers, top assists, top cards for a league/season
// Usage: /api/top-scorers?leagueId=wc2026&type=scorers

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2025 },
  laliga:      { id: 140, season: 2025 },
  seriea:      { id: 135, season: 2025 },
  bundesliga:  { id: 78,  season: 2025 },
  ligue1:      { id: 61,  season: 2025 },
  ucl:         { id: 2,   season: 2025 },
};

export default async function handler(req, res) {
  const { leagueId, type = "scorers" } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId required" });

  const league = LEAGUE_MAP[leagueId];
  if (!league) return res.status(400).json({ error: "Unknown league" });

  const apiKey = process.env.API_FOOTBALL_KEY;
  const endpointMap = {
    scorers: "topscorers",
    assists: "topassists",
    cards:   "topcards",
  };
  const endpoint = endpointMap[type] || "topscorers";

  try {
    const r = await fetch(`https://v3.football.api-sports.io/players/${endpoint}?league=${league.id}&season=${league.season}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();
    const players = (data.response || []).slice(0, 10).map(p => ({
      name: p.player?.name,
      photo: p.player?.photo,
      nationality: p.player?.nationality,
      team: p.statistics?.[0]?.team?.name,
      teamLogo: p.statistics?.[0]?.team?.logo,
      goals: p.statistics?.[0]?.goals?.total,
      assists: p.statistics?.[0]?.goals?.assists,
      yellowCards: p.statistics?.[0]?.cards?.yellow,
      redCards: p.statistics?.[0]?.cards?.red,
      appearances: p.statistics?.[0]?.games?.appearences,
      rating: p.statistics?.[0]?.games?.rating,
    }));

    res.status(200).json({ available: true, type, players });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

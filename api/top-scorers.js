// /api/top-scorers.js
// Fetches top scorers, top assists, top cards for a league/season
// Usage: /api/top-scorers?leagueId=wc2026&type=scorers

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2026 },
  laliga:      { id: 140, season: 2026 },
  seriea:      { id: 135, season: 2026 },
  bundesliga:  { id: 78,  season: 2026 },
  ligue1:      { id: 61,  season: 2026 },
  ucl:         { id: 2,   season: 2026 },
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
    const players = (data.response || []).slice(0, 20).map(p => ({
      name: p.player?.name,
      photo: p.player?.photo,
      nationality: p.player?.nationality,
      team: p.statistics?.[0]?.team?.name,
      teamLogo: p.statistics?.[0]?.team?.logo,
      goals: p.statistics?.[0]?.goals?.total || 0,
      assists: p.statistics?.[0]?.goals?.assists || 0,
      yellowCards: p.statistics?.[0]?.cards?.yellow || 0,
      redCards: p.statistics?.[0]?.cards?.red || 0,
      appearances: p.statistics?.[0]?.games?.appearences,
      rating: p.statistics?.[0]?.games?.rating,
    }));

    // Sort by the correct metric for each type
    const sortKey = type === "assists" ? "assists" : type === "cards" ? "yellowCards" : "goals";
    const sorted = players
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
      .slice(0, 10);

    res.status(200).json({ available: true, type, players: sorted });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

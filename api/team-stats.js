// /api/team-stats.js
// Fetches season statistics for a specific team in a league
// Usage: /api/team-stats?leagueId=pl&teamId=33

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
  const { leagueId, teamId } = req.query;
  if (!leagueId || !teamId) return res.status(400).json({ error: "leagueId and teamId required" });

  const league = LEAGUE_MAP[leagueId];
  if (!league) return res.status(400).json({ error: "Unknown league" });

  const apiKey = process.env.API_FOOTBALL_KEY;
  try {
    const r = await fetch(`https://v3.football.api-sports.io/teams/statistics?league=${league.id}&season=${league.season}&team=${teamId}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();
    const s = data.response;
    if (!s) return res.status(200).json({ available: false });

    res.status(200).json({
      available: true,
      team: s.team?.name,
      logo: s.team?.logo,
      form: s.form,
      played: s.fixtures?.played?.total,
      wins: s.fixtures?.wins?.total,
      draws: s.fixtures?.draws?.total,
      losses: s.fixtures?.loses?.total,
      goalsFor: s.goals?.for?.total?.total,
      goalsAgainst: s.goals?.against?.total?.total,
      cleanSheets: s.clean_sheet?.total,
      failedToScore: s.failed_to_score?.total,
      biggestWin: s.biggest?.wins?.total,
      biggestLoss: s.biggest?.loses?.total,
      avgGoalsFor: s.goals?.for?.average?.total,
      avgGoalsAgainst: s.goals?.against?.average?.total,
    });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

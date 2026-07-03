// /api/match-stats.js
// Fetches full match statistics for a specific fixture
// Usage: /api/match-stats?fixtureId=1567311

export default async function handler(req, res) {
  const { fixtureId } = req.query;
  if (!fixtureId) return res.status(400).json({ error: "fixtureId required" });

  const apiKey = process.env.API_FOOTBALL_KEY;
  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();
    const teams = data.response || [];
    if (teams.length < 2) return res.status(200).json({ available: false });

    const parseStat = (team, type) => {
      const s = team.statistics?.find(s => s.type === type);
      return s?.value ?? null;
    };

    const result = teams.map(team => ({
      team: team.team?.name,
      logo: team.team?.logo,
      stats: {
        possession:      parseStat(team, "Ball Possession"),
        shotsTotal:      parseStat(team, "Total Shots"),
        shotsOnGoal:     parseStat(team, "Shots on Goal"),
        shotsOffGoal:    parseStat(team, "Shots off Goal"),
        shotsBlocked:    parseStat(team, "Blocked Shots"),
        shotsInsideBox:  parseStat(team, "Shots insidebox"),
        shotsOutsideBox: parseStat(team, "Shots outsidebox"),
        corners:         parseStat(team, "Corner Kicks"),
        offsides:        parseStat(team, "Offsides"),
        fouls:           parseStat(team, "Fouls"),
        yellowCards:     parseStat(team, "Yellow Cards"),
        redCards:        parseStat(team, "Red Cards"),
        saves:           parseStat(team, "Goalkeeper Saves"),
        passesTotal:     parseStat(team, "Total passes"),
        passesAccurate:  parseStat(team, "Passes accurate"),
        passAccuracy:    parseStat(team, "Passes %"),
      }
    }));

    res.status(200).json({ available: true, home: result[0], away: result[1] });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

// /api/injuries.js
// Fetches injury and suspension data for a specific fixture from API-Football.
// Usage: /api/injuries?fixtureId=1567307
// Returns lists of unavailable players for home and away teams.

export default async function handler(req, res) {
  const { fixtureId } = req.query;

  if (!fixtureId) {
    return res.status(400).json({ error: "fixtureId is required" });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const url = `https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`;
    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!response.ok) {
      return res.status(200).json({ home: [], away: [], error: "Could not fetch injury data" });
    }

    const data = await response.json();
    const injuries = data.response || [];

    if (!injuries.length) {
      return res.status(200).json({ home: [], away: [] });
    }

    // Group by team — API returns all players mixed together with their team info
    const homeTeamId = injuries[0]?.team?.id;
    const home = [];
    const away = [];

    injuries.forEach(entry => {
      const player = {
        name: entry.player?.name,
        reason: entry.player?.reason, // e.g. "Suspended", "Knee Injury", "Doubtful"
        type: entry.player?.type,     // "Missing Fixture" or "Questionable"
      };
      if (entry.team?.id === homeTeamId) {
        home.push(player);
      } else {
        away.push(player);
      }
    });

    return res.status(200).json({ home, away });
  } catch (err) {
    // Fail silently — injuries are supplementary data, not critical
    return res.status(200).json({ home: [], away: [], error: err.message });
  }
}

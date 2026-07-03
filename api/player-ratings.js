// /api/player-ratings.js
// Fetches player ratings and stats for a specific fixture
// Usage: /api/player-ratings?fixtureId=1567311

export default async function handler(req, res) {
  const { fixtureId } = req.query;
  if (!fixtureId) return res.status(400).json({ error: "fixtureId required" });

  const apiKey = process.env.API_FOOTBALL_KEY;
  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();
    const teams = data.response || [];
    if (!teams.length) return res.status(200).json({ available: false });

    const mapPlayers = (team) => team.players?.map(p => ({
      name: p.player?.name,
      photo: p.player?.photo,
      position: p.statistics?.[0]?.games?.position,
      rating: p.statistics?.[0]?.games?.rating,
      minutesPlayed: p.statistics?.[0]?.games?.minutes,
      goals: p.statistics?.[0]?.goals?.total,
      assists: p.statistics?.[0]?.goals?.assists,
      shots: p.statistics?.[0]?.shots?.total,
      shotsOnGoal: p.statistics?.[0]?.shots?.on,
      keyPasses: p.statistics?.[0]?.passes?.key,
      passAccuracy: p.statistics?.[0]?.passes?.accuracy,
      dribbles: p.statistics?.[0]?.dribbles?.success,
      tackles: p.statistics?.[0]?.tackles?.total,
      yellowCards: p.statistics?.[0]?.cards?.yellow,
      redCards: p.statistics?.[0]?.cards?.red,
    })).filter(p => p.minutesPlayed > 0) || [];

    res.status(200).json({
      available: true,
      home: { team: teams[0]?.team?.name, logo: teams[0]?.team?.logo, players: mapPlayers(teams[0]) },
      away: { team: teams[1]?.team?.name, logo: teams[1]?.team?.logo, players: mapPlayers(teams[1]) },
    });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

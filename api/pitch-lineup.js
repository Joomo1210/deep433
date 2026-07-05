// /api/pitch-lineup.js
// Fetches confirmed lineup with grid coordinates and player photos for pitch view
// Usage: /api/pitch-lineup?fixtureId=1570714

export default async function handler(req, res) {
  const { fixtureId } = req.query;
  if (!fixtureId) return res.status(400).json({ error: "fixtureId required" });

  const apiKey = process.env.API_FOOTBALL_KEY;

  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`, {
      headers: { "x-apisports-key": apiKey }
    });
    const data = await r.json();
    const lineups = data.response || [];

    if (!lineups.length) {
      return res.status(200).json({ available: false, reason: "Lineups not yet announced" });
    }

    const mapTeam = (lineup) => ({
      team: lineup.team?.name,
      logo: lineup.team?.logo,
      formation: lineup.formation,
      coach: lineup.coach?.name,
      players: (lineup.startXI || []).map(p => ({
        name: p.player?.name,
        number: p.player?.number,
        position: p.player?.pos,
        photo: p.player?.photo || null,
        grid: p.player?.grid || null,
      })),
      substitutes: (lineup.substitutes || []).map(p => ({
        name: p.player?.name,
        number: p.player?.number,
        position: p.player?.pos,
        photo: p.player?.photo || null,
      })),
    });

    const home = lineups[0] ? mapTeam(lineups[0]) : null;
    const away = lineups[1] ? mapTeam(lineups[1]) : null;

    if (!home?.players?.length) {
      return res.status(200).json({ available: false, reason: "Lineups not yet announced" });
    }

    res.status(200).json({ available: true, home, away });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
}

// /api/live-scores.js
// Fetches fixtures + live status/scores from football-data.org for supported competitions.
// Usage: /api/live-scores?leagueId=wc2026&date=2026-06-28

// Map your app's league IDs to football-data.org's competition codes.
// Free tier covers: WC, CL, BL1, DED, BSA, PD, FL1, ELC, PPL, EC, SA, PL
const LEAGUE_MAP = {
  wc2026:      "WC",
  pl:          "PL",
  laliga:      "PD",
  seriea:      "SA",
  bundesliga:  "BL1",
  ligue1:      "FL1",
  ucl:         "CL",
  // Not covered by football-data.org's free tier:
  // uel, facup, copadelrey, afcon, copamerica
};

// Map football-data.org's status values to simple states our app understands.
function mapStatus(status) {
  const live = ["IN_PLAY", "PAUSED"];
  const finished = ["FINISHED", "AWARDED"];
  if (live.includes(status)) return "live";
  if (finished.includes(status)) return "finished";
  return "upcoming"; // SCHEDULED, TIMED, POSTPONED, etc.
}

export default async function handler(req, res) {
  const { leagueId, date } = req.query;

  if (!leagueId || !date) {
    return res.status(400).json({ error: "leagueId and date are required" });
  }

  const competitionCode = LEAGUE_MAP[leagueId];
  if (!competitionCode) {
    return res.status(400).json({
      error: `League "${leagueId}" isn't covered by football-data.org's free tier`,
    });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?dateFrom=${date}&dateTo=${date}`;
    const response = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "football-data.org error", detail: text });
    }

    const data = await response.json();

    const fixtures = (data.matches || []).map(m => ({
      home: m.homeTeam?.name,
      away: m.awayTeam?.name,
      status: mapStatus(m.status),
      statusRaw: m.status,
      minute: m.minute ?? null,
      kickoff: m.utcDate,
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
    }));

    return res.status(200).json({ fixtures });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch live scores", detail: err.message });
  }
}

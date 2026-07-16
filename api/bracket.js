// /api/bracket.js
// Fetches all knockout stage fixtures for a competition, organised by round
// Usage: /api/bracket?leagueId=wc2026

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  ucl:         { id: 2,   season: 2026 },
  uel:         { id: 3,   season: 2026 },
  facup:       { id: 45,  season: 2026 },
  copadelrey:  { id: 143, season: 2026 },
  afcon:       { id: 6,   season: 2025 },
  copamerica:  { id: 9,   season: 2024 },
};

// Round order for sorting — most specific to least
const ROUND_ORDER = [
  "round of 32", "round of 16", "quarter-finals",
  "semi-finals", "3rd place final", "final"
];

function getRoundOrder(round) {
  if (!round) return 99;
  const r = round.toLowerCase();
  const idx = ROUND_ORDER.findIndex(ro => r.includes(ro));
  return idx === -1 ? 50 : idx;
}

function mapStatus(short) {
  const live = ["1H","HT","2H","ET","BT","P","INT"];
  const finished = ["FT","AET","PEN"];
  if (live.includes(short)) return "live";
  if (finished.includes(short)) return "finished";
  return "upcoming";
}

export default async function handler(req, res) {
  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId required" });

  const league = LEAGUE_MAP[leagueId];
  if (!league) return res.status(400).json({ error: "Unknown league" });

  const apiKey = process.env.API_FOOTBALL_KEY;

  try {
    // Fetch all fixtures for the season
    const r = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const data = await r.json();
    const all = data.response || [];

    // Filter to knockout rounds only
    const knockout = all.filter(f => {
      const round = (f.league?.round || "").toLowerCase();
      return ROUND_ORDER.some(ro => round.includes(ro));
    });

    // Map to clean fixture objects
    const fixtures = knockout.map(f => ({
      fixtureId: f.fixture?.id,
      round: f.league?.round,
      roundOrder: getRoundOrder(f.league?.round),
      kickoff: f.fixture?.date,
      status: mapStatus(f.fixture?.status?.short),
      statusRaw: f.fixture?.status?.short,
      elapsed: f.fixture?.status?.elapsed,
      home: f.teams?.home?.name,
      away: f.teams?.away?.name,
      homeLogo: f.teams?.home?.logo,
      awayLogo: f.teams?.away?.logo,
      homeId: f.teams?.home?.id,
      awayId: f.teams?.away?.id,
      score: {
        home: f.goals?.home,
        away: f.goals?.away,
      },
      venue: f.fixture?.venue?.name,
    }));

    // Sort by round order then kickoff
    fixtures.sort((a, b) =>
      a.roundOrder !== b.roundOrder
        ? a.roundOrder - b.roundOrder
        : new Date(a.kickoff) - new Date(b.kickoff)
    );

    // Group by round
    const rounds = {};
    fixtures.forEach(f => {
      if (!rounds[f.round]) rounds[f.round] = [];
      rounds[f.round].push(f);
    });

    const allRounds = Object.entries(rounds)
      .sort(([, a], [, b]) => a[0].roundOrder - b[0].roundOrder)
      .map(([round, matches]) => ({ round, matches }));

    // Find current active round — earliest round with live or upcoming matches
    const currentIdx = allRounds.findIndex(r =>
      r.matches.some(m => m.status === "live" || m.status === "upcoming")
    );

    // Show current + next round. If all done, show last two rounds.
    const displayRounds = currentIdx === -1
      ? allRounds.slice(-2)
      : allRounds.slice(currentIdx, currentIdx + 2);

    res.status(200).json({ available: true, rounds: displayRounds });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
}

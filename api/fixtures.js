// /api/fixtures.js
// Fetches upcoming and recent fixtures for a league across a date range
// Usage: /api/fixtures?leagueId=wc2026

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2026 },
  laliga:      { id: 140, season: 2026 },
  seriea:      { id: 135, season: 2026 },
  bundesliga:  { id: 78,  season: 2026 },
  ligue1:      { id: 61,  season: 2026 },
  ucl:         { id: 2,   season: 2026 },
  uel:         { id: 3,   season: 2026 },
  facup:       { id: 45,  season: 2026 },
  copadelrey:  { id: 143, season: 2026 },
  afcon:       { id: 6,   season: 2025 },
  copamerica:  { id: 9,   season: 2024 },
  friendlies:  { id: 667, season: 2026 },
};

function mapStatus(short) {
  const live = ["1H","HT","2H","ET","BT","P","INT"];
  const finished = ["FT","AET","PEN"];
  if (live.includes(short)) return "live";
  if (finished.includes(short)) return "finished";
  return "upcoming";
}

export default async function handler(req, res) {
  const { leagueId, full } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId required" });

  const league = LEAGUE_MAP[leagueId];
  if (!league) return res.status(400).json({ error: "Unknown league" });

  const apiKey = process.env.API_FOOTBALL_KEY;

  // Full mode: fetch entire season in one call (for stats aggregation, e.g. clean sheets)
  if (full === "true") {
    try {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const fixtures = (data.response || []).map(f => ({
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        homeLogo: f.teams?.home?.logo,
        awayLogo: f.teams?.away?.logo,
        status: mapStatus(f.fixture?.status?.short),
        statusRaw: f.fixture?.status?.short,
        elapsed: f.fixture?.status?.elapsed,
        kickoff: f.fixture?.date,
        date: f.fixture?.date?.split("T")[0],
        fixtureId: f.fixture?.id,
        round: f.league?.round,
        venue: f.fixture?.venue?.name,
        city: f.fixture?.venue?.city,
        score: { home: f.goals?.home, away: f.goals?.away },
        fulltimeScore: { home: f.score?.fulltime?.home, away: f.score?.fulltime?.away },
      }));
      return res.status(200).json({ fixtures });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const now = new Date();

  // Fetch yesterday through next 10 days to capture ongoing tournaments
  const dates = [];
  for (let i = -1; i <= 10; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    dates.push(d.toISOString().split("T")[0]);
  }

  try {
    // Fetch all dates in parallel
    const results = await Promise.allSettled(
      dates.map(date =>
        fetch(`https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${league.season}&date=${date}`, {
          headers: { "x-apisports-key": apiKey }
        }).then(r => r.json()).then(d => ({ date, fixtures: d.response || [] }))
      )
    );

    const allFixtures = [];
    results.forEach(r => {
      if (r.status === "fulfilled") {
        r.value.fixtures.forEach(f => {
          allFixtures.push({
            home: f.teams?.home?.name,
            away: f.teams?.away?.name,
            homeLogo: f.teams?.home?.logo,
            awayLogo: f.teams?.away?.logo,
            status: mapStatus(f.fixture?.status?.short),
            statusRaw: f.fixture?.status?.short,
            elapsed: f.fixture?.status?.elapsed,
            kickoff: f.fixture?.date,
            date: r.value.date,
            fixtureId: f.fixture?.id,
            round: f.league?.round,
            venue: f.fixture?.venue?.name,
            city: f.fixture?.venue?.city,
            score: {
              home: f.goals?.home,
              away: f.goals?.away,
            },
            fulltimeScore: {
              home: f.score?.fulltime?.home,
              away: f.score?.fulltime?.away,
            },
          });
        });
      }
    });

    // Sort by kickoff time
    allFixtures.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    // Remove duplicates (same fixtureId)
    const seen = new Set();
    const unique = allFixtures.filter(f => {
      if (seen.has(f.fixtureId)) return false;
      seen.add(f.fixtureId);
      return true;
    });

    res.status(200).json({ fixtures: unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

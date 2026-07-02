// /api/live-scores.js
// Fetches fixtures + live status/scores from API-Football.
// For live matches, also fetches statistics (possession) and events.

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2025 },
  laliga:      { id: 140, season: 2025 },
  seriea:      { id: 135, season: 2025 },
  bundesliga:  { id: 78,  season: 2025 },
  ligue1:      { id: 61,  season: 2025 },
  ucl:         { id: 2,   season: 2025 },
  uel:         { id: 3,   season: 2025 },
  facup:       { id: 45,  season: 2025 },
  copadelrey:  { id: 143, season: 2025 },
  afcon:       { id: 6,   season: 2025 },
  copamerica:  { id: 9,   season: 2024 },
};

function mapStatus(shortStatus) {
  const live = ["1H", "HT", "2H", "ET", "BT", "P", "INT"];
  const finished = ["FT", "AET", "PEN"];
  if (live.includes(shortStatus)) return "live";
  if (finished.includes(shortStatus)) return "finished";
  return "upcoming";
}

function mapEvents(raw = []) {
  return raw
    .filter(e => ["Goal", "Card", "subst"].includes(e.type))
    .map(e => {
      const minute = e.time?.elapsed;
      const extra = e.time?.extra ? `+${e.time.extra}` : "";
      const team = e.team?.name;
      const player = e.player?.name;
      const assist = e.assist?.name;
      const detail = e.detail;

      let icon = "";
      let label = "";

      if (e.type === "Goal") {
        icon = detail === "Own Goal" ? "⚽ OG" : detail === "Penalty" ? "⚽ P" : "⚽";
        label = player + (assist ? ` (${assist.split(" ").pop()})` : "");
      } else if (e.type === "Card") {
        icon = detail === "Red Card" ? "🟥" : detail === "Yellow Card" ? "🟨" : "🟥🟨";
        label = player;
      } else if (e.type === "subst") {
        icon = "🔄";
        label = `${player?.split(" ").pop()} → ${assist?.split(" ").pop()}`;
      }

      return { minute, extra, team, icon, label, type: e.type, detail };
    })
    .sort((a, b) => (a.minute || 0) - (b.minute || 0));
}

export default async function handler(req, res) {
  const { leagueId, date, season } = req.query;

  if (!leagueId || !date) {
    return res.status(400).json({ error: "leagueId and date are required" });
  }

  const league = LEAGUE_MAP[leagueId];
  if (!league) {
    return res.status(400).json({ error: `Unknown leagueId: ${leagueId}` });
  }

  const seasonToUse = season || league.season;
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const url = `https://v3.football.api-sports.io/fixtures?league=${league.id}&season=${seasonToUse}&date=${date}`;
    const response = await fetch(url, { headers: { "x-apisports-key": apiKey } });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "API-Football error", detail: text });
    }

    const data = await response.json();
    const rawFixtures = data.response || [];

    // For live matches, fetch statistics + events in parallel
    const liveFixtures = rawFixtures.filter(f => {
      const s = f.fixture?.status?.short;
      return ["1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(s);
    });

    const extraData = {};
    if (liveFixtures.length > 0) {
      await Promise.allSettled(
        liveFixtures.map(async f => {
          const id = f.fixture?.id;
          const [statsRes, eventsRes] = await Promise.allSettled([
            fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${id}`, {
              headers: { "x-apisports-key": apiKey },
            }),
            fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${id}`, {
              headers: { "x-apisports-key": apiKey },
            }),
          ]);

          let possession = { home: null, away: null };
          let events = [];
          let cards = { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } };

          if (statsRes.status === "fulfilled" && statsRes.value.ok) {
            const statsData = await statsRes.value.json();
            const teams = statsData.response || [];
            teams.forEach((team, idx) => {
              const pos = team.statistics?.find(s => s.type === "Ball Possession")?.value;
              if (idx === 0) possession.home = pos || null;
              else possession.away = pos || null;
            });
          }

          if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
            const eventsData = await eventsRes.value.json();
            events = mapEvents(eventsData.response || []);

            // Count cards from events
            const homeTeamName = f.teams?.home?.name;
            events.forEach(e => {
              const isHome = e.team === homeTeamName;
              if (e.type === "Card") {
                if (e.detail === "Yellow Card") {
                  if (isHome) cards.home.yellow++; else cards.away.yellow++;
                } else if (e.detail === "Red Card") {
                  if (isHome) cards.home.red++; else cards.away.red++;
                }
              }
            });
          }

          extraData[id] = { possession, events, cards };
        })
      );
    }

    const fixtures = rawFixtures.map(f => {
      const id = f.fixture?.id;
      const extra = extraData[id] || {};
      return {
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        status: mapStatus(f.fixture?.status?.short),
        statusRaw: f.fixture?.status?.short,
        elapsed: f.fixture?.status?.elapsed,
        kickoff: f.fixture?.date,
        fixtureId: id,
        score: {
          home: f.goals?.home,
          away: f.goals?.away,
        },
        possession: extra.possession || { home: null, away: null },
        events: extra.events || [],
        cards: extra.cards || { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } },
      };
    });

    return res.status(200).json({ fixtures });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch live scores", detail: err.message });
  }
}

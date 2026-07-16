// /api/team-stats.js
// Multi-mode endpoint:
// mode=stats (default): /api/team-stats?leagueId=pl&teamId=33
// mode=teamsearch: /api/team-stats?mode=teamsearch&query=Arsenal
// mode=playersearch: /api/team-stats?mode=playersearch&query=Messi&leagueId=wc2026

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
  const { mode, leagueId, teamId, query } = req.query;
  const apiKey = process.env.API_FOOTBALL_KEY;

  // ── Team name search ──
  if (mode === "teamsearch") {
    if (!query || query.length < 3) return res.status(200).json({ teams: [] });
    try {
      const r = await fetch(`https://v3.football.api-sports.io/teams?search=${encodeURIComponent(query)}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const teams = (data.response || []).slice(0, 8).map(t => ({
        id: t.team?.id,
        name: t.team?.name,
        logo: t.team?.logo,
        country: t.team?.country,
      }));
      return res.status(200).json({ teams });
    } catch (err) {
      return res.status(200).json({ teams: [], error: err.message });
    }
  }

  // ── Team squad (full roster, any team worldwide, no league needed) ──
  if (mode === "teamsquad") {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: "teamId required" });
    try {
      const r = await fetch(`https://v3.football.api-sports.io/players/squads?team=${teamId}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const squad = data.response?.[0];
      if (!squad) return res.status(200).json({ players: [] });
      const players = (squad.players || []).map(p => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        position: p.position,
        number: p.number,
      }));
      return res.status(200).json({ players, team: squad.team });
    } catch (err) {
      return res.status(200).json({ players: [], error: err.message });
    }
  }

  // ── Player season stats (aggregated across all competitions) ──
  if (mode === "playerseason") {
    const { playerId, season, teamId } = req.query;
    if (!playerId || !season) return res.status(400).json({ error: "playerId and season required" });
    try {
      const r = await fetch(`https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const entry = data.response?.[0];
      if (!entry) return res.status(200).json({ available: false });

      // Deduplicate by team+league combo — API-Football occasionally returns
      // a duplicate stats block for the same competition, which would double-count
      const rawStats = entry.statistics || [];
      const seen = new Set();
      let statsArr = rawStats.filter(s => {
        const key = `${s.team?.id}-${s.league?.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // If a specific club is given, restrict to that club's competitions only —
      // excludes international caps or spells at other clubs mixed into the same season
      if (teamId) {
        statsArr = statsArr.filter(s => String(s.team?.id) === String(teamId));
      }

      const sum = (path) => statsArr.reduce((acc, s) => {
        const val = path.split(".").reduce((o, k) => o?.[k], s);
        return acc + (parseFloat(val) || 0);
      }, 0);
      const ratingsAvg = () => {
        const ratings = statsArr.map(s => parseFloat(s.games?.rating)).filter(r => !isNaN(r));
        return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
      };

      return res.status(200).json({
        available: true,
        id: entry.player?.id,
        name: entry.player?.name,
        photo: entry.player?.photo,
        nationality: entry.player?.nationality,
        team: statsArr[0]?.team?.name,
        teamLogo: statsArr[0]?.team?.logo,
        position: statsArr[0]?.games?.position,
        goals: sum("goals.total"),
        assists: sum("goals.assists"),
        rating: ratingsAvg(),
        appearances: sum("games.appearences"),
        minutes: sum("games.minutes"),
        shots: sum("shots.total"),
        shotsOnTarget: sum("shots.on"),
        keyPasses: sum("passes.key"),
        dribbles: sum("dribbles.success"),
        tackles: sum("tackles.total"),
        yellowCards: sum("cards.yellow"),
        redCards: sum("cards.red"),
        competitions: statsArr.length,
      });
    } catch (err) {
      return res.status(200).json({ available: false, error: err.message });
    }
  }

  // ── Player name search ──
  if (mode === "playersearch") {
    if (!query || query.length < 3) return res.status(200).json({ players: [] });
    const { season: seasonParam } = req.query;
    let apiUrl;
    if (leagueId) {
      // Scoped search within one of our curated leagues
      const league = LEAGUE_MAP[leagueId];
      if (!league) return res.status(400).json({ error: "Unknown league" });
      apiUrl = `https://v3.football.api-sports.io/players?search=${encodeURIComponent(query)}&league=${league.id}&season=${league.season}`;
    } else {
      // Global search across ALL competitions API-Football covers — just name + season
      const season = seasonParam || 2025;
      apiUrl = `https://v3.football.api-sports.io/players?search=${encodeURIComponent(query)}&season=${season}`;
    }
    try {
      const r = await fetch(apiUrl, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const players = (data.response || []).slice(0, 8).map(p => ({
        id: p.player?.id,
        name: p.player?.name,
        photo: p.player?.photo,
        nationality: p.player?.nationality,
        team: p.statistics?.[0]?.team?.name,
        teamLogo: p.statistics?.[0]?.team?.logo,
        position: p.statistics?.[0]?.games?.position,
        goals: p.statistics?.[0]?.goals?.total || 0,
        assists: p.statistics?.[0]?.goals?.assists || 0,
        rating: p.statistics?.[0]?.games?.rating,
        appearances: p.statistics?.[0]?.games?.appearences || 0,
        minutes: p.statistics?.[0]?.games?.minutes || 0,
        shots: p.statistics?.[0]?.shots?.total || 0,
        shotsOnTarget: p.statistics?.[0]?.shots?.on || 0,
        keyPasses: p.statistics?.[0]?.passes?.key || 0,
        passAccuracy: p.statistics?.[0]?.passes?.accuracy,
        dribbles: p.statistics?.[0]?.dribbles?.success || 0,
        tackles: p.statistics?.[0]?.tackles?.total || 0,
        duelsWon: p.statistics?.[0]?.duels?.won || 0,
        yellowCards: p.statistics?.[0]?.cards?.yellow || 0,
        redCards: p.statistics?.[0]?.cards?.red || 0,
      }));
      return res.status(200).json({ players });
    } catch (err) {
      return res.status(200).json({ players: [], error: err.message });
    }
  }

  // ── Default: team season statistics ──
  if (!leagueId || !teamId) return res.status(400).json({ error: "leagueId and teamId required" });

  const league = LEAGUE_MAP[leagueId];
  if (!league) return res.status(400).json({ error: "Unknown league" });

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
      goalIntervalsFor: s.goals?.for?.minute,
      goalIntervalsAgainst: s.goals?.against?.minute,
    });
  } catch (err) {
    res.status(200).json({ available: false, error: err.message });
  }
}

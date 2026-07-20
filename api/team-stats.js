// /api/team-stats.js
// Multi-mode endpoint:
// mode=stats (default): /api/team-stats?leagueId=pl&teamId=33
// mode=teamsearch: /api/team-stats?mode=teamsearch&query=Arsenal
// mode=playersearch: /api/team-stats?mode=playersearch&query=Messi&leagueId=wc2026

const LEAGUE_MAP = {
  wc2026:      { id: 1,   season: 2026 },
  pl:          { id: 39,  season: 2026 },
  laliga:      { id: 140, season: 2026 },
  seriea:      { id: 135, season: 2026 },
  bundesliga:  { id: 78,  season: 2026 },
  ligue1:      { id: 61,  season: 2026 },
  ucl:         { id: 2,   season: 2026 },
};

export default async function handler(req, res) {
  const { mode, leagueId, teamId, query } = req.query;
  const apiKey = process.env.API_FOOTBALL_KEY;

  // ── Team name search ──
  // ── League search (any of API-Football's 1000+ leagues, not just our curated 7) ──
  // ── Best of Europe: top 2 teams from each of the 5 major leagues, last completed season ──
  if (mode === "eurotop10") {
    const BIG5 = ["pl", "laliga", "seriea", "bundesliga", "ligue1"];
    const debugInfo = [];
    try {
      const teams = [];

      for (const leagueKey of BIG5) {
        const league = LEAGUE_MAP[leagueKey];
        // Use last completed season (LEAGUE_MAP holds the upcoming season)
        const lastSeason = league.season - 1;

        const standingsR = await fetch(`https://v3.football.api-sports.io/standings?league=${league.id}&season=${lastSeason}`, {
          headers: { "x-apisports-key": apiKey }
        });
        const standingsData = await standingsR.json();
        const table = standingsData.response?.[0]?.league?.standings?.[0] || [];
        const top2 = table.slice(0, 2);

        let addedForThisLeague = 0;

        for (const row of top2) {
          const teamId = row.team?.id;
          const statsR = await fetch(`https://v3.football.api-sports.io/teams/statistics?league=${league.id}&season=${lastSeason}&team=${teamId}`, {
            headers: { "x-apisports-key": apiKey }
          });
          const statsData = await statsR.json();
          const s = statsData.response;
          if (!s) continue;

          teams.push({
            team: s.team?.name,
            logo: s.team?.logo,
            league: leagueKey,
            leagueLabel: { pl: "Premier League", laliga: "La Liga", seriea: "Serie A", bundesliga: "Bundesliga", ligue1: "Ligue 1" }[leagueKey],
            position: row.rank,
            season: lastSeason,
            played: s.fixtures?.played?.total,
            wins: s.fixtures?.wins?.total,
            goalsFor: s.goals?.for?.total?.total,
            goalsAgainst: s.goals?.against?.total?.total,
            cleanSheets: s.clean_sheet?.total,
          });
          addedForThisLeague++;
        }

        debugInfo.push({
          leagueKey,
          lastSeasonQueried: lastSeason,
          standingsGroupsFound: standingsData.response?.[0]?.league?.standings?.length || 0,
          tableRowsFound: table.length,
          teamsAdded: addedForThisLeague,
          standingsApiError: standingsData.errors && Object.keys(standingsData.errors).length ? standingsData.errors : null,
        });
      }

      if (req.query.debug === "true") {
        return res.status(200).json({ debug: true, debugInfo, teamCount: teams.length });
      }

      return res.status(200).json({ teams });
    } catch (err) {
      return res.status(200).json({ teams: [], error: err.message });
    }
  }

  if (mode === "leaguesearch") {
    if (!query || query.length < 3) return res.status(200).json({ leagues: [] });
    try {
      const r = await fetch(`https://v3.football.api-sports.io/leagues?search=${encodeURIComponent(query)}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const leagues = (data.response || []).slice(0, 10).map(l => {
        const seasons = l.seasons || [];
        const current = seasons.find(s => s.current) || seasons[seasons.length - 1];
        return {
          id: l.league?.id,
          name: l.league?.name,
          logo: l.league?.logo,
          country: l.country?.name,
          countryFlag: l.country?.flag,
          type: l.league?.type,
          currentSeason: current?.year || null,
        };
      });
      return res.status(200).json({ leagues });
    } catch (err) {
      return res.status(200).json({ leagues: [], error: err.message });
    }
  }

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
        age: p.age,
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

      // Exclude entries with a null league ID — API-Football occasionally returns
      // a malformed duplicate record (e.g. mislabeled "Super Cup" with 30+ appearances,
      // which is impossible for a one-off match) that isn't caught by team+league dedup
      // since null never matches a real league ID
      const validStats = rawStats.filter(s => s.league?.id != null);

      const seen = new Set();
      let statsArr = validStats.filter(s => {
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

      // Debug mode — see exactly what's being summed, per competition
      if (req.query.debug === "true") {
        return res.status(200).json({
          debug: true,
          rawEntryCount: rawStats.length,
          afterNullLeagueFilterCount: validStats.length,
          afterDedupeCount: (validStats.length ? validStats.filter((s, i, arr) => {
            const key = `${s.team?.id}-${s.league?.id}`;
            return arr.findIndex(x => `${x.team?.id}-${x.league?.id}` === key) === i;
          }).length : 0),
          afterTeamFilterCount: statsArr.length,
          entries: statsArr.map(s => ({
            team: s.team?.name,
            teamId: s.team?.id,
            league: s.league?.name,
            leagueId: s.league?.id,
            season: s.league?.season,
            appearances: s.games?.appearences,
            goals: s.goals?.total,
            assists: s.goals?.assists,
          })),
        });
      }

      const sum = (path) => statsArr.reduce((acc, s) => {
        const val = path.split(".").reduce((o, k) => o?.[k], s);
        return acc + (parseFloat(val) || 0);
      }, 0);
      const ratingsAvg = () => {
        const ratings = statsArr.map(s => parseFloat(s.games?.rating)).filter(r => !isNaN(r));
        return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
      };
      const passAccuracyAvg = () => {
        const accs = statsArr.map(s => parseFloat(s.passes?.accuracy)).filter(a => !isNaN(a));
        return accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : null;
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
        passAccuracy: passAccuracyAvg(),
        dribbles: sum("dribbles.success"),
        tackles: sum("tackles.total"),
        interceptions: sum("tackles.interceptions"),
        duelsWon: sum("duels.won"),
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
  if (!teamId) return res.status(400).json({ error: "teamId required" });

  const { apiLeagueId, season: rawSeason } = req.query;
  let leagueApiId, leagueSeason;

  if (apiLeagueId && rawSeason) {
    // Raw mode — any of API-Football's 1000+ leagues, from leaguesearch results
    leagueApiId = apiLeagueId;
    leagueSeason = rawSeason;
  } else if (leagueId) {
    // Curated mode — our fixed shortlist
    const league = LEAGUE_MAP[leagueId];
    if (!league) return res.status(400).json({ error: "Unknown league" });
    leagueApiId = league.id;
    leagueSeason = league.season;
  } else {
    return res.status(400).json({ error: "leagueId or (apiLeagueId + season) required" });
  }

  try {
    let r = await fetch(`https://v3.football.api-sports.io/teams/statistics?league=${leagueApiId}&season=${leagueSeason}&team=${teamId}`, {
      headers: { "x-apisports-key": apiKey }
    });
    let data = await r.json();
    let s = data.response;
    let seasonUsed = leagueSeason;

    // If the current season has zero matches played, it likely hasn't kicked off yet —
    // automatically fall back to the previous season's completed stats instead.
    // Once real matches start being recorded, this will naturally switch back on its own.
    const playedCount = s?.fixtures?.played?.total || 0;
    if (playedCount === 0 && !apiLeagueId) {
      const prevSeason = parseInt(leagueSeason) - 1;
      const fallbackR = await fetch(`https://v3.football.api-sports.io/teams/statistics?league=${leagueApiId}&season=${prevSeason}&team=${teamId}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const fallbackData = await fallbackR.json();
      if (fallbackData.response?.fixtures?.played?.total > 0) {
        s = fallbackData.response;
        seasonUsed = prevSeason;
      }
    }

    if (!s) return res.status(200).json({ available: false });

    // Fetch standings to get the team's actual league table position
    let position = null;
    try {
      const standingsR = await fetch(`https://v3.football.api-sports.io/standings?league=${leagueApiId}&season=${seasonUsed}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const standingsData = await standingsR.json();
      const table = standingsData.response?.[0]?.league?.standings?.[0] || [];
      const teamRow = table.find(row => String(row.team?.id) === String(teamId));
      position = teamRow?.rank || null;
    } catch {}

    res.status(200).json({
      available: true,
      team: s.team?.name,
      logo: s.team?.logo,
      seasonUsed,
      position,
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

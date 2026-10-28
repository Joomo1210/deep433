// /api/fixture-data.js
// Merged endpoint for all single-fixture data lookups — reduces function count.
// Usage:
//   /api/fixture-data?type=events&fixtureId=X    (goals, cards, subs)
//   /api/fixture-data?type=stats&fixtureId=X     (full match statistics)
//   /api/fixture-data?type=ratings&fixtureId=X   (per-player match ratings)
//   /api/fixture-data?type=injuries&fixtureId=X  (pre-match unavailability)
//   /api/fixture-data?type=odds&fixtureId=X      (pre-match 1X2 implied chances)
//   /api/fixture-data?type=matchday&fixtureId=X  (kick-off, last-5 form and odds for a list card)

// Pre-match 1X2 odds, averaged across bookmakers with the margin removed.
// Returns { available:false } when the league/fixture has no odds.
async function fetchOdds(fixtureId, apiKey) {
  try {
    const response = await fetch(`https://v3.football.api-sports.io/odds?fixture=${fixtureId}`, { headers: { "x-apisports-key": apiKey } });
    if (!response.ok) return { available: false };
    const data = await response.json();
    const books = data.response?.[0]?.bookmakers || [];
    const prices = [];
    books.forEach(b => {
      const bet = (b.bets || []).find(x => x.id === 1 || x.name === "Match Winner");
      if (!bet) return;
      const get = (v) => parseFloat((bet.values || []).find(x => x.value === v)?.odd);
      const h = get("Home"), d = get("Draw"), a = get("Away");
      if ([h, d, a].every(n => n > 1)) prices.push([h, d, a]);
    });
    if (!prices.length) return { available: false };

    const avg = (i) => prices.reduce((s, p) => s + p[i], 0) / prices.length;
    // Per bookmaker: implied = (1/odd) / sum(1/odds), which strips the margin.
    const implied = [0, 0, 0];
    prices.forEach(p => {
      const inv = p.map(o => 1 / o);
      const sum = inv.reduce((s, v) => s + v, 0);
      inv.forEach((v, i) => { implied[i] += (v / sum) / prices.length; });
    });
    const pct = implied.map(v => Math.round(v * 100));
    // Keep the three rounded numbers adding to exactly 100.
    const diff = 100 - pct.reduce((s, v) => s + v, 0);
    if (diff) pct[pct.indexOf(Math.max(...pct))] += diff;

    return {
      available: true,
      bookmakers: prices.length,
      odds: { home: +avg(0).toFixed(2), draw: +avg(1).toFixed(2), away: +avg(2).toFixed(2) },
      implied: { home: pct[0], draw: pct[1], away: pct[2] },
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

export default async function handler(req, res) {
  const { type, fixtureId } = req.query;
  if (!fixtureId) return res.status(400).json({ error: "fixtureId is required" });

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  // ── Match Events (goals, cards, substitutions) ──
  if (type === "events") {
    try {
      const url = `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`;
      const response = await fetch(url, { headers: { "x-apisports-key": apiKey } });
      if (!response.ok) return res.status(200).json({ events: [] });

      const data = await response.json();
      const raw = data.response || [];

      const events = raw
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
            if (detail === "Own Goal") icon = "⚽ OG";
            else if (detail === "Penalty") icon = "⚽ P";
            else icon = "⚽";
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

      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
      return res.status(200).json({ events });
    } catch (err) {
      return res.status(200).json({ events: [], error: err.message });
    }
  }

  // ── Match Statistics ──
  if (type === "stats") {
    try {
      // Statistics endpoint alone has no goals field — API-Football keeps
      // score on the fixture object itself, so fetch both in parallel.
      const [r, fixtureR] = await Promise.all([
        fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
          headers: { "x-apisports-key": apiKey }
        }),
        fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
          headers: { "x-apisports-key": apiKey }
        }),
      ]);
      const data = await r.json();
      const fixtureData = await fixtureR.json();
      const teams = data.response || [];
      if (teams.length < 2) return res.status(200).json({ available: false });

      const parseStat = (team, statType) => {
        const s = team.statistics?.find(s => s.type === statType);
        return s?.value ?? null;
      };

      const fixtureInfo = fixtureData.response?.[0];
      const goals = {
        home: fixtureInfo?.goals?.home ?? null,
        away: fixtureInfo?.goals?.away ?? null,
      };

      const result = teams.map(team => ({
        team: team.team?.name,
        logo: team.team?.logo,
        stats: {
          possession:      parseStat(team, "Ball Possession"),
          // "expected_goals" is API-Football's stat type for xG — it's real
          // data when present, but not every league/plan tier returns it,
          // so this can legitimately come back null. Never fabricated if
          // missing, and the render side hides the section entirely rather
          // than showing a blank or invented number.
          expectedGoals:   parseStat(team, "expected_goals"),
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
          // "Passes %" isn't always returned by API-Football as its own stat
          // entry for every fixture/competition — when that happens,
          // parseStat correctly comes back null, but the frontend was
          // displaying that as a literal "0%" instead of a missing value,
          // even though Total Passes and Passes Completed (which ARE
          // reliably present) contain everything needed to work the real
          // number out directly. Falls back to computing it ourselves
          // rather than depending on a field that isn't always there.
          passAccuracy:    (() => {
            const direct = parseStat(team, "Passes %");
            if (direct !== null) return direct;
            const total = parseStat(team, "Total passes");
            const accurate = parseStat(team, "Passes accurate");
            if (total && accurate !== null && Number(total) > 0) {
              return `${Math.round((Number(accurate) / Number(total)) * 100)}%`;
            }
            return null;
          })(),
        }
      }));

      return res.status(200).json({ available: true, home: result[0], away: result[1], goals });
    } catch (err) {
      return res.status(200).json({ available: false, error: err.message });
    }
  }

  // ── Player Ratings ──
  if (type === "ratings") {
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
        interceptions: p.statistics?.[0]?.tackles?.interceptions,
        duelsWon: p.statistics?.[0]?.duels?.won,
        saves: p.statistics?.[0]?.goals?.saves,
        yellowCards: p.statistics?.[0]?.cards?.yellow,
        redCards: p.statistics?.[0]?.cards?.red,
      })).filter(p => p.minutesPlayed > 0) || [];

      return res.status(200).json({
        available: true,
        home: { team: teams[0]?.team?.name, logo: teams[0]?.team?.logo, players: mapPlayers(teams[0]) },
        away: { team: teams[1]?.team?.name, logo: teams[1]?.team?.logo, players: mapPlayers(teams[1]) },
      });
    } catch (err) {
      return res.status(200).json({ available: false, error: err.message });
    }
  }

  // ── Injuries ──
  if (type === "injuries") {
    try {
      const url = `https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`;
      const response = await fetch(url, { headers: { "x-apisports-key": apiKey } });
      if (!response.ok) return res.status(200).json({ home: [], away: [], error: "Could not fetch injury data" });

      const data = await response.json();
      const injuries = data.response || [];
      if (!injuries.length) return res.status(200).json({ home: [], away: [] });

      const homeTeamId = injuries[0]?.team?.id;
      const home = [];
      const away = [];

      injuries.forEach(entry => {
        const player = {
          name: entry.player?.name,
          reason: entry.player?.reason,
          type: entry.player?.type,
        };
        if (entry.team?.id === homeTeamId) home.push(player);
        else away.push(player);
      });

      return res.status(200).json({ home, away });
    } catch (err) {
      return res.status(200).json({ home: [], away: [], error: err.message });
    }
  }

  // ── Pre-match bookmaker odds (Match Winner / 1X2) ──
  // Averages the 1X2 prices across every bookmaker API-Football returns, after
  // removing each bookmaker's margin, so the card can show a neutral implied
  // chance without naming or promoting any bookmaker. Odds are not available
  // for every league, and API-Football only keeps pre-match odds for a limited
  // time, so this returns { available: false } instead of guessing.
  if (type === "odds") {
    const o = await fetchOdds(fixtureId, apiKey);
    if (o.available) res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    return res.status(200).json(o);
  }

  // ── Matchday row: kick-off, teams, last-5 form and odds in one call ──
  // Used by the Matchday list card. Form is read from each team's last five
  // finished fixtures across all competitions (W/D/L by 90-minute score,
  // oldest to latest), and odds come from the same helper as type=odds.
  if (type === "matchday") {
    try {
      const headers = { "x-apisports-key": apiKey };
      const fr = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers });
      const fd = await fr.json();
      const fx = fd.response?.[0];
      if (!fx) return res.status(200).json({ available: false });

      const formFor = async (teamId) => {
        try {
          const r = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`, { headers });
          const d = await r.json();
          return (d.response || [])
            .filter(f => f.goals?.home !== null && f.goals?.away !== null && f.fixture?.id !== fx.fixture?.id)
            .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
            .slice(-5)
            .map(f => {
              const mine = f.teams?.home?.id === teamId ? f.goals.home : f.goals.away;
              const theirs = f.teams?.home?.id === teamId ? f.goals.away : f.goals.home;
              return mine > theirs ? "W" : mine < theirs ? "L" : "D";
            })
            .join("");
        } catch { return ""; }
      };

      const [homeForm, awayForm, odds] = await Promise.all([
        formFor(fx.teams?.home?.id),
        formFor(fx.teams?.away?.id),
        fetchOdds(fixtureId, apiKey),
      ]);

      res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
      return res.status(200).json({
        available: true,
        fixtureId: Number(fixtureId),
        kickoff: fx.fixture?.date,
        status: fx.fixture?.status?.short,
        league: fx.league?.name,
        round: fx.league?.round,
        home: { name: fx.teams?.home?.name, logo: fx.teams?.home?.logo, form: homeForm },
        away: { name: fx.teams?.away?.name, logo: fx.teams?.away?.logo, form: awayForm },
        odds: odds.available ? odds : null,
      });
    } catch (err) {
      return res.status(200).json({ available: false, error: err.message });
    }
  }

  return res.status(400).json({ error: "Unknown type — use events, stats, ratings, injuries, odds, or matchday" });
}

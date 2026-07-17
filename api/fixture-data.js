// /api/fixture-data.js
// Merged endpoint for all single-fixture data lookups — reduces function count.
// Usage:
//   /api/fixture-data?type=events&fixtureId=X    (goals, cards, subs)
//   /api/fixture-data?type=stats&fixtureId=X     (full match statistics)
//   /api/fixture-data?type=ratings&fixtureId=X   (per-player match ratings)
//   /api/fixture-data?type=injuries&fixtureId=X  (pre-match unavailability)

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

      return res.status(200).json({ events });
    } catch (err) {
      return res.status(200).json({ events: [], error: err.message });
    }
  }

  // ── Match Statistics ──
  if (type === "stats") {
    try {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
        headers: { "x-apisports-key": apiKey }
      });
      const data = await r.json();
      const teams = data.response || [];
      if (teams.length < 2) return res.status(200).json({ available: false });

      const parseStat = (team, statType) => {
        const s = team.statistics?.find(s => s.type === statType);
        return s?.value ?? null;
      };

      const result = teams.map(team => ({
        team: team.team?.name,
        logo: team.team?.logo,
        stats: {
          possession:      parseStat(team, "Ball Possession"),
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
          passAccuracy:    parseStat(team, "Passes %"),
        }
      }));

      return res.status(200).json({ available: true, home: result[0], away: result[1] });
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

  return res.status(400).json({ error: "Unknown type — use events, stats, ratings, or injuries" });
}

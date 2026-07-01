// /api/fixture-insights.js
// Fetches API-Football's algorithmic prediction data for a specific fixture.
// Returns win probabilities, H2H record, form, attack/defence comparison.
// Usage: /api/fixture-insights?fixtureId=1567307

export default async function handler(req, res) {
  const { fixtureId } = req.query;

  if (!fixtureId) {
    return res.status(400).json({ error: "fixtureId is required" });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const url = `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`;
    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!response.ok) {
      return res.status(200).json({ available: false, reason: "Could not fetch prediction data" });
    }

    const data = await response.json();
    const pred = data.response?.[0];

    if (!pred) {
      return res.status(200).json({ available: false, reason: "No prediction data available" });
    }

    const percent = pred.predictions?.percent;
    const winner = pred.predictions?.winner?.name;
    const advice = pred.predictions?.advice;
    const underOver = pred.predictions?.under_over;
    const goalsHome = pred.predictions?.goals?.home;
    const goalsAway = pred.predictions?.goals?.away;

    const comp = pred.comparison || {};
    const h2h = pred.h2h || [];

    // Summarise last 5 H2H results
    const h2hSummary = h2h.slice(0, 5).map(f => {
      const hg = f.goals?.home ?? "?";
      const ag = f.goals?.away ?? "?";
      const hn = f.teams?.home?.name;
      const an = f.teams?.away?.name;
      return `${hn} ${hg}-${ag} ${an}`;
    });

    // Recent form strings
    const homeForm = pred.teams?.home?.last_5?.form || "";
    const awayForm = pred.teams?.away?.last_5?.form || "";

    return res.status(200).json({
      available: true,
      winner,
      advice,
      underOver,
      percent: {
        home: percent?.home,
        draw: percent?.draw,
        away: percent?.away,
      },
      goals: {
        home: goalsHome,
        away: goalsAway,
      },
      comparison: {
        attackHome: comp.att?.home,
        attackAway: comp.att?.away,
        defenceHome: comp.def?.home,
        defenceAway: comp.def?.away,
        formHome: comp.form?.home,
        formAway: comp.form?.away,
        h2hHome: comp.h2h?.home,
        h2hAway: comp.h2h?.away,
      },
      form: { home: homeForm, away: awayForm },
      h2h: h2hSummary,
    });
  } catch (err) {
    return res.status(200).json({ available: false, error: err.message });
  }
}

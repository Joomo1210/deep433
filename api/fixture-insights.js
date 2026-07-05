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

    // Normalise comparison values to always sum to 100%
    const norm = (a, b) => {
      const av = Math.max(parseFloat(a) || 0, 5);
      const bv = Math.max(parseFloat(b) || 0, 5);
      const total = av + bv;
      return { a: Math.round((av / total) * 100) + "%", b: Math.round((bv / total) * 100) + "%" };
    };
    const atk  = norm(comp.att?.home,  comp.att?.away);
    const def  = norm(comp.def?.home,  comp.def?.away);
    const form = norm(comp.form?.home, comp.form?.away);

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
        attackHome: atk.a,
        attackAway: atk.b,
        defenceHome: def.a,
        defenceAway: def.b,
        formHome: form.a,
        formAway: form.b,
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

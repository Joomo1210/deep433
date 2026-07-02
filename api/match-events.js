// /api/match-events.js
// Fetches live match events (goals, cards, substitutions) for a specific fixture.
// Usage: /api/match-events?fixtureId=1567311
// Returns events sorted by minute, ready to display as a live ticker.

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
    const url = `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`;
    const response = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!response.ok) {
      return res.status(200).json({ events: [] });
    }

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
        const detail = e.detail; // e.g. "Normal Goal", "Yellow Card", "Red Card", "Own Goal"

        let icon = "";
        let label = "";

        if (e.type === "Goal") {
          if (detail === "Own Goal") {
            icon = "⚽ OG";
          } else if (detail === "Penalty") {
            icon = "⚽ P";
          } else {
            icon = "⚽";
          }
          label = player + (assist ? ` (${assist.split(" ").pop()})` : "");
        } else if (e.type === "Card") {
          icon = detail === "Red Card" ? "🟥" : detail === "Yellow Card" ? "🟨" : "🟥🟨";
          label = player;
        } else if (e.type === "subst") {
          icon = "🔄";
          label = `${player?.split(" ").pop()} → ${assist?.split(" ").pop()}`;
        }

        return {
          minute,
          extra,
          team,
          icon,
          label,
          type: e.type,
          detail,
        };
      })
      .sort((a, b) => (a.minute || 0) - (b.minute || 0));

    return res.status(200).json({ events });
  } catch (err) {
    return res.status(200).json({ events: [], error: err.message });
  }
}

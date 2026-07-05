import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://idisdztwpvedtnroiian.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXNkenR3cHZlZHRucm9paWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTczOTQsImV4cCI6MjA5NzAzMzM5NH0.YmF0DqWmopuJs9Ci1hdFi0XDMoWRD0yfVwOuuG7WVyE'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { homeTeam, awayTeam, league, fixtureId } = req.body;

  // ── Cache check ──────────────────────────────────────────────────────────
  // If we already have a prediction for this exact match, return it immediately
  // so all users see the same canonical AI prediction.
  try {
    const { data: cached } = await supabase
      .from('match_predictions')
      .select('ai_data')
      .eq('league', league)
      .eq('home_team', homeTeam)
      .eq('away_team', awayTeam)
      .single();

    if (cached?.ai_data) {
      return res.status(200).json({ ...cached.ai_data, cached: true });
    }
  } catch {}
  // ─────────────────────────────────────────────────────────────────────────

  // ── Fetch live squads from API-Football using fixtureId ──────────────────
  const safeGet = (url, headers) => Promise.race([
    fetch(url, { headers }).then(r => r.json()).catch(() => null),
    new Promise(resolve => setTimeout(() => resolve(null), 4000))
  ]);

  async function fetchLiveSquad(teamId) {
    if (!teamId) return null;
    try {
      const data = await safeGet(
        `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
        { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
      );
      const players = data?.response?.[0]?.players || [];
      if (!players.length) return null;
      const byPos = { GK: [], DEF: [], MID: [], ATT: [] };
      players.forEach(p => {
        const pos = p.position;
        if (pos === 'Goalkeeper') byPos.GK.push(p.name);
        else if (pos === 'Defender') byPos.DEF.push(p.name);
        else if (pos === 'Midfielder') byPos.MID.push(p.name);
        else if (pos === 'Attacker') byPos.ATT.push(p.name);
      });
      return [
        ...byPos.GK.map(n => `GK: ${n}`),
        ...byPos.DEF.map(n => `DEF: ${n}`),
        ...byPos.MID.map(n => `MID: ${n}`),
        ...byPos.ATT.map(n => `FWD: ${n}`),
      ].join(', ') || null;
    } catch { return null; }
  }

  // Get team IDs from the fixture
  let homeSquadStr = null;
  let awaySquadStr = null;

  if (fixtureId) {
    try {
      const fixData = await safeGet(
        `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
        { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
      );
      const fix = fixData?.response?.[0];
      if (fix) {
        const homeId = fix.teams?.home?.id;
        const awayId = fix.teams?.away?.id;
        const [homeSquad, awaySquad] = await Promise.all([
          fetchLiveSquad(homeId),
          fetchLiveSquad(awayId),
        ]);
        homeSquadStr = homeSquad;
        awaySquadStr = awaySquad;
      }
    } catch {}
  }

  const squadInstructions = homeSquadStr && awaySquadStr
    ? `VERIFIED SQUADS — you MUST only pick players from these lists:
${homeTeam} squad: ${homeSquadStr}
${awayTeam} squad: ${awaySquadStr}
Do NOT invent players. Do NOT use players from other teams. Only use names exactly as listed above.`
    : `CRITICAL: Only use real players who genuinely represent that national team. Verify every player nationality before including them.`;

    const NEUTRAL_VENUE_LEAGUES = ["wc2026", "afcon", "copamerica", "ucl", "uel", "facup", "copadelrey"];
  const isNeutralVenue = NEUTRAL_VENUE_LEAGUES.some(l => (league || "").toLowerCase().includes(l.replace("2026","").replace("copa","copa"))) ||
    ["world cup", "copa america", "afcon", "champions league", "europa league", "fa cup", "copa del rey", "tournament"].some(k => (league || "").toLowerCase().includes(k));

  const venueInstruction = isNeutralVenue
    ? `This match is played at a NEUTRAL VENUE as part of a tournament. Neither team has home advantage. Do NOT mention "home crowd," "home support," "at home," or any home-field advantage anywhere in your analysis or verdict. Refer to "${homeTeam}" and "${awayTeam}" by name only, never as "the hosts" or "the home side."`
    : `This is a domestic league/cup fixture. ${homeTeam} are playing at their home ground with their usual home advantage — this is a legitimate factor to mention.`;

  // Fetch injury/suspension data if we have a fixtureId
  let injuryInstruction = "";
  let insightsInstruction = "";

  if (fixtureId) {
    // Fetch injuries and insights in parallel
    const [injuryRes, insightsRes] = await Promise.allSettled([
      fetch(`https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`, {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
      }),
      fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
      }),
    ]);

    // Process injuries
    try {
      if (injuryRes.status === "fulfilled" && injuryRes.value) {
        const injuryData = injuryRes.value;
        const injuries = injuryData.response || [];
        if (injuries.length) {
          const homeTeamId = injuries[0]?.team?.id;
          const homeOut = [];
          const awayOut = [];
          injuries.forEach(entry => {
            const label = `${entry.player?.name} (${entry.player?.reason || entry.player?.type || "unavailable"})`;
            if (entry.team?.id === homeTeamId) homeOut.push(label);
            else awayOut.push(label);
          });
          const parts = [];
          if (homeOut.length) parts.push(`${homeTeam} unavailable: ${homeOut.join(", ")}`);
          if (awayOut.length) parts.push(`${awayTeam} unavailable: ${awayOut.join(", ")}`);
          if (parts.length) {
            injuryInstruction = `INJURIES & SUSPENSIONS — these players are confirmed unavailable and MUST NOT appear in your predicted lineups: ${parts.join(" | ")}. Adjust your lineup and verdict to reflect these absences.`;
          }
        }
      }
    } catch {}

    // Process insights/predictions
    try {
      if (insightsRes.status === "fulfilled" && insightsRes.value) {
        const insightsData = insightsRes.value;
        const pred = insightsData.response?.[0];
        if (pred) {
          const pct = pred.predictions?.percent;
          const advice = pred.predictions?.advice;
          const goalsH = pred.predictions?.goals?.home;
          const goalsA = pred.predictions?.goals?.away;
          const homeForm = pred.teams?.home?.last_5?.form || "";
          const awayForm = pred.teams?.away?.last_5?.form || "";
          const comp = pred.comparison || {};

          const parts = [];
          if (pct) parts.push(`Statistical win probabilities: ${homeTeam} ${pct.home}, Draw ${pct.draw}, ${awayTeam} ${pct.away}`);
          if (goalsH !== null && goalsA !== null) parts.push(`Predicted goals: ${homeTeam} ${goalsH}, ${awayTeam} ${goalsA}`);
          if (comp.form) parts.push(`Form index (higher = better recent form, not a percentage): ${homeTeam} ${parseFloat(comp.form.home || 0).toFixed(0)}, ${awayTeam} ${parseFloat(comp.form.away || 0).toFixed(0)}`);
          if (comp.att) parts.push(`Attack strength: ${homeTeam} ${comp.att.home}, ${awayTeam} ${comp.att.away}`);
          if (comp.def) parts.push(`Defence strength: ${homeTeam} ${comp.def.home}, ${awayTeam} ${comp.def.away}`);
          if (advice) parts.push(`Statistical advice: ${advice}`);

          if (parts.length) {
            insightsInstruction = `STATISTICAL CONTEXT (use to inform your verdict but form your own independent analysis): ${parts.join(" | ")}.`;
          }
        }
      }
    } catch {}
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.DEEP433_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `You are a brutally honest expert football analyst. Respond with ONLY a raw JSON object. No markdown. No backticks. Just JSON. ${squadInstructions} ${venueInstruction} ${injuryInstruction} ${insightsInstruction}`,
      messages: [{
        role: 'user',
        content: `Predict this ${league} match. Team 1: ${homeTeam}, Team 2: ${awayTeam}. ${isNeutralVenue ? "Remember: neutral venue, no home advantage for either side." : `${homeTeam} play at home.`} ${injuryInstruction ? "Important: respect the injury/suspension list above in your lineup selections." : ""} ${insightsInstruction ? "Use the statistical context to inform your analysis, but do not just repeat the numbers — synthesise them into your own verdict." : ""} Return ONLY this JSON: {"scoreline":"2-1","homeGoals":2,"awayGoals":1,"outcome":"Home Win","confidence":"Medium","homeLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"awayLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"homeFormation":"4-3-3","awayFormation":"4-2-3-1","keyBattle":"Description","homeKeyPlayer":"Name","awayKeyPlayer":"Name","verdict":"2-3 sentence brutal honest verdict.","wildcard":"One surprise factor."} Use only players from the verified squads provided.`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || '').join('').trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: 'Parse error' });

  const parsed = JSON.parse(jsonMatch[0]);

  // Save to cache for future users
  try {
    await supabase.from('match_predictions').upsert({
      league,
      home_team: homeTeam,
      away_team: awayTeam,
      ai_data: parsed,
    }, { onConflict: 'league,home_team,away_team' });
  } catch {}

  res.status(200).json(parsed);
}

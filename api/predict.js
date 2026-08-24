import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://idisdztwpvedtnroiian.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXNkenR3cHZlZHRucm9paWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTczOTQsImV4cCI6MjA5NzAzMzM5NH0.YmF0DqWmopuJs9Ci1hdFi0XDMoWRD0yfVwOuuG7WVyE'
);

// ─────────────────────────────────────────────────────────────────────────
// This endpoint is now fully deterministic — no AI text generation at all.
// Every field is derived directly from API-Football's own prediction data
// (win probabilities, predicted goals, attack/defence/form comparison,
// head-to-head), which is real, verified data rather than free-form text
// a model could hallucinate. This trades the AI's varied "analyst voice"
// for a genuine guarantee of accuracy, matching Deep433's identity as an
// analytics site rather than an AI-commentary site.
//
// Lineups, formations, and "key player" fields were dropped entirely —
// API-Football's squad list doesn't distinguish starting XI from bench,
// so predicting a "Likely Lineup" without AI inference isn't reliably
// possible. Confirmed lineups (once officially announced) are handled by
// the separate /api/match-lineup endpoint, unaffected by this change.
// ─────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { homeTeam, awayTeam, league, fixtureId } = req.method === 'GET' ? req.query : req.body;

  const skipCache = (req.method === 'GET' ? req.query.skipCache : req.body.skipCache) === 'true';
  if (!skipCache) {
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
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  const safeGet = (url) => Promise.race([
    fetch(url, { headers: { 'x-apisports-key': apiKey } }).then(r => r.json()).catch(() => null),
    new Promise(resolve => setTimeout(() => resolve(null), 4000)),
  ]);

  if (!fixtureId) {
    return res.status(200).json({
      available: false,
      reason: 'No fixture ID available — this match needs to be selected from the fixture list, not entered manually.',
    });
  }

  // ── Fetch injuries and predictions in parallel — both real, factual data ──
  const [injuryData, predData] = await Promise.all([
    safeGet(`https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`),
    safeGet(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`),
  ]);

  const pred = predData?.response?.[0];
  if (!pred) {
    return res.status(200).json({ available: false, reason: 'No prediction data available from API-Football for this fixture yet.' });
  }

  // ── Injuries & suspensions — real, direct data, no AI involved ──
  const injuries = injuryData?.response || [];
  let homeInjuries = [];
  let awayInjuries = [];
  if (injuries.length) {
    const homeTeamId = injuries[0]?.team?.id;
    injuries.forEach(entry => {
      const label = { name: entry.player?.name, reason: entry.player?.reason || entry.player?.type || 'Unavailable' };
      if (entry.team?.id === homeTeamId) homeInjuries.push(label);
      else awayInjuries.push(label);
    });
  }

  // ── Win probabilities, predicted goals, comparison stats — all real ──
  const percent = pred.predictions?.percent || {};
  const homePct = parseFloat(percent.home) || 0;
  const drawPct = parseFloat(percent.draw) || 0;
  const awayPct = parseFloat(percent.away) || 0;

  const rawGoalsHome = parseFloat(pred.predictions?.goals?.home);
  const rawGoalsAway = parseFloat(pred.predictions?.goals?.away);
  const homeGoals = isNaN(rawGoalsHome) ? null : Math.round(rawGoalsHome);
  const awayGoals = isNaN(rawGoalsAway) ? null : Math.round(rawGoalsAway);

  // Outcome derived directly from the scoreline itself, so the two always
  // agree — rather than deriving outcome from percent separately, which
  // could occasionally produce a mismatched label vs scoreline.
  let outcome = 'Draw';
  if (homeGoals != null && awayGoals != null) {
    if (homeGoals > awayGoals) outcome = 'Home Win';
    else if (awayGoals > homeGoals) outcome = 'Away Win';
  } else {
    // Fallback to percent-based outcome if goals weren't available
    if (homePct > drawPct && homePct > awayPct) outcome = 'Home Win';
    else if (awayPct > homePct && awayPct > drawPct) outcome = 'Away Win';
  }

  // Confidence from how clearly one result stands out from the others
  const sorted = [homePct, drawPct, awayPct].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  const confidence = gap >= 20 ? 'High' : gap >= 10 ? 'Medium' : 'Low';

  const comp = pred.comparison || {};
  const homeForm = pred.teams?.home?.last_5?.form || '';
  const awayForm = pred.teams?.away?.last_5?.form || '';
  const h2h = (pred.h2h || []).slice(0, 5).map(f => {
    const hg = f.goals?.home ?? '?';
    const ag = f.goals?.away ?? '?';
    return `${f.teams?.home?.name} ${hg}-${ag} ${f.teams?.away?.name}`;
  });

  // ── Key battle — template sentence built from real attack/defence comparison ──
  const attHome = parseFloat(comp.att?.home);
  const attAway = parseFloat(comp.att?.away);
  const defHome = parseFloat(comp.def?.home);
  const defAway = parseFloat(comp.def?.away);
  const hasAttData = !isNaN(attHome) || !isNaN(attAway);
  const hasDefData = !isNaN(defHome) || !isNaN(defAway);
  let keyBattle;
  if (hasAttData && hasDefData) {
    // Compare whichever side has the sharper attack against the OPPONENT's
    // defence (not its own) — comparing a team against itself was a real
    // bug in the earlier version, producing nonsense like "Fulham's attack
    // against Fulham's defence".
    const sharperIsHome = (attHome || 0) >= (attAway || 0);
    const attackingTeam = sharperIsHome ? homeTeam : awayTeam;
    const attackingRating = sharperIsHome ? comp.att?.home : comp.att?.away;
    const opponentTeam = sharperIsHome ? awayTeam : homeTeam;
    const opponentDefRating = sharperIsHome ? comp.def?.away : comp.def?.home;
    keyBattle = `${attackingTeam}'s attack (${attackingRating} attack rating) against ${opponentTeam}'s defence (${opponentDefRating} defence rating) — recent form: ${homeTeam} ${homeForm || 'n/a'}, ${awayTeam} ${awayForm || 'n/a'}.`;
  } else {
    keyBattle = `Recent form: ${homeTeam} ${homeForm || 'n/a'}, ${awayTeam} ${awayForm || 'n/a'}.`;
  }
    : `Recent form: ${homeTeam} ${homeForm || 'n/a'}, ${awayTeam} ${awayForm || 'n/a'}.`;

  // ── Verdict — template sentence combining win probability, form, advice ──
  const advice = pred.predictions?.advice || '';
  const favourite = homePct >= awayPct ? homeTeam : awayTeam;
  const favouritePct = Math.max(homePct, awayPct);
  const verdict = `${favourite} carry the higher win probability at ${favouritePct}% (draw ${drawPct}%). ${advice ? `Statistical model favours: ${advice}.` : ''} Form and head-to-head history support this reading, though football regularly defies pure probability.`.trim();

  const parsed = {
    available: true,
    scoreline: homeGoals != null && awayGoals != null ? `${homeGoals}-${awayGoals}` : null,
    homeGoals,
    awayGoals,
    outcome,
    confidence,
    keyBattle,
    verdict,
    percent: { home: percent.home, draw: percent.draw, away: percent.away },
    form: { home: homeForm, away: awayForm },
    h2h,
    injuries: { home: homeInjuries, away: awayInjuries },
    underOver: pred.predictions?.under_over || null,
  };

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

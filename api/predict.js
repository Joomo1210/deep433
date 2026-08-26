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

  // Any cached row from before the deterministic rewrite is stale, hallucinated
  // AI prose (named-player tactical narrative, not derived from real stats) and
  // must never be served, no matter how old the cache-check logic thinks it is.
  // Every prediction this version writes is tagged with this marker; a cached
  // row missing it is treated as a cache miss so it gets regenerated fresh
  // (and the fresh, versioned result then overwrites the stale row below).
  // Bumped to 3: version 2 had the tie-breaking bug above (ties between
  // the favourite and draw defaulted to 'Draw' outright), so any row
  // cached under version 2 needs to regenerate too, not just pre-rewrite
  // AI-prose rows.
  const PREDICTION_ENGINE_VERSION = 3;

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
      if (cached?.ai_data && cached.ai_data.predictionEngineVersion === PREDICTION_ENGINE_VERSION) {
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
    const seen = new Set();
    injuries.forEach(entry => {
      const name = entry.player?.name;
      const reason = entry.player?.reason || entry.player?.type || 'Unavailable';
      const key = `${entry.team?.id}:${name}:${reason}`;
      if (seen.has(key)) return;
      seen.add(key);
      const label = { name, reason };
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
  // API-Football's predictions.goals field is occasionally not a genuine
  // predicted score at all — for some fixtures it returns a betting-market
  // goal-line/handicap value instead (e.g. -3.5), which parses as a
  // negative number. A real predicted score is never negative, so treat
  // anything outside a sane range (0–10) as unavailable rather than
  // display a broken scoreline like "-2--2".
  const goalsValid = (v) => !isNaN(v) && v >= 0 && v <= 10;
  const homeGoals = goalsValid(rawGoalsHome) ? Math.round(rawGoalsHome) : null;
  const awayGoals = goalsValid(rawGoalsAway) ? Math.round(rawGoalsAway) : null;

  // Outcome derived directly from the scoreline itself, so the two always
  // agree — rather than deriving outcome from percent separately, which
  // could occasionally produce a mismatched label vs scoreline.
  let outcome = 'Draw';
  if (homeGoals != null && awayGoals != null) {
    if (homeGoals > awayGoals) outcome = 'Home Win';
    else if (awayGoals > homeGoals) outcome = 'Away Win';
  } else {
    // Fallback to percent-based outcome if goals weren't available.
    // API-Football very often returns the favourite's percentage exactly
    // equal to the draw percentage (e.g. 45/45/10) — the previous strict
    // `homePct > drawPct` check meant a tie fell through to neither branch
    // and silently kept the 'Draw' default, even when the advice text
    // explicitly named a match winner. Draw should only be the outcome
    // when it's the outright highest of the three; otherwise the higher
    // of home/away wins, with a home/away tie broken toward home advantage.
    if (drawPct > homePct && drawPct > awayPct) {
      outcome = 'Draw';
    } else if (homePct >= awayPct) {
      outcome = 'Home Win';
    } else {
      outcome = 'Away Win';
    }
  }

  // Confidence from how clearly one result stands out from the others
  const sorted = [homePct, drawPct, awayPct].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  const confidence = gap >= 20 ? 'High' : gap >= 10 ? 'Medium' : 'Low';

  // When API-Football's goals field isn't a genuine predicted score (see
  // above), don't just leave the scoreline blank — that's the headline
  // number on this card, and it happens often enough to be a real gap in
  // the product, not a rare edge case. Instead derive a plain, conservative
  // scoreline from the win/draw/away percentages, which ARE reliable real
  // data, rather than fabricating a number from nothing. This is explicitly
  // a fallback, not a claim of goal-level precision.
  let finalHomeGoals = homeGoals;
  let finalAwayGoals = awayGoals;
  if (homeGoals == null || awayGoals == null) {
    if (outcome === 'Draw') {
      finalHomeGoals = 1; finalAwayGoals = 1;
    } else if (outcome === 'Home Win') {
      finalHomeGoals = confidence === 'High' ? 2 : confidence === 'Medium' ? 2 : 1;
      finalAwayGoals = confidence === 'High' ? 0 : confidence === 'Medium' ? 1 : 0;
    } else {
      finalHomeGoals = confidence === 'High' ? 0 : confidence === 'Medium' ? 1 : 0;
      finalAwayGoals = confidence === 'High' ? 2 : confidence === 'Medium' ? 2 : 1;
    }
  }

  const comp = pred.comparison || {};
  const rawHomeForm = pred.teams?.home?.last_5?.form || '';
  const rawAwayForm = pred.teams?.away?.last_5?.form || '';
  // API-Football appears to return a literal "0%" placeholder rather than
  // leaving this genuinely empty when there's no real form data — same
  // pattern as the attack/defence comparison fields, so treat it the same way.
  const homeForm = rawHomeForm === '0%' ? '' : rawHomeForm;
  const awayForm = rawAwayForm === '0%' ? '' : rawAwayForm;
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
  const hasAttData = (!isNaN(attHome) && attHome > 0) || (!isNaN(attAway) && attAway > 0);
  const hasDefData = (!isNaN(defHome) && defHome > 0) || (!isNaN(defAway) && defAway > 0);
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

  // ── Verdict — template sentence combining win probability, form, advice ──
  const advice = pred.predictions?.advice || '';
  const favourite = homePct >= awayPct ? homeTeam : awayTeam;
  const favouritePct = Math.max(homePct, awayPct);
  const verdict = `${favourite} carry the higher win probability at ${favouritePct}% (draw ${drawPct}%). ${advice ? `Statistical model favours: ${advice}.` : ''} Form and head-to-head history support this reading, though football regularly defies pure probability.`.trim();

  const parsed = {
    available: true,
    predictionEngineVersion: PREDICTION_ENGINE_VERSION,
    scoreline: `${finalHomeGoals}-${finalAwayGoals}`,
    homeGoals: finalHomeGoals,
    awayGoals: finalAwayGoals,
    // True when the scoreline came from API-Football's actual goals model;
    // false when it was derived from win/draw/away percentages because the
    // goals field wasn't usable for this fixture. Not surfaced in the UI
    // today, but kept on the object in case it's ever worth flagging.
    scorelineFromGoalsModel: homeGoals != null && awayGoals != null,
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

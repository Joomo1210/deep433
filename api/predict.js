export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { homeTeam, awayTeam, league } = req.body;

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
      system: 'You are a brutally honest expert football analyst. Respond with ONLY a raw JSON object. No markdown. No backticks. Just JSON. CRITICAL: Only include players who genuinely represent that national team. Never put a player in the wrong country lineup. For example, Victor Osimhen plays for Nigeria not Ivory Coast. Double-check every player nationality before including them.',
      messages: [{ role: 'user', content: `Predict this ${league} match. Home: ${homeTeam}, Away: ${awayTeam}. Return ONLY this JSON: {"scoreline":"2-1","homeGoals":2,"awayGoals":1,"outcome":"Home Win","confidence":"Medium","homeLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"awayLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"homeFormation":"4-3-3","awayFormation":"4-2-3-1","keyBattle":"Description","homeKeyPlayer":"Name","awayKeyPlayer":"Name","verdict":"2-3 sentence brutal honest verdict.","wildcard":"One surprise factor."} with real players who actually play for ${homeTeam} and ${awayTeam} national teams only.` }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || '').join('').trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: 'Parse error' });
  res.status(200).json(JSON.parse(jsonMatch[0]));
}
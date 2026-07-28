import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Keep this in sync with SubmitTake.jsx's CURRENT_ROUND — must match so the
// leaderboard only shows this round's submissions, not past winners.
const CURRENT_ROUND = 3;

export default function CommunityLeaderboard() {
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('loading');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('public_community_takes')
        .select('*')
        .eq('round', CURRENT_ROUND)
        .order('total_score', { ascending: false });

      if (error) {
        setStatus('error');
        return;
      }
      setSubmissions(data || []);
      setStatus('ready');
    }
    load();
  }, []);

  if (status === 'loading') return <Centered>Loading leaderboard…</Centered>;
  if (status === 'error') return <Centered>Couldn't load the leaderboard right now.</Centered>;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', color: '#F1F4EC', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 100px' }}>
        <div style={{ fontSize: 13, color: '#FF5A2D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          Community Takes
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Leaderboard</h1>
        <p style={{ color: '#9CA89C', fontSize: 15, marginBottom: 8 }}>
          This round's submissions, ranked by our editorial rubric.
        </p>
        <a href="/submit" style={{ display: 'inline-block', marginBottom: 36, fontSize: 14, color: '#C8FF4D', fontWeight: 700, textDecoration: 'none' }}>
          Want in on the next round? Submit your take →
        </a>

        {submissions.length === 0 && (
          <p style={{ color: '#7E9485' }}>No results published yet. Check back soon.</p>
        )}

        {submissions.map((sub, i) => {
          const topScore = submissions[0]?.total_score;
          const isTiedForFirst = sub.total_score === topScore;
          // For 2nd/3rd place medals, rank by distinct score values seen so far,
          // not raw array index, so ties don't wrongly skip or double up medals.
          const distinctScoresAbove = new Set(submissions.slice(0, i).map(s => s.total_score)).size;

          return (
          <div key={sub.id} style={{ border: '1px solid #173A28', borderRadius: 10, padding: 20, marginBottom: 14, background: isTiedForFirst ? '#173A2833' : '#0E2419' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isTiedForFirst && <span style={{ fontSize: 20 }}>🥇</span>}
                  {!isTiedForFirst && distinctScoresAbove === 1 && <span style={{ fontSize: 20 }}>🥈</span>}
                  {!isTiedForFirst && distinctScoresAbove === 2 && <span style={{ fontSize: 20 }}>🥉</span>}
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{sub.name}</span>
                  <span style={{ fontSize: 14, color: '#7E9485' }}>{sub.x_handle}</span>
                </div>
                <div style={{ fontSize: 13, color: '#9CA89C', marginTop: 4 }}>{sub.match_covered}</div>
              </div>
              {isTiedForFirst && (
                <div style={{ background: '#C8FF4D22', border: '1px solid #C8FF4D', color: '#C8FF4D', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Winner
                </div>
              )}
            </div>

            <button
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              style={{ background: 'none', border: 'none', color: '#3D7EFF', fontSize: 13, cursor: 'pointer', marginTop: 14, padding: 0 }}
            >
              {expandedId === sub.id ? 'Hide take ▲' : 'Read take ▼'}
            </button>

            {expandedId === sub.id && (
              <div style={{ marginTop: 12, padding: 16, background: '#0B1F17', borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {sub.take}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function Centered({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485', background: '#0B1F17', fontFamily: 'sans-serif' }}>{children}</div>;
}

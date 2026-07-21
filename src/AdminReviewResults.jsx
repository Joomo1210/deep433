import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminReviewResults() {
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('loading');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('community_takes_submissions')
        .select('*')
        .eq('reviewed', true)
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

  if (status === 'loading') return <Centered>Loading results…</Centered>;
  if (status === 'error') return <Centered>Couldn't load results.</Centered>;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', color: '#F1F4EC', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 100px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>Review Results</h1>
        <p style={{ color: '#9CA89C', fontSize: 14, marginBottom: 32 }}>
          {submissions.length} reviewed submission{submissions.length !== 1 ? 's' : ''}, ranked by total score
        </p>

        {submissions.length === 0 && (
          <p style={{ color: '#7E9485' }}>No reviewed submissions yet.</p>
        )}

        {submissions.map((sub, i) => (
          <div key={sub.id} style={{ border: '1px solid #173A28', borderRadius: 10, padding: 20, marginBottom: 14, background: i === 0 ? '#173A2833' : '#0E2419' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {i === 0 && <span style={{ fontSize: 20 }}>🥇</span>}
                  {i === 1 && <span style={{ fontSize: 20 }}>🥈</span>}
                  {i === 2 && <span style={{ fontSize: 20 }}>🥉</span>}
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{sub.name}</span>
                  <span style={{ fontSize: 14, color: '#7E9485' }}>{sub.x_handle}</span>
                </div>
                <div style={{ fontSize: 13, color: '#9CA89C', marginTop: 4 }}>{sub.match_covered}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C8FF4D' }}>{sub.total_score}</div>
                <div style={{ fontSize: 11, color: '#7E9485' }}>/ 20</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#9CA89C' }}>
              <span>Reasoning: <strong style={{ color: '#F1F4EC' }}>{sub.reasoning_score}</strong></span>
              <span>Specificity: <strong style={{ color: '#F1F4EC' }}>{sub.specificity_score}</strong></span>
              <span>Originality: <strong style={{ color: '#F1F4EC' }}>{sub.originality_score}</strong></span>
              <span>Clarity: <strong style={{ color: '#F1F4EC' }}>{sub.clarity_score}</strong></span>
            </div>

            <button
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              style={{ background: 'none', border: 'none', color: '#3D7EFF', fontSize: 13, cursor: 'pointer', marginTop: 12, padding: 0 }}
            >
              {expandedId === sub.id ? 'Hide take ▲' : 'Read take ▼'}
            </button>

            {expandedId === sub.id && (
              <div style={{ marginTop: 12, padding: 16, background: '#0B1F17', borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {sub.take}
                {sub.stats_backup && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#9CA89C' }}><strong>Stats cited:</strong> {sub.stats_backup}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Centered({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485', background: '#0B1F17', fontFamily: 'sans-serif' }}>{children}</div>;
}

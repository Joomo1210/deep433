import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const RUBRIC = [
  { key: 'reasoning_score', label: 'Reasoning Quality', hint: 'Is the argument actually supported, not just asserted?' },
  { key: 'specificity_score', label: 'Specificity', hint: 'Concrete detail vs generic filler' },
  { key: 'originality_score', label: 'Originality', hint: 'Fresh angle vs the obvious take' },
  { key: 'clarity_score', label: 'Clarity & Craft', hint: 'Readability, structure, word count' },
];

export default function AdminReviewSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({ reasoning_score: 3, specificity_score: 3, originality_score: 3, clarity_score: 3 });
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState('loading');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('community_takes_submissions')
        .select('*')
        .eq('reviewed', false)
        .order('created_at', { ascending: true });

      if (error) {
        setStatus('error');
        return;
      }
      setSubmissions(data || []);
      setStatus('ready');
    }
    load();
  }, []);

  const current = submissions[index];
  const total = RUBRIC.reduce((sum, r) => sum + (scores[r.key] || 0), 0);

  function updateScore(key, value) {
    setScores(prev => ({ ...prev, [key]: parseInt(value, 10) }));
  }

  async function saveAndNext() {
    if (!current) return;
    setSaving(true);

    await supabase
      .from('community_takes_submissions')
      .update({
        reasoning_score: scores.reasoning_score,
        specificity_score: scores.specificity_score,
        originality_score: scores.originality_score,
        clarity_score: scores.clarity_score,
        total_score: total,
        reviewed: true,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', current.id);

    setSaving(false);
    setRevealed(false);
    setScores({ reasoning_score: 3, specificity_score: 3, originality_score: 3, clarity_score: 3 });
    setIndex(prev => prev + 1);
  }

  if (status === 'loading') return <Centered>Loading submissions…</Centered>;
  if (status === 'error') return <Centered>Couldn't load submissions.</Centered>;
  if (!current) return <Centered>All caught up — no unreviewed submissions left.</Centered>;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', color: '#F1F4EC', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 100px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>Blind Review</h1>
        <p style={{ color: '#9CA89C', fontSize: 14, marginBottom: 32 }}>
          Submission {index + 1} of {submissions.length} — {submissions.length - index - 1} remaining after this one
        </p>

        {/* Match info — visible, not identifying */}
        <div style={{ fontSize: 13, color: '#7E9485', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          {current.match_covered}
        </div>

        {/* The take itself */}
        <div style={{ background: '#0E2419', border: '1px solid #173A28', borderRadius: 10, padding: 24, marginBottom: 20, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {current.take}
        </div>

        {current.stats_backup && (
          <div style={{ background: '#173A2855', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#D6DED2' }}>
            <strong>Stats cited:</strong> {current.stats_backup}
          </div>
        )}

        {/* Rubric scoring */}
        {!revealed && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Score against the rubric</h2>
            {RUBRIC.map(r => (
              <div key={r.key} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</label>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#C8FF4D' }}>{scores[r.key]}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7E9485', marginBottom: 8 }}>{r.hint}</div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={scores[r.key]}
                  onChange={e => updateScore(r.key, e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 24, padding: '16px 20px', background: '#0E2419', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total Score</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#C8FF4D' }}>{total} / 20</span>
            </div>

            <button
              onClick={() => setRevealed(true)}
              style={{ width: '100%', background: 'none', border: '1px solid #3D7EFF', borderRadius: 6, color: '#3D7EFF', padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Reveal Writer
            </button>
          </>
        )}

        {/* Revealed — writer identity + save */}
        {revealed && (
          <>
            <div style={{ background: '#173A2855', border: '1px solid #3D7EFF', borderRadius: 10, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#3D7EFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Writer</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{current.name}</div>
              <div style={{ fontSize: 14, color: '#9CA89C', marginTop: 2 }}>{current.x_handle}</div>
              {current.email && <div style={{ fontSize: 13, color: '#7E9485', marginTop: 6 }}>{current.email}</div>}
              <div style={{ fontSize: 13, color: current.follows_deep433 ? '#4ade80' : '#FF5A2D', marginTop: 8 }}>
                {current.follows_deep433 ? '✓ Confirmed follows @Deep_433' : '✗ Did not confirm following'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px 20px', background: '#0E2419', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Final Score</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#C8FF4D' }}>{total} / 20</span>
            </div>

            <button
              onClick={saveAndNext}
              disabled={saving}
              style={{ width: '100%', background: '#C8FF4D', border: 'none', borderRadius: 6, color: '#0B1F17', padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save Score & Next Submission →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Centered({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485', background: '#0B1F17', fontFamily: 'sans-serif' }}>{children}</div>;
}

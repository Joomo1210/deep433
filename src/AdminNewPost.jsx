import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminNewPost() {
  const [form, setForm] = useState({
    title: '', subtitle: '', body: '',
    competition: '', gameweek: '', match_label: '', match_date: '',
    home_team: '', away_team: '',
    user_prediction: '',
    ai_predicted_score: '', ai_confidence_pct: '', ai_note: '',
    attack_home_pct: '', attack_away_pct: '',
    defence_home_pct: '', defence_away_pct: '',
    key_stat: '', h2h_summary: '',
  });
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function savePost(publish) {
    setStatus('saving');
    setErrorMsg('');

    if (!form.title.trim()) {
      setStatus('error');
      setErrorMsg('Title is required.');
      return;
    }
    if (!form.user_prediction.trim() || !form.ai_predicted_score.trim()) {
      setStatus('error');
      setErrorMsg('Add both your prediction and the AI\'s prediction.');
      return;
    }

    const postPayload = {
      ...form,
      slug: slugify(form.title),
      ai_confidence_pct: form.ai_confidence_pct ? parseInt(form.ai_confidence_pct, 10) : null,
      attack_home_pct: form.attack_home_pct ? parseInt(form.attack_home_pct, 10) : null,
      attack_away_pct: form.attack_away_pct ? parseInt(form.attack_away_pct, 10) : null,
      defence_home_pct: form.defence_home_pct ? parseInt(form.defence_home_pct, 10) : null,
      defence_away_pct: form.defence_away_pct ? parseInt(form.defence_away_pct, 10) : null,
      match_date: form.match_date || null,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    };

    const { error: postError } = await supabase
      .from('blog_posts')
      .insert(postPayload)
      .select()
      .single();

    if (postError) {
      setStatus('error');
      setErrorMsg(postError.message);
      return;
    }

    setStatus('saved');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px', fontFamily: 'sans-serif', color: '#F1F4EC' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>New Post</h1>
      <p style={{ color: '#9CA89C', marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
        Deep433's data-driven takes — your call vs the AI's, backed by the stats behind it.
      </p>

      <Section title="Post & Match Details">
        <Field label="Title" value={form.title} onChange={v => update('title', v)} />
        <Field label="Subtitle" value={form.subtitle} onChange={v => update('subtitle', v)} />
        <Row2>
          <Field label="Competition" value={form.competition} onChange={v => update('competition', v)} />
          <Field label="Gameweek / Round" value={form.gameweek} onChange={v => update('gameweek', v)} />
        </Row2>
        <Field label="Match Label" value={form.match_label} onChange={v => update('match_label', v)} placeholder="e.g. Spain vs Belgium" />
        <Row2>
          <Field label="Home Team" value={form.home_team} onChange={v => update('home_team', v)} />
          <Field label="Away Team" value={form.away_team} onChange={v => update('away_team', v)} />
        </Row2>
        <Field label="Kickoff Date/Time" type="datetime-local" value={form.match_date} onChange={v => update('match_date', v)} />
        <Field label="Body (markdown)" textarea value={form.body} onChange={v => update('body', v)} />
      </Section>

      <Section title="The Prediction Battle — You vs AI" color="#C8FF4D">
        <Row2>
          <Field label="👤 Your Prediction" value={form.user_prediction} onChange={v => update('user_prediction', v)} placeholder="e.g. 2-1" />
          <Field label="🤖 AI Prediction" value={form.ai_predicted_score} onChange={v => update('ai_predicted_score', v)} placeholder="e.g. 2-1" />
        </Row2>
        <Field label="AI Confidence %" value={form.ai_confidence_pct} onChange={v => update('ai_confidence_pct', v)} placeholder="e.g. 68" />
        <Field label="AI Verdict (why note)" textarea value={form.ai_note} onChange={v => update('ai_note', v)} />
      </Section>

      <Section title="Deep Insights — The Data Behind It" color="#3D7EFF">
        <p style={{ fontSize: 12, color: '#7E9485', marginBottom: 16 }}>
          Pull these straight from the app's Deep Insights panel for this fixture — optional, but strengthens the data-driven angle.
        </p>
        <Row2>
          <Field label="Attack Rating — Home %" value={form.attack_home_pct} onChange={v => update('attack_home_pct', v)} placeholder="e.g. 59" />
          <Field label="Attack Rating — Away %" value={form.attack_away_pct} onChange={v => update('attack_away_pct', v)} placeholder="e.g. 41" />
        </Row2>
        <Row2>
          <Field label="Defence Rating — Home %" value={form.defence_home_pct} onChange={v => update('defence_home_pct', v)} placeholder="e.g. 64" />
          <Field label="Defence Rating — Away %" value={form.defence_away_pct} onChange={v => update('defence_away_pct', v)} placeholder="e.g. 36" />
        </Row2>
        <Field label="Key Stat" value={form.key_stat} onChange={v => update('key_stat', v)} placeholder="e.g. Spain had 68% of the ball" />
        <Field label="H2H Summary" textarea value={form.h2h_summary} onChange={v => update('h2h_summary', v)} placeholder="e.g. Spain have won 3 of the last 5 meetings" />
      </Section>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button onClick={() => savePost(false)} disabled={status === 'saving'} style={btnSecondary}>Save Draft</button>
        <button onClick={() => savePost(true)} disabled={status === 'saving'} style={btnPrimary}>Publish Post</button>
      </div>

      {status === 'saving' && <p style={{ color: '#9CA89C', marginTop: 12 }}>Saving…</p>}
      {status === 'saved' && <p style={{ color: '#C8FF4D', marginTop: 12 }}>Saved.</p>}
      {status === 'error' && <p style={{ color: '#FF5A2D', marginTop: 12 }}>Couldn't save: {errorMsg}</p>}
    </div>
  );
}

const btnPrimary = { background: '#C8FF4D', color: '#0B1F17', border: 'none', borderRadius: 4, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const btnSecondary = { background: 'none', border: '1px solid #2A4A3A', color: '#F1F4EC', borderRadius: 4, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };

function Section({ title, color = '#F1F4EC', children }) {
  return (
    <div style={{ border: '1px solid #2A4A3A', borderRadius: 6, padding: 24, marginBottom: 24, background: '#0E2419' }}>
      <div style={{ color, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #2A4A3A' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, textarea, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#9CA89C', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: 80, padding: 12, background: '#0E2419', color: '#F1F4EC', border: '1px solid #2A4A3A', borderRadius: 4, fontSize: 15, lineHeight: 1.5 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: 12, background: '#0E2419', color: '#F1F4EC', border: '1px solid #2A4A3A', borderRadius: 4, fontSize: 15 }}
        />
      )}
    </div>
  );
}

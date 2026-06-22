import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Reuse your existing Deep433 Supabase project credentials
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
    pundit_name: '', pundit_take: '', pundit_predicted_score: '', pundit_source_url: '',
    fan_handle: '', fan_take: '', fan_predicted_score: '',
    ai_predicted_score: '', ai_confidence_pct: '', ai_note: '',
  });
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
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

    const payload = {
      ...form,
      slug: slugify(form.title),
      ai_confidence_pct: form.ai_confidence_pct ? parseInt(form.ai_confidence_pct, 10) : null,
      match_date: form.match_date || null,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('blog_posts').insert(payload);

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('saved');
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px', fontFamily: 'sans-serif' }}>
      <h1>New Post</h1>
      <p style={{ color: '#7E9485', marginBottom: 32 }}>
        Fill in each voice separately — Pundit, Fan, and AI fields render directly into the scoreboard on publish.
      </p>

      <Section title="Post & Match Details">
        <Field label="Title" value={form.title} onChange={v => update('title', v)} placeholder="Everyone's calling Brazil top of the group..." />
        <Field label="Subtitle" value={form.subtitle} onChange={v => update('subtitle', v)} />
        <Row2>
          <Field label="Competition" value={form.competition} onChange={v => update('competition', v)} placeholder="Premier League" />
          <Field label="Gameweek / Round" value={form.gameweek} onChange={v => update('gameweek', v)} placeholder="Gameweek 12" />
        </Row2>
        <Field label="Match Label" value={form.match_label} onChange={v => update('match_label', v)} placeholder="Arsenal vs Chelsea" />
        <Field label="Kickoff Date/Time" type="datetime-local" value={form.match_date} onChange={v => update('match_date', v)} />
        <Field label="Body (markdown)" textarea value={form.body} onChange={v => update('body', v)} />
      </Section>

      <Section title="Pundit Take" color="#3D7EFF">
        <Row2>
          <Field label="Pundit Name" value={form.pundit_name} onChange={v => update('pundit_name', v)} />
          <Field label="Source URL" value={form.pundit_source_url} onChange={v => update('pundit_source_url', v)} />
        </Row2>
        <Field label="Their Take (paraphrased)" textarea value={form.pundit_take} onChange={v => update('pundit_take', v)} />
        <Field label="Predicted Score" value={form.pundit_predicted_score} onChange={v => update('pundit_predicted_score', v)} />
      </Section>

      <Section title="Fan Take" color="#FF5A2D">
        <Row2>
          <Field label="Fan Handle" value={form.fan_handle} onChange={v => update('fan_handle', v)} />
          <Field label="Predicted Score" value={form.fan_predicted_score} onChange={v => update('fan_predicted_score', v)} />
        </Row2>
        <Field label="Their Take" textarea value={form.fan_take} onChange={v => update('fan_take', v)} />
      </Section>

      <Section title="AI's Guess" color="#C8FF4D">
        <Row2>
          <Field label="Predicted Score" value={form.ai_predicted_score} onChange={v => update('ai_predicted_score', v)} />
          <Field label="Confidence %" value={form.ai_confidence_pct} onChange={v => update('ai_confidence_pct', v)} />
        </Row2>
        <Field label="Why Note" textarea value={form.ai_note} onChange={v => update('ai_note', v)} />
      </Section>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button onClick={() => savePost(false)} disabled={status === 'saving'}>
          Save Draft
        </button>
        <button onClick={() => savePost(true)} disabled={status === 'saving'}>
          Publish Post
        </button>
      </div>

      {status === 'saving' && <p>Saving…</p>}
      {status === 'saved' && <p style={{ color: '#3D7EFF' }}>Saved.</p>}
      {status === 'error' && <p style={{ color: '#FF5A2D' }}>Couldn't save: {errorMsg}</p>}
    </div>
  );
}

function Section({ title, color = '#F1F4EC', children }) {
  return (
    <div style={{ border: '1px solid #173A28', borderRadius: 4, padding: 22, marginBottom: 20 }}>
      <div style={{ color, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #173A28' }}>
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
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#7E9485', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: 70, padding: 10, background: '#0B1F17', color: '#F1F4EC', border: '1px solid #173A28', borderRadius: 3 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: 10, background: '#0B1F17', color: '#F1F4EC', border: '1px solid #173A28', borderRadius: 3 }}
        />
      )}
    </div>
  );
}

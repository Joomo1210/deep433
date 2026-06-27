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

const emptyPundit = () => ({ pundit_name: '', take: '', predicted_score: '', source_url: '', is_featured: false });
const emptyFan = () => ({ fan_handle: '', take: '', predicted_score: '', is_featured: false });

export default function AdminNewPost() {
  const [form, setForm] = useState({
    title: '', subtitle: '', body: '',
    competition: '', gameweek: '', match_label: '', match_date: '',
    ai_predicted_score: '', ai_confidence_pct: '', ai_note: '',
  });
  const [pundits, setPundits] = useState([{ ...emptyPundit(), is_featured: true }]);
  const [fans, setFans] = useState([{ ...emptyFan(), is_featured: true }]);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updatePundit(i, field, value) {
    setPundits(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }
  function setFeaturedPundit(i) {
    setPundits(prev => prev.map((p, idx) => ({ ...p, is_featured: idx === i })));
  }
  function addPundit() {
    setPundits(prev => [...prev, emptyPundit()]);
  }
  function removePundit(i) {
    setPundits(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateFan(i, field, value) {
    setFans(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  }
  function setFeaturedFan(i) {
    setFans(prev => prev.map((f, idx) => ({ ...f, is_featured: idx === i })));
  }
  function addFan() {
    setFans(prev => [...prev, emptyFan()]);
  }
  function removeFan(i) {
    setFans(prev => prev.filter((_, idx) => idx !== i));
  }

  async function savePost(publish) {
    setStatus('saving');
    setErrorMsg('');

    if (!form.title.trim()) {
      setStatus('error');
      setErrorMsg('Title is required.');
      return;
    }
    if (pundits.length === 0 || !pundits.some(p => p.pundit_name.trim())) {
      setStatus('error');
      setErrorMsg('Add at least one pundit take.');
      return;
    }
    if (fans.length === 0 || !fans.some(f => f.fan_handle.trim())) {
      setStatus('error');
      setErrorMsg('Add at least one fan take.');
      return;
    }

    const featuredPundit = pundits.find(p => p.is_featured) || pundits[0];
    const featuredFan = fans.find(f => f.is_featured) || fans[0];

    const postPayload = {
      ...form,
      slug: slugify(form.title),
      ai_confidence_pct: form.ai_confidence_pct ? parseInt(form.ai_confidence_pct, 10) : null,
      match_date: form.match_date || null,
      pundit_name: featuredPundit.pundit_name,
      pundit_take: featuredPundit.take,
      pundit_predicted_score: featuredPundit.predicted_score,
      pundit_source_url: featuredPundit.source_url,
      fan_handle: featuredFan.fan_handle,
      fan_take: featuredFan.take,
      fan_predicted_score: featuredFan.predicted_score,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    };

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert(postPayload)
      .select()
      .single();

    if (postError) {
      setStatus('error');
      setErrorMsg(postError.message);
      return;
    }

    const punditRows = pundits
      .filter(p => p.pundit_name.trim())
      .map(p => ({ ...p, post_id: post.id }));
    const fanRows = fans
      .filter(f => f.fan_handle.trim())
      .map(f => ({ ...f, post_id: post.id }));

    const { error: punditError } = await supabase.from('blog_pundit_takes').insert(punditRows);
    const { error: fanError } = await supabase.from('blog_fan_takes').insert(fanRows);

    if (punditError || fanError) {
      setStatus('error');
      setErrorMsg((punditError || fanError).message);
      return;
    }

    setStatus('saved');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px', fontFamily: 'sans-serif', color: '#F1F4EC' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>New Post</h1>
      <p style={{ color: '#9CA89C', marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
        Add as many pundits and fans as you like — pick one of each to feature in the scoreboard. The rest show below as more voices.
      </p>

      <Section title="Post & Match Details">
        <Field label="Title" value={form.title} onChange={v => update('title', v)} />
        <Field label="Subtitle" value={form.subtitle} onChange={v => update('subtitle', v)} />
        <Row2>
          <Field label="Competition" value={form.competition} onChange={v => update('competition', v)} />
          <Field label="Gameweek / Round" value={form.gameweek} onChange={v => update('gameweek', v)} />
        </Row2>
        <Field label="Match Label" value={form.match_label} onChange={v => update('match_label', v)} />
        <Field label="Kickoff Date/Time" type="datetime-local" value={form.match_date} onChange={v => update('match_date', v)} />
        <Field label="Body (markdown)" textarea value={form.body} onChange={v => update('body', v)} />
      </Section>

      <Section title="Pundit Takes" color="#3D7EFF">
        {pundits.map((p, i) => (
          <div key={i} style={voiceCard}>
            <div style={voiceCardHead}>
              <label style={radioLabel}>
                <input type="radio" checked={p.is_featured} onChange={() => setFeaturedPundit(i)} /> Featured in scoreboard
              </label>
              {pundits.length > 1 && <button type="button" onClick={() => removePundit(i)} style={removeBtn}>Remove</button>}
            </div>
            <Row2>
              <Field label="Pundit Name" value={p.pundit_name} onChange={v => updatePundit(i, 'pundit_name', v)} />
              <Field label="Source URL" value={p.source_url} onChange={v => updatePundit(i, 'source_url', v)} />
            </Row2>
            <Field label="Their Take" textarea value={p.take} onChange={v => updatePundit(i, 'take', v)} />
            <Field label="Predicted Score / Outcome" value={p.predicted_score} onChange={v => updatePundit(i, 'predicted_score', v)} placeholder="e.g. 2-0 Brazil, or just 'Brazil win'" />
          </div>
        ))}
        <button type="button" onClick={addPundit} style={addBtn}>+ Add another pundit</button>
      </Section>

      <Section title="Fan Takes" color="#FF5A2D">
        {fans.map((f, i) => (
          <div key={i} style={voiceCard}>
            <div style={voiceCardHead}>
              <label style={radioLabel}>
                <input type="radio" checked={f.is_featured} onChange={() => setFeaturedFan(i)} /> Featured in scoreboard
              </label>
              {fans.length > 1 && <button type="button" onClick={() => removeFan(i)} style={removeBtn}>Remove</button>}
            </div>
            <Row2>
              <Field label="Fan Handle" value={f.fan_handle} onChange={v => updateFan(i, 'fan_handle', v)} />
              <Field label="Predicted Score / Outcome" value={f.predicted_score} onChange={v => updateFan(i, 'predicted_score', v)} />
            </Row2>
            <Field label="Their Take" textarea value={f.take} onChange={v => updateFan(i, 'take', v)} />
          </div>
        ))}
        <button type="button" onClick={addFan} style={addBtn}>+ Add another fan</button>
      </Section>

      <Section title="AI's Guess" color="#C8FF4D">
        <Row2>
          <Field label="Predicted Score" value={form.ai_predicted_score} onChange={v => update('ai_predicted_score', v)} />
          <Field label="Confidence %" value={form.ai_confidence_pct} onChange={v => update('ai_confidence_pct', v)} />
        </Row2>
        <Field label="Why Note" textarea value={form.ai_note} onChange={v => update('ai_note', v)} />
      </Section>

      <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
        <button onClick={() => savePost(false)} disabled={status === 'saving'}>Save Draft</button>
        <button onClick={() => savePost(true)} disabled={status === 'saving'}>Publish Post</button>
      </div>

      {status === 'saving' && <p>Saving…</p>}
      {status === 'saved' && <p style={{ color: '#3D7EFF' }}>Saved.</p>}
      {status === 'error' && <p style={{ color: '#FF5A2D' }}>Couldn't save: {errorMsg}</p>}
    </div>
  );
}

const voiceCard = { border: '1px solid #173A28', borderRadius: 6, padding: 16, marginBottom: 14, background: 'rgba(255,255,255,0.02)' };
const voiceCardHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const radioLabel = { fontSize: 12, color: '#7E9485', display: 'flex', alignItems: 'center', gap: 6 };
const removeBtn = { background: 'none', border: '1px solid #FF5A2D55', color: '#FF5A2D', borderRadius: 4, fontSize: 11, padding: '4px 8px', cursor: 'pointer' };
const addBtn = { background: 'none', border: '1px dashed #173A28', color: '#7E9485', borderRadius: 4, fontSize: 12, padding: '8px 14px', cursor: 'pointer', width: '100%' };

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

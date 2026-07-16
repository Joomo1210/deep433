import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SubmitTake() {
  const [form, setForm] = useState({
    name: '', x_handle: '', match_covered: '', take: '', stats_backup: '',
    follows_deep433: false, submitted_before: '',
  });
  const [status, setStatus] = useState(null); // null | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const wordCount = form.take.trim() ? form.take.trim().split(/\s+/).length : 0;
  const wordCountValid = wordCount >= 200 && wordCount <= 300;

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim() || !form.x_handle.trim() || !form.match_covered.trim() || !form.take.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!wordCountValid) {
      setErrorMsg(`Your take is ${wordCount} words — it needs to be between 200 and 300.`);
      return;
    }
    if (!form.follows_deep433) {
      setErrorMsg('You must confirm you follow @Deep_433 on X for your submission to be considered.');
      return;
    }
    if (!form.submitted_before) {
      setErrorMsg('Please let us know if you\'ve submitted before.');
      return;
    }

    setStatus('submitting');

    const { error } = await supabase.from('community_takes_submissions').insert({
      name: form.name.trim(),
      x_handle: form.x_handle.trim(),
      match_covered: form.match_covered.trim(),
      take: form.take.trim(),
      stats_backup: form.stats_backup.trim() || null,
      follows_deep433: form.follows_deep433,
      submitted_before: form.submitted_before,
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div style={page}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚽</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Take submitted.</h1>
          <p style={{ color: '#9CA89C', fontSize: 16, lineHeight: 1.6 }}>
            Thanks — we've got it. Winners are announced weekly on <a href="/blog" style={{ color: '#4ade80' }}>deep433.com/blog</a> and <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" style={{ color: '#4ade80' }}>@Deep_433</a> on X. Good luck!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Community Takes</h1>
          <p style={{ color: '#9CA89C', fontSize: 15, lineHeight: 1.6 }}>
            Submit your take (200-300 words) on this week's match. Attach stats if you've got them. Top 3 takes win real cash. You must follow @Deep_433 on X for your submission to be considered.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Your Name" value={form.name} onChange={v => update('name', v)} required />
          <Field label="Your X (Twitter) Handle" value={form.x_handle} onChange={v => update('x_handle', v)} placeholder="@yourhandle" required />
          <Field label="Match you're covering" value={form.match_covered} onChange={v => update('match_covered', v)} placeholder="e.g. France vs England" required />

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your Take</label>
            <textarea
              value={form.take}
              onChange={e => update('take', e.target.value)}
              placeholder="Minimum 200 words, maximum 300. Be specific — back your argument with something concrete."
              style={{ ...inputStyle, minHeight: 160, lineHeight: 1.5 }}
            />
            <div style={{ fontSize: 12, marginTop: 6, color: wordCount === 0 ? '#7E9485' : wordCountValid ? '#4ade80' : '#FF5A2D' }}>
              {wordCount} words {wordCount > 0 && (wordCountValid ? '✓' : '(needs to be 200-300)')}
            </div>
          </div>

          <Field
            label="Any stats to back up your take? (optional)"
            value={form.stats_backup}
            onChange={v => update('stats_backup', v)}
            placeholder="e.g. possession %, shots on target, head-to-head record, player form"
            textarea
            required={false}
          />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#D6DED2', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.follows_deep433}
                onChange={e => update('follows_deep433', e.target.checked)}
                style={{ marginTop: 3 }}
              />
              I follow @Deep_433 on X. I understand submissions from non-followers will not be considered.
            </label>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Have you submitted before?</label>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Yes', 'No'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#D6DED2', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="submitted_before"
                    checked={form.submitted_before === opt}
                    onChange={() => update('submitted_before', opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {errorMsg && <p style={{ color: '#FF5A2D', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>}

          <button type="submit" disabled={status === 'submitting'} style={submitBtn}>
            {status === 'submitting' ? 'Submitting…' : 'Submit Your Take'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea, required = true }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight: 80 }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

const page = { background: '#0B1F17', color: '#F1F4EC', minHeight: '100vh', fontFamily: 'sans-serif' };
const labelStyle = { display: 'block', fontSize: 13, color: '#9CA89C', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 };
const inputStyle = { width: '100%', padding: 12, background: '#0E2419', color: '#F1F4EC', border: '1px solid #2A4A3A', borderRadius: 4, fontSize: 15, fontFamily: 'inherit' };
const submitBtn = { width: '100%', background: '#C8FF4D', color: '#0B1F17', border: 'none', borderRadius: 4, padding: '14px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };

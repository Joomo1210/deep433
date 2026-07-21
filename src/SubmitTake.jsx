import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Storage bucket for images fans attach to their takes.
// Create once in Supabase (Dashboard > Storage, or the SQL at the bottom
// of this file). Must be public so <img> tags can load directly.
const IMAGE_BUCKET = 'community-takes-images';

export default function SubmitTake() {
  const [form, setForm] = useState({
    name: '', x_handle: '', match_covered: '', take: '', stats_backup: '',
    follows_deep433: false, submitted_before: '', email: '', wants_updates: false,
    image_url: '',
  });
  const [status, setStatus] = useState(null); // null | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const imageFileInputRef = useRef(null);

  const wordCount = form.take.trim() ? form.take.trim().split(/\s+/).length : 0;
  const wordCountValid = wordCount >= 200 && wordCount <= 300;

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg('');
    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
      update('image_url', data.publicUrl);
    } catch (err) {
      setErrorMsg(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  function removeImage() {
    update('image_url', '');
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
      email: form.email.trim() || null,
      wants_updates: form.wants_updates,
      image_url: form.image_url || null,
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

          {/* Optional image attachment */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Attach an image (optional)</label>
            {form.image_url ? (
              <div>
                <img
                  src={form.image_url}
                  alt="Attached"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                />
                <button type="button" onClick={removeImage} style={secondaryBtn}>
                  Remove Image
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={secondaryBtn}
                >
                  {uploadingImage ? 'Uploading…' : '🖼 Upload Image'}
                </button>
              </>
            )}
          </div>

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

          <Field label="Email (optional)" value={form.email} onChange={v => update('email', v)} placeholder="Only needed if you'd like updates or if you're selected" required={false} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#D6DED2', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.wants_updates}
                onChange={e => update('wants_updates', e.target.checked)}
                style={{ marginTop: 3 }}
              />
              Yes, also send me occasional Deep433 email updates
            </label>
          </div>

          {errorMsg && <p style={{ color: '#FF5A2D', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>}

          <button type="submit" disabled={status === 'submitting' || uploadingImage} style={submitBtn}>
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
const secondaryBtn = { background: 'transparent', color: '#4ade80', border: '1px solid #2A4A3A', borderRadius: 4, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };

/*
=====================================================================
SUPABASE SETUP (run once in the SQL editor) — only what's new for images
=====================================================================

-- 1. Storage bucket for fan-submitted take images
insert into storage.buckets (id, name, public)
values ('community-takes-images', 'community-takes-images', true)
on conflict (id) do nothing;

-- 2. Allow anyone (fans aren't authenticated here) to upload
create policy "Public can upload community take images"
on storage.objects for insert
to public
with check (bucket_id = 'community-takes-images');

-- 3. Allow public read
create policy "Public can view community take images"
on storage.objects for select
to public
using (bucket_id = 'community-takes-images');

-- 4. New column on the existing submissions table
alter table community_takes_submissions
  add column if not exists image_url text;
=====================================================================
*/

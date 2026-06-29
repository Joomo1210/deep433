import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminEditPost() {
  const [slug, setSlug] = useState('');
  const [post, setPost] = useState(null);
  const [finalScore, setFinalScore] = useState('');
  const [status, setStatus] = useState(null); // null | loading | found | not_found | saving | saved | error
  const [errorMsg, setErrorMsg] = useState('');

  async function loadPost() {
    if (!slug.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug.trim())
      .single();

    if (error || !data) {
      setStatus('not_found');
      setPost(null);
      return;
    }

    setPost(data);
    setFinalScore(data.final_score || '');
    setStatus('found');
  }

  async function saveFinalScore() {
    setStatus('saving');
    setErrorMsg('');

    const { error } = await supabase
      .from('blog_posts')
      .update({
        final_score: finalScore.trim() || null,
        settled_at: finalScore.trim() ? new Date().toISOString() : null,
      })
      .eq('id', post.id);

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('saved');
  }

  return (
    <div style={page}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>Edit Post — Final Score</h1>
      <p style={{ color: '#9CA89C', marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
        Enter the post's slug to load it, then update the final score once the match has finished.
      </p>

      <div style={field}>
        <label style={label}>Post Slug</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="e.g. knockouts-are-here-so-is-pundits-vs-fans"
            style={{ ...input, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && loadPost()}
          />
          <button onClick={loadPost} style={btnSecondary}>Load Post</button>
        </div>
        <p style={{ fontSize: 12, color: '#7E9485', marginTop: 8 }}>
          The slug is the part of the URL after /blog/ — e.g. for deep433.com/blog/my-post, the slug is "my-post".
        </p>
      </div>

      {status === 'loading' && <p style={{ color: '#9CA89C' }}>Loading…</p>}
      {status === 'not_found' && <p style={{ color: '#FF5A2D' }}>No post found with that slug.</p>}

      {post && (status === 'found' || status === 'saving' || status === 'saved' || status === 'error') && (
        <div style={card}>
          <div style={{ fontSize: 12, color: '#7E9485', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            {post.category} {post.gameweek ? `· ${post.gameweek}` : ''}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{post.title}</div>
          {post.match_label && <div style={{ fontSize: 14, color: '#9CA89C', marginBottom: 20 }}>{post.match_label}</div>}

          <div style={field}>
            <label style={label}>Final Score</label>
            <input
              value={finalScore}
              onChange={e => setFinalScore(e.target.value)}
              placeholder="e.g. 2-1, or leave blank to clear"
              style={input}
            />
            <p style={{ fontSize: 12, color: '#7E9485', marginTop: 8 }}>
              This is what shows in the "Final Score" column on the public post once filled in.
            </p>
          </div>

          <button onClick={saveFinalScore} disabled={status === 'saving'} style={btnPrimary}>
            {status === 'saving' ? 'Saving…' : 'Save Final Score'}
          </button>

          {status === 'saved' && <p style={{ color: '#C8FF4D', marginTop: 12 }}>Saved.</p>}
          {status === 'error' && <p style={{ color: '#FF5A2D', marginTop: 12 }}>Couldn't save: {errorMsg}</p>}
        </div>
      )}
    </div>
  );
}

const page = { minHeight: '100vh', background: '#0B1F17', maxWidth: 680, margin: '0 auto', padding: '48px 24px 100px', fontFamily: 'sans-serif', color: '#F1F4EC' };
const field = { marginBottom: 24 };
const label = { display: 'block', fontSize: 13, color: '#9CA89C', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 };
const input = { width: '100%', padding: 12, background: '#0E2419', color: '#F1F4EC', border: '1px solid #2A4A3A', borderRadius: 4, fontSize: 15 };
const card = { border: '1px solid #2A4A3A', borderRadius: 6, padding: 24, marginTop: 24, background: '#0E2419' };
const btnPrimary = { background: '#C8FF4D', color: '#0B1F17', border: 'none', borderRadius: 4, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const btnSecondary = { background: 'none', border: '1px solid #2A4A3A', color: '#F1F4EC', borderRadius: 4, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };

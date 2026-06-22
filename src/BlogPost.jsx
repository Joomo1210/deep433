import { useEffect, useState } from 'react';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function BlogPost() {
const slug = window.location.pathname.split('/blog/')[1];
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | not_found | error

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error || !data) {
        setStatus('not_found');
        return;
      }
      setPost(data);
      setStatus('ready');
    }
    load();
  }, [slug]);

  if (status === 'loading') return <Centered>Loading…</Centered>;
  if (status === 'not_found') return <Centered>Post not found.</Centered>;

  const isSettled = !!post.final_score;
  const kickoffPassed = post.match_date && new Date(post.match_date) < new Date();

  return (
    <div style={page}>
      <div style={topbar}>
        <div style={logo}>DEEP4<span style={{ color: '#C8FF4D' }}>33</span> / BLOG</div>
        <div style={navTag}>{post.category?.toUpperCase()} {post.gameweek ? `· ${post.gameweek.toUpperCase()}` : ''}</div>
      </div>

      <div style={eyebrow}>{post.category}</div>
      <h1 style={h1}>{post.title}</h1>
      {post.subtitle && <p style={sub}>{post.subtitle}</p>}
      <div style={meta}>
        <span>{post.read_minutes || 4} MIN READ</span>
        {post.competition && <span>{post.competition.toUpperCase()}</span>}
      </div>

      {/* Scoreboard */}
      <div style={scoreboard}>
        <div style={scoreboardHead}>
          Predictions Board — {post.match_label} · who actually calls it?
        </div>
        <div style={scoreRow}>
          <ScoreCell color="#3D7EFF" label="Pundit Take" value={post.pundit_predicted_score} note={post.pundit_take}>
            {post.pundit_name && (
              <Attribution color="#3D7EFF">
                — {post.pundit_name}{post.pundit_source_url && (
                  <> · <a href={post.pundit_source_url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Source</a></>
                )}
              </Attribution>
            )}
          </ScoreCell>

          <ScoreCell color="#FF5A2D" label="Fan Take" value={post.fan_predicted_score} note={post.fan_take}>
            {post.fan_handle && (
              <Attribution color="#FF5A2D">
                — {post.fan_handle}{post.fan_predicted_score && ` · predicted ${post.fan_predicted_score}`}
              </Attribution>
            )}
          </ScoreCell>

          <ScoreCell color="#C8FF4D" label="AI's Guess" value={post.ai_predicted_score} note={post.ai_note}>
            {post.ai_confidence_pct && <Attribution color="#C8FF4D">{post.ai_confidence_pct}% confidence</Attribution>}
          </ScoreCell>

          <ScoreCell
            color="#F1F4EC"
            label="Final Score"
            value={isSettled ? post.final_score : 'Pending'}
            note={isSettled ? 'This is the only one that actually settled it.' : null}
            pending={!isSettled}
          />
        </div>
      </div>

      {/* Body */}
      <div style={articleBody}>
        {post.body?.split('\n\n').map((para, i) => (
          <p key={i} style={i === 0 ? { ...pStyle, fontSize: 19, color: '#F1F4EC' } : pStyle}>{para}</p>
        ))}
      </div>

      {/* CTA */}
      <div style={cta}>
        <div style={ctaText}>
          {kickoffPassed && !isSettled ? 'Check back for the result' : 'Make your own call before kickoff'}
          <span style={ctaSub}>Predict the score. Beat the AI. Beat the pundits.</span>
        </div>
        <div style={ctaBtn}>Predict Now →</div>
      </div>
    </div>
  );
}

function ScoreCell({ color, label, value, note, pending, children }) {
  return (
    <div style={{ flex: 1, padding: '24px 20px', borderRight: '1px solid #173A28', opacity: pending ? 0.6 : 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'inherit', fontWeight: 700, fontSize: 24 }}>{value || '—'}</div>
      {note && <div style={{ fontSize: 13, color: '#7E9485', marginTop: 8, lineHeight: 1.4 }}>{note}</div>}
      {children}
      {pending && <span style={pendingTag}>Updates after kickoff</span>}
    </div>
  );
}

function Attribution({ color, children }) {
  return <div style={{ fontSize: 11, color, marginTop: 10, fontFamily: 'monospace' }}>{children}</div>;
}

function Centered({ children }) {
  return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485' }}>{children}</div>;
}

// Styles
const page = { background: '#0B1F17', color: '#F1F4EC', minHeight: '100vh', fontFamily: 'sans-serif' };
const topbar = { maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '48px 24px 24px', borderBottom: '1px solid #173A28' };
const logo = { fontWeight: 900, fontSize: 18 };
const navTag = { fontSize: 11, color: '#7E9485', fontFamily: 'monospace', letterSpacing: 1 };
const eyebrow = { maxWidth: 760, margin: '40px auto 0', padding: '0 24px', color: '#FF5A2D', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' };
const h1 = { maxWidth: 760, margin: '14px auto 0', padding: '0 24px', fontSize: 38, lineHeight: 1.1, fontWeight: 900 };
const sub = { maxWidth: 760, margin: '14px auto 0', padding: '0 24px', color: '#7E9485', fontSize: 17, lineHeight: 1.5 };
const meta = { maxWidth: 760, margin: '24px auto 0', padding: '0 24px', display: 'flex', gap: 18, fontSize: 12, color: '#7E9485', fontFamily: 'monospace' };
const scoreboard = { maxWidth: 760, margin: '44px auto 0', padding: '0 24px' };
const scoreboardHead = { fontSize: 11, letterSpacing: 1, color: '#7E9485', padding: '14px 0', borderTop: '1px solid #173A28', borderBottom: '1px solid #173A28', textTransform: 'uppercase' };
const scoreRow = { display: 'flex', border: '1px solid #173A28', borderTop: 'none' };
const articleBody = { maxWidth: 760, margin: '48px auto 0', padding: '0 24px 100px', fontSize: 17, lineHeight: 1.7 };
const pStyle = { marginBottom: 20, color: '#D8E0D6' };
const cta = { maxWidth: 760, margin: '0 auto 100px', padding: '24px', border: '1px solid #C8FF4D', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const ctaText = { fontWeight: 900, fontSize: 16 };
const ctaSub = { display: 'block', fontSize: 12, color: '#7E9485', fontWeight: 400, marginTop: 6 };
const ctaBtn = { fontSize: 12, background: '#C8FF4D', color: '#0B1F17', padding: '12px 20px', borderRadius: 3, whiteSpace: 'nowrap' };
const pendingTag = { display: 'inline-block', fontSize: 10, color: '#7E9485', border: '1px solid #173A28', padding: '3px 8px', borderRadius: 20, marginTop: 8 };

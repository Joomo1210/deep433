import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TEAM_FLAGS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Korea Republic": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "USA": "🇺🇸", "Paraguay": "🇵🇾",
  "Qatar": "🇶🇦", "Switzerland": "🇨🇭", "Brazil": "🇧🇷", "Morocco": "🇲🇦",
  "Haiti": "🇭🇹", "Scotland": "🏴", "Australia": "🇦🇺", "Türkiye": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Netherlands": "🇳🇱", "Japan": "🇯🇵",
  "Côte d'Ivoire": "🇨🇮", "Ecuador": "🇪🇨", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Spain": "🇪🇸", "Cabo Verde": "🇨🇻", "Belgium": "🇧🇪", "Egypt": "🇪🇬",
  "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "England": "🏴", "Croatia": "🇭🇷",
  "Ghana": "🇬🇭", "Panama": "🇵🇦", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
};

function withFlags(matchLabel) {
  if (!matchLabel) return matchLabel;
  const parts = matchLabel.split(/\s+vs\s+/i);
  if (parts.length !== 2) return matchLabel;
  const [home, away] = parts;
  const homeFlag = TEAM_FLAGS[home.trim()] || '';
  const awayFlag = TEAM_FLAGS[away.trim()] || '';
  return (
    <>
      {homeFlag && <span style={{ marginRight: 8 }}>{homeFlag}</span>}
      {home}
      <span style={{ margin: '0 8px', opacity: 0.5 }}>vs</span>
      {away}
      {awayFlag && <span style={{ marginLeft: 8 }}>{awayFlag}</span>}
    </>
  );
}

export default function BlogPost() {
  const slug = window.location.pathname.split('/blog/')[1];
  const [post, setPost] = useState(null);
  const [pundits, setPundits] = useState([]);
  const [fans, setFans] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      const { data: postData, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error || !postData) {
        setStatus('not_found');
        return;
      }
      setPost(postData);

      const [{ data: punditData }, { data: fanData }] = await Promise.all([
        supabase.from('blog_pundit_takes').select('*').eq('post_id', postData.id).order('created_at'),
        supabase.from('blog_fan_takes').select('*').eq('post_id', postData.id).order('created_at'),
      ]);

      setPundits(punditData || []);
      setFans(fanData || []);
      setStatus('ready');
    }
    load();
  }, [slug]);

  if (status === 'loading') return <Centered>Loading…</Centered>;
  if (status === 'not_found') return <Centered>Post not found.</Centered>;

  const featuredPundit = pundits.find(p => p.is_featured) || pundits[0] || {
    pundit_name: post.pundit_name, take: post.pundit_take, predicted_score: post.pundit_predicted_score, source_url: post.pundit_source_url,
  };
  const featuredFan = fans.find(f => f.is_featured) || fans[0] || {
    fan_handle: post.fan_handle, take: post.fan_take, predicted_score: post.fan_predicted_score,
  };
  const morePundits = pundits.filter(p => p !== featuredPundit && !p.is_featured);
  const moreFans = fans.filter(f => f !== featuredFan && !f.is_featured);

  const isSettled = !!post.final_score;

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
      {post.match_label && <div style={matchTag}>{withFlags(post.match_label)}</div>}

      {/* Scoreboard */}
      <div style={scoreboard}>
        <div style={scoreboardHead}>Predictions Board — {withFlags(post.match_label)} · what's your call?</div>
        <div style={scoreRow}>
          <ScoreCell color="#3D7EFF" label="Pundit Take" value={featuredPundit.predicted_score} note={featuredPundit.take}>
            {featuredPundit.pundit_name && (
              <Attribution color="#3D7EFF">
                — {featuredPundit.pundit_name}{featuredPundit.source_url && <> · <a href={featuredPundit.source_url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Source</a></>}
              </Attribution>
            )}
          </ScoreCell>

          <ScoreCell color="#FF5A2D" label="Fan Take" value={featuredFan.predicted_score} note={featuredFan.take}>
            {featuredFan.fan_handle && <Attribution color="#FF5A2D">— {featuredFan.fan_handle}</Attribution>}
          </ScoreCell>

          <ScoreCell color="#C8FF4D" label="AI's Guess" value={post.ai_predicted_score} note={post.ai_note}>
            {post.ai_confidence_pct && <Attribution color="#C8FF4D">{post.ai_confidence_pct}% confidence</Attribution>}
          </ScoreCell>

          <ScoreCell
            color="#F1F4EC"
            label="Final Score"
            value={isSettled ? post.final_score : '— : —'}
            note={isSettled ? "This is the one that actually settles it." : null}
            pending={!isSettled}
          />
        </div>
      </div>

      {/* More voices */}
      {(morePundits.length > 0 || moreFans.length > 0) && (
        <div style={moreVoices}>
          <div style={moreVoicesHead}>More voices on this one</div>
          {morePundits.map(p => (
            <VoiceRow key={p.id} color="#3D7EFF" name={p.pundit_name} take={p.take} score={p.predicted_score} />
          ))}
          {moreFans.map(f => (
            <VoiceRow key={f.id} color="#FF5A2D" name={f.fan_handle} take={f.take} score={f.predicted_score} />
          ))}
        </div>
      )}

      {/* Body */}
      <div style={articleBody}>
        {post.body?.split('\n\n').map((para, i) => (
          <p key={i} style={i === 0 ? { ...pStyle, fontSize: 19, color: '#F1F4EC' } : pStyle}>{para}</p>
        ))}
      </div>

      <div style={cta}>
        <div style={ctaText}>
          Have your say before kickoff
          <span style={ctaSub}>Predict the score. See how it compares.</span>
        </div>
        <a href="/" style={ctaBtn}>Predict Now →</a>
      </div>
    </div>
  );
}

function VoiceRow({ color, name, take, score }) {
  return (
    <div style={voiceRow}>
      <div style={{ ...voiceRowName, color }}>{name}{score && <span style={{ color: '#7E9485', fontWeight: 400 }}> · predicted {score}</span>}</div>
      {take && <div style={voiceRowTake}>{take}</div>}
    </div>
  );
}

function ScoreCell({ color, label, value, note, pending, children }) {
  return (
    <div style={{ flex: 1, padding: '24px 20px', borderRight: '1px solid #173A28', opacity: pending ? 0.6 : 1 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color, marginBottom: 10 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 24 }}>{value || '—'}</div>
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
  return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485', background: '#0B1F17' }}>{children}</div>;
}

const page = { background: '#0B1F17', color: '#F1F4EC', minHeight: '100vh', fontFamily: 'sans-serif' };
const topbar = { maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '48px 24px 24px', borderBottom: '1px solid #173A28' };
const logo = { fontWeight: 900, fontSize: 18 };
const navTag = { fontSize: 11, color: '#7E9485', fontFamily: 'monospace', letterSpacing: 1 };
const eyebrow = { maxWidth: 760, margin: '40px auto 0', padding: '0 24px', color: '#FF5A2D', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' };
const h1 = { maxWidth: 760, margin: '14px auto 0', padding: '0 24px', fontSize: 38, lineHeight: 1.1, fontWeight: 900 };
const sub = { maxWidth: 760, margin: '14px auto 0', padding: '0 24px', color: '#7E9485', fontSize: 17, lineHeight: 1.5 };
const meta = { maxWidth: 760, margin: '24px auto 0', padding: '0 24px', display: 'flex', gap: 18, fontSize: 12, color: '#7E9485', fontFamily: 'monospace' };
const matchTag = { maxWidth: 760, margin: '16px auto 0', padding: '0 24px', fontSize: 22, fontWeight: 700 };
const scoreboard = { maxWidth: 760, margin: '44px auto 0', padding: '0 24px' };
const scoreboardHead = { fontSize: 11, letterSpacing: 1, color: '#7E9485', padding: '14px 0', borderTop: '1px solid #173A28', borderBottom: '1px solid #173A28', textTransform: 'uppercase' };
const scoreRow = { display: 'flex', border: '1px solid #173A28', borderTop: 'none' };
const moreVoices = { maxWidth: 760, margin: '28px auto 0', padding: '0 24px' };
const moreVoicesHead = { fontSize: 11, letterSpacing: 1, color: '#7E9485', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'monospace' };
const voiceRow = { borderTop: '1px solid #173A28', padding: '12px 0' };
const voiceRowName = { fontSize: 13, fontWeight: 700, marginBottom: 4 };
const voiceRowTake = { fontSize: 14, color: '#D6DED2', lineHeight: 1.5 };
const articleBody = { maxWidth: 760, margin: '48px auto 0', padding: '0 24px 100px', fontSize: 17, lineHeight: 1.7 };
const pStyle = { marginBottom: 20, color: '#D6DED2' };
const cta = { maxWidth: 760, margin: '0 auto 100px', padding: '24px', border: '1px solid #C8FF4D', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const ctaText = { fontWeight: 900, fontSize: 16 };
const ctaSub = { display: 'block', fontSize: 12, color: '#7E9485', fontWeight: 400, marginTop: 6 };
const ctaBtn = { fontSize: 12, background: '#C8FF4D', color: '#0B1F17', padding: '12px 20px', borderRadius: 3, whiteSpace: 'nowrap', textDecoration: 'none', fontWeight: 700, display: 'inline-block' };
const pendingTag = { display: 'inline-block', fontSize: 10, color: '#7E9485', border: '1px solid #173A28', padding: '3px 8px', borderRadius: 20, marginTop: 8 };

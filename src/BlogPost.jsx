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

function withFlags(matchLabel, homeCrest, awayCrest) {
  if (!matchLabel) return matchLabel;
  const parts = matchLabel.split(/\s+vs\s+/i);
  if (parts.length !== 2) return matchLabel;
  const [home, away] = parts;
  const homeFlag = TEAM_FLAGS[home.trim()] || '';
  const awayFlag = TEAM_FLAGS[away.trim()] || '';
  return (
    <>
      {homeCrest ? (
        <img src={homeCrest} alt="" style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8, verticalAlign: 'middle' }} />
      ) : (
        homeFlag && <span style={{ marginRight: 8 }}>{homeFlag}</span>
      )}
      {home}
      <span style={{ margin: '0 8px', opacity: 0.5 }}>vs</span>
      {away}
      {awayCrest ? (
        <img src={awayCrest} alt="" style={{ width: 20, height: 20, objectFit: 'contain', marginLeft: 8, verticalAlign: 'middle' }} />
      ) : (
        awayFlag && <span style={{ marginLeft: 8 }}>{awayFlag}</span>
      )}
    </>
  );
}

export default function BlogPost() {
  const slug = window.location.pathname.split('/blog/')[1];
  const [post, setPost] = useState(null);
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
      setStatus('ready');
    }
    load();
  }, [slug]);

  if (status === 'loading') return <Centered>Loading…</Centered>;
  if (status === 'not_found') return <Centered>Post not found.</Centered>;

  const isSettled = !!post.final_score;
  const hasDeepInsights = post.attack_home_pct != null || post.key_stat || post.h2h_summary;

  return (
    <div style={page}>
      <div style={topbar}>
        <div style={logo}>DEEP4<span style={{ color: '#C8FF4D' }}>33</span> / BLOG</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" aria-label="Follow Deep433 on X" style={{ display: 'inline-flex', color: '#7E9485' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <div style={navTag}>{post.category?.toUpperCase()} {post.gameweek ? `· ${post.gameweek.toUpperCase()}` : ''}</div>
        </div>
      </div>

      <div style={eyebrow}>{post.category}</div>
      <h1 style={h1}>{post.title}</h1>
      {post.subtitle && <p style={sub}>{post.subtitle}</p>}
      <div style={meta}>
        <span>{post.read_minutes || 4} MIN READ</span>
        {post.competition && <span>{post.competition.toUpperCase()}</span>}
      </div>
      {post.match_label && <div style={matchTag}>{withFlags(post.match_label, post.home_team_logo, post.away_team_logo)}</div>}
      {post.image_url && (
        <div style={{ maxWidth: 760, margin: '28px auto 0', padding: '0 24px' }}>
          <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 8 }} />
        </div>
      )}

      {post.is_community_take ? (
        /* Community Take byline */
        <div style={{ maxWidth: 760, margin: '28px auto 0', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0E2419', border: '1px solid #173A28', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#FF5A2D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Community Take</div>
            <div style={{ width: 1, height: 16, background: '#173A28' }} />
            <div style={{ fontSize: 14, color: '#F1F4EC' }}>
              By <strong>{post.writer_name}</strong>
              {post.writer_handle && <span style={{ color: '#7E9485' }}> · {post.writer_handle}</span>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Scoreboard — You vs AI */}
          <div style={scoreboard}>
            <div style={scoreboardHead}>You vs AI — {withFlags(post.match_label, post.home_team_logo, post.away_team_logo)} · who called it?</div>
            <div style={scoreRow}>
              <ScoreCell color="#3D7EFF" label="👤 Your Call" value={post.user_prediction} />

              <ScoreCell color="#C8FF4D" label="🤖 AI's Guess" value={post.ai_predicted_score} note={post.ai_note}>
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

          {/* Deep Insights */}
          {hasDeepInsights && (
            <div style={insightsBox}>
              <div style={insightsHead}>📊 Deep Insights — the data behind it</div>

          {post.attack_home_pct != null && (
            <StatBar label="Attack Rating" home={post.attack_home_pct} away={post.attack_away_pct} homeTeam={post.home_team} awayTeam={post.away_team} />
          )}
          {post.defence_home_pct != null && (
            <StatBar label="Defence Rating" home={post.defence_home_pct} away={post.defence_away_pct} homeTeam={post.home_team} awayTeam={post.away_team} />
          )}
          {post.key_stat && <div style={keyStat}>📌 {post.key_stat}</div>}
          {post.h2h_summary && <div style={h2hSummary}>{post.h2h_summary}</div>}
        </div>
      )}
        </>
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
          <span style={ctaSub}>Predict the score. See how it compares to the AI.</span>
        </div>
        <a href="/" style={ctaBtn}>Predict Now →</a>
      </div>
    </div>
  );
}

function StatBar({ label, home, away, homeTeam, awayTeam }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7E9485', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        <span>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#3D7EFF', minWidth: 34 }}>{home}%</span>
        <div style={{ flex: 1, height: 6, background: '#173A28', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${home}%`, background: '#3D7EFF' }} />
          <div style={{ width: `${away}%`, background: '#C8FF4D' }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#C8FF4D', minWidth: 34, textAlign: 'right' }}>{away}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7E9485', marginTop: 4 }}>
        <span>{homeTeam}</span>
        <span>{awayTeam}</span>
      </div>
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
const insightsBox = { maxWidth: 760, margin: '28px auto 0', padding: '24px', border: '1px solid #173A28', borderRadius: 6, background: '#0E2419' };
const insightsHead = { fontSize: 12, letterSpacing: 1, color: '#3D7EFF', textTransform: 'uppercase', marginBottom: 18, fontWeight: 700 };
const keyStat = { fontSize: 14, color: '#F1F4EC', background: '#173A2855', padding: '12px 14px', borderRadius: 4, marginTop: 12, lineHeight: 1.5 };
const h2hSummary = { fontSize: 13, color: '#9CA89C', marginTop: 12, lineHeight: 1.5 };
const articleBody = { maxWidth: 760, margin: '48px auto 0', padding: '0 24px 100px', fontSize: 17, lineHeight: 1.7 };
const pStyle = { marginBottom: 20, color: '#D6DED2' };
const cta = { maxWidth: 760, margin: '0 auto 100px', padding: '24px', border: '1px solid #C8FF4D', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const ctaText = { fontWeight: 900, fontSize: 16 };
const ctaSub = { display: 'block', fontSize: 12, color: '#7E9485', fontWeight: 400, marginTop: 6 };
const ctaBtn = { fontSize: 12, background: '#C8FF4D', color: '#0B1F17', padding: '12px 20px', borderRadius: 3, whiteSpace: 'nowrap', textDecoration: 'none', fontWeight: 700, display: 'inline-block' };
const pendingTag = { display: 'inline-block', fontSize: 10, color: '#7E9485', border: '1px solid #173A28', padding: '3px 8px', borderRadius: 20, marginTop: 8 };

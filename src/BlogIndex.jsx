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

function flagsFor(matchLabel) {
  if (!matchLabel) return '';
  const parts = matchLabel.split(/\s+vs\s+/i);
  if (parts.length !== 2) return '';
  const [home, away] = parts;
  const h = TEAM_FLAGS[home.trim()] || '';
  const a = TEAM_FLAGS[away.trim()] || '';
  return [h, a].filter(Boolean).join(' ');
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) {
        setStatus('error');
        return;
      }
      setPosts(data || []);
      setStatus('ready');
    }
    load();
  }, []);

  return (
    <div style={page}>
      <div style={topbar}>
        <a href="/" style={logo}>DEEP4<span style={{ color: '#C8FF4D' }}>33</span></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" aria-label="Follow Deep433 on X" style={{ display: 'inline-flex', color: '#7E9485' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="/" style={backLink}>← Back to predictor</a>
        </div>
      </div>

      <div style={hero}>
        <div style={heroTag}>The Deep433 Journal</div>
        <h1 style={h1}>Pundits vs Fans</h1>
        <p style={heroSub}>The official line, the fan reaction, and an AI guess thrown in. Read what's been said — then have your own say.</p>
      </div>

      <div style={list}>
        {status === 'loading' && <p style={emptyText}>Loading posts…</p>}
        {status === 'error' && <p style={emptyText}>Couldn't load posts right now.</p>}
        {status === 'ready' && posts.length === 0 && (
          <p style={emptyText}>No posts yet — check back once the action starts.</p>
        )}
        {posts.map(post => (
          <a key={post.id} href={`/blog/${post.slug}`} style={card}>
            <div style={cardTop}>
              <span style={cardCategory}>{post.category}</span>
              {post.gameweek && <span style={cardGameweek}>{post.gameweek}</span>}
            </div>
            <h2 style={cardTitle}>{post.title}</h2>
            {post.subtitle && <p style={cardSub}>{post.subtitle}</p>}
            <div style={cardFooter}>
              {post.match_label && (
                <span style={cardMatch}>{flagsFor(post.match_label)} {post.match_label}</span>
              )}
              <span style={cardArrow}>Read →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const page = { background: '#0B1F17', color: '#F1F4EC', minHeight: '100vh', fontFamily: 'sans-serif' };
const topbar = { maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 24px', borderBottom: '1px solid #173A28' };
const logo = { fontWeight: 900, fontSize: 18, color: '#F1F4EC', textDecoration: 'none' };
const backLink = { fontSize: 12, color: '#7E9485', textDecoration: 'none', fontFamily: 'monospace' };
const hero = { maxWidth: 800, margin: '0 auto', padding: '56px 24px 0' };
const heroTag = { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#FF5A2D', fontFamily: 'monospace' };
const h1 = { fontSize: 44, fontWeight: 900, margin: '14px 0' };
const heroSub = { fontSize: 17, color: '#9CA89C', maxWidth: 560, lineHeight: 1.6 };
const list = { maxWidth: 800, margin: '0 auto', padding: '40px 24px 100px', display: 'flex', flexDirection: 'column', gap: 18 };
const emptyText = { color: '#7E9485', fontSize: 15 };
const card = {
  display: 'block', border: '1px solid #173A28', borderRadius: 10, padding: 26,
  textDecoration: 'none', color: 'inherit', background: 'rgba(255,255,255,0.015)',
  transition: 'border-color 0.2s',
};
const cardTop = { display: 'flex', gap: 12, marginBottom: 12 };
const cardCategory = { fontSize: 11, color: '#FF5A2D', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' };
const cardGameweek = { fontSize: 11, color: '#7E9485', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' };
const cardTitle = { fontSize: 24, fontWeight: 800, marginBottom: 8, lineHeight: 1.25 };
const cardSub = { fontSize: 15, color: '#9CA89C', marginBottom: 16, lineHeight: 1.5 };
const cardFooter = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 };
const cardMatch = { color: '#9CA89C' };
const cardArrow = { color: '#C8FF4D', fontFamily: 'monospace', fontWeight: 700 };

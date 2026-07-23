import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://idisdztwpvedtnroiian.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXNkenR3cHZlZHRucm9paWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTczOTQsImV4cCI6MjA5NzAzMzM5NH0.YmF0DqWmopuJs9Ci1hdFi0XDMoWRD0yfVwOuuG7WVyE"
);

function useLatestPosts(limit) {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      setPosts(data || []);
      setLoaded(true);
    }
    load();
  }, [limit]);
  return { posts, loaded };
}

export default function LandingPage({ onGetStarted }) {
  const { posts, loaded } = useLatestPosts(6);
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0010", color: "#f0f0f0", fontFamily: "'Inter','Helvetica Neue',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        .cta-btn { background: linear-gradient(135deg, #4ade80, #22c55e); border: none; border-radius: 12px; color: #060f06; cursor: pointer; font-family: inherit; font-size: 17px; font-weight: 800; padding: 16px 40px; transition: opacity 0.2s, transform 0.15s; text-decoration: none; display: inline-block; }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .ghost-btn { background: none; border: 1.5px solid #3a2a5a; border-radius: 10px; color: #888; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; padding: 10px 24px; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .ghost-btn:hover { border-color: #7c3aed; color: #a78bfa; }
        .featured-card { display: block; background: linear-gradient(135deg, #1a1035, #0f0a20); border: 1px solid #2a1f4a; border-radius: 18px; padding: 36px; text-decoration: none; transition: border-color 0.2s; }
        .featured-card:hover { border-color: #4ade80; }
        .post-card { display: block; background: #13102a; border: 1px solid #2a1f4a; border-radius: 14px; padding: 22px; text-decoration: none; transition: border-color 0.2s, transform 0.15s; }
        .post-card:hover { border-color: #4ade80; transform: translateY(-2px); }
        .predict-strip { background: linear-gradient(135deg, #13102a, #0d0018); border: 1px solid #2a1f4a; border-radius: 16px; padding: 28px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .posts-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 26px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1f4a", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700 }}>DATA-DRIVEN FOOTBALL INSIGHTS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="ghost-btn" onClick={onGetStarted}>Predict a Match</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 24px 24px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a0a2e", border: "1px solid #7c3aed44", borderRadius: 40, padding: "6px 16px", marginBottom: 20 }}>
          <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: 1 }}>LIVE COVERAGE · EVERY MATCHDAY</span>
        </div>

        <div className="hero-title" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, lineHeight: 1.2, marginBottom: 14 }}>
          The stats have spoken. <span style={{ color: "#7c3aed" }}>The AI has its call.</span> <span style={{ color: "#4ade80" }}>What's yours?</span>
        </div>

        <p style={{ fontSize: 16, color: "#888", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 28px" }}>
          Predict the score, then find out if you can out-think the machine — plus stats, graphics, and paid writing, all in one place.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="cta-btn" onClick={onGetStarted}>⚡ Predict a Match</button>
          <a href="/blog" className="ghost-btn">📰 Read the Latest</a>
          <a href="/leaderboard" className="ghost-btn">🏆 Community Leaderboard</a>
          <a href="/submit" className="ghost-btn">✍️ Write & Get Paid</a>
        </div>
      </section>

      {/* What's Inside — full site map for new visitors */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>What's Inside</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111" }}>Everything Deep433 has to offer</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { icon: "⚡", title: "Predict", desc: "Make your call before kickoff, compare against 433's AI prediction.", href: "/" },
            { icon: "🔴", title: "Live Scores", desc: "Real-time scores across every major league and tournament.", href: "/" },
            { icon: "🏆", title: "Bracket", desc: "Follow knockout tournaments through to the final.", href: "/" },
            { icon: "🎖", title: "Season Awards", desc: "End-of-season leaders across goals, assists, clean sheets and more.", href: "/" },
            { icon: "📊", title: "Graphics", desc: "Build your own player and team comparison cards, free to use.", href: "/" },
            { icon: "🆚", title: "You vs AI", desc: "Track your prediction record against 433 all season long.", href: "/" },
            { icon: "🏅", title: "Badges", desc: "Earn badges as you build your prediction history.", href: "/" },
            { icon: "📋", title: "History", desc: "Every prediction you've made, all in one place.", href: "/" },
            { icon: "📰", title: "Blog", desc: "Data-driven previews, recaps, and community-written takes.", href: "/blog" },
            { icon: "🏆", title: "Leaderboard", desc: "See how this round's Community Takes writers ranked.", href: "/leaderboard" },
            { icon: "✍️", title: "Write & Get Paid", desc: "Submit your own take on a big match, get published, get paid.", href: "/submit" },
          ].map(item => (
            <a key={item.title} href={item.href} style={{ display: "block", textDecoration: "none", background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "18px 16px", transition: "transform 0.15s" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12.5, color: "#777", lineHeight: 1.5 }}>{item.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FEATURED POST */}
      {loaded && featured && (
        <section style={{ padding: "20px 24px 60px", maxWidth: 1000, margin: "0 auto" }}>
          <a href={`/blog/${featured.slug}`} className="featured-card">
            {featured.image_url && (
              <img src={featured.image_url} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>
              {featured.category}{featured.gameweek ? ` · ${featured.gameweek}` : ""}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, lineHeight: 1.1, marginBottom: 14, maxWidth: 700 }}>{featured.title}</div>
            {featured.subtitle && <p style={{ fontSize: 16, color: "#999", lineHeight: 1.6, maxWidth: 620 }}>{featured.subtitle}</p>}
            <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Read the full breakdown →</div>
          </a>
        </section>
      )}

      {/* MORE POSTS */}
      {loaded && rest.length > 0 && (
        <section style={{ padding: "0 24px 80px", maxWidth: 1000, margin: "0 auto" }}>
          <div className="posts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {rest.map(post => (
              <a key={post.id} href={`/blog/${post.slug}`} className="post-card">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  {post.category}{post.gameweek ? ` · ${post.gameweek}` : ""}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>{post.title}</div>
                {post.match_label && <div style={{ fontSize: 13, color: "#666" }}>{post.match_label}</div>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY STATE — before first post is published */}
      {loaded && posts.length === 0 && (
        <section style={{ padding: "0 24px 80px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ border: "1px dashed #2a1f4a", borderRadius: 16, padding: 48, color: "#666" }}>
            First breakdown drops once matchday kicks off. Check back soon.
          </div>
        </section>
      )}

      {/* PREDICT STRIP */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1000, margin: "0 auto" }}>
        <div className="predict-strip">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>Your Turn</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Done reading? Make your own prediction.</div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>Lock in a scoreline, see how it compares to the AI's guess — no account needed.</div>
          </div>
          <button className="cta-btn" onClick={onGetStarted}>⚡ Predict Now</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #2a1f4a", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <img src="/deep433.jpg" alt="Deep433" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
        </div>
        <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>Data-driven football insights, brought to you by deep433.com</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 4 }}>
          <a href="/blog" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>Read the Journal →</a>
          <a href="/leaderboard" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>Leaderboard →</a>
          <a href="https://x.com/Deep_433" target="_blank" rel="noreferrer" aria-label="Follow Deep433 on X" style={{ display: "inline-flex", color: "#888" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

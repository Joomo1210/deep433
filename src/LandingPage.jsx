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
          .hero-title { font-size: 48px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #2a1f4a", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚽</span>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2 }}>DEEP433</div>
            <div style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700 }}>PUNDITS VS FANS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="ghost-btn" onClick={onGetStarted}>Predict a Match</button>
          <button className="cta-btn" style={{ fontSize: 13, padding: "10px 20px" }} onClick={onGetStarted}>Sign Up Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "120px 24px 60px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a0a2e", border: "1px solid #7c3aed44", borderRadius: 40, padding: "6px 16px", marginBottom: 28 }}>
          <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: 1 }}>LIVE COVERAGE · EVERY MATCHDAY</span>
        </div>

        <div className="hero-title" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, lineHeight: 1.0, marginBottom: 24 }}>
          The pundits have their say.<br/>
          <span style={{ color: "#7c3aed" }}>The fans have theirs.</span><br/>
          <span style={{ color: "#4ade80" }}>What's your call?</span>
        </div>

        <p style={{ fontSize: 17, color: "#888", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 36px" }}>
          Every matchday, we put the official line next to what fans are actually saying — then throw in an AI guess for good measure. Read it, argue with it, then go predict the score yourself.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/blog" className="cta-btn">📰 Read the Latest</a>
          <button className="ghost-btn" onClick={onGetStarted}>⚡ Or Predict a Match</button>
        </div>
      </section>

      {/* FEATURED POST */}
      {loaded && featured && (
        <section style={{ padding: "20px 24px 60px", maxWidth: 1000, margin: "0 auto" }}>
          <a href={`/blog/${featured.slug}`} className="featured-card">
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
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>You vs AI</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Done reading? Make your own prediction.</div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>Lock in a scoreline, see how it compares to the AI's guess, climb the leaderboard.</div>
          </div>
          <button className="cta-btn" onClick={onGetStarted}>⚡ Predict Now</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #2a1f4a", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80", letterSpacing: 2, marginBottom: 8 }}>⚽ DEEP433</div>
        <div style={{ fontSize: 12, color: "#444", marginBottom: 8 }}>Pundits vs Fans, brought to you by deep433.com</div>
        <a href="/blog" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>Read the Journal →</a>
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Only these emails can access admin blog routes
const ADMIN_EMAILS = ['ojo.jojo88@gmail.com', 'ojojoseph7@yahoo.com'];

export default function AdminGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | authorized | denied
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && ADMIN_EMAILS.includes(session.user.email)) {
        setStatus('authorized');
      } else {
        setStatus('denied');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && ADMIN_EMAILS.includes(session.user.email)) {
        setStatus('authorized');
      } else {
        setStatus('denied');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // onAuthStateChange will pick up the new session and update status
    setLoading(false);
  }

  if (status === 'checking') {
    return <Centered>Checking access…</Centered>;
  }

  if (status === 'authorized') {
    return children;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F17', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F1F4EC', marginBottom: 8, textAlign: 'center' }}>Admin Sign In</h1>
        <p style={{ fontSize: 13, color: '#7E9485', marginBottom: 24, textAlign: 'center' }}>Restricted area — Deep433 admin only.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inputStyle, marginBottom: 16 }}
        />
        {error && <p style={{ color: '#FF5A2D', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={btnStyle}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E9485', background: '#0B1F17', fontFamily: 'sans-serif' }}>{children}</div>;
}

const inputStyle = { width: '100%', padding: 12, background: '#0E2419', color: '#F1F4EC', border: '1px solid #2A4A3A', borderRadius: 4, fontSize: 15, marginBottom: 10, fontFamily: 'inherit' };
const btnStyle = { width: '100%', background: '#C8FF4D', color: '#0B1F17', border: 'none', borderRadius: 4, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' };

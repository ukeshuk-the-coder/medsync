import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
      const dest = (location.state as any)?.from || '/dashboard';
      navigate(dest);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Login failed.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Login</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>Welcome back to MedSync.</p>
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field"><label>Password</label><input required type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: '0.85rem' }}>
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account</Link>
        </div>
        <div style={{ marginTop: 20, padding: 12, background: 'var(--mint-bg)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>
          Demo login — patient@medsync.in / demo1234 · admin@medsync.in / admin123
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Forgot Password</h2>
        {sent ? (
          <p style={{ color: 'var(--muted)' }}>If that email exists in our system, a password reset link has been sent.</p>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: '0.9rem' }}>Enter your registered email and we'll send you a reset link.</p>
            <form onSubmit={submit}>
              <div className="field"><label>Email</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
            </form>
          </>
        )}
        <div style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}><Link to="/login">Back to login</Link></div>
      </div>
    </div>
  );
}

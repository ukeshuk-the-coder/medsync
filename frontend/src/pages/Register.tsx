import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';
import api from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', state: '', city: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/meta/states').then(r => setStates(r.data)); }, []);
  useEffect(() => {
    if (form.state) api.get(`/meta/cities?state=${encodeURIComponent(form.state)}`).then(r => setCities(r.data));
  }, [form.state]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast('Account created!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Registration failed.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 4 }}>Create Account</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>Join Medsync to book appointments across India.</p>
        <form onSubmit={submit}>
          <div className="field"><label>Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Password</label><input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="field"><label>Mobile Number</label><input required value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="grid grid-2">
            <div className="field"><label>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value, city: '' })}>
                <option value="">Select</option>{states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field"><label>City</label>
              <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} disabled={!cities.length}>
                <option value="">Select</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
        <div style={{ marginTop: 16, fontSize: '0.85rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

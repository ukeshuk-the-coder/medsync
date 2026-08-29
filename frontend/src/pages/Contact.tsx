import { useState } from 'react';
import { useToast } from '../Toast';

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  return (
    <div className="container section" style={{ maxWidth: 520 }}>
      <h1 style={{ marginBottom: 6 }}>Contact Us</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Questions about Medsync? Send us a message.</p>
      {sent ? (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: 'var(--ok)' }}>✓</div>
          <h3>Message sent</h3>
          <p style={{ color: 'var(--muted)' }}>Thanks for reaching out — we'll get back to you soon.</p>
        </div>
      ) : (
        <form className="card" style={{ padding: 28 }} onSubmit={e => { e.preventDefault(); setSent(true); toast('Message sent!', 'success'); }}>
          <div className="field"><label>Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Message</label><textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
          <button className="btn btn-primary btn-block">Send Message</button>
        </form>
      )}
    </div>
  );
}

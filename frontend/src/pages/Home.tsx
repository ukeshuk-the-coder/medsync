import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SPECIALTY_ICONS: Record<string, string> = {
  Cardiology: '♡', Neurology: '⚡', Orthopedics: '🦴', Dermatology: '✦',
  Pediatrics: '☺', Gynecology: '◐', 'General Medicine': '✚', ENT: '👂',
  Ophthalmology: '◉', Oncology: '✧', Urology: '⬡', Dentistry: '⛁',
};

export default function Home() {
  const navigate = useNavigate();
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/meta/states').then(r => setStates(r.data));
    api.get('/meta/specialties').then(r => setSpecialties(r.data));
  }, []);

  useEffect(() => {
    if (state) api.get(`/meta/cities?state=${encodeURIComponent(state)}`).then(r => setCities(r.data));
    else setCities([]);
    setCity('');
  }, [state]);

  const search = () => {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (specialty) params.set('specialty', specialty);
    if (q) params.set('q', q);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(180deg, #0F3D3E 0%, #123F3B 60%, #0F3D3E 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="70" viewBox="0 0 1200 70" preserveAspectRatio="none" style={{ position: 'absolute', top: 40, left: 0, opacity: 0.18 }}>
          <path d="M0 35 H480 L510 10 L540 60 L570 35 H1200" stroke="#E4A335" strokeWidth="2.5" fill="none" />
        </svg>
        <div className="container" style={{ padding: '88px 24px 72px', textAlign: 'center', position: 'relative' }}>
          <div className="eyebrow" style={{ color: '#E4A335', marginBottom: 14 }}>Healthcare, coordinated across India</div>
          <h1 style={{ color: 'white', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', maxWidth: 780, margin: '0 auto 18px' }}>
            Find the Right Doctor. Book the Right Time. Anywhere in India.
          </h1>
          <p style={{ color: '#B7D9D4', maxWidth: 620, margin: '0 auto 40px', fontSize: '1.05rem' }}>
            Discover doctors and hospitals, check real-time availability, book appointments online and connect with hospitals — all from one platform.
          </p>

          <div className="card" style={{ padding: 20, maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
            <div className="grid grid-4" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                <label>State</label>
                <select value={state} onChange={e => setState(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>City</label>
                <select value={city} onChange={e => setCity(e.target.value)} disabled={!cities.length}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Specialty</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
                  <option value="">Any Specialty</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Doctor / Hospital</label>
                <input placeholder="Search by name" value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-amber btn-block" onClick={search}>🔍 Find Doctor</button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section container">
        <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>The patient journey</div>
        <h2 style={{ textAlign: 'center', marginBottom: 48 }}>How Medsync Works</h2>
        <div className="grid grid-4">
          {[
            ['Choose your location', 'Pick your state and city anywhere in India.'],
            ['Find your doctor', 'Filter by specialty, experience, fee and rating.'],
            ['Check availability', 'See live slots — no more calling the front desk.'],
            ['Book & confirm', 'Get instant confirmation with an appointment ID.'],
          ].map(([title, desc], i) => (
            <div key={title} className="card" style={{ padding: 24 }}>
              <div className="mono" style={{ color: 'var(--amber-deep)', fontSize: '0.8rem', marginBottom: 10 }}>STEP {String(i + 1).padStart(2, '0')}</div>
              <h4 style={{ fontSize: '1.05rem' }}>{title}</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="section" style={{ background: 'var(--teal-soft)' }}>
        <div className="container">
          <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Browse by need</div>
          <h2 style={{ textAlign: 'center', marginBottom: 40 }}>Popular Specialties</h2>
          <div className="grid grid-4">
            {Object.keys(SPECIALTY_ICONS).map(s => (
              <div key={s} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(s)}`)}>
                <span style={{ fontSize: '1.4rem', color: 'var(--amber-deep)' }}>{SPECIALTY_ICONS[s]}</span>
                <span style={{ fontWeight: 600 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY MEDSYNC */}
      <section className="section container">
        <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Built different</div>
        <h2 style={{ textAlign: 'center', marginBottom: 48 }}>Why Medsync?</h2>
        <div className="grid grid-4">
          {[
            'Doctors across India', 'Easy appointment booking', 'Doctor experience &amp; ratings', 'Live hospital location',
            'Alternative slot suggestions', 'Hospital callback option', 'Instant confirmation', 'Distributed hospital coordination',
          ].map(f => (
            <div key={f} className="card" style={{ padding: 20, fontWeight: 600, fontSize: '0.92rem' }}>{f.replace('&amp;', '&')}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

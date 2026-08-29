import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import type { Doctor } from '../types';

const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    setDoctor(null);
    api.get(`/doctors/${id}`).then(r => setDoctor(r.data));
  }, [id]);

  if (!doctor) return <div className="container section"><div className="skeleton" style={{ height: 320 }} /></div>;

  return (
    <div className="container section">
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%', background: 'var(--teal-soft)', color: 'var(--teal-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'Fraunces, serif', fontSize: '1.8rem', flexShrink: 0
              }}>{doctor.name.replace('Dr. ', '').split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
              <div>
                <h2 style={{ marginBottom: 2 }}>{doctor.name}</h2>
                <div style={{ color: 'var(--muted)', fontWeight: 600 }}>{doctor.specialty}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{doctor.qualification} · {doctor.experience_years}+ Years Experience</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <span className="pill pill-warn">★ {doctor.rating}</span>
                  <span className="pill pill-neutral">{(doctor.languages || []).join(', ')}</span>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 20 }}>{doctor.about}</p>

            <h4 style={{ fontSize: '0.95rem', marginTop: 20 }}>Areas of Expertise</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(doctor.expertise || []).map(e => <span key={e} className="pill pill-neutral">{e}</span>)}
            </div>
          </div>

          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: 14 }}>Weekly Working Hours</h4>
            <div className="grid grid-2" style={{ gap: 10 }}>
              {DAYS.map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--mint-bg)', borderRadius: 8, fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ color: doctor.working_hours?.[key] === 'Unavailable' ? 'var(--danger)' : 'var(--muted)' }}>{doctor.working_hours?.[key] || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: 14 }}>Patient Reviews</h4>
            {(doctor.reviews || []).length === 0 && <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>}
            {(doctor.reviews || []).map(r => (
              <div key={r.id} style={{ borderTop: '1px solid var(--line)', padding: '14px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{r.patient_name}</strong>
                  <span className="pill pill-warn">★ {r.rating}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: '4px 0 0' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, position: 'sticky', top: 90 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Consultation Fee</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--teal-deep)', marginBottom: 14 }}>₹{doctor.fee}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4 }}>Hospital</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{doctor.hospital_name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 18 }}>{doctor.city}, {doctor.state}</div>

          {doctor.online_booking_enabled ? (
            <button className="btn btn-primary btn-block" onClick={() => navigate(`/book/${doctor.id}`)}>Book Appointment</button>
          ) : (
            <button className="btn btn-amber btn-block" onClick={() => navigate(`/book/${doctor.id}?callback=1`)}>Request Callback</button>
          )}
          <Link to={`/hospitals/${doctor.hospital_id}`} className="btn btn-outline btn-block" style={{ marginTop: 10 }}>View Hospital</Link>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import type { Hospital } from '../types';

const DAY_LABELS: Record<string, string> = { mon_sat: 'Mon – Sat', sun: 'Sunday' };

export default function HospitalProfile() {
  const { id } = useParams();
  const [hospital, setHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    setHospital(null);
    api.get(`/hospitals/${id}`).then(r => setHospital(r.data));
  }, [id]);

  if (!hospital) return <div className="container section"><div className="skeleton" style={{ height: 320 }} /></div>;

  const mapQuery = encodeURIComponent(`${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.pincode}`);

  return (
    <div className="container section">
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>{hospital.name}</h2>
            <div style={{ color: 'var(--muted)' }}>{hospital.address}, {hospital.city}, {hospital.state} {hospital.pincode}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span className="pill pill-warn">★ {hospital.rating}</span>
              {hospital.online_booking_enabled ? <span className="pill pill-ok">Online booking available</span> : <span className="pill pill-danger">Online booking unavailable — request callback</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📞 {hospital.phone}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>🚨 Emergency: {hospital.emergency_phone}</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: 12 }}>Departments</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {(hospital.departments || []).map(d => <span key={d} className="pill pill-neutral">{d}</span>)}
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: 12 }}>Facilities</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(hospital.facilities || []).map(f => <span key={f} className="pill pill-ok">{f}</span>)}
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: 14 }}>Doctors at this Hospital</h4>
            <div className="grid grid-2">
              {(hospital.doctors || []).map(doc => (
                <Link key={doc.id} to={`/doctors/${doc.id}`} className="card" style={{ padding: 16, display: 'block' }}>
                  <div style={{ fontWeight: 700, color: 'var(--teal-deep)' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{doc.specialty} · {doc.experience_years}+ yrs</div>
                  <span className="pill pill-warn" style={{ marginTop: 6 }}>★ {doc.rating}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: 14 }}>Patient Reviews</h4>
            {(hospital.reviews || []).length === 0 && <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>}
            {(hospital.reviews || []).map(r => (
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

        <div>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Working Hours</h4>
            {Object.entries(hospital.working_hours || {}).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0' }}>
                <span>{DAY_LABELS[k] || k}</span><span style={{ color: 'var(--muted)' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px' }}><strong>📍 Hospital Location</strong></div>
            <iframe
              title="hospital-location"
              width="100%" height="220" style={{ border: 0, display: 'block' }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
            />
          </div>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">Get Directions</a>
        </div>
      </div>
    </div>
  );
}

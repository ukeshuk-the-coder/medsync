import { Link } from 'react-router-dom';
import type { Doctor } from '../types';

function initials(name: string) {
  return name.replace('Dr. ', '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--teal-soft)', color: 'var(--teal-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'Fraunces, serif', fontSize: '1.1rem', flexShrink: 0
        }}>{initials(doctor.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--teal-deep)' }}>{doctor.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{doctor.specialty}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{doctor.qualification}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="pill pill-neutral">{doctor.experience_years}+ yrs exp</span>
        <span className="pill pill-warn">★ {doctor.rating}</span>
        {doctor.online_booking_enabled ? <span className="pill pill-ok">Online booking</span> : <span className="pill pill-danger">Callback only</span>}
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
        📍 {doctor.hospital_name}, {doctor.city}, {doctor.state}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontWeight: 700, color: 'var(--teal-deep)' }}>₹{doctor.fee}</span>
        <Link to={`/doctors/${doctor.id}`} className="btn btn-primary btn-sm">View Profile</Link>
      </div>
    </div>
  );
}

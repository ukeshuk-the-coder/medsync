import { Link } from 'react-router-dom';
import type { Hospital } from '../types';

export default function HospitalCard({ hospital }: { hospital: Hospital }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--teal-deep)' }}>{hospital.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{hospital.city}, {hospital.state}</div>
        </div>
        <span className="pill pill-warn">★ {hospital.rating}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{hospital.address}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(hospital.facilities || []).slice(0, 3).map(f => <span key={f} className="pill pill-neutral">{f}</span>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        {hospital.online_booking_enabled ? <span className="pill pill-ok">Online booking</span> : <span className="pill pill-danger">Callback only</span>}
        <Link to={`/hospitals/${hospital.id}`} className="btn btn-outline btn-sm">View Hospital</Link>
      </div>
    </div>
  );
}

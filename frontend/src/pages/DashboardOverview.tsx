import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import type { Appointment } from '../types';

const STATUS_PILL: Record<string, string> = { Confirmed: 'pill-ok', Pending: 'pill-warn', Completed: 'pill-neutral', Cancelled: 'pill-danger' };

export default function DashboardOverview() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);

  useEffect(() => { api.get('/appointments/mine').then(r => setAppointments(r.data)); }, []);

  if (appointments === null) return <div className="skeleton" style={{ height: 200 }} />;

  const upcoming = appointments.filter(a => a.status === 'Confirmed');

  return (
    <div>
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Total Appointments" value={appointments.length} />
        <StatCard label="Completed" value={appointments.filter(a => a.status === 'Completed').length} />
        <StatCard label="Cancelled" value={appointments.filter(a => a.status === 'Cancelled').length} />
      </div>

      <h4 style={{ marginBottom: 16 }}>Upcoming Appointments</h4>
      {upcoming.length === 0 && (
        <div className="empty-state card">
          <h3>No upcoming appointments</h3>
          <p>Book your next appointment to see it here.</p>
          <Link to="/doctors" className="btn btn-primary" style={{ marginTop: 12 }}>Find a Doctor</Link>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {upcoming.map(a => (
          <div key={a.id} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong>{a.doctor_name}</strong> <span style={{ color: 'var(--muted)' }}>· {a.specialty}</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{a.hospital_name} · {a.date} at {a.time}</div>
            </div>
            <span className={`pill ${STATUS_PILL[a.status]}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--teal-deep)', fontFamily: 'Fraunces, serif' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

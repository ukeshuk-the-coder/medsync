import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../Toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const toast = useToast();

  const load = () => {
    api.get('/admin/stats').then(r => setStats(r.data));
    api.get('/admin/hospitals').then(r => setHospitals(r.data));
    api.get('/admin/callbacks').then(r => setCallbacks(r.data));
  };
  useEffect(() => { load(); }, []);

  const toggleBooking = async (id: number) => {
    await api.post(`/admin/hospitals/${id}/toggle-booking`);
    toast('Hospital booking setting updated.', 'success');
    load();
  };
  const completeCallback = async (id: number) => {
    await api.post(`/admin/callbacks/${id}/complete`);
    toast('Marked as completed.', 'success');
    load();
  };

  return (
    <div className="container section">
      <h2 style={{ marginBottom: 4 }}>Admin Dashboard</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>System-wide overview of MedSync operations.</p>

      {stats && (
        <div className="grid grid-4" style={{ marginBottom: 36 }}>
          <Stat label="Total Patients" value={stats.totalPatients} />
          <Stat label="Total Hospitals" value={stats.totalHospitals} />
          <Stat label="Total Doctors" value={stats.totalDoctors} />
          <Stat label="Today's Appointments" value={stats.todaysAppointments} />
          <Stat label="Pending Callbacks" value={stats.pendingCallbacks} />
          <Stat label="Online Booking Hospitals" value={stats.onlineBookingsEnabled} />
          <Stat label="Booking Conflicts Logged" value={stats.bookingConflicts} />
          <Stat label="Total Appointments" value={stats.totalAppointments} />
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Hospitals — Online Booking Control</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hospitals.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{h.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{h.city}, {h.state}</div>
                </div>
                <button className={`btn btn-sm ${h.online_booking_enabled ? 'btn-outline' : 'btn-amber'}`} onClick={() => toggleBooking(h.id)}>
                  {h.online_booking_enabled ? 'Booking: ON' : 'Booking: OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16 }}>Callback Requests</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {callbacks.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No callback requests yet.</p>}
            {callbacks.map(c => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.88rem' }}>{c.name}</strong>
                  <span className={`pill ${c.status === 'Pending' ? 'pill-warn' : 'pill-ok'}`}>{c.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.hospital_name} · {c.mobile}</div>
                {c.status === 'Pending' && <button className="btn btn-sm btn-outline" style={{ marginTop: 6 }} onClick={() => completeCallback(c.id)}>Mark Completed</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--teal-deep)', fontFamily: 'Fraunces, serif' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../Toast';
import type { Appointment } from '../types';

const STATUS_PILL: Record<string, string> = { Confirmed: 'pill-ok', Pending: 'pill-warn', Completed: 'pill-neutral', Cancelled: 'pill-danger' };

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const toast = useToast();

  const load = () => api.get('/appointments/mine').then(r => setAppointments(r.data));
  useEffect(() => { load(); }, []);

  const cancel = async (id: number) => {
    try {
      await api.post(`/appointments/${id}/cancel`);
      toast('Appointment cancelled.', 'success');
      load();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Could not cancel.', 'error');
    }
  };

  if (appointments === null) return <div className="skeleton" style={{ height: 200 }} />;

  if (appointments.length === 0) {
    return <div className="empty-state card"><h3>No appointments yet</h3><p>Your booking history will appear here.</p></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {appointments.map(a => (
        <div key={a.id} className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong>{a.doctor_name}</strong> <span style={{ color: 'var(--muted)' }}>· {a.specialty}</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{a.hospital_name}, {a.city}</div>
              <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--amber-deep)', marginTop: 4 }}>{a.appointment_code}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`pill ${STATUS_PILL[a.status]}`}>{a.status}</span>
              <div style={{ fontSize: '0.85rem', marginTop: 6 }}>{a.date} · {a.time}</div>
            </div>
          </div>
          {a.status === 'Confirmed' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={() => cancel(a.id)}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

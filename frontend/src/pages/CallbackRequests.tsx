import { useEffect, useState } from 'react';
import api from '../api';
import type { CallbackRequest } from '../types';

export default function CallbackRequests() {
  const [requests, setRequests] = useState<CallbackRequest[] | null>(null);
  useEffect(() => { api.get('/callbacks/mine').then(r => setRequests(r.data)); }, []);

  if (requests === null) return <div className="skeleton" style={{ height: 160 }} />;
  if (requests.length === 0) return <div className="empty-state card"><h3>No callback requests</h3><p>When a hospital doesn't support online booking, your callback requests appear here.</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {requests.map(r => (
        <div key={r.id} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>{r.hospital_name}</strong> {r.doctor_name && <span style={{ color: 'var(--muted)' }}>· {r.doctor_name}</span>}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Preferred time: {r.preferred_time}</div>
          </div>
          <span className={`pill ${r.status === 'Pending' ? 'pill-warn' : 'pill-ok'}`}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

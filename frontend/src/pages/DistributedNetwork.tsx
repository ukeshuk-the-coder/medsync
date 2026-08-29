import { useEffect, useState } from 'react';
import api from '../api';

export default function DistributedNetwork() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const load = () => {
    api.get('/admin/distributed/nodes').then(r => setNodes(r.data));
    api.get('/admin/distributed/events').then(r => setEvents(r.data));
  };
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, []);

  const runSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.post('/appointments/simulate-conflict');
      // Reveal the log with a slight stagger for dramatic effect
      setSimResult({ ...res.data, revealed: 0 });
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setSimResult((prev: any) => prev && ({ ...prev, revealed: i }));
        if (i >= res.data.log.length) clearInterval(iv);
      }, 500);
    } finally {
      setSimulating(false);
      load();
    }
  };

  return (
    <div className="container section">
      <div className="eyebrow" style={{ marginBottom: 6 }}>System architecture demo</div>
      <h2 style={{ marginBottom: 4 }}>MedSync Distributed Network</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 32, maxWidth: 640 }}>
        Every hospital is modeled as an independent node maintaining its own doctors, schedules and appointments.
        A coordination service synchronizes booking events across nodes using Lamport logical clocks.
      </p>

      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        {nodes.map(n => (
          <div key={n.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: '0.92rem' }}>{n.node_name}</strong>
              <span className="pill pill-ok">🟢 {n.status}</span>
            </div>
            <Row label="Lamport Clock" value={n.lamport_clock} mono />
            <Row label="Hospitals" value={n.hospitalCount} />
            <Row label="Active Appointments" value={n.activeAppointments} />
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 8 }}>Last sync: {new Date(n.last_sync).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 32, textAlign: 'center', background: 'var(--teal-deep)' }}>
        <h3 style={{ color: 'white', marginBottom: 6 }}>Simulate Concurrent Booking</h3>
        <p style={{ color: '#B7D9D4', marginBottom: 20, maxWidth: 560, marginInline: 'auto' }}>
          Two patients on two different hospital nodes attempt to book the same doctor's slot at nearly the same instant.
          Watch the Lamport clock resolve the conflict deterministically.
        </p>
        <button className="btn btn-amber" onClick={runSimulation} disabled={simulating}>
          {simulating ? 'Simulating…' : '⚡ Simulate Concurrent Booking'}
        </button>
      </div>

      {simResult && (
        <div className="card" style={{ padding: 28, marginBottom: 32 }}>
          <h4 style={{ marginBottom: 4 }}>{simResult.doctor.name} · {simResult.doctor.specialty} · {simResult.doctor.hospital}</h4>
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 20 }}>
            Contested slot: {simResult.contestedSlot.date} at {simResult.contestedSlot.time}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {simResult.log.slice(0, simResult.revealed).map((entry: any, i: number) => (
              <div key={i} className="mono" style={{
                fontSize: '0.85rem', padding: '10px 14px', borderRadius: 8, background: 'var(--mint-bg)',
                display: 'flex', justifyContent: 'space-between', animation: 'slidein 0.25s ease'
              }}>
                <span><strong style={{ color: 'var(--teal-deep)' }}>{entry.node}</strong> → {entry.event}{entry.patient ? ` · ${entry.patient}` : ''}</span>
                {entry.clock !== undefined && <span style={{ color: 'var(--amber-deep)' }}>clock={entry.clock}</span>}
              </div>
            ))}
          </div>

          {simResult.revealed >= simResult.log.length && (
            <div className="grid grid-2">
              <div style={{ padding: 16, borderRadius: 10, background: '#E4F5EC' }}>
                <span className="pill pill-ok">✓ {simResult.winner} — CONFIRMED</span>
              </div>
              <div style={{ padding: 16, borderRadius: 10, background: '#FCEAE7' }}>
                <span className="pill pill-danger">✕ {simResult.loser} — CONFLICT</span>
                <div style={{ fontSize: '0.8rem', marginTop: 8, color: 'var(--muted)' }}>
                  Alternative slots offered: {simResult.alternativeSlotsForLoser.map((s: any) => `${s.date} ${s.time}`).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <h4 style={{ marginBottom: 16 }}>Recent Booking Events</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No events logged yet — book an appointment or run the simulation above.</p>}
          {events.map(e => (
            <div key={e.id} className="mono" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span>Node #{e.node_id} → {e.event_type}{e.patient_label ? ` · ${e.patient_label}` : ''}</span>
              <span style={{ color: 'var(--amber-deep)' }}>clock={e.lamport_clock}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '3px 0' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

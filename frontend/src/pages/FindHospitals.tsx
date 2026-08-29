import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import HospitalCard from '../components/HospitalCard';
import type { Hospital } from '../types';

export default function FindHospitals() {
  const [params, setParams] = useSearchParams();
  const [hospitals, setHospitals] = useState<Hospital[] | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const state = params.get('state') || '';
  const city = params.get('city') || '';
  const q = params.get('q') || '';

  useEffect(() => { api.get('/meta/states').then(r => setStates(r.data)); }, []);
  useEffect(() => {
    if (state) api.get(`/meta/cities?state=${encodeURIComponent(state)}`).then(r => setCities(r.data));
    else setCities([]);
  }, [state]);
  useEffect(() => {
    setHospitals(null);
    api.get('/hospitals', { params: Object.fromEntries(params) }).then(r => setHospitals(r.data));
  }, [params]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'state') next.delete('city');
    setParams(next);
  };

  return (
    <div className="container section">
      <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Find Hospitals</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Browse hospitals across India, compare facilities, and check online booking status.</p>

      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <select value={state} onChange={e => update('state', e.target.value)}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={city} onChange={e => update('city', e.target.value)} disabled={!cities.length}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Search hospital name" defaultValue={q} onBlur={e => update('q', e.target.value)} />
      </div>

      {hospitals === null && <div className="grid grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}</div>}
      {hospitals && hospitals.length === 0 && (
        <div className="empty-state card"><h3>No hospitals found</h3><p>Try a different state or city.</p></div>
      )}
      {hospitals && hospitals.length > 0 && (
        <div className="grid grid-3">{hospitals.map(h => <HospitalCard key={h.id} hospital={h} />)}</div>
      )}
    </div>
  );
}

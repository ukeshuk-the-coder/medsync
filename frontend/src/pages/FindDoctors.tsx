import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import DoctorCard from '../components/DoctorCard';
import type { Doctor } from '../types';

export default function FindDoctors() {
  const [params, setParams] = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const state = params.get('state') || '';
  const city = params.get('city') || '';
  const specialty = params.get('specialty') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'rating';
  const minExperience = params.get('minExperience') || '';
  const gender = params.get('gender') || '';

  useEffect(() => {
    api.get('/meta/states').then(r => setStates(r.data));
    api.get('/meta/specialties').then(r => setSpecialties(r.data));
  }, []);

  useEffect(() => {
    if (state) api.get(`/meta/cities?state=${encodeURIComponent(state)}`).then(r => setCities(r.data));
    else setCities([]);
  }, [state]);

  useEffect(() => {
    setDoctors(null);
    api.get('/doctors', { params: Object.fromEntries(params) }).then(r => setDoctors(r.data));
  }, [params]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'state') next.delete('city');
    setParams(next);
  };

  return (
    <div className="container section" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>
      <aside className="card" style={{ padding: 20, position: 'sticky', top: 90 }}>
        <h4 style={{ fontSize: '1rem', marginBottom: 16 }}>Filters</h4>
        <div className="field">
          <label>Search</label>
          <input placeholder="Doctor or hospital name" defaultValue={q} onBlur={e => update('q', e.target.value)} />
        </div>
        <div className="field">
          <label>State</label>
          <select value={state} onChange={e => update('state', e.target.value)}>
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>City</label>
          <select value={city} onChange={e => update('city', e.target.value)} disabled={!cities.length}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Specialty</label>
          <select value={specialty} onChange={e => update('specialty', e.target.value)}>
            <option value="">All Specialties</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Min. Experience</label>
          <select value={minExperience} onChange={e => update('minExperience', e.target.value)}>
            <option value="">Any</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
            <option value="15">15+ years</option>
          </select>
        </div>
        <div className="field">
          <label>Gender</label>
          <select value={gender} onChange={e => update('gender', e.target.value)}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="field">
          <label>Sort By</label>
          <select value={sort} onChange={e => update('sort', e.target.value)}>
            <option value="rating">Rating</option>
            <option value="experience">Experience</option>
            <option value="fee">Consultation Fee</option>
          </select>
        </div>
        <button className="btn btn-outline btn-block btn-sm" onClick={() => setParams({})}>Clear Filters</button>
      </aside>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.6rem' }}>Find Doctors</h2>
          {doctors && <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{doctors.length} doctors found</span>}
        </div>

        {doctors === null && (
          <div className="grid grid-2">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>
        )}

        {doctors && doctors.length === 0 && (
          <div className="empty-state card">
            <h3>No doctors match these filters</h3>
            <p>Try widening your search — a different city, specialty, or clearing a filter.</p>
          </div>
        )}

        {doctors && doctors.length > 0 && (
          <div className="grid grid-2">
            {doctors.map(d => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}

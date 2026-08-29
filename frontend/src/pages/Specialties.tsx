import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ICONS: Record<string, string> = {
  Cardiology: '♡', Neurology: '⚡', Orthopedics: '🦴', Dermatology: '✦', Pediatrics: '☺',
  Gynecology: '◐', 'General Medicine': '✚', ENT: '👂', Ophthalmology: '◉', Oncology: '✧',
  Psychiatry: '☾', Pulmonology: '🫁', Gastroenterology: '⬢', Urology: '⬡', Nephrology: '◈',
  Endocrinology: '⬣', Dentistry: '⛁',
};

export default function Specialties() {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const navigate = useNavigate();
  useEffect(() => { api.get('/meta/specialties').then(r => setSpecialties(r.data)); }, []);

  return (
    <div className="container section">
      <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Every field of care</div>
      <h2 style={{ textAlign: 'center', marginBottom: 40 }}>Browse by Specialty</h2>
      <div className="grid grid-4">
        {specialties.map(s => (
          <div key={s} className="card" style={{ padding: 24, cursor: 'pointer', textAlign: 'center' }}
            onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(s)}`)}>
            <div style={{ fontSize: '1.8rem', color: 'var(--amber-deep)', marginBottom: 10 }}>{ICONS[s] || '✚'}</div>
            <div style={{ fontWeight: 700 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="container section" style={{ maxWidth: 780 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Our mission</div>
      <h1 style={{ marginBottom: 20 }}>About Medsync</h1>
      <p style={{ color: 'var(--muted)', fontSize: '1.02rem', marginBottom: 20 }}>
        Patients across India often struggle to find the right doctor, check real availability, compare hospitals,
        and book an appointment — usually across several disconnected hospital websites and phone calls. Medsync
        brings all of that into one platform: discover doctors and hospitals anywhere in India, check live
        availability, book instantly, or request a callback when online booking isn't supported.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '1.02rem', marginBottom: 32 }}>
        Under the hood, Medsync treats every hospital as an independent node in a distributed system. A coordination
        service uses Lamport logical clocks to order booking events deterministically, so two patients racing for the
        same slot are resolved fairly — and the patient who doesn't get the slot is immediately offered alternatives.
      </p>
      <div className="card" style={{ padding: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Academic project</div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>MedSync — Distributed Healthcare Appointment &amp; Hospital Coordination System</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
          Made by <strong>Ukesh Kumar R</strong>, RMK College of Engineering and Technology.
          All hospital and doctor data shown is fictional demo data created for this academic project.
        </p>
      </div>
    </div>
  );
}

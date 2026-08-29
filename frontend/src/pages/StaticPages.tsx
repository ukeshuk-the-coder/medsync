export function Privacy() {
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 20 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--muted)' }}>
        Medsync is an academic demonstration project. Patient information such as name, contact details and
        appointment reasons is stored only to power the booking demo and is never shared publicly or with third
        parties. Passwords are hashed before storage. This is a student project built for evaluation at RMK College
        of Engineering and Technology and is not intended for handling real patient data.
      </p>
    </div>
  );
}

export function Terms() {
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 20 }}>Terms of Use</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Medsync is an appointment discovery and coordination platform. It does not replace professional medical
        advice, diagnosis, or emergency medical care. For emergencies, contact your nearest emergency department
        directly.
      </p>
      <p style={{ color: 'var(--muted)' }}>
        All hospital, doctor, and appointment data in this demo is fictional and created for academic purposes only.
        No real bookings are made with any hospital.
      </p>
    </div>
  );
}

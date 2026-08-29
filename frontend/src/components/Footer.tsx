import type React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--teal-deep)', color: '#CFE6E3', marginTop: 80 }}>
      <div className="container" style={{ padding: '56px 24px 28px' }}>
        <div className="grid grid-4" style={{ marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.4rem', color: 'white', marginBottom: 6 }}>MedSync</div>
            <div className="eyebrow" style={{ color: '#8FC2BC' }}>Distributed Healthcare Appointment &amp; Hospital Coordination System</div>
            <p style={{ color: '#9DC8C2', marginTop: 14, fontSize: '0.88rem' }}>"Find the Right Doctor. Book the Right Time. Anywhere in India."</p>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontFamily: 'Inter', fontWeight: 700 }}>Platform</h4>
            <FooterLink to="/doctors">Find Doctors</FooterLink>
            <FooterLink to="/hospitals">Find Hospitals</FooterLink>
            <FooterLink to="/specialties">Specialties</FooterLink>
            <FooterLink to="/network">Distributed Network</FooterLink>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontFamily: 'Inter', fontWeight: 700 }}>Company</h4>
            <FooterLink to="/about">About Medsync</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
          </div>
          <div>
            <h4 style={{ color: 'white', fontSize: '0.95rem', fontFamily: 'Inter', fontWeight: 700 }}>Emergency</h4>
            <p style={{ fontSize: '0.85rem', color: '#9DC8C2' }}>
              Medsync is an appointment discovery and coordination platform. It does not replace professional medical advice or emergency medical care.
              For emergencies, contact your nearest emergency department or dial 108.
            </p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1E5654', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: '0.82rem', color: '#7FB0AA' }}>
          <span>© {new Date().getFullYear()} MedSync — Demo project for academic evaluation. All hospital/doctor data is fictional.</span>
          <span className="mono">MADE BY UKESH KUMAR R · RMK COLLEGE OF ENGINEERING AND TECHNOLOGY</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} style={{ display: 'block', color: '#B7D9D4', fontSize: '0.87rem', margin: '9px 0' }}>{children}</Link>;
}

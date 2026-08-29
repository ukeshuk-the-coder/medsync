import type React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="14" fill="var(--teal-deep)" />
            <path d="M4 15h5l2-6 4 12 2-9 2 3h7" stroke="var(--amber)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.35rem', color: 'var(--teal-deep)' }}>MedSync</span>
        </Link>

        <nav className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <Link to="/doctors" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '0.94rem' }}>Find Doctors</Link>
          <Link to="/hospitals" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '0.94rem' }}>Hospitals</Link>
          <Link to="/specialties" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '0.94rem' }}>Specialties</Link>
          <Link to="/network" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '0.94rem' }}>Network</Link>
          <Link to="/about" style={{ color: 'var(--ink)', fontWeight: 500, fontSize: '0.94rem' }}>About</Link>
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          {user ? (
            <>
              <button className="btn-outline btn-sm" onClick={() => setOpen(o => !o)}>{user.name.split(' ')[0]} ▾</button>
              {open && (
                <div className="card" style={{ position: 'absolute', top: 46, right: 0, width: 200, padding: 8 }}>
                  {user.role === 'admin' ? (
                    <Link to="/admin" onClick={() => setOpen(false)} style={menuItem}>Admin Dashboard</Link>
                  ) : (
                    <>
                      <Link to="/dashboard" onClick={() => setOpen(false)} style={menuItem}>Dashboard</Link>
                      <Link to="/dashboard/appointments" onClick={() => setOpen(false)} style={menuItem}>Appointments</Link>
                      <Link to="/dashboard/callbacks" onClick={() => setOpen(false)} style={menuItem}>Callback Requests</Link>
                      <Link to="/dashboard/profile" onClick={() => setOpen(false)} style={menuItem}>Profile</Link>
                    </>
                  )}
                  <button className="btn-danger btn-sm btn-block" style={{ marginTop: 6 }} onClick={() => { logout(); setOpen(false); navigate('/'); }}>Logout</button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const menuItem: React.CSSProperties = { display: 'block', padding: '9px 10px', borderRadius: 8, fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 500 };

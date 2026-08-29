import type React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  return (
    <div className="container section">
      <h2 style={{ marginBottom: 4 }}>Hi, {user?.name.split(' ')[0]} 👋</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Manage your appointments and requests.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <Tab to="/dashboard">Overview</Tab>
        <Tab to="/dashboard/appointments">Appointments</Tab>
        <Tab to="/dashboard/callbacks">Callback Requests</Tab>
        <Tab to="/dashboard/profile">Profile</Tab>
      </div>
      <Outlet />
    </div>
  );
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} end={to === '/dashboard'}
      className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}>
      {children}
    </NavLink>
  );
}

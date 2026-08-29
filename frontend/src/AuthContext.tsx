import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import api from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; mobile: string; state: string; city: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('medsync_user');
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token: string, u: User) => {
    localStorage.setItem('medsync_token', token);
    localStorage.setItem('medsync_user', JSON.stringify(u));
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; mobile: string; state: string; city: string }) => {
    const res = await api.post('/auth/register', data);
    persist(res.data.token, res.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medsync_token');
    localStorage.removeItem('medsync_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

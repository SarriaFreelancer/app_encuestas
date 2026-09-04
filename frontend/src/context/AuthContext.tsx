"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { fetchApi } from '@/lib/api';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_DAYS } from '@/lib/session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usuario: string, contrasena: string) => Promise<void>;
  logout: (reason?: 'inactivity' | 'manual') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Lee el token priorizando localStorage con fallback a cookie */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || Cookies.get(SESSION_COOKIE_NAME) || null;
}

/** Persiste el token en localStorage y en cookie */
function setStoredToken(token: string) {
  localStorage.setItem('token', token);
  Cookies.set(SESSION_COOKIE_NAME, token, {
    expires: SESSION_COOKIE_DAYS,
    sameSite: 'Strict',
    secure: window.location.protocol === 'https:',
  });
}

/** Elimina el token de localStorage y de la cookie */
function clearStoredToken() {
  localStorage.removeItem('token');
  Cookies.remove(SESSION_COOKIE_NAME);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const token = getStoredToken();
      if (token) {
        try {
          const userData = await fetchApi('/auth/me');
          setUser(userData);
        } catch {
          clearStoredToken();
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (usuario: string, contrasena: string) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, contrasena }),
    });
    setStoredToken(data.access_token);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = useCallback((reason?: 'inactivity' | 'manual') => {
    clearStoredToken();
    setUser(null);
    if (reason === 'inactivity') {
      router.push('/login?motivo=inactividad');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

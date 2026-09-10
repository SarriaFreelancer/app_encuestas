"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { COOKIE_CONSENT_KEY } from '@/lib/session';

const COOKIE_CONSENT_COOKIE = 'encuestas_cookie_accepted';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo si el usuario nunca ha aceptado
    const localAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    const cookieAccepted = Cookies.get(COOKIE_CONSENT_COOKIE);
    if (!localAccepted && !cookieAccepted) {
      // Pequeño delay para no bloquear el render inicial
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    Cookies.set(COOKIE_CONSENT_COOKIE, 'accepted', {
      expires: 365,
      sameSite: 'Lax',
    });
    setVisible(false);
  };

  const handleDecline = () => {
    // Guardar rechazo solo en sesión (no cookie persistente)
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9990] p-4 animate-in slide-in-from-bottom-4 duration-300"
      role="region"
      aria-label="Aviso de cookies"
    >
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">

        {/* Ícono */}
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
          <Cookie size={20} />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white mb-0.5">
            Usamos cookies para proteger tu sesión
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esta plataforma utiliza cookies esenciales para mantener tu sesión activa de forma segura.
            No compartimos datos con terceros.{' '}
            <Link href="/privacidad" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-semibold transition-colors">
              Ver política de privacidad
            </Link>
          </p>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            aria-label="Rechazar cookies no esenciales"
          >
            <X size={13} />
            Solo esenciales
          </button>
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            aria-label="Aceptar todas las cookies"
          >
            <ShieldCheck size={13} />
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}

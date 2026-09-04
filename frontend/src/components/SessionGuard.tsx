"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { INACTIVITY_WARNING_MS, COUNTDOWN_SECONDS } from '@/lib/session';
import { Clock, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function SessionGuard() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Limpia todos los timers activos */
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current)  clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current)   clearTimeout(logoutTimerRef.current);
    if (countdownRef.current)     clearInterval(countdownRef.current);
  }, []);

  /** Reinicia el timer de inactividad desde cero */
  const resetTimer = useCallback(() => {
    if (!user) return;
    clearAllTimers();
    setShowWarning(false);
    setCountdown(COUNTDOWN_SECONDS);

    // Timer de advertencia (13 min)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(COUNTDOWN_SECONDS);

      // Contador regresivo visual
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Timer de logout automático (2 min después de la advertencia)
      logoutTimerRef.current = setTimeout(() => {
        logout('inactivity');
      }, COUNTDOWN_SECONDS * 1000);

    }, INACTIVITY_WARNING_MS);
  }, [user, clearAllTimers, logout]);

  /** Registra los eventos de actividad */
  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    resetTimer();

    const handleActivity = () => {
      // Solo reinicia si el modal NO está visible
      if (!showWarning) {
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, handleActivity)
      );
      clearAllTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** El usuario decide continuar → reiniciar todo */
  const handleContinue = () => {
    resetTimer();
  };

  /** El usuario decide cerrar sesión desde el modal */
  const handleLogout = () => {
    clearAllTimers();
    logout('manual');
  };

  // Formatear mm:ss
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Porcentaje para el anillo SVG
  const pct = countdown / COUNTDOWN_SECONDS;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const ringColor = countdown > 60 ? '#f59e0b' : '#ef4444';

  if (!showWarning) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Barra superior de color */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="p-8 text-center space-y-6">
          {/* Ícono de alerta */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
            <ShieldAlert size={28} />
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-1">
              Sesión por expirar
            </h2>
            <p className="text-sm text-slate-400">
              Por inactividad tu sesión se cerrará automáticamente en:
            </p>
          </div>

          {/* Contador regresivo con anillo SVG */}
          <div className="flex items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <svg width="104" height="104" className="-rotate-90">
                {/* Track */}
                <circle
                  cx="52" cy="52" r={radius}
                  fill="none"
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="52" cy="52" r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
              </svg>
              <span
                className="absolute text-2xl font-black tabular-nums"
                style={{ color: ringColor }}
              >
                {timeFormatted}
              </span>
            </div>
          </div>

          {/* Info adicional */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock size={13} />
            <span>Última actividad hace más de 13 minutos</span>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-bold transition-all cursor-pointer"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <RefreshCw size={15} />
              Sí, continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

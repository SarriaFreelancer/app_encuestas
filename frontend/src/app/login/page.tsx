"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { Lock, User as UserIcon, AlertCircle, Loader2, Clock, Eye, EyeOff, Sun, Moon } from 'lucide-react';

function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inactivityMsg, setInactivityMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('motivo') === 'inactividad') {
      setInactivityMsg(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInactivityMsg(false);

    const cleanUser = usuario.trim();
    const cleanPass = contrasena.trim();

    if (!cleanUser) {
      setError('Por favor ingresa tu nombre de usuario o correo electrónico.');
      return;
    }
    if (cleanUser.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (!cleanPass) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }
    if (cleanPass.length < 4) {
      setError('La contraseña debe contener al menos 4 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await login(cleanUser, cleanPass);
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas o usuario no autorizado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors flex items-center justify-center p-4 relative overflow-hidden ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Botón flotante para cambiar de tema (Modo Claro / Modo Oscuro) */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-3 rounded-2xl border shadow-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
        }`}
        title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
      >
        {theme === 'light' ? (
          <>
            <Moon size={16} className="text-indigo-600" />
            <span className="hidden sm:inline">Modo Oscuro</span>
          </>
        ) : (
          <>
            <Sun size={16} className="text-amber-400" />
            <span className="hidden sm:inline">Modo Claro</span>
          </>
        )}
      </button>

      {/* Decorativos de fondo */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl ${
        theme === 'light' ? 'bg-indigo-400/20' : 'bg-indigo-600/20'
      }`} />
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl ${
        theme === 'light' ? 'bg-purple-400/20' : 'bg-purple-600/20'
      }`} />

      <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative z-10 transition-colors ${
        theme === 'light'
          ? 'bg-white/90 border-slate-200 text-slate-900'
          : 'bg-slate-900/80 border-slate-800 text-white'
      }`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30 text-white font-black text-2xl">
            E
          </div>
          <h2 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Portal Privado
          </h2>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Aviso de cierre por inactividad */}
        {inactivityMsg && (
          <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3 text-amber-500 text-sm">
            <Clock size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Sesión cerrada por inactividad</p>
              <p className="text-xs opacity-90">Tu sesión se cerró automáticamente por seguridad. Ingresa de nuevo para continuar.</p>
            </div>
          </div>
        )}

        {/* Error de login */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Usuario o correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej. admin o admin@encuestas.com"
                className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl transition-all text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
                    : 'bg-slate-800/80 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-12 pr-12 py-3.5 border rounded-2xl transition-all text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
                    : 'bg-slate-800/80 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors cursor-pointer p-1 ${
                  theme === 'light' ? 'text-slate-400 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Validando...
              </>
            ) : (
              'INGRESAR'
            )}
          </button>
        </form>

        <div className={`mt-8 pt-6 border-t text-center space-y-2 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Conectado a Google Sheets API | Plataforma Inteligente
          </p>
          <Link
            href="/privacidad"
            className={`text-xs transition-colors underline underline-offset-2 block ${
              theme === 'light' ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            Política de privacidad y cookies
          </Link>
          <p className={`text-[11px] font-medium pt-2 border-t mt-2 ${
            theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800/60'
          }`}>
            Desarrollado por <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>SarriaTech Solutions S.A.S</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

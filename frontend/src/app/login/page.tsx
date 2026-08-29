"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="w-full max-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30 text-white font-black text-2xl">
            E
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Portal Privado</h2>
          <p className="text-sm text-slate-400 mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Usuario o correo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej. admin o admin@encuestas.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
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

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Conectado a Google Sheets API | Plataforma Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}

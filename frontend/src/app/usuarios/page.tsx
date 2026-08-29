"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { User } from '@/types';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchApi('/usuarios');
        setUsuarios(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">
            Usuarios autorizados procedentes de la hoja USUARIOS en Google Sheets (Credenciales nunca expuestas)
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Correo</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usuarios.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-white">{u.usuario}</td>
                    <td className="p-4">{u.nombre}</td>
                    <td className="p-4 text-slate-400">{u.correo}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        u.rol === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit ${
                        u.estado === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.estado === 'ACTIVO' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {u.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

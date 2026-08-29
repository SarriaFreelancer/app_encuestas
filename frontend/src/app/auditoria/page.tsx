"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { ShieldCheck, History, User, Clock, FileSpreadsheet } from 'lucide-react';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        const data = await fetchApi('/auditoria');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Registro de Auditoría y Trazabilidad</h1>
          <p className="text-slate-400 text-sm mt-1">
            Historial inmutable de importaciones, modificaciones de datos y actividades de usuarios
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-4"># ID</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Registro / Archivo Afectado</th>
                  <th className="p-4">Detalles de la Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-slate-500">#{log.id}</td>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <User size={16} className="text-indigo-400" />
                      {log.usuario}
                    </td>
                    <td className="p-4 text-slate-400 flex items-center gap-1.5">
                      <Clock size={14} />
                      {log.fecha}
                    </td>
                    <td className="p-4 font-semibold text-indigo-300">{log.registro_afectado}</td>
                    <td className="p-4 text-xs font-mono bg-slate-950/40 text-slate-400 rounded-lg max-w-md truncate">
                      {JSON.stringify(log.campos_modificados)}
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

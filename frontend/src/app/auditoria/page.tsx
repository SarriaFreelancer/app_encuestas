"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { ShieldCheck, History, User, Clock, FileSpreadsheet } from 'lucide-react';

export default function AuditoriaPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
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
    <ProtectedRoute requireSuperAdmin>
    <div className={`min-h-screen transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />

      <main className={`transition-all duration-300 p-4 sm:p-8 pt-16 md:pt-8 space-y-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className={`border-b pb-6 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <h1 className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Registro de Auditoría y Trazabilidad
          </h1>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Historial inmutable de importaciones, modificaciones de datos y actividades de usuarios
          </p>
        </div>

        <div className={`border rounded-3xl overflow-hidden shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              <thead className={`uppercase text-[11px] tracking-wider ${
                theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                <tr>
                  <th className="p-4"># ID</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Registro / Archivo Afectado</th>
                  <th className="p-4">Detalles de la Acción</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {logs.map((log) => (
                  <tr key={log.id} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                    <td className="p-4 font-bold text-slate-400">#{log.id}</td>
                    <td className={`p-4 font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      <User size={16} className="text-indigo-500" />
                      {log.usuario}
                    </td>
                    <td className={`p-4 flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Clock size={14} />
                      {log.fecha}
                    </td>
                    <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-300">{log.registro_afectado}</td>
                    <td className={`p-4 text-xs font-mono rounded-lg max-w-md truncate ${
                      theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-950/40 text-slate-400'
                    }`}>
                      {JSON.stringify(log.campos_modificados)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

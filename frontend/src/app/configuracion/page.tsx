"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { SurveyMetadata } from '@/types';
import { Sliders, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ConfiguracionPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const loadMeta = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/encuestas/metadatos');
      setMetadata(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const handleAddQuestion = async () => {
    setAddingQuestion(true);
    try {
      const res = await fetchApi('/encuestas/preguntas/nueva', { method: 'POST' });
      alert(`¡Columna ${res.columna} agregada exitosamente en Google Sheets!`);
      loadMeta();
    } catch (err: any) {
      alert('Error al agregar columna: ' + err.message);
    } finally {
      setAddingQuestion(false);
    }
  };

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
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Configuración de Campos
            </h1>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Metadatos, autodetección y gestión de numeración de preguntas
            </p>
          </div>

          <button
            onClick={handleAddQuestion}
            disabled={addingQuestion}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            <Plus size={18} />
            {addingQuestion ? 'Creando...' : `Agregar ${metadata?.siguiente_pregunta || 'Siguiente Pregunta'}`}
          </button>
        </div>

        {/* Info Box */}
        <div className={`border rounded-2xl p-4 flex items-center gap-3 text-sm ${
          theme === 'light' 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
        }`}>
          <ShieldCheck size={20} className="shrink-0 text-indigo-500" />
          <span>
            Numeración Consecutiva Automática Activa. La siguiente pregunta asignada será <strong>{metadata?.siguiente_pregunta}</strong>.
          </span>
        </div>

        {/* Tabla de Metadatos de Columnas */}
        <div className={`border rounded-2xl overflow-hidden shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className={`p-4 border-b font-bold text-sm ${
            theme === 'light' ? 'border-slate-200 text-slate-900 bg-slate-50' : 'border-slate-800 text-white bg-slate-800/40'
          }`}>
            Columnas Detectadas y Configuración de Atributos
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              <thead className={`uppercase text-[11px] tracking-wider ${
                theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'
              }`}>
                <tr>
                  <th className="p-4">Campo</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Es Pregunta</th>
                  <th className="p-4">Es Identificador</th>
                  <th className="p-4">Autocompletar</th>
                  <th className="p-4">Editable</th>
                  <th className="p-4">Obligatorio</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {metadata?.configuraciones.map((cfg, idx) => (
                  <tr key={idx} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                    <td className={`p-4 font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{cfg.campo}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        theme === 'light' 
                          ? 'bg-slate-100 border-slate-300 text-slate-700' 
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {cfg.tipo}
                      </span>
                    </td>
                    <td className="p-4">{cfg.es_pregunta ? <CheckCircle2 className="text-emerald-500" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.es_identificador ? <CheckCircle2 className="text-indigo-500" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.autocompletar ? <CheckCircle2 className="text-purple-500" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.editable ? <CheckCircle2 className="text-emerald-500" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.obligatorio ? <CheckCircle2 className="text-amber-500" size={18} /> : '-'}</td>
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

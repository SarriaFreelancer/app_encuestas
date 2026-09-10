"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { showErrorAlert } from '@/lib/alerts';
import { AIQueryResponse } from '@/types';
import { Bot, Send, Loader2, Database } from 'lucide-react';

export default function ConsultaIAPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<AIQueryResponse | null>(null);

  const ejemplos = [
    "¿Cuántos registros hay?",
    "¿Cuántas personas pertenecen a Cali?",
    "¿Cuál es la ciudad con más registros?",
    "¿Cuántas personas de Cali respondieron Sí en la pregunta 3?",
    "¿Qué porcentaje respondió Sí?"
  ];

  const handleQuery = async (queryText?: string) => {
    const q = queryText || pregunta;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const data = await fetchApi('/ai/consulta', {
        method: 'POST',
        body: JSON.stringify({ pregunta: q })
      });
      setResultado(data);
    } catch (err: any) {
      showErrorAlert('Error en consulta IA', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
    <div className={`min-h-screen transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />

      <main className={`transition-all duration-300 p-4 sm:p-8 pt-16 md:pt-8 space-y-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className={`border-b pb-6 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full text-xs font-semibold mb-3">
            <Bot size={14} /> Módulo Preparado para IA
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Consulta Inteligente
          </h1>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Realiza preguntas en lenguaje natural sobre la información de las encuestas
          </p>
        </div>

        {/* Ejemplos rápidos */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Sugerencias de consulta:
          </p>
          <div className="flex flex-wrap gap-2">
            {ejemplos.map((e, idx) => (
              <button
                key={idx}
                onClick={() => { setPregunta(e); handleQuery(e); }}
                className={`px-3.5 py-2 border rounded-xl text-xs transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className={`border rounded-3xl p-4 shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex items-center gap-3">
            <Bot className="text-indigo-500 ml-2" size={24} />
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Ej: ¿Cuántas personas de Cali respondieron Sí en la pregunta 5?"
              className={`flex-1 bg-transparent border-none placeholder:text-slate-400 focus:outline-none text-sm font-medium ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              CONSULTAR
            </button>
          </form>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
          }`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600/20 text-indigo-500 rounded-2xl border border-indigo-500/30 shrink-0">
                <Bot size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Respuesta IA</p>
                <div 
                  className={`text-base leading-relaxed ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}
                  dangerouslySetInnerHTML={{ __html: resultado.respuesta.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>
            </div>

            {/* Registros Encontrados / Evidencia */}
            {resultado.datos_resultado && resultado.datos_resultado.length > 0 && (
              <div className={`pt-6 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${
                  theme === 'light' ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  <Database size={16} className="text-indigo-500" />
                  Registros Relevantes ({resultado.datos_resultado.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    <thead className={`uppercase text-[10px] ${
                      theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/60 text-slate-400'
                    }`}>
                      <tr>
                        {Object.keys(resultado.datos_resultado[0]).filter(k => k !== '__row_index').map(k => (
                          <th key={k} className="p-3 whitespace-nowrap">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                      {resultado.datos_resultado.map((row, idx) => (
                        <tr key={idx} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                          {Object.keys(row).filter(k => k !== '__row_index').map(k => (
                            <td key={k} className="p-3 whitespace-nowrap">{row[k]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

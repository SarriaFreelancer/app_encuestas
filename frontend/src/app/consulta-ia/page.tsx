"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { AIQueryResponse } from '@/types';
import { Bot, Send, Sparkles, Loader2, Database } from 'lucide-react';

export default function ConsultaIAPage() {
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
      alert('Error en la consulta IA: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold mb-3">
            <Sparkles size={14} /> Módulo Preparado para IA
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Consulta Inteligente</h1>
          <p className="text-slate-400 text-sm mt-1">
            Realiza preguntas en lenguaje natural sobre la información de las encuestas
          </p>
        </div>

        {/* Ejemplos rápidos */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sugerencias de consulta:</p>
          <div className="flex flex-wrap gap-2">
            {ejemplos.map((e, idx) => (
              <button
                key={idx}
                onClick={() => { setPregunta(e); handleQuery(e); }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs transition-all"
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex items-center gap-3">
            <Bot className="text-indigo-400 ml-2" size={24} />
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Ej: ¿Cuántas personas de Cali respondieron Sí en la pregunta 5?"
              className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:outline-none text-sm font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              CONSULTAR
            </button>
          </form>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shrink-0">
                <Bot size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Respuesta IA</p>
                <div 
                  className="text-white text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: resultado.respuesta.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>
            </div>

            {/* Registros Encontrados / Evidencia */}
            {resultado.datos_resultado && resultado.datos_resultado.length > 0 && (
              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <Database size={16} className="text-indigo-400" />
                  Registros Relevantes ({resultado.datos_resultado.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                      <tr>
                        {Object.keys(resultado.datos_resultado[0]).filter(k => k !== '__row_index').map(k => (
                          <th key={k} className="p-3 whitespace-nowrap">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {resultado.datos_resultado.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
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
      </main>
    </div>
  );
}

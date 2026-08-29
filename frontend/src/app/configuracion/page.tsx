"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { Sliders, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ConfiguracionPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Configuración de Campos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Metadatos, autodetección y gestión de numeración de preguntas
            </p>
          </div>

          <button
            onClick={handleAddQuestion}
            disabled={addingQuestion}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Plus size={18} />
            {addingQuestion ? 'Creando...' : `Agregar ${metadata?.siguiente_pregunta || 'Siguiente Pregunta'}`}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3 text-indigo-300 text-sm">
          <ShieldCheck size={20} className="shrink-0" />
          <span>
            Numeración Consecutiva Automática Activa. La siguiente pregunta asignada será <strong>{metadata?.siguiente_pregunta}</strong>.
          </span>
        </div>

        {/* Tabla de Metadatos de Columnas */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-white text-sm">
            Columnas Detectadas y Configuración de Atributos
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] tracking-wider">
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
              <tbody className="divide-y divide-slate-800/60">
                {metadata?.configuraciones.map((cfg, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-white">{cfg.campo}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {cfg.tipo}
                      </span>
                    </td>
                    <td className="p-4">{cfg.es_pregunta ? <CheckCircle2 className="text-emerald-400" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.es_identificador ? <CheckCircle2 className="text-indigo-400" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.autocompletar ? <CheckCircle2 className="text-purple-400" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.editable ? <CheckCircle2 className="text-emerald-400" size={18} /> : '-'}</td>
                    <td className="p-4">{cfg.obligatorio ? <CheckCircle2 className="text-amber-400" size={18} /> : '-'}</td>
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

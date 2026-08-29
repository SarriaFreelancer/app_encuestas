"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function ImportarEncuestaPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInspect = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/importacion/inspeccionar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error al inspeccionar Excel');

      setAnalysis(data);
      setStep(2);
    } catch (err: any) {
      alert('Error en la inspección del Excel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/importacion/procesar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error al procesar la importación');

      setResult(data);
      setStep(3);
    } catch (err: any) {
      alert('Error en la importación: ' + err.message);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Asistente de Importación de Excel</h1>
          <p className="text-slate-400 text-sm mt-1">
            Carga de archivos .xlsx / .xls con inspección automática, profiling de vacíos y autodetección de tipos
          </p>
        </div>

        {/* Pasos */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4 text-sm font-bold">
          <span className={`px-4 py-2 rounded-xl ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Paso 1: Seleccionar Archivo
          </span>
          <ArrowRight size={16} className="text-slate-600" />
          <span className={`px-4 py-2 rounded-xl ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Paso 2: Vista Previa y Profiling
          </span>
          <ArrowRight size={16} className="text-slate-600" />
          <span className={`px-4 py-2 rounded-xl ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Paso 3: Resultado
          </span>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 text-center shadow-2xl">
            <div className="w-20 h-20 bg-indigo-600/10 text-indigo-400 rounded-3xl border border-indigo-500/20 flex items-center justify-center mx-auto">
              <FileSpreadsheet size={40} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Selecciona tu archivo de encuesta (.xlsx o .xls)</h2>
              <p className="text-slate-400 text-xs mt-1">El sistema autodetectará las columnas y estructurará los datos automáticamente</p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="inline-flex items-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl border border-slate-700 cursor-pointer transition-all text-sm"
            >
              <Upload size={18} />
              {file ? file.name : 'Buscar archivo Excel...'}
            </label>

            {file && (
              <div className="pt-4">
                <button
                  onClick={handleInspect}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  INSPECTAR ESTRUCTURA
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">Hoja Analizada</p>
                <h3 className="text-xl font-bold text-white mt-1">{analysis.hoja_analizada}</h3>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">Total Registros</p>
                <h3 className="text-2xl font-black text-indigo-400 mt-1">{analysis.total_registros}</h3>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400 uppercase">Total Columnas</p>
                <h3 className="text-2xl font-black text-purple-400 mt-1">{analysis.total_columnas}</h3>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Profilin de Columnas y Tipos Detectados</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase sticky top-0">
                    <tr>
                      <th className="p-3">Columna</th>
                      <th className="p-3">Tipo Detectado</th>
                      <th className="p-3">Vacíos</th>
                      <th className="p-3">Valores Únicos</th>
                      <th className="p-3">Ejemplos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {analysis.columnas.map((col: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{col.columna}</td>
                        <td className="p-3 font-semibold text-indigo-300">{col.tipo_detectado}</td>
                        <td className="p-3 font-semibold text-rose-400">{col.vacios} ({col.porcentaje_vacios}%)</td>
                        <td className="p-3">{col.valores_unicos}</td>
                        <td className="p-3 text-slate-400 truncate max-w-xs">{col.ejemplos.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-sm"
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  CONFIRMAR E IMPORTAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && result && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-6 text-center shadow-2xl">
            <div className="w-20 h-20 bg-emerald-600/10 text-emerald-400 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Importación Completada</h2>
              <p className="text-slate-400 text-sm mt-1">{result.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div>
                <span className="text-xs text-slate-400 block">Procesados:</span>
                <span className="text-lg font-bold text-white">{result.registros_procesados}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Insertados:</span>
                <span className="text-lg font-bold text-emerald-400">{result.registros_insertados}</span>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
            >
              IR AL DASHBOARD
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

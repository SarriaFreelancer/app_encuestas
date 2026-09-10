"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function ImportarEncuestaPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

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
      const response = await fetch('/api/importacion/inspeccionar', {
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
      showErrorAlert('Error al inspeccionar', 'No se pudo leer la estructura del Excel: ' + err.message);
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
      const response = await fetch('/api/importacion/procesar', {
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
      showErrorAlert('Error en la importación', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
    <div className={`min-h-screen transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />

      <main className={`transition-all duration-300 p-4 sm:p-8 pt-16 md:pt-8 space-y-6 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
              Carga Masiva
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Asistente de Importación de Excel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Carga de archivos .xlsx / .xls con inspección automática, profiling de vacíos y autodetección de tipos
          </p>
        </div>

        {/* Pasos */}
        <div className={`p-4 rounded-2xl border shadow-md flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs font-bold ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className={`px-4 py-2 rounded-xl shrink-0 transition-all ${
            step === 1 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
          }`}>
            1. Seleccionar Archivo
          </span>
          <ArrowRight size={14} className="text-slate-400 shrink-0" />
          <span className={`px-4 py-2 rounded-xl shrink-0 transition-all ${
            step === 2 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
          }`}>
            2. Vista Previa y Profiling
          </span>
          <ArrowRight size={14} className="text-slate-400 shrink-0" />
          <span className={`px-4 py-2 rounded-xl shrink-0 transition-all ${
            step === 3 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
              : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
          }`}>
            3. Resultado
          </span>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className={`border rounded-3xl p-8 max-w-2xl mx-auto space-y-6 text-center shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-3xl border border-indigo-500/20 flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Selecciona tu archivo de encuesta (.xlsx o .xls)</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">El sistema autodetectará las columnas y estructurará los datos automáticamente</p>
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
              className={`inline-flex items-center gap-2 px-6 py-4 font-bold rounded-2xl border cursor-pointer transition-all text-sm shadow-md ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <Upload size={18} />
              {file ? file.name : 'Buscar archivo Excel...'}
            </label>

            {file && (
              <div className="pt-4">
                <button
                  onClick={handleInspect}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
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
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hoja Analizada</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{analysis.hoja_analizada}</h3>
              </div>
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Registros</p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{analysis.total_registros}</h3>
              </div>
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Columnas</p>
                <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{analysis.total_columnas}</h3>
              </div>
            </div>

            <div className={`border rounded-3xl p-6 shadow-xl ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Profiling de Columnas y Tipos Detectados</h3>
              <div className="overflow-x-auto max-h-96 rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase text-[11px] font-black tracking-wider sticky top-0 ${
                    theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    <tr>
                      <th className="p-3">Columna</th>
                      <th className="p-3">Tipo Detectado</th>
                      <th className="p-3">Vacíos</th>
                      <th className="p-3">Valores Únicos</th>
                      <th className="p-3">Ejemplos</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {analysis.columnas.map((col: any, idx: number) => (
                      <tr key={idx} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                        <td className={`p-3 font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{col.columna}</td>
                        <td className="p-3 font-bold text-indigo-600 dark:text-indigo-300">{col.tipo_detectado}</td>
                        <td className="p-3 font-bold text-rose-500">{col.vacios} ({col.porcentaje_vacios}%)</td>
                        <td className="p-3 font-mono font-bold">{col.valores_unicos}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{col.ejemplos.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setStep(1)}
                  className={`px-6 py-3 font-bold rounded-2xl text-xs transition-all ${
                    theme === 'light' 
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
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
          <div className={`border rounded-3xl p-8 max-w-xl mx-auto space-y-6 text-center shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="w-20 h-20 bg-emerald-600/10 text-emerald-500 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Importación Completada</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{result.message}</p>
            </div>

            <div className={`grid grid-cols-2 gap-4 text-left p-4 rounded-2xl border ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/50'
            }`}>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">Procesados:</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{result.registros_procesados}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">Insertados:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.registros_insertados}</span>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-sm cursor-pointer"
            >
              IR AL DASHBOARD
            </button>
          </div>
        )}
        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

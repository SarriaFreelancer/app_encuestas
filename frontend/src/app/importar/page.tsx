"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Link as LinkIcon, Database, RefreshCw, Layers } from 'lucide-react';

export default function ImportarEncuestaPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

  const [importMode, setImportMode] = useState<'excel' | 'sheets'>('sheets');
  const [step, setStep] = useState(1);
  
  // Estado para archivo Excel
  const [file, setFile] = useState<File | null>(null);
  
  // Estado para Google Sheets Link
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [tipoAcceso, setTipoAcceso] = useState<'publico' | 'privado'>('publico');
  const [correoAutorizado, setCorreoAutorizado] = useState('');
  const [claveAcceso, setClaveAcceso] = useState('');
  const [sheetsData, setSheetsData] = useState<any>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>(['Hoja Principal (Default)']);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInspectSheetsUrl = async () => {
    if (!sheetsUrl.trim()) {
      showErrorAlert('Enlace requerido', 'Por favor ingresa un enlace válido de Google Sheets.');
      return;
    }
    if (tipoAcceso === 'privado' && !correoAutorizado.trim()) {
      showErrorAlert('Correo requerido', 'Para enlaces privados con permisos asignados debes especificar el correo del usuario autorizado.');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchApi('/importacion/google-sheets/inspeccionar', {
        method: 'POST',
        body: JSON.stringify({
          url: sheetsUrl,
          tipo_acceso: tipoAcceso,
          correo_autorizado: correoAutorizado.trim() || undefined,
          clave_acceso: claveAcceso.trim() || undefined
        })
      });
      setSheetsData(data);
      setStep(2);
    } catch (err: any) {
      showErrorAlert('Error al validar enlace', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSheetsImport = async () => {
    if (!sheetsUrl.trim()) return;
    setLoading(true);
    try {
      const data = await fetchApi('/importacion/google-sheets/procesar', {
        method: 'POST',
        body: JSON.stringify({
          url: sheetsUrl,
          selected_sheets: selectedSheets,
          tipo_acceso: tipoAcceso,
          correo_autorizado: correoAutorizado.trim() || undefined,
          clave_acceso: claveAcceso.trim() || undefined
        })
      });
      setResult(data);
      setStep(3);
      showSuccessAlert('¡Dashboard Actualizado!', 'Los nuevos datos de Google Sheets han sido procesados y guardados en la Base de Datos.');
    } catch (err: any) {
      showErrorAlert('Error en la importación', err.message);
    } finally {
      setLoading(false);
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
        {/* Header con Banner de Gradiente */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white border-indigo-700/50'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800'
        }`}>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">
                <Database size={14} className="text-amber-400" /> Carga Masiva e Inspección Automática
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Asistente de Importación de Encuestas
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
                Conecta tu libro de **Google Sheets** o sube un archivo **Excel local (.xlsx / .xls)**. El sistema inspeccionará las hojas, profilará vacíos y actualizará los gráficos del tablero en tiempo real.
              </p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                <Database size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-200">Sincronización BD</p>
                <p className="text-xs font-extrabold text-white">Directa y Segura</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Progresivo Mejorado */}
        <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-around gap-2 sm:gap-4 overflow-x-auto text-xs font-bold transition-all ${
          theme === 'light' ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${
            step === 1
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
              : theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 1 ? 'bg-white text-indigo-600' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>1</span>
            <span>Seleccionar Origen de Datos</span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0" />

          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${
            step === 2
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
              : theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 2 ? 'bg-white text-indigo-600' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>2</span>
            <span>Vista Previa y Profiling</span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0" />

          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${
            step === 3
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
              : theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 3 ? 'bg-white text-emerald-600' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>3</span>
            <span>Resultado de Carga</span>
          </div>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Selector de Origen (Google Sheets vs Archivo Excel) */}
            <div className={`p-2 rounded-2xl border flex gap-2 shadow-md ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                onClick={() => setImportMode('sheets')}
                className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  importMode === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : theme === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <LinkIcon size={16} /> Enlace de Google Sheets (Recomendado)
              </button>
              <button
                onClick={() => setImportMode('excel')}
                className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  importMode === 'excel'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : theme === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <FileSpreadsheet size={16} /> Subir Archivo Excel Local (.xlsx / .xls)
              </button>
            </div>

            {/* MODO GOOGLE SHEETS LINK */}
            {importMode === 'sheets' && (
              <div className={`border rounded-3xl p-8 space-y-6 text-center shadow-2xl ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <div className="w-20 h-20 bg-emerald-600/10 text-emerald-500 rounded-3xl border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
                  <LinkIcon size={40} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Importación desde Google Sheets</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md mx-auto">
                    El backend validará automáticamente las pestañas disponibles para cargar los datos en la base de datos y activar los nuevos gráficos.
                  </p>
                </div>

                {/* Selector Tipo de Acceso: Público vs Privado */}
                <div className="max-w-xl mx-auto space-y-4 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Acceso al Documento *</label>
                  <div className={`p-1.5 rounded-2xl border flex gap-1.5 ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setTipoAcceso('publico')}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        tipoAcceso === 'publico'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : theme === 'light' ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🌐 Enlace Público (Cualquier persona con el enlace)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoAcceso('privado')}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        tipoAcceso === 'privado'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : theme === 'light' ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🔒 Enlace Privado (Compartido a Usuario Específico)
                    </button>
                  </div>

                  {/* URL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-slate-400">URL del documento de Google Sheets *</label>
                    <input
                      type="url"
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/edit..."
                      className={`w-full px-4 py-3.5 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${
                        theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                      }`}
                    />
                  </div>

                  {/* Campos adicionales si es Enlace Privado */}
                  {tipoAcceso === 'privado' && (
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                        <Database size={16} /> Credenciales del Usuario Autorizado con Permisos de Editor/Lector
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400">Correo Electrónico Autorizado en Google Sheets *</label>
                        <input
                          type="email"
                          value={correoAutorizado}
                          onChange={(e) => setCorreoAutorizado(e.target.value)}
                          placeholder="ej. editor-autorizado@empresa.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400">Clave de Servicio o Credencial de Aplicación (Opcional)</label>
                        <input
                          type="password"
                          value={claveAcceso}
                          onChange={(e) => setClaveAcceso(e.target.value)}
                          placeholder="Clave de token API o contraseña de aplicación"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                          }`}
                        />
                      </div>

                      <p className="text-[10px] text-indigo-400 font-medium leading-tight">
                        Al usar el acceso privado, el backend validará los permisos asignados a esta cuenta para cargar los datos en la base de datos para todos los usuarios.
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 font-medium">
                    {tipoAcceso === 'publico' 
                      ? 'Requisito: La hoja debe tener el permiso "Cualquier persona con el enlace puede ver".' 
                      : 'Requisito: El archivo fue compartido con permisos explícitos de Editor/Lector al correo especificado.'}
                  </p>
                </div>

                <div className="pt-2 max-w-xl mx-auto">
                  <button
                    onClick={handleInspectSheetsUrl}
                    disabled={loading || !sheetsUrl.trim()}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    VALIDAR HOJAS
                  </button>
                </div>
              </div>
            )}

            {/* MODO EXCEL LOCAL */}
            {importMode === 'excel' && (
              <div className={`border rounded-3xl p-8 md:p-10 space-y-6 text-center shadow-2xl transition-all ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Carga de Archivo Excel Local</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                    Selecciona o arrastra tu archivo **.xlsx** o **.xls**. El motor inspeccionará automáticamente todas las columnas y hojas.
                  </p>
                </div>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />

                {/* Zona de Soltar / Dropzone Interactiva */}
                <label
                  htmlFor="excel-file-input"
                  className={`group relative max-w-xl mx-auto flex flex-col items-center justify-center p-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
                    file
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : theme === 'light'
                      ? 'border-indigo-300 hover:border-indigo-500 bg-slate-50/80 hover:bg-indigo-50/50'
                      : 'border-slate-700 hover:border-indigo-500 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xl ${
                    file
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                      : 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 shadow-indigo-500/10'
                  }`}>
                    <FileSpreadsheet size={42} />
                  </div>

                  {file ? (
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-xs rounded-full inline-block mb-1 border border-emerald-500/30">
                        ✓ Archivo Seleccionado
                      </span>
                      <p className="text-base font-black text-slate-900 dark:text-white truncate max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB — Listo para inspeccionar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                        Haz clic aquí para seleccionar tu archivo Excel
                      </p>
                      <p className="text-xs text-slate-400">
                        Formatos soportados: **.xlsx**, **.xls** (Carga masiva directa)
                      </p>
                    </div>
                  )}
                </label>

                {file && (
                  <div className="pt-2 max-w-xl mx-auto">
                    <button
                      onClick={handleInspect}
                      disabled={loading}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                      VALIDAR HOJAS Y COLUMNAS
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Si es importación por Google Sheets Link */}
            {sheetsData ? (
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl border shadow-xl ${
                  theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">Aviso Importante sobre los Datos Actuales</h4>
                      <p className="text-xs mt-1 leading-relaxed">
                        Al confirmar esta importación, <strong>el Dashboard actual se respaldará en la Base de Datos</strong> y los nuevos datos de las hojas seleccionadas pasarán a ser la fuente activa para generar los gráficos analíticos actualizados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <Layers size={20} className="text-emerald-500" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Selección de Hojas a Tomar Datos</h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    {sheetsData.hojas.map((h: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSheets.includes(h.nombre)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSheets([...selectedSheets, h.nombre]);
                              } else {
                                setSelectedSheets(selectedSheets.filter(s => s !== h.nombre));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-sm block">{h.nombre}</span>
                            <span className="text-xs text-slate-400 font-mono">{h.total_filas} registros • {h.total_columnas} columnas autodetectadas</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">Lista para importar</span>
                      </div>
                    ))}
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
                      onClick={handleConfirmSheetsImport}
                      disabled={loading || selectedSheets.length === 0}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                      GUARDAR EN BD Y ACTUALIZAR DASHBOARD
                    </button>
                  </div>
                </div>
              </div>
            ) : analysis ? (
              /* Si es importación por Archivo Excel Local */
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl border shadow-xl ${
                  theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">Aviso Importante sobre los Datos Actuales</h4>
                      <p className="text-xs mt-1 leading-relaxed">
                        Al confirmar esta importación, <strong>el Dashboard actual se respaldará en la Base de Datos</strong> y los datos del archivo Excel pasarán a ser la fuente activa para generar los gráficos analíticos actualizados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hojas Disponibles en el Archivo Excel */}
                {analysis.hojas_disponibles && (
                  <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Layers size={20} className="text-indigo-500" />
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Selección de Hojas del Archivo Excel</h3>
                    </div>

                    <div className="space-y-3 pt-1">
                      {analysis.hojas_disponibles.map((hName: string, idx: number) => (
                        <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${
                          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
                        }`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              defaultChecked={idx === 0}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-extrabold text-sm block">{hName}</span>
                              <span className="text-xs text-slate-400 font-mono">
                                {idx === 0 ? `${analysis.total_registros} registros • ${analysis.total_columnas} columnas` : 'Hoja Secundaria Detectada'}
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">
                            {idx === 0 ? 'Hoja Principal' : 'Disponible'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      CONFIRMAR E IMPORTAR EXCEL
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <RefreshCw size={18} /> VER NUEVOS GRÁFICOS EN DASHBOARD
            </button>
          </div>
        )}
        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

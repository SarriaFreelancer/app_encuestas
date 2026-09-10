"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { soloDigitos, validarDocumento } from '@/lib/validations';
import {
  Search, User, IdCard, AlertCircle, CheckCircle2,
  Calendar, FileText, Loader2, X, ChevronRight
} from 'lucide-react';

export default function BuscarPersonaPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  
  const [cedula, setCedula] = useState('');
  const [cedulaError, setCedulaError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [registro, setRegistro] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCedulaChange = (val: string) => {
    const onlyNums = soloDigitos(val);
    setCedula(onlyNums);
    if (onlyNums.length > 0) {
      const { error } = validarDocumento(onlyNums);
      setCedulaError(error);
    } else {
      setCedulaError('');
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCedula = cedula.trim();

    // Validar antes de buscar
    const { valid, error } = validarDocumento(cleanCedula);
    if (!valid) {
      setCedulaError(error);
      return;
    }

    setCedulaError('');
    setLoading(true);
    setBusquedaRealizada(true);
    setRegistro(null);
    setErrorMsg('');

    try {
      const res = await fetchApi(`/encuestas/buscar/${encodeURIComponent(cleanCedula)}`);
      if (res.encontrado && res.datos) {
        setRegistro(res.datos);
      } else {
        setErrorMsg(res.mensaje || 'No se encontró ninguna persona registrada con este número de cédula.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al consultar la persona.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setCedula('');
    setCedulaError('');
    setBusquedaRealizada(false);
    setRegistro(null);
    setErrorMsg('');
  };

  // Filtrar claves no informativas como __row_index
  const entries = registro 
    ? Object.entries(registro).filter(([k]) => k !== '__row_index' && k !== '') 
    : [];

  return (
    <ProtectedRoute>
    <div className={`min-h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />

      <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>

        {/* HEADER */}
        <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
          theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 font-bold">
                <IdCard size={20} />
              </span>
              <span className="text-xs text-indigo-500 font-black tracking-wider uppercase">
                Búsqueda Individual
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Consulta de Encuestado por Cédula
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Ingresa el número de documento para visualizar la totalidad de respuestas asociadas a la persona.
            </p>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className={`border rounded-3xl p-6 shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <form onSubmit={handleBuscar} className="max-w-2xl mx-auto space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Número de Cédula o Documento de Identidad
            </label>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={cedula}
                    onChange={(e) => handleCedulaChange(e.target.value)}
                    placeholder="Solo números (ej. 1234567890)"
                    className={`w-full pl-11 pr-10 py-3.5 rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                      cedulaError
                        ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500/50 text-rose-400'
                        : theme === 'light'
                        ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:ring-indigo-500/50'
                        : 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:ring-indigo-500/50'
                    }`}
                  />
                  {cedula && (
                    <button
                      type="button"
                      onClick={handleLimpiar}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Error inline de validación */}
                {cedulaError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-500">
                    <AlertCircle size={13} /> {cedulaError}
                  </p>
                )}

                {/* Hint cuando es válido y tiene valor */}
                {!cedulaError && cedula.length >= 5 && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                    <CheckCircle2 size={13} /> Formato de documento válido
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !cedula.trim()}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Consultar Persona
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RESULTADOS */}
        {busquedaRealizada && !loading && (
          <>
            {registro ? (
              <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                {/* Banner de Persona Encontrada */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="shrink-0" />
                    <div>
                      <h2 className="font-extrabold text-base text-emerald-400">
                        {registro['1. Nombre completo'] || registro['NOMBRE'] || 'Registro Encontrado'}
                      </h2>
                      <p className="text-xs text-emerald-400/80">
                        Documento: {registro['Número de documento'] || registro['NÃºmero de documento'] || registro['CÉDULA'] || cedula}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-black">
                    {entries.length} Preguntas / Respuestas Registradas
                  </span>
                </div>

                {/* Tabla completa de todas las preguntas de la persona */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-xs font-black uppercase tracking-wider ${
                        theme === 'light' ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}>
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4 sm:w-1/2">Pregunta / Campo</th>
                        <th className="py-3.5 px-4 sm:w-1/2">Respuesta Registrada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {entries.map(([pregunta, respuesta], index) => {
                        const valor = String(respuesta || '').trim();
                        const tieneValor = valor !== '' && valor !== 'N/a' && valor !== 'N /a';

                        return (
                          <tr
                            key={index}
                            className={`transition-colors ${
                              theme === 'light'
                                ? index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'
                                : index % 2 === 0 ? 'bg-slate-900 hover:bg-slate-800/50' : 'bg-slate-800/20 hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold text-center text-slate-400">
                              {index + 1}
                            </td>
                            <td className={`py-3 px-4 font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                              {pregunta}
                            </td>
                            <td className="py-3 px-4">
                              {tieneValor ? (
                                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                  {valor}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-mono text-[11px]">
                                  (Sin respuesta / No aplica)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* No Encontrado */
              <div className={`border rounded-3xl p-10 text-center shadow-xl space-y-3 ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-500 mb-2">
                  <AlertCircle size={36} />
                </div>
                <h3 className="text-lg font-bold">No se encontraron resultados</h3>
                <p className={`text-xs sm:text-sm max-w-md mx-auto ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {errorMsg || `No existe ninguna persona registrada con la cédula "${cedula}". Verifica el número e intenta nuevamente.`}
                </p>
              </div>
            )}
          </>
        )}

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

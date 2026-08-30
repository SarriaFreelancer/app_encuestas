"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { Search, Edit3, X, Save, ChevronLeft, ChevronRight, Loader2, Database, Rows } from 'lucide-react';

export default function RespuestasPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de Edición
  const [registroEditar, setRegistroEditar] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  // Paginación (Selector de 25 o 50 registros por página)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, metaData] = await Promise.all([
        fetchApi('/encuestas/respuestas'),
        fetchApi('/encuestas/metadatos')
      ]);
      setRespuestas(resData);
      setMetadata(metaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar respuestas por búsqueda
  const filtered = respuestas.filter(r => {
    if (!search) return true;
    const query = search.toLowerCase();
    return Object.values(r).some(val => String(val).toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registroEditar) return;
    setSaving(true);

    try {
      const rowIndex = registroEditar.__row_index;
      await fetchApi(`/encuestas/respuestas/${rowIndex}`, {
        method: 'PUT',
        body: JSON.stringify({
          fila_index: rowIndex,
          datos: registroEditar
        })
      });

      alert('Registro actualizado correctamente.');
      setRegistroEditar(null);
      loadData();
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />

      <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
          theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500 font-bold">
                <Database size={20} />
              </span>
              <span className="text-xs text-indigo-500 font-black tracking-wider uppercase">
                Base de Datos y Respuestas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Respuestas de Encuestas
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Consulta, filtrado, paginación configurable y edición de registros sincronizados con Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por cédula, nombre..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400'
                    : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selector de Tamaño de Página (25 o 50) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-700/60 bg-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1">
                <Rows size={13} /> Filas:
              </span>
              <button
                onClick={() => handlePageSizeChange(25)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pageSize === 25 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                25
              </button>
              <button
                onClick={() => handlePageSizeChange(50)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pageSize === 50 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                50
              </button>
            </div>
          </div>
        </div>

        {/* Tabla con scroll horizontal y vertical completos */}
        <div className={`border rounded-3xl overflow-hidden shadow-2xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          {/* Contenedor con scroll horizontal completo y scroll vertical max-h */}
          <div className="overflow-x-auto overflow-y-auto max-h-[68vh] scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-max">
              <thead className={`sticky top-0 z-20 text-[11px] font-black uppercase tracking-wider border-b ${
                theme === 'light' 
                  ? 'bg-slate-100/95 text-slate-700 border-slate-200 backdrop-blur-md' 
                  : 'bg-slate-800/95 text-slate-300 border-slate-700 backdrop-blur-md'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 text-center w-14 sticky left-0 z-30 bg-inherit shadow-[1px_0_0_rgba(0,0,0,0.1)]">
                    #
                  </th>
                  {metadata?.columnas.map((col, idx) => (
                    <th key={idx} className="py-3.5 px-4 font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 font-bold text-center sticky right-0 z-30 bg-inherit shadow-[-1px_0_0_rgba(0,0,0,0.1)]">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={(metadata?.columnas.length || 5) + 2} className="text-center py-16 text-slate-400">
                      <Loader2 className="animate-spin inline-block mr-2 text-indigo-500" size={24} /> 
                      <span className="font-semibold">Cargando respuestas de la encuesta...</span>
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((row, idx) => {
                    const rowGlobalIndex = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          theme === 'light'
                            ? idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-100'
                            : idx % 2 === 0 ? 'bg-slate-900 hover:bg-slate-800/60' : 'bg-slate-800/25 hover:bg-slate-800/60'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-center text-slate-400 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                          {rowGlobalIndex}
                        </td>
                        {metadata?.columnas.map((col, cIdx) => (
                          <td key={cIdx} className="py-3 px-4 whitespace-nowrap max-w-xs truncate" title={String(row[col] || '')}>
                            {row[col] ? (
                              <span className="font-medium">{String(row[col])}</span>
                            ) : (
                              <span className="text-slate-500 italic font-mono text-[11px]">-</span>
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-center whitespace-nowrap sticky right-0 z-10 bg-inherit shadow-[-1px_0_0_rgba(0,0,0,0.05)]">
                          <button
                            onClick={() => setRegistroEditar({ ...row })}
                            className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit3 size={13} /> Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={(metadata?.columnas.length || 5) + 2} className="text-center py-16 text-slate-500 font-semibold">
                      No se encontraron respuestas coincidentes con el filtro de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Barra de Paginación */}
          <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                Mostrando del <span className="font-mono text-indigo-400 font-black">{filtered.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> al <span className="font-mono text-indigo-400 font-black">{Math.min(page * pageSize, filtered.length)}</span> de <span className="font-mono font-black">{filtered.length}</span> registros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold mr-2">Página {page} de {totalPages}</span>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-40'
                }`}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-40'
                }`}
                title="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {registroEditar && metadata && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className={`p-6 border-b flex items-center justify-between ${
                theme === 'light' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div>
                  <h3 className="text-lg font-black">
                    Editar Registro (Fila #{registroEditar.__row_index})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica los campos y haz clic en Guardar para reflejar los cambios en el sistema.
                  </p>
                </div>
                <button 
                  onClick={() => setRegistroEditar(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metadata.columnas.map(col => (
                    <div key={col} className={col.includes('PREGUNTA') || col.length > 30 ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {col}
                      </label>
                      <input
                        type="text"
                        disabled={col === 'CÉDULA' || col === 'Número de documento'}
                        value={registroEditar[col] || ''}
                        onChange={(e) => setRegistroEditar({ ...registroEditar, [col]: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-300 text-slate-900'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className={`pt-5 border-t flex justify-end gap-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => setRegistroEditar(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

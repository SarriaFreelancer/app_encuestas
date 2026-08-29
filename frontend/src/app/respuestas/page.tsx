"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { Search, Edit3, X, Save, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function RespuestasPage() {
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de Edición
  const [registroEditar, setRegistroEditar] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
  }, []);

  // Filtrar
  const filtered = respuestas.filter(r => {
    const query = search.toLowerCase();
    return Object.values(r).some(val => String(val).toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Respuestas de Encuestas</h1>
            <p className="text-slate-400 text-sm mt-1">
              Consulta, filtrado y edición directa sobre registros de Google Sheets
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, cédula, respuesta..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] tracking-wider">
                <tr>
                  {metadata?.columnas.map(col => (
                    <th key={col} className="p-4 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                  <th className="p-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={(metadata?.columnas.length || 5) + 1} className="text-center py-10">
                      <Loader2 className="animate-spin inline-block mr-2" size={20} /> Cargando respuestas...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      {metadata?.columnas.map(col => (
                        <td key={col} className="p-4 whitespace-nowrap">
                          {row[col] || <span className="text-slate-600">-</span>}
                        </td>
                      ))}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setRegistroEditar({ ...row })}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                        >
                          <Edit3 size={14} /> EDITAR
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={(metadata?.columnas.length || 5) + 1} className="text-center py-10 text-slate-500">
                      No se encontraron respuestas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Página {page} de {totalPages} ({filtered.length} registros)</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Edición */}
        {registroEditar && metadata && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Editar Registro (Fila #{registroEditar.__row_index})</h3>
                <button 
                  onClick={() => setRegistroEditar(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metadata.columnas.map(col => (
                    <div key={col} className={col.includes('PREGUNTA') ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        {col}
                      </label>
                      <input
                        type="text"
                        disabled={col === 'CÉDULA'} // Protegido según requerimiento
                        value={registroEditar[col] || ''}
                        onChange={(e) => setRegistroEditar({ ...registroEditar, [col]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRegistroEditar(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
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

"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Table as TableIcon, ExternalLink } from 'lucide-react';

export default function HojaEspejoPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Paginación de la hoja de cálculo
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, metaData] = await Promise.all([
        fetchApi('/encuestas/respuestas'),
        fetchApi('/encuestas/metadatos')
      ]);
      setRespuestas(resData);
      setColumnas(metaData.columnas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado de la cuadrícula
  const filtered = respuestas.filter(row => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Convertir número de índice a letra de columna estilo Excel (A, B, C... AA, AB...)
  const getColumnLetter = (index: number) => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
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
        {/* Header Estilo Google Sheets */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TableIcon className="text-emerald-500" size={24} />
              <h1 className={`text-2xl font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Vista Previa Espejo — Google Sheet
              </h1>
            </div>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Sincronizado en tiempo real con la hoja: <span className="text-emerald-600 dark:text-emerald-300 font-semibold">Respuestas de formulario 1</span> ({respuestas.length} filas, {columnas.length} columnas)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar celda..."
                className={`pl-9 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-emerald-500 ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                }`}
              />
            </div>
            <button
              onClick={loadData}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Sincronizar con Google Sheet"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <a
              href="https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/edit?gid=1325247630#gid=1325247630"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              Abrir en Google Sheets <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Tabla Espejo tipo Hoja de Cálculo con Encabezados A, B, C... */}
        <div className={`border rounded-2xl overflow-hidden shadow-2xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse font-sans">
              {/* Fila 1: Encabezados de Columna estilo Excel A, B, C... */}
              <thead className={`sticky top-0 z-20 border-b ${
                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <tr>
                  <th className={`p-2 border-r text-center font-mono text-[10px] w-12 ${
                    theme === 'light' ? 'border-slate-200 bg-slate-200/60 text-slate-600' : 'border-slate-800 bg-slate-950 text-slate-600'
                  }`}>#</th>
                  {columnas.map((_, colIdx) => (
                    <th key={colIdx} className={`p-2 border-r text-center font-mono font-bold text-[11px] whitespace-nowrap min-w-[160px] ${
                      theme === 'light' ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}>
                      {getColumnLetter(colIdx)}
                    </th>
                  ))}
                </tr>
                {/* Fila 2: Nombres Reales de las Columnas de la Hoja */}
                <tr className={`font-bold border-b text-[11px] ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-emerald-700'
                    : 'bg-slate-900/90 border-slate-800 text-emerald-300'
                }`}>
                  <th className={`p-2 border-r text-center ${theme === 'light' ? 'border-slate-200 bg-slate-100' : 'border-slate-800 bg-slate-950'}`}>Fila</th>
                  {columnas.map((col, colIdx) => (
                    <th key={colIdx} className={`p-3 border-r whitespace-nowrap min-w-[200px] ${
                      theme === 'light' ? 'border-slate-200' : 'border-slate-800'
                    }`} title={col}>
                      <span className="text-[10px] opacity-60 mr-1 font-mono">[{colIdx + 1}]</span>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Cuerpo de Celdas de Datos */}
              <tbody className={`divide-y font-mono text-[11px] ${
                theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/60'
              }`}>
                {loading ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="text-center py-12 text-slate-400 font-sans">
                      <RefreshCw className="animate-spin inline-block mr-2 text-emerald-500" size={20} /> Sincronizando celdas de Google Sheets...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((row, rIdx) => {
                    const actualRowIndex = (page - 1) * pageSize + rIdx + 2; // Fila 2 en adelante
                    return (
                      <tr key={rIdx} className={theme === 'light' ? 'hover:bg-emerald-50/60' : 'hover:bg-emerald-950/20'}>
                        {/* Número de Fila */}
                        <td className={`p-2.5 border-r text-center font-bold font-mono select-none ${
                          theme === 'light' ? 'border-slate-200 text-slate-500 bg-slate-100/50' : 'border-slate-800 text-slate-500 bg-slate-950/40'
                        }`}>
                          {actualRowIndex}
                        </td>
                        {/* Celdas de datos */}
                        {columnas.map((col, cIdx) => {
                          const cellVal = row[col];
                          const isEmpty = cellVal === undefined || cellVal === null || String(cellVal).trim() === '';
                          return (
                            <td 
                              key={cIdx} 
                              className={`p-2.5 border-r whitespace-nowrap max-w-xs truncate ${
                                theme === 'light' ? 'border-slate-200' : 'border-slate-800/60'
                              } ${
                                isEmpty 
                                  ? theme === 'light' ? 'text-slate-400 italic bg-slate-50/50' : 'text-slate-700 italic bg-slate-950/10'
                                  : theme === 'light' ? 'text-slate-800 font-sans' : 'text-slate-200 font-sans'
                              }`}
                              title={String(cellVal || '')}
                            >
                              {isEmpty ? '(vacío)' : String(cellVal)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={columnas.length + 1} className="text-center py-10 text-slate-400 font-sans">
                      No se encontraron filas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador Estilo Hoja de Cálculo */}
          <div className={`p-4 border-t flex items-center justify-between text-xs ${
            theme === 'light'
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-slate-800 bg-slate-900/90 text-slate-400'
          }`}>
            <span>
              Mostrando filas {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className={`p-2 rounded-xl disabled:opacity-40 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={`font-bold px-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className={`p-2 rounded-xl disabled:opacity-40 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

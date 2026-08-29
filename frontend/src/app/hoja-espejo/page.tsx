"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, RefreshCw, Table as TableIcon, ExternalLink } from 'lucide-react';

export default function HojaEspejoPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-6">
        {/* Header Estilo Google Sheets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TableIcon className="text-emerald-400" size={24} />
              <h1 className="text-2xl font-extrabold text-white">Vista Previa Espejo — Google Sheet</h1>
            </div>
            <p className="text-slate-400 text-xs">
              Sincronizado en tiempo real con la hoja: <span className="text-emerald-300 font-semibold">Respuestas de formulario 1</span> ({respuestas.length} filas, {columnas.length} columnas)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar celda..."
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs border-collapse font-sans">
              {/* Fila 1: Encabezados de Columna estilo Excel A, B, C... */}
              <thead className="bg-slate-950 text-slate-400 sticky top-0 z-20 border-b border-slate-800">
                <tr>
                  <th className="p-2 border-r border-slate-800 text-center bg-slate-950 font-mono text-[10px] w-12 text-slate-600">#</th>
                  {columnas.map((_, colIdx) => (
                    <th key={colIdx} className="p-2 border-r border-slate-800 text-center font-mono font-bold text-[11px] text-slate-400 bg-slate-950 whitespace-nowrap min-w-[160px]">
                      {getColumnLetter(colIdx)}
                    </th>
                  ))}
                </tr>
                {/* Fila 2: Nombres Reales de las Columnas de la Hoja */}
                <tr className="bg-slate-900/90 text-emerald-300 font-bold border-b border-slate-800 text-[11px]">
                  <th className="p-2 border-r border-slate-800 text-center bg-slate-950">Fila</th>
                  {columnas.map((col, colIdx) => (
                    <th key={colIdx} className="p-3 border-r border-slate-800 whitespace-nowrap min-w-[200px]" title={col}>
                      <span className="text-[10px] text-slate-500 mr-1 font-mono">[{colIdx + 1}]</span>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Cuerpo de Celdas de Datos */}
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="text-center py-12 text-slate-400 font-sans">
                      <RefreshCw className="animate-spin inline-block mr-2 text-emerald-400" size={20} /> Sincronizando celdas de Google Sheets...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((row, rIdx) => {
                    const actualRowIndex = (page - 1) * pageSize + rIdx + 2; // Fila 2 en adelante
                    return (
                      <tr key={rIdx} className="hover:bg-emerald-950/20 transition-colors">
                        {/* Número de Fila */}
                        <td className="p-2.5 border-r border-slate-800 text-center text-slate-500 font-bold bg-slate-950/40 select-none">
                          {actualRowIndex}
                        </td>
                        {/* Celdas de datos */}
                        {columnas.map((col, cIdx) => {
                          const cellVal = row[col];
                          const isEmpty = cellVal === undefined || cellVal === null || String(cellVal).trim() === '';
                          return (
                            <td 
                              key={cIdx} 
                              className={`p-2.5 border-r border-slate-800/60 whitespace-nowrap max-w-xs truncate ${
                                isEmpty ? 'text-slate-700 italic bg-slate-950/10' : 'text-slate-200 font-sans'
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
                    <td colSpan={columnas.length + 1} className="text-center py-10 text-slate-500 font-sans">
                      No se encontraron filas que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador Estilo Hoja de Cálculo */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/90">
            <span>
              Mostrando filas {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-white px-2">Página {page} de {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

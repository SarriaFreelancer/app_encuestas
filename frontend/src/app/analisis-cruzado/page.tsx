"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { showErrorAlert } from '@/lib/alerts';
import { SurveyMetadata } from '@/types';
import { GitCompare, Table, RefreshCw, BarChart2, CheckSquare } from 'lucide-react';

export default function AnalisisCruzadoPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [colA, setColA] = useState<string>('');
  const [colB, setColB] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [crosstabData, setCrosstabData] = useState<any>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchApi('/encuestas/metadatos');
        setMetadata(meta);
        if (meta.columnas.length >= 2) {
          setColA(meta.columnas[0]);
          setColB(meta.columnas[1]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const handleComputeCrosstab = async () => {
    if (!colA || !colB) return;
    setLoading(true);
    try {
      const data = await fetchApi(`/analisis/crosstab?col_a=${encodeURIComponent(colA)}&col_b=${encodeURIComponent(colB)}`);
      setCrosstabData(data);
    } catch (err: any) {
      showErrorAlert('Error en cruce de variables', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (colA && colB && colA !== colB) {
      handleComputeCrosstab();
    }
  }, [colA, colB]);

  return (
    <ProtectedRoute requireAdmin>
    <div className={`min-h-screen transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />

      <main className={`transition-all duration-300 p-4 sm:p-8 pt-16 md:pt-8 space-y-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className={`border-b pb-6 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <h1 className={`text-3xl font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            Análisis Cruzado de Variables
          </h1>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Tabulación cruzada (Crosstab) y relaciones de frecuencias multidimensionales
          </p>
        </div>

        {/* Seleccionadores de Variables */}
        <div className={`border rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Variable Eje Vertical (Filas):
            </label>
            <select
              value={colA}
              onChange={(e) => setColA(e.target.value)}
              className={`w-full p-3.5 rounded-2xl border text-sm focus:outline-none focus:border-indigo-500 ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {metadata?.columnas.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Variable Eje Horizontal (Columnas):
            </label>
            <select
              value={colB}
              onChange={(e) => setColB(e.target.value)}
              className={`w-full p-3.5 rounded-2xl border text-sm focus:outline-none focus:border-indigo-500 ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {metadata?.columnas.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultado Matriz de Cruce */}
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="animate-spin text-indigo-500 mx-auto mb-3" size={32} />
            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Calculando matriz de cruce...
            </p>
          </div>
        ) : crosstabData ? (
          <div className={`border rounded-3xl overflow-hidden shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-800/40'
            }`}>
              <div className="flex items-center gap-2">
                <Table className="text-indigo-500" size={20} />
                <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Matriz Cruzada: {colA} vs {colB}
                </h3>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20">
                {crosstabData.total_general} Fila(s) Evaluada(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                <thead className={`uppercase text-[10px] tracking-wider ${
                  theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                }`}>
                  <tr>
                    <th className="p-4 border-r border-b border-slate-200 dark:border-slate-800">{colA} \ {colB}</th>
                    {(crosstabData.categorias_b || crosstabData.columnas_b || []).map((cb: string) => (
                      <th key={cb} className="p-4 border-r border-b border-slate-200 dark:border-slate-800 whitespace-nowrap text-center">
                        {cb}
                      </th>
                    ))}
                    <th className="p-4 border-b border-slate-200 dark:border-slate-800 text-center font-black">TOTAL</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                  {Array.isArray(crosstabData.matriz) ? (
                    // Estructura array de objetos (backend oficial): [{ variable_a: '...', total: N, [cat_b]: { cantidad: N, porcentaje: P } }]
                    crosstabData.matriz.map((rowObj: any, rIdx: number) => {
                      const labelA = rowObj.variable_a || rowObj.fila || `Fila ${rIdx + 1}`;
                      const catsB = crosstabData.categorias_b || crosstabData.columnas_b || [];
                      const isTotalRow = labelA === 'Total';

                      return (
                        <tr key={rIdx} className={`${
                          isTotalRow 
                            ? theme === 'light' ? 'bg-indigo-50/70 font-black' : 'bg-indigo-950/40 font-black'
                            : theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                        }`}>
                          <td className={`p-4 font-bold border-r whitespace-nowrap ${
                            theme === 'light' ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
                          }`}>
                            {labelA}
                          </td>
                          {catsB.map((cb: string) => {
                            const cellData = rowObj[cb];
                            const val = typeof cellData === 'object' && cellData !== null ? cellData.cantidad : (typeof cellData === 'number' ? cellData : 0);
                            const pct = typeof cellData === 'object' && cellData !== null ? cellData.porcentaje : null;

                            return (
                              <td key={cb} className={`p-4 border-r text-center font-mono ${
                                theme === 'light' ? 'border-slate-200' : 'border-slate-800'
                              }`}>
                                {val > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                                      {val}
                                    </span>
                                    {pct !== null && (
                                      <span className="text-[10px] text-slate-400 font-semibold">
                                        ({pct}%)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="opacity-40">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 text-center font-black font-mono text-indigo-500">
                            {rowObj.total ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    // Fallback para matriz diccionario de objetos: { [fila_a]: { [col_b]: cantidad } }
                    (crosstabData.filas_a || []).map((fa: string) => {
                      let totalFila = 0;
                      const catsB = crosstabData.columnas_b || [];
                      return (
                        <tr key={fa} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}>
                          <td className={`p-4 font-bold border-r whitespace-nowrap ${
                            theme === 'light' ? 'border-slate-200 text-slate-900 bg-slate-50/50' : 'border-slate-800 text-white bg-slate-950/40'
                          }`}>
                            {fa}
                          </td>
                          {catsB.map((cb: string) => {
                            const val = crosstabData.matriz[fa]?.[cb] || 0;
                            totalFila += val;
                            return (
                              <td key={cb} className={`p-4 border-r text-center font-mono ${
                                theme === 'light' ? 'border-slate-200' : 'border-slate-800'
                              }`}>
                                {val > 0 ? (
                                  <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className="opacity-40">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 text-center font-black font-mono text-indigo-500">
                            {totalFila}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

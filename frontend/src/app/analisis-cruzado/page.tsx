"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { GitCompare, Table, RefreshCw, BarChart2, CheckSquare } from 'lucide-react';

export default function AnalisisCruzadoPage() {
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
      alert('Error en el cruce de variables: ' + err.message);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Análisis Cruzado de Variables</h1>
          <p className="text-slate-400 text-sm mt-1">
            Matriz de contingencia bidimensional (Crosstabs) para correlación de preguntas
          </p>
        </div>

        {/* Selección de Variables A y B */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Variable A (Filas):
            </label>
            <select
              value={colA}
              onChange={(e) => setColA(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:border-indigo-500"
            >
              {metadata?.columnas.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Variable B (Columnas):
            </label>
            <select
              value={colB}
              onChange={(e) => setColB(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:border-indigo-500"
            >
              {metadata?.columnas.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Matriz Cruzada */}
        {crosstabData && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Table size={20} className="text-indigo-400" />
                Matriz de Contingencia: {colA} vs {colB}
              </h3>
              <span className="text-xs text-slate-400">Total analizado: {crosstabData.total_analizado} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4 font-bold text-white bg-slate-800/90">{colA} \ {colB}</th>
                    {crosstabData.categorias_b.map((catB: string) => (
                      <th key={catB} className="p-4 text-center whitespace-nowrap">{catB}</th>
                    ))}
                    <th className="p-4 text-right font-bold text-white bg-slate-800/90">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {crosstabData.matriz.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-white bg-slate-900/40">{row.variable_a}</td>
                      {crosstabData.categorias_b.map((catB: string) => {
                        const item = row[catB] || { cantidad: 0, porcentaje: 0 };
                        return (
                          <td key={catB} className="p-4 text-center">
                            <span className="font-bold text-white">{item.cantidad}</span>
                            <span className="text-xs text-indigo-400 block font-semibold">{item.porcentaje}%</span>
                          </td>
                        );
                      })}
                      <td className="p-4 text-right font-black text-white bg-slate-900/40">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

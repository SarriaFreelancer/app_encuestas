"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { Columns, BarChart3, PieChart as PieIcon, Calculator, ListFilter, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function AnalisisPreguntasPage() {
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metaData, resData] = await Promise.all([
          fetchApi('/encuestas/metadatos'),
          fetchApi('/encuestas/respuestas')
        ]);
        setMetadata(metaData);
        setRespuestas(resData);
        if (metaData.columnas.length > 0) {
          setColumnaSeleccionada(metaData.columnas[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calcular estadísticas dinámicas para la columna seleccionada
  const computeStats = () => {
    if (!columnaSeleccionada || respuestas.length === 0) return null;

    const total = respuestas.length;
    const values = respuestas.map(r => r[columnaSeleccionada]);
    const validos = values.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    const vacios = total - validos.length;

    // Frecuencias
    const freqMap: Record<string, number> = {};
    validos.forEach(v => {
      const valStr = String(v).trim();
      freqMap[valStr] = (freqMap[valStr] || 0) + 1;
    });

    const frecuencias = Object.keys(freqMap).map(k => ({
      opcion: k,
      cantidad: freqMap[k],
      porcentaje: Number(((freqMap[k] / total) * 100).toFixed(2))
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Moda
    const moda = frecuencias.length > 0 ? frecuencias[0].opcion : 'N/A';

    return {
      total,
      validos: validos.length,
      vacios,
      valores_unicos: frecuencias.length,
      moda,
      frecuencias
    };
  };

  const stats = computeStats();
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Análisis Dinámico de Preguntas</h1>
          <p className="text-slate-400 text-sm mt-1">
            Estadísticas descriptivas automáticas, distribución y frecuencia por variable
          </p>
        </div>

        {/* Selección de Pregunta */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-4">
          <label className="text-sm font-bold text-white whitespace-nowrap flex items-center gap-2">
            <Columns size={18} className="text-indigo-400" />
            Seleccionar Pregunta / Variable:
          </label>
          <select
            value={columnaSeleccionada}
            onChange={(e) => setColumnaSeleccionada(e.target.value)}
            className="flex-1 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-medium focus:outline-none focus:border-indigo-500 text-sm"
          >
            {metadata?.columnas.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Tarjetas de Métricas de la Pregunta */}
        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Respuestas Válidas</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.validos} / {stats.total}</h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Sin Respuesta (Vacíos)</p>
                <h3 className="text-2xl font-black text-rose-400 mt-1">{stats.vacios}</h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Valores Únicos</p>
                <h3 className="text-2xl font-black text-indigo-400 mt-1">{stats.valores_unicos}</h3>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 uppercase">Moda (Respuesta Frecuente)</p>
                <h3 className="text-xl font-bold text-white mt-1 truncate">{stats.moda}</h3>
              </div>
            </div>

            {/* Gráficos e Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-400" />
                  Distribución de Frecuencias
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.frecuencias}>
                      <XAxis dataKey="opcion" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                        {stats.frecuencias.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de Porcentajes */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ListFilter size={20} className="text-purple-400" />
                  Desglose Detallado
                </h3>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Opción / Valor</th>
                        <th className="p-3">Cantidad</th>
                        <th className="p-3">Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {stats.frecuencias.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{item.opcion}</td>
                          <td className="p-3">{item.cantidad}</td>
                          <td className="p-3 font-bold text-indigo-400">{item.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

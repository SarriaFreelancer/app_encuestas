"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { Columns, BarChart3, PieChart as PieIcon, ListFilter, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6'];

export default function AnalisisPreguntasPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

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
      valores_unicos: Object.keys(freqMap).length,
      moda,
      frecuencias: frecuencias.slice(0, 15) // Top 15
    };
  };

  const stats = computeStats();

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
              Analítica por Variable
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Análisis Descriptivo por Pregunta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore la distribución, frecuencias, modas y porcentajes de cada pregunta del formulario
          </p>
        </div>

        {/* Selector de Pregunta / Columna */}
        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Columns size={16} className="text-indigo-500" />
            Seleccione la Pregunta a Analizar:
          </label>
          <select
            value={columnaSeleccionada}
            onChange={(e) => setColumnaSeleccionada(e.target.value)}
            className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {metadata?.columnas.map((col, idx) => (
              <option key={idx} value={col}>
                {col.match(/^\d+\./) ? col : `[${idx + 1}] ${col}`}
              </option>
            ))}
          </select>
        </div>

        {/* Tarjetas de Métricas de la Pregunta */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={32} />
            <p className="font-bold text-sm">Cargando métricas...</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Respuestas Válidas</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.validos} / {stats.total}</h3>
              </div>
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sin Respuesta (Vacíos)</p>
                <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">{stats.vacios}</h3>
              </div>
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Valores Únicos</p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.valores_unicos}</h3>
              </div>
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Respuesta Más Frecuente</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1 truncate" title={stats.moda}>
                  {stats.moda}
                </h3>
              </div>
            </div>

            {/* Gráficos y Distribución */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <div className={`rounded-3xl p-6 border shadow-xl ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-500" />
                  Distribución de Frecuencias
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.frecuencias}>
                      <XAxis 
                        dataKey="opcion" 
                        stroke={theme === 'light' ? '#64748b' : '#94a3b8'} 
                        fontSize={10} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke={theme === 'light' ? '#64748b' : '#94a3b8'} 
                        fontSize={10} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                          borderColor: theme === 'light' ? '#e2e8f0' : '#334155', 
                          borderRadius: '12px',
                          color: theme === 'light' ? '#0f172a' : '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }} 
                      />
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
              <div className={`rounded-3xl p-6 border shadow-xl ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ListFilter size={18} className="text-purple-500" />
                  Desglose Detallado de Respuestas
                </h3>
                <div className="overflow-x-auto max-h-72 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className={`uppercase text-[11px] font-black tracking-wider ${
                      theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      <tr>
                        <th className="p-3">Opción / Valor</th>
                        <th className="p-3 text-center">Cantidad</th>
                        <th className="p-3 text-right">Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                      {stats.frecuencias.map((item, idx) => (
                        <tr key={idx} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}>
                          <td className={`p-3 font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{item.opcion}</td>
                          <td className="p-3 text-center font-mono font-bold">{item.cantidad}</td>
                          <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">{item.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}

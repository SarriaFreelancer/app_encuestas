"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { 
  Columns, BarChart3, PieChart as PieIcon, ListFilter, Loader2, 
  CheckCircle2, AlertCircle, Search, TrendingUp, Award, Layers, Hash
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#06b6d4', '#ef4444', '#84cc16', '#f97316'];

export default function AnalisisPreguntasPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'horizontal'>('horizontal');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [metaData, resData] = await Promise.all([
          fetchApi('/encuestas/metadatos'),
          fetchApi('/encuestas/respuestas')
        ]);
        setMetadata(metaData);
        setRespuestas(resData);
        if (metaData.columnas && metaData.columnas.length > 0) {
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
  const stats = useMemo(() => {
    if (!columnaSeleccionada || respuestas.length === 0) return null;

    const total = respuestas.length;
    const values = respuestas.map(r => r[columnaSeleccionada]);
    const validos = values.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    const vacios = total - validos.length;

    // Frecuencias
    const freqMap: Record<string, number> = {};
    validos.forEach(v => {
      const valStr = String(v).trim() || 'Sin respuesta';
      freqMap[valStr] = (freqMap[valStr] || 0) + 1;
    });

    let frecuencias = Object.keys(freqMap).map((k, idx) => {
      const cant = freqMap[k];
      return {
        opcion: k,
        name: k.length > 30 ? k.slice(0, 27) + '…' : k,
        fullLabel: k,
        cantidad: cant,
        value: cant,
        porcentaje: Number(((cant / total) * 100).toFixed(2)),
        color: COLORS[idx % COLORS.length]
      };
    }).sort((a, b) => b.cantidad - a.cantidad);

    // Moda
    const moda = frecuencias.length > 0 ? frecuencias[0].opcion : 'N/A';
    const pctModa = frecuencias.length > 0 ? frecuencias[0].porcentaje : 0;

    return {
      total,
      validos: validos.length,
      pctValidos: Number(((validos.length / total) * 100).toFixed(1)),
      vacios,
      pctVacios: Number(((vacios / total) * 100).toFixed(1)),
      valores_unicos: Object.keys(freqMap).length,
      moda,
      pctModa,
      frecuencias
    };
  }, [columnaSeleccionada, respuestas]);

  // Frecuencias filtradas por el buscador interno
  const filteredFrecuencias = useMemo(() => {
    if (!stats) return [];
    if (!filterText.trim()) return stats.frecuencias;
    const term = filterText.toLowerCase();
    return stats.frecuencias.filter(f => f.opcion.toLowerCase().includes(term));
  }, [stats, filterText]);

  // 1. GRÁFICO CIRCULAR / DONUT SVG CUSTOM
  const DonutChart = ({ data }: { data: any[] }) => {
    const topData = data.slice(0, 10);
    const sumVal = topData.reduce((acc, d) => acc + d.cantidad, 0);
    let currentAngle = 0;

    const slices = topData.map((d) => {
      const angle = (d.cantidad / (sumVal || 1)) * 360;
      const start = currentAngle;
      currentAngle += angle;
      return { ...d, startAngle: start, angle };
    });

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
        <div className="relative w-48 h-48 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {slices.map((slice, i) => {
              const radius = 38;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${(slice.angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((slice.startAngle / 360) * circumference);

              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="hover:opacity-80 transition-all cursor-pointer"
                >
                  <title>{`${slice.opcion}: ${slice.cantidad} (${slice.porcentaje}%)`}</title>
                </circle>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{sumVal}</span>
            <span className={`text-[9px] font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Muestra</span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2 w-full max-w-xs scrollbar-thin">
          {topData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className={`truncate font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`} title={item.opcion}>
                  {item.opcion}
                </span>
              </div>
              <span className="font-mono font-bold shrink-0">{item.cantidad} ({item.porcentaje}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. GRÁFICO DE BARRAS VERTICALES SVG CUSTOM
  const VerticalBarChart = ({ data }: { data: any[] }) => {
    const topData = data.slice(0, 12);
    const maxVal = Math.max(...topData.map(d => d.cantidad), 1);

    return (
      <div className="pt-4 pb-2 space-y-3">
        <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-800 pb-2 px-2">
          {topData.map((item, idx) => {
            const heightPct = Math.max(10, Math.round((item.cantidad / maxVal) * 100));

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                title={`${item.opcion}: ${item.cantidad} (${item.porcentaje}%)`}
              >
                <span className="text-[11px] font-bold mb-1 text-slate-400 group-hover:text-indigo-400 transition-colors">
                  {item.cantidad}
                </span>
                <div
                  className="w-full max-w-[38px] rounded-t-xl transition-all duration-300 group-hover:brightness-125 group-hover:scale-105 shadow-md"
                  style={{ height: `${heightPct}%`, backgroundColor: item.color }}
                />
              </div>
            );
          })}
        </div>
        {/* Etiquetas Eje X */}
        <div className="flex justify-between gap-2 px-1">
          {topData.map((item, idx) => (
            <div key={idx} className="flex-1 text-center truncate">
              <span className={`text-[10px] font-bold truncate block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`} title={item.opcion}>
                {item.name}
              </span>
              <span className="text-[10px] text-indigo-500 font-mono font-bold block">
                {item.porcentaje}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. GRÁFICO DE BARRAS HORIZONTALES CUSTOM
  const HorizontalBarChart = ({ data }: { data: any[] }) => {
    const topData = data.slice(0, 15);
    const maxVal = Math.max(...topData.map(d => d.cantidad), 1);

    return (
      <div className="space-y-3 pt-2 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
        {topData.map((item, idx) => {
          const pctWidth = Math.min(100, Math.max(4, Math.round((item.cantidad / maxVal) * 100)));

          return (
            <div key={idx} className="group p-2 rounded-2xl hover:bg-slate-800/30 transition-all space-y-1.5 border border-transparent hover:border-slate-800">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className={`font-bold truncate ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`} title={item.opcion}>
                  {item.opcion}
                </span>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="font-extrabold text-indigo-400">{item.cantidad}</span>
                  <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    ({item.porcentaje}%)
                  </span>
                </div>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden ${
                theme === 'light' ? 'bg-slate-200' : 'bg-slate-950/80 border border-slate-800'
              }`}>
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:brightness-125"
                  style={{ width: `${pctWidth}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
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
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Columns size={16} className="text-indigo-500" />
            Seleccione la Pregunta a Analizar:
          </label>
          <select
            value={columnaSeleccionada}
            onChange={(e) => {
              setColumnaSeleccionada(e.target.value);
              setFilterText('');
            }}
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

        {/* Contenido Principal de Métricas y Gráficos */}
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={36} />
            <p className="font-bold text-sm">Cargando métricas de la variable...</p>
          </div>
        ) : stats ? (
          <>
            {/* Tarjetas KPI Superiores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Respuestas Válidas</p>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.validos} / {stats.total}</h3>
                <span className="text-[10px] font-bold text-slate-400">{stats.pctValidos}% de la muestra total</span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Sin Respuesta (Vacíos)</p>
                  <AlertCircle size={16} className="text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">{stats.vacios}</h3>
                <span className="text-[10px] font-bold text-slate-400">{stats.pctVacios}% del total de registros</span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Valores Únicos</p>
                  <Hash size={16} className="text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.valores_unicos}</h3>
                <span className="text-[10px] font-bold text-slate-400">Opciones distintas</span>
              </div>

              <div className={`p-5 rounded-2xl border shadow-md ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Respuesta Más Frecuente</p>
                  <Award size={16} className="text-amber-500" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 truncate" title={stats.moda}>
                  {stats.moda}
                </h3>
                <span className="text-[10px] font-bold text-amber-500">{stats.pctModa}% de representatividad</span>
              </div>
            </div>

            {/* Panel de Gráficos e Inspección Descriptiva */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contenedor Gráfico Interactivo */}
              <div className={`rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-indigo-500" />
                      Visualización Gráfica
                    </h3>

                    {/* Selector de Tipo de Gráfico */}
                    <div className={`p-1 rounded-xl border flex gap-1 ${
                      theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}>
                      <button
                        onClick={() => setChartType('horizontal')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          chartType === 'horizontal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Barras Horizontales"
                      >
                        Horizontales
                      </button>
                      <button
                        onClick={() => setChartType('bar')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          chartType === 'bar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Columnas Verticales"
                      >
                        Verticales
                      </button>
                      <button
                        onClick={() => setChartType('pie')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          chartType === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Gráfico Circular (Donut)"
                      >
                        Donut
                      </button>
                    </div>
                  </div>

                  {/* Render del gráfico según tipo seleccionado */}
                  {chartType === 'horizontal' && <HorizontalBarChart data={stats.frecuencias} />}
                  {chartType === 'bar' && <VerticalBarChart data={stats.frecuencias} />}
                  {chartType === 'pie' && <DonutChart data={stats.frecuencias} />}
                </div>
              </div>

              {/* Tabla de Desglose Detallado con Buscador */}
              <div className={`rounded-3xl p-6 border shadow-xl flex flex-col justify-between ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ListFilter size={18} className="text-purple-500" />
                      Desglose Detallado ({stats.valores_unicos} opciones)
                    </h3>

                    {/* Buscador interno de opciones */}
                    <div className="relative w-full sm:w-48">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filtrar opción..."
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${
                          theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[380px] rounded-2xl border border-slate-200 dark:border-slate-800 scrollbar-thin">
                    <table className="w-full text-left text-xs">
                      <thead className={`uppercase text-[11px] font-black tracking-wider sticky top-0 ${
                        theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}>
                        <tr>
                          <th className="p-3">Opción / Valor</th>
                          <th className="p-3 text-center">Cantidad</th>
                          <th className="p-3 text-right">Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800'}`}>
                        {filteredFrecuencias.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-400">
                              No hay opciones que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredFrecuencias.map((item, idx) => (
                            <tr key={idx} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}>
                              <td className={`p-3 font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <span>{item.opcion}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-indigo-400">{item.cantidad}</td>
                              <td className="p-3 text-right font-mono font-black text-emerald-500">{item.porcentaje}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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


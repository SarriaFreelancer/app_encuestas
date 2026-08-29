"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import {
  Filter, RefreshCw, CheckCircle2, RotateCcw, Users, Heart, Home,
  AlertCircle, MapPin, Layers, GraduationCap, Briefcase, TrendingUp,
  Activity, FileWarning, ShieldAlert, Star, PieChart as PieIcon, BarChart3
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#06b6d4', '#ef4444', '#84cc16', '#f97316'];

export default function DashboardPage() {
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [meta, resp] = await Promise.all([
        fetchApi('/encuestas/metadatos'),
        fetchApi('/encuestas/respuestas')
      ]);
      setColumnas(meta.columnas || []);
      setRespuestas(resp || []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mapeo inteligente de columnas
  const C = useMemo(() => {
    const normalize = (txt: string) =>
      txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const find = (prefixes: string[]) => {
      for (const p of prefixes) {
        const normP = normalize(p);
        const match = columnas.find(c => normalize(c).includes(normP));
        if (match) return match;
      }
      return '';
    };

    return {
      sexo: find(['6. Sexo', 'sexo']),
      zona: find(['16. Zona', 'zona']),
      barrio: find(['17. Barrio', 'barrio']),
      discapacidad: find(['13.', 'discapacidad']),
      educacion: find(['51.', 'nivel educativo']),
      laboral: find(['52.', 'laboral actual', 'situacion laboral']),
      ingresos: find(['53.', 'fuente de ingresos']),
      hogar: find(['21.', 'personas viven']),
      anio: find(['41.', 'hecho victimizante principal', 'ano del hecho']),
      municipioOc: find(['42.', 'municipio donde']),
      tipoHecho: find(['45.', 'tipo de hecho']),
      afectacion: find(['46.', 'principal afectacion']),
      etnia: find(['10.', 'grupo etnico', 'pertenece a algun']),
      libreta: find(['9.', 'libreta militar']),
      necesPrinc: find(['66.', 'necesidad principal']),
      necesSecund: find(['67.', 'necesidad secundaria']),
      necesTerc: find(['68.', 'necesidad terciaria']),
      menores: find(['22.', 'menores de 18']),
    };
  }, [columnas]);

  const s = (v: any) => (v === undefined || v === null || String(v).trim() === '') ? '' : String(v).trim();

  // Filtrado reactivo en memoria
  const rows = useMemo(() => {
    return respuestas.filter(row => {
      return Object.entries(filters).every(([col, val]) => {
        if (!val) return true;
        return s(row[col]) === val;
      });
    });
  }, [respuestas, filters]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => setFilters({});
  const setFilter = (col: string, val: string) => {
    if (!col) return;
    setFilters(prev => ({ ...prev, [col]: prev[col] === val ? '' : val }));
  };

  // Cálculo de frecuencias
  const getFrecuencias = (colName: string, top = 8) => {
    if (!colName || rows.length === 0) return [];
    const freqMap: Record<string, number> = {};
    rows.forEach(r => {
      const raw = s(r[colName]);
      const valStr = raw || 'Sin respuesta';
      const label = valStr.length > 26 ? valStr.slice(0, 23) + '…' : valStr;
      freqMap[label] = (freqMap[label] || 0) + 1;
    });

    return Object.keys(freqMap).map(k => ({
      name: k,
      opcion: k,
      value: freqMap[k],
      cantidad: freqMap[k],
      porcentaje: Number(((freqMap[k] / rows.length) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value).slice(0, top);
  };

  const opts = (col: string) => {
    if (!col || respuestas.length === 0) return [];
    return Array.from(new Set(respuestas.map(r => s(r[col])).filter(Boolean))).sort();
  };

  // KPIs
  const sumCol = (col: string) => {
    if (!col) return 0;
    return rows.reduce((acc, r) => {
      const n = parseFloat(s(r[col]));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const totalMujeres = rows.filter(r => s(r[C.sexo]).toLowerCase().includes('femenino') || s(r[C.sexo]).toLowerCase() === 'mujer').length;
  const totalHombres = rows.filter(r => s(r[C.sexo]).toLowerCase().includes('masculino') || s(r[C.sexo]).toLowerCase() === 'hombre').length;
  const conDiscap = rows.filter(r => {
    const val = s(r[C.discapacidad]).toLowerCase();
    return val === 'si' || val === 'sí' || val.includes('si');
  }).length;
  const totalMenores = sumCol(C.menores);

  // Necesidades
  const necesidadesPrioridad = useMemo(() => {
    const cats = new Set<string>();
    rows.forEach(r => {
      [C.necesPrinc, C.necesSecund, C.necesTerc].forEach(col => {
        if (!col) return;
        const v = s(r[col]);
        if (v && v !== 'Sin respuesta') cats.add(v.length > 24 ? v.slice(0, 21) + '…' : v);
      });
    });
    return Array.from(cats).map(cat => ({
      name: cat,
      opcion: cat,
      Prioritaria: rows.filter(r => {
        const v = s(r[C.necesPrinc]); return (v.length > 24 ? v.slice(0, 21) + '…' : v) === cat;
      }).length,
      Secundaria: rows.filter(r => {
        const v = s(r[C.necesSecund]); return (v.length > 24 ? v.slice(0, 21) + '…' : v) === cat;
      }).length,
      Terciaria: rows.filter(r => {
        const v = s(r[C.necesTerc]); return (v.length > 24 ? v.slice(0, 21) + '…' : v) === cat;
      }).length,
    })).filter(d => d.Prioritaria + d.Secundaria + d.Terciaria > 0)
      .sort((a, b) => b.Prioritaria - a.Prioritaria).slice(0, 8);
  }, [rows, C]);

  // Timeline
  const anioData = useMemo(() => {
    if (!C.anio) return [];
    const m: Record<string, number> = {};
    rows.forEach(r => {
      const v = s(r[C.anio]).replace(/\D/g, '');
      if (v && v.length === 4 && Number(v) >= 1970 && Number(v) <= 2030) {
        m[v] = (m[v] || 0) + 1;
      }
    });
    return Object.entries(m).map(([anio, total]) => ({ anio, total, cantidad: total }))
      .sort((a, b) => Number(a.anio) - Number(b.anio));
  }, [rows, C]);

  // ==========================================
  // COMPONENTES GRÁFICOS 2D VECTORIALES
  // ==========================================

  // 1. GRÁFICO CIRCULAR / DONUT 2D (SVG PURO)
  const DonutPieChart2D = ({ data, onSelect }: { data: any[]; onSelect?: (item: any) => void }) => {
    const total = data.reduce((acc, d) => acc + (d.value || d.cantidad || 0), 0) || 1;
    let accumulatedAngle = 0;

    const slices = data.map((d, idx) => {
      const val = d.value || d.cantidad || 0;
      const angle = (val / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return {
        ...d,
        startAngle,
        angle,
        endAngle: accumulatedAngle,
        color: COLORS[idx % COLORS.length]
      };
    });

    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0">
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
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => onSelect && onSelect(slice)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-black text-white">{total}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-1.5 w-full">
          {slices.map((slice, i) => (
            <div
              key={i}
              onClick={() => onSelect && onSelect(slice)}
              className="flex items-center justify-between text-xs hover:bg-slate-800/50 p-1 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 truncate max-w-[65%]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-slate-300 truncate" title={slice.name}>{slice.name}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="font-bold text-white">{slice.value || slice.cantidad}</span>
                <span className="text-slate-400">({slice.porcentaje}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. GRÁFICO DE COLUMNAS VERTICALES 2D (BARRAS VERTICALES)
  const VerticalColumnsChart2D = ({ data, onSelect }: { data: any[]; onSelect?: (item: any) => void }) => {
    const maxVal = Math.max(...data.map(d => d.value || d.cantidad || 1), 1);

    return (
      <div className="pt-4 pb-2">
        <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-800 pb-2 px-1">
          {data.map((item, idx) => {
            const val = item.value || item.cantidad || 0;
            const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
            const color = COLORS[idx % COLORS.length];

            return (
              <div
                key={idx}
                onClick={() => onSelect && onSelect(item)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                title={`${item.name}: ${val} (${item.porcentaje}%)`}
              >
                <span className="text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {val}
                </span>
                <div
                  className="w-full max-w-[34px] rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{ height: `${heightPct}%`, backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>
        {/* Etiquetas X */}
        <div className="flex justify-between gap-2 pt-2 px-1">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 text-center truncate">
              <span className="text-[10px] text-slate-400 font-medium truncate block" title={item.name}>
                {item.name}
              </span>
              <span className="text-[9px] text-indigo-400 font-bold font-mono block">
                {item.value || item.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. GRÁFICO DE BARRAS HORIZONTALES CLÁSICAS 2D
  const HorizontalBarChart2D = ({ data, onSelect }: { data: any[]; onSelect?: (item: any) => void }) => {
    const maxVal = Math.max(...data.map(d => d.cantidad || d.value || 1));

    return (
      <div className="space-y-3 pt-2">
        {data.map((item, idx) => {
          const val = item.cantidad || item.value || 0;
          const pct = Math.min(100, Math.round((val / maxVal) * 100));
          const color = COLORS[idx % COLORS.length];

          return (
            <div
              key={idx}
              onClick={() => onSelect && onSelect(item)}
              className="group cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-xl transition-all"
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-200 group-hover:text-white truncate max-w-[70%]" title={item.name || item.opcion}>
                  {item.name || item.opcion}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{val}</span>
                  {item.porcentaje !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">({item.porcentaje}%)</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 4. GRÁFICO ÁREA / LÍNEA 2D INTERACTIVA PARA SERIES TEMPORALES
  const TimelineAreaChart2D = ({ data }: { data: any[] }) => {
    const maxVal = Math.max(...data.map(d => d.total || 1), 1);

    return (
      <div className="space-y-3 pt-2">
        <div className="h-36 flex items-end justify-between gap-1.5 border-b border-slate-800 pb-2 px-2">
          {data.map((d, idx) => {
            const heightPct = Math.max(10, Math.round((d.total / maxVal) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${d.anio}: ${d.total} víctimas`}>
                <span className="text-[9px] font-bold text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                  {d.total}
                </span>
                <div
                  className="w-full max-w-[28px] bg-gradient-to-t from-rose-600 to-amber-500 rounded-t-md transition-all group-hover:scale-105"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[9px] font-mono text-slate-400 mt-1.5 group-hover:text-white">
                  {d.anio.slice(2)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 text-center">
          Distribución cronológica de ocurrencia de hechos victimizantes
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-6 space-y-6">

        {/* HEADER STICKY */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl px-5 py-4 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-bold">
                Sincronizado con Google Sheets ({respuestas.length} registros cargados)
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              Dashboard Analítico — Multi-Tipos de Gráficos 2D
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} /> Limpiar ({activeFiltersCount})
              </button>
            )}

            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Filter size={14} /> Filtros
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white text-indigo-700 rounded-full font-black text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Recargar datos"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* TARJETAS KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Registros', value: rows.length, color: 'text-white', bg: 'bg-indigo-600/20', border: 'border-indigo-500/30', icon: <Users size={18} /> },
            { label: 'Mujeres', value: totalMujeres, color: 'text-pink-400', bg: 'bg-pink-600/10', border: 'border-pink-500/20', icon: <Heart size={18} /> },
            { label: 'Hombres', value: totalHombres, color: 'text-indigo-300', bg: 'bg-indigo-600/10', border: 'border-indigo-500/20', icon: <Users size={18} /> },
            { label: 'Con Discapacidad', value: conDiscap, color: 'text-amber-400', bg: 'bg-amber-600/10', border: 'border-amber-500/20', icon: <AlertCircle size={18} /> },
            { label: 'Total Menores', value: Math.round(totalMenores), color: 'text-emerald-400', bg: 'bg-emerald-600/10', border: 'border-emerald-500/20', icon: <Star size={18} /> },
            { label: 'Columnas', value: columnas.length, color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/20', icon: <Layers size={18} /> },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} border ${kpi.border} rounded-3xl p-4 shadow-lg flex flex-col gap-1`}>
              <div className={`${kpi.bg} rounded-xl w-8 h-8 flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{kpi.label}</p>
              <h3 className={`text-2xl font-black ${kpi.color}`}>
                {loading ? '...' : kpi.value.toLocaleString()}
              </h3>
            </div>
          ))}
        </div>

        {/* === FILA 1: PASTEL (SEXO) + PASTEL (ZONA) + PASTEL/DONUT (DISCAPACIDAD) === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Gráfico Circular 2D - Sexo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold text-white">Distribución por Sexo</h4>
              </div>
              <PieIcon size={16} className="text-pink-400" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.sexo, 5)}
              onSelect={(item) => setFilter(C.sexo, item.opcion)}
            />
          </div>

          {/* 2. Gráfico Circular 2D - Zona */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold text-white">Distribución por Zona</h4>
              </div>
              <PieIcon size={16} className="text-cyan-400" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.zona, 4)}
              onSelect={(item) => setFilter(C.zona, item.opcion)}
            />
          </div>

          {/* 3. Gráfico Circular 2D - Discapacidad */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold text-white">Condición de Discapacidad</h4>
              </div>
              <PieIcon size={16} className="text-amber-400" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.discapacidad, 4)}
              onSelect={(item) => setFilter(C.discapacidad, item.opcion)}
            />
          </div>
        </div>

        {/* === TIMELINE: EVOLUCIÓN HISTÓRICA === */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="mb-2">
            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">Gráfico de Columnas Cronológicas 2D</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Evolución Temporal — Año del Hecho Victimizante Principal</h4>
          </div>
          <TimelineAreaChart2D data={anioData} />
        </div>

        {/* === FILA 2: COLUMNAS VERTICALES 2D (TIPO DE HECHO + AFECTACIÓN) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columnas Verticales 2D - Tipo de Hecho */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold text-white">Tipo de Hecho Victimizante</h4>
              </div>
              <BarChart3 size={16} className="text-rose-400" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.tipoHecho, 6)}
              onSelect={(item) => setFilter(C.tipoHecho, item.opcion)}
            />
          </div>

          {/* Barras Horizontales - Principal Afectación */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold text-white">Principal Afectación Generada</h4>
              </div>
              <BarChart3 size={16} className="text-purple-400" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.afectacion, 6)}
              onSelect={(item) => setFilter(C.afectacion, item.opcion)}
            />
          </div>
        </div>

        {/* === NECESIDADES POR PRIORIDAD (TARJETAS ANALÍTICAS 2D) === */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="mb-4">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Visualización Multidimensional</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Necesidades del Hogar — Prioritaria, Secundaria y Terciaria</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {necesidadesPrioridad.map((n, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-colors">
                <h5 className="font-bold text-xs text-white truncate" title={n.name}>
                  {n.name}
                </h5>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-rose-400 font-semibold">
                    <span>1ª Prioritaria:</span>
                    <span className="font-bold font-mono">{n.Prioritaria}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-400 font-semibold">
                    <span>2ª Secundaria:</span>
                    <span className="font-bold font-mono">{n.Secundaria}</span>
                  </div>
                  <div className="flex justify-between items-center text-indigo-400 font-semibold">
                    <span>3ª Terciaria:</span>
                    <span className="font-bold font-mono">{n.Terciaria}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === FILA 3: COLUMNAS VERTICALES (NIVEL EDUCATIVO) + BARRAS (SITUACIÓN LABORAL) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columnas 2D - Nivel Educativo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold text-white">Nivel Educativo Alcanzado</h4>
              </div>
              <BarChart3 size={16} className="text-indigo-400" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.educacion, 6)}
              onSelect={(item) => setFilter(C.educacion, item.opcion)}
            />
          </div>

          {/* Barras 2D - Situación Laboral */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold text-white">Situación Laboral Actual</h4>
              </div>
              <BarChart3 size={16} className="text-emerald-400" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.laboral, 6)}
              onSelect={(item) => setFilter(C.laboral, item.opcion)}
            />
          </div>
        </div>

        {/* === FILA 4: BARRAS (INGRESOS) + COLUMNAS (MUNICIPIOS) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Gráfico de Barras</span>
                <h4 className="text-sm font-bold text-white">Principal Fuente de Ingresos del Hogar</h4>
              </div>
              <BarChart3 size={16} className="text-amber-400" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.ingresos, 6)}
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold text-white">Municipio donde Ocurrió el Hecho</h4>
              </div>
              <BarChart3 size={16} className="text-indigo-400" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.municipioOc, 6)}
              onSelect={(item) => setFilter(C.municipioOc, item.opcion)}
            />
          </div>
        </div>

        {/* === FILA 5: PASTEL (LIBRETA MILITAR) + COLUMNAS (GRUPO ÉTNICO) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Circular / Pastel 2D - Libreta Militar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold text-white">Libreta Militar (Hombres)</h4>
              </div>
              <PieIcon size={16} className="text-indigo-400" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.libreta, 4)}
            />
          </div>

          {/* Columnas 2D - Grupo Étnico */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold text-white">Pertenencia a Grupo Étnico</h4>
              </div>
              <BarChart3 size={16} className="text-purple-400" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.etnia, 5)}
              onSelect={(item) => setFilter(C.etnia, item.opcion)}
            />
          </div>
        </div>

      </main>

      {/* PANEL DE FILTROS LATERAL */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsFilterDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-slate-900 border-l border-slate-800 p-6 flex flex-col z-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold text-white">Panel de Filtros</h3>
              </div>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {[
                { label: 'Sexo', col: C.sexo },
                { label: 'Zona (Urbana / Rural)', col: C.zona },
                { label: 'Barrio / Vereda', col: C.barrio },
                { label: 'Discapacidad', col: C.discapacidad },
                { label: 'Nivel Educativo', col: C.educacion },
                { label: 'Situación Laboral', col: C.laboral },
                { label: 'Fuente de Ingresos', col: C.ingresos },
                { label: 'Tipo de Hecho Victimizante', col: C.tipoHecho },
                { label: 'Municipio del Hecho', col: C.municipioOc },
                { label: 'Necesidad Principal', col: C.necesPrinc },
                { label: 'Grupo Étnico', col: C.etnia },
              ].map(({ label, col }) => col ? (
                <div key={col}>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">{label}</label>
                  <select
                    value={filters[col] || ''}
                    onChange={e => setFilters(prev => ({ ...prev, [col]: e.target.value || '' }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todos</option>
                    {opts(col).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : null)}
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-3 mt-4">
              <button onClick={clearFilters}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-xs cursor-pointer">
                Limpiar Todo
              </button>
              <button onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 cursor-pointer">
                Aplicar {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

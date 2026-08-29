"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Filter, RefreshCw, CheckCircle2, RotateCcw, Users, Heart, Home,
  AlertCircle, MapPin, Layers, GraduationCap, Briefcase, TrendingUp,
  Activity, FileWarning, ShieldAlert, Star, PieChart as PieIcon, BarChart3,
  Calculator, ChevronDown, Check, X
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#06b6d4', '#ef4444', '#84cc16', '#f97316'];

export default function DashboardPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filtros globales interactivos
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
      edad: find(['4. Edad', 'edad']),
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

  // Cálculos de KPIs
  const sumCol = (col: string) => {
    if (!col) return 0;
    return rows.reduce((acc, r) => {
      const n = parseFloat(s(r[col]));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const totalPersonasHogar = sumCol(C.hogar);
  const avgIntegrantes = rows.length > 0 ? (totalPersonasHogar / rows.length).toFixed(1) : '0';
  const totalMenores = sumCol(C.menores);
  const totalMayores = Math.max(0, totalPersonasHogar - totalMenores);

  // Necesidades agrupadas (Prioritaria, Secundaria, Terciaria)
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
      .sort((a, b) => b.Prioritaria - a.Prioritaria).slice(0, 7);
  }, [rows, C]);

  // Timeline (Evolución de Hechos por Año)
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

  // 1. GRÁFICO CIRCULAR / PASTEL 2D (DONUT SVG)
  const DonutPieChart2D = ({ data, onSelect, activeVal }: { data: any[]; onSelect?: (item: any) => void; activeVal?: string }) => {
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
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {slices.map((slice, i) => {
              const radius = 38;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${(slice.angle / 360) * circumference} ${circumference}`;
              const strokeDashoffset = -((slice.startAngle / 360) * circumference);
              const isSelected = activeVal === slice.opcion;

              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isSelected ? "22" : "18"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer hover:opacity-80 transition-all"
                  onClick={() => onSelect && onSelect(slice)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{total}</span>
            <span className={`text-[9px] font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Total</span>
          </div>
        </div>

        {/* Leyenda 100% autocontenida */}
        <div className="flex-1 space-y-1.5 w-full min-w-0">
          {slices.map((slice, i) => {
            const isSelected = activeVal === slice.opcion;
            return (
              <div
                key={i}
                onClick={() => onSelect && onSelect(slice)}
                className={`flex items-center justify-between gap-1 text-[11px] p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-indigo-600/20 border border-indigo-500/40 font-bold' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className={`truncate ${
                    isSelected 
                      ? 'font-black text-indigo-600 dark:text-indigo-400' 
                      : theme === 'light' ? 'font-bold text-slate-800 hover:text-indigo-600' : 'font-semibold text-slate-200 hover:text-white'
                  }`} title={slice.name}>
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                  <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {slice.value || slice.cantidad}
                  </span>
                  <span className={theme === 'light' ? 'text-slate-500 font-semibold' : 'text-slate-400'}>
                    ({slice.porcentaje}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. GRÁFICO DE COLUMNAS VERTICALES 2D
  const VerticalColumnsChart2D = ({ data, onSelect, activeVal }: { data: any[]; onSelect?: (item: any) => void; activeVal?: string }) => {
    const maxVal = Math.max(...data.map(d => d.value || d.cantidad || 1), 1);

    return (
      <div className="pt-4 pb-2">
        <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-800 pb-2 px-1">
          {data.map((item, idx) => {
            const val = item.value || item.cantidad || 0;
            const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
            const color = COLORS[idx % COLORS.length];
            const isSelected = activeVal === item.opcion;

            return (
              <div
                key={idx}
                onClick={() => onSelect && onSelect(item)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                title={`${item.name}: ${val} (${item.porcentaje}%)`}
              >
                <span className={`text-[10px] font-bold mb-1 transition-opacity ${isSelected ? 'opacity-100 text-indigo-300' : 'opacity-0 group-hover:opacity-100 text-slate-300'}`}>
                  {val}
                </span>
                <div
                  className={`w-full max-w-[34px] rounded-t-lg transition-all duration-300 ${isSelected ? 'ring-2 ring-white scale-105' : 'group-hover:brightness-125'}`}
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
              <span className={`text-[10px] font-bold truncate block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`} title={item.name}>
                {item.name}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black font-mono block">
                {item.value || item.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. GRÁFICO DE COLUMNAS AGRUPADAS 2D (NECESIDADES PRIORITARIA / SECUNDARIA / TERCIARIA)
  const GroupedColumnsChart2D = ({ data }: { data: any[] }) => {
    const allVals = data.flatMap(d => [d.Prioritaria, d.Secundaria, d.Terciaria]);
    const maxVal = Math.max(...allVals, 1);

    return (
      <div className="pt-3 pb-2 space-y-3">
        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>1ª Prioritaria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>2ª Secundaria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>3ª Terciaria</span>
          </div>
        </div>

        {/* Columnas agrupadas */}
        <div className={`h-48 flex items-end justify-between gap-3 border-b pb-2 px-2 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {data.map((item, idx) => {
            const hP = Math.max(4, Math.round((item.Prioritaria / maxVal) * 100));
            const hS = Math.max(4, Math.round((item.Secundaria / maxVal) * 100));
            const hT = Math.max(4, Math.round((item.Terciaria / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  <div
                    className="w-full max-w-[12px] bg-rose-500 rounded-t-sm transition-all group-hover:brightness-110"
                    style={{ height: `${hP}%` }}
                    title={`Prioritaria: ${item.Prioritaria}`}
                  />
                  <div
                    className="w-full max-w-[12px] bg-amber-500 rounded-t-sm transition-all group-hover:brightness-110"
                    style={{ height: `${hS}%` }}
                    title={`Secundaria: ${item.Secundaria}`}
                  />
                  <div
                    className="w-full max-w-[12px] bg-indigo-500 rounded-t-sm transition-all group-hover:brightness-110"
                    style={{ height: `${hT}%` }}
                    title={`Terciaria: ${item.Terciaria}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Etiquetas X */}
        <div className="flex justify-between gap-3 px-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 text-center truncate">
              <span className={`text-[10px] font-bold truncate block ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`} title={item.name}>
                {item.name}
              </span>
              <span className={`text-[9px] font-mono font-bold block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {item.Prioritaria}/{item.Secundaria}/{item.Terciaria}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 4. GRÁFICO DE COLUMNAS 2D: COMPOSICIÓN DEL HOGAR (MENORES VS MAYORES)
  const HouseholdCompositionChart2D = ({ menores, mayores }: { menores: number; mayores: number }) => {
    const total = menores + mayores || 1;
    const pctMenores = ((menores / total) * 100).toFixed(1);
    const pctMayores = ((mayores / total) * 100).toFixed(1);
    const maxVal = Math.max(menores, mayores, 1);
    const hMenores = Math.max(10, Math.round((menores / maxVal) * 100));
    const hMayores = Math.max(10, Math.round((mayores / maxVal) * 100));

    return (
      <div className="pt-3 pb-2 space-y-4">
        <div className="h-44 flex items-end justify-center gap-12 border-b border-slate-800 pb-2">
          {/* Menores de edad */}
          <div className="flex flex-col items-center justify-end h-full w-28 group">
            <span className="text-sm font-black text-emerald-400 mb-1">{menores} ({pctMenores}%)</span>
            <div
              className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all group-hover:scale-105 shadow-lg shadow-emerald-600/20"
              style={{ height: `${hMenores}%` }}
            />
            <span className="text-xs font-bold text-white mt-2">Menores de 18</span>
            <span className="text-[10px] text-slate-400">Niños/Adolescentes</span>
          </div>

          {/* Mayores de edad */}
          <div className="flex flex-col items-center justify-end h-full w-28 group">
            <span className="text-sm font-black text-indigo-400 mb-1">{mayores} ({pctMayores}%)</span>
            <div
              className="w-full bg-gradient-to-t from-indigo-600 to-violet-400 rounded-t-xl transition-all group-hover:scale-105 shadow-lg shadow-indigo-600/20"
              style={{ height: `${hMayores}%` }}
            />
            <span className="text-xs font-bold text-white mt-2">Mayores de 18</span>
            <span className="text-[10px] text-slate-400">Adultos / Mayores</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
          <span className="text-slate-400">Total Personas en Hogares Censados:</span>
          <span className="font-mono font-black text-white text-sm">{total} personas</span>
        </div>
      </div>
    );
  };

  // 5. GRÁFICO DE LÍNEA DE TIEMPO ESTILIZADO (ECUALIZADOR CRONOLÓGICO CON FILTRADO CRUZADO)
  const LineChart2D = ({ data }: { data: any[] }) => {
    if (data.length === 0) return <div className="text-xs text-slate-500 py-6 text-center">Sin datos de timeline</div>;

    const maxVal = Math.max(...data.map(d => d.total || 1), 1);
    const activeAnio = filters[C.anio] || '';

    return (
      <div className="pt-2 pb-1 space-y-3 w-full min-w-0">
        {/* Contenedor con scroll horizontal suave si la pantalla es estrecha para evitar desbordes */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
          <div className="h-44 min-w-[500px] flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-800 pb-2 px-1">
            {data.map((d, i) => {
              const heightPct = Math.max(12, Math.round((d.total / maxVal) * 100));
              const isPeak = d.total === maxVal;
              const isSelected = activeAnio === d.anio;

              return (
                <div
                  key={i}
                  onClick={() => setFilter(C.anio, d.anio)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer p-0.5 sm:p-1 rounded-xl transition-all ${
                    isSelected ? 'bg-indigo-600/30 ring-2 ring-indigo-400' : 'hover:bg-slate-800/40'
                  }`}
                  title={`Filtrar por año ${d.anio}: ${d.total} víctimas`}
                >
                  {/* Valor superior */}
                  <span className={`text-[10px] font-black font-mono mb-1 transition-all ${
                    isSelected ? 'text-white font-black scale-110' : isPeak ? 'text-amber-400 font-bold' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                  }`}>
                    {d.total}
                  </span>

                  {/* Barra con gradiente */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-indigo-600 via-indigo-400 to-white shadow-lg shadow-indigo-500/50 scale-105'
                        : isPeak
                        ? 'bg-gradient-to-t from-rose-600 via-rose-500 to-amber-400 shadow-lg shadow-rose-500/30 ring-1 ring-amber-300'
                        : 'bg-gradient-to-t from-slate-800 via-rose-900/60 to-rose-500/80 group-hover:from-rose-700 group-hover:to-rose-400'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Año */}
                  <span className={`text-[10px] font-mono mt-1.5 transition-colors ${
                    isSelected ? 'text-indigo-300 font-black' : isPeak ? 'text-amber-300 font-bold' : 'text-slate-400 group-hover:text-white'
                  }`}>
                    {d.anio}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen inferior */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
          <div>
            {activeAnio ? (
              <span className="text-indigo-400 font-bold">Filtrando por año: {activeAnio} (Haz clic para deseleccionar)</span>
            ) : (
              <span>Pico histórico principal: <strong className="text-amber-400">Año 2012 (79 víctimas)</strong></span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-500">Período 1985 – 2016 (Haz clic en una barra para filtrar)</span>
        </div>
      </div>
    );
  };

  // 6. GRÁFICO DE BARRAS HORIZONTALES 2D
  const HorizontalBarChart2D = ({ data, onSelect, activeVal }: { data: any[]; onSelect?: (item: any) => void; activeVal?: string }) => {
    const maxVal = Math.max(...data.map(d => d.cantidad || d.value || 1));

    return (
      <div className="space-y-2.5 pt-2">
        {data.map((item, idx) => {
          const val = item.cantidad || item.value || 0;
          const pct = Math.min(100, Math.round((val / maxVal) * 100));
          const color = COLORS[idx % COLORS.length];
          const isSelected = activeVal === item.opcion;

          return (
            <div
              key={idx}
              onClick={() => onSelect && onSelect(item)}
              className={`group cursor-pointer p-1 rounded-xl transition-all ${
                isSelected 
                  ? 'bg-indigo-600/15 border border-indigo-500/30' 
                  : ''
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1">
                <span 
                  className={`truncate max-w-[70%] text-xs transition-colors ${
                    isSelected 
                      ? 'font-black text-indigo-600 dark:text-indigo-400' 
                      : theme === 'light' 
                      ? 'font-bold text-slate-800 group-hover:text-indigo-600' 
                      : 'font-semibold text-slate-200 group-hover:text-white'
                  }`} 
                  title={item.name || item.opcion}
                >
                  {item.name || item.opcion}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {val}
                  </span>
                  {item.porcentaje !== undefined && (
                    <span className={theme === 'light' ? 'text-slate-500 font-semibold' : 'text-slate-400'}>
                      ({item.porcentaje}%)
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 overflow-hidden ${
                theme === 'light' ? 'bg-slate-200/80' : 'bg-slate-800'
              }`}>
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Controles de filtro superiores rápidos
  const filterControls = [
    { label: 'Sexo', col: C.sexo },
    { label: 'Zona', col: C.zona },
    { label: 'Tipo de Hecho', col: C.tipoHecho },
    { label: 'Necesidad', col: C.necesPrinc },
    { label: 'Libreta Militar', col: C.libreta },
    { label: 'Principal Afectación', col: C.afectacion },
    { label: 'Municipio', col: C.municipioOc },
    { label: 'Nivel Educativo', col: C.educacion },
  ];

  return (
    <div className={`min-h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />

      <main className={`flex-1 p-3 sm:p-5 md:p-6 space-y-6 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>

        {/* HEADER STICKY */}
        <div className={`border rounded-3xl px-4 sm:px-5 py-4 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30 backdrop-blur-md ${
          theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-bold">
                Sincronizado con Google Sheets ({respuestas.length} registros válidos)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">
              Dashboard Analítico — Caracterización Víctimas del Conflicto Armado
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} /> Limpiar ({activeFiltersCount})
              </button>
            )}

            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Filter size={14} /> Panel Filtros
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white text-indigo-700 rounded-full font-black text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={loadData}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Recargar datos"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* BARRA SUPERIOR DE BOTONERA DE CONTROLES DE FILTRO (RESPONSIVA REORGANIZABLE) */}
        <div className={`border rounded-3xl p-4 shadow-lg space-y-3 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Controles de Filtro Rápido
              </span>
            </div>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] text-amber-500 font-bold">
                {activeFiltersCount} filtro(s) activo(s)
              </span>
            )}
          </div>

          {/* Grid responsivo: 2 col en móvil, 3 en tablet, 4 en laptop y hasta 8 en pantallas anchas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-2">
            {filterControls.map(({ label, col }) => {
              if (!col) return null;
              const options = opts(col);
              const currentVal = filters[col] || '';

              return (
                <div key={col} className="relative w-full">
                  <select
                    value={currentVal}
                    onChange={(e) => setFilters(prev => ({ ...prev, [col]: e.target.value || '' }))}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold focus:outline-none transition-all cursor-pointer truncate ${
                      currentVal
                        ? 'bg-indigo-600 text-white border border-indigo-400'
                        : theme === 'light'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <option value="">{label} (Todos)</option>
                    {options.map(o => (
                      <option key={o} value={o}>
                        {o.length > 25 ? o.slice(0, 22) + '…' : o}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* TARJETAS DE RESUMEN (KPIS SOLICITADOS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total de Registros', value: rows.length, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <Users size={18} /> },
            { label: 'Total Personas', value: totalPersonasHogar || rows.length, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: <Users size={18} /> },
            { label: 'Promedio Integrantes', value: avgIntegrantes, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Calculator size={18} /> },
            { label: 'Menores de Edad', value: Math.round(totalMenores), color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: <Star size={18} /> },
            { label: 'Mayores de Edad', value: Math.round(totalMayores), color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <Users size={18} /> },
            { label: 'Preguntas / Variables', value: columnas.length, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Layers size={18} /> },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} border ${kpi.border} rounded-3xl p-4 shadow-lg flex flex-col gap-1`}>
              <div className={`${kpi.bg} rounded-xl w-8 h-8 flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{kpi.label}</p>
              <h3 className={`text-2xl font-black ${kpi.color}`}>
                {loading ? '...' : kpi.value.toLocaleString()}
              </h3>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* FILA 1: DISTRIBUCIÓN POR SEXO (CIRCULAR CORREGIDO) + ZONA (CIRCULAR) + FUENTE DE INGRESOS (CIRCULAR) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Sexo (Gráfico Circular 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold">Distribución por Sexo</h4>
              </div>
              <PieIcon size={16} className="text-pink-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.sexo, 5)}
              activeVal={filters[C.sexo]}
              onSelect={(item) => setFilter(C.sexo, item.opcion)}
            />
          </div>

          {/* 2. Zona (Gráfico Circular 2D - Rural vs Urbana) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold">Zona (Rural vs Urbana)</h4>
              </div>
              <PieIcon size={16} className="text-cyan-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.zona, 4)}
              activeVal={filters[C.zona]}
              onSelect={(item) => setFilter(C.zona, item.opcion)}
            />
          </div>

          {/* 3. Fuente de Ingresos (Gráfico Circular 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold">Fuente de Ingresos</h4>
              </div>
              <PieIcon size={16} className="text-amber-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.ingresos, 5)}
              activeVal={filters[C.ingresos]}
              onSelect={(item) => setFilter(C.ingresos, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 2: EVOLUCIÓN DE HECHOS POR AÑO (GRÁFICO DE LÍNEAS VECTORIAL) */}
        {/* ========================================================= */}
        <div className={`border rounded-3xl p-5 shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">Línea de Tiempo 2D</span>
              <h4 className="text-sm font-bold mt-0.5">Evolución de Hechos por Año (Hecho Victimizante Principal)</h4>
            </div>
            <TrendingUp size={16} className="text-rose-500" />
          </div>
          <LineChart2D data={anioData} />
        </div>

        {/* ========================================================= */}
        {/* FILA 3: TIPO DE HECHO (BARRAS HORIZONTALES) + MUNICIPIO DE HECHO (BARRAS HORIZONTALES) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tipo de Hecho Victimizante (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold">Tipo de Hecho Victimizante</h4>
              </div>
              <BarChart3 size={16} className="text-rose-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.tipoHecho, 7)}
              activeVal={filters[C.tipoHecho]}
              onSelect={(item) => setFilter(C.tipoHecho, item.opcion)}
            />
          </div>

          {/* Municipio de Ocurrencia (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold">Municipio de Hecho Victimizante</h4>
              </div>
              <MapPin size={16} className="text-indigo-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.municipioOc, 7)}
              activeVal={filters[C.municipioOc]}
              onSelect={(item) => setFilter(C.municipioOc, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 4: NECESIDADES (COLUMNAS AGRUPADAS) + COMPOSICIÓN DEL HOGAR (COLUMNAS) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Necesidades (Columnas Agrupadas: Prioritaria, Secundaria, Terciaria) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Gráfico de Columnas Agrupadas 2D</span>
                <h4 className="text-sm font-bold">Necesidades (Prioritaria, Secundaria, Terciaria)</h4>
              </div>
              <Layers size={16} className="text-emerald-500" />
            </div>
            <GroupedColumnsChart2D data={necesidadesPrioridad} />
          </div>

          {/* Composición del Hogar (Columnas: Menores vs Mayores de Edad) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-teal-500 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold">Composición del Hogar (Menores vs Mayores de Edad)</h4>
              </div>
              <Users size={16} className="text-teal-500" />
            </div>
            <HouseholdCompositionChart2D menores={totalMenores} mayores={totalMayores} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 5: NIVEL EDUCATIVO (COLUMNAS) + SITUACIÓN LABORAL (COLUMNAS) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nivel Educativo (Columnas) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold">Nivel Educativo</h4>
              </div>
              <GraduationCap size={16} className="text-indigo-500" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.educacion, 6)}
              activeVal={filters[C.educacion]}
              onSelect={(item) => setFilter(C.educacion, item.opcion)}
            />
          </div>

          {/* Situación Laboral (Columnas) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Gráfico de Columnas 2D</span>
                <h4 className="text-sm font-bold">Situación Laboral</h4>
              </div>
              <Briefcase size={16} className="text-emerald-500" />
            </div>
            <VerticalColumnsChart2D
              data={getFrecuencias(C.laboral, 6)}
              activeVal={filters[C.laboral]}
              onSelect={(item) => setFilter(C.laboral, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 6: LIBRETA MILITAR (CIRCULAR) + DISCAPACIDAD (CIRCULAR) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Libreta Militar (Gráfico Circular 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold">Libreta Militar (Hombres)</h4>
              </div>
              <PieIcon size={16} className="text-indigo-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.libreta, 4)}
              activeVal={filters[C.libreta]}
              onSelect={(item) => setFilter(C.libreta, item.opcion)}
            />
          </div>

          {/* Condición de Discapacidad (Gráfico Circular 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Gráfico Circular 2D</span>
                <h4 className="text-sm font-bold">Condición de Discapacidad</h4>
              </div>
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.discapacidad, 4)}
              activeVal={filters[C.discapacidad]}
              onSelect={(item) => setFilter(C.discapacidad, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 7: PRINCIPAL AFECTACIÓN (BARRAS HORIZONTALES) + DISTRIBUCIÓN POR BARRIO/VEREDA (BARRAS HORIZONTALES) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Principal Afectación (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold">Principal Afectación</h4>
              </div>
              <FileWarning size={16} className="text-purple-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.afectacion, 7)}
              activeVal={filters[C.afectacion]}
              onSelect={(item) => setFilter(C.afectacion, item.opcion)}
            />
          </div>

          {/* Distribución por Barrio / Vereda (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-wider">Gráfico de Barras Horizontales</span>
                <h4 className="text-sm font-bold">Distribución por Barrio / Vereda</h4>
              </div>
              <MapPin size={16} className="text-cyan-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.barrio, 7)}
              activeVal={filters[C.barrio]}
              onSelect={(item) => setFilter(C.barrio, item.opcion)}
            />
          </div>
        </div>

      </main>

      {/* PANEL DE FILTROS LATERAL */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsFilterDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className={`relative w-full max-w-sm border-l p-6 flex flex-col z-50 shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold">Panel Completo de Filtros</h3>
              </div>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">✕</button>
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
                { label: 'Libreta Militar', col: C.libreta },
              ].map(({ label, col }) => col ? (
                <div key={col}>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>{label}</label>
                  <select
                    value={filters[col] || ''}
                    onChange={e => setFilters(prev => ({ ...prev, [col]: e.target.value || '' }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="">Todos</option>
                    {opts(col).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : null)}
            </div>

            <div className={`pt-4 border-t flex gap-3 mt-4 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
              <button onClick={clearFilters}
                className={`flex-1 py-2.5 font-semibold rounded-2xl text-xs cursor-pointer ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}>
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

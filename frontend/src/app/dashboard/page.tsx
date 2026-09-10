"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Filter, RefreshCw, CheckCircle2, RotateCcw, Users, Heart, Home,
  AlertCircle, MapPin, Layers, GraduationCap, Briefcase, TrendingUp,
  Activity, FileWarning, ShieldAlert, ShieldCheck, ShieldX, Star, PieChart as PieIcon, BarChart3,
  Calculator, ChevronDown, ChevronUp, Check, X, Database
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#06b6d4', '#ef4444', '#84cc16', '#f97316'];

export default function DashboardPage() {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [respuestas, setRespuestas] = useState<Record<string, any>[]>([]);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isQuickFilterExpanded, setIsQuickFilterExpanded] = useState(false);

  // Filtros globales interactivos
  const [filters, setFilters] = useState<Record<string, string>>({});

  const loadData = async (isInitial = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    if (isInitial || respuestas.length === 0) {
      setLoading(true);
    }
    try {
      const ts = Date.now();
      const [meta, resp] = await Promise.all([
        fetchApi(`/encuestas/metadatos?_t=${ts}`),
        fetchApi(`/encuestas/respuestas?_t=${ts}`)
      ]);
      if (meta?.columnas) setColumnas(meta.columnas);
      if (resp) setRespuestas(resp);
    } catch (e) {
      if (isInitial) {
        console.error('Error cargando datos iniciales:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // Re-sincronización periódica en segundo plano cada 60 segundos
    const interval = setInterval(() => {
      loadData(false);
    }, 60000);
    return () => clearInterval(interval);
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
      libreta: find(['9. Libreta militar', '9. Libreta', 'libreta militar']), // Columna L (9. Libreta)
      libretaHogar: find(['32. Libreta militar', '32. Libreta', 'hombres mayores de edad']), // Columna AI (32. Libreta Hogar)
      necesPrinc: find(['66.', 'necesidad principal']),
      necesSecund: find(['67.', 'necesidad secundaria']),
      necesTerc: find(['68.', 'necesidad terciaria']),
      menores: find(['22.', 'menores de 18']),
      escolarizados: find(['26.', 'escolarizados', 'cuantos estan escolarizados']),
      edad: find(['4. Edad', 'edad']),
      autorizaDatos: find(['autoriza el tratamiento', 'autoriza']),
      hechosAdic: find(['47.', 'hechos victimizantes adicionales', 'otros hechos', 'adicionales']),
      inscritoRuv: find(['40.', 'inscrito(a) en el registro', 'registro unico de victimas', 'ruv']),
      jefeHogar: find(['38.', 'jefe(a) de hogar', 'jefe de hogar']),
      orientacionEnc: find(['7. Orientacion Sexual', '7. Orientación Sexual', 'orientacion sexual']), // Columna J (7. Orientación Sexual)
      identidadEnc: find(['8. Identidad de genero', '8. Identidad de género', 'identidad de genero']), // Columna K (8. Identidad de Género)
      orientacionHogar: find(['30. Orientacion Sexual', '30. Orientación Sexual', '30.']), // Columna AG (30. Orientación Sexual Hogar)
      identidadHogar: find(['31. Identidad de genero', '31. Identidad de género', '31.']), // Columna AH (31. Identidad de Género Hogar)
      mayoresMasculino: find(['27. De los mayores de edad', '27. De los mayores', 'sexo masculino']), // Columna AD / Pregunta 27
      tenenciaVivienda: find(['49.', 'tenencia de la vivienda']), // Columna AZ / Pregunta 49
      rangoIngresos: find(['54.', 'rango se encuentran los ingresos']), // Columna BE / Pregunta 54
      emprendimiento: find(['56.', 'cuenta actualmente con un emprendimiento']), // Columna BG / Pregunta 56
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
  const getFrecuencias = (colName: string, top = 20) => {
    if (!colName || rows.length === 0) return [];
    const freqMap: Record<string, { count: number; rawVal: string }> = {};
    rows.forEach(r => {
      const raw = s(r[colName]);
      let valStr = raw || 'Sin respuesta';
      
      // Normalización estandarizada para la pregunta 46 (Principal Afectación)
      if (colName === C.afectacion && valStr !== 'Sin respuesta') {
        const norm = valStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\./g, "").trim();
        
        if (norm.includes('todas')) {
          valStr = 'Todas las anteriores';
        } else if ((norm.includes('psicol') || norm.includes('psico') || norm.includes('emocional')) && norm.includes('econom') && !norm.includes('familiar') && !norm.includes('social') && !norm.includes('fisic')) {
          // Unificar tanto "Económico y psicológico", "Psicológica y económica" y "Emocional y económica"
          if (norm.includes('emocional')) {
            valStr = 'Emocional y económica';
          } else {
            valStr = 'Económica y psicológica';
          }
        } else {
          // Estandarizar tildes y ortografía sin colapsar opciones compuestas distintas
          const replacements: [RegExp, string][] = [
            [/emocional o psicol[oó]gica/gi, 'Emocional o psicológica'],
            [/emocional, econ[oó]mica, familiar/gi, 'Emocional, económica y familiar'],
            [/emocional, familiar/gi, 'Emocional y familiar'],
            [/emocional, psicosocial, econom[ií]a/gi, 'Emocional, psicosocial y económica'],
            [/psicolog[ií]a y social/gi, 'Psicológica y social'],
            [/econ[oó]mica y familiar/gi, 'Económica y familiar'],
            [/social y econ[oó]mica/gi, 'Social y económica'],
            [/f[ií]sica y economica|f[ií]sica y econ[oó]mica/gi, 'Física y económica'],
            [/f[ií]sica y emocional/gi, 'Física y emocional'],
          ];

          let matchFound = false;
          for (const [pattern, rep] of replacements) {
            if (pattern.test(norm)) {
              valStr = rep;
              matchFound = true;
              break;
            }
          }

          if (!matchFound) {
            if (norm === 'familiar') valStr = 'Familiar';
            else if (norm === 'fisica') valStr = 'Física';
            else if (norm === 'economica') valStr = 'Económica';
            else if (norm === 'social') valStr = 'Social';
          }
        }
      }

      const label = valStr.length > 26 ? valStr.slice(0, 23) + '…' : valStr;
      if (!freqMap[label]) {
        freqMap[label] = { count: 0, rawVal: valStr };
      }
      freqMap[label].count += 1;
    });

    const items = Object.keys(freqMap).map(k => ({
      name: k,
      opcion: freqMap[k].rawVal,
      label: k,
      value: freqMap[k].count,
      cantidad: freqMap[k].count,
      porcentaje: Number(((freqMap[k].count / rows.length) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);

    return items.slice(0, top);
  };

  // Cálculo de frecuencias filtrando únicamente a personas de sexo HOMBRE / Masculino
  const getFrecuenciasHombresLibreta = (top = 10) => {
    if (!C.libreta || rows.length === 0) return { items: [], totalHombres: 0 };
    
    // Filtrar únicamente los registros cuyo sexo sea Masculino/Hombre
    const rowsHombres = rows.filter(r => {
      const sx = s(r[C.sexo]).toLowerCase();
      return sx.includes('masculino') || sx.includes('hombre');
    });

    const totalHombres = rowsHombres.length;
    if (totalHombres === 0) return { items: [], totalHombres: 0 };

    const freqMap: Record<string, { count: number; rawVal: string }> = {};
    rowsHombres.forEach(r => {
      const raw = s(r[C.libreta]);
      const valStr = raw || 'Sin respuesta';
      const label = valStr.length > 26 ? valStr.slice(0, 23) + '…' : valStr;
      if (!freqMap[label]) {
        freqMap[label] = { count: 0, rawVal: valStr };
      }
      freqMap[label].count += 1;
    });

    const items = Object.keys(freqMap).map(k => ({
      name: k,
      opcion: freqMap[k].rawVal,
      label: k,
      value: freqMap[k].count,
      cantidad: freqMap[k].count,
      porcentaje: Number(((freqMap[k].count / totalHombres) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);

    return { items: items.slice(0, top), totalHombres };
  };

  // Cálculo de situación militar consolidada de TODOS los hombres adultos (Encuestados + Integrantes del Hogar)
  // Criterios:
  // 1. Encuestados individuales (57 Hombres): Columna I (Sexo) + Columna L (Pregunta 9: Libreta Militar).
  // 2. Integrantes del hogar (212 Hombres): Columna AD (Pregunta 27: Mayores masculino) + Columna AI (Pregunta 32: Libreta militar).
  // Total Universo Consolidado: 269 Hombres Adultos.
  const getFrecuenciasHombresLibretaHogar = (top = 10) => {
    if (rows.length === 0) return { items: [], totalSubmuestra: 0 };

    const freqMap: Record<string, number> = {};
    let totalHombresMayoresSum = 0;

    rows.forEach(r => {
      // 1. Encuestados individuales (57 Hombres): Columna I y Columna L
      const sexoEnc = s(r[C.sexo]).toLowerCase();
      const esHombreEnc = sexoEnc.includes('masculino') || sexoEnc.includes('hombre');

      if (esHombreEnc) {
        totalHombresMayoresSum += 1;
        const raw9 = s(r[C.libreta]);
        let cat9 = raw9 || 'Sin respuesta';
        const norm9 = cat9.toLowerCase();

        if (norm9 === 'si' || norm9 === 'sí' || norm9.includes('cuenta con libreta')) {
          cat9 = 'Sí';
        } else if (norm9 === 'no') {
          cat9 = 'No';
        } else if (norm9.includes('en proceso')) {
          cat9 = 'En proceso';
        } else if (norm9.includes('no aplica') || norm9 === 'n/a' || norm9 === 'na') {
          cat9 = 'No aplica';
        } else if (norm9.includes('no sabe') || norm9.includes('no se')) {
          cat9 = 'No sabe';
        }

        freqMap[cat9] = (freqMap[cat9] || 0) + 1;
      }

      // 2. Hombres adultos en el hogar (212 Hombres): Columna AD / 27 y Columna AI / 32
      const nHombresHogar = parseFloat(s(r[C.mayoresMasculino])) || 0;

      if (nHombresHogar > 0) {
        totalHombresMayoresSum += nHombresHogar;
        const raw32 = s(r[C.libretaHogar]);
        let cat32 = raw32 || 'Sin respuesta';
        const norm32 = cat32.toLowerCase();

        if (norm32 === 'si' || norm32 === 'sí' || norm32.includes('cuenta con libreta') || norm32.includes('solo dos') || norm32 === 'uno') {
          cat32 = 'Sí';
        } else if (norm32 === 'no') {
          cat32 = 'No';
        } else if (norm32.includes('no sabe') || norm32.includes('no se')) {
          cat32 = 'No sabe';
        } else if (norm32.includes('en proceso')) {
          cat32 = 'En proceso';
        } else if (norm32.includes('no aplica')) {
          cat32 = 'No aplica';
        } else if (norm32.includes('solo uno')) {
          cat32 = 'Sí (Parcial)';
        }

        freqMap[cat32] = (freqMap[cat32] || 0) + nHombresHogar;
      }
    });

    const items = Object.keys(freqMap).map(k => ({
      name: k,
      opcion: k,
      label: k,
      value: freqMap[k],
      cantidad: freqMap[k],
      porcentaje: Number(((freqMap[k] / (totalHombresMayoresSum || 1)) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);

    return { items: items.slice(0, top), totalSubmuestra: totalHombresMayoresSum };
  };

  // Cálculo de Escolarización de Menores de Edad (Columna 26 / AC respecto al total de menores en la Columna 22 / Y)
  const getFrecuenciasEscolarizadosMenores = () => {
    if (rows.length === 0) return { items: [], totalMenores: 0 };

    let totalMenoresSum = 0;
    let escolarizadosSum = 0;

    rows.forEach(r => {
      const m = parseFloat(s(r[C.menores])) || 0;
      const e = parseFloat(s(r[C.escolarizados])) || 0;
      totalMenoresSum += m;
      escolarizadosSum += e;
    });

    const noEscolarizadosSum = Math.max(0, totalMenoresSum - escolarizadosSum);
    const totalBase = totalMenoresSum || 1;

    const items = [
      {
        name: 'Escolarizados',
        opcion: 'Escolarizados',
        label: 'Escolarizados',
        value: escolarizadosSum,
        cantidad: escolarizadosSum,
        porcentaje: Number(((escolarizadosSum / totalBase) * 100).toFixed(1)),
        color: '#10b981'
      },
      {
        name: 'No escolarizados / Sin reporte',
        opcion: 'No escolarizados',
        label: 'No escolarizados',
        value: noEscolarizadosSum,
        cantidad: noEscolarizadosSum,
        porcentaje: Number(((noEscolarizadosSum / totalBase) * 100).toFixed(1)),
        color: '#ef4444'
      }
    ];

    return { items, totalMenores: totalMenoresSum };
  };

  // Cálculo de frecuencias consolidando la población total del hogar (700+ integrantes)
  const getFrecuenciasConsolidadoHogar = (colEnc: string, colHogar: string, top = 10) => {
    if (rows.length === 0) return { items: [], totalConsolidado: 0 };
    
    // Sumar el total de integrantes de todos los hogares filtrados
    const totalConsolidado = totalPersonasHogar || 1;
    const freqMap: Record<string, { count: number; rawVal: string }> = {};

    rows.forEach(r => {
      // Integrantes en este hogar específico
      const nHogar = Math.max(1, parseFloat(s(r[C.hogar])) || 1);
      // Priorizar la respuesta del hogar (colHogar) o la persona encuestada (colEnc)
      const valStr = s(r[colHogar]) || s(r[colEnc]) || 'Sin respuesta';
      const label = valStr.length > 26 ? valStr.slice(0, 23) + '…' : valStr;

      if (!freqMap[label]) {
        freqMap[label] = { count: 0, rawVal: valStr };
      }
      // Ponderar por la cantidad de personas del hogar
      freqMap[label].count += nHogar;
    });

    const items = Object.keys(freqMap).map(k => ({
      name: k,
      opcion: freqMap[k].rawVal,
      label: k,
      value: freqMap[k].count,
      cantidad: freqMap[k].count,
      porcentaje: Number(((freqMap[k].count / totalConsolidado) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);

    return { items: items.slice(0, top), totalConsolidado };
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

  // Análisis de Revictimización: Personas con Múltiples Hechos Victimizantes
  // Evalúa estrictamente la Columna AV (Pregunta 45. Tipo de Hecho) sobre los 233 encuestados:
  // Se toma cada respuesta como 1 hecho, y se cuenta como Múltiples Hechos (>1) si contiene comas (,) o la palabra 'y' / 'Y'.
  const hechosMultiplesData = useMemo(() => {
    let unSoloHecho = 0;
    let masDeUnHecho = 0;
    let totalVictimas = rows.length;

    rows.forEach(r => {
      const tipoHecho = s(r[C.tipoHecho]);
      
      // Evaluar delimitadores de múltiples hechos en la Columna AV (comas , o conjunción Y / y)
      const tieneDelimitador = /[,]|(?:\s+[yY]\s+)/.test(tipoHecho);

      if (tieneDelimitador) {
        masDeUnHecho += 1;
      } else {
        unSoloHecho += 1;
      }
    });

    const totalBase = totalVictimas || 1;
    return {
      items: [
        { name: '1 Solo Hecho Victimizante', opcion: 'Un Hecho', cantidad: unSoloHecho, porcentaje: Number(((unSoloHecho / totalBase) * 100).toFixed(1)), color: '#10b981' },
        { name: 'Múltiples Hechos (>1 Hecho)', opcion: 'Múltiples Hechos', cantidad: masDeUnHecho, porcentaje: Number(((masDeUnHecho / totalBase) * 100).toFixed(1)), color: '#ef4444' }
      ],
      totalVictimas
    };
  }, [rows, C.tipoHecho]);

  // ==========================================
  // COMPONENTES GRÁFICOS 2D VECTORIALES
  // ==========================================

  // 1. GRÁFICO CIRCULAR / PASTEL 2D (DONUT SVG)
  const DonutPieChart2D = ({ data, onSelect, activeVal, totalOverride }: { data: any[]; onSelect?: (item: any) => void; activeVal?: string; totalOverride?: number }) => {
    const sumValues = data.reduce((acc, d) => acc + (d.value || d.cantidad || 0), 0);
    const total = totalOverride ?? (sumValues || 1);
    let accumulatedAngle = 0;

    const slices = data.map((d, idx) => {
      const val = d.value || d.cantidad || 0;
      const angle = (val / (sumValues || 1)) * 360;
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
      <div className="flex flex-col xl:flex-row items-center justify-center gap-2 py-1 w-full min-w-0 my-auto flex-1">
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 my-auto">
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
            <span className={`text-xs sm:text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{total}</span>
            <span className={`text-[7px] sm:text-[8px] font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Total</span>
          </div>
        </div>

        {/* Leyenda 100% autocontenida y fluida */}
        <div className="flex-1 space-y-1 w-full min-w-0 my-auto">
          {slices.map((slice, i) => {
            const isSelected = activeVal === slice.opcion;
            return (
              <div
                key={i}
                onClick={() => onSelect && onSelect(slice)}
                className={`flex items-start justify-between gap-1.5 text-[10px] sm:text-[11px] p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-indigo-600/20 border border-indigo-500/40 font-bold' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: slice.color }} />
                  <span className={`break-words leading-tight ${
                    isSelected 
                      ? 'font-black text-indigo-600 dark:text-indigo-400' 
                      : theme === 'light' ? 'font-bold text-slate-800 hover:text-indigo-600' : 'font-semibold text-slate-200 hover:text-white'
                  }`} title={slice.name}>
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[10px] shrink-0 pt-0.5">
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
        {/* Leyenda explicativa con colores */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs bg-slate-900/30 p-2 rounded-2xl border border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>1ª Prioritaria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>2ª Secundaria</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>3ª Terciaria</span>
          </div>
        </div>

        {/* ÁREA DEL GRÁFICO DE COLUMNAS AGRUPADAS */}
        <div className={`h-48 flex items-end justify-between gap-2 border-b pb-2 px-1 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {data.map((item, idx) => {
            const hP = Math.max(6, Math.round((item.Prioritaria / maxVal) * 100));
            const hS = Math.max(6, Math.round((item.Secundaria / maxVal) * 100));
            const hT = Math.max(6, Math.round((item.Terciaria / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center h-full">
                  {/* Columna Prioritaria (Roja) */}
                  <div className="flex-1 max-w-[14px] flex flex-col items-center justify-end h-full group/bar">
                    <span className="text-[9px] font-mono font-black text-rose-400 opacity-0 group-hover/bar:opacity-100 transition-opacity mb-0.5">
                      {item.Prioritaria}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all group-hover/bar:brightness-125 shadow-md shadow-rose-500/20"
                      style={{ height: `${hP}%` }}
                      title={`${item.name} - 1ª Prioritaria: ${item.Prioritaria} encuestados`}
                    />
                  </div>

                  {/* Columna Secundaria (Naranja) */}
                  <div className="flex-1 max-w-[14px] flex flex-col items-center justify-end h-full group/bar">
                    <span className="text-[9px] font-mono font-black text-amber-400 opacity-0 group-hover/bar:opacity-100 transition-opacity mb-0.5">
                      {item.Secundaria}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all group-hover/bar:brightness-125 shadow-md shadow-amber-500/20"
                      style={{ height: `${hS}%` }}
                      title={`${item.name} - 2ª Secundaria: ${item.Secundaria} encuestados`}
                    />
                  </div>

                  {/* Columna Terciaria (Morada) */}
                  <div className="flex-1 max-w-[14px] flex flex-col items-center justify-end h-full group/bar">
                    <span className="text-[9px] font-mono font-black text-indigo-400 opacity-0 group-hover/bar:opacity-100 transition-opacity mb-0.5">
                      {item.Terciaria}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all group-hover/bar:brightness-125 shadow-md shadow-indigo-500/20"
                      style={{ height: `${hT}%` }}
                      title={`${item.name} - 3ª Terciaria: ${item.Terciaria} encuestados`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EJE X: Etiquetas y Cifras (Prioritaria / Secundaria / Terciaria) */}
        <div className="flex justify-between gap-1 px-1">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 text-center truncate px-0.5">
              <span className={`text-[10px] font-extrabold truncate block ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`} title={item.name}>
                {item.name}
              </span>
              <div className="flex items-center justify-center gap-0.5 text-[9px] font-mono mt-0.5">
                <span className="font-bold text-rose-500" title="Prioritaria">{item.Prioritaria}</span>
                <span className="text-slate-600">/</span>
                <span className="font-bold text-amber-500" title="Secundaria">{item.Secundaria}</span>
                <span className="text-slate-600">/</span>
                <span className="font-bold text-indigo-400" title="Terciaria">{item.Terciaria}</span>
              </div>
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
        <div className={`h-44 flex items-end justify-center gap-12 border-b pb-2 ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          {/* Menores de edad */}
          <div className="flex flex-col items-center justify-end h-full w-28 group">
            <span className={`text-sm font-black mb-1 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
              {menores} ({pctMenores}%)
            </span>
            <div
              className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all group-hover:scale-105 shadow-lg shadow-emerald-600/20"
              style={{ height: `${hMenores}%` }}
            />
            <span className={`text-xs font-bold mt-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
              Menores de 18
            </span>
            <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
              Niños/Adolescentes
            </span>
          </div>

          {/* Mayores de edad */}
          <div className="flex flex-col items-center justify-end h-full w-28 group">
            <span className={`text-sm font-black mb-1 ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
              {mayores} ({pctMayores}%)
            </span>
            <div
              className="w-full bg-gradient-to-t from-indigo-600 to-violet-400 rounded-t-xl transition-all group-hover:scale-105 shadow-lg shadow-indigo-600/20"
              style={{ height: `${hMayores}%` }}
            />
            <span className={`text-xs font-bold mt-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
              Mayores de 18
            </span>
            <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
              Adultos / Mayores
            </span>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
          theme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <span className={theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'}>Total Personas en Hogares Censados:</span>
          <span className={`font-mono font-black text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{total} personas</span>
        </div>
      </div>
    );
  };

  // 4B. GRÁFICO DE BARRAS INCLINADAS 2D/3D (AUTORIZACIÓN DE TRATAMIENTO DE DATOS)
  const SlantedBarChart2D = ({ onSelect, activeVal }: { onSelect?: (item: any) => void; activeVal?: string }) => {
    // Para que este gráfico muestre siempre ambas opciones (Sí y No) manteniendo sus totales originales
    // de la selección actual del resto de los filtros (zona, municipio, etc.) ignorando únicamente el filtro de autorizaDatos:
    const rowsForHabeasData = useMemo(() => {
      return respuestas.filter(row => {
        return Object.entries(filters).every(([col, val]) => {
          if (!val || col === C.autorizaDatos) return true;
          return s(row[col]) === val;
        });
      });
    }, [respuestas, filters, C.autorizaDatos]);

    const totalHabeasSample = rowsForHabeasData.length || 1;

    // Obtener valores reales de opciones
    const allOptValues = useMemo(() => {
      const set = new Set<string>();
      respuestas.forEach(r => {
        const val = s(r[C.autorizaDatos]);
        if (val) set.add(val);
      });
      return Array.from(set);
    }, [respuestas, C.autorizaDatos]);

    const rawSiVal = allOptValues.find(v => v.toLowerCase().includes('sí') || v.toLowerCase().includes('si') || v.toLowerCase().includes('autorizo')) || 'Sí, autorizo el tratamiento de mis datos personales.';
    const rawNoVal = allOptValues.find(v => v.toLowerCase().includes('no autorizo') || v.toLowerCase().startsWith('no')) || 'No autorizo el tratamiento de mis datos personales.';

    const cantSi = rowsForHabeasData.filter(r => s(r[C.autorizaDatos]) === rawSiVal).length;
    const cantNo = rowsForHabeasData.filter(r => s(r[C.autorizaDatos]) === rawNoVal).length;

    const pctSi = totalHabeasSample > 0 ? Math.round((cantSi / totalHabeasSample) * 100) : 0;
    const pctNo = totalHabeasSample > 0 ? Math.round((cantNo / totalHabeasSample) * 100) : 0;

    const itemSi = { opcion: rawSiVal, cantidad: cantSi, porcentaje: pctSi };
    const itemNo = { opcion: rawNoVal, cantidad: cantNo, porcentaje: pctNo };

    const isSiActive = activeVal === itemSi.opcion;
    const isNoActive = activeVal === itemNo.opcion;

    return (
      <div className="pt-2 pb-1 space-y-4">
        {/* Contenedor de Barras Inclinadas en Ángulo */}
        <div className="space-y-3">
          {/* Barra Inclinada: SÍ AUTORIZAN */}
          <div
            onClick={() => itemSi && onSelect && onSelect(itemSi)}
            className={`group cursor-pointer p-2.5 rounded-2xl border transition-all ${
              isSiActive
                ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                : theme === 'light'
                ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/50'
                : 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5'
            }`}
          >
            <div className="flex justify-between items-center text-xs mb-1.5 px-1">
              <span className={`font-extrabold flex items-center gap-1.5 text-xs ${
                theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                <ShieldCheck size={15} /> Autorizan Tratamiento
              </span>
              <span className={`font-mono font-black text-xs ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {cantSi} <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>({pctSi}%)</span>
              </span>
            </div>
            {/* Barra con skew/inclinación */}
            <div className={`w-full rounded-xl h-4 p-0.5 overflow-hidden border ${
              theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-lg -skew-x-12 transform origin-left transition-all duration-500 shadow-md shadow-emerald-500/30 group-hover:brightness-125"
                style={{ width: `${pctSi}%` }}
              />
            </div>
          </div>

          {/* Barra Inclinada: NO AUTORIZAN */}
          <div
            onClick={() => itemNo && onSelect && onSelect(itemNo)}
            className={`group cursor-pointer p-2.5 rounded-2xl border transition-all ${
              isNoActive
                ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                : theme === 'light'
                ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400 hover:bg-rose-100/50'
                : 'bg-slate-900/40 border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/5'
            }`}
          >
            <div className="flex justify-between items-center text-xs mb-1.5 px-1">
              <span className={`font-extrabold flex items-center gap-1.5 text-xs ${
                theme === 'light' ? 'text-rose-700' : 'text-rose-400'
              }`}>
                <ShieldX size={15} /> No Autorizan
              </span>
              <span className={`font-mono font-black text-xs ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {cantNo} <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>({pctNo}%)</span>
              </span>
            </div>
            {/* Barra con skew/inclinación */}
            <div className={`w-full rounded-xl h-4 p-0.5 overflow-hidden border ${
              theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-lg -skew-x-12 transform origin-left transition-all duration-500 shadow-md shadow-rose-500/30 group-hover:brightness-125"
                style={{ width: `${pctNo}%` }}
              />
            </div>
          </div>
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
                    isSelected ? 'ring-2 ring-indigo-500 font-bold scale-105' : ''
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
      <div className="space-y-2.5 pt-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
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
    { label: 'Tratamiento Datos', col: C.autorizaDatos },
    { label: 'Necesidad', col: C.necesPrinc },
    { label: 'Libreta Militar', col: C.libreta },
    { label: 'Principal Afectación', col: C.afectacion },
    { label: 'Municipio', col: C.municipioOc },
    { label: 'Nivel Educativo', col: C.educacion },
  ];

  return (
    <ProtectedRoute>
    <div className={`min-h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />

      <main className={`flex-1 p-3 sm:p-5 md:p-6 space-y-6 w-full max-w-full min-w-0 transition-all duration-300 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>

        {/* CONTENEDOR STICKY: HEADER + BARRA DE FILTROS FIJOS AL HACER SCROLL */}
        <div className="sticky top-0 z-40 space-y-2 pt-1 pb-1">
          {/* HEADER PRINCIPAL STICKY */}
          <div className={`border rounded-3xl px-4 sm:px-5 py-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md transition-all ${
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
              {/* Botón para Desplegar / Contraer la Barra de Filtros Rápidos */}
              <button
                onClick={() => setIsQuickFilterExpanded(!isQuickFilterExpanded)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isQuickFilterExpanded
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={isQuickFilterExpanded ? "Ocultar Filtros Rápidos" : "Mostrar Filtros Rápidos"}
              >
                <Filter size={13} />
                <span>{isQuickFilterExpanded ? "Ocultar Filtros" : "Mostrar Filtros"}</span>
                {isQuickFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black text-[10px]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

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
                onClick={() => loadData(true)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Recargar datos"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* BARRA SUPERIOR DE BOTONERA DE CONTROLES DE FILTRO (DESPLEGABLE / CONTRAÍBLE) */}
          <div className={`border rounded-3xl p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 ${
            theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
          } ${isQuickFilterExpanded ? 'block animate-in fade-in zoom-in-95 duration-200' : 'hidden'}`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-indigo-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
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
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition-all cursor-pointer truncate ${
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
        </div>

        {/* TARJETAS DE RESUMEN (KPIS SOLICITADOS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
          {[
            { label: 'Total de Registros', value: rows.length, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <Users size={18} /> },
            { label: 'Personas en Hogar', value: totalPersonasHogar || rows.length, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: <Home size={18} /> },
            { label: 'Total Preguntas', value: columnas.length, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Layers size={18} /> },
            { label: 'Promedio Integrantes', value: avgIntegrantes, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Calculator size={18} /> },
            { label: 'Menores de Edad', value: Math.round(totalMenores), color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: <Star size={18} /> },
            { label: 'Mayores de Edad', value: Math.round(totalMayores), color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <Users size={18} /> },
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
        {/* FILA 1: DISTRIBUCIÓN POR SEXO (CIRCULAR) + ZONA (CIRCULAR) + FUENTE DE INGRESOS (CIRCULAR) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              data={getFrecuencias(C.ingresos, 6)}
              activeVal={filters[C.ingresos]}
              totalOverride={rows.length}
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
              data={getFrecuencias(C.tipoHecho, 30)}
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
              data={getFrecuencias(C.municipioOc, 30)}
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
        {/* NUEVA FILA DE ESCOLARIZACIÓN DE MENORES DE EDAD (PASTEL) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Escolarización de Menores de Edad (Gráfico Circular / Pastel 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Gráfico Circular 2D (Pastel)</span>
                <h4 className="text-sm font-bold">Escolarización de Menores de Edad</h4>
                <p className="text-[11px] text-slate-500">Pregunta 26 vs Total Menores de 18 años (Pregunta 22)</p>
              </div>
              <GraduationCap size={18} className="text-emerald-500" />
            </div>
            {(() => {
              const { items, totalMenores: totM } = getFrecuenciasEscolarizadosMenores();
              return (
                <DonutPieChart2D
                  data={items}
                  totalOverride={totM}
                />
              );
            })()}
          </div>

          {/* Tarjeta Informativa Resumen Escolaridad */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-center gap-4 ${
            theme === 'light' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black">
                <GraduationCap size={24} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  Cobertura Escolar en Niños y Adolescentes
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Análisis consolidado del nivel de escolarización registrado en los hogares
                </p>
              </div>
            </div>

            {(() => {
              const { items, totalMenores: totM } = getFrecuenciasEscolarizadosMenores();
              const esc = items.find(i => i.name === 'Escolarizados')?.cantidad || 0;
              const pct = totM > 0 ? ((esc / totM) * 100).toFixed(1) : '0';

              return (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className={`p-3.5 rounded-2xl border ${theme === 'light' ? 'bg-white border-emerald-100' : 'bg-slate-800/80 border-slate-700'}`}>
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Menores</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{totM}</span>
                    <span className="text-[10px] text-slate-400 block">Menores de 18 años</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${theme === 'light' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-600/30 border-emerald-500/40'}`}>
                    <span className="text-[11px] font-bold opacity-90 block uppercase">Escolarizados</span>
                    <span className="text-xl font-black">{esc} <span className="text-xs font-normal">({pct}%)</span></span>
                    <span className="text-[10px] opacity-80 block">Asisten a la escuela</span>
                  </div>
                </div>
              );
            })()}
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
          {/* Libreta Militar Consolidada (Gráfico Circular 2D - 269 Hombres Adultos) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Situación Militar Consolidada</span>
                <h4 className="text-sm font-bold">Libreta Militar (Hombres Adultos Consolidado)</h4>
                <p className="text-[10px] text-slate-500">Población total de 269 hombres (57 encuestados + 212 integrantes en hogar)</p>
              </div>
              <PieIcon size={16} className="text-indigo-500" />
            </div>
            {(() => {
              const { items, totalSubmuestra } = getFrecuenciasHombresLibretaHogar(10);
              return (
                <DonutPieChart2D
                  data={items}
                  activeVal={filters[C.libretaHogar]}
                  totalOverride={totalSubmuestra}
                  onSelect={(item) => setFilter(C.libretaHogar, item.opcion)}
                />
              );
            })()}
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
        {/* FILA 7: AFECTACIÓN + BARRIO + AUTORIZACIÓN DE DATOS (HABEAS DATA) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Principal Afectación (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-purple-500 uppercase tracking-wider">Gráfico de Barras</span>
                <h4 className="text-sm font-bold">Principal Afectación</h4>
              </div>
              <FileWarning size={16} className="text-purple-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.afectacion, 30)}
              activeVal={filters[C.afectacion]}
              onSelect={(item) => setFilter(C.afectacion, item.opcion)}
            />
          </div>

          {/* Distribución por Barrio / Vereda (Barras Horizontales) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-wider">Gráfico de Barras</span>
                <h4 className="text-sm font-bold">Barrio / Vereda</h4>
              </div>
              <MapPin size={16} className="text-cyan-500" />
            </div>
            <HorizontalBarChart2D
              data={getFrecuencias(C.barrio, 30)}
              activeVal={filters[C.barrio]}
              onSelect={(item) => setFilter(C.barrio, item.opcion)}
            />
          </div>

          {/* Autorización de Tratamiento de Datos (Tarjeta KPI Compacta 2D) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Habeas Data</span>
                <h4 className="text-sm font-bold">Tratamiento de Datos</h4>
              </div>
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.autorizaDatos, 5)}
              activeVal={filters[C.autorizaDatos]}
              totalOverride={rows.length}
              onSelect={(item) => setFilter(C.autorizaDatos, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 8: NUEVOS GRÁFICOS ANALÍTICOS (HECHOS MÚLTIPLES + PERTENENCIA ÉTNICA) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* 1. Gráfico de Personas con >1 Hecho Victimizante */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
                  Análisis de Revictimización
                </span>
                <h4 className="text-sm font-bold">Personas con Múltiples Hechos Victimizantes</h4>
              </div>
              <ShieldAlert size={18} className="text-rose-500" />
            </div>
            <DonutPieChart2D
              data={hechosMultiplesData.items}
              totalOverride={hechosMultiplesData.totalVictimas}
            />
          </div>

          {/* 2. Gráfico Adicional: Pertenencia Étnica (Grupos Poblacionales / Enfoque Diferencial) */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-extrabold text-violet-500 uppercase tracking-wider">Enfoque Diferencial</span>
                <h4 className="text-sm font-bold">Pertenencia Étnica / Grupo Poblacional</h4>
              </div>
              <Users size={18} className="text-violet-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.etnia, 15)}
              activeVal={filters[C.etnia]}
              totalOverride={rows.length}
              onSelect={(item) => setFilter(C.etnia, item.opcion)}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 8.5: 3. CONDICIONES SOCIOECONÓMICAS (233 ENCUESTADOS) */}
        {/* ========================================================= */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <div>
              <h3 className="text-base font-extrabold">3. Condiciones Socioeconómicas</h3>
              <p className="text-xs text-slate-400">Análisis sobre la población de 233 personas encuestadas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Tenencia de la Vivienda (Columna AZ / 49) */}
            <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-wider">Vivienda</span>
                  <h4 className="text-sm font-bold">Tenencia de Vivienda</h4>
                </div>
                <Home size={18} className="text-cyan-500" />
              </div>
              <DonutPieChart2D
                data={getFrecuencias(C.tenenciaVivienda, 10)}
                activeVal={filters[C.tenenciaVivienda]}
                totalOverride={rows.length}
                onSelect={(item) => setFilter(C.tenenciaVivienda, item.opcion)}
              />
            </div>

            {/* 2. Rangos de Ingresos Mensuales (Columna BE / 54) */}
            <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Ingresos</span>
                  <h4 className="text-sm font-bold">Rangos de Ingresos Mensuales</h4>
                </div>
                <TrendingUp size={18} className="text-amber-500" />
              </div>
              <DonutPieChart2D
                data={getFrecuencias(C.rangoIngresos, 10)}
                activeVal={filters[C.rangoIngresos]}
                totalOverride={rows.length}
                onSelect={(item) => setFilter(C.rangoIngresos, item.opcion)}
              />
            </div>

            {/* 3. Emprendimiento o Unidad Productiva (Columna BG / 56) */}
            <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Productividad</span>
                  <h4 className="text-sm font-bold">Emprendimiento o Negocio Propio</h4>
                </div>
                <Briefcase size={18} className="text-emerald-500" />
              </div>
              <DonutPieChart2D
                data={getFrecuencias(C.emprendimiento, 10)}
                activeVal={filters[C.emprendimiento]}
                totalOverride={rows.length}
                onSelect={(item) => setFilter(C.emprendimiento, item.opcion)}
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 9: JEFE DE HOGAR + INTERPRETACIÓN ANALÍTICA COMPLETA */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pt-2">
          {/* Gráfico: Encuestados Jefes de Hogar */}
          <div className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Liderazgo Familiar</span>
                <h4 className="text-sm font-bold">Encuestados Jefes(as) de Hogar</h4>
              </div>
              <Home size={18} className="text-emerald-500" />
            </div>
            <DonutPieChart2D
              data={getFrecuencias(C.jefeHogar, 5)}
              activeVal={filters[C.jefeHogar]}
              totalOverride={rows.length}
              onSelect={(item) => setFilter(C.jefeHogar, item.opcion)}
            />
          </div>

          {/* Tarjeta de Interpretación de Gráficos (Síntesis de hallazgos completa) */}
          <div className={`xl:col-span-2 border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border-slate-200' : 'bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={18} className="text-indigo-500" />
                <h4 className="text-sm font-black uppercase tracking-wider text-indigo-500">
                  Interpretación Analítica y Hallazgos Clave Globales
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
                {/* 1. Demografía y Género */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-indigo-500 block mb-1">👩‍👩‍👧 Perfil Demográfico & Género:</strong>
                  La población encuestada presenta un predominio femenino significativo, donde el <strong className="text-indigo-400">75.5% (176 personas)</strong> se identifican como mujeres y el <strong className="text-indigo-400">24.5% (57 personas)</strong> como hombres, marcando un liderazgo femenino clave en el censo.
                </div>

                {/* 2. Hecho Victimizante Principal */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-rose-500 block mb-1">🚨 Mayor Impacto Victimizante:</strong>
                  El <strong className="text-rose-400">Desplazamiento Forzado</strong> representa el hecho principal predominante con más del <strong className="text-rose-400">30.9%</strong> de los casos, seguido por atentados terroristas (26.2%) y amenazas (17.2%), concentrando el núcleo histórico del conflicto.
                </div>

                {/* 3. Focalización Territorial & Municipios */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-cyan-500 block mb-1">📍 Concentración Territorial:</strong>
                  El municipio de <strong className="text-cyan-400">Villa Rica (36.1%)</strong> concentra la mayor proporción de ocurrencia del hecho victimizante principal, convirtiéndose en el epicentro geográfico prioritized de atención en la región.
                </div>

                {/* 4. Situación Socioeconómica & Empleo */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-amber-500 block mb-1">💼 Empleo & Estabilidad Laboral:</strong>
                  Existe una importante barrera de inserción laboral formal: la gran mayoría se sustenta a través de <strong className="text-amber-400">empleo informal o independiente</strong> y emprendimientos de subsistencia, demandando apoyo en capacitación e impulso productivo.
                </div>

                {/* 5. Jefatura de Hogar */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-emerald-500 block mb-1">🏠 Jefatura de Hogar & Responsabilidad:</strong>
                  El <strong className="text-emerald-400">84.1%</strong> (196 encuestados) asume la jefatura directa de su núcleo familiar, confirmando que las respuestas provienen directamente de los tomadores de decisiones del hogar.
                </div>

                {/* 6. Revictimización */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-rose-500 block mb-1">⚠️ Revictimización Múltiple:</strong>
                  El <strong className="text-rose-400">91.4%</strong> (213 personas) registra múltiples hechos victimizantes en su trayectoria de vida, evidenciando un patrón de afectación continua y acumulativa.
                </div>

                {/* 7. Situación Militar */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-indigo-500 block mb-1">🪖 Situación Militar (Submuestra 57 Hombres):</strong>
                  Evaluada exactamente sobre la submuestra de 57 hombres encuestados: el <strong className="text-indigo-400">56.1% (32 hombres)</strong> tiene libreta personal, y al consultar por la situación de sus familiares masculinos en el hogar, en el <strong className="text-indigo-400">43.9% de los casos (25 hogares)</strong> también cuentan con miembros con situación militar definida.
                </div>

                {/* 8. Étnico y Tratamiento Datos */}
                <div className={`p-3 rounded-2xl border ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}>
                  <strong className="text-purple-500 block mb-1">🧬 Enfoque Diferencial Étnico & Confianza:</strong>
                  Destaca la alta representatividad de la comunidad <strong className="text-purple-400">Afrocolombiana (48.9%)</strong>, unida a una confianza del <strong className="text-emerald-400">99.5%</strong> para el tratamiento seguro de datos personales (Hábeas Data).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 10: CONSOLIDADO DEL CENSO (COBERURA & CALIDAD DE INFORMACIÓN) */}
        {/* ========================================================= */}
        <div className="pt-2 pb-4">
          <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">Control de Calidad & Cobertura</span>
                <h4 className="text-base font-extrabold mt-0.5">Consolidado del Censo y Cobertura de Núcleos Familiares</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-600/10 text-indigo-500 rounded-full text-xs font-extrabold border border-indigo-500/20">
                  255 Personas Encuestadas Totales
                </span>
                <span className="px-3 py-1 bg-emerald-600/10 text-emerald-500 rounded-full text-xs font-extrabold border border-emerald-500/20">
                  233 Núcleos Registrados en Base de Datos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {/* Tarjeta 1: Total Encuestados */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400">Población Censada</span>
                  <Users size={16} className="text-blue-500" />
                </div>
                <div>
                  <span className={`text-2xl font-black font-mono block ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    255
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Personas Encuestadas en Campo</span>
                </div>
                <div className="w-full bg-blue-500/20 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-500 h-full w-full" />
                </div>
              </div>

              {/* Tarjeta 2: Núcleos en Base de Datos */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400">Núcleos en Base de Datos</span>
                  <Database size={16} className="text-indigo-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      233
                    </span>
                    <span className="text-xs text-indigo-400 font-bold">(91.4%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">Hogares Validados en Sistema</span>
                </div>
                <div className="w-full bg-indigo-500/20 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[91.4%]" />
                </div>
              </div>

              {/* Tarjeta 3: Información Completa */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                theme === 'light' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/60'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-emerald-500">Información Completa</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-400'}`}>
                      221
                    </span>
                    <span className="text-xs text-emerald-500 font-bold">(94.8%)</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400/80 font-semibold">Núcleos con Datos 100% Completos</span>
                </div>
                <div className="w-full bg-emerald-500/20 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[94.8%]" />
                </div>
              </div>

              {/* Tarjeta 4: Información Incompleta */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                theme === 'light' ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-800/60'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-amber-500">Información Incompleta</span>
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${theme === 'light' ? 'text-amber-900' : 'text-amber-400'}`}>
                      12
                    </span>
                    <span className="text-xs text-amber-500 font-bold">(5.2%)</span>
                  </div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400/80 font-semibold">Núcleos Pendientes por Completar</span>
                </div>
                <div className="w-full bg-amber-500/20 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full w-[5.2%]" />
                </div>
              </div>
            </div>

            {/* Visualización Gráfica en Donut Pie Charts de Cobertura e Calidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gráfico 1: Cobertura del Censo (Registrados vs No Ingresados) */}
              <div className={`border rounded-2xl p-4 shadow-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Análisis de Cobertura</span>
                    <h4 className="text-xs sm:text-sm font-bold">Núcleos Censados vs. Registrados</h4>
                  </div>
                  <PieIcon size={16} className="text-indigo-500" />
                </div>
                <DonutPieChart2D
                  data={[
                    { name: 'Núcleos en Base de Datos', opcion: 'Registrado', cantidad: 233, porcentaje: 91.4, color: '#6366f1' },
                    { name: 'Encuestados Pendientes Sistema', opcion: 'Pendiente', cantidad: 22, porcentaje: 8.6, color: '#94a3b8' }
                  ]}
                  totalOverride={255}
                />
              </div>

              {/* Gráfico 2: Calidad de la Información (Completos vs Incompletos) */}
              <div className={`border rounded-2xl p-4 shadow-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Calidad de Datos</span>
                    <h4 className="text-xs sm:text-sm font-bold">Completitud de Información (233 Núcleos)</h4>
                  </div>
                  <BarChart3 size={16} className="text-emerald-500" />
                </div>
                <DonutPieChart2D
                  data={[
                    { name: 'Información Completa', opcion: 'Completa', cantidad: 221, porcentaje: 94.8, color: '#10b981' },
                    { name: 'Información Incompleta', opcion: 'Incompleta', cantidad: 12, porcentaje: 5.2, color: '#f59e0b' }
                  ]}
                  totalOverride={233}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 11: DIVERSIDAD, ORIENTACIÓN SEXUAL E IDENTIDAD DE GÉNERO (ENCUESTADO VS HOGAR) */}
        {/* ========================================================= */}
        <div className="pt-2 pb-6 space-y-5">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-pink-500" />
            <div>
              <h3 className="text-base font-extrabold">Diversidad, Orientación Sexual e Identidad de Género</h3>
              <p className="text-xs text-slate-400">Comparativa analítica entre la persona encuestada y la composición del grupo familiar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Orientación Sexual Consolidada Total Hogar */}
            <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3 border-b border-slate-700/40 pb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-wider">Población Total del Hogar ({totalPersonasHogar} personas)</span>
                  <h4 className="text-sm font-bold">Orientación Sexual (Consolidado Total Integrantes)</h4>
                </div>
                <Heart size={18} className="text-pink-500" />
              </div>
              {(() => {
                const { items, totalConsolidado } = getFrecuenciasConsolidadoHogar(C.orientacionEnc, C.orientacionHogar, 8);
                return (
                  <DonutPieChart2D
                    data={items}
                    activeVal={filters[C.orientacionHogar] || filters[C.orientacionEnc]}
                    totalOverride={totalConsolidado}
                    onSelect={(item) => setFilter(C.orientacionHogar, item.opcion)}
                  />
                );
              })()}
            </div>

            {/* 2. Identidad de Género Consolidada Total Hogar */}
            <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3 border-b border-slate-700/40 pb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-violet-500 uppercase tracking-wider">Población Total del Hogar ({totalPersonasHogar} personas)</span>
                  <h4 className="text-sm font-bold">Identidad de Género (Consolidado Total Integrantes)</h4>
                </div>
                <Users size={18} className="text-violet-500" />
              </div>
              {(() => {
                const { items, totalConsolidado } = getFrecuenciasConsolidadoHogar(C.identidadEnc, C.identidadHogar, 8);
                return (
                  <DonutPieChart2D
                    data={items}
                    activeVal={filters[C.identidadHogar] || filters[C.identidadEnc]}
                    totalOverride={totalConsolidado}
                    onSelect={(item) => setFilter(C.identidadHogar, item.opcion)}
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {/* FILA 12: MAPA GEOGRÁFICO DE VILLA RICA - CAUCA (ZONA URBANA Y RURAL CON FILTROS) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Mapa de Distribución Territorial - Villa Rica, Cauca</h3>
                <p className="text-xs text-slate-400">Distribución geográfica por Zona Urbana (Barrios) y Zona Rural (Veredas/Sectores)</p>
              </div>
            </div>
            {filters[C.zona] && (
              <button
                onClick={() => setFilter(C.zona, filters[C.zona])}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/30 cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw size={13} /> Limpiar filtro zona: {filters[C.zona]}
              </button>
            )}
          </div>

          <div className={`border rounded-3xl p-6 shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* SVG / Google Maps 2D Interactivo de Villa Rica, Cauca con Selección de Lugar Exclusivo */}
              <div className={`lg:col-span-7 flex flex-col justify-between p-4 rounded-2xl border relative overflow-hidden min-h-[380px] ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                {/* Cabecera del Mapa */}
                <div className="flex items-center justify-between z-10 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">Municipio de Villa Rica (Cauca)</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                    Interactivo 2D
                  </span>
                </div>
                
                {/* Google Maps 2D Interactivo de Villa Rica, Cauca */}
                <div className="relative flex-1 flex flex-col items-center justify-center py-1 min-h-[350px]">
                  {(() => {
                    // Mapa de coordenadas dinámicas por leyenda/sector
                    const coords: Record<string, { lat: number; lng: number; zoom: number }> = {
                      'Vereda Agua Azul': { lat: 3.1650, lng: -76.4580, zoom: 15 },
                      'Vereda Cantarito': { lat: 3.2050, lng: -76.4750, zoom: 15 },
                      'Vereda Chalo': { lat: 3.1950, lng: -76.4650, zoom: 15 },
                      'Vereda La Primavera': { lat: 3.2000, lng: -76.4520, zoom: 15 },
                      'Corregimiento Juan Ignacio': { lat: 3.2120, lng: -76.4820, zoom: 15 },
                      'Cabecera municipal': { lat: 3.1819, lng: -76.4719, zoom: 15 },
                      'Área Urbanizada': { lat: 3.1819, lng: -76.4719, zoom: 15 }
                    };

                    const activeKey = filters[C.barrio] || filters[C.zona] || '';
                    const currentTarget = coords[activeKey] || { lat: 3.1819, lng: -76.4719, zoom: 14 };

                    return (
                      <>
                        <iframe
                          key={`${currentTarget.lat}-${currentTarget.lng}-${activeKey}`}
                          title="Mapa Google Maps 2D Villa Rica Cauca"
                          width="100%"
                          height="100%"
                          className="absolute inset-0 w-full h-full rounded-2xl border-0 shadow-inner"
                          loading="lazy"
                          allowFullScreen
                          src={`https://maps.google.com/maps?q=${currentTarget.lat},${currentTarget.lng}+(${encodeURIComponent(activeKey || 'Villa+Rica+Cauca')})&z=${currentTarget.zoom}&ie=UTF8&iwloc=B&output=embed`}
                        />
                        {/* InfoWindow / Tarjeta flotante interactiva reducida y compacta */}
                        <div className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl border border-indigo-500/40 shadow-xl flex items-center gap-2 max-w-[260px]">
                          <div className="p-1 bg-indigo-600 rounded-lg shrink-0">
                            <MapPin size={13} className="text-white animate-bounce" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[10px] font-black uppercase text-indigo-400 truncate">VILLA RICA, CAUCA</h5>
                            <p className="text-[10px] font-bold text-slate-100 truncate">
                              {activeKey ? `Filtro Activo: ${activeKey}` : `${totalPersonasHogar} Integrantes (${rows.length} Encuestados)`}
                            </p>
                            <span className="text-[8px] text-slate-400 block font-mono leading-none">
                              {currentTarget.lat}° N, {currentTarget.lng}° W (z{currentTarget.zoom})
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Leyenda y Guía Oficial de Veredas al pie del mapa */}
                <div className={`p-2.5 rounded-xl border text-xs z-10 mt-1 space-y-1.5 ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider opacity-80">Leyenda Oficial de Veredas & Corregimiento</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-500 font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {totalPersonasHogar > 0 ? `${totalPersonasHogar} personas (${rows.length} encuestados)` : '746 personas (746 pob. total)'}
                      </span>
                    </div>
                    <span className="text-[9px] text-indigo-500 font-bold hidden sm:inline">Toca una leyenda para ubicar</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { name: 'Vereda Agua Azul', col: C.barrio, val: 'Agua Azul', color: '#38bdf8' },
                      { name: 'Vereda Cantarito', col: C.barrio, val: 'Cantarito', color: '#06b6d4' },
                      { name: 'Vereda Chalo', col: C.barrio, val: 'Chalo', color: '#ec4899' },
                      { name: 'V. La Primavera', col: C.barrio, val: 'La Primavera', color: '#84cc16' },
                      { name: 'C. Juan Ignacio', col: C.barrio, val: 'Juan Ignacio', color: '#f59e0b' },
                      { name: 'Área Urbanizada', col: C.zona, val: 'Cabecera municipal', color: '#6366f1' },
                    ].map((item, idx) => {
                      // Buscar coincidencia flexible en las respuestas reales del dataset
                      const matchingOpt = item.col ? opts(item.col).find(o => o.toLowerCase().includes(item.val.toLowerCase())) || item.val : item.val;
                      const isSelected = filters[item.col] === matchingOpt || (filters[item.col] && filters[item.col].toLowerCase().includes(item.val.toLowerCase()));
                      
                      // Alternar filtro territorial desmarcando automáticamente cualquier selección previa
                      const handleToggleLegend = () => {
                        setFilters(prev => {
                          const next = { ...prev };
                          if (isSelected) {
                            delete next[C.zona];
                            delete next[C.barrio];
                          } else {
                            delete next[C.zona];
                            delete next[C.barrio];
                            next[item.col] = matchingOpt;
                          }
                          return next;
                        });
                      };

                      return (
                        <button 
                          key={idx}
                          onClick={handleToggleLegend}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg font-bold border transition-all cursor-pointer text-left ${
                            isSelected 
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600 shadow-sm ring-1 ring-indigo-500/30' 
                              : 'border-transparent opacity-85 hover:opacity-100'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-md shrink-0 border" style={{ backgroundColor: item.color, borderColor: item.color }} />
                          <span className="truncate text-[11px]">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Estadísticas de Distribución Territorial y Filtros de Barrios */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* Tarjetas resumen Urbana / Rural */}
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    // Contar encuestados e integrantes por Zona (Cabecera vs Rural)
                    let cantUrbanaEnc = 0;
                    let cantUrbanaHogar = 0;
                    let cantRuralEnc = 0;
                    let cantRuralHogar = 0;

                    rows.forEach(r => {
                      const zVal = s(r[C.zona]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const nHogar = Math.max(1, parseFloat(s(r[C.hogar])) || 1);
                      if (zVal.includes('cabecera') || zVal.includes('urbana') || zVal.includes('barrio')) {
                        cantUrbanaEnc += 1;
                        cantUrbanaHogar += nHogar;
                      } else {
                        cantRuralEnc += 1;
                        cantRuralHogar += nHogar;
                      }
                    });

                    const baseEnc = rows.length || 1;
                    const porcUrbana = Number(((cantUrbanaEnc / baseEnc) * 100).toFixed(1));
                    const porcRural = Number(((cantRuralEnc / baseEnc) * 100).toFixed(1));

                    const isUrbanaActive = filters[C.zona] && (filters[C.zona].toLowerCase().includes('cabecera') || filters[C.zona].toLowerCase().includes('urbana'));
                    const isRuralActive = filters[C.zona] && (filters[C.zona].toLowerCase().includes('rural') || filters[C.zona].toLowerCase().includes('vereda'));

                    const toggleZona = (zonaVal: string) => {
                      setFilters(prev => {
                        const next = { ...prev };
                        const currentZ = s(prev[C.zona]).toLowerCase();
                        if (currentZ.includes(zonaVal.toLowerCase())) {
                          delete next[C.zona];
                          delete next[C.barrio];
                        } else {
                          const matchedOpt = opts(C.zona).find(o => o.toLowerCase().includes(zonaVal.toLowerCase())) || zonaVal;
                          delete next[C.zona];
                          delete next[C.barrio];
                          next[C.zona] = matchedOpt;
                        }
                        return next;
                      });
                    };

                    return (
                      <>
                        <div 
                          onClick={() => toggleZona('cabecera')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isUrbanaActive
                              ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30' 
                              : theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-indigo-400' : 'bg-slate-800/60 border-slate-700 hover:border-indigo-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-indigo-500">Cabecera Municipal</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          </div>
                          <h5 className="text-sm font-bold">Zona Urbana</h5>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black">{cantUrbanaEnc}</span>
                            <span className="text-xs text-indigo-500 font-bold">({porcUrbana}%)</span>
                          </div>
                          <p className="text-[10px] opacity-70 mt-1">{cantUrbanaHogar} pob. en barrios cabecera</p>
                        </div>

                        <div 
                          onClick={() => toggleZona('rural')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isRuralActive
                              ? 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/30' 
                              : theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-emerald-400' : 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-emerald-500">Veredas y Campos</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          </div>
                          <h5 className="text-sm font-bold">Zona Rural</h5>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black">{cantRuralEnc}</span>
                            <span className="text-xs text-emerald-500 font-bold">({porcRural}%)</span>
                          </div>
                          <p className="text-[10px] opacity-70 mt-1">{cantRuralHogar} pob. en veredas y campos</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Lista interactiva de Barrios / Veredas destacados */}
                <div className={`p-4 rounded-2xl border flex-1 flex flex-col justify-between ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider opacity-70">Distribución por Barrio / Vereda</h5>
                    <span className="text-[10px] text-indigo-500 font-bold">Submuestra ({rows.length} encuestados)</span>
                  </div>
                  <div className="space-y-2">
                    {getFrecuencias(C.barrio, 6).map((b, idx) => {
                      const isSelected = filters[C.barrio] === b.opcion;
                      const toggleBarrio = () => {
                        setFilters(prev => {
                          const next = { ...prev };
                          if (prev[C.barrio] === b.opcion) {
                            delete next[C.barrio];
                          } else {
                            delete next[C.zona];
                            delete next[C.barrio];
                            next[C.barrio] = b.opcion;
                          }
                          return next;
                        });
                      };

                      return (
                        <div
                          key={idx}
                          onClick={toggleBarrio}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-md'
                              : theme === 'light' ? 'bg-white hover:bg-slate-200/80 text-slate-800 border border-slate-200/60' : 'bg-slate-900/60 hover:bg-slate-700/60 text-slate-200 border border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MapPin size={13} className={isSelected ? 'text-white' : 'text-indigo-500'} />
                            <span className="truncate font-medium" title={b.name}>{b.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 ml-2">
                            <span className="font-bold">{b.cantidad}</span>
                            <span className={isSelected ? 'text-indigo-100 text-[10px]' : 'opacity-70 text-[10px]'}>({b.porcentaje}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <Footer className="mt-8 pt-6" />
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
                { label: 'Autorización de Datos', col: C.autorizaDatos },
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
    </ProtectedRoute>
  );
}

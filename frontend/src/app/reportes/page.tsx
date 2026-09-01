"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '@/lib/alerts';
import { FileText, Download, Filter, Printer, Loader2 } from 'lucide-react';

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('general');
  const [downloading, setDownloading] = useState(false);

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const data = await fetchApi('/encuestas/respuestas');
      if (!data || data.length === 0) {
        showWarningAlert('Sin datos', 'No hay registros disponibles para exportar.');
        return;
      }

      // Convertir JSON a CSV
      const headers = Object.keys(data[0]).filter(k => k !== '__row_index');
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of data) {
        const values = headers.map(h => {
          const val = row[h] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_encuestas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessAlert('Reporte generado', 'El archivo CSV ha sido descargado correctamente.');
    } catch (err: any) {
      showErrorAlert('Error al exportar', err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Centro de Reportes y Exportación</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generación de reportes analíticos consolidados en formatos CSV y Excel
          </p>
        </div>

        {/* Tarjetas de Selección de Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setTipoReporte('general')}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              tipoReporte === 'general' 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-xl shadow-indigo-600/10' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FileText size={32} className={tipoReporte === 'general' ? 'text-indigo-400 mb-3' : 'text-slate-500 mb-3'} />
            <h3 className="font-bold text-lg text-white">Reporte General Consolidado</h3>
            <p className="text-xs text-slate-400 mt-2">Exporta la totalidad de respuestas y variables registradas en el sistema.</p>
          </div>

          <div 
            onClick={() => setTipoReporte('preguntas')}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              tipoReporte === 'preguntas' 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-xl shadow-indigo-600/10' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Filter size={32} className={tipoReporte === 'preguntas' ? 'text-indigo-400 mb-3' : 'text-slate-500 mb-3'} />
            <h3 className="font-bold text-lg text-white">Reporte por Frecuencia de Preguntas</h3>
            <p className="text-xs text-slate-400 mt-2">Resumen estadístico con frecuencias y porcentajes agrupados por opción.</p>
          </div>

          <div 
            onClick={() => setTipoReporte('auditoria')}
            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
              tipoReporte === 'auditoria' 
                ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-xl shadow-indigo-600/10' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Printer size={32} className={tipoReporte === 'auditoria' ? 'text-indigo-400 mb-3' : 'text-slate-500 mb-3'} />
            <h3 className="font-bold text-lg text-white">Reporte de Auditoría y Trazabilidad</h3>
            <p className="text-xs text-slate-400 mt-2">Historial inmutable de importaciones y modificaciones realizadas.</p>
          </div>
        </div>

        {/* Panel de Descarga */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Descargar Dataset Completo</h3>
            <p className="text-slate-400 text-sm mt-1">Genera un archivo delimitado por comas (.csv) compatible con Excel y Power BI</p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={downloading}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            EXPORTAR CSV
          </button>
        </div>
      </main>
    </div>
  );
}

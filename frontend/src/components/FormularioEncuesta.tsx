"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata } from '@/types';
import { Search, CheckCircle2, AlertCircle, Loader2, Save, Send } from 'lucide-react';

export default function FormularioEncuestaPage({ isPublic = false }: { isPublic?: boolean }) {
  const [cedula, setCedula] = useState('');
  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [buscado, setBuscado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [encontrado, setEncontrado] = useState<boolean | null>(null);
  const [mensaje, setMensaje] = useState('');
  
  // Estado para los valores del formulario
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [camposEncontrados, setCamposEncontrados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchApi('/encuestas/metadatos');
        setMetadata(meta);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const handleBuscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cedula.trim()) return;

    setLoading(true);
    setMensaje('');
    setEncontrado(null);

    try {
      const res = await fetchApi(`/encuestas/buscar/${cedula.trim()}`);
      setBuscado(true);
      setEncontrado(res.encontrado);

      if (res.encontrado) {
        setMensaje('Información asociada a esta cédula cargada correctamente.');
        setFormData(res.datos);
        
        // Marcar visualmente los campos encontrados
        const enc: Record<string, boolean> = {};
        Object.keys(res.datos).forEach(key => {
          if (res.datos[key]) enc[key] = true;
        });
        setCamposEncontrados(enc);
      } else {
        setMensaje('No encontramos información asociada a esta cédula. Complete todos los datos.');
        setFormData({ 'CÉDULA': cedula.trim() });
        setCamposEncontrados({});
      }
    } catch (err: any) {
      setMensaje('Error al consultar la cédula');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (campo: string, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        datos: {
          ...formData,
          'CÉDULA': cedula || formData['CÉDULA'],
          'FECHA': new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
      };

      await fetchApi('/encuestas/respuestas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      alert('¡Encuesta guardada con éxito!');
      // Resetear formulario
      setCedula('');
      setFormData({});
      setBuscado(false);
      setEncontrado(null);
    } catch (err: any) {
      alert('Error al guardar la encuesta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {isPublic ? 'Formulario de Encuesta' : 'Nueva Encuesta (Privada)'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isPublic 
            ? 'Por favor ingrese su cédula para comenzar el diligenciamiento' 
            : 'Diligencia la encuesta detectando y autocompletando datos previamente registrados'}
        </p>
      </div>

      {/* 1. Paso Inicial: Búsqueda por Cédula */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Paso 1: Identificación</h2>
        <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ingrese CÉDULA o Documento"
              className="w-full pl-4 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm font-semibold tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            BUSCAR
          </button>
        </form>

        {mensaje && (
          <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 text-sm border ${
            encontrado 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
          }`}>
            {encontrado ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{mensaje}</span>
          </div>
        )}
      </div>

      {/* 2. Paso 2: Formulario Dinámico de Preguntas */}
      {buscado && metadata && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Paso 2: Datos y Preguntas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {metadata.configuraciones.map((cfg) => {
                const isFound = camposEncontrados[cfg.campo];
                const value = formData[cfg.campo] || '';

                if (cfg.campo === 'CÉDULA') return null; // Ya ingresado arriba

                return (
                  <div key={cfg.campo} className={cfg.es_pregunta ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>
                        {cfg.campo} {cfg.obligatorio && <span className="text-rose-400">*</span>}
                      </span>
                      {isFound && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Autocompletado
                        </span>
                      )}
                    </label>

                    {cfg.tipo === 'opcion' ? (
                      <select
                        value={value}
                        onChange={(e) => handleInputChange(cfg.campo, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                        <option value="Excelente">Excelente</option>
                        <option value="Buena">Buena</option>
                        <option value="Regular">Regular</option>
                      </select>
                    ) : (
                      <input
                        type={cfg.tipo === 'numero' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleInputChange(cfg.campo, e.target.value)}
                        placeholder={`Ingrese ${cfg.campo}`}
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-2xl text-white placeholder:text-slate-500 focus:outline-none text-sm transition-all ${
                          isFound ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-700 focus:border-indigo-500'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                GUARDAR RESPUESTA
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  if (isPublic) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 relative overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-10">
        {content}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import { SurveyMetadata, ColumnConfig } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '@/lib/alerts';
import {
  validarCampo, validarDocumento, esDocumento, esSoloNumeros,
  esNombre, esCorreo, soloDigitos, soloLetras, type FieldValidation
} from '@/lib/validations';
import { 
  FilePlus, Save, Search, CheckCircle2, AlertCircle, Loader2, 
  UserCheck, HelpCircle, CheckSquare, ListChecks, Calendar, Hash, Type
} from 'lucide-react';

export default function FormularioEncuestaPage({ isPublic = false }: { isPublic?: boolean }) {
  const { theme } = useTheme();
  const { isCollapsed } = useSidebar();

  const [metadata, setMetadata] = useState<SurveyMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [cedulaInput, setCedulaInput] = useState('');
  const [verificandoCedula, setVerificandoCedula] = useState(false);
  const [cedulaDuplicada, setCedulaDuplicada] = useState<boolean | null>(null);
  const [cedulaMensaje, setCedulaMensaje] = useState('');

  // Estado de respuestas del formulario
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar metadatos y opciones dinámicas
  const loadMetadata = async () => {
    setLoadingMeta(true);
    try {
      const meta = await fetchApi('/encuestas/metadatos');
      setMetadata(meta);

      // Prellenar fecha/marca temporal por defecto
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      setFormData(prev => ({
        ...prev,
        'Marca temporal': formattedDate,
        '2. Tipo de documento': 'Cedula de Ciudadania'
      }));
    } catch (err: any) {
      setErrorMessage('Error al cargar la estructura del formulario: ' + err.message);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  // Validación de cédula existente
  const verificarDuplicado = async (valor: string) => {
    const cleanVal = valor.trim();
    if (!cleanVal || cleanVal.length < 4) {
      setCedulaDuplicada(null);
      setCedulaMensaje('');
      return;
    }

    setVerificandoCedula(true);
    setCedulaMensaje('');
    try {
      const res = await fetchApi(`/encuestas/buscar/${cleanVal}`);
      if (res.encontrado) {
        setCedulaDuplicada(true);
        setCedulaMensaje(`⚠️ Ya existe una encuesta con el documento ${cleanVal} a nombre de: ${res.datos['1. Nombre completo'] || 'Registrado'}`);
      } else {
        setCedulaDuplicada(false);
        setCedulaMensaje('✅ Documento disponible para registro nuevo.');
      }
    } catch (err) {
      setCedulaDuplicada(null);
    } finally {
      setVerificandoCedula(false);
    }
  };

  const handleInputChange = (campo: string, valor: any) => {
    let sanitized = String(valor);

    // Sanitizar según tipo de campo
    if (esDocumento(campo) || esSoloNumeros(campo)) {
      sanitized = soloDigitos(sanitized);
    } else if (esNombre(campo)) {
      sanitized = soloLetras(sanitized);
    }

    setFormData(prev => ({ ...prev, [campo]: sanitized }));

    // Validar y actualizar errores (solo si ya intentó enviar o el campo tiene valor)
    if (submittedOnce || sanitized.length > 0) {
      const { error } = validarCampo(campo, sanitized);
      setFieldErrors(prev => ({ ...prev, [campo]: error }));
    }

    // Si es campo de documento, verificar duplicado
    if (esDocumento(campo)) {
      verificarDuplicado(sanitized);
    }
  };

  // Manejo de opciones múltiples (checkboxes)
  const handleMultiOptionToggle = (campo: string, opcion: string) => {
    const currentVal = formData[campo] || '';
    let selected: string[] = currentVal ? currentVal.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

    if (selected.includes(opcion)) {
      selected = selected.filter(s => s !== opcion);
    } else {
      selected.push(opcion);
    }

    setFormData(prev => ({ ...prev, [campo]: selected.join(', ') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);
    setSubmittedOnce(true);

    // ── Validar todos los campos configurados ──────────────────────────────
    const newErrors: Record<string, string> = {};
    let firstErrorField = '';

    if (metadata?.configuraciones) {
      for (const cfg of metadata.configuraciones) {
        const valor = String(formData[cfg.campo] || '');
        const { error } = validarCampo(cfg.campo, valor);

        if (cfg.obligatorio && !valor.trim()) {
          newErrors[cfg.campo] = 'Este campo es obligatorio.';
          if (!firstErrorField) firstErrorField = cfg.campo;
        } else if (error) {
          newErrors[cfg.campo] = error;
          if (!firstErrorField) firstErrorField = cfg.campo;
        }
      }
    }

    setFieldErrors(newErrors);

    if (Object.values(newErrors).some(e => e !== '')) {
      showErrorAlert('Formulario incompleto', 'Por favor corrige los campos marcados en rojo antes de guardar.');
      if (firstErrorField) {
        const el = document.querySelector(`[data-campo="${CSS.escape(firstErrorField)}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (cedulaDuplicada) {
      showErrorAlert('Documento existente', 'No es posible registrar una encuesta con un documento que ya existe en el sistema.');
      return;
    }

    setSubmitting(true);
    try {
      await fetchApi('/encuestas/respuestas', {
        method: 'POST',
        body: JSON.stringify({ datos: formData })
      });

      setSaveSuccess(true);
      await showSuccessAlert('¡Encuesta Registrada!', 'La encuesta ha sido guardada y sincronizada exitosamente.');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setFormData({
        'Marca temporal': new Date().toLocaleDateString('es-CO'),
        '2. Tipo de documento': 'Cedula de Ciudadania'
      });
      setFieldErrors({});
      setSubmittedOnce(false);
      setCedulaDuplicada(null);
      setCedulaMensaje('');
    } catch (err: any) {
      showErrorAlert('Error al guardar', err.message || 'Error al guardar la nueva encuesta');
      setErrorMessage(err.message || 'Error al guardar la nueva encuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldInput = (cfg: ColumnConfig, idx: number) => {
    const campo = cfg.campo;
    const lower = campo.toLowerCase();
    const isMulti = lower.includes('puede marcar') || lower.includes('varias opciones') || lower.includes('estrategias');
    const valor = formData[campo] || '';
    const opciones = cfg.opciones || [];
    const fieldError = fieldErrors[campo] || '';
    const hasError = !!fieldError;

    // Título con enumeración clara y llamativa
    const displayNumber = idx + 1;
    let cleanTitle = campo;
    // Si ya empieza con "1. ", "2. ", etc., limpiamos para dar estilo unificado
    const matchNum = campo.match(/^(\d+)\.\s*(.*)$/);
    if (matchNum) {
      cleanTitle = matchNum[2];
    }

    const isDate = cfg.tipo === 'fecha' || lower.includes('fecha') || lower.includes('nacimiento');
    const isNumber = cfg.tipo === 'numero' || lower.includes('edad') || lower.includes('cuántos') || lower.includes('cuantas');

    // Icono según tipo
    let Icon = Type;
    if (isNumber) Icon = Hash;
    if (isDate) Icon = Calendar;
    if (cfg.tipo === 'opcion') Icon = ListChecks;

    // Clases del input según estado de error
    const inputBaseClass = `w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2`;
    const inputNormalClass = theme === 'light'
      ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:ring-indigo-500'
      : 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-indigo-500';
    const inputErrorClass = 'border-rose-500 bg-rose-500/5 focus:ring-rose-500/50';

    return (
      <div
        key={campo}
        data-campo={campo}
        className={`p-5 rounded-2xl border transition-all ${
          hasError
            ? 'border-rose-500/60 bg-rose-500/5'
            : theme === 'light'
            ? 'bg-white border-slate-200/90 hover:border-indigo-400 shadow-sm'
            : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-600 shadow-sm'
        } ${isMulti ? 'md:col-span-2' : ''}`}
      >
        {/* Título de la pregunta con número colorido */}
        <label className="block mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 px-2.5 py-1 rounded-lg font-black text-xs bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                {displayNumber}
              </span>
              <span className={`font-black text-xs sm:text-sm leading-snug ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}>
                {cleanTitle}
                {cfg.obligatorio && <span className="text-rose-500 font-black ml-1">*</span>}
              </span>
            </div>
            {cfg.obligatorio && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-black border border-rose-500/30">
                Requerido
              </span>
            )}
          </div>
        </label>

        {/* 1. SELECCIÓN MÚLTIPLE (Checkboxes) */}
        {isMulti && opciones.length > 0 ? (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {opciones.map((opc, oIdx) => {
                const selectedList = valor ? valor.split(',').map((s: string) => s.trim()) : [];
                const isChecked = selectedList.includes(opc);
                return (
                  <button
                    type="button"
                    key={oIdx}
                    onClick={() => handleMultiOptionToggle(campo, opc)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-600/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm' 
                        : theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                      isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-400'
                    }`}>
                      {isChecked && <CheckSquare size={12} />}
                    </div>
                    <span className="leading-tight">{opc}</span>
                  </button>
                );
              })}
            </div>
            {valor && (
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                Seleccionados: <span className="font-semibold text-indigo-500">{valor}</span>
              </p>
            )}
          </div>
        ) : opciones.length > 0 ? (
          /* 2. SELECTOR SIMPLE (Dropdown con opciones únicas) */
          <select
            value={valor}
            required={cfg.obligatorio}
            onChange={(e) => handleInputChange(campo, e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 cursor-pointer ${
              hasError
                ? inputErrorClass
                : `focus:ring-indigo-500 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`
            }`}
          >
            <option value="">-- Seleccione una opción --</option>
            {opciones.map((opc, oIdx) => (
              <option key={oIdx} value={opc}>
                {opc}
              </option>
            ))}
          </select>
        ) : isDate ? (
          /* 3. INPUT DE FECHA NATIVO */
          <div>
            <input
              type="date"
              value={valor}
              required={cfg.obligatorio}
              onChange={(e) => handleInputChange(campo, e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                hasError
                  ? inputErrorClass
                  : `focus:ring-indigo-500 ${theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'}`
              }`}
            />
            {hasError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-500">
                <AlertCircle size={12} /> {fieldError}
              </p>
            )}
          </div>
        ) : (
          /* 4. INPUT TEXTO / NÚMERO */
          <div>
            <div className="relative">
              <input
                type="text"
                inputMode={esDocumento(campo) || esSoloNumeros(campo) ? 'numeric' : 'text'}
                value={valor}
                required={cfg.obligatorio}
                placeholder={
                  esDocumento(campo)
                    ? 'Solo números (ej. 1234567890)'
                    : esNombre(campo)
                    ? 'Solo letras (ej. Juan Pérez)'
                    : esCorreo(campo)
                    ? 'correo@ejemplo.com'
                    : `Ingrese ${cleanTitle.toLowerCase()}`
                }
                onChange={(e) => handleInputChange(campo, e.target.value)}
                className={`${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass}`}
              />
              {/* Hint a la derecha para campos con restricción */}
              {(esDocumento(campo) || esSoloNumeros(campo)) && !hasError && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-800/70 px-1.5 py-0.5 rounded-md pointer-events-none">
                  #
                </span>
              )}
            </div>

            {/* Mensaje de error inline */}
            {hasError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-500">
                <AlertCircle size={12} /> {fieldError}
              </p>
            )}

            {/* Aviso especial de verificación de documento */}
            {esDocumento(campo) && cedulaMensaje && !hasError && (
              <div className={`mt-2 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                cedulaDuplicada
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}>
                {verificandoCedula ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : cedulaDuplicada ? (
                  <AlertCircle size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>{cedulaMensaje}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const formBody = (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header del formulario */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                Formulario Oficial
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {metadata?.columnas.length || 0} Preguntas / Campos
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Nueva Encuesta de Caracterización
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Diligencie todas las preguntas del cuestionario. Los datos se guardan y sincronizan automáticamente.
            </p>
          </div>

          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Save size={14} /> Ir al Guardar
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {saveSuccess && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-sm font-bold animate-fade-in">
            <CheckCircle2 size={20} className="shrink-0" />
            <span>¡Encuesta registrada exitosamente en el sistema y sincronizada!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm font-bold animate-fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Cuerpo del Formulario con todas las preguntas */}
      {loadingMeta ? (
        <div className={`p-16 rounded-3xl border text-center ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={32} />
          <p className="text-sm font-bold text-slate-400">Cargando todas las preguntas del formulario...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <FilePlus size={18} className="text-indigo-500" />
              Cuestionario Completo de Preguntas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadata?.configuraciones.map((cfg, idx) => renderFieldInput(cfg, idx))}
            </div>
          </div>

          {/* Barra inferior fija / de Guardar */}
          <div className={`p-6 rounded-3xl border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-20 backdrop-blur-xl ${
            theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
          }`}>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">Verifique los datos:</span> Las preguntas marcadas con <span className="text-rose-500 font-bold">*</span> son obligatorias.
            </div>

            <button
              type="submit"
              disabled={submitting || cedulaDuplicada === true}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Guardando encuesta...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>GUARDAR ENCUESTA</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isPublic) {
    return (
      <main className={`min-h-screen p-4 sm:p-8 flex flex-col justify-between ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}>
        <div className="flex-1">{formBody}</div>
        <footer className={`mt-8 py-4 text-center text-xs border-t ${
          theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
        }`}>
          <p className="font-medium">
            Desarrollado por{' '}
            <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
              SarriaTech Solutions S.A.S
            </span>
          </p>
        </footer>
      </main>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Sidebar />
      <main className={`transition-all duration-300 p-4 sm:p-8 pt-16 md:pt-8 ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        {formBody}
      </main>
    </div>
  );
}

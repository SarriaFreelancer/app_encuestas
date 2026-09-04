/**
 * validations.ts — Reglas de validación centralizadas para los inputs del sistema.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface FieldValidation {
  error: string;
  valid: boolean;
}

// ─── Detectores de tipo de campo ─────────────────────────────────────────────

/** Detecta si un campo es de tipo documento/cédula */
export function esDocumento(campo: string): boolean {
  const lower = campo.toLowerCase();
  return (
    lower.includes('documento') ||
    lower.includes('cédula') ||
    lower.includes('cedula') ||
    lower.includes('número de doc')
  );
}

/** Detecta si un campo es solo numérico (edad, teléfono, etc.) */
export function esSoloNumeros(campo: string): boolean {
  const lower = campo.toLowerCase();
  return (
    lower.includes('edad') ||
    lower.includes('teléfono') ||
    lower.includes('telefono') ||
    lower.includes('celular') ||
    lower.includes('cuántos') ||
    lower.includes('cuantos')
  );
}

/** Detecta si un campo es de nombre */
export function esNombre(campo: string): boolean {
  const lower = campo.toLowerCase();
  return lower.includes('nombre');
}

/** Detecta si un campo es de correo electrónico */
export function esCorreo(campo: string): boolean {
  const lower = campo.toLowerCase();
  return lower.includes('correo') || lower.includes('email') || lower.includes('e-mail');
}

// ─── Sanitizadores ───────────────────────────────────────────────────────────

/** Permite SOLO dígitos numéricos en un string */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Permite solo letras, espacios y caracteres especiales del español */
export function soloLetras(valor: string): string {
  return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, '');
}

// ─── Validadores ─────────────────────────────────────────────────────────────

/** Valida un número de documento de identidad */
export function validarDocumento(valor: string): FieldValidation {
  const clean = valor.trim();

  if (!clean) {
    return { valid: false, error: 'El número de documento es obligatorio.' };
  }
  if (!/^\d+$/.test(clean)) {
    return { valid: false, error: 'El documento debe contener solo números, sin puntos ni guiones.' };
  }
  if (clean.length < 5) {
    return { valid: false, error: 'El documento debe tener al menos 5 dígitos.' };
  }
  if (clean.length > 15) {
    return { valid: false, error: 'El documento no puede superar 15 dígitos.' };
  }
  return { valid: true, error: '' };
}

/** Valida un campo de solo números (edad, teléfono, etc.) */
export function validarNumero(valor: string, campo: string): FieldValidation {
  const clean = valor.trim();
  const lower = campo.toLowerCase();

  if (!clean) return { valid: true, error: '' }; // No obligatorio por defecto

  if (!/^\d+$/.test(clean)) {
    return { valid: false, error: 'Este campo solo acepta números enteros.' };
  }

  if (lower.includes('edad')) {
    const n = Number(clean);
    if (n < 0 || n > 120) {
      return { valid: false, error: 'La edad debe estar entre 0 y 120 años.' };
    }
  }

  if (lower.includes('teléfono') || lower.includes('telefono') || lower.includes('celular')) {
    if (clean.length < 7 || clean.length > 15) {
      return { valid: false, error: 'El número de teléfono debe tener entre 7 y 15 dígitos.' };
    }
  }

  return { valid: true, error: '' };
}

/** Valida un correo electrónico */
export function validarCorreo(valor: string): FieldValidation {
  const clean = valor.trim();
  if (!clean) return { valid: true, error: '' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(clean)) {
    return { valid: false, error: 'Ingresa un correo electrónico válido (ej. usuario@dominio.com).' };
  }
  return { valid: true, error: '' };
}

/** Valida un campo de nombre */
export function validarNombre(valor: string): FieldValidation {
  const clean = valor.trim();
  if (!clean) return { valid: true, error: '' };
  if (clean.length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (/\d/.test(clean)) {
    return { valid: false, error: 'El nombre no debe contener números.' };
  }
  return { valid: true, error: '' };
}

/**
 * Valida automáticamente cualquier campo según su nombre.
 * Retorna { valid, error } sin importar el tipo.
 */
export function validarCampo(campo: string, valor: string): FieldValidation {
  if (esDocumento(campo))    return validarDocumento(valor);
  if (esCorreo(campo))       return validarCorreo(valor);
  if (esNombre(campo))       return validarNombre(valor);
  if (esSoloNumeros(campo))  return validarNumero(valor, campo);
  return { valid: true, error: '' };
}

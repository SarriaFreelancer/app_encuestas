/**
 * session.ts — Constantes centralizadas de seguridad de sesión.
 * Modifica estos valores para ajustar los tiempos de inactividad.
 */

/** Minutos de inactividad antes de mostrar la advertencia */
export const INACTIVITY_WARNING_MINUTES = 13;

/** Segundos del contador regresivo en el modal de advertencia */
export const COUNTDOWN_SECONDS = 120;

/** Tiempo total de sesión en ms = WARNING + COUNTDOWN */
export const INACTIVITY_WARNING_MS = INACTIVITY_WARNING_MINUTES * 60 * 1000;

/** Clave en localStorage para el consentimiento de cookies */
export const COOKIE_CONSENT_KEY = 'encuestas_cookie_consent';

/** Nombre de la cookie del token de sesión */
export const SESSION_COOKIE_NAME = 'encuestas_session';

/** Días de vigencia de la cookie de sesión */
export const SESSION_COOKIE_DAYS = 1;

/** Nombre de la app para mostrar en textos legales */
export const APP_NAME = 'Plataforma de Encuestas';

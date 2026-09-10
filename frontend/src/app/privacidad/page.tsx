"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Lock, Clock, Database, ArrowLeft, Mail } from 'lucide-react';
import { APP_NAME, INACTIVITY_WARNING_MINUTES, COUNTDOWN_SECONDS, SESSION_COOKIE_DAYS } from '@/lib/session';

const COUNTDOWN_MINUTES = Math.ceil(COUNTDOWN_SECONDS / 60);

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-3">
      <span className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400">
        <Icon size={18} />
      </span>
      <h2 className="text-base font-black text-white">{title}</h2>
    </div>
    <div className="pl-12 text-sm text-slate-400 leading-relaxed space-y-2">
      {children}
    </div>
    <hr className="border-slate-800 mt-4" />
  </section>
);

export default function PrivacidadPage() {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Política de Privacidad y Cookies</h1>
              <p className="text-xs text-slate-500 mt-0.5">Última actualización: {today}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            En <span className="font-bold text-white">{APP_NAME}</span> nos comprometemos a proteger tu
            privacidad y a ser transparentes sobre cómo usamos la información de la sesión y las cookies.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        <Section icon={Database} title="1. Información que recopilamos">
          <p>
            Esta plataforma está diseñada para uso <strong className="text-white">exclusivamente interno</strong>.
            Recopilamos únicamente la información necesaria para el funcionamiento del sistema:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Credenciales de acceso (usuario y contraseña cifrada) para autenticar la sesión.</li>
            <li>Registro de actividad de auditoría (acciones realizadas dentro del sistema).</li>
            <li>Datos de las encuestas gestionadas (almacenados en la fuente de datos configurada).</li>
          </ul>
          <p>
            <strong className="text-white">No recopilamos</strong> datos personales para fines comerciales,
            ni compartimos información con terceros.
          </p>
        </Section>

        <Section icon={Cookie} title="2. Uso de cookies">
          <p>Usamos los siguientes tipos de cookies:</p>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="font-bold text-white text-xs mb-1">🔒 Cookies esenciales (obligatorias)</p>
              <p>
                Necesarias para el funcionamiento del sistema. Incluyen el token de sesión
                (<code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded-lg text-[11px]">encuestas_session</code>) que
                te mantiene autenticado durante tu trabajo.
                Duración: <strong className="text-white">{SESSION_COOKIE_DAYS} día</strong>.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="font-bold text-white text-xs mb-1">✅ Cookies de preferencia</p>
              <p>
                Guardan tu consentimiento al aviso de cookies
                (<code className="text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded-lg text-[11px]">encuestas_cookie_accepted</code>)
                para que no se muestre de nuevo. Duración: <strong className="text-white">365 días</strong>.
              </p>
            </div>
          </div>
          <p>
            <strong className="text-white">No usamos</strong> cookies de seguimiento, analíticas de terceros
            ni publicidad.
          </p>
        </Section>

        <Section icon={Clock} title="3. Seguridad de sesión e inactividad">
          <p>Para proteger el acceso no autorizado, el sistema aplica las siguientes medidas:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              Tras <strong className="text-white">{INACTIVITY_WARNING_MINUTES} minutos de inactividad</strong> se
              mostrará un aviso de sesión por expirar con un contador regresivo de{' '}
              <strong className="text-white">{COUNTDOWN_MINUTES} minutos</strong>.
            </li>
            <li>
              Si no se detecta actividad durante el contador, la sesión se cerrará automáticamente
              y serás redirigido a la pantalla de inicio de sesión.
            </li>
            <li>
              Cualquier interacción con el sistema (clic, movimiento de ratón, escritura) reinicia
              el temporizador automáticamente.
            </li>
            <li>
              El token de sesión se invalida al cerrar sesión, eliminando tanto la cookie como el
              registro en el almacenamiento local del navegador.
            </li>
          </ul>
        </Section>

        <Section icon={Lock} title="4. Protección de datos">
          <ul className="list-disc list-inside space-y-1.5">
            <li>Las contraseñas se almacenan de forma segura en el sistema de usuarios.</li>
            <li>Todas las comunicaciones entre el navegador y el servidor se realizan mediante
            protocolos seguros en entornos de producción (HTTPS).</li>
            <li>El acceso al sistema está restringido por roles: SUPERADMIN, ADMIN y USUARIO.</li>
            <li>Los registros de auditoría permiten rastrear cambios realizados en los datos.</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="5. Tus derechos">
          <p>Como usuario del sistema tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Conocer qué datos se almacenan sobre tu actividad en el sistema.</li>
            <li>Solicitar la corrección de datos incorrectos.</li>
            <li>Solicitar la eliminación de tu cuenta de usuario (sujeto a aprobación del administrador).</li>
          </ul>
        </Section>

        {/* Contacto */}
        <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">¿Tienes preguntas sobre esta política?</p>
            <p className="text-xs text-slate-400">
              Contacta al administrador del sistema. Esta política puede actualizarse periódicamente;
              los cambios importantes serán comunicados a los usuarios del sistema.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pb-4 space-y-1">
          <p>© {new Date().getFullYear()} {APP_NAME} — Uso interno exclusivo</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Desarrollado por <span className="font-bold text-indigo-400">SarriaTech Solutions S.A.S</span>
          </p>
        </div>
      </div>
    </div>
  );
}

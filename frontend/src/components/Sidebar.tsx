"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, FileSpreadsheet, FilePlus, ClipboardList, Search, 
  Users, Settings, LogOut, Bot, Menu, X, Columns, GitCompare, FileText, History
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Importar encuesta', href: '/importar', icon: FileSpreadsheet },
    { label: 'Análisis preguntas', href: '/preguntas', icon: Columns },
    { label: 'Análisis cruzado', href: '/analisis-cruzado', icon: GitCompare },
    { label: 'Nueva encuesta', href: '/encuesta/nueva', icon: FilePlus },
    { label: 'Respuestas', href: '/respuestas', icon: ClipboardList },
    { label: 'Buscar persona', href: '/buscar', icon: Search },
    { label: 'Consulta IA', href: '/consulta-ia', icon: Bot },
    { label: 'Reportes', href: '/reportes', icon: FileText },
    { label: 'Auditoría', href: '/auditoria', icon: History, adminOnly: true },
    { label: 'Usuarios', href: '/usuarios', icon: Users, adminOnly: true },
    { label: 'Configuración', href: '/configuracion', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Botón Móvil */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay Móvil */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
            E
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Encuestas AI</h1>
            <span className="text-xs text-slate-400">Plataforma Analítica</span>
          </div>
        </div>

        {/* Info Usuario */}
        {user && (
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/40">
            <p className="text-sm font-semibold text-slate-200 truncate">{user.nombre}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                user.rol === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {user.rol}
              </span>
              <span className="text-xs text-slate-400 truncate">{user.correo}</span>
            </div>
          </div>
        )}

        {/* Menú de Navegación Completo */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && user?.rol !== 'ADMIN') return null;

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

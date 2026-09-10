"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  LayoutDashboard, FileSpreadsheet, FilePlus, ClipboardList, Search, 
  Users, Settings, LogOut, Bot, Menu, X, Columns, GitCompare, FileText, History,
  ChevronLeft, ChevronRight, Sun, Moon, ShieldCheck
} from 'lucide-react';

import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleCollapsed, isOpenMobile, setIsOpenMobile } = useSidebar();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Importar encuesta', href: '/importar', icon: FileSpreadsheet },
    { label: 'Análisis preguntas', href: '/preguntas', icon: Columns },
    { label: 'Respuestas', href: '/respuestas', icon: ClipboardList },
    { label: 'Buscar persona', href: '/buscar', icon: Search },
    { label: 'Reportes', href: '/reportes', icon: FileText },
    { label: 'Nueva encuesta', href: '/encuesta/nueva', icon: FilePlus },
    { label: 'Usuarios', href: '/usuarios', icon: Users, adminOnly: true },
    // Módulos exclusivos de SUPERADMIN (Ocultos para admin y operadores)
    { label: 'Análisis cruzado', href: '/analisis-cruzado', icon: GitCompare, superAdminOnly: true },
    { label: 'Consulta IA', href: '/consulta-ia', icon: Bot, superAdminOnly: true },
    { label: 'Auditoría', href: '/auditoria', icon: History, superAdminOnly: true },
    { label: 'Configuración', href: '/configuracion', icon: Settings, superAdminOnly: true },
  ];

  const isUserAdmin = user?.rol === 'ADMIN';
  const isUserSuperAdmin = user?.rol === 'SUPERADMIN';

  return (
    <>
      {/* Botón flotante para Móvil */}
      <button 
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
        aria-label="Abrir menú"
      >
        {isOpenMobile ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay Móvil */}
      {isOpenMobile && (
        <div 
          onClick={() => setIsOpenMobile(false)} 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
        />
      )}

      {/* Sidebar Principal Responsivo */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r
        ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        ${isOpenMobile ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Logo */}
        <div className={`p-4 border-b flex items-center justify-between ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl shrink-0 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
              E
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="truncate">
                <h1 className="font-extrabold text-base leading-tight">VCA VILLA RICA</h1>
                <span className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Plataforma Analítica</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Usuario */}
        {user && (!isCollapsed || isOpenMobile) && (
          <div className={`px-4 py-3.5 border-b ${theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-800/40'}`}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold truncate">{user.nombre}</p>
              {user.rol === 'SUPERADMIN' ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                  SUPER ADMIN
                </span>
              ) : (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                  user.rol === 'ADMIN' 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user.rol}
                </span>
              )}
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {user.correo}
            </p>
          </div>
        )}

        {/* Menú de Navegación Completo */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            if (item.superAdminOnly && !isUserSuperAdmin) return null;
            if (item.adminOnly && !isUserAdmin && !isUserSuperAdmin) return null;

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpenMobile(false)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : theme === 'light'
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}
                  ${isCollapsed && !isOpenMobile ? 'justify-center px-2' : ''}
                `}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : ''}`} />
                {(!isCollapsed || isOpenMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Modo Claro/Oscuro, Minimizar a Iconos y Cerrar Sesión */}
        <div className={`p-3 border-t space-y-1.5 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          {/* Botón Modo Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs transition-colors cursor-pointer
              ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400 shrink-0" /> : <Moon size={18} className="text-indigo-600 shrink-0" />}
            {!isCollapsed && (
              <span className="truncate">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
            )}
          </button>

          {/* Botón Minimizar / Expandir a iconos abajo (Solo Desktop) */}
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? "Expandir menú lateral" : "Minimizar a iconos"}
            className={`
              hidden md:flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-colors cursor-pointer
              ${theme === 'light' 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'}
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            <span className="font-mono text-sm text-indigo-400 font-black shrink-0">
              {isCollapsed ? '>>' : '<<'}
            </span>
            {!isCollapsed && (
              <span className="truncate">Contraer menú</span>
            )}
          </button>

          {/* Cerrar Sesión */}
          <button
            onClick={() => logout('manual')}
            title="Cerrar sesión"
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer
              ${isCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Cerrar sesión</span>}
          </button>

          {/* Copyright */}
          <div className={`pt-2 mt-1 border-t text-center ${
            theme === 'light' ? 'border-slate-200/80' : 'border-slate-800/80'
          }`}>
            {isCollapsed && !isOpenMobile ? (
              <span 
                className={`text-[9px] font-extrabold tracking-wider block ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}
                title="Desarrollado por SarriaTech Solutions S.A.S"
              >
                STS
              </span>
            ) : (
              <p className={`text-[10px] font-medium leading-tight ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Desarrollado por{' '}
                <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  SarriaTech Solutions S.A.S
                </span>
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

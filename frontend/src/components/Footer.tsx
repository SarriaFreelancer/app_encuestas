"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Footer({ className = "" }: { className?: string }) {
  const { theme } = useTheme();

  return (
    <footer className={`py-4 text-center text-xs transition-colors border-t ${
      theme === 'light' ? 'text-slate-500 border-slate-200/80' : 'text-slate-400 border-slate-800/80'
    } ${className}`}>
      <p className="font-medium">
        © {new Date().getFullYear()} — Desarrollado por{' '}
        <span className={`font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
          SarriaTech Solutions S.A.S
        </span>
      </p>
    </footer>
  );
}

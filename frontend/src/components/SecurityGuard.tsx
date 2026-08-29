"use client";

import { useEffect } from 'react';

/**
 * Componente de Protección de Seguridad en Cliente:
 * 1. Deshabilita el menú contextual (Clic derecho).
 * 2. Bloquea atajos de teclado para Inspeccionar / DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U).
 * 3. Previene la selección accidental de código fuente y arrastre.
 */
export function SecurityGuard() {
  useEffect(() => {
    // 1. Bloquear clic derecho (context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Bloquear atajos de herramientas de desarrollador
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + Shift + I (Inspeccionar elemento)
      // Ctrl + Shift + J (Consola de desarrollador)
      // Ctrl + Shift + C (Selector de elementos)
      // Ctrl + Shift + K (Firefox devtools)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U (Ver código fuente de la página)
      // Ctrl + S (Guardar página)
      if (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}

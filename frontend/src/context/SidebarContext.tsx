"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleCollapsed: () => {},
  isOpenMobile: false,
  setIsOpenMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed, isOpenMobile, setIsOpenMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);

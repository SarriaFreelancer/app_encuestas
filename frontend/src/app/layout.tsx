"use client";

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { SecurityGuard } from '@/components/SecurityGuard';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased font-sans select-none">
        <SecurityGuard />
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

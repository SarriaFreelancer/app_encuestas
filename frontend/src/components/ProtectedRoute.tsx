"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (requireSuperAdmin && user.rol !== 'SUPERADMIN') {
        router.replace('/dashboard');
      } else if (requireAdmin && user.rol !== 'ADMIN' && user.rol !== 'SUPERADMIN') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router, requireAdmin, requireSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={36} />
        <p className="text-sm font-semibold text-slate-400">Verificando sesión segura...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireSuperAdmin && user.rol !== 'SUPERADMIN') {
    return null;
  }

  if (requireAdmin && user.rol !== 'ADMIN' && user.rol !== 'SUPERADMIN') {
    return null;
  }

  return <>{children}</>;
}

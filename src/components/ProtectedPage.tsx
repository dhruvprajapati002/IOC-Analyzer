'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface ProtectedPageProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedPage({ children, requireAdmin = false }: ProtectedPageProps) {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && requireAdmin && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, requireAdmin, router]);

  if (isLoading) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

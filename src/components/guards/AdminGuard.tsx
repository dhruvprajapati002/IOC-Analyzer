// components/guards/AdminGuard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { APP_COLORS, CARD_STYLES } from '@/lib/colors';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  errorMessage?: string;
}

export function AdminGuard({
  children,
  fallback,
  redirectTo = '/',
  errorMessage = 'Admin privileges required to access this page.',
}: AdminGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect if not admin
    if (!user || !isAdmin) {
      setAuthError(errorMessage);
      const timeout = setTimeout(() => {
        router.replace(redirectTo);
      }, 2500);
      return () => clearTimeout(timeout);
    }

    // Clear any previous errors
    setAuthError(null);
  }, [user, isAdmin, isLoading, router, redirectTo, errorMessage]);

  // Show skeleton while auth loads
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: APP_COLORS.backgroundSoft }}
      >
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full mx-auto mb-4 bg-t-surfaceMuted/40" />
          <div className="h-4 w-48 mx-auto bg-t-surfaceMuted/30 rounded" />
        </div>
      </div>
    );
  }

  // Show error UI if not authorized
  if (authError || !user || !isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: APP_COLORS.backgroundSoft }}
      >
        <Card
          className={`${CARD_STYLES.base} max-w-md w-full shadow-2xl`}
          style={{ backgroundColor: APP_COLORS.surface }}
        >
          <CardContent className="p-8 text-center space-y-6">
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{
                backgroundColor: `${APP_COLORS.danger}20`,
                border: `3px solid ${APP_COLORS.danger}40`,
              }}
            >
              <AlertTriangle
                className="h-10 w-10"
                style={{ color: APP_COLORS.danger }}
              />
            </div>
            <div>
              <h2
                className="text-2xl font-black mb-3"
                style={{ color: APP_COLORS.textPrimary }}
              >
                🔒 Access Denied
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: APP_COLORS.textSecondary }}
              >
                {authError || errorMessage}
              </p>
              <div className="text-xs text-center space-y-1 opacity-75" style={{ color: APP_COLORS.textMuted }}>
                <p>Redirecting in 3 seconds...</p>
                <p>Or click below to return early</p>
              </div>
            </div>
            <Button
              onClick={() => router.push(redirectTo)}
              style={{ backgroundColor: APP_COLORS.primary }}
              className="w-full h-12 font-bold"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
}

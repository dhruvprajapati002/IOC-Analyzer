'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && pathname !== '/dashboard') {
        // Redirect authenticated users to dashboard
        router.replace('/dashboard');
      } else if (!isAuthenticated && pathname !== '/login') {
        // Redirect non-authenticated users to login
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading state while checking auth
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: APP_COLORS.background }}
    >
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
          style={{
            borderColor: `${APP_COLORS.primary} transparent transparent transparent`
          }}
        />
        <p
          className={TYPOGRAPHY.body.md}
          style={{ color: APP_COLORS.textSecondary }}
        >
          Redirecting...
        </p>
      </div>
    </div>
  );
}

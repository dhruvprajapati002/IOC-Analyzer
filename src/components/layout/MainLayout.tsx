'use client';

import React, { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isPublicRoute, normalizeRoute } from '@/lib/routes';
import { APP_COLORS } from '@/lib/colors';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: APP_COLORS.background }}
    >
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div
            className="absolute inset-0 border-4 rounded-full animate-spin"     
            style={{
              borderColor: `${APP_COLORS.primary}30`,
              borderTopColor: APP_COLORS.primary,
            }}
          />
        </div>
        <div className="font-semibold text-lg" style={{ color: APP_COLORS.textPrimary }}>
          Loading...
        </div>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = normalizeRoute(usePathname() || '/');

  const routeIsPublic = isPublicRoute(pathname);

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated || routeIsPublic) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: APP_COLORS.background, color: APP_COLORS.textPrimary }}
      >
        {children}
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: APP_COLORS.background, color: APP_COLORS.textPrimary }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content Area - Push right by sidebar width */}
      <div className="flex w-full flex-col ">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative w-full h-full">
            {children}
        </main>
      </div>
    </div>
  );
}

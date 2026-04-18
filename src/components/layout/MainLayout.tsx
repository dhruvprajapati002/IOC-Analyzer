'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRoute, normalizeRoute } from '@/lib/routes';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ScrollArea } from '@/components/ui/ScrollArea';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f5]">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#c964424d] border-t-[#c96442]" />
        </div>
        <div className="text-lg font-semibold text-t-textPrimary">
          Loading...
        </div>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const pathname = normalizeRoute(usePathname() || '/');
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const adminRoute = isAdminRoute(pathname);

  if (isLoading) return <LoadingScreen />;

  if (isAuthPage || (adminRoute && !isAdmin)) {
    return <div className="min-h-screen bg-[#faf9f5] text-t-textPrimary">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf9f5] text-t-textPrimary">
      <Sidebar />
      
      {/* Main Content Area - Push right by sidebar width */}
      <div className="flex w-full flex-col bg-[#faf9f5]">
        <Header />
        
        <ScrollArea
          asChild
          className="relative h-full w-full flex-1 bg-[#faf9f5] p-4 sm:p-6 md:p-8"
          variant="thin"
        >
          <main>
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}

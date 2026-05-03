'use client';
import React from 'react';
import { APP_COLORS } from '@/lib/colors';
import VigilanceLogo from '@/components/brand/VigilanceLogo';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

export function Header() {
  const { toggleSidebar } = useSidebar();
  return (
    <header
      className="sticky top-0 z-40 flex h-17 w-full items-center justify-between border-b px-4 sm:px-6  transition-all"
      style={{
        backgroundColor: APP_COLORS.background,
        borderColor: APP_COLORS.border,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-black/5 transition-colors"
          style={{ color: APP_COLORS.textPrimary }}
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <VigilanceLogo variant="wordmark" size="lg" theme="light" showTagline={false} href="/" />
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden h-9 w-9 items-center justify-center rounded-full sm:flex" style={{ backgroundColor: APP_COLORS.surfaceSoft }}>
          <span className="text-sm font-medium" style={{ color: APP_COLORS.textPrimary }}>SI</span>
        </div>
      </div>
    </header>
  );
}

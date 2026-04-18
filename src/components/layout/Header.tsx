'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { APP_COLORS } from '@/lib/colors';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/analyze':       'Threat Hunting',
  '/file-analysis': 'File Analysis',
  '/history':       'Reports & Alerts',
  '/about':         'About SentinelIQ',
};

export function Header() {
  const pathname = usePathname() || '/';

  return (
    <header
      className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 sm:px-6 transition-all"
      style={{
        backgroundColor: APP_COLORS.backgroundSoft,
        borderColor: APP_COLORS.border,
      }}
    >
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold sm:text-2xl" style={{ color: APP_COLORS.textPrimary }}>
          {PAGE_TITLES[pathname] || 'Dashboard'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden h-9 w-9 items-center justify-center rounded-full sm:flex" style={{ backgroundColor: APP_COLORS.surfaceSoft }}>
          <span className="text-sm font-medium" style={{ color: APP_COLORS.textPrimary }}>SI</span>
        </div>
      </div>
    </header>
  );
}

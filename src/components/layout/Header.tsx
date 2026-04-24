'use client';
import React from 'react';
import { APP_COLORS } from '@/lib/colors';
import VigilanceLogo from '@/components/brand/VigilanceLogo';

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex h-17 w-full items-center justify-between border-b px-4 sm:px-6  transition-all"
      style={{
        backgroundColor: APP_COLORS.background,
        borderColor: APP_COLORS.border,
      }}
    >
      <div className="flex items-center">
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

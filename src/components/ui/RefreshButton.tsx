'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { APP_COLORS, BUTTON_STYLES } from '@/lib/colors';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  justRefreshed?: boolean;
  lastUpdated?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function RefreshButton({
  onRefresh,
  isLoading,
  justRefreshed = false,
  lastUpdated,
  size = 'sm',
  className = '',
  disabled = false,
}: RefreshButtonProps) {
  const baseClasses = `
    font-black shadow-lg rounded-xl transition-all duration-300 hover:scale-[1.02]
    flex items-center gap-2
    ${BUTTON_STYLES.primary}
  `;

  const getButtonContent = () => {
    if (justRefreshed) {
      return (
        <>
          <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4" style={{ color: APP_COLORS.success }} />
          <span className="font-black tracking-wider" style={{ color: APP_COLORS.success }}>Updated</span>
        </>
      );
    }

    return (
      <>
        <RefreshCw 
          className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${isLoading ? 'animate-spin' : ''}`} 
          style={{ color: isLoading ? APP_COLORS.primary : APP_COLORS.textPrimary }}
        />
        <span className="font-black tracking-wider">Refresh</span>
      </>
    );
  };

  return (
    <div className="flex items-center gap-3">
      {/* Last Updated (Desktop) */}
      {lastUpdated && (
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: APP_COLORS.textDim }}>
            Last updated
          </span>
          <span className="text-xs font-medium" style={{ color: APP_COLORS.textSecondary }}>
            {lastUpdated}
          </span>
        </div>
      )}

      {/* Refresh Button */}
      <Button
        onClick={onRefresh}
        disabled={isLoading || disabled}
        className={`
          ${baseClasses}
          ${size === 'sm' ? 'px-4 py-2 text-sm' : size === 'md' ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg'}
          ${justRefreshed 
            ? `bg-gradient-to-r from-${APP_COLORS.success}20 to-${APP_COLORS.success}10 border-${APP_COLORS.success}40 shadow-${APP_COLORS.success}30` 
            : `bg-${APP_COLORS.surfaceSoft}e6 border-${APP_COLORS.borderSoft}80`
          }
          ${className}
        `}
        style={{
          backgroundColor: justRefreshed 
            ? `linear-gradient(135deg, ${APP_COLORS.success}20, ${APP_COLORS.success}10)`
            : `${APP_COLORS.surfaceSoft}e6`,
          borderColor: justRefreshed 
            ? `${APP_COLORS.success}40` 
            : `${APP_COLORS.borderSoft}80`,
          color: APP_COLORS.textPrimary,
          boxShadow: justRefreshed 
            ? `0 0 15px ${APP_COLORS.success}30` 
            : `0 4px 12px rgba(0,0,0,0.3)`,
        }}
      >
        {getButtonContent()}
      </Button>
    </div>
  );
}

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_COLORS } from '@/lib/colors';
import { TYPOGRAPHY } from '@/lib/typography';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onMenuClick?: () => void;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  actions,
  onMenuClick 
}: PageHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`sticky top-0 z-30 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
      style={{
        backgroundColor: scrolled 
          ? `${APP_COLORS.backgroundSoft}` 
          : APP_COLORS.backgroundSoft,
        borderBottom: `1px solid ${scrolled ? APP_COLORS.borderSoft : 'transparent'}`,
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden h-10 w-10 rounded-xl hover:scale-105 transition-all"
                style={{
                  backgroundColor: `${APP_COLORS.primary}10`,
                  color: APP_COLORS.primary,
                }}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Icon */}
            {icon && (
              <div
                className="hidden sm:flex p-2.5 rounded-xl border-2 transition-all"
                style={{
                  backgroundColor: `${APP_COLORS.primary}20`,
                  borderColor: `${APP_COLORS.primary}40`,
                }}
              >
                {icon}
              </div>
            )}

            {/* Title & Subtitle */}
            <div>
              <h1
                className={`${TYPOGRAPHY.heading.h2} text-lg sm:text-xl lg:text-2xl`}
                style={{ color: APP_COLORS.textPrimary }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={`${TYPOGRAPHY.caption.lg} text-xs sm:text-sm`}
                  style={{ color: APP_COLORS.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

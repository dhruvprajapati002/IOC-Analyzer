'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  History, 
  Info
} from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { ScrollArea } from '@/components/ui/ScrollArea';
import VigilanceLogo from '@/components/brand/VigilanceLogo';

const navigationItems = [
  { href: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/analyze',       label: 'Threat Hunting',   icon: Search },
  { href: '/file-analysis', label: 'File Analysis',    icon: FileText },
  { href: '/history',       label: 'Reports & Alerts', icon: History },
  { href: '/about',         label: 'About',            icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full border-r relative z-50 transition-colors shadow-none"
      style={{
        width: '70px',
        minWidth: '70px',
        backgroundColor: APP_COLORS.background,
        borderColor: APP_COLORS.border,
        color: APP_COLORS.textPrimary
      }}
    >
      <div
        className="border-b"
        style={{
          borderColor: APP_COLORS.border,
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 0',
        }}
      >
        <VigilanceLogo variant="icon" size="sm" theme="light" href="/" />
      </div>

      <ScrollArea asChild className="flex-1 px-3 py-4" variant="thin">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center rounded-lg transition-colors overflow-hidden"
                style={{
                  padding: '0.75rem 0',
                  justifyContent: 'center',
                  backgroundColor: isActive ? APP_COLORS.surfaceAlt : 'transparent',
                  color: isActive ? APP_COLORS.primary : APP_COLORS.textSecondary,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = APP_COLORS.surfaceAlt;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={item.label}
              >
                <item.icon className="shrink-0 h-6 w-6" />
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

    </aside>
  );
}

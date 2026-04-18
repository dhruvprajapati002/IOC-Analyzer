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
        backgroundColor: APP_COLORS.surface,
        borderColor: APP_COLORS.border,
        color: APP_COLORS.textPrimary
      }}
    >
      <div className="flex h-16 shrink-0 items-center border-b px-4" style={{ borderColor: APP_COLORS.border, justifyContent: 'center' }}>
        <div className="flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 shrink-0"
            style={{ color: APP_COLORS.primary }}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
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

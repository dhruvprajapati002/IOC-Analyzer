'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  History, 
  Info,
  X
} from 'lucide-react';
import { APP_COLORS } from '@/lib/colors';
import { ScrollArea } from '@/components/ui/ScrollArea';
import VigilanceLogo from '@/components/brand/VigilanceLogo';
import { useSidebar } from '@/contexts/SidebarContext';

const navigationItems = [
  { href: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/analyze',       label: 'Threat Hunting',   icon: Search },
  { href: '/file-analysis', label: 'File Analysis',    icon: FileText },
  { href: '/history',       label: 'Reports & Alerts', icon: History },
  { href: '/about',         label: 'About',            icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-72 lg:w-[70px] lg:min-w-[70px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: APP_COLORS.background,
          borderColor: APP_COLORS.border,
          color: APP_COLORS.textPrimary
        }}
      >
        <div
          className="border-b relative"
          style={{
            borderColor: APP_COLORS.border,
            display: 'flex',
            justifyContent: 'center',
            padding: '16px 0',
          }}
        >
          <VigilanceLogo variant="icon" size="md" theme="light" href="/" />
          
          <button
            onClick={closeSidebar}
            className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden p-1 rounded-md hover:bg-black/10"
            style={{ color: APP_COLORS.textPrimary }}
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
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
    </>
  );
}

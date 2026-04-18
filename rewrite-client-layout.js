const fs = require('fs');

const clientLayoutCode = \'use client';

import { useState, ReactNode } from 'react';
import { usePathname, useRouter }         from 'next/navigation';
import { Sidebar }                         from '@/components/layout/Sidebar';
import { AuthProvider, useAuth }           from '@/contexts/AuthContext';
import { SidebarProvider }                 from '@/contexts/SidebarContext';
import { APP_COLORS }          from '@/lib/colors';
import { isPublicRoute, normalizeRoute }   from '@/lib/routes';
import {MainTopbar} from "@design-pattern/main-topbar";

// Design-wrapper sidebar widths — must match Sidebar.css
// .sidebar-container.collapsed { width: 80px }
// .sidebar-container.expanded  { width: 256px }
const SIDEBAR_COLLAPSED_W = 80;
const SIDEBAR_EXPANDED_W  = 256;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/analyze':       'Threat Hunting',
  '/file-analysis': 'File Analysis',
  '/history':       'Reports & Alerts',
  '/about':         'About SentinelIQ',
};

//  Loading 
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
              borderColor:    \\\\\\30\\\,
              borderTopColor:  APP_COLORS.primary,
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

//  MainLayout 
function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router   = useRouter();
  const pathname = normalizeRoute(usePathname() || '/');

  // Default collapsed (80px) — matches design wrapper's default closed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const routeIsPublic = isPublicRoute(pathname);

  if (isLoading) return <LoadingScreen />;

  //  Public / unauthenticated — no sidebar, no header 
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

  //  Logout handler — passed down to Sidebar  DesignSidebar 
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
      <div className="flex overflow-visible"
            style={{ backgroundColor: APP_COLORS.background, color: APP_COLORS.textPrimary }}
      >
        <Sidebar
            onCollapsedChange={setSidebarCollapsed}
            onLogout={handleLogout}
        />
        <div
            className="flex min-h-screen flex-col flex-1 transition-all duration-300 ease-in-out"
            style={{ marginLeft: !sidebarCollapsed ? '256px' : '80px' }}
        >
          <div className="sticky top-0 z-[110]" style={{ backgroundColor: APP_COLORS.background }}>
            <MainTopbar routeLabels={PAGE_TITLES} />
          </div>

          <main
              className="min-h-screen pt-12 transition-[margin-left] duration-300 ease-in-out"
          >
            {children}
          </main>
        </div>
      </div>
  );
}

//  Root export 
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <MainLayout>{children}</MainLayout>
      </SidebarProvider>
    </AuthProvider>
  );
}\;

const appCode = \import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Hanken_Grotesk, Roboto_Mono } from 'next/font/google';
import ClientLayout from '@/app/ClientLayout';
import { Toaster } from '@/components/ui/sonner';
import { APP_COLORS } from '@/lib/colors';
import '@/app/globals.css';
import '@/lib/crypto-polyfill';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-hanken',
  display: 'swap',
  preload: true,
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SentinelIQ</title>
        <meta
          name="description"
          content="Cyber Threat Intelligence Platform"
        />
        <meta
          name="keywords"
          content="threat intelligence, IOC analysis, cybersecurity, malware detection"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/sentineliq-mark.svg" />
      </Head>

      <div
        className={\\\\\\ \\\ \\\\\\}
        style={{
          backgroundColor: APP_COLORS.background,
          color:           APP_COLORS.textPrimary,
        }}
      >
          <ClientLayout>
            <Component {...pageProps} />
          </ClientLayout>
        <Toaster
          position="top-right"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: APP_COLORS.surface,
              color: APP_COLORS.textPrimary,
              border: \\\1px solid \\\\\\,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-hanken)',
            },
            className: 'backdrop-blur-sm',
            duration: 4000,
          }}
        />
      </div>
    </>
  );
}\;

fs.writeFileSync('src/app/ClientLayout.tsx', clientLayoutCode, 'utf8');
fs.writeFileSync('src/pages/_app.tsx', appCode, 'utf8');

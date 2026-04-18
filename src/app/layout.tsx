import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { APP_COLORS } from '@/lib/colors';
import '@/lib/crypto-polyfill';
import ClientLayout from './ClientLayout';

// ThemeSelection removed — ClientLayout renders it via dynamic(ssr:false)

// ============================================================================
// FONTS - Hanken Grotesk as Primary Font
// ============================================================================

// Hanken Grotesk - Primary font for entire application
const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-hanken',
  display: 'swap',
  preload: true,
});

// Roboto Mono - For code blocks and technical text
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
});

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'SentinelIQ',
  description: 'Cyber Threat Intelligence Platform',
  keywords: ['threat intelligence', 'IOC analysis', 'cybersecurity', 'malware detection'],
  authors: [{ name: 'SentinelIQ Team' }],
  icons: {
    icon: '/sentineliq-mark.svg',
    shortcut: '/sentineliq-mark.svg',
    apple: '/sentineliq-mark.svg',
  },
  openGraph: {
    title: 'SentinelIQ',
    description: 'Cyber Threat Intelligence Platform',
    type: 'website',
  },
 
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html 
      lang="en" 
      className={`${hankenGrotesk.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className={hankenGrotesk.className}
        style={{ 
          backgroundColor: APP_COLORS.background,
          color: APP_COLORS.textPrimary,
        }}
        suppressHydrationWarning
      >
        
        {/* Main Content with Client-side Features */}
        <ClientLayout>
          {children}
        </ClientLayout>

        {/* Toast Notifications with Custom Styling */}
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: APP_COLORS.surface,
              color: APP_COLORS.textPrimary,
              border: `1px solid ${APP_COLORS.borderSoft}`,
              fontSize: '0.875rem',
              fontFamily: 'var(--font-hanken)',
            },
            className: 'backdrop-blur-sm',
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}

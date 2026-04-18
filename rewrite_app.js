const fs = require('fs');

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

fs.writeFileSync('src/pages/_app.tsx', appCode, 'utf8');

// I also need to fix src/app/layout.tsx
let layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(/import ThemeClassBootstrap from '@\/components\/theme\/ThemeClassBootstrap';/g, '');
layoutCode = layoutCode.replace(/<ThemeClassBootstrap \/>/g, '');
fs.writeFileSync('src/app/layout.tsx', layoutCode, 'utf8');

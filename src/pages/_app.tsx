import type { AppProps } from 'next/app';
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
        className={`${hankenGrotesk.className} ${hankenGrotesk.variable} ${robotoMono.variable}`}
        style={{
          // Use CSS vars so the beforeInteractive script + applyTheme() take effect.
          // Spreading APP_THEME_CSS_VARS here would create inline var overrides that
          // take precedence over :root vars and prevent theme switching from working.
          backgroundColor: '' + APP_COLORS.background ,
          color:           '' + APP_COLORS.textPrimary ,
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
              border: `1px solid ${APP_COLORS.borderSoft}`,
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
}

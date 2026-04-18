import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Tooltip classes for ThreatTypePieChart
    'text-white',
    'text-gray-200',
    'text-gray-300',
    'text-gray-400',
    'bg-slate-900',
    'border-slate-600',
    'border-slate-400',
    'border-slate-500',
    'bg-slate-600',
    'bg-slate-700',
    'shadow-2xl',
    'rounded-md',
    'backdrop-blur-sm',
    // Animation classes
    'transition-colors',
    'transition-all',
    'duration-300',
    'ease-in-out',
  ],
  theme: {
    extend: {
      // ✅ Added font family configuration
      fontFamily: {
        // JetBrains Mono for body and technical text
        // Primary font - Hanken Grotesk
        sans: ['var(--font-hanken)', 'Helvetica', 'Arial', 'sans-serif'],
        
        // Monospace font for code
        mono: ['var(--font-mono)', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        
        
      },
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        // Shared-component Sidebar theme tokens
        t: {
          sidebar: 'var(--t-sidebar)',
          border: 'var(--t-border)',
          borderSoft: 'var(--t-borderSoft)',
          borderHover: 'var(--t-borderHover)',
          textPrimary: 'var(--t-textPrimary)',
          textSecondary: 'var(--t-textSecondary)',
          textMuted: 'var(--t-textMuted)',
          textLighter: 'var(--t-textLighter)',
          textOffWhite: 'var(--t-textOffWhite)',
          primary: 'var(--t-primary)',
          primaryLight: 'var(--t-primaryLight)',
          primaryMuted: 'var(--t-primaryMuted)',
          primaryHover: 'var(--t-primaryHover)',
          bg: 'var(--t-bg)',
          bgDeep: 'var(--t-bgDeep)',
          surface: 'var(--t-surface)',
          surfaceAlt: 'var(--t-surfaceAlt)',
          surfaceMuted: 'var(--t-surfaceMuted)',
          surfaceTint: 'var(--t-surfaceTint)',
          surfaceTintDark: 'var(--t-surfaceTintDark)',
          success: 'var(--t-success)',
          warning: 'var(--t-warning)',
          danger: 'var(--t-danger)',
          dangerLight: 'var(--t-dangerLight)',
          info: 'var(--t-info)',
          accentViolet: 'var(--t-accentViolet)',
          accentBlue: 'var(--t-accentBlue)',
          accentBlueDark: 'var(--t-accentBlueDark)',
          accentIndigo: 'var(--t-accentIndigo)',
          accentPurple600: 'var(--t-accentPurple600)',
          accentCyan: 'var(--t-accentCyan)',
          accentYellow: 'var(--t-accentYellow)',
        },
      },
      boxShadow: {
        't-sidebar': '0 4px 24px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      // ✅ Added border radius for consistency
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config as Config

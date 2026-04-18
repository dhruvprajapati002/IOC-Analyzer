// lib/typography.ts

export const TYPOGRAPHY = {
  // Display (Hero sections, landing pages)
  display: {
    xl: 'text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight',    // 60-84px
    lg: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight',    // 48-72px
    md: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight',    // 36-60px
    sm: 'text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight',    // 30-48px
  },

  // Headings (Page titles, section headers)
  heading: {
    h1: 'text-3xl sm:text-4xl font-black tracking-tight',                // 36-48px - Main dashboard title
    h2: 'text-2xl sm:text-3xl font-bold tracking-tight',                 // 30-36px - Section titles
    h3: 'text-xl sm:text-2xl font-bold',                                 // 24-30px
    h4: 'text-lg sm:text-xl font-bold',                                  // 18-24px - Card titles
    h5: 'text-base sm:text-lg font-bold',                                // 16-20px
    h6: 'text-sm sm:text-base font-bold',                                // 14-16px
  },

  // Body (Main content text)
  body: { 
    xl: 'text-xl font-medium leading-relaxed',                            // 20px
    lg: 'text-lg font-medium leading-relaxed',                            // 18px
    md: 'text-base font-medium leading-normal',                           // 16px
    sm: 'text-sm font-medium leading-normal',                             // 14px
    xs: 'text-xs font-medium leading-tight',                              // 12px
  },

  // Labels (Form labels, card titles, badges)
  label: {
    xl: 'text-base font-semibold uppercase tracking-wide',                // 16px
    lg: 'text-sm font-semibold uppercase tracking-wide',                  // 14px
    md: 'text-xs font-semibold uppercase tracking-wide',                  // 12px
    sm: 'text-[11px] font-semibold uppercase tracking-wide',              // 11px
    xs: 'text-[10px] font-semibold uppercase tracking-wider',             // 10px
  },

  // Data (Numbers, metrics, stats)
  data: {
    xl: 'text-5xl font-black font-mono',                                  // 60px
    lg: 'text-4xl font-black font-mono',                                  // 48px
    md: 'text-3xl font-black font-mono',                                  // 36px
    sm: 'text-2xl font-black font-mono',                                  // 30px
    xs: 'text-xl font-black font-mono',                                   // 24px
  },

  // Code (Technical text, monospace)
  code: {
    lg: 'text-base font-mono leading-relaxed',                            // 16px
    md: 'text-sm font-mono leading-normal',                               // 14px
    sm: 'text-xs font-mono leading-tight',                                // 12px
  },

  // Caption (Metadata, timestamps, helper text)
  caption: {
    lg: 'text-sm font-medium',                                            // 14px
    md: 'text-xs font-medium',                                            // 12px
    sm: 'text-[11px] font-medium',   
    xs: 'text-[11px] font-medium',                                       // 11px
  },

  // Utility classes
  truncate: 'truncate',
  lineClamp: {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
    4: 'line-clamp-4',
  },
  fontWeight: {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
    extrabold: 'font-extrabold',
  },
  fontFamily: {
    sans: 'font-sans',
    mono: 'font-mono',
  },
};

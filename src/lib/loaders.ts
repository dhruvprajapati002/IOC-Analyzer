// src/lib/loaders.ts

// Common loading animations (use anywhere)
export const LOADING_STYLES = {
  // Pulsing dots (default)
  dots: 'flex items-center gap-2',
  dot: 'w-2 h-2 bg-gradient-to-r from-[var(--t-primary)] to-[var(--t-accentCyan)] rounded-full animate-bounce',
  
  // Spinning ring
  spinner: 'w-5 h-5 border-2 border-transparent border-t-[var(--t-primary)] rounded-full animate-spin',
  
  // Pulse bar
  pulseBar: 'h-2 bg-gradient-to-r from-[var(--t-surfaceTintDark)] via-[rgba(var(--t-primary-rgb),0.4)] to-[var(--t-surfaceTintDark)] rounded-full animate-pulse',
  
  // Skeleton card
  skeleton: 'bg-gradient-to-r from-[var(--t-surfaceTintDark)] via-[var(--t-surfaceTint)] to-[var(--t-surfaceTintDark)] animate-pulse rounded-xl',
  
  // Text skeleton
  skeletonText: 'bg-gradient-to-r from-[var(--t-surfaceTintDark)] via-[var(--t-surfaceTint)] to-[var(--t-surfaceTintDark)] animate-pulse rounded',
} as const;

// Loading container styles
export const LOADING_CONTAINER = {
  base: 'flex flex-col items-center justify-center p-8 space-y-4 bg-[var(--t-sidebar)] backdrop-blur-sm rounded-2xl border border-[var(--t-border)]',
  spinner: 'w-16 h-16 border-4 border-[var(--t-border)] border-t-[var(--t-primary)] rounded-full animate-spin shadow-lg',
  text: 'text-[var(--t-textMuted)] text-sm font-medium tracking-wide uppercase animate-pulse',
} as const;

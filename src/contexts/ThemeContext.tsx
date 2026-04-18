'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { APP_COLORS } from '@/lib/colors';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark' 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ioc-analyzer-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Update actual theme based on theme setting and system preference
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (actualTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Set CSS custom properties for theme colors
    if (actualTheme === 'dark') {
      root.style.setProperty('--bg-primary', APP_COLORS.background);
      root.style.setProperty('--bg-secondary', APP_COLORS.surface);
      root.style.setProperty('--bg-tertiary', APP_COLORS.surfaceAlt);
      root.style.setProperty('--text-primary', APP_COLORS.textPrimary);
      root.style.setProperty('--text-secondary', APP_COLORS.textLighter);
      root.style.setProperty('--text-muted', APP_COLORS.textMuted);
      root.style.setProperty('--border-color', APP_COLORS.borderStrong);
      root.style.setProperty('--accent-primary', APP_COLORS.accentBlue);
      root.style.setProperty('--accent-secondary', APP_COLORS.accentCyan);
    } else {
      root.style.setProperty('--bg-primary', APP_COLORS.textPrimary);
      root.style.setProperty('--bg-secondary', APP_COLORS.textOffWhite);
      root.style.setProperty('--bg-tertiary', APP_COLORS.textLighter);
      root.style.setProperty('--text-primary', APP_COLORS.background);
      root.style.setProperty('--text-secondary', APP_COLORS.surfaceAlt);
      root.style.setProperty('--text-muted', APP_COLORS.textMuted);
      root.style.setProperty('--border-color', APP_COLORS.textLighter);
      root.style.setProperty('--accent-primary', APP_COLORS.accentBlue);
      root.style.setProperty('--accent-secondary', APP_COLORS.accentCyan);
    }
  }, [actualTheme]);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('ioc-analyzer-theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'dark') {
      updateTheme('light');
    } else if (theme === 'light') {
      updateTheme('system');
    } else {
      updateTheme('dark');
    }
  };

  const value = {
    theme,
    actualTheme,
    setTheme: updateTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
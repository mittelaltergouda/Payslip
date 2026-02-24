'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Theme type: 'light' or 'dark'
 */
type Theme = 'light' | 'dark';

/**
 * Theme Context interface
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * Create the Theme Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider component
 * Manages theme state and persistence with localStorage and system preference detection
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  /**
   * Initialize theme from localStorage or system preference
   */
  useEffect(() => {
    // Get stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme | null;

    if (storedTheme) {
      // Use stored preference
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: Theme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      applyTheme(systemTheme);
    }

    setMounted(true);
  }, []);

  /**
   * Apply theme to DOM
   */
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  /**
   * Toggle theme and persist to localStorage
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Prevent flash of wrong theme on page load
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

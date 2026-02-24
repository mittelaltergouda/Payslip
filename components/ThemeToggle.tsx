'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';

/**
 * Moon icon SVG component
 */
function MoonIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
  );
}

/**
 * Sun icon SVG component
 */
function SunIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.707a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm.707 4.243a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zm1.414 1.414a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.293-1.707a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-2.828-2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-.707-4.243a1 1 0 11 1.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM2.707 9.293a1 1 0 011.414 1.414L3.414 11a1 1 0 11-1.414-1.414l.707-.707zm0-2.828a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414L2 7.414a1 1 0 010-1.414zM10 5a5 5 0 100 10 5 5 0 000-10z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}

/**
 * Theme Toggle Button component
 * Displays moon icon in light mode, sun icon in dark mode
 * Includes smooth transitions and accessibility attributes
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to prevent layout shift
    return (
      <button
        className="w-10 h-10 flex items-center justify-center rounded-lg
                   hover:bg-white/10 transition-colors duration-200"
        disabled
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-lg
                 hover:bg-white/10 transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-offset-2
                 focus:ring-offset-surface-base focus:ring-border-focus"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

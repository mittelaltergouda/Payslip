'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/ThemeContext';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with ThemeToggle
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle').then(mod => ({ default: mod.ThemeToggle })), {
  ssr: false
});

/**
 * Client-side layout wrapper
 * Separates SSR concerns from client-side context providers
 * Provides theme context to the app
 */
export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-40 border-b border-color-border-default bg-color-surface-base/95 backdrop-blur transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-color-text-primary">SC Payslip</h1>
            <ThemeToggle />
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}

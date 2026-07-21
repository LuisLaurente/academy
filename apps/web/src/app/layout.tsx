import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Learning OS',
  description: 'Walking Skeleton de la plataforma de dominio del conocimiento.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['400', '500', '600', '700'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Learning OS',
  description: 'Walking Skeleton de la plataforma de dominio del conocimiento.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${fredoka.variable} ${plusJakartaSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

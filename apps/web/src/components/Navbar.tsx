'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@learning-os/ui/button';
import { Compass, BookOpen, User as UserIcon, Shield, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const role = user?.role || null;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Compass },
    { label: 'Currículo', href: '/curriculum', icon: BookOpen },
    { label: 'Perfil', href: '/profile', icon: UserIcon },
    ...(role === 'admin' ? [{ label: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  return (
    <header className="fixed top-6 right-0 left-0 z-50 px-4">
      <nav className="border-border bg-card shadow-neobrutalism mx-auto flex max-w-6xl items-center justify-between rounded-full border-2 px-4 py-2 transition-colors md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 select-none">
          <div className="bg-primary border-border font-display shadow-neobrutalism-sm flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold text-white transition-all group-hover:-translate-y-[1px] group-hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] dark:group-hover:shadow-[3px_3px_0px_0px_rgba(253,251,247,1)]">
            L
          </div>
          <span className="font-display hidden text-lg font-bold tracking-wide sm:inline-block">
            Learning OS
          </span>
        </Link>

        {/* Menu Items (Authenticated) or Auth Actions (Unauthenticated) */}
        {!isLoading &&
          (isAuthenticated ? (
            <div className="flex items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} className="relative">
                    <div
                      className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all md:text-sm ${
                        isActive
                          ? 'bg-muted text-foreground border-border shadow-neobrutalism-sm font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline-block">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-semibold hover:underline md:text-sm">
                Iniciar Sesión
              </Link>
              <Button
                asChild
                variant="neobrutalism"
                className="h-8 cursor-pointer px-3 text-xs md:h-9 md:px-4"
              >
                <Link href="/register">Empezar Gratis</Link>
              </Button>
            </div>
          ))}

        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="border-border hover:bg-muted/50 shadow-neobrutalism-sm flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 transition-all active:translate-y-[1px]"
            aria-label="Toggle Theme"
          >
            {!mounted ? (
              <span className="block h-4 w-4" />
            ) : theme === 'dark' ? (
              <Sun className="text-primary h-4 w-4" />
            ) : (
              <Moon className="text-foreground h-4 w-4" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

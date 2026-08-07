'use client';

import Link from 'next/link';
import { Button } from '@learning-os/ui/button';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthContext';
import { Flame, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden pt-16">
      <Background />
      <Navbar />

      {/* Hero Section */}
      <main className="z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-center gap-12 px-4 py-12 md:grid-cols-12 md:py-24">
        {/* Left Info Column */}
        <section className="space-y-6 md:col-span-7">
          <div className="border-border bg-sage-pale text-muted-foreground shadow-neobrutalism-sm inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
            <Flame className="text-primary fill-primary h-4 w-4" />
            Nueva forma de aprender
          </div>

          <h1 className="font-display text-foreground text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl">
            Domina cualquier{' '}
            <span className="text-primary decoration-border underline decoration-4">currículo</span>{' '}
            de forma interactiva.
          </h1>

          <p className="text-muted-foreground max-w-xl font-sans text-base leading-relaxed md:text-lg">
            Learning OS es una plataforma diseñada para guiarte en el dominio del conocimiento a
            través de rutas dinámicas sembradas con IA, bloques educativos minimalistas y práctica
            activa adaptativa.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isAuthenticated ? (
              <Button asChild variant="neobrutalism" className="h-12 cursor-pointer px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Ir a mi Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="neobrutalism" className="h-12 cursor-pointer px-6">
                  <Link href="/register" className="flex items-center gap-2">
                    Crear mi Ruta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="neobrutalismOutline" className="h-12 cursor-pointer px-6">
                  <Link href="/login">Acceder a mi Cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Right Preview Card Column */}
        <div className="flex justify-center md:col-span-5">
          <Card className="bg-card shadow-neobrutalism-lg border-border w-full max-w-sm border-2">
            <div className="border-border mb-6 flex items-center justify-between border-b-2 pb-4">
              <span className="font-display text-md font-bold">DDD Core Concepts</span>
              <span className="bg-sage-pale border-border rounded-full border px-2.5 py-0.5 text-xs font-bold">
                Intermedio
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary/10 border-border text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">Entidades vs Value Objects</h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Aprende la diferencia fundamental en modelado de dominio.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 opacity-60">
                <div className="bg-muted border-border text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">Agregados y Raíces</h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Establece límites de consistencia transaccional firmes.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-border mt-6 flex items-center justify-between border-t-2 pt-4">
              <span className="text-muted-foreground text-xs font-semibold">Progreso sugerido</span>
              <span className="text-primary flex items-center gap-1 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" /> Recomendado por IA
              </span>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border/20 z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 border-t-2 px-4 py-6 text-center sm:flex-row">
        <span className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Learning OS. Diseñado con Soft Neobrutalism.
        </span>
        <div className="flex gap-4">
          <Link href="/health" className="text-muted-foreground text-xs hover:underline">
            Estado del Sistema
          </Link>
        </div>
      </footer>
    </div>
  );
}

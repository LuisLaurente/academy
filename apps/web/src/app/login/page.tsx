'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/config/auth-service';
import { Background } from '@/components/Background';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { KeyRound, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'learning_os_user',
          JSON.stringify({ email: res.email, userId: res.userId }),
        );
      }
      router.push('/dashboard');
    } catch (err) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Background />

      <Card className="shadow-neobrutalism-lg border-border bg-card w-full max-w-md border-2 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-sage-pale border-border shadow-neobrutalism-sm mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border-2">
            <Sparkles className="text-primary h-6 w-6" />
          </div>
          <h1 className="font-display mb-2 text-3xl font-bold tracking-wide">Iniciar Sesión</h1>
          <p className="text-muted-foreground font-sans text-sm">
            ¡Hola! Regresa a tu viaje de dominio de conocimientos.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-primary/10 border-primary text-primary-foreground bg-coral-red/10 text-coral-red mb-6 flex items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-display mb-2 block text-xs font-bold tracking-wider uppercase">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-3.5 left-3 h-4 w-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@academy.edu"
                className="bg-background border-border focus:ring-primary focus:border-border w-full rounded-xl border-2 py-3 pr-4 pl-10 font-sans text-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-display mb-2 block text-xs font-bold tracking-wider uppercase">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-3.5 left-3 h-4 w-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border focus:ring-primary focus:border-border w-full rounded-xl border-2 py-3 pr-4 pl-10 font-sans text-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="neobrutalism"
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 py-6"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar a la Plataforma'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        {/* Switch Link */}
        <p className="text-muted-foreground mt-6 text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}

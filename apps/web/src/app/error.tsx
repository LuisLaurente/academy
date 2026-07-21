'use client';

import { Button } from '@learning-os/ui/button';

export default function ErrorPage({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">No pudimos cargar esta página</h1>
        <p className="text-muted-foreground">Puedes intentar nuevamente de forma segura.</p>
        <Button onClick={reset}>Reintentar</Button>
      </section>
    </main>
  );
}

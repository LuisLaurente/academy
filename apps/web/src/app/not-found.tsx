import { Button } from '@learning-os/ui/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <section className="space-y-4">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="text-3xl font-semibold">Página no encontrada</h1>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </section>
    </main>
  );
}

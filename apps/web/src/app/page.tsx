import { Button } from '@learning-os/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="space-y-6">
        <p className="text-muted-foreground text-sm font-medium">Walking Skeleton</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Learning OS</h1>
        <p className="text-muted-foreground max-w-2xl text-lg leading-8">
          La infraestructura base está preparada. Las capacidades de aprendizaje se implementarán en
          fases posteriores.
        </p>
        <Button asChild variant="outline">
          <Link href="/health">Ver estado de Web</Link>
        </Button>
      </section>
    </main>
  );
}

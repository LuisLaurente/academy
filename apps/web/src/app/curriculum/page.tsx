'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurriculumItems, type CurriculumItem } from '@/config/curriculum-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { BookOpen, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default function CurriculumPage() {
  const [items, setItems] = useState<readonly CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const data = await getCurriculumItems();
        setItems(data);
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'No se pudieron cargar los temas del currículo.');
      } finally {
        setLoading(false);
      }
    }
    void loadCurriculum();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-4xl flex-1 space-y-8 px-6">
        {/* Header */}
        <section className="space-y-3">
          <div className="border-border bg-sage-pale text-muted-foreground shadow-neobrutalism-sm inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-bold tracking-wider uppercase">
            <CompassIcon className="text-primary h-4 w-4" />
            Explorador de Conocimientos
          </div>
          <h1 className="font-display text-4xl leading-none font-bold tracking-tight">
            Rutas de Aprendizaje
          </h1>
          <p className="text-muted-foreground max-w-xl font-sans text-sm">
            Explora el mapa curricular dinámico, lee conceptos clave y practica para dominar los
            temas recomendados por nuestro sistema.
          </p>
        </section>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground font-display text-sm font-bold">
              Cargando mapa curricular...
            </p>
          </div>
        ) : error ? (
          <Card className="border-primary bg-coral-red/5 mx-auto flex max-w-md flex-col items-center space-y-4 border-2 p-8 text-center">
            <AlertCircle className="text-primary h-12 w-12" />
            <h3 className="font-display text-lg font-bold">Error de conexión</h3>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="neobrutalism"
              className="px-4 py-2 text-xs"
            >
              Reintentar Conexión
            </Button>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-border bg-card border-2 border-dashed p-12 text-center">
            <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="font-display text-lg font-bold">No hay temas disponibles</h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              No encontramos temas curriculares registrados en el sistema. Asegúrate de ejecutar el
              sembrado de base de datos.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {items.map((item) => {
              const difficultyColors =
                item.difficulty === 'beginner'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : item.difficulty === 'intermediate'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

              return (
                <Card
                  key={item.id}
                  hoverable
                  className="bg-card flex h-full flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="border-border/10 flex items-start justify-between gap-4 border-b-2 pb-3">
                      <h2 className="font-display hover:text-primary text-lg font-bold tracking-wide transition-colors">
                        {item.title}
                      </h2>
                      <span
                        className={`border-border shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${difficultyColors}`}
                      >
                        {item.difficulty}
                      </span>
                    </div>

                    <p className="text-muted-foreground line-clamp-3 font-sans text-sm">
                      {item.description}
                    </p>
                  </div>

                  <div className="border-border/10 mt-6 flex items-center justify-between border-t-2 pt-4">
                    <div className="text-muted-foreground flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="text-primary h-3.5 w-3.5" />
                        {item.estimatedMins} min
                      </span>
                    </div>

                    <Button
                      asChild
                      variant="neobrutalism"
                      size="sm"
                      className="h-8 cursor-pointer text-xs"
                    >
                      <Link href={`/curriculum/${item.id}`} className="flex items-center gap-1">
                        Estudiar
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

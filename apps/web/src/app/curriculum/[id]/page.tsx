'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCurriculumItemById, type CurriculumItem } from '@/config/curriculum-service';
import { getContentBlockById, type ContentBlock } from '@/config/content-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { BookOpen, Clock, ArrowLeft, ArrowRight, Play } from 'lucide-react';

export default function CurriculumItemDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<CurriculumItem | null>(null);
  const [content, setContent] = useState<ContentBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple static mapping from curriculum item ID to seeded content block and exercise
  const getMappings = (currId: string) => {
    switch (currId) {
      case 'curr-ddd-core':
        return { contentId: 'cont-ddd-intro', exerciseId: 'ex-ddd-quiz-1' };
      case 'curr-clean-arch':
        return { contentId: 'cont-clean-layers', exerciseId: 'ex-clean-arch-code-1' };
      default:
        return { contentId: 'cont-ddd-intro', exerciseId: 'ex-ddd-quiz-1' };
    }
  };

  useEffect(() => {
    async function loadDetails() {
      if (!id) return;
      try {
        const itemData = await getCurriculumItemById(id);
        setItem(itemData);

        const { contentId } = getMappings(id);
        const contentData = await getContentBlockById(contentId);
        setContent(contentData);
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'Error al cargar el bloque de contenido.');
      } finally {
        setLoading(false);
      }
    }
    void loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground font-display text-sm font-bold">
          Cargando material de estudio...
        </p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 pt-24">
        <Background />
        <Navbar />
        <Card className="border-primary bg-coral-red/5 w-full max-w-md space-y-4 border-2 p-8 text-center">
          <h3 className="font-display text-lg font-bold">No pudimos encontrar este tema</h3>
          <p className="text-muted-foreground text-sm">
            {error || 'El ID del currículo no es válido o no está registrado.'}
          </p>
          <Button asChild variant="neobrutalism" className="px-6">
            <Link href="/curriculum">Volver al mapa curricular</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { exerciseId } = getMappings(item.id);

  // Very simple custom markdown parser helper since we don't have react-markdown installed.
  // It translates basic headers and lists into JSX for visual clean-ness!
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1
            key={idx}
            className="font-display text-foreground border-border/10 mt-6 mb-4 border-b-2 pb-2 text-2xl font-bold md:text-3xl"
          >
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-display text-foreground mt-6 mb-3 text-xl font-bold">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li
            key={idx}
            className="text-muted-foreground mb-2 ml-4 list-disc pl-2 font-sans text-sm leading-relaxed md:text-base"
          >
            <strong>{line.split('**')[1] ? line.split('**')[1] + ':' : ''}</strong>
            {line.split('**')[2] ? line.split('**')[2] : line.replace('- ', '')}
          </li>
        );
      }
      if (line.startsWith('1. ')) {
        return (
          <li
            key={idx}
            className="text-muted-foreground mb-2 ml-4 list-decimal pl-2 font-sans text-sm leading-relaxed md:text-base"
          >
            <strong>{line.split('**')[1] ? line.split('**')[1] + ':' : ''}</strong>
            {line.split('**')[2] ? line.split('**')[2] : line.replace(/^\d+\.\s+/, '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      return (
        <p
          key={idx}
          className="text-muted-foreground mb-4 font-sans text-sm leading-relaxed md:text-base"
        >
          {line}
        </p>
      );
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-3xl flex-1 space-y-6 px-6">
        {/* Navigation */}
        <Link
          href="/curriculum"
          className="text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al mapa
        </Link>

        {/* Curriculum Card header */}
        <Card className="bg-muted/30 border-border shadow-neobrutalism-sm flex flex-col justify-between gap-4 border-2 p-6 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <span className="border-border bg-sage-pale text-foreground rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
              {item.difficulty}
            </span>
            <h1 className="font-display text-2xl font-bold tracking-wide">{item.title}</h1>
            <p className="text-muted-foreground font-sans text-xs">{item.description}</p>
          </div>
          <div className="text-muted-foreground bg-card border-border shadow-neobrutalism-sm flex shrink-0 items-center gap-1 rounded-full border-2 px-3 py-1.5 text-xs font-bold">
            <Clock className="text-primary h-3.5 w-3.5" />
            {item.estimatedMins} min de estudio
          </div>
        </Card>

        {/* Content Block Reader */}
        <Card className="bg-card border-border shadow-neobrutalism min-h-[300px] border-2 p-8">
          {content ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {renderMarkdown(content.body)}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center space-y-3">
              <BookOpen className="text-muted-foreground/40 h-10 w-10" />
              <p className="text-muted-foreground font-sans text-sm font-medium">
                No hay bloque de contenido disponible para este tema.
              </p>
            </div>
          )}
        </Card>

        {/* Practice Call to Action */}
        <Card className="border-border bg-primary/5 dark:bg-primary/10 shadow-neobrutalism-sm flex flex-col items-center justify-between gap-4 border-2 p-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="bg-primary border-border shadow-neobrutalism-sm flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full border-2 font-bold text-white">
              <Play className="h-4 w-4 fill-white" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-display text-sm font-bold">¿Listo para probar tu comprensión?</h3>
              <p className="text-muted-foreground mt-0.5 font-sans text-xs">
                Realiza la práctica recomendada por la IA para este bloque.
              </p>
            </div>
          </div>
          <Button asChild variant="neobrutalism" className="h-10 w-full cursor-pointer sm:w-auto">
            <Link
              href={`/practice?exerciseId=${exerciseId}&curriculumId=${item.id}`}
              className="flex items-center justify-center gap-1.5 font-bold"
            >
              Iniciar Práctica
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </main>
    </div>
  );
}

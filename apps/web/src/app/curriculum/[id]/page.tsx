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

interface Sublevel {
  title: string;
  description: string;
  exerciseIds?: string[];
}

interface Level {
  level: string;
  sublevels: Sublevel[];
}

// Fallback roadmaps for seeded courses
const SEEDED_ROADMAPS: Record<string, Level[]> = {
  'curr-ddd-core': [
    {
      level: 'Básico',
      sublevels: [
        { title: 'Introducción a DDD', description: 'Conceptos fundamentales y lenguaje ubicuo.' },
        { title: 'Bounded Contexts', description: 'Límites explícitos y mapas de contexto.' }
      ]
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Entidades vs Value Objects', description: 'Diferencias clave y ciclos de vida.' },
        { title: 'Diseño de Aggregates', description: 'Reglas de consistencia y raíces de agregado.' }
      ]
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Domain Events', description: 'Modelado de eventos y efectos colaterales.' },
        { title: 'Repositories', description: 'Abstracción de la persistencia de datos.' }
      ]
    },
    {
      level: 'Profesional',
      sublevels: [
        { title: 'Mapeo ORM y Persistencia Limpia', description: 'Separación de infraestructura y dominio.' },
        { title: 'Estrategias de Integración y CQRS', description: 'Arquitecturas avanzadas para producción.' }
      ]
    }
  ],
  'curr-clean-arch': [
    {
      level: 'Básico',
      sublevels: [
        { title: 'Introducción a Arquitectura Limpia', description: 'Principios SOLID y desacoplamiento.' },
        { title: 'La Regla de Dependencia', description: 'Dirección de dependencias y flujo de control.' }
      ]
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Modelado del Dominio', description: 'Entidades puras del negocio.' },
        { title: 'Casos de Uso', description: 'Lógica de aplicación e inversión de dependencias.' }
      ]
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Implementación de Adaptadores', description: 'Controladores HTTP y Presenters.' },
        { title: 'Inyección de Dependencias', description: 'Configuración en NestJS y monorepos.' }
      ]
    },
    {
      level: 'Profesional',
      sublevels: [
        { title: 'Manejo de Transacciones y DB', description: 'Persistencia con Prisma o SQL nativo.' },
        { title: 'Pruebas de Extremo a Extremo', description: 'Asegurando la integridad en todas las capas.' }
      ]
    }
  ]
};

const getFallbackRoadmap = (title: string): Level[] => {
  return [
    {
      level: 'Básico',
      sublevels: [
        { title: `Fundamentos de ${title}`, description: 'Conceptos iniciales y bases teóricas.' },
        { title: 'Sintaxis y Estructuras básicas', description: 'Primeros pasos y ejemplos prácticos.' }
      ]
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Aplicación Práctica', description: 'Uso de conceptos en situaciones reales.' },
        { title: 'Resolución de problemas', description: 'Errores comunes y optimización.' }
      ]
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Patrones Avanzados', description: 'Diseño estructural y mejores prácticas.' }
      ]
    },
    {
      level: 'Profesional',
      sublevels: [
        { title: 'Despliegue y Arquitectura', description: 'Implementación a gran escala y seguridad.' }
      ]
    }
  ];
};

export default function CurriculumItemDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<CurriculumItem | null>(null);
  const [content, setContent] = useState<ContentBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSublevels, setCompletedSublevels] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<Level[]>([]);
  const [activeSublevel, setActiveSublevel] = useState<any>(null);
  const [activeLevelName, setActiveLevelName] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<{
    status: string;
    completed: number;
    total: number;
    percent: number;
    sublevels?: Record<string, string>;
  } | null>(null);
  const [resuming, setResuming] = useState(false);

  const handleResume = async () => {
    setResuming(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1'}/curriculum/items/${id}/resume`, {
        method: 'POST',
      });
      if (res.ok) {
        // Trigger check status immediately
        const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1'}/curriculum/items/${id}/generation-status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setGenerationProgress(statusData);
        }
      }
    } catch (e) {
      console.error('Failed to resume generation:', e);
    } finally {
      setResuming(false);
    }
  };

  // Simple static mapping from curriculum item ID to seeded content block and exercise
  const getMappings = (currId: string) => {
    switch (currId) {
      case 'curr-ddd-core':
        return { contentId: 'cont-ddd-intro', exerciseId: 'ex-ddd-quiz-1' };
      case 'curr-clean-arch':
        return { contentId: 'cont-clean-layers', exerciseId: 'ex-clean-arch-code-1' };
      default: {
        // Dynamic mapping for AI generated courses
        const baseId = currId.replace(/^curr-/, '');
        return { contentId: `cont-${baseId}`, exerciseId: `ex-${baseId}` };
      }
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

  // Poll for background generation status if not completed
  useEffect(() => {
    if (!id || loading) return;

    let intervalId: any;

    async function checkStatus() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1'}/curriculum/items/${id}/generation-status`);
        if (!res.ok) return;
        const statusData = await res.json();
        setGenerationProgress(statusData);

        // Always reload content block to fetch newly completed sublevels in real-time
        const { contentId } = getMappings(id);
        const contentData = await getContentBlockById(contentId);
        setContent(contentData);

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to poll generation status:', err);
      }
    }

    void checkStatus();

    intervalId = setInterval(() => {
      void checkStatus();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [id, loading]);

  // Load completed sublevels from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const storedUser = localStorage.getItem('learning_os_user');
      const userId = storedUser ? JSON.parse(storedUser).userId : 'guest';
      const stored = localStorage.getItem(`roadmap_progress_${userId}_${id}`);
      if (stored) {
        setCompletedSublevels(JSON.parse(stored));
      }
    }
  }, [id]);

  // Populate roadmap once item and content are loaded
  useEffect(() => {
    if (!content || !item) return;

    let parsedRoadmap: Level[] = [];

    // 1. Try parsing from content body
    const match = content.body.match(/<!-- ROADMAP_START -->([\s\S]*?)<!-- ROADMAP_END -->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          parsedRoadmap = parsed;
        }
      } catch (e) {
        console.error('Failed to parse embedded roadmap JSON:', e);
      }
    }

    if (parsedRoadmap.length === 0) {
      // 2. Fall back to seeded roadmap
      if (SEEDED_ROADMAPS[id]) {
        parsedRoadmap = SEEDED_ROADMAPS[id];
      } else {
        // 3. Dynamic fallback
        parsedRoadmap = getFallbackRoadmap(item.title);
      }
    }

    setRoadmap(parsedRoadmap);

    // Keep active sublevel synced with fresh content metadata
    if (activeSublevel) {
      for (const lvl of parsedRoadmap) {
        const found = lvl.sublevels.find((s) => s.title === activeSublevel.title);
        if (found) {
          setActiveSublevel(found);
          setActiveLevelName(lvl.level);
          return;
        }
      }
    }

    // Otherwise set initial active sublevel
    const firstLevel = parsedRoadmap[0];
    if (firstLevel && firstLevel.sublevels && firstLevel.sublevels.length > 0) {
      setActiveSublevel(firstLevel.sublevels[0]);
      setActiveLevelName(firstLevel.level);
    }
  }, [content, item, id]);

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

  // Custom markdown renderer helper
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Clean leading duplicated header if it matches sublevel title
    let cleanText = text.trim();
    if (activeSublevel?.title) {
      const escapedTitle = activeSublevel.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const leadingHeaderRegex = new RegExp(`^#+\\s*${escapedTitle}\\s*\\n*`, 'i');
      cleanText = cleanText.replace(leadingHeaderRegex, '').trim();
    }

    const lines = cleanText.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    // Helper to format inline code & bold text
    const formatInline = (str: string) => {
      const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="bg-muted text-primary px-1.5 py-0.5 rounded text-xs font-mono border border-border">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="bg-muted border-border border-2 rounded-xl p-4 my-4 font-mono text-xs overflow-x-auto text-foreground">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="font-display text-foreground border-border/10 mt-6 mb-4 border-b-2 pb-2 text-2xl font-bold md:text-3xl">
            {formatInline(trimmed.replace('# ', ''))}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="font-display text-primary mt-6 mb-3 text-xl font-bold border-b border-border/20 pb-1">
            {formatInline(trimmed.replace('## ', ''))}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="font-display text-foreground mt-4 mb-2 text-lg font-bold">
            {formatInline(trimmed.replace('### ', ''))}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="text-muted-foreground mb-1.5 ml-4 list-disc pl-1 font-sans text-sm leading-relaxed md:text-base">
            {formatInline(trimmed.replace(/^[-*]\s+/, ''))}
          </li>
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        elements.push(
          <li key={idx} className="text-muted-foreground mb-1.5 ml-4 list-decimal pl-1 font-sans text-sm leading-relaxed md:text-base">
            {formatInline(trimmed.replace(/^\d+\.\s+/, ''))}
          </li>
        );
      } else if (trimmed === '') {
        // Skip consecutive blank lines to avoid layout gaps
        return;
      } else {
        elements.push(
          <p key={idx} className="text-muted-foreground mb-3 font-sans text-sm leading-relaxed md:text-base">
            {formatInline(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const getSublevelTheory = (bodyText: string, sublevel?: Sublevel) => {
    if (!sublevel || !bodyText) return bodyText;
    
    // Extract the markdown part after removing the roadmap comment
    const cleanMarkdown = bodyText.replace(/<!-- ROADMAP_START -->[\s\S]*?<!-- ROADMAP_END -->/, '').trim();
    if (!cleanMarkdown) return '';

    const title = sublevel.title || '';
    const subtopicId = (sublevel as any).subtopicId;

    // 1. Try matching explicit comment anchor if subtopicId exists
    if (subtopicId) {
      const anchorRegex = new RegExp(`<!-- LESSON_START: ${subtopicId} -->([\\s\\S]*?)(?:<!-- LESSON_END: ${subtopicId} -->|<!-- LESSON_START:|$)`, 'i');
      const anchorMatch = cleanMarkdown.match(anchorRegex);
      if (anchorMatch && anchorMatch[1]?.trim()) {
        const text = anchorMatch[1].trim();
        return text.replace(/<!--[\s\S]*?-->/g, '').trim();
      }
    }

    // 2. Clean title and attempt header matching
    const cleanTitle = title.replace(/^\d+\.\s*/, '').toLowerCase().trim();
    const words = cleanTitle.split(' ').filter(w => w.length > 3);
    
    const lines = cleanMarkdown.split('\n');
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (line && (line.startsWith('## ') || line.startsWith('### ') || line.startsWith('# '))) {
        const lineLower = line.toLowerCase();
        if (lineLower.includes(cleanTitle) || (words.length > 0 && words.some(w => lineLower.includes(w)))) {
          startIdx = i;
          break;
        }
      }
    }
    
    if (startIdx === -1) {
      return cleanMarkdown.replace(/<!--[\s\S]*?-->/g, '').trim();
    }
    
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (line && (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### '))) {
        endIdx = i;
        break;
      }
    }
    
    const slice = endIdx !== -1 ? lines.slice(startIdx, endIdx) : lines.slice(startIdx);
    const result = slice.join('\n').trim();

    // If slice produced meaningful theory text, return it, otherwise fallback to full markdown
    const finalResult = result.length > 30 ? result : cleanMarkdown;
    return finalResult.replace(/<!--[\s\S]*?-->/g, '').trim();
  };

  const cleanBody = content && activeSublevel
    ? getSublevelTheory(content.body, activeSublevel)
    : (content ? content.body.replace(/<!-- ROADMAP_START -->[\s\S]*?<!-- ROADMAP_END -->/, '').trim() : '');

  const activeSublevelKey = activeSublevel && activeLevelName ? `${activeLevelName}_${activeSublevel.title}` : '';
  const sublevelStatus = generationProgress?.sublevels?.[activeSublevelKey];

  const hasTheoryContent = Boolean(cleanBody && cleanBody.length > 50);

  const isSublevelReady = activeSublevel
    ? (hasTheoryContent || !generationProgress || sublevelStatus === 'completed' || (Array.isArray(activeSublevel.exerciseIds) && activeSublevel.exerciseIds.length > 0))
    : true;

  const totalSublevels = roadmap.reduce((acc, lvl) => acc + (lvl.sublevels?.length || 0), 0);
  const completedCount = roadmap.reduce((acc, lvl) => {
    return (
      acc +
      (lvl.sublevels || []).filter((sub) =>
        completedSublevels.includes(`${id}_${lvl.level}_${sub.title}`),
      ).length
    );
  }, 0);
  const progressPercent =
    totalSublevels > 0 ? Math.round((completedCount / totalSublevels) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-6xl flex-1 space-y-6 px-6">
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

        {/* Generation Progress Alert Banner */}
        {generationProgress && (generationProgress.status !== 'completed' || generationProgress.completed < generationProgress.total) && (
          <Card className="border-border bg-yellow-500/10 shadow-neobrutalism-sm border-2 p-6 space-y-3 dark:bg-yellow-500/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {(generationProgress.status === 'failed' || (generationProgress.status === 'completed' && generationProgress.completed < generationProgress.total)) ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </>
                  )}
                </span>
                <h3 className="font-display text-sm font-bold text-yellow-800 dark:text-yellow-200">
                  {generationProgress.status === 'failed' || (generationProgress.status === 'completed' && generationProgress.completed < generationProgress.total)
                    ? 'La generación se detuvo debido a un error o límite de cuota.'
                    : generationProgress.status === 'waiting_quota'
                      ? 'Excedido límite de peticiones de Gemini. Esperando 60s para reanudar...'
                      : 'La IA está redactando lecciones y prácticas en segundo plano...'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-yellow-800 dark:text-yellow-200">
                  {generationProgress.completed} de {generationProgress.total} subtemas listos ({generationProgress.percent}%)
                </span>
                {(generationProgress.status === 'failed' || 
                  generationProgress.status === 'generating_sublevels' || 
                  generationProgress.status === 'waiting_quota' ||
                  (generationProgress.status === 'completed' && generationProgress.completed < generationProgress.total)) && (
                  <Button
                    onClick={handleResume}
                    disabled={resuming}
                    variant="neobrutalism"
                    className="h-8 py-0 px-3 text-[10px] bg-yellow-500 text-black hover:bg-yellow-600 cursor-pointer shadow-neobrutalism-xs border border-black font-bold"
                  >
                    {resuming ? 'Reanudando...' : 'Reintentar/Continuar'}
                  </Button>
                )}
              </div>
            </div>
            <div className="border-border/20 bg-muted h-3.5 w-full overflow-hidden rounded-full border">
              <div
                className="bg-yellow-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${generationProgress.percent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Puedes empezar a leer los subtemas completados (marcados sin indicador de carga) y realizar sus prácticas de inmediato. La teoría restante se actualizará en tiempo real.
            </p>
          </Card>
        )}

        {/* Two column layout: Left for Roadmap, Right for Theory content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Column 1: Roadmap Checklist */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-card border-border shadow-neobrutalism border-2 p-6">
              <div className="mb-4 space-y-2">
                <h2 className="font-display text-lg font-bold tracking-wide">Progreso de la Ruta</h2>
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>{progressPercent}% completado</span>
                  <span>
                    {completedCount} de {totalSublevels}
                  </span>
                </div>
                <div className="border-border/20 bg-muted h-2.5 w-full overflow-hidden rounded-full border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="border-border/10 border-t pt-4 space-y-6">
                {roadmap.map((lvl) => (
                  <div key={lvl.level} className="space-y-3">
                    <h3 className="font-display text-primary text-sm font-bold tracking-wider uppercase">
                      {lvl.level}
                    </h3>
                    <div className="border-primary/20 ml-1 ml-2 space-y-2.5 border-l-2 pl-1.5 pl-3">
                      {lvl.sublevels.map((sub) => {
                        const sublevelKey = `${id}_${lvl.level}_${sub.title}`;
                        const isCompleted = completedSublevels.includes(sublevelKey);
                        const isActive = activeSublevel?.title === sub.title && activeLevelName === lvl.level;

                        const isLegacy = !sub.exerciseIds && !generationProgress;
                        const isSublevelReady = isLegacy || (Array.isArray(sub.exerciseIds) && sub.exerciseIds.length > 0);

                        return (
                          <div
                            key={sub.title}
                            onClick={() => {
                              if (!isSublevelReady) return;
                              setActiveSublevel(sub);
                              setActiveLevelName(lvl.level);
                            }}
                            className={`group flex select-none items-start gap-3 rounded-lg border p-2.5 transition-all ${
                              !isSublevelReady
                                ? 'opacity-40 cursor-not-allowed border-transparent bg-muted/20'
                                : isActive
                                  ? 'bg-muted border-primary shadow-neobrutalism-sm translate-x-[-1px] translate-y-[-1px] cursor-pointer'
                                  : isCompleted
                                    ? 'bg-green-500/5 border-green-500/20 dark:bg-green-500/10 border-transparent cursor-pointer'
                                    : 'border-transparent hover:border-border/20 hover:bg-muted/40 cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              readOnly
                              disabled={!isSublevelReady}
                              className="border-border text-primary focus:ring-ring mt-1 h-4 w-4 shrink-0 rounded border-2 transition-colors focus:ring-2"
                            />
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4
                                  className={`text-xs font-bold transition-all ${isCompleted ? 'text-green-600 opacity-70 line-through dark:text-green-400' : 'text-foreground'}`}
                                >
                                  {sub.title}
                                </h4>
                                {!isSublevelReady && (
                                  <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground animate-pulse">
                                    redactando...
                                  </span>
                                )}
                              </div>
                              <p
                                  className={`text-muted-foreground text-[10px] leading-snug ${isCompleted ? 'opacity-50' : ''}`}
                              >
                                {sub.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Column 2: Material de Estudio & Practice Action */}
          <div className="md:col-span-2 space-y-6">
            {/* Content Block Reader */}
            <Card className="bg-card border-border shadow-neobrutalism min-h-[300px] border-2 p-8">
              {!isSublevelReady ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              ) : content ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {renderMarkdown(cleanBody)}
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
            <Card className="border-border bg-primary/5 shadow-neobrutalism-sm flex flex-col items-center justify-between gap-4 border-2 p-6 sm:flex-row dark:bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="bg-primary border-border shadow-neobrutalism-sm flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full border-2 font-bold text-white">
                  <Play className="h-4 w-4 fill-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-display text-sm font-bold">
                    ¿Listo para probar {activeSublevel ? `"${activeSublevel.title}"` : 'tu comprensión'}?
                  </h3>
                  <p className="text-muted-foreground mt-0.5 font-sans text-xs">
                    Realiza la secuencia de práctica recomendada para este subtema.
                  </p>
                </div>
              </div>
              <Button asChild={isSublevelReady} disabled={!isSublevelReady} variant="neobrutalism" className="h-10 w-full cursor-pointer sm:w-auto">
                {isSublevelReady ? (
                  <Link
                    href={
                      activeSublevel && Array.isArray(activeSublevel.exerciseIds)
                        ? `/practice?exerciseIds=${activeSublevel.exerciseIds.join(',')}&curriculumId=${item.id}&sublevelKey=${encodeURIComponent(`${id}_${activeLevelName}_${activeSublevel.title}`)}`
                        : `/practice?exerciseId=${exerciseId}&curriculumId=${item.id}&sublevelKey=${encodeURIComponent(`${id}_${activeLevelName}_${activeSublevel ? activeSublevel.title : ''}`)}`
                    }
                    className="flex items-center justify-center gap-1.5 font-bold"
                  >
                    Iniciar Práctica
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 font-bold opacity-50">
                    Redactando...
                  </span>
                )}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

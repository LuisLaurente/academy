'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCurriculumItemById } from '@/config/curriculum-service';
import { getContentBlockById, type ContentBlock } from '@/config/content-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Mermaid } from '@/components/Mermaid';
import { Button } from '@learning-os/ui/button';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  ArrowRight,
  Play,
  Loader,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '@/config/api-client';

interface Sublevel {
  id?: string;
  title: string;
  description: string;
  exerciseIds?: string[];
  contentBlockId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentBlock?: any;
}

interface Level {
  id?: string;
  level: string;
  status?: string;
  sublevels: Sublevel[];
}

// Fallback roadmaps for seeded courses
const SEEDED_ROADMAPS: Record<string, Level[]> = {
  'curr-ddd-core': [
    {
      level: 'Básico',
      sublevels: [
        { title: 'Introducción a DDD', description: 'Conceptos fundamentales y lenguaje ubicuo.' },
        { title: 'Bounded Contexts', description: 'Límites explícitos y mapas de contexto.' },
      ],
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Entidades vs Value Objects', description: 'Diferencias clave y ciclos de vida.' },
        {
          title: 'Diseño de Aggregates',
          description: 'Reglas de consistencia y raíces de agregado.',
        },
      ],
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Domain Events', description: 'Modelado de eventos y efectos colaterales.' },
        { title: 'Repositories', description: 'Abstracción de la persistencia de datos.' },
      ],
    },
    {
      level: 'Profesional',
      sublevels: [
        {
          title: 'Mapeo ORM y Persistencia Limpia',
          description: 'Separación de infraestructura y dominio.',
        },
        {
          title: 'Estrategias de Integración y CQRS',
          description: 'Arquitecturas avanzadas para producción.',
        },
      ],
    },
  ],
  'curr-clean-arch': [
    {
      level: 'Básico',
      sublevels: [
        {
          title: 'Introducción a Arquitectura Limpia',
          description: 'Principios SOLID y desacoplamiento.',
        },
        {
          title: 'La Regla de Dependencia',
          description: 'Dirección de dependencias y flujo de control.',
        },
      ],
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Modelado del Dominio', description: 'Entidades puras del negocio.' },
        { title: 'Casos de Uso', description: 'Lógica de aplicación e inversión de dependencias.' },
      ],
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Implementación de Adaptadores', description: 'Controladores HTTP y Presenters.' },
        { title: 'Inyección de Dependencias', description: 'Configuración en NestJS y monorepos.' },
      ],
    },
    {
      level: 'Profesional',
      sublevels: [
        {
          title: 'Manejo de Transacciones y DB',
          description: 'Persistencia con Prisma o SQL nativo.',
        },
        {
          title: 'Pruebas de Extremo a Extremo',
          description: 'Asegurando la integridad en todas las capas.',
        },
      ],
    },
  ],
};

const getFallbackRoadmap = (title: string): Level[] => {
  return [
    {
      level: 'Básico',
      sublevels: [
        { title: `Fundamentos de ${title}`, description: 'Conceptos iniciales y bases teóricas.' },
        {
          title: 'Sintaxis y Estructuras básicas',
          description: 'Primeros pasos y ejemplos prácticos.',
        },
      ],
    },
    {
      level: 'Intermedio',
      sublevels: [
        { title: 'Aplicación Práctica', description: 'Uso de conceptos en situaciones reales.' },
        { title: 'Resolución de problemas', description: 'Errores comunes y optimización.' },
      ],
    },
    {
      level: 'Avanzado',
      sublevels: [
        { title: 'Patrones Avanzados', description: 'Diseño estructural y mejores prácticas.' },
      ],
    },
    {
      level: 'Profesional',
      sublevels: [
        {
          title: 'Despliegue y Arquitectura',
          description: 'Implementación a gran escala y seguridad.',
        },
      ],
    },
  ];
};

export default function CurriculumItemDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [item, setItem] = useState<any | null>(null);
  const [content, setContent] = useState<ContentBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSublevels, setCompletedSublevels] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<Level[]>([]);
  const [activeSublevel, setActiveSublevel] = useState<Sublevel | null>(null);
  const [activeLevelName, setActiveLevelName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

  const loadDetails = async () => {
    if (!id) return;
    try {
      const itemData = await getCurriculumItemById(id);
      setItem(itemData);

      // Seeded courses do not use relational subthemes
      const isSeeded = id === 'curr-ddd-core' || id === 'curr-clean-arch';
      if (isSeeded) {
        const baseId = id.replace(/^curr-/, '');
        const contentId = `cont-${baseId}`;
        const contentData = await getContentBlockById(contentId);
        setContent(contentData);
      }
    } catch (err) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Error al cargar el bloque de contenido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll details in background if any level is generating
  useEffect(() => {
    const anyGenerating = roadmap.some((lvl) => lvl.status === 'generating');
    if (!anyGenerating) return;

    const intervalId = setInterval(() => {
      void loadDetails();
    }, 4000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap]);

  // Load completed sublevels from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const storedUser = localStorage.getItem('learning_os_user');
      const userId = storedUser ? JSON.parse(storedUser).userId : 'guest';
      const stored = localStorage.getItem(`roadmap_progress_${userId}_${id}`);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompletedSublevels(JSON.parse(stored));
      }
    }
  }, [id]);

  // Populate roadmap once item and content/relational levels are loaded
  useEffect(() => {
    if (!item) return;

    let parsedRoadmap: Level[] = [];

    // 1. Relational levels from new flow
    if (Array.isArray(item.levels) && item.levels.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsedRoadmap = item.levels.map((lvl: any) => ({
        id: lvl.id,
        level: lvl.title,
        status: lvl.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sublevels: lvl.sublevels.map((sub: any) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          contentBlockId: sub.contentBlockId,
          contentBlock: sub.contentBlock,
        })),
      }));
    } else {
      // 2. Fall back to old content parsing / Seeded roadmaps
      if (content) {
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
      }

      if (parsedRoadmap.length === 0) {
        if (SEEDED_ROADMAPS[id]) {
          parsedRoadmap = SEEDED_ROADMAPS[id];
        } else {
          parsedRoadmap = getFallbackRoadmap(item.title);
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // Otherwise set initial active sublevel (only if level is completed or seeded)
    for (const lvl of parsedRoadmap) {
      const isLevelReady = !lvl.id || lvl.status === 'completed';
      if (isLevelReady && lvl.sublevels.length > 0) {
        setActiveSublevel(lvl.sublevels[0] || null);
        setActiveLevelName(lvl.level);
        break;
      }
    }
  }, [content, item, id]);

  const handleGenerateLevel = async (levelId: string) => {
    setIsGenerating((prev) => ({ ...prev, [levelId]: true }));
    try {
      await apiFetch(`/curriculum/items/${id}/levels/${levelId}/generate`, {
        method: 'POST',
      });
      await loadDetails();
    } catch (e) {
      console.error('Failed to generate level content:', e);
    } finally {
      setIsGenerating((prev) => ({ ...prev, [levelId]: false }));
    }
  };

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

  // Custom markdown renderer helper
  const renderMarkdown = (text: string) => {
    if (!text) return null;

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
    let currentLanguage = '';

    const formatInline = (str: string) => {
      const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="bg-muted text-primary border-border rounded border px-1.5 py-0.5 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="text-foreground font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          if (currentLanguage === 'mermaid') {
            elements.push(<Mermaid key={`mermaid-${idx}`} chart={codeBuffer.join('\n')} />);
          } else {
            elements.push(
              <pre
                key={`code-${idx}`}
                className="bg-muted border-border text-foreground my-4 overflow-x-auto rounded-xl border-2 p-4 font-mono text-xs"
              >
                <code>{codeBuffer.join('\n')}</code>
              </pre>,
            );
          }
          codeBuffer = [];
          inCodeBlock = false;
          currentLanguage = '';
        } else {
          inCodeBlock = true;
          currentLanguage = trimmed.slice(3).trim().toLowerCase();
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1
            key={idx}
            className="font-display text-foreground border-border/10 mt-6 mb-4 border-b-2 pb-2 text-2xl font-bold md:text-3xl"
          >
            {formatInline(trimmed.replace('# ', ''))}
          </h1>,
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2
            key={idx}
            className="font-display text-primary border-border/20 mt-6 mb-3 border-b pb-1 text-xl font-bold"
          >
            {formatInline(trimmed.replace('## ', ''))}
          </h2>,
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="font-display text-foreground mt-4 mb-2 text-lg font-bold">
            {formatInline(trimmed.replace('### ', ''))}
          </h3>,
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li
            key={idx}
            className="text-muted-foreground mb-1.5 ml-4 list-disc pl-1 font-sans text-sm leading-relaxed md:text-base"
          >
            {formatInline(trimmed.replace(/^[-*]\s+/, ''))}
          </li>,
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        elements.push(
          <li
            key={idx}
            className="text-muted-foreground mb-1.5 ml-4 list-decimal pl-1 font-sans text-sm leading-relaxed md:text-base"
          >
            {formatInline(trimmed.replace(/^\d+\.\s+/, ''))}
          </li>,
        );
      } else if (trimmed === '') {
        return;
      } else {
        elements.push(
          <p
            key={idx}
            className="text-muted-foreground mb-3 font-sans text-sm leading-relaxed md:text-base"
          >
            {formatInline(line)}
          </p>,
        );
      }
    });

    return elements;
  };

  const getSublevelTheory = (bodyText: string, sublevel?: Sublevel) => {
    if (!sublevel || !bodyText) return bodyText;
    const cleanMarkdown = bodyText
      .replace(/<!-- ROADMAP_START -->[\s\S]*?<!-- ROADMAP_END -->/, '')
      .trim();
    if (!cleanMarkdown) return '';

    const title = sublevel.title || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtopicId = (sublevel as any).subtopicId;

    if (subtopicId) {
      const anchorRegex = new RegExp(
        `<!-- LESSON_START: ${subtopicId} -->([\\s\\S]*?)(?:<!-- LESSON_END: ${subtopicId} -->|<!-- LESSON_START:|$)`,
        'i',
      );
      const anchorMatch = cleanMarkdown.match(anchorRegex);
      if (anchorMatch && anchorMatch[1]?.trim()) {
        const text = anchorMatch[1].trim();
        return text.replace(/<!--[\s\S]*?-->/g, '').trim();
      }
    }

    const cleanTitle = title
      .replace(/^\d+\.\s*/, '')
      .toLowerCase()
      .trim();
    const words = cleanTitle.split(' ').filter((w) => w.length > 3);
    const lines = cleanMarkdown.split('\n');
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (line && (line.startsWith('## ') || line.startsWith('### ') || line.startsWith('# '))) {
        const lineLower = line.toLowerCase();
        if (
          lineLower.includes(cleanTitle) ||
          (words.length > 0 && words.some((w) => lineLower.includes(w)))
        ) {
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
    const finalResult = result.length > 30 ? result : cleanMarkdown;
    return finalResult.replace(/<!--[\s\S]*?-->/g, '').trim();
  };

  // Extract clean theory body
  const isRelational = activeSublevel && activeSublevel.id;
  const cleanBody = isRelational
    ? activeSublevel.contentBlock?.body || ''
    : content && activeSublevel
      ? getSublevelTheory(content.body, activeSublevel)
      : '';

  const hasTheoryContent = Boolean(cleanBody && cleanBody.length > 50);

  // Status computation
  const activeLevel = roadmap.find((lvl) => lvl.level === activeLevelName);
  const isLevelCompleted = !activeLevel || !activeLevel.id || activeLevel.status === 'completed';
  const isLevelGenerating = activeLevel && activeLevel.status === 'generating';
  const isActiveLevelNotGenerated =
    activeLevel &&
    activeLevel.id &&
    (activeLevel.status === 'not_generated' || activeLevel.status === 'failed');

  const isSublevelReady = isRelational ? isLevelCompleted && hasTheoryContent : true;

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

  // Static exercise link for legacy courses
  const getMappings = (currId: string) => {
    const baseId = currId.replace(/^curr-/, '');
    return { exerciseId: `ex-${baseId}` };
  };
  const { exerciseId } = getMappings(item.id);

  // Construct correct practice URL
  const getPracticeUrl = () => {
    if (!activeSublevel) return '#';
    const subKey = encodeURIComponent(`${id}_${activeLevelName}_${activeSublevel.title}`);

    if (activeSublevel.id) {
      return `/practice?sublevelId=${activeSublevel.id}&curriculumId=${item.id}&sublevelKey=${subKey}`;
    }

    if (Array.isArray(activeSublevel.exerciseIds) && activeSublevel.exerciseIds.length > 0) {
      return `/practice?exerciseIds=${activeSublevel.exerciseIds.join(',')}&curriculumId=${item.id}&sublevelKey=${subKey}`;
    }

    return `/practice?exerciseId=${exerciseId}&curriculumId=${item.id}&sublevelKey=${subKey}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4">
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

        {/* Two column layout: Left for Roadmap, Right for Theory content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Column 1: Roadmap Checklist */}
          <div className="space-y-6 p-1 pr-2 pb-3 md:sticky md:top-28 md:col-span-1 md:max-h-[calc(100vh-140px)] md:overflow-y-auto">
            <Card className="bg-card border-border shadow-neobrutalism border-2 p-6">
              <div className="mb-4 space-y-2">
                <h2 className="font-display text-lg font-bold tracking-wide">
                  Progreso de la Ruta
                </h2>
                <div className="text-muted-foreground flex items-center justify-between text-xs font-bold">
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

              <div className="border-border/10 space-y-6 border-t pt-4">
                {roadmap.map((lvl) => {
                  const hasId = Boolean(lvl.id);
                  const isNotGenerated = hasId && lvl.status === 'not_generated';
                  const isGeneratingLvl = hasId && lvl.status === 'generating';
                  const isFailed = hasId && lvl.status === 'failed';
                  const isLvlCompleted = !hasId || lvl.status === 'completed';

                  return (
                    <div key={lvl.level} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-primary text-sm font-bold tracking-wider uppercase">
                          {lvl.level}
                        </h3>
                        {hasId && (
                          <div className="flex items-center">
                            {isNotGenerated && (
                              <Button
                                onClick={() => handleGenerateLevel(lvl.id!)}
                                disabled={isGenerating[lvl.id!]}
                                variant="neobrutalism"
                                className="h-6 bg-yellow-500 px-2 py-0 text-[9px] font-bold text-black hover:bg-yellow-600"
                              >
                                {isGenerating[lvl.id!] ? 'Descargando...' : 'Descargar módulo'}
                              </Button>
                            )}
                            {isFailed && (
                              <Button
                                onClick={() => handleGenerateLevel(lvl.id!)}
                                disabled={isGenerating[lvl.id!]}
                                variant="neobrutalism"
                                className="flex h-6 items-center gap-1 bg-red-500 px-2 py-0 font-bold text-white hover:bg-red-600"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Reintentar
                              </Button>
                            )}
                            {isGeneratingLvl && (
                              <span className="flex animate-pulse items-center gap-1 text-[9px] font-bold text-yellow-600 dark:text-yellow-400">
                                <Loader className="h-3 w-3 animate-spin" />
                                IA redactando...
                              </span>
                            )}
                            {isLvlCompleted && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 dark:text-green-400">
                                <Check className="h-3.5 w-3.5" />
                                Listo
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="border-primary/20 ml-2 space-y-2.5 border-l-2 pl-3">
                        {lvl.sublevels.map((sub) => {
                          const sublevelKey = `${id}_${lvl.level}_${sub.title}`;
                          const isCompleted = completedSublevels.includes(sublevelKey);
                          const isActive =
                            activeSublevel?.title === sub.title && activeLevelName === lvl.level;

                          return (
                            <div
                              key={sub.title}
                              onClick={() => {
                                if (!isLvlCompleted) return;
                                setActiveSublevel(sub);
                                setActiveLevelName(lvl.level);
                              }}
                              className={`group flex items-start gap-3 rounded-lg border p-2.5 transition-all select-none ${
                                !isLvlCompleted
                                  ? 'bg-muted/20 cursor-not-allowed border-transparent opacity-30'
                                  : isActive
                                    ? 'bg-muted border-primary shadow-neobrutalism-sm translate-x-[-1px] translate-y-[-1px] cursor-pointer font-semibold'
                                    : isCompleted
                                      ? 'cursor-pointer border-green-500/20 border-transparent bg-green-500/5 dark:bg-green-500/10'
                                      : 'hover:border-border/20 hover:bg-muted/40 cursor-pointer border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                readOnly
                                disabled={!isLvlCompleted}
                                className="border-border text-primary focus:ring-ring mt-1 h-4 w-4 shrink-0 rounded border-2 transition-colors focus:ring-2"
                              />
                              <div className="flex-1 space-y-0.5">
                                <h4
                                  className={`text-xs font-bold transition-all ${
                                    isCompleted
                                      ? 'text-green-600 line-through opacity-70 dark:text-green-400'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {sub.title}
                                </h4>
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
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Column 2: Material de Estudio & Practice Action */}
          <div className="space-y-6 md:col-span-2">
            {/* Content Block Reader */}
            <Card className="bg-card border-border shadow-neobrutalism min-h-[300px] border-2 p-8">
              {isLevelGenerating ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3">
                  <Loader className="h-10 w-10 animate-spin text-yellow-500" />
                  <p className="text-muted-foreground font-display animate-pulse text-sm font-bold">
                    La Inteligencia Artificial está redactando la teoría y preparando los
                    ejercicios...
                  </p>
                </div>
              ) : isActiveLevelNotGenerated ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-4 text-center">
                  <BookOpen className="text-muted-foreground/30 h-12 w-12" />
                  <div className="space-y-1">
                    <h3 className="font-display text-md font-bold">Módulo bloqueado</h3>
                    <p className="text-muted-foreground mx-auto max-w-sm font-sans text-xs">
                      Presiona &quot;Descargar módulo&quot; en la barra de progreso lateral para
                      generar las lecciones y prácticas.
                    </p>
                  </div>
                  <Button
                    onClick={() => activeLevel && handleGenerateLevel(activeLevel.id!)}
                    variant="neobrutalism"
                    className="bg-yellow-500 px-6 font-bold text-black hover:bg-yellow-600"
                  >
                    Generar contenido ahora
                  </Button>
                </div>
              ) : hasTheoryContent ? (
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
            {isSublevelReady && (
              <Card className="border-border bg-primary/5 shadow-neobrutalism-sm dark:bg-primary/10 flex flex-col items-center justify-between gap-4 border-2 p-6 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="bg-primary border-border shadow-neobrutalism-sm flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full border-2 font-bold text-white">
                    <Play className="h-4 w-4 fill-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-sm font-bold">
                      ¿Listo para probar{' '}
                      {activeSublevel ? `"${activeSublevel.title}"` : 'tu comprensión'}?
                    </h3>
                    <p className="text-muted-foreground mt-0.5 font-sans text-xs">
                      Realiza la secuencia de práctica recomendada para este subtema.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="neobrutalism"
                  className="h-10 w-full cursor-pointer sm:w-auto"
                >
                  <Link
                    href={getPracticeUrl()}
                    className="flex items-center justify-center gap-1.5 font-bold"
                  >
                    Iniciar Práctica
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

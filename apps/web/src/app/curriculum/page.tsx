'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getCurriculumItems,
  generateSyllabus,
  type CurriculumItem,
} from '@/config/curriculum-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import {
  BookOpen,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Edit3,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '@/config/api-client';

export default function CurriculumPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<readonly CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // AI Generation States
  const [topicInput, setTopicInput] = useState('');
  const [providerInput, setProviderInput] = useState('gemini');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<readonly CurriculumItem[] | null>(null);

  // Administrative Actions States
  const [renamingItem, setRenamingItem] = useState<CurriculumItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  const loadingMessages = [
    'Conectando con el orquestador de IA...',
    'Analizando la estructura pedagógica de tu tema...',
    'Diseñando niveles (Básico, Intermedio, Avanzado, Profesional)...',
    'Generando material teórico y lecturas clave...',
    'Creando evaluación formativa y retos interactivos...',
    'Estructurando base de datos de tu ruta personalizada...',
    'Cargando detalles finales para tu viaje de estudio...',
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      setMessageIndex(0);
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const loadCurriculum = async () => {
    try {
      const data = await getCurriculumItems();
      setItems(data);
    } catch (err) {
      const errorVal = err as Error;
      setError(errorVal.message || 'No se pudieron cargar los temas del currículo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void loadCurriculum();
  }, [authLoading]);

  const handleGenerate = async (force = false) => {
    if (!topicInput.trim()) return;

    setGenerating(true);
    setGenerationError(null);
    if (!force) setDuplicates(null);

    try {
      const res = await generateSyllabus(topicInput, providerInput, force);
      if (res.status === 'duplicate_found' && res.duplicates) {
        setDuplicates(res.duplicates);
      } else if (res.status === 'success' && res.id) {
        router.push(`/curriculum/${res.id}`);
      } else {
        setGenerationError(res.message || 'Ocurrió un error inesperado al generar.');
      }
    } catch (err) {
      const errorVal = err as Error;
      setGenerationError(errorVal.message || 'Error de red al conectar con el servidor.');
    } finally {
      setGenerating(false);
    }
  };

  const submitRename = async () => {
    if (!renamingItem || !newTitle.trim()) return;

    try {
      await apiFetch(`/curriculum/items/${renamingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });

      // Update local state immediately
      setItems((prev) =>
        prev.map((item) => (item.id === renamingItem.id ? { ...item, title: newTitle } : item)),
      );
      setRenamingItem(null);
    } catch (err) {
      const errorVal = err as Error;
      alert(`Error al renombrar el curso: ${errorVal.message}`);
    }
  };

  const submitDelete = async () => {
    if (!deletingId) return;

    try {
      await apiFetch(`/curriculum/items/${deletingId}`, {
        method: 'DELETE',
      });

      // Remove from local list immediately
      setItems((prev) => prev.filter((item) => item.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      const errorVal = err as Error;
      alert(`Error al eliminar el curso: ${errorVal.message}`);
    }
  };

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

        {/* AI Syllabus Generator Box */}
        {isAdmin ? (
          <Card className="border-border bg-sage-pale/20 dark:bg-card shadow-neobrutalism-sm border-2 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5 animate-pulse" />
                <h2 className="font-display text-lg font-bold">
                  Generar Nueva Ruta con IA (Admin)
                </h2>
              </div>

              <p className="text-muted-foreground font-sans text-xs">
                Ingresa un tema (ej: Python para Análisis de Datos, Fundamentos de Rust) y la IA
                diseñará un temario completo, teoría y retos prácticos.
              </p>

              {generationError && (
                <div className="border-primary bg-coral-red/5 text-primary flex items-center gap-2 rounded-lg border p-3 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {duplicates && duplicates.length > 0 && (
                <div className="border-primary bg-primary/5 flex flex-col gap-3 rounded-lg border-2 p-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-primary h-5 w-5 shrink-0" />
                    <h4 className="font-display text-sm font-bold">
                      ¿Deseas reutilizar un temario existente?
                    </h4>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Encontramos rutas de aprendizaje similares en el sistema:
                  </p>
                  <div className="space-y-2">
                    {duplicates.map((dup) => (
                      <div
                        key={dup.id}
                        className="bg-card border-border flex items-center justify-between rounded-lg border p-2.5"
                      >
                        <div>
                          <h5 className="font-display text-xs font-bold">{dup.title}</h5>
                          <p className="text-muted-foreground line-clamp-1 font-sans text-[10px]">
                            {dup.description}
                          </p>
                        </div>
                        <Button
                          asChild
                          variant="neobrutalism"
                          className="h-7 cursor-pointer px-2 text-[10px]"
                        >
                          <Link href={`/curriculum/${dup.id}`}>Ver ruta</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={() => setDuplicates(null)}
                      variant="neobrutalismOutline"
                      className="h-8 cursor-pointer px-3 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleGenerate(true)}
                      variant="neobrutalism"
                      className="h-8 cursor-pointer px-3 text-xs"
                    >
                      Generar Nuevo De Todas Formas
                    </Button>
                  </div>
                </div>
              )}

              {!duplicates && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="Escribe el tema que deseas aprender..."
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        disabled={generating}
                        className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring w-full rounded-lg border-2 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      />
                      <select
                        value={providerInput}
                        onChange={(e) => setProviderInput(e.target.value)}
                        disabled={generating}
                        className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring shrink-0 rounded-lg border-2 px-2 py-2 text-xs font-bold focus:outline-none"
                      >
                        <option value="gemini">Gemini</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="codex">Codex</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => handleGenerate(false)}
                      disabled={generating || !topicInput.trim()}
                      variant="neobrutalism"
                      className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 px-4 font-bold"
                    >
                      {generating ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Diseñar Ruta
                        </>
                      )}
                    </Button>
                  </div>

                  {generating && (
                    <div className="border-border bg-muted/10 animate-in fade-in slide-in-from-bottom-2 mt-4 space-y-4 rounded-xl border-2 p-6 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 border-primary text-primary flex h-10 w-10 shrink-0 animate-bounce items-center justify-center rounded-full border-2">
                          <Sparkles className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="w-full space-y-1">
                          <h3 className="font-display text-foreground text-sm font-bold">
                            Generando tu Ruta de Aprendizaje Personalizada
                          </h3>
                          <p className="text-primary animate-pulse text-xs font-semibold transition-all duration-300">
                            {loadingMessages[messageIndex]}
                          </p>
                        </div>
                      </div>

                      {/* Animated progress bar */}
                      <div className="space-y-1.5">
                        <div className="border-border/20 bg-muted h-3 w-full overflow-hidden rounded-full border">
                          <div className="bg-primary animate-progress-glow h-full rounded-full" />
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between text-[10px] font-semibold">
                          <span>Preparando material pedagógico...</span>
                          <span>Esto puede tomar unos 10-15 segundos</span>
                        </div>
                      </div>

                      {/* Skeleton roadmap preview */}
                      <div className="border-border/10 pointer-events-none space-y-3 border-t pt-4 opacity-60 select-none">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                          <div className="bg-muted h-3 w-32 animate-pulse rounded" />
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                          <div className="bg-muted h-2 w-2 rounded-full" />
                          <div className="bg-muted h-2.5 w-24 animate-pulse rounded" />
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                          <div className="bg-muted h-2 w-2 rounded-full" />
                          <div className="bg-muted h-2.5 w-28 animate-pulse rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="border-border bg-muted/20 shadow-neobrutalism-sm border-2 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-muted-foreground h-5 w-5 shrink-0 opacity-40" />
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-bold">
                  Generación con IA reservada para Administradores
                </h3>
                <p className="text-muted-foreground font-sans text-xs">
                  Para optimizar recursos y cuotas de servicio, solo las cuentas de tipo
                  Administrador pueden diseñar nuevas rutas curriculares con IA. Si necesitas una
                  ruta que no esté en el catálogo de abajo, por favor solicítala a tu profesor.
                </p>
              </div>
            </div>
          </Card>
        )}

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

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            onClick={() => {
                              setRenamingItem(item);
                              setNewTitle(item.title);
                            }}
                            variant="neobrutalismOutline"
                            size="sm"
                            className="h-8 w-8 cursor-pointer p-0"
                            title="Renombrar curso"
                          >
                            <Edit3 className="text-foreground h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeletingTitle(item.title);
                            }}
                            variant="neobrutalismOutline"
                            size="sm"
                            className="h-8 w-8 cursor-pointer border-red-500/30 p-0 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Eliminar curso"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button
                        asChild
                        variant="neobrutalism"
                        size="sm"
                        className="h-8 cursor-pointer text-xs font-bold"
                      >
                        <Link href={`/curriculum/${item.id}`} className="flex items-center gap-1">
                          Estudiar
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Rename Modal Dialog */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card className="border-border bg-card shadow-neobrutalism space-y-4 border-2 p-6">
              <h3 className="font-display text-lg font-bold">Renombrar Curso</h3>
              <p className="text-muted-foreground font-sans text-xs">
                Ingresa el nuevo título para tu curso:
              </p>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nuevo título del curso"
                className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring text-foreground w-full rounded-lg border-2 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setRenamingItem(null)}
                  variant="neobrutalismOutline"
                  className="h-9 cursor-pointer text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitRename}
                  disabled={!newTitle.trim() || newTitle.trim() === renamingItem.title}
                  variant="neobrutalism"
                  className="h-9 cursor-pointer border-2 bg-yellow-500 text-xs font-bold text-black hover:bg-yellow-600"
                >
                  Guardar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card className="border-border bg-card shadow-neobrutalism space-y-4 border-2 p-6">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h3 className="font-display text-lg font-bold">¿Eliminar Curso?</h3>
              </div>
              <p className="text-muted-foreground font-sans text-sm">
                ¿Estás seguro de que deseas eliminar permanentemente el curso{' '}
                <strong>&quot;{deletingTitle}&quot;</strong>?
              </p>
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 font-sans text-[11px] leading-relaxed text-red-500">
                <strong>Atención:</strong> Esta acción borrará todas las lecciones escritas,
                historial de prácticas completadas de estudiantes y configuraciones de spaced
                repetition de forma irreversible.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => setDeletingId(null)}
                  variant="neobrutalismOutline"
                  className="h-9 cursor-pointer text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitDelete}
                  variant="neobrutalism"
                  className="h-9 cursor-pointer border-2 bg-red-500 text-xs font-bold text-white hover:bg-red-600"
                >
                  Eliminar Curso
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
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

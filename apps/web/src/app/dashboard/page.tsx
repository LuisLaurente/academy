'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getActiveRecommendations } from '@/config/recommendation-service';
import { getCurriculumItems } from '@/config/curriculum-service';
import { getStudentEvaluations, type EvaluationResponse } from '@/config/evaluation-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, BookOpen, Clock, Award, CheckCircle2, ArrowRight, User } from 'lucide-react';

interface ResolvedRecommendation {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMins: number;
  reasoning: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [recommendations, setRecommendations] = useState<readonly ResolvedRecommendation[]>([]);
  const [evaluations, setEvaluations] = useState<readonly EvaluationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    async function loadDashboardData() {
      try {
        // Fetch recommendations, all curriculum items, and evaluations in parallel
        const [recSet, allItems, evalList] = await Promise.all([
          getActiveRecommendations(user!.userId),
          getCurriculumItems(),
          getStudentEvaluations(user!.userId).catch(() => []), // fallback to empty if endpoint fails
        ]);

        setEvaluations(evalList);

        // Resolve recommended items to match full curriculum item details
        const resolved: ResolvedRecommendation[] = [];
        if (recSet && recSet.recommendedItems) {
          recSet.recommendedItems.forEach((recItem: unknown) => {
            const itemId =
              typeof recItem === 'string'
                ? recItem
                : ((recItem as Record<string, unknown>).itemId as string);
            const reasoning =
              typeof recItem === 'string'
                ? 'Recomendado para avanzar en tu ruta del currículo.'
                : ((recItem as Record<string, unknown>).reasoning as string) ||
                  'Sugerencia de aprendizaje inteligente.';

            const matchedItem = allItems.find((item) => item.id === itemId);
            if (matchedItem) {
              resolved.push({
                id: matchedItem.id,
                title: matchedItem.title,
                description: matchedItem.description,
                difficulty: matchedItem.difficulty,
                estimatedMins: matchedItem.estimatedMins,
                reasoning,
              });
            }
          });
        }

        // Fallback to first curriculum item if no recommendations are found
        if (resolved.length === 0 && allItems.length > 0) {
          resolved.push({
            id: allItems[0]!.id,
            title: allItems[0]!.title,
            description: allItems[0]!.description,
            difficulty: allItems[0]!.difficulty,
            estimatedMins: allItems[0]!.estimatedMins,
            reasoning: 'Comienza tu viaje con el tema introductorio sugerido.',
          });
        }

        setRecommendations(resolved);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, [user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground font-display text-sm font-bold">
          Cargando tu panel de control...
        </p>
      </div>
    );
  }

  // Stats calculation
  const totalMinutes = evaluations.reduce((sum) => sum + 15, 0); // assume 15 mins per exercise
  const completedTopicsCount = evaluations.filter((ev) => ev.isPassed).length;

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-6xl flex-1 space-y-8 px-6">
        {/* Welcome Header */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <h1 className="font-display text-4xl leading-none font-bold tracking-tight">
              ¡Hola, Estudiante!
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 font-sans text-sm">
              <User className="text-primary h-4 w-4" />
              {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              variant="neobrutalismOutline"
              size="sm"
              className="h-9 cursor-pointer px-3 text-xs"
            >
              Cerrar Sesión
            </Button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="bg-card shadow-neobrutalism-sm flex items-center gap-4 p-5">
            <div className="bg-sage-pale border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2">
              <Clock className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Tiempo de Estudio
              </p>
              <h3 className="font-display mt-0.5 text-xl font-bold">{totalMinutes} minutos</h3>
            </div>
          </Card>

          <Card className="bg-card shadow-neobrutalism-sm flex items-center gap-4 p-5">
            <div className="bg-sage-pale border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2">
              <CheckCircle2 className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Prácticas Aprobadas
              </p>
              <h3 className="font-display mt-0.5 text-xl font-bold">
                {completedTopicsCount} temas
              </h3>
            </div>
          </Card>

          <Card className="bg-card shadow-neobrutalism-sm flex items-center gap-4 p-5">
            <div className="bg-sage-pale border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2">
              <Award className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Rendimiento Promedio
              </p>
              <h3 className="font-display mt-0.5 text-xl font-bold">
                {evaluations.length > 0
                  ? `${Math.round((evaluations.reduce((sum, ev) => sum + ev.score, 0) / evaluations.length) * 100)}%`
                  : 'N/A'}
              </h3>
            </div>
          </Card>
        </section>

        {/* AI Recommendations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary fill-primary h-5 w-5" />
            <h2 className="font-display text-2xl font-bold tracking-wide">
              Tu Próximo Paso Recomendado (IA)
            </h2>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="border-border bg-card shadow-neobrutalism flex flex-col items-start justify-between gap-6 border-2 p-6 md:flex-row md:items-center"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="border-border bg-sage-pale text-foreground rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                      {rec.difficulty}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                      <Clock className="text-primary h-3.5 w-3.5" />
                      {rec.estimatedMins} mins
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold">{rec.title}</h3>
                  <p className="text-muted-foreground max-w-2xl font-sans text-sm">
                    {rec.description}
                  </p>

                  <div className="bg-primary/5 dark:bg-primary/10 border-primary/20 text-primary inline-block rounded-xl border px-3 py-2 text-xs font-semibold">
                    🤖 {rec.reasoning}
                  </div>
                </div>

                <Button
                  asChild
                  variant="neobrutalism"
                  className="w-full shrink-0 cursor-pointer px-6 md:w-auto"
                >
                  <Link
                    href={`/curriculum/${rec.id}`}
                    className="flex items-center justify-center gap-2"
                  >
                    Comenzar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-wide">Actividad Reciente</h2>

          {evaluations.length === 0 ? (
            <Card className="border-border/40 bg-card/50 border-2 border-dashed p-8 text-center">
              <BookOpen className="text-muted-foreground/40 mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground font-sans text-sm">
                Aún no has completado ninguna práctica. Explora los temas y pon a prueba tus
                conocimientos.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <Card
                  key={ev.id}
                  className="border-border/20 bg-card/60 shadow-neobrutalism-sm flex items-center justify-between gap-4 border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold text-white ${
                        ev.isPassed ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {ev.isPassed ? '✓' : '✗'}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold">
                        Práctica del Ejercicio: {ev.exerciseId}
                      </h4>
                      <p className="text-muted-foreground font-sans text-xs">
                        Completado el {new Date(ev.evaluatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-primary text-sm font-bold">
                      Puntaje: {Math.round(ev.score * 100)}%
                    </div>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      {ev.isPassed ? 'Aprobado' : 'Reintentar'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

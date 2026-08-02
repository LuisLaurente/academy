'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentEvaluations, type EvaluationResponse } from '@/config/evaluation-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Award, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [evaluations, setEvaluations] = useState<readonly EvaluationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    async function loadProfileData() {
      try {
        const evalList = await getStudentEvaluations(user!.userId);
        setEvaluations(evalList);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadProfileData();
  }, [user]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground font-display text-sm font-bold">Cargando perfil...</p>
      </div>
    );
  }

  // Statistics
  const passedCount = evaluations.filter((ev) => ev.isPassed).length;
  const failedCount = evaluations.length - passedCount;
  const averageScore =
    evaluations.length > 0
      ? Math.round((evaluations.reduce((sum, ev) => sum + ev.score, 0) / evaluations.length) * 100)
      : 0;

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-3xl flex-1 space-y-6 px-6">
        {/* Profile header */}
        <Card className="border-border bg-card shadow-neobrutalism flex flex-col items-center gap-6 border-2 p-6 sm:flex-row">
          <div className="bg-primary border-border font-display shadow-neobrutalism-sm flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold text-white">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold tracking-wide">Perfil del Estudiante</h1>
            <p className="text-muted-foreground font-sans text-sm">{user.email}</p>
            <p className="text-muted-foreground/60 font-mono text-xs">ID: {user.userId}</p>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="bg-card border-border shadow-neobrutalism-sm border-2 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-500" />
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Aprobados
            </span>
            <h3 className="font-display mt-1 text-2xl font-bold">{passedCount}</h3>
          </Card>

          <Card className="bg-card border-border shadow-neobrutalism-sm border-2 p-4 text-center">
            <XCircle className="text-primary mx-auto mb-2 h-6 w-6" />
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Fallidos
            </span>
            <h3 className="font-display mt-1 text-2xl font-bold">{failedCount}</h3>
          </Card>

          <Card className="bg-card border-border shadow-neobrutalism-sm border-2 p-4 text-center">
            <Award className="text-primary mx-auto mb-2 h-6 w-6" />
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Promedio
            </span>
            <h3 className="font-display mt-1 text-2xl font-bold">
              {evaluations.length > 0 ? `${averageScore}%` : 'N/A'}
            </h3>
          </Card>
        </div>

        {/* Complete Evaluation history */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold tracking-wide">
            Historial Completo de Prácticas
          </h2>

          {evaluations.length === 0 ? (
            <Card className="border-border/40 bg-card/50 border-2 border-dashed p-12 text-center">
              <BookOpen className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
              <p className="text-muted-foreground font-sans text-sm">
                Aún no has completado evaluaciones de práctica. Realiza prácticas en tu mapa
                curricular para registrar tu progreso.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <Card
                  key={ev.id}
                  className="border-border bg-card shadow-neobrutalism-sm flex items-center justify-between gap-4 border-2 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold text-white ${
                        ev.isPassed ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {ev.isPassed ? '✓' : '✗'}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold">Ejercicio: {ev.exerciseId}</h4>
                      <p className="text-muted-foreground mt-0.5 font-sans text-xs">
                        Evaluado el {new Date(ev.evaluatedAt).toLocaleString()}
                      </p>
                      {ev.feedback && (
                        <p className="text-primary/80 bg-primary/5 border-primary/10 mt-1 inline-block rounded-lg border px-2 py-1 font-sans text-xs">
                          💬 {ev.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-primary text-base font-bold">
                      {Math.round(ev.score * 100)}%
                    </div>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      {ev.isPassed ? 'Aprobado' : 'Reintentar'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

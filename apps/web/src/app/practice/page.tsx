'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getExerciseById, type Exercise } from '@/config/exercise-service';
import { submitEvaluation } from '@/config/evaluation-service';
import { startSession, completeSessionItem, finishSession } from '@/config/session-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { Award, CheckCircle, XCircle, ArrowLeft, ArrowRight, HelpCircle, Code, Lightbulb } from 'lucide-react';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exerciseIdParam = searchParams.get('exerciseId');
  const exerciseIdsParam = searchParams.get('exerciseIds');
  const curriculumId = searchParams.get('curriculumId');
  const sublevelKey = searchParams.get('sublevelKey');

  const [user] = useState<{ email: string; userId: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('learning_os_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Hints state
  const [hints, setHints] = useState<string[]>([]);
  const [revealedHintsCount, setRevealedHintsCount] = useState(0);

  // Quiz interactive state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  // Code interactive state
  const [codeAnswer, setCodeAnswer] = useState('');

  // Evaluation response state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    isPassed: boolean;
    feedback: string;
  } | null>(null);

  // Dynamic options mapping
  const [parsedPrompt, setParsedPrompt] = useState<string>('');
  const [dynamicOptions, setDynamicOptions] = useState<{ text: string; isCorrect: boolean; feedback?: string }[]>([]);

  // Parse exercise parameters
  useEffect(() => {
    const list: string[] = [];
    if (exerciseIdsParam) {
      list.push(...exerciseIdsParam.split(','));
    } else if (exerciseIdParam) {
      list.push(exerciseIdParam);
    }
    setExerciseIds(list);
    setCurrentIndex(0);
  }, [exerciseIdParam, exerciseIdsParam]);

  // Start study session
  useEffect(() => {
    if (!user || !curriculumId) return;

    async function initSession() {
      try {
        const session = await startSession(user!.userId, [curriculumId!]);
        setSessionId(session.id);
      } catch (err) {
        console.error('Failed to start study session:', err);
      }
    }
    void initSession();
  }, [user, curriculumId]);

  // Load active exercise
  useEffect(() => {
    if (exerciseIds.length === 0) return;
    const activeId = exerciseIds[currentIndex];
    if (!activeId) return;

    async function loadExercise(id: string) {
      setLoading(true);
      setError(null);
      try {
        const data = await getExerciseById(id);
        setExercise(data);
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'Error al cargar el ejercicio de práctica.');
      } finally {
        setLoading(false);
      }
    }
    void loadExercise(activeId);
  }, [exerciseIds, currentIndex]);

  // Parse exercise content & hints
  useEffect(() => {
    if (!exercise) return;
    try {
      const parsed = JSON.parse(exercise.prompt);
      if (parsed && typeof parsed === 'object') {
        setParsedPrompt(parsed.question || exercise.prompt);
        setDynamicOptions(parsed.options || []);
        setHints(parsed.hints || []);
        setRevealedHintsCount(0);
        return;
      }
    } catch (e) {
      // Ignored
    }
    setParsedPrompt(exercise.prompt);
    setHints([]);
    setRevealedHintsCount(0);

    if (exercise.id === 'ex-ddd-quiz-1') {
      setDynamicOptions([
        {
          text: 'Un objeto definido por su identidad única que cambia a lo largo de su ciclo de vida.',
          isCorrect: false,
        },
        {
          text: 'Un objeto inmutable cuyos atributos determinan por completo su identidad y no tiene ID independiente.',
          isCorrect: true,
        },
        {
          text: 'Un contenedor de base de datos que maneja la persistencia y mapeo ORM de las entidades.',
          isCorrect: false,
        },
        {
          text: 'Un evento asíncrono que propaga cambios de estado a otros microservicios.',
          isCorrect: false,
        },
      ]);
    } else {
      setDynamicOptions([
        { text: 'Opción correcta para este tema.', isCorrect: true, feedback: '¡Excelente! Respuesta correcta.' },
        { text: 'Una opción alternativa incorrecta.', isCorrect: false, feedback: 'Incorrecto. Revisa de nuevo.' },
        { text: 'Otra opción incorrecta para distracción.', isCorrect: false, feedback: 'Incorrecto. Inténtalo de nuevo.' },
        { text: 'Ninguna de las anteriores.', isCorrect: false, feedback: 'Incorrecto.' },
      ]);
    }
  }, [exercise]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (loading || !user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground font-display text-sm font-bold">
          Preparando ejercicio de práctica...
        </p>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 pt-24">
        <Background />
        <Navbar />
        <Card className="border-primary bg-coral-red/5 w-full max-w-md space-y-4 border-2 p-8 text-center">
          <h3 className="font-display text-lg font-bold">Error de Carga</h3>
          <p className="text-muted-foreground text-sm">
            {error || 'El ejercicio no está disponible.'}
          </p>
          <Button asChild variant="neobrutalism" className="px-6">
            <Link href="/curriculum" className="cursor-pointer">
              Volver al currículo
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleQuizSubmit = async () => {
    if (selectedOption === null) return;
    setSubmitting(true);

    const option = dynamicOptions[selectedOption];
    const isPassed = option ? option.isCorrect : false;
    const score = isPassed ? 1.0 : 0.0;
    const feedback = option?.feedback
      ? option.feedback
      : (isPassed
          ? '¡Excelente! Has seleccionado la respuesta correcta.'
          : 'Inténtalo de nuevo. Revisa el material de estudio y vuelve a intentarlo.');

    try {
      await submitEvaluation({
        exerciseId: exercise.id,
        studentId: user.userId,
        isPassed,
        score,
        feedback,
      });

      const isLast = currentIndex === exerciseIds.length - 1;
      if (isPassed && isLast && sessionId && curriculumId) {
        try {
          await completeSessionItem(sessionId, curriculumId);
          await finishSession(sessionId);
        } catch (sessErr) {
          console.error('Failed to update session tracking:', sessErr);
        }

        if (sublevelKey) {
          const progressKey = `roadmap_progress_${user.userId}_${curriculumId}`;
          const stored = localStorage.getItem(progressKey);
          const currentCompleted = stored ? JSON.parse(stored) : [];
          if (!currentCompleted.includes(sublevelKey)) {
            const updated = [...currentCompleted, sublevelKey];
            localStorage.setItem(progressKey, JSON.stringify(updated));
          }
        }
      }

      setResult({ score, isPassed, feedback });
    } catch (err) {
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!codeAnswer.trim()) return;
    setSubmitting(true);

    const lowercaseAnswer = codeAnswer.toLowerCase();
    const isPassed =
      lowercaseAnswer.includes('interface userrepository') ||
      lowercaseAnswer.includes('implements');
    const score = isPassed ? 1.0 : 0.4;
    const feedback = isPassed
      ? '¡Respuesta enviada! Has respetado la inversión de dependencias abstrayendo la interfaz de persistencia.'
      : 'Inténtalo de nuevo. Asegúrate de definir la interfaz de repositorio del puerto para aplicar la inversión de dependencias.';

    try {
      await submitEvaluation({
        exerciseId: exercise.id,
        studentId: user.userId,
        isPassed,
        score,
        feedback,
      });

      const isLast = currentIndex === exerciseIds.length - 1;
      if (isPassed && isLast && sessionId && curriculumId) {
        try {
          await completeSessionItem(sessionId, curriculumId);
          await finishSession(sessionId);
        } catch (sessErr) {
          console.error('Failed to update session tracking:', sessErr);
        }

        if (sublevelKey) {
          const progressKey = `roadmap_progress_${user.userId}_${curriculumId}`;
          const stored = localStorage.getItem(progressKey);
          const currentCompleted = stored ? JSON.parse(stored) : [];
          if (!currentCompleted.includes(sublevelKey)) {
            const updated = [...currentCompleted, sublevelKey];
            localStorage.setItem(progressKey, JSON.stringify(updated));
          }
        }
      }

      setResult({ score, isPassed, feedback });
    } catch (err) {
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextExercise = () => {
    setSelectedOption(null);
    setCodeAnswer('');
    setResult(null);
    setRevealedHintsCount(0);
    setCurrentIndex((prev) => prev + 1);
  };

  const percentCompleted = exerciseIds.length > 0 ? Math.round((currentIndex / exerciseIds.length) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-2xl flex-1 space-y-6 px-6">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-primary mb-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atrás
        </button>

        {/* Progress Tracker */}
        {exerciseIds.length > 1 && (
          <div className="space-y-1 bg-card border-border shadow-neobrutalism-sm border-2 rounded-xl p-4">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
              <span>Ejercicio {currentIndex + 1} de {exerciseIds.length}</span>
              <span>{percentCompleted}%</span>
            </div>
            <div className="h-2 w-full bg-muted border border-border/10 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>
        )}

        {/* Exercise prompt card */}
        <Card className="border-border bg-card shadow-neobrutalism-sm space-y-3 border-2 p-6">
          <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            {exercise.exerciseType === 'quiz' ? (
              <HelpCircle className="h-4 w-4" />
            ) : (
              <Code className="h-4 w-4" />
            )}
            {exercise.exerciseType} • dificultad: {exercise.difficulty}
          </div>
          <h1 className="font-display text-xl font-bold tracking-wide">{exercise.title}</h1>
          <p className="text-foreground/80 font-sans text-sm leading-relaxed whitespace-pre-line">
            {parsedPrompt}
          </p>
        </Card>

        {/* Input Interface */}
        {!result ? (
          <Card className="border-border bg-card shadow-neobrutalism space-y-6 border-2 p-6">
            {exercise.exerciseType === 'quiz' ? (
              <div className="space-y-3">
                {dynamicOptions.map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full cursor-pointer rounded-xl border-2 p-4 text-left font-sans text-sm transition-all ${
                      selectedOption === index
                        ? 'bg-muted border-border shadow-neobrutalism-sm translate-x-[-1px] translate-y-[-1px] font-semibold'
                        : 'border-border/10 hover:border-border/40 hover:bg-muted/10'
                    }`}
                  >
                    <span className="font-display text-primary mr-2 font-bold">
                      {String.fromCharCode(65 + index)})
                    </span>
                    {opt.text}
                  </button>
                ))}

                <Button
                  onClick={handleQuizSubmit}
                  disabled={selectedOption === null || submitting}
                  variant="neobrutalism"
                  className="mt-4 w-full cursor-pointer py-6"
                >
                  {submitting ? 'Evaluando...' : 'Enviar Respuesta'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="// Escribe tu código o explicación aquí...&#10;// Ejemplo: export interface UserRepository { findById(id: string): Promise<User>; }"
                  rows={8}
                  className="bg-background border-border focus:ring-primary focus:border-border w-full rounded-xl border-2 p-4 font-mono text-xs transition-all focus:ring-2 focus:outline-none"
                />

                <Button
                  onClick={handleCodeSubmit}
                  disabled={!codeAnswer.trim() || submitting}
                  variant="neobrutalism"
                  className="w-full cursor-pointer py-6"
                >
                  {submitting ? 'Evaluando...' : 'Enviar Solución de Código'}
                </Button>
              </div>
            )}

            {/* Hints Section */}
            {hints.length > 0 && (
              <div className="space-y-2 border-t border-border/10 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                    Ayuda de la IA
                  </h3>
                  {revealedHintsCount < 3 && (
                    <button
                      onClick={() => setRevealedHintsCount((prev) => prev + 1)}
                      className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Solicitar Pista ({revealedHintsCount}/3)
                    </button>
                  )}
                </div>
                {revealedHintsCount > 0 && (
                  <div className="space-y-2 mt-2">
                    {hints.slice(0, revealedHintsCount).map((hint, i) => (
                      <div key={i} className="bg-muted border border-border/10 rounded-xl p-3 text-xs font-medium text-foreground/80 flex items-start gap-2">
                        <span className="text-primary font-bold">Pista {i + 1}:</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          /* Feedback Results card */
          <Card
            className={`border-border shadow-neobrutalism space-y-6 border-2 p-8 text-center transition-all ${
              result.isPassed ? 'bg-green-500/5' : 'bg-primary/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              {result.isPassed ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-100 text-green-500 dark:bg-green-900/30">
                  <CheckCircle className="h-10 w-10" />
                </div>
              ) : (
                <div className="bg-primary/10 border-primary text-primary flex h-16 w-16 items-center justify-center rounded-full border-2">
                  <XCircle className="h-10 w-10" />
                </div>
              )}

              <h2 className="font-display text-2xl font-bold tracking-wide">
                {result.isPassed
                  ? (currentIndex < exerciseIds.length - 1 ? '¡Correcto!' : '¡Práctica Completada!')
                  : 'Intento Fallido'}
              </h2>

              <div className="border-border bg-card font-display shadow-neobrutalism-sm mt-2 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold">
                <Award className="text-primary h-4 w-4" />
                Puntuación: {Math.round(result.score * 100)}%
              </div>
            </div>

            <p className="text-muted-foreground mx-auto max-w-md font-sans text-sm leading-relaxed">
              {result.feedback}
            </p>

            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              {!result.isPassed ? (
                // Retry button if failed
                <Button
                  onClick={() => {
                    setResult(null);
                    setSelectedOption(null);
                    setCodeAnswer('');
                  }}
                  variant="neobrutalism"
                  className="cursor-pointer px-6"
                >
                  Volver a intentar
                </Button>
              ) : (
                // Next or Finish buttons if passed
                currentIndex < exerciseIds.length - 1 ? (
                  <Button
                    onClick={handleNextExercise}
                    variant="neobrutalism"
                    className="cursor-pointer px-6 flex items-center gap-2"
                  >
                    Siguiente Ejercicio
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="neobrutalismOutline" className="cursor-pointer">
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Ir al Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="neobrutalism" className="cursor-pointer">
                      <Link href={curriculumId ? `/curriculum/${curriculumId}` : '/curriculum'} className="flex items-center gap-2">
                        Continuar Aprendiendo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
          <Background />
          <Navbar />
          <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground font-display text-sm font-bold">
            Cargando práctica...
          </p>
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}

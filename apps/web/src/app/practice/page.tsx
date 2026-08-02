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
import {
  Award,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Code,
  Lightbulb,
  Loader,
} from 'lucide-react';
import { apiFetch } from '@/config/api-client';

// ---------------------------------------------------------
// LIVE AI TUTOR FLOW (NEW)
// ---------------------------------------------------------
interface LiveQuestion {
  question: string;
  type: 'quiz' | 'code';
  options: { text: string }[];
  concept: string;
  hints: string[];
}

function LivePracticeContent({
  sublevelId,
  curriculumId,
  sublevelKey,
}: {
  sublevelId: string;
  curriculumId: string;
  sublevelKey: string;
}) {
  const router = useRouter();

  const [user] = useState<{ email: string; userId: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('learning_os_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState<LiveQuestion | null>(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Track answer results for all 30 questions
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(30).fill(null));
  const [correctCount, setCorrectCount] = useState(0);

  // Hints
  const [revealedHintsCount, setRevealedHintsCount] = useState(0);

  // Feedback results
  const [submitting, setSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{
    isCorrect: boolean;
    feedback: string;
  } | null>(null);

  const [finalResult, setFinalResult] = useState<{
    score: number;
    isPassed: boolean;
    status: string;
  } | null>(null);

  // 1. Start session
  useEffect(() => {
    if (!user || !sublevelId) return;

    async function initSession() {
      setLoading(true);
      try {
        const data = await apiFetch<{ sessionId: string; currentIndex: number }>(
          '/practice/start',
          {
            method: 'POST',
            body: JSON.stringify({ sublevelId }),
          },
        );
        setSessionId(data.sessionId);
        setCurrentIndex(data.currentIndex - 1); // 0-indexed in frontend
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'Error al iniciar la sesión de tutoría.');
      }
    }
    void initSession();
  }, [user, sublevelId]);

  // 2. Fetch question when index changes
  useEffect(() => {
    if (!sessionId || !user) return;

    async function loadQuestion() {
      setLoading(true);
      setError(null);
      setFeedbackResult(null);
      setSelectedOption(null);
      setCodeAnswer('');
      setRevealedHintsCount(0);
      try {
        const data = await apiFetch<LiveQuestion>(`/practice/session/${sessionId}/next`);
        setQuestion(data);
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'Error al cargar la siguiente pregunta.');
      } finally {
        setLoading(false);
      }
    }
    void loadQuestion();
  }, [sessionId, currentIndex, user]);

  const handleSubmit = async () => {
    if (!sessionId || !question) return;

    const answer =
      question.type === 'quiz'
        ? selectedOption !== null && question.options[selectedOption]
          ? question.options[selectedOption].text
          : ''
        : codeAnswer;

    if (!answer.trim() && question.type === 'code') return;
    if (selectedOption === null && question.type === 'quiz') return;

    setSubmitting(true);
    try {
      const res = await apiFetch<{ isCorrect: boolean; feedback: string }>(
        `/practice/session/${sessionId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answer }),
        },
      );

      // Update local answers track (ONLY if it was the first attempt at this index)
      const updatedAnswers = [...answers];
      if (updatedAnswers[currentIndex] === null) {
        updatedAnswers[currentIndex] = res.isCorrect ? 'correct' : 'incorrect';
        setAnswers(updatedAnswers);

        if (res.isCorrect) {
          setCorrectCount((prev) => prev + 1);
        }
      }

      setFeedbackResult(res);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < 29) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 30th question finished: complete session
      setLoading(true);
      try {
        const res = await apiFetch<{ status: string; score: number; isPassed: boolean }>(
          `/practice/session/${sessionId}/complete`,
          {
            method: 'POST',
            body: JSON.stringify({
              correctAnswersCount: correctCount,
              totalQuestions: 30,
            }),
          },
        );

        // Save progress to LocalStorage if passed to mark curriculum completed
        if (res.isPassed && sublevelKey && user) {
          const progressKey = `roadmap_progress_${user.userId}_${curriculumId}`;
          const stored = localStorage.getItem(progressKey);
          const currentCompleted = stored ? JSON.parse(stored) : [];
          if (!currentCompleted.includes(sublevelKey)) {
            const updated = [...currentCompleted, sublevelKey];
            localStorage.setItem(progressKey, JSON.stringify(updated));
          }
        }

        setFinalResult(res);
      } catch (err) {
        console.error('Failed to complete session:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <Loader className="text-primary mb-4 h-10 w-10 animate-spin" />
        <p className="text-muted-foreground font-display animate-pulse text-sm font-bold">
          El Tutor de IA está analizando tu progreso...
        </p>
      </div>
    );
  }

  if (error || (!question && !finalResult)) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 pt-24">
        <Background />
        <Navbar />
        <Card className="border-primary bg-coral-red/5 w-full max-w-md space-y-4 border-2 p-8 text-center">
          <h3 className="font-display text-lg font-bold">Error del Tutor</h3>
          <p className="text-muted-foreground text-sm">
            {error || 'No pudimos conectar con el tutor de inteligencia artificial.'}
          </p>
          <Button asChild variant="neobrutalism" className="px-6">
            <button onClick={() => router.back()} className="cursor-pointer">
              Volver atrás
            </button>
          </Button>
        </Card>
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 pt-24">
        <Background />
        <Navbar />
        <Card
          className={`border-border shadow-neobrutalism w-full max-w-xl space-y-6 border-2 p-8 text-center transition-all ${
            finalResult.isPassed ? 'bg-green-500/5' : 'bg-primary/5'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            {finalResult.isPassed ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-100 text-green-500 dark:bg-green-900/30">
                <CheckCircle className="h-10 w-10" />
              </div>
            ) : (
              <div className="bg-primary/10 border-primary text-primary flex h-16 w-16 items-center justify-center rounded-full border-2">
                <XCircle className="h-10 w-10" />
              </div>
            )}

            <h2 className="font-display text-2xl font-bold tracking-wide">
              {finalResult.isPassed ? '¡Práctica Aprobada con Éxito!' : 'Práctica no Aprobada'}
            </h2>

            <div className="border-border bg-card font-display shadow-neobrutalism-sm mt-2 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold">
              <Award className="text-primary h-4 w-4" />
              Puntuación final: {Math.round(finalResult.score * 100)}% ({correctCount}/30 correctas)
            </div>
          </div>

          <p className="text-muted-foreground mx-auto max-w-md font-sans text-sm leading-relaxed">
            {finalResult.isPassed
              ? '¡Excelente trabajo! Has demostrado dominio de los conceptos y tu retención en la curva del olvido ha sido actualizada.'
              : 'Necesitas responder correctamente al menos el 80% (24 preguntas) para aprobar. Te recomendamos repasar la teoría y volver a intentarlo.'}
          </p>

          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Button asChild variant="neobrutalismOutline" className="cursor-pointer">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Ir al Dashboard
              </Link>
            </Button>
            <Button asChild variant="neobrutalism" className="cursor-pointer">
              <Link
                href={curriculumId ? `/curriculum/${curriculumId}` : '/curriculum'}
                className="flex items-center gap-2"
              >
                Volver al Curso
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isCurrentQuiz = question!.type === 'quiz';
  const hasFeedback = Boolean(feedbackResult);

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-2xl flex-1 space-y-6 px-6">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-primary mb-2 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atrás
        </button>

        {/* 30 Segment Progress Tracker (ELI5 live practice) */}
        <div className="bg-card border-border shadow-neobrutalism space-y-2 rounded-xl border-2 p-4">
          <div className="text-muted-foreground flex justify-between text-xs font-bold tracking-wide uppercase">
            <span>Sesión de Práctica • Pregunta {currentIndex + 1} de 30</span>
            <span>{Math.round((currentIndex / 30) * 100)}%</span>
          </div>
          {/* Segments grid */}
          <div className="flex justify-between gap-1">
            {answers.map((ans, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-sm border transition-all duration-300 ${
                  idx === currentIndex
                    ? 'scale-y-110 animate-pulse border-yellow-500 bg-yellow-400 shadow-sm'
                    : ans === 'correct'
                      ? 'border-green-600 bg-green-500'
                      : ans === 'incorrect'
                        ? 'border-red-600 bg-red-500'
                        : 'bg-muted border-border/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Panel */}
        <Card className="border-border bg-card shadow-neobrutalism-sm space-y-3 border-2 p-6">
          <div className="text-primary flex items-center justify-between gap-2 text-xs font-semibold tracking-wide uppercase">
            <span className="flex items-center gap-1">
              {isCurrentQuiz ? <HelpCircle className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              Tutor de IA • concepto: {question!.concept}
            </span>
            {currentIndex >= 25 && (
              <span className="shadow-neobrutalism-xs animate-bounce rounded-full border border-black bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                Nivel Experto
              </span>
            )}
          </div>
          <h1 className="font-display text-xl font-bold tracking-wide">
            Pregunta {currentIndex + 1}
          </h1>
          <p className="text-foreground/85 font-sans text-sm leading-relaxed whitespace-pre-line">
            {question!.question}
          </p>
        </Card>

        {/* Answer Selection Workspace */}
        {!hasFeedback ? (
          <Card className="border-border bg-card shadow-neobrutalism space-y-6 border-2 p-6">
            {isCurrentQuiz ? (
              <div className="space-y-3">
                {question!.options.map((opt, index) => (
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
                  onClick={handleSubmit}
                  disabled={selectedOption === null || submitting}
                  variant="neobrutalism"
                  className="mt-4 w-full cursor-pointer py-6"
                >
                  {submitting ? 'Evaluando respuesta...' : 'Enviar Respuesta'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="// Escribe tu código o explicación de respuesta aquí...&#10;// Sé claro y conciso para que el Tutor evalúe tu solución."
                  rows={8}
                  className="bg-background border-border focus:ring-primary focus:border-border text-foreground w-full rounded-xl border-2 p-4 font-mono text-xs transition-all focus:ring-2 focus:outline-none"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!codeAnswer.trim() || submitting}
                  variant="neobrutalism"
                  className="w-full cursor-pointer py-6"
                >
                  {submitting ? 'Evaluando código...' : 'Enviar Código'}
                </Button>
              </div>
            )}

            {/* Live Hints */}
            {Array.isArray(question!.hints) && question!.hints.length > 0 && (
              <div className="border-border/10 space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-muted-foreground flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                    Pistas del Tutor
                  </h3>
                  {revealedHintsCount < question!.hints.length && (
                    <button
                      onClick={() => setRevealedHintsCount((prev) => prev + 1)}
                      className="text-primary flex cursor-pointer items-center gap-1 border-0 bg-transparent text-xs font-bold hover:underline"
                    >
                      Pedir Pista ({revealedHintsCount}/{question!.hints.length})
                    </button>
                  )}
                </div>
                {revealedHintsCount > 0 && (
                  <div className="mt-2 space-y-2">
                    {question!.hints.slice(0, revealedHintsCount).map((hint, i) => (
                      <div
                        key={i}
                        className="bg-muted border-border/10 text-foreground/80 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium"
                      >
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
          /* Live Feedback card */
          <Card
            className={`border-border shadow-neobrutalism space-y-6 border-2 p-8 text-center transition-all ${
              feedbackResult!.isCorrect ? 'bg-green-500/5' : 'bg-primary/5'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              {feedbackResult!.isCorrect ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 bg-green-100 text-green-500 dark:bg-green-900/30">
                  <CheckCircle className="h-6 w-6" />
                </div>
              ) : (
                <div className="bg-primary/10 border-primary text-primary flex h-12 w-12 items-center justify-center rounded-full border-2">
                  <XCircle className="h-6 w-6" />
                </div>
              )}

              <h2 className="font-display text-lg font-bold tracking-wide">
                {feedbackResult!.isCorrect ? '¡Respuesta Correcta!' : 'Incorrecto'}
              </h2>
            </div>

            <p className="text-muted-foreground mx-auto max-w-md text-left font-sans text-sm leading-relaxed">
              {feedbackResult!.feedback}
            </p>

            <div className="flex justify-center pt-2">
              {feedbackResult!.isCorrect ? (
                <Button
                  onClick={handleNext}
                  variant="neobrutalism"
                  className="flex cursor-pointer items-center gap-2 px-8"
                >
                  {currentIndex < 29 ? 'Siguiente Pregunta' : 'Finalizar Práctica'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setFeedbackResult(null);
                    setSelectedOption(null);
                    setCodeAnswer('');
                  }}
                  variant="neobrutalism"
                  className="cursor-pointer px-8"
                >
                  Volver a intentar
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------
// LEGACY STATIC EXERCISE FLOW (FALLBACK)
// ---------------------------------------------------------
function LegacyPracticeContent({
  exerciseIdsParam,
  exerciseIdParam,
  curriculumId,
  sublevelKey,
}: {
  exerciseIdsParam: string | null;
  exerciseIdParam: string | null;
  curriculumId: string | null;
  sublevelKey: string | null;
}) {
  const router = useRouter();

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

  const [hints, setHints] = useState<string[]>([]);
  const [revealedHintsCount, setRevealedHintsCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    isPassed: boolean;
    feedback: string;
  } | null>(null);

  const [parsedPrompt, setParsedPrompt] = useState<string>('');
  const [dynamicOptions, setDynamicOptions] = useState<
    { text: string; isCorrect: boolean; feedback?: string }[]
  >([]);

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
        {
          text: 'Opción correcta para este tema.',
          isCorrect: true,
          feedback: '¡Excelente! Respuesta correcta.',
        },
        {
          text: 'Una opción alternativa incorrecta.',
          isCorrect: false,
          feedback: 'Incorrecto. Revisa de nuevo.',
        },
        {
          text: 'Otra opción incorrecta para distracción.',
          isCorrect: false,
          feedback: 'Incorrecto. Inténtalo de nuevo.',
        },
        { text: 'Ninguna de las anteriores.', isCorrect: false, feedback: 'Incorrecto.' },
      ]);
    }
  }, [exercise]);

  const handleQuizSubmit = async () => {
    if (selectedOption === null) return;
    setSubmitting(true);

    const option = dynamicOptions[selectedOption];
    const isPassed = option ? option.isCorrect : false;
    const score = isPassed ? 1.0 : 0.0;
    const feedback = option?.feedback
      ? option.feedback
      : isPassed
        ? '¡Excelente! Has seleccionado la respuesta correcta.'
        : 'Inténtalo de nuevo. Revisa el material de estudio y vuelve a intentarlo.';

    try {
      await submitEvaluation({
        exerciseId: exercise!.id,
        studentId: user!.userId,
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
          const progressKey = `roadmap_progress_${user!.userId}_${curriculumId}`;
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
        exerciseId: exercise!.id,
        studentId: user!.userId,
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
          const progressKey = `roadmap_progress_${user!.userId}_${curriculumId}`;
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

  if (loading || !user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
        <Background />
        <Navbar />
        <Loader className="text-primary mb-4 h-10 w-10 animate-spin" />
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

  const percentCompleted =
    exerciseIds.length > 0 ? Math.round((currentIndex / exerciseIds.length) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col pt-24 pb-16">
      <Background />
      <Navbar />

      <main className="z-10 mx-auto w-full max-w-2xl flex-1 space-y-6 px-6">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-primary mb-2 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atrás
        </button>

        {exerciseIds.length > 1 && (
          <div className="bg-card border-border shadow-neobrutalism-sm space-y-1 rounded-xl border-2 p-4">
            <div className="text-muted-foreground flex justify-between text-xs font-bold tracking-wide uppercase">
              <span>
                Ejercicio {currentIndex + 1} de {exerciseIds.length}
              </span>
              <span>{percentCompleted}%</span>
            </div>
            <div className="bg-muted border-border/10 h-2 w-full overflow-hidden rounded-full border">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>
        )}

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

            {hints.length > 0 && (
              <div className="border-border/10 space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-muted-foreground flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                    Ayuda de la IA
                  </h3>
                  {revealedHintsCount < 3 && (
                    <button
                      onClick={() => setRevealedHintsCount((prev) => prev + 1)}
                      className="text-primary flex cursor-pointer items-center gap-1 border-0 bg-transparent text-xs font-bold hover:underline"
                    >
                      Solicitar Pista ({revealedHintsCount}/3)
                    </button>
                  )}
                </div>
                {revealedHintsCount > 0 && (
                  <div className="mt-2 space-y-2">
                    {hints.slice(0, revealedHintsCount).map((hint, i) => (
                      <div
                        key={i}
                        className="bg-muted border-border/10 text-foreground/80 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium"
                      >
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
                  ? currentIndex < exerciseIds.length - 1
                    ? '¡Correcto!'
                    : '¡Práctica Completada!'
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
              ) : currentIndex < exerciseIds.length - 1 ? (
                <Button
                  onClick={handleNextExercise}
                  variant="neobrutalism"
                  className="flex cursor-pointer items-center gap-2 px-6"
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
                    <Link
                      href={curriculumId ? `/curriculum/${curriculumId}` : '/curriculum'}
                      className="flex items-center gap-2"
                    >
                      Continuar Aprendiendo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------
// MAIN CONTROLLER
// ---------------------------------------------------------
export default function PracticePage() {
  const searchParams = useSearchParams();
  const sublevelId = searchParams.get('sublevelId');
  const curriculumId = searchParams.get('curriculumId');
  const sublevelKey = searchParams.get('sublevelKey');

  // Legacy fallback params
  const exerciseIdParam = searchParams.get('exerciseId');
  const exerciseIdsParam = searchParams.get('exerciseIds');

  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen flex-col items-center justify-center pt-24">
          <Background />
          <Navbar />
          <Loader className="text-primary mb-4 h-10 w-10 animate-spin" />
          <p className="text-muted-foreground font-display text-sm font-bold">
            Cargando práctica...
          </p>
        </div>
      }
    >
      {sublevelId && curriculumId && sublevelKey ? (
        <LivePracticeContent
          sublevelId={sublevelId}
          curriculumId={curriculumId}
          sublevelKey={sublevelKey}
        />
      ) : (
        <LegacyPracticeContent
          exerciseIdParam={exerciseIdParam}
          exerciseIdsParam={exerciseIdsParam}
          curriculumId={curriculumId}
          sublevelKey={sublevelKey}
        />
      )}
    </Suspense>
  );
}

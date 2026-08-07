'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSettings, saveSetting, type SystemSetting } from '@/config/settings-service';
import { Background } from '@/components/Background';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/Card';
import { Button } from '@learning-os/ui/button';
import { Shield, Save, Key, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('learning_os_user');
      const currentUser = stored ? JSON.parse(stored) : null;
      return currentUser?.role === 'admin';
    }
    return false;
  });
  const [, setSettings] = useState<readonly SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [geminiKey, setGeminiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [codexKey, setCodexKey] = useState('');

  // Authentication check
  useEffect(() => {
    if (!authorized) {
      router.push('/dashboard');
    }
  }, [authorized, router]);

  // Fetch settings on mount (only if authorized)
  useEffect(() => {
    if (!authorized) return;

    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettings(data);

        // Bind existing settings to input fields
        const gemini = data.find((s) => s.key === 'gemini_api_key');
        if (gemini) setGeminiKey(gemini.value);

        const deepseek = data.find((s) => s.key === 'deepseek_api_key');
        if (deepseek) setDeepseekKey(deepseek.value);

        const codex = data.find((s) => s.key === 'codex_api_key');
        if (codex) setCodexKey(codex.value);
      } catch (err) {
        const errorVal = err as Error;
        setError(errorVal.message || 'Error al cargar las llaves de configuración.');
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, [authorized]);

  const handleSave = async (key: string, value: string) => {
    if (!value.trim()) return;

    // Check if the value is obfuscated (meaning it contains '...' and wasn't edited)
    if (value.includes('...')) {
      setSuccessMessage('La llave ya se encuentra configurada y no sufrió cambios.');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const res = await saveSetting(key, value);

      // Update state with obfuscated returned value
      if (key === 'gemini_api_key') setGeminiKey(res.value);
      if (key === 'deepseek_api_key') setDeepseekKey(res.value);
      if (key === 'codex_api_key') setCodexKey(res.value);

      setSuccessMessage(`Llave '${key}' guardada exitosamente.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const errorVal = err as Error;
      setError(errorVal.message || 'No se pudo guardar la configuración.');
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
            <Shield className="text-primary h-4 w-4" />
            Consola del Administrador
          </div>
          <h1 className="font-display text-4xl leading-none font-bold tracking-tight">
            Configuración de IA
          </h1>
          <p className="text-muted-foreground font-sans text-sm">
            Ingresa y gestiona de manera segura los tokens de acceso para los proveedores de
            Inteligencia Artificial.
          </p>
        </section>

        {/* Feedback Messages */}
        {successMessage && (
          <Card className="flex items-center gap-3 border-2 border-green-600 bg-green-50 p-4 text-sm font-medium text-green-900">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <span>{successMessage}</span>
          </Card>
        )}

        {error && (
          <Card className="border-primary bg-coral-red/5 flex items-center gap-3 border-2 p-4 text-sm font-medium">
            <AlertCircle className="text-primary h-5 w-5 shrink-0" />
            <span>{error}</span>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
            <p className="text-muted-foreground font-display text-sm font-bold">
              Cargando panel de llaves...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gemini API Key */}
            <Card className="bg-card border-border border-2 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-sage-pale flex h-8 w-8 items-center justify-center rounded-lg border border-black">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">Google Gemini API Key</h3>
                    <p className="text-muted-foreground text-xs">
                      Usada por defecto para la generación interactiva del catálogo de temas.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring w-full rounded-lg border-2 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                  />
                  <Button
                    onClick={() => handleSave('gemini_api_key', geminiKey)}
                    variant="neobrutalism"
                    className="flex shrink-0 items-center justify-center gap-1.5 px-4"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </div>
            </Card>

            {/* DeepSeek API Key */}
            <Card className="bg-card border-border border-2 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-sage-pale flex h-8 w-8 items-center justify-center rounded-lg border border-black">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">DeepSeek API Key</h3>
                    <p className="text-muted-foreground text-xs">
                      Llave de respaldo para resolución de quizzes y sugerencia remedial.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring w-full rounded-lg border-2 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                  />
                  <Button
                    onClick={() => handleSave('deepseek_api_key', deepseekKey)}
                    variant="neobrutalism"
                    className="flex shrink-0 items-center justify-center gap-1.5 px-4"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Codex API Key */}
            <Card className="bg-card border-border border-2 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-sage-pale flex h-8 w-8 items-center justify-center rounded-lg border border-black">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">OpenAI Codex / GPT-4 Key</h3>
                    <p className="text-muted-foreground text-xs">
                      Usada opcionalmente para validación avanzada de código y feedback de rubricas.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={codexKey}
                    onChange={(e) => setCodexKey(e.target.value)}
                    className="border-border bg-background shadow-neobrutalism-sm focus:ring-ring w-full rounded-lg border-2 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                  />
                  <Button
                    onClick={() => handleSave('codex_api_key', codexKey)}
                    variant="neobrutalism"
                    className="flex shrink-0 items-center justify-center gap-1.5 px-4"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Go back */}
            <div className="flex justify-start">
              <Button asChild variant="neobrutalismOutline" className="gap-1.5 px-4">
                <Link href="/curriculum">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Currículo
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

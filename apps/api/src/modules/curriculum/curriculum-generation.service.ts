import { BadRequestException, Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { GenerateSyllabusResponseDto } from './curriculum.dto';

@Injectable()
export class CurriculumGenerationService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSimilar(topic: string) {
    return this.prisma.curriculumItem.findMany({
      where: {
        title: {
          contains: topic,
          mode: 'insensitive',
        },
      },
    });
  }

  async generate(
    topic: string,
    provider = 'gemini',
    forceNew = false,
  ): Promise<GenerateSyllabusResponseDto> {
    // 1. Search for duplicates if not forced
    if (!forceNew) {
      const duplicates = await this.searchSimilar(topic);
      if (duplicates.length > 0) {
        return {
          status: 'duplicate_found',
          duplicates: duplicates.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            difficulty: item.difficulty,
            estimatedMins: item.estimatedMins,
          })),
        };
      }
    }

    // 2. Fetch API key from SystemSetting
    const keySetting = await this.prisma.systemSetting.findUnique({
      where: { key: `${provider}_api_key` },
    });

    const apiKey = keySetting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException(
        `No se configuró la clave API para el proveedor '${provider}'. Por favor configúrala en el Panel de Admin.`,
      );
    }

    // Prompt 1: Generate Roadmap only
    const prompt1 = `Genera un mapa de ruta educativo (roadmap) en español para el tema: "${topic}".
Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla con la siguiente estructura exacta. NO incluyas bloques de código markdown (\`\`\`json), marcas, textos de introducción ni de conclusión. Devuelve solo el objeto JSON crudo listo para ser parseado:
{
  "curriculumItem": {
    "title": "Título del tema",
    "description": "Una descripción breve del curso en una o dos líneas",
    "difficulty": "beginner",
    "estimatedMins": 45
  },
  "roadmap": [
    {
      "level": "Básico",
      "sublevels": [
        { "title": "1. Primer subtema básico", "description": "Breve descripción" },
        { "title": "2. Segundo subtema básico", "description": "Breve descripción" },
        { "title": "3. Tercer subtema básico", "description": "Breve descripción" },
        { "title": "4. Cuarto subtema básico", "description": "Breve descripción" },
        { "title": "5. Quinto subtema básico", "description": "Breve descripción" }
      ]
    },
    {
      "level": "Intermedio",
      "sublevels": [
        { "title": "1. Primer subtema intermedio", "description": "Breve descripción" },
        { "title": "2. Segundo subtema intermedio", "description": "Breve descripción" },
        { "title": "3. Tercer subtema intermedio", "description": "Breve descripción" },
        { "title": "4. Cuarto subtema intermedio", "description": "Breve descripción" },
        { "title": "5. Quinto subtema intermedio", "description": "Breve descripción" }
      ]
    },
    {
      "level": "Avanzado",
      "sublevels": [
        { "title": "1. Primer subtema avanzado", "description": "Breve descripción" },
        { "title": "2. Segundo subtema avanzado", "description": "Breve descripción" },
        { "title": "3. Tercer subtema avanzado", "description": "Breve descripción" },
        { "title": "4. Cuarto subtema avanzado", "description": "Breve descripción" },
        { "title": "5. Quinto subtema avanzado", "description": "Breve descripción" }
      ]
    },
    {
      "level": "Profesional",
      "sublevels": [
        { "title": "1. Primer subtema profesional", "description": "Breve descripción" },
        { "title": "2. Segundo subtema profesional", "description": "Breve descripción" },
        { "title": "3. Tercer subtema profesional", "description": "Breve descripción" },
        { "title": "4. Cuarto subtema profesional", "description": "Breve descripción" },
        { "title": "5. Quinto subtema profesional", "description": "Breve descripción" }
      ]
    }
  ]
}

REGLAS DE GENERACIÓN CRÍTICAS:
1. El temario DEBE estar sumamente desmenuzado. Genera EXACTAMENTE 5 subtemas independientes para cada uno de los 4 niveles (Básico, Intermedio, Avanzado, Profesional), sumando un total de exactamente 20 subtemas en la ruta.
2. Devuelve únicamente el objeto JSON. Sin formato Markdown, sin texto introductorio.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt1 }] }],
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error de Gemini API: ${response.status} - ${errText}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resData = (await response.json()) as any;
      let text = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      text = text.trim();
      if (text.startsWith('```')) {
        const firstLineBreak = text.indexOf('\n');
        const lastCodeBlock = text.lastIndexOf('```');
        if (firstLineBreak !== -1 && lastCodeBlock !== -1) {
          text = text.substring(firstLineBreak + 1, lastCodeBlock).trim();
        }
      }

      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        text = text.substring(startIdx, endIdx + 1);
      }

      const data = JSON.parse(text);

      // Create unique slug
      const slug =
        topic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'topic';
      const timestamp = Date.now();
      const uniqueId = `${slug}-${timestamp}`;

      const generatedId = `curr-${uniqueId}`;
      const contentId = `cont-${uniqueId}`;
      const requestId = `req-${uniqueId}`;

      // Format initial empty roadmap comment with subtopicId
      let subIndex = 1;
      const initialRoadmap = data.roadmap.map((lvl: any) => ({
        level: lvl.level,
        sublevels: lvl.sublevels.map((sub: any) => {
          const subId = `sub-${uniqueId}-${subIndex++}`;
          sub.subtopicId = subId;
          return {
            subtopicId: subId,
            title: sub.title,
            description: sub.description,
            exerciseIds: [],
          };
        }),
      }));

      const initialBody = `<!-- ROADMAP_START -->${JSON.stringify(initialRoadmap)}<!-- ROADMAP_END -->\n\n# ${data.curriculumItem.title}\n\nGenerando lecciones en segundo plano...`;

      // 4. Save to Database in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.curriculumItem.create({
          data: {
            id: generatedId,
            title: data.curriculumItem.title,
            description: data.curriculumItem.description,
            difficulty: data.curriculumItem.difficulty || 'beginner',
            estimatedMins: data.curriculumItem.estimatedMins || 45,
          },
        });

        await tx.contentBlock.create({
          data: {
            id: contentId,
            title: 'Teoría de ' + data.curriculumItem.title,
            contentType: 'text/markdown',
            body: initialBody,
            version: '1.0.0',
          },
        });

        await tx.generationRequest.create({
          data: {
            id: requestId,
            curriculumItemId: generatedId,
            contentId: contentId,
            requestType: 'syllabus_generation',
            status: 'generating_sublevels',
            priority: 'high',
          },
        });
      });

      // 5. Kick off background generator for sublevels (unblocking the HTTP response)
      void this.generateSublevelsBackground(
        generatedId,
        contentId,
        requestId,
        data.roadmap,
        apiKey,
        uniqueId,
        data.curriculumItem.title,
      );

      return {
        id: generatedId,
        status: 'success',
      };
    } catch (error) {
      const err = error as Error;
      return {
        message: `Fallo en la generación con IA: ${err.message}`,
        status: 'error',
      };
    }
  }

  async getGenerationStatus(id: string) {
    const request = await this.prisma.generationRequest.findFirst({
      where: { curriculumItemId: id },
      include: { artifact: true },
    });

    if (!request) {
      return { status: 'completed', completed: 100, total: 100, percent: 100 };
    }

    if (request.status === 'completed') {
      return { status: 'completed', completed: 100, total: 100, percent: 100 };
    }

    // Mark as failed if generation was interrupted/stopped
    if (request.status === 'generating_sublevels' || request.status === 'failed') {
      await this.prisma.generationRequest.update({
        where: { id: request.id },
        data: { status: 'failed' },
      });
      request.status = 'failed';
    }

    if (request.artifact) {
      try {
        const progress = JSON.parse(request.artifact.contentPayload);
        const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        return {
          status: request.status,
          completed: progress.completed,
          total: progress.total,
          percent: percent,
          sublevels: progress.sublevels,
        };
      } catch (e) {
        console.error('Failed to parse progress status payload:', e);
      }
    }

    return {
      status: request.status,
      completed: 0,
      total: 20,
      percent: 0,
    };
  }

  async resume(id: string) {
    const request = await this.prisma.generationRequest.findFirst({
      where: { curriculumItemId: id },
      include: { artifact: true },
    });

    if (!request) {
      throw new BadRequestException('No se encontró ninguna solicitud de generación para este tema.');
    }

    if (request.status === 'completed') {
      return { status: 'completed', message: 'La generación ya se completó con éxito.' };
    }

    // Set request status back to generating_sublevels
    await this.prisma.generationRequest.update({
      where: { id: request.id },
      data: {
        status: 'generating_sublevels',
        updatedAt: new Date(),
      },
    });

    // Reset failed/processing status keys to pending in progress payload
    if (request.artifact) {
      try {
        const progress = JSON.parse(request.artifact.contentPayload);
        progress.status = 'generating';
        Object.keys(progress.sublevels || {}).forEach((k) => {
          if (progress.sublevels[k] !== 'completed') {
            progress.sublevels[k] = 'pending';
          }
        });
        await this.prisma.generationArtifact.update({
          where: { requestId: request.id },
          data: { contentPayload: JSON.stringify(progress) },
        });
      } catch (e) {
        console.error('Failed to update progress status on resume:', e);
      }
    }

    // Fetch API key
    const keySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'gemini_api_key' },
    });
    const apiKey = keySetting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('Clave API no disponible.');
    }

    const contentBlock = await this.prisma.contentBlock.findUnique({
      where: { id: request.contentId || '' },
    });

    if (!contentBlock) {
      throw new BadRequestException('No se encontró el bloque de contenido.');
    }

    const match = contentBlock.body.match(/<!-- ROADMAP_START -->([\s\S]*?)<!-- ROADMAP_END -->/);
    if (!match || !match[1]) {
      throw new BadRequestException('No se encontró el mapa de ruta en el bloque de contenido.');
    }

    const roadmap = JSON.parse(match[1]);
    const uniqueId = id.replace(/^curr-/, '');

    const item = await this.prisma.curriculumItem.findUnique({ where: { id } });
    const courseTitle = item?.title || 'Tema';

    // Spawn background task again
    void this.generateSublevelsBackground(
      id,
      request.contentId || '',
      request.id,
      roadmap,
      apiKey,
      uniqueId,
      courseTitle,
    );

    return { status: 'success', message: 'Reanudando la generación en segundo plano.' };
  }

  private async generateSublevelsBackground(
    _curriculumId: string,
    contentId: string,
    requestId: string,
    roadmap: any[],
    apiKey: string,
    uniqueId: string,
    courseTitle: string,
  ): Promise<void> {
    try {
      let progress = {
        total: 0,
        completed: 0,
        status: 'generating',
        sublevels: {} as Record<string, string>,
      };

      const existingArtifact = await this.prisma.generationArtifact.findUnique({
        where: { requestId },
      });

      if (existingArtifact) {
        try {
          progress = JSON.parse(existingArtifact.contentPayload);
          progress.status = 'generating';
          // Ensure totals are counted correctly
          progress.total = 0;
          roadmap.forEach((lvl: any) => {
            lvl.sublevels.forEach((sub: any) => {
              const key = `${lvl.level}_${sub.title}`;
              if (!progress.sublevels[key]) {
                progress.sublevels[key] = 'pending';
              }
              progress.total++;
            });
          });
        } catch (e) {
          // Fallback to fresh progress
        }
      } else {
        roadmap.forEach((lvl: any) => {
          lvl.sublevels.forEach((sub: any) => {
            const key = `${lvl.level}_${sub.title}`;
            progress.sublevels[key] = 'pending';
            progress.total++;
          });
        });

        await this.prisma.generationArtifact.create({
          data: {
            id: `art-${requestId}`,
            requestId: requestId,
            artifactType: 'progress_status',
            contentPayload: JSON.stringify(progress),
          },
        });
      }

      let exerciseGlobalCounter = 0;

      for (const lvl of roadmap) {
        for (const sub of lvl.sublevels) {
          const key = `${lvl.level}_${sub.title}`;

          // Skip if already generated successfully
          if (progress.sublevels[key] === 'completed') {
            continue;
          }

          // Update state to processing
          progress.sublevels[key] = 'processing';
          await this.prisma.generationArtifact.update({
            where: { requestId: requestId },
            data: { contentPayload: JSON.stringify(progress) },
          });

          let retries = 3;
          let success = false;

          while (retries > 0 && !success) {
            try {
              const prompt2 = `Estás redactando la lección teórica detallada y el banco de preguntas para el subtema: "${sub.title}" (del nivel ${lvl.level}) del curso "${courseTitle}".

Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla con la siguiente estructura exacta. NO incluyas bloques de código markdown (\`\`\`json), marcas, textos de introducción ni de conclusión. Devuelve solo el objeto JSON crudo listo para ser parseado:
{
  "theoryMarkdown": "## ${sub.title}\\n\\n## 1. ¿Qué es?\\n[Explicación conceptual completa y clara]\\n\\n## 2. ¿Para qué sirve?\\n[Casos prácticos de aplicación]\\n\\n## 3. ¿Cómo funciona?\\n[Explicación paso a paso de su funcionamiento]\\n\\n## 4. Conceptos fundamentales\\n[Explicación de conceptos clave individuales del subtema]\\n\\n## 5. Sintaxis o estructura\\n[Ejemplos y detalles de la sintaxis del lenguaje, si aplica, sino explicar estructura conceptual]\\n\\n## 6. Ejemplo básico\\n[Ejemplo de código o procedimiento con explicación y salida de consola esperada]\\n\\n## 7. Ejemplo intermedio\\n[Ejemplo práctico de nivel medio con explicación]\\n\\n## 8. Ejemplo avanzado\\n[Ejemplo práctico complejo y realista con explicación]\\n\\n## 9. Errores comunes\\n[Menciona y explica detalladamente al menos 3 errores frecuentes]\\n\\n## 10. Buenas prácticas\\n[Lista de recomendaciones prácticas recomendadas]\\n\\n## 11. Resumen\\n[Breve resumen de ideas clave]",
  "exercises": [
    {
      "title": "Quiz - ${sub.title} (Fácil)",
      "exerciseType": "quiz",
      "difficulty": "easy",
      "quizData": {
        "question": "¿Pregunta de opción múltiple fácil sobre el subtema ${sub.title}?",
        "options": [
          { "text": "Opción incorrecta 1", "isCorrect": false, "feedback": "Explicación de error." },
          { "text": "Opción correcta", "isCorrect": true, "feedback": "¡Excelente!" },
          { "text": "Opción incorrecta 2", "isCorrect": false, "feedback": "Explicación." },
          { "text": "Opción incorrecta 3", "isCorrect": false, "feedback": "Explicación." }
        ]
      },
      "hints": [
        "Pista 1: Concepto inicial.",
        "Pista 2: Pista técnica con detalles.",
        "Pista 3: Ayuda avanzada para resolver."
      ]
    },
    {
      "title": "Quiz - ${sub.title} (Medio)",
      "exerciseType": "quiz",
      "difficulty": "medium",
      "quizData": {
        "question": "¿Pregunta intermedia sobre el subtema ${sub.title}?",
        "options": [
          { "text": "Opción incorrecta 1", "isCorrect": false, "feedback": "Explicación." },
          { "text": "Opción correcta", "isCorrect": true, "feedback": "¡Excelente!" },
          { "text": "Opción incorrecta 2", "isCorrect": false, "feedback": "Explicación." },
          { "text": "Opción incorrecta 3", "isCorrect": false, "feedback": "Explicación." }
        ]
      },
      "hints": [
        "Pista 1: Ayuda intermedia.",
        "Pista 2: Pista lógica.",
        "Pista 3: Ayuda de código."
      ]
    },
    {
      "title": "Quiz - ${sub.title} (Difícil)",
      "exerciseType": "quiz",
      "difficulty": "hard",
      "quizData": {
        "question": "¿Escenario complejo o pregunta avanzada sobre ${sub.title}?",
        "options": [
          { "text": "Opción incorrecta 1", "isCorrect": false, "feedback": "Explicación." },
          { "text": "Opción correcta", "isCorrect": true, "feedback": "¡Excelente!" },
          { "text": "Opción incorrecta 2", "isCorrect": false, "feedback": "Explicación." },
          { "text": "Opción incorrecta 3", "isCorrect": false, "feedback": "Explicación." }
        ]
      },
      "hints": [
        "Pista 1: Pista avanzada.",
        "Pista 2: Pista de diseño.",
        "Pista 3: Ayuda algorítmica."
      ]
    }
  ]
}

REGLAS CRÍTICAS DE REDACCIÓN:
1. La teoríaMarkdown DEBE tener suficiente profundidad para enseñar el concepto en sus 11 secciones. No generes introducciones superficiales.
2. Cada sección numerada de 1 a 11 debe ser un encabezado '## [Número]. [Sección]' (ej: '## 1. ¿Qué es?') para mantener un formato uniforme. No cambies la estructura ni el orden de las secciones.`;

              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt2 }] }],
                  }),
                },
              );

              if (!response.ok) {
                const errText = await response.text();
                if (response.status === 429) {
                  console.warn(`Gemini API 429 Rate Limit hit. Pausing background task for 60 seconds...`);
                  await this.prisma.generationArtifact.update({
                    where: { requestId: requestId },
                    data: {
                      contentPayload: JSON.stringify({
                        ...progress,
                        status: 'waiting_quota',
                      }),
                    },
                  });
                  await new Promise((r) => setTimeout(r, 60000));
                  throw new Error(`Excedido límite de cuota (429). Reintentando tras pausa.`);
                }
                throw new Error(`Error de Gemini API: ${response.status} - ${errText}`);
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const resData = (await response.json()) as any;
              let text = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

              text = text.trim();
              if (text.startsWith('```')) {
                const firstLineBreak = text.indexOf('\n');
                const lastCodeBlock = text.lastIndexOf('```');
                if (firstLineBreak !== -1 && lastCodeBlock !== -1) {
                  text = text.substring(firstLineBreak + 1, lastCodeBlock).trim();
                }
              }

              const startIdx = text.indexOf('{');
              const endIdx = text.lastIndexOf('}');
              if (startIdx !== -1 && endIdx !== -1) {
                text = text.substring(startIdx, endIdx + 1);
              }

              const data = JSON.parse(text);

              // 1. Create exercises in Database
              const exerciseIds: string[] = [];
              if (Array.isArray(data.exercises)) {
                for (let i = 0; i < data.exercises.length; i++) {
                  const ex = data.exercises[i];
                  const exId = `ex-${uniqueId}-${exerciseGlobalCounter++}`;
                  exerciseIds.push(exId);

                  const exercisePrompt = JSON.stringify({
                    question: ex.quizData?.question || 'Pregunta de opción múltiple',
                    options: ex.quizData?.options || [],
                    hints: ex.hints || ['Pista básica', 'Pista intermedia', 'Pista avanzada'],
                  });

                  await this.prisma.exercise.create({
                    data: {
                      id: exId,
                      title: ex.title || 'Práctica',
                      prompt: exercisePrompt,
                      exerciseType: ex.exerciseType || 'quiz',
                      difficulty: ex.difficulty || 'easy',
                    },
                  });
                }
              }

              // 2. Append/Update in ContentBlock
              const contentBlock = await this.prisma.contentBlock.findUnique({
                where: { id: contentId },
              });

              if (contentBlock) {
                const match = contentBlock.body.match(
                  /<!-- ROADMAP_START -->([\s\S]*?)<!-- ROADMAP_END -->/,
                );
                let updatedBody = contentBlock.body;

                if (match && match[1]) {
                  const parsedRoadmap = JSON.parse(match[1]);
                  parsedRoadmap.forEach((l: any) => {
                    if (l.level === lvl.level) {
                      l.sublevels.forEach((s: any) => {
                        if (s.title === sub.title) {
                          s.exerciseIds = exerciseIds;
                        }
                      });
                    }
                  });
                  updatedBody = updatedBody.replace(match[1], JSON.stringify(parsedRoadmap));
                }

                // If body has initial placeholder, remove it
                updatedBody = updatedBody.replace('Generando lecciones en segundo plano...', '');

                // Append the generated sublevel theory text with explicit markers
                const subId = sub.subtopicId || `sub-${uniqueId}-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                const markedTheory = `\n\n<!-- LESSON_START: ${subId} -->\n${data.theoryMarkdown.trim()}\n<!-- LESSON_END: ${subId} -->`;
                updatedBody = updatedBody.trim() + markedTheory;

                await this.prisma.contentBlock.update({
                  where: { id: contentId },
                  data: { body: updatedBody },
                });
              }

              progress.sublevels[key] = 'completed';
              progress.completed++;
              success = true;
            } catch (e) {
              console.error(
                `Failed to generate sublevel "${sub.title}", retries left: ${retries - 1}`,
                e,
              );
              retries--;
              if (retries === 0) {
                progress.sublevels[key] = 'failed';
              }
              await new Promise((r) => setTimeout(r, 2000));
            }
          }

          // Update progress
          await this.prisma.generationArtifact.update({
            where: { requestId: requestId },
            data: { contentPayload: JSON.stringify(progress) },
          });

          // Wait 4s between calls to strictly respect Gemini rate limits (RPM)
          await new Promise((r) => setTimeout(r, 4000));
        }
      }

      // Mark GenerationRequest as completed or failed depending on subtheme errors
      const hasFailed = Object.values(progress.sublevels || {}).some((s) => s === 'failed');
      const finalStatus = hasFailed ? 'failed' : 'completed';

      progress.status = finalStatus;
      await this.prisma.generationRequest.update({
        where: { id: requestId },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
        },
      });

      await this.prisma.generationArtifact.update({
        where: { requestId: requestId },
        data: { contentPayload: JSON.stringify(progress) },
      });
    } catch (err) {
      console.error('Fatal error during background sublevels generation:', err);
      await this.prisma.generationRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          finishedAt: new Date(),
        },
      });
    }
  }
}

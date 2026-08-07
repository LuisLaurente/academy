import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type PrismaService } from '../../infrastructure/database/prisma.service';
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

  async getItemWithDetails(id: string) {
    const item = await this.prisma.curriculumItem.findUnique({
      where: { id },
      include: {
        levels: {
          orderBy: { orderIndex: 'asc' },
          include: {
            sublevels: {
              orderBy: { orderIndex: 'asc' },
              include: {
                contentBlock: true,
              },
            },
          },
        },
      },
    });
    return item;
  }

  async generate(
    topic: string,
    provider = 'gemini',
    forceNew = false,
  ): Promise<GenerateSyllabusResponseDto> {
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

    const keySetting = await this.prisma.systemSetting.findUnique({
      where: { key: `${provider}_api_key` },
    });

    const apiKey = keySetting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException(
        `No se configuró la clave API para el proveedor '${provider}'. Por favor configúrala en el Panel de Admin.`,
      );
    }

    const prompt1 = `Genera un mapa de ruta educativo (roadmap) en español para el tema: "${topic}".
Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla con la siguiente estructura exacta. NO incluyas bloques de código markdown (\`\`\`json), marcas, textos de introducción ni de conclusión. Devuelve solo el objeto JSON crudo listo para ser parseado:
{
  "curriculumItem": {
    "title": "Título del tema",
    "description": "Una descripción breve del curso en una o dos líneas",
    "difficulty": "beginner",
    "estimatedMins": 120
  },
  "roadmap": [
    {
      "level": "Nombre del Nivel/Módulo (ej. Conceptos Básicos, Sintaxis de Control, etc.)",
      "sublevels": [
        { "title": "Nombre del subtema 1", "description": "Breve descripción de lo que se aprenderá" },
        { "title": "Nombre del subtema 2", "description": "Breve descripción de lo que se aprenderá" }
      ]
    }
  ]
}

REGLAS DE GENERACIÓN CRÍTICAS:
1. El temario DEBE estar sumamente desmenuzado y estructurado de forma lógica para permitir un aprendizaje secuencial profundo.
2. No hay limitaciones en la cantidad de niveles ni en la cantidad de subniveles por nivel. Genera tantos como sean necesarios para desmenuzar bien el tema, pero procura que el contenido de cada subnivel sea específico y focalizado.
3. Devuelve únicamente el objeto JSON. Sin formato Markdown, sin texto introductorio.`;

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

      const slug =
        topic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'topic';
      const timestamp = Date.now();
      const uniqueId = `${slug}-${timestamp}`;
      const generatedId = `curr-${uniqueId}`;

      await this.prisma.$transaction(async (tx) => {
        await tx.curriculumItem.create({
          data: {
            id: generatedId,
            title: data.curriculumItem.title,
            description: data.curriculumItem.description,
            difficulty: data.curriculumItem.difficulty || 'beginner',
            estimatedMins: data.curriculumItem.estimatedMins || 120,
          },
        });

        for (let lIdx = 0; lIdx < data.roadmap.length; lIdx++) {
          const lvl = data.roadmap[lIdx];
          const levelId = `lvl-${uniqueId}-${lIdx}`;
          await tx.curriculumLevel.create({
            data: {
              id: levelId,
              curriculumItemId: generatedId,
              title: lvl.level,
              orderIndex: lIdx,
              status: 'not_generated',
            },
          });

          for (let sIdx = 0; sIdx < lvl.sublevels.length; sIdx++) {
            const sub = lvl.sublevels[sIdx];
            const sublevelId = `sub-${uniqueId}-${lIdx}-${sIdx}`;
            await tx.curriculumSublevel.create({
              data: {
                id: sublevelId,
                levelId: levelId,
                title: sub.title,
                description: sub.description,
                orderIndex: sIdx,
              },
            });
          }
        }
      });

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

  async generateLevel(courseId: string, levelId: string) {
    const level = await this.prisma.curriculumLevel.findUnique({
      where: { id: levelId },
      include: { sublevels: true },
    });

    if (!level) {
      throw new NotFoundException('Módulo/Nivel no encontrado.');
    }

    if (level.status === 'completed') {
      return { status: 'completed', message: 'El módulo ya está completamente generado.' };
    }

    // 1. Lock acquisition with orphan detection (timeout after 90 seconds)
    const now = new Date();
    const lockTimeout = new Date(now.getTime() - 90000);

    const affected = await this.prisma.curriculumLevel.updateMany({
      where: {
        id: levelId,
        OR: [{ status: { not: 'generating' } }, { prefetchingStartedAt: { lt: lockTimeout } }],
      },
      data: {
        status: 'generating',
        prefetchingStartedAt: now,
      },
    });

    if (affected.count === 0) {
      return { status: 'generating', message: 'El módulo ya se está generando en segundo plano.' };
    }

    const keySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'gemini_api_key' },
    });
    const apiKey = keySetting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Revert status
      await this.prisma.curriculumLevel.update({
        where: { id: levelId },
        data: { status: 'failed' },
      });
      throw new BadRequestException('Clave API de Gemini no configurada.');
    }

    const course = await this.prisma.curriculumItem.findUnique({ where: { id: courseId } });
    const courseTitle = course?.title || 'Tema';

    // 2. Spawn background task
    void this.generateLevelBackground(courseId, levelId, level.sublevels, apiKey, courseTitle);

    return {
      status: 'generating',
      message: 'Iniciando la generación del módulo en segundo plano.',
    };
  }

  private async generateLevelBackground(
    _courseId: string,
    levelId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sublevels: any[],
    apiKey: string,
    courseTitle: string,
  ): Promise<void> {
    try {
      for (const sub of sublevels) {
        let retries = 3;
        let success = false;

        const promptTheoryELI5 = `Estás redactando la lección teórica detallada para el subtema: "${sub.title}" del curso "${courseTitle}".

Usa un enfoque pedagógico ELI5 (Explícamelo como si tuviera 5 años). Sigue estrictamente estas pautas:
1. Tono y Redacción: Usa un tono muy cálido, entusiasta y sumamente claro. Evita lenguaje técnico árido sin antes definirlo con una analogía sencilla.
2. Analogías: Cada concepto clave debe tener una analogía con la vida real (ej: cajas con etiquetas para variables, recetas de cocina para algoritmos, etc.).
3. Diagramas Explicativos (Mermaid): Si el subtema involucra flujos lógicos, procesos secuenciales, arquitecturas de datos o relaciones (ej. flujo de datos, ciclo de vida, herencia, cliente-servidor), incluye obligatoriamente un diagrama visual claro y didáctico en formato Mermaid.js encerrado en un bloque de código \`\`\`mermaid dentro de la sección "3. ¿Cómo funciona paso a paso?". Asegúrate de que la sintaxis de Mermaid sea limpia y válida.
4. Estructura de Secciones: Divide la lección en las siguientes secciones numeradas del 1 al 6:
   ## 1. La Idea en Simple (¿Qué es?)
   [Explicación con una analogía divertida y directa]
   
   ## 2. ¿Para qué nos sirve en el mundo real?
   [Ejemplos prácticos y cotidianos de su utilidad]
   
   ## 3. ¿Cómo funciona paso a paso?
   [El proceso lógico explicado de forma visual y secuencial, incluyendo un diagrama Mermaid si el tema se beneficia de ello]
   
   ## 4. Los Bloques de Construcción (Conceptos clave)
   [Glosario de 3 o 4 términos explicados sencillamente]
   
   ## 5. Miremos un Código Súper Simple
   [Ejemplo de código muy corto y fácil, comentado línea por línea explicando el "por qué"]
   
   ## 6. Errores Comunes y Superpoderes (Buenas prácticas)
   [Menciona 2 errores que cometen los principiantes como si fueran tropiezos graciosos, y 2 buenas prácticas como superpoderes]

Devuelve únicamente el contenido formateado en Markdown, sin rodeos, listo para ser guardado.`;

        while (retries > 0 && !success) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptTheoryELI5 }] }],
                }),
              },
            );

            if (!response.ok) {
              const errText = await response.text();
              if (response.status === 429) {
                // Pause for 60 seconds on rate limit
                await new Promise((r) => setTimeout(r, 60000));
                throw new Error(`Excedido límite de cuota (429).`);
              }
              throw new Error(`Error de Gemini API: ${response.status} - ${errText}`);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resData = (await response.json()) as any;
            const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!text) throw new Error('Respuesta de IA vacía.');

            const contentBlockId = `cont-sub-${sub.id}`;

            // Create/overwrite ContentBlock for this subtopic
            await this.prisma.contentBlock.upsert({
              where: { id: contentBlockId },
              update: {
                title: 'Teoría de ' + sub.title,
                body: text,
                updatedAt: new Date(),
              },
              create: {
                id: contentBlockId,
                title: 'Teoría de ' + sub.title,
                contentType: 'text/markdown',
                body: text,
                version: '1.0.0',
              },
            });

            // Link sublevel to ContentBlock
            await this.prisma.curriculumSublevel.update({
              where: { id: sub.id },
              data: { contentBlockId },
            });

            success = true;
          } catch (e) {
            console.error(
              `Failed to generate sublevel theory "${sub.title}", retries left: ${retries - 1}`,
              e,
            );
            retries--;
            if (retries > 0) {
              await new Promise((r) => setTimeout(r, 4000));
            }
          }
        }

        if (!success) {
          throw new Error(
            `No se pudo generar la teoría para el subtema "${sub.title}" tras varios intentos.`,
          );
        }

        // Wait 4s between sublevel generations to respect rate limits
        await new Promise((r) => setTimeout(r, 4000));
      }

      // Mark level as completed
      await this.prisma.curriculumLevel.update({
        where: { id: levelId },
        data: { status: 'completed' },
      });
    } catch (err) {
      console.error('Fatal error during background level theory generation:', err);
      await this.prisma.curriculumLevel.update({
        where: { id: levelId },
        data: { status: 'failed' },
      });
    }
  }

  // Returns overall progress for course items, mapping to old frontend polling logic for compatibility
  async getGenerationStatus(id: string) {
    const item = await this.prisma.curriculumItem.findUnique({
      where: { id },
      include: {
        levels: {
          include: { sublevels: true },
        },
      },
    });

    if (!item) {
      return { status: 'completed', completed: 100, total: 100, percent: 100 };
    }

    let totalSublevels = 0;
    let completedSublevels = 0;
    let anyGenerating = false;
    const sublevelsProgress: Record<string, string> = {};

    item.levels.forEach((lvl) => {
      lvl.sublevels.forEach((sub) => {
        totalSublevels++;
        const key = `${lvl.title}_${sub.title}`;

        if (sub.contentBlockId) {
          completedSublevels++;
          sublevelsProgress[key] = 'completed';
        } else if (lvl.status === 'generating') {
          anyGenerating = true;
          sublevelsProgress[key] = 'processing';
        } else if (lvl.status === 'failed') {
          sublevelsProgress[key] = 'failed';
        } else {
          sublevelsProgress[key] = 'pending';
        }
      });
    });

    const percent =
      totalSublevels > 0 ? Math.round((completedSublevels / totalSublevels) * 100) : 100;
    const status = anyGenerating
      ? 'generating_sublevels'
      : percent === 100
        ? 'completed'
        : 'failed';

    return {
      status,
      completed: completedSublevels,
      total: totalSublevels,
      percent,
      sublevels: sublevelsProgress,
    };
  }

  // Compatibility resume endpoint: resumes failed levels in the curriculum item
  async resume(id: string) {
    const item = await this.prisma.curriculumItem.findUnique({
      where: { id },
      include: { levels: true },
    });

    if (!item) {
      throw new NotFoundException('Curso no encontrado.');
    }

    const failedLevels = item.levels.filter(
      (lvl) => lvl.status === 'failed' || lvl.status === 'not_generated',
    );
    if (failedLevels.length === 0) {
      return {
        status: 'completed',
        message: 'No hay módulos fallidos o pendientes de generación.',
      };
    }

    const keySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'gemini_api_key' },
    });
    const apiKey = keySetting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new BadRequestException('Clave API no disponible.');
    }

    for (const lvl of failedLevels) {
      await this.prisma.curriculumLevel.update({
        where: { id: lvl.id },
        data: { status: 'generating', prefetchingStartedAt: new Date() },
      });
      const fullLvl = await this.prisma.curriculumLevel.findUnique({
        where: { id: lvl.id },
        include: { sublevels: true },
      });
      if (fullLvl) {
        void this.generateLevelBackground(id, lvl.id, fullLvl.sublevels, apiKey, item.title);
      }
    }

    return { status: 'success', message: 'Reanudando la generación de los módulos fallidos.' };
  }

  async renameCurriculumItem(id: string, title: string) {
    const item = await this.prisma.curriculumItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Course not found');
    }
    return this.prisma.curriculumItem.update({
      where: { id },
      data: { title },
    });
  }

  async deleteCurriculumItem(id: string) {
    const item = await this.prisma.curriculumItem.findUnique({
      where: { id },
      include: {
        levels: {
          include: {
            sublevels: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Course not found');
    }

    const sublevelIds = item.levels.flatMap((lvl) => lvl.sublevels.map((sub) => sub.id));
    const contentBlockIds = item.levels
      .flatMap((lvl) => lvl.sublevels.map((sub) => sub.contentBlockId))
      .filter((cid): cid is string => !!cid);

    await this.prisma.$transaction(async (tx) => {
      // Clean up associated practice sessions and their AI logs
      if (sublevelIds.length > 0) {
        const sessions = await tx.practiceSession.findMany({
          where: { sublevelId: { in: sublevelIds } },
          select: { id: true },
        });
        const sessionIds = sessions.map((s) => s.id);

        if (sessionIds.length > 0) {
          await tx.aILog.deleteMany({
            where: { sessionId: { in: sessionIds } },
          });
        }

        await tx.practiceSession.deleteMany({
          where: { sublevelId: { in: sublevelIds } },
        });
      }

      // Delete the item (Prisma Cascade deletes levels and sublevels)
      await tx.curriculumItem.delete({
        where: { id },
      });

      // Clean up orphaned content blocks
      if (contentBlockIds.length > 0) {
        await tx.contentBlock.deleteMany({
          where: { id: { in: contentBlockIds } },
        });
      }
    });

    return { success: true };
  }
}

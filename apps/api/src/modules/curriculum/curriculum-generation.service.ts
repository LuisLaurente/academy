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

    // 3. Call Gemini
    const prompt = `Genera un temario educativo completo y detallado en español para el tema: "${topic}".
Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla con la siguiente estructura exacta. NO incluyas bloques de código markdown (\`\`\`json), marcas, textos de introducción ni de conclusión. Devuelve solo el objeto JSON crudo listo para ser parseado:
{
  "curriculumItem": {
    "title": "Título corto y llamativo del tema",
    "description": "Una descripción breve del curso en una o dos líneas",
    "difficulty": "beginner",
    "estimatedMins": 30
  },
  "contentBlock": {
    "title": "Teoría fundamental",
    "body": "# Introducción al tema\\n\\nRedacta aquí una explicación completa en formato Markdown sobre el tema, incluyendo subtítulos, listas explicativas, ejemplos de código claros si aplica y consejos para recordar."
  },
  "exercise": {
    "title": "Quiz de Comprensión",
    "prompt": "Plantea una pregunta de opción múltiple muy clara sobre el tema. ¿Cuál es el concepto central de...?",
    "exerciseType": "quiz",
    "difficulty": "beginner"
  }
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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

      // Clean markdown code blocks from response
      text = text.trim();
      if (text.startsWith('```')) {
        const firstLineBreak = text.indexOf('\n');
        const lastCodeBlock = text.lastIndexOf('```');
        if (firstLineBreak !== -1 && lastCodeBlock !== -1) {
          text = text.substring(firstLineBreak + 1, lastCodeBlock).trim();
        }
      }

      // Robust check for JSON start/end
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
      const exerciseId = `ex-${uniqueId}`;

      // 4. Save to Database in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.curriculumItem.create({
          data: {
            id: generatedId,
            title: data.curriculumItem.title,
            description: data.curriculumItem.description,
            difficulty: data.curriculumItem.difficulty || 'beginner',
            estimatedMins: data.curriculumItem.estimatedMins || 30,
          },
        });

        await tx.contentBlock.create({
          data: {
            id: contentId,
            title: data.contentBlock.title || 'Teoría de ' + data.curriculumItem.title,
            contentType: 'text/markdown',
            body: data.contentBlock.body,
            version: '1.0.0',
          },
        });

        await tx.exercise.create({
          data: {
            id: exerciseId,
            title: data.exercise.title || 'Evaluación del tema',
            prompt: data.exercise.prompt || 'Responde la pregunta del tema.',
            exerciseType: data.exercise.exerciseType || 'quiz',
            difficulty: data.exercise.difficulty || 'beginner',
          },
        });
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
}

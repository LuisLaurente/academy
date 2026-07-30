import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // 1. Seed Student User
  const studentId = 'student-uuid-100';
  await prisma.user.upsert({
    create: {
      credentials: {
        create: {
          passwordHash: '$2b$10$e81Z21z8890x10101010101010101010101010101010101010101',
        },
      },
      email: 'student@academy.edu',
      id: studentId,
      isActive: true,
      role: 'student',
    },
    update: {},
    where: { id: studentId },
  });

  // 2. Seed Curriculum Items
  const item1 = {
    description:
      'Aprende los conceptos fundamentales de Bounded Contexts, Aggregates y Value Objects.',
    difficulty: 'intermediate',
    estimatedMins: 30,
    id: 'curr-ddd-core',
    title: 'Domain-Driven Design Fundamentals',
  };

  const item2 = {
    description: 'Estructuración de capas: Domain, Application, Infrastructure y Presentation.',
    difficulty: 'advanced',
    estimatedMins: 45,
    id: 'curr-clean-arch',
    title: 'Clean Architecture Principles',
  };

  const item3 = {
    description: 'Estrategias de prueba unitaria, integración y simulación de infraestructura.',
    difficulty: 'intermediate',
    estimatedMins: 25,
    id: 'curr-testing-patterns',
    title: 'Testing Patterns in Monorepos',
  };

  for (const item of [item1, item2, item3]) {
    await prisma.curriculumItem.upsert({
      create: item,
      update: item,
      where: { id: item.id },
    });
  }

  // 3. Seed Content Blocks
  const content1 = {
    body: `# Domain-Driven Design Fundamentals

Domain-Driven Design (DDD) es un enfoque de desarrollo de software centrado en modelar el dominio de negocio.

## Conceptos Clave
- **Bounded Context**: Límite explícito dentro del cual existe un modelo de dominio.
- **Aggregate**: Cúmulo de objetos de dominio asociados tratados como una unidad.
- **Value Object**: Objeto inmutable definido por sus atributos y no por su identidad.`,
    contentType: 'text/markdown',
    id: 'cont-ddd-intro',
    title: 'Introducción a Domain-Driven Design',
    version: '1.0.0',
  };

  const content2 = {
    body: `# Clean Architecture Principles

La arquitectura limpia separa el código en capas concéntricas con una Regla de Dependencia estricta: las dependencias apuntan hacia adentro.

## Capas
1. **Domain**: Reglas de negocio puras.
2. **Application**: Casos de uso y orquestación.
3. **Infrastructure**: Frameworks, DBs y bibliotecas externas.
4. **Presentation**: HTTP Controllers, UI y CLI.`,
    contentType: 'text/markdown',
    id: 'cont-clean-layers',
    title: 'Capas de Clean Architecture',
    version: '1.0.0',
  };

  for (const content of [content1, content2]) {
    await prisma.contentBlock.upsert({
      create: content,
      update: content,
      where: { id: content.id },
    });
  }

  // 4. Seed Exercises
  const exercise1 = {
    difficulty: 'intermediate',
    exerciseType: 'quiz',
    id: 'ex-ddd-quiz-1',
    prompt: '¿Cuál de las siguientes afirmaciones define mejor un Value Object?',
    title: 'Identificación de Value Objects',
  };

  const exercise2 = {
    difficulty: 'advanced',
    exerciseType: 'code',
    id: 'ex-clean-arch-code-1',
    prompt:
      'Implementa la interfaz UserRepository en la capa de Infrastructure sin importar NestJS en la capa de Domain.',
    title: 'Inversión de Dependencias en Repositorios',
  };

  for (const exercise of [exercise1, exercise2]) {
    await prisma.exercise.upsert({
      create: exercise,
      update: exercise,
      where: { id: exercise.id },
    });
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

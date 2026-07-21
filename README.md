# Learning OS — Walking Skeleton

Base técnica oficial de una plataforma orientada al dominio duradero del conocimiento. Este repositorio contiene únicamente la infraestructura del proyecto: aplicaciones ejecutables, paquetes compartidos, configuración, pruebas, automatización y servicios locales. Todavía no incluye lógica de negocio.

## Requisitos

- Node.js 24 LTS
- pnpm 10.24 mediante Corepack
- Docker Engine 29 o compatible, con Docker Compose v2+
- Git 2.40 o superior

## Primer inicio local

1. Activa pnpm: `corepack enable`.
2. Instala dependencias: `pnpm install`.
3. Copia `.env.example` como `.env` y conserva los valores locales o ajústalos.
4. Inicia PostgreSQL y Redis: `docker compose up -d postgres redis`.
5. Genera Prisma Client: `pnpm prisma:generate`.
6. Inicia las aplicaciones: `pnpm dev`.

Servicios locales:

- Web: `http://localhost:3000`
- Health web: `http://localhost:3000/health`
- API liveness: `http://localhost:3001/api/v1/health/live`
- API readiness: `http://localhost:3001/api/v1/health/ready`
- Swagger, solo en desarrollo: `http://localhost:3001/docs`
- PostgreSQL para herramientas locales: `localhost:55432`
- Redis para herramientas locales: `localhost:56379`

## Inicio completo con Docker

`docker compose up --build`

Compose construye `web` y `api`, espera a que PostgreSQL y Redis estén saludables y conserva sus datos en volúmenes nombrados. La red `data` es interna; únicamente los puertos locales explícitos quedan publicados para diagnóstico y desarrollo.

Para detener los contenedores sin eliminar datos: `docker compose down`.

## Scripts

| Comando                | Propósito                                                       |
| ---------------------- | --------------------------------------------------------------- |
| `pnpm dev`             | Ejecuta las aplicaciones en modo desarrollo mediante Turborepo. |
| `pnpm dev:web`         | Ejecuta únicamente Next.js.                                     |
| `pnpm dev:api`         | Ejecuta únicamente NestJS.                                      |
| `pnpm build`           | Compila todos los paquetes y aplicaciones.                      |
| `pnpm lint`            | Ejecuta ESLint sin admitir advertencias.                        |
| `pnpm typecheck`       | Verifica tipos sin emitir archivos.                             |
| `pnpm test`            | Ejecuta las pruebas automatizadas.                              |
| `pnpm format:check`    | Comprueba el formato Prettier.                                  |
| `pnpm prisma:generate` | Genera el cliente de Prisma sin crear migraciones.              |

## Arquitectura del repositorio

```text
apps/       Aplicaciones desplegables: web, API y límites reservados de procesos.
packages/   Configuración, contratos, módulos de servidor y sistema de UI compartidos.
docker/     Dockerfiles de desarrollo y documentación específica.
docs/       Índice de especificaciones y registro de decisiones arquitectónicas.
configs/    Contratos de variables por ambiente, sin secretos.
scripts/    Punto controlado para automatización operativa futura.
.github/    Integración continua.
```

El backend es un monolito modular. Los módulos funcionales están declarados como límites vacíos y no contienen comportamiento. `packages/server` conserva esos límites; `apps/api` compone infraestructura y transporte. El frontend usa App Router y mantiene los componentes reutilizables en `packages/ui`.

## Configuración

`.env.example` es el contrato local canónico. `configs/*.env.example` documenta los valores por ambiente. La API valida todas sus variables al arrancar y falla de forma inmediata ante configuración inválida. Los secretos reales nunca deben versionarse.

## Calidad y contribución

Los commits siguen Conventional Commits y Commitlint. Husky ejecuta lint-staged antes del commit y valida el mensaje. GitHub Actions instala con lockfile inmutable y ejecuta formato, lint, typecheck, tests y build.

Las reglas obligatorias de ingeniería viven en `DEVELOPMENT_GUIDELINES.md`; las especificaciones de arquitectura y producto enlazadas desde `docs/README.md` son la fuente de verdad.

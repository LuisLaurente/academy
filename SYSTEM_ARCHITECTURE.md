# SYSTEM_ARCHITECTURE — Arquitectura técnica del Learning Operating System

| Campo | Valor |
|---|---|
| Estado | Especificación técnica obligatoria |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Documentos rectores | `MASTER_SPEC.md`, `DATABASE_DESIGN.md`, `LEARNING_ENGINE_SPEC.md`, `AI_ENGINE_SPEC.md` |
| Alcance | Arquitectura lógica, modular, operativa y de despliegue |
| Exclusiones | Código, pseudocódigo, diseño de APIs, Prisma, Dockerfiles e implementación |

## 1. Autoridad, propósito y precedencia

Este documento define cómo se estructura, conecta, despliega, protege, prueba y mantiene técnicamente la plataforma. Desarrolla las decisiones de los cuatro documentos rectores sin sustituir su autoridad funcional, pedagógica, de datos o de IA.

La precedencia es:

1. Enmienda formal aprobada de `MASTER_SPEC.md`.
2. `MASTER_SPEC.md` vigente.
3. `DATABASE_DESIGN.md`.
4. `LEARNING_ENGINE_SPEC.md`.
5. `AI_ENGINE_SPEC.md`.
6. Este documento.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** conservan su significado contractual. Una decisión técnica futura que afecte dominio, retención, publicación, seguridad, privacidad, persistencia o autoridad de la IA requiere ADR y revisión de los documentos correspondientes.

### 1.1 Objetivo arquitectónico

Construir un sistema que pueda evolucionar durante años sin confundir modularidad con distribución. La arquitectura debe permitir:

- mantener reglas de negocio independientes de NestJS, Next.js, Prisma, Redis, Gemini y Docker;
- cambiar adaptadores sin reescribir dominio;
- hacer explícito quién es dueño de cada decisión y dato;
- preservar transacciones fuertes donde el negocio las necesita;
- ejecutar efectos pesados fuera del camino interactivo;
- observar y revertir cambios operativos;
- extraer un módulo a servicio solo cuando exista evidencia;
- operar con seguridad en un único NAS sin fingir alta disponibilidad.

### 1.2 Matriz de trazabilidad

| Requisito | Decisión arquitectónica | Secciones |
|---|---|---|
| Modular Monolith | Bounded contexts dentro de un proceso lógico, con composition roots separados | 4–6 |
| Clean Architecture | Dependencias hacia dominio y puertos; adaptadores en periferia | 7–9 |
| Feature First | Organización vertical por módulo y capacidad | 7–10 |
| Bajo acoplamiento | Public facades, puertos y eventos versionados | 11–14 |
| Ownership | Escritura exclusiva y lectura controlada por módulo | 11 |
| Event Driven interno | Outbox, consumidores idempotentes y proyecciones | 13–14 |
| Frontend Next.js | App Router, Server Components por defecto y features verticales | 9 |
| Backend NestJS | Composition roots y módulos de negocio independientes del framework | 8 |
| PostgreSQL/Prisma | Fuente transaccional única y adaptadores por módulo | 11, 23 |
| Redis | Caché, colas, locks y rate limiting efímeros | 15, 23 |
| Seguridad | Sesiones opacas, políticas, defensa por capas y runner aislado | 19 |
| Observabilidad | Logs, métricas y trazas correlacionadas | 17–18 |
| Pruebas | Pirámide dirigida por riesgo y contratos | 20 |
| NAS/Compose | Un host, redes segmentadas, volúmenes, backups y rollback | 23–25 |
| Escalabilidad | Escala vertical/horizontal y extracción basada en señales | 26 |
| Documentación viva | ADR, C4, contratos, runbooks y trazabilidad | 28 |

## 2. Invariantes heredadas

La arquitectura técnica no puede debilitar estas reglas:

1. Solo evidencia evaluable modifica dominio.
2. Mastery es el único propietario de `UserConceptState`.
3. Practice registra intentos; no calcula por sí mismo dominio.
4. Review agenda y selecciona; no altera scores directamente.
5. La IA genera candidatos y nunca decide evaluación, dominio, retención, repaso, desbloqueo, permisos, XP o publicación.
6. Learning Engine consume únicamente contenido publicado y nunca llama a un LLM durante una sesión.
7. PostgreSQL es fuente de verdad; Redis nunca lo reemplaza.
8. Contenido publicado, evidencia, intentos cerrados, ledger de XP y auditoría preservan historia.
9. Cada subnivel publicado contiene exactamente 30 ejercicios válidos y un quiz compatible.
10. La jerarquía editorial y el Knowledge Graph permanecen separados.
11. Un módulo no escribe datos de otro módulo.
12. Ninguna llamada externa ocurre dentro de una transacción de base de datos.
13. El runner de código no comparte privilegios, red de datos ni credenciales con la aplicación.
14. La caída de Gemini no impide aprender con contenido persistido.
15. El NAS es un único dominio de fallo y no se declarará alta disponibilidad.

## 3. Principios de diseño y límites de uso

### 3.1 Modular Monolith

Se aplica separando capacidades de negocio en módulos cohesionados, con propiedad de datos, contrato público y dependencias verificables. Los módulos se despliegan inicialmente como una unidad de versión, aunque API y workers tengan procesos distintos.

No debe convertirse en una carpeta de “módulos” que comparte entidades, repositorios y tablas indiscriminadamente. Tampoco exige que cada operación pase por mensajería: una llamada local clara es preferible cuando se necesita respuesta inmediata y no se rompe ownership.

### 3.2 Clean Architecture

Se aplica en contextos con reglas ricas: Curriculum, Content, Practice, Mastery, Review, AI Content y Gamification. El dominio no conoce frameworks, transporte, ORM, cache, proveedor ni observabilidad. Application orquesta casos de uso mediante puertos. Infrastructure implementa esos puertos. Interfaces traduce entradas y salidas.

No se crean cuatro capas ceremoniales para CRUD simple. Configuration, catálogos pequeños o adaptadores triviales pueden usar una estructura más compacta mientras conserven dirección de dependencias y pruebas.

### 3.3 SOLID

- Responsabilidad única: una unidad cambia por una razón coherente, no por tamaño arbitrario.
- Abierto/cerrado: proveedores, tipos de ejercicio y políticas se amplían mediante registros y adaptadores.
- Sustitución: una implementación de puerto debe respetar semántica, errores e idempotencia, no solo su forma.
- Segregación: puertos pequeños por capacidad evitan interfaces universales.
- Inversión: dominio y aplicación dependen de abstracciones propias, no de SDKs externos.

No se usa SOLID para multiplicar wrappers sin frontera real. Una abstracción de una sola implementación es válida solo si protege una dependencia volátil, permite prueba significativa o preserva ownership.

### 3.4 DRY

Se elimina duplicación de conocimiento normativo: schemas contractuales, eventos, tokens visuales, políticas y glosarios tienen una fuente canónica. No se fusionan dos reglas parecidas de módulos distintos si su ciclo de cambio es diferente. Repetir una pequeña transformación puede ser preferible a crear una dependencia compartida falsa.

### 3.5 KISS

Se elige PostgreSQL antes que una base de grafos, llamadas locales antes que red, Compose antes que orquestación de clúster y políticas explicables antes que modelos opacos. KISS no significa omitir controles, auditoría o versionado; significa alcanzar las invariantes con el menor número de mecanismos.

### 3.6 Feature First

El primer eje de navegación del código será la capacidad de negocio. Dentro de una feature se aplican las capas necesarias. Se evita agrupar todos los controllers, services o repositories del sistema en carpetas globales, porque esa organización oculta cohesión y facilita dependencias laterales.

### 3.7 Dependency Inversion

Los puertos pertenecen al consumidor que necesita la capacidad. Por ejemplo, Mastery define qué información curricular necesita y Curriculum proporciona el adaptador público correspondiente. No se exporta un repositorio genérico para satisfacer a todos.

No se invierte una dependencia interna estable solo para simular flexibilidad. Los Value Objects puros y contratos compartidos pequeños pueden importarse directamente desde su propietario.

### 3.8 Event Driven interno

Los eventos comunican hechos ya ocurridos y desacoplan efectos que toleran consistencia eventual: analítica, logros, notificaciones, recalculados y trabajos editoriales. Outbox garantiza que el hecho y su publicación lógica no se separen; consumidores idempotentes garantizan efecto único observable.

No se usan eventos para consultas, validaciones previas ni decisiones que el usuario necesita inmediatamente. Tampoco se promete entrega exactamente una vez: se diseña para al menos una vez con deduplicación.

### 3.9 Composition over Inheritance

Las políticas, validadores, renderers, evaluadores y adaptadores se componen por capacidad. La herencia queda limitada a relaciones verdaderamente is-a, estables y sin necesidad de alterar comportamiento por combinaciones. Se prohíben jerarquías profundas de servicios base y “god classes” abstractas.

## 4. Decisión arquitectónica: por qué un monolito modular

### 4.1 Contexto

El sistema comienza con un equipo y una instalación autoalojada en un NAS. Curriculum, Practice, Mastery y Review necesitan coherencia transaccional estrecha. La IA y Analytics sí requieren ejecución asíncrona, pero no autoridad independiente. Distribuir el núcleo aumentaría fallos, latencia, costo operativo y dificultad de restauración antes de aportar valor.

### 4.2 Comparación objetiva

| Alternativa | Ventajas | Desventajas en este proyecto | Decisión |
|---|---|---|---|
| Modular Monolith | Transacciones locales, despliegue simple, depuración integral, límites extraíbles | Requiere disciplina; un fallo de proceso puede afectar varias capacidades | Adoptada |
| Microservicios | Escala y despliegue independientes, aislamiento por proceso/equipo | Red, contratos distribuidos, consistencia eventual, más observabilidad y operación; excesivo para NAS inicial | Descartada inicialmente |
| Monolito tradicional | Inicio rápido y pocas piezas | Ownership difuso, capas horizontales, cambios de alto impacto, extracción difícil | Descartada |
| Hexagonal pura uniforme | Puertos explícitos y gran aislamiento | Ceremonia uniforme incluso en CRUD, riesgo de abstracciones vacías | Aplicada de forma pragmática dentro de módulos ricos |
| Arquitectura basada en servicios dentro de una aplicación | Facades claras y cierta separación | Si comparten datos se vuelve monolito tradicional; si usan red hereda costos distribuidos | Solo como contratos internos, no como estilo dominante |

### 4.3 Unidad de despliegue y unidad de diseño

El producto tiene una versión coordinada, pero varias composition roots:

- Web atiende experiencia y renderizado.
- API atiende interacción síncrona y autorización.
- Worker procesa jobs y eventos.
- Runner ejecuta código no confiable bajo aislamiento.

API y Worker ensamblan los mismos módulos de negocio mediante adaptadores distintos. No duplican reglas. Esta separación es operacional, no una fragmentación del dominio en servicios remotos.

### 4.4 Ruta de migración

Un módulo será candidato a extracción si cumple simultáneamente un límite de dominio claro y al menos una señal demostrable: perfil de escala independiente, aislamiento de seguridad, disponibilidad distinta, ciclo de despliegue propio o propiedad por otro equipo. Los primeros candidatos son Runner, AI Generation, Notifications y Analytics. Mastery y Curriculum permanecen juntos mientras su coherencia transaccional sea más valiosa que el escalado independiente.

La extracción conserva el contrato público, cambia el adaptador local por transporte y añade outbox/inbox. No se comparte base de datos entre el servicio extraído y el monolito.

## 5. Vista de contexto del sistema

### 5.1 Actores

- Student: aprende, practica, revisa y consulta su dominio.
- ContentEditor: inicia autoría y prepara currículo/contenido.
- Reviewer: valida contenido y separa aprobación de autoría.
- Administrator: gestiona acceso y configuración autorizada.
- Operator: despliega, observa, restaura y responde a incidentes.
- Proveedor de IA: genera candidatos bajo Gateway.
- Proveedor de notificaciones: entrega mensajes opt-in.

### 5.2 Diagrama conceptual

> Navegador
> → Reverse Proxy y TLS
> → Web / API
> → Módulos del monolito
> → PostgreSQL como autoridad
>
> Módulos
> → Outbox y cola
> → Worker
> → Redis para coordinación efímera
>
> Worker de IA
> → LLM Gateway
> → Gemini
>
> Practice
> → Runner aislado
>
> Telemetría de todos los procesos
> → colector y almacenamiento operacional

Las únicas superficies públicas son las atendidas por el reverse proxy. Base de datos, Redis, Runner y colector permanecen en redes internas.

## 6. Vista de contenedores lógicos

| Contenedor lógico | Responsabilidad | Estado local permitido | No debe hacer |
|---|---|---|---|
| Web | Renderizado, interacción, accesibilidad y composición de UI | Caché de render y estado efímero | Decidir dominio, autorización o evaluación |
| API | Autenticación, autorización, casos de uso síncronos y consultas | Ninguno durable fuera de PostgreSQL | Ejecutar IA o trabajos largos en request |
| Worker | Jobs, outbox, proyecciones, IA, planificación y notificaciones | Checkpoints persistidos y estado de job | Exponer superficie pública general |
| Runner | Ejecutar artefactos no confiables con límites | Filesystem efímero por ejecución | Acceder a red, DB, Redis o secretos de negocio |
| PostgreSQL | Fuente transaccional e histórica | Datos durables | Actuar como bus externo o almacén de blobs ilimitados |
| Redis | Caché, locks, rate limits y colas | Datos con TTL o reconstruibles | Ser autoridad de dominio/contenido |
| Reverse proxy | TLS, routing, límites y headers de borde | Certificados y configuración | Autorizar reglas de negocio |
| Observabilidad | Recibir, correlacionar, consultar y alertar | Retención operacional | Duplicar payload sensible o auditoría íntegra |

## 7. Estructura del repositorio

### 7.1 Árbol conceptual

`learning-os/`

- `apps/`
  - `web/`: aplicación Next.js y composition root del frontend.
  - `api/`: composition root HTTP de NestJS.
  - `worker/`: composition root asíncrona de NestJS.
  - `runner/`: proceso de ejecución aislada y mínimo.
- `packages/`
  - `server/`: módulos de dominio/aplicación e interfaces públicas del backend.
  - `contracts/`: schemas de intercambio, eventos y errores estables, sin reglas de dominio.
  - `ui/`: design system, tokens y componentes compartidos.
  - `observability/`: convenciones e instrumentación común, sin lógica funcional.
  - `configuration/`: validadores y descriptores de configuración, sin secretos.
  - `testing/`: builders, fixtures y harnesses exclusivamente de prueba.
  - `tooling/`: configuraciones compartidas de compilación, lint y formato.
- `docs/`
  - `specifications/`: documentos contractuales rectores.
  - `adr/`: decisiones aceptadas, sustituidas o rechazadas.
  - `architecture/`: vistas C4, dependencias y diagramas.
  - `contracts/`: catálogo de eventos y contratos públicos de módulos.
  - `security/`: threat model, clasificación y respuesta.
  - `operations/`: runbooks, backup, restore, rollback e incidentes.
  - `quality/`: estrategia de pruebas, golden datasets y criterios.
- `infra/`
  - `compose/`: topología base y overlays por ambiente.
  - `proxy/`: configuración del borde y TLS.
  - `observability/`: stack y dashboards operativos.
  - `backup/`: políticas y descriptores de trabajos de respaldo.
  - `nas/`: requisitos, capacidad, permisos y notas específicas del host.
- `scripts/`: automatizaciones operativas pequeñas, revisadas e idempotentes.
- `configs/`: catálogos no secretos por ambiente y plantillas de configuración.
- `.github/`: workflows, plantillas, ownership y políticas de repositorio.
- `assets/`: recursos fuente compartidos que no pertenecen al contenido pedagógico persistido.

### 7.2 Justificación

`apps` contiene procesos desplegables; no reglas compartidas. `packages/server` permite que API y Worker compongan exactamente el mismo dominio sin importarse entre aplicaciones. `contracts` no se convierte en un “shared” universal: contiene solo formatos estables y versionados. `infra` concentra descriptores operativos, mientras `scripts` contiene acciones; separar ambos evita esconder infraestructura en automatizaciones opacas.

### 7.3 Reglas del monorepo

- Una app puede depender de packages; nunca de otra app.
- Un módulo de `server` importa solo el public surface de otro módulo permitido.
- `contracts` no importa módulos de negocio ni infraestructura.
- `ui` no importa features de Web.
- `testing` no forma parte de bundles productivos.
- `tooling` no contiene decisiones de dominio.
- No existe un barrel global que reexporte todo.
- Los límites se validan automáticamente en CI mediante reglas de importación.

## 8. Arquitectura del backend

### 8.1 Composition roots

`apps/api` y `apps/worker` son ensambladores. Seleccionan módulos, adaptadores, configuración, telemetría y ciclo de vida del proceso. No albergan políticas de negocio. API añade interfaces síncronas; Worker añade consumidores, schedulers y procesadores.

### 8.2 Organización de `packages/server`

Cada módulo rico contiene, según necesidad:

- `domain`: agregados, entidades, Value Objects, políticas puras, errores e invariantes.
- `application`: casos de uso, comandos/consultas internas, puertos, autorización de capacidad y límites transaccionales.
- `interfaces`: facade pública del módulo, contratos de eventos y adaptadores de entrada.
- `infrastructure`: persistencia Prisma, Redis, proveedores, reloj, identificadores y traductores técnicos.

Carpetas técnicas solo existen dentro de la feature. Un módulo simple puede combinar application/interfaces, pero nunca permitir que infraestructura sea importada por dominio.

### 8.3 Core, Common y Shared

**Core** contiene primitivas verdaderamente universales y estables: identidad tipada, reloj, resultado, paginación conceptual, transaction boundary y metadata de correlación. Debe ser pequeño y no conocer negocio.

**Common** no será una carpeta global de conveniencia. Las utilidades técnicas se ubican por propósito en packages explícitos. Si una función solo sirve a un módulo, permanece allí.

**Shared Kernel** se limita a conceptos acordados entre contextos que cambian juntos, por ejemplo referencias estables a User, Concept o Publication y metadata de eventos. No comparte agregados ni modelos de persistencia. Cada ampliación exige revisión de acoplamiento.

### 8.4 Interfaces y adaptadores

Las entradas pueden ser HTTP, jobs, eventos, scheduler o comandos administrativos. Todas traducen a casos de uso; ninguna contiene reglas. Los adaptadores de salida implementan puertos para persistencia, cache, IA, runner, correo, reloj o generación de IDs.

Prisma queda confinado a adaptadores. Un tipo generado por ORM no cruza hacia domain, application, contracts o frontend. Redis y SDKs de proveedor siguen la misma regla.

### 8.5 Transacciones

El caso de uso define el límite transaccional. Las operaciones que modifican una misma raíz y su outbox comparten transacción PostgreSQL. Las llamadas a Gemini, Runner, correo o cualquier red se realizan antes o después mediante jobs y estados intermedios, nunca dentro de esa transacción.

## 9. Arquitectura del frontend

### 9.1 App Router y rutas

App Router organiza entry points, layouts, loading, error y not-found boundaries. Los route groups separan superficies pública, autenticada, aprendizaje y administración sin convertir la ruta en lugar de negocio. Layouts gestionan estructura visual, navegación y providers estrictamente necesarios.

Server Components son el valor por defecto para lectura y composición. Client Components se reservan para Monaco, formularios interactivos, movimiento, estado efímero y APIs del navegador. Las reglas de dominio nunca se duplican para “respuesta rápida” en cliente.

### 9.2 Organización feature-first

Dentro de `apps/web`:

- `app`: rutas, layouts y boundaries.
- `features`: slices verticales como learning-session, review, curriculum-browser, mastery-insights y content-review.
- `entities`: modelos de presentación reutilizables y sin autoridad de dominio.
- `widgets`: composiciones de varias features para una pantalla.
- `providers`: sesión visual, preferencias, telemetría cliente y configuración de librerías.
- `services`: clientes de contratos backend y traductores de transporte.
- `stores`: estado global efímero excepcional y documentado.
- `hooks`: coordinación de UI reutilizable, sin reglas académicas.
- `utils`: funciones puras de presentación/localización; no un cajón de sastre.
- `styles`: tokens de aplicación y estilos globales mínimos.

Los componentes genéricos pertenecen a `packages/ui`; los específicos permanecen en la feature.

### 9.3 Design System

`packages/ui` posee tokens semánticos, primitives accesibles basadas en shadcn/ui, patrones de formulario, feedback, navegación, visualización de dominio y presets de movimiento. Tailwind consume tokens; no define colores arbitrarios dispersos. Framer Motion se encapsula en presets compatibles con reducción de movimiento. Monaco se integra mediante un adapter visual y se carga solo donde aplica.

### 9.4 Estado y datos

- Estado remoto: caché de cliente con claves vinculadas a contrato y usuario.
- Estado de URL: filtros, periodo, página y selección compartible no sensible.
- Estado de servidor: fuente de verdad para sesión, permisos y datos.
- Estado local: interacción de componente.
- Store global: solo para estado transversal efímero que no encaja en URL o servidor.
- Borradores: sincronización explícita con versión y conflictos; no se confunden con submissions.

Tokens de autenticación no se exponen a JavaScript ni se guardan en almacenamiento web. Los datos sensibles reciben políticas de no-cache adecuadas.

### 9.5 Límites del frontend

El frontend puede anticipar validaciones de forma y mejorar UX, pero el backend repite y decide. No calcula dominio, XP, racha, selección de repaso, autorización, score de quiz ni corrección definitiva. No consume tablas ni payloads de persistencia.

## 10. Mapa completo de módulos

| Módulo | Responsabilidad principal | Dueño de |
|---|---|---|
| Identity & Access | Cuenta, credenciales, sesiones, roles y consentimiento | Identidad y decisiones de acceso |
| User Profile | Perfil mínimo, onboarding y preferencias personales | Datos de presentación/preferencia |
| Curriculum | Jerarquía editorial, conceptos, grafo, rutas y manifest curricular | Taxonomía y prerequisitos |
| Content | Lecciones, teoría, ejemplos, ejercicios, quizzes, revisión y publicación | Artefactos pedagógicos aceptados/publicados |
| Practice | Sesiones, ítems, intentos, submissions, hints y feedback | Historial de práctica |
| Evaluation | Evaluadores, rúbricas, resultados y coordinación con Runner | Decisión reproducible de una submission |
| Mastery | EvidenceEvent, vector de conocimiento, transiciones y snapshots | Estado académico canónico |
| Review | Agenda, planes, selección y sesiones de repaso | Decisión de cuándo/qué revisar |
| AI Content | Solicitudes, contexto, gateway, candidatos, validación y coste | Ciclo de generación IA |
| Study Activity | Actividad activa validada y sesiones analíticas | Tiempo de estudio válido |
| Analytics | Proyecciones, agregados y dashboard | Modelos de lectura derivados |
| Gamification | XP, racha y logros | Ledgers y estados no académicos |
| Notifications | Preferencias, plantillas y entregas | Comunicación saliente |
| Configuration | Políticas versionadas, settings no secretos y feature flags | Configuración de negocio gobernada |
| Administration | Casos de uso administrativos y bandejas de trabajo | Orquestación; no datos ajenos |
| Operations | Outbox, jobs, dead letters, auditoría e incidentes técnicos | Continuidad y evidencia operacional |

### 10.1 Módulos que no deben fusionarse

- Practice y Mastery: registrar una respuesta no equivale a decidir conocimiento.
- Mastery y Review: estimar memoria no equivale a programar experiencia.
- Content y AI Content: una salida de modelo no es contenido aceptado.
- Analytics y Mastery: una proyección no es autoridad académica.
- Gamification y Learning: XP no gobierna aprendizaje.
- Administration y módulos propietarios: una consola no adquiere ownership por poder invocarlos.

### 10.2 Evaluation como módulo explícito

`DATABASE_DESIGN.md` ubica la evaluación principalmente junto a Practice. Esta arquitectura la reconoce como módulo interno explícito porque múltiples tipos disciplinares, Runner y rúbricas crecerán de forma distinta. Practice sigue siendo dueño del intento y Evaluation del resultado reproducible. Esta separación no crea un microservicio ni cambia el modelo conceptual; se formaliza en ADR-SA-003.

## 11. Ownership y acceso a datos

### 11.1 Regla de escritura exclusiva

Cada entidad tiene un único módulo escritor. Otros módulos solicitan el cambio mediante la facade pública o reaccionan a un evento. Compartir PostgreSQL no concede permiso para escribir cualquier tabla.

Ejemplos obligatorios:

- Practice no actualiza `UserConceptState`; emite evidencia persistida para Mastery.
- Review no edita `ExerciseAttempt`; inicia una práctica contextualizada.
- Analytics no corrige fuentes; reconstruye proyecciones.
- Administration no publica directamente; invoca el caso de uso de Content.
- AI Content no crea una publicación; entrega un candidato aceptado a Content.
- Gamification no altera un intento ni dominio; registra una entrada deduplicada.

### 11.2 Lecturas cruzadas

Orden de preferencia:

1. Vista o consulta pública del módulo propietario cuando se requiere actualidad fuerte.
2. Proyección local alimentada por eventos cuando se tolera eventualidad.
3. Snapshot/version reference para reproducibilidad histórica.

Está prohibido importar el repository de otro módulo o ejecutar una consulta Prisma sobre sus modelos. Las vistas de lectura transversales son propiedad de Analytics o de un read model explícito, no una excusa para escritura cruzada.

### 11.3 Persistencia compartida, ownership lógico

En el monolito inicial todos los módulos pueden residir en un mismo clúster y esquema físico según el futuro diseño Prisma. El ownership se protege con:

- repositorios no exportados;
- public entry point por módulo;
- reglas de importación;
- revisión por CODEOWNERS;
- naming/metadata de pertenencia;
- pruebas arquitectónicas;
- migraciones revisadas por el propietario;
- permisos DB más granulares si el riesgo futuro lo justifica.

## 12. Dependencias entre módulos

### 12.1 Tipos de dependencia

- **Directa síncrona:** facade/puerto local; respuesta requerida para continuar.
- **Evento:** hecho pasado; consumidor tolera eventualidad.
- **Proyección:** copia de lectura reconstruible propiedad del consumidor.
- **Referencia:** identificador/version estable sin importar entidad interna.

### 12.2 Matriz de dependencias permitidas

Leyenda: `S` síncrona mediante facade/puerto, `E` consume eventos, `P` proyección local, `—` sin dependencia. La matriz indica dependencias del módulo de la fila hacia el de la columna.

| Desde \ Hacia | IAM | Profile | Curriculum | Content | Practice | Evaluation | Mastery | Review | AI | Activity | Analytics | Gamification | Notifications | Configuration | Operations |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Identity & Access | — | — | — | — | — | — | — | — | — | — | — | — | — | S | S |
| User Profile | S | — | — | — | — | — | — | — | — | — | — | — | — | S | S |
| Curriculum | — | — | — | — | — | — | — | — | — | — | — | — | — | S | S |
| Content | — | — | S | — | — | S | — | — | E | — | — | — | — | S | S |
| Practice | S | — | S | S | — | S | — | — | — | — | — | — | — | S | S |
| Evaluation | — | — | — | — | — | — | — | — | — | — | — | — | — | S | S |
| Mastery | — | — | S | — | E | — | — | — | — | — | — | — | — | S | S |
| Review | — | S | S | S | S | — | S | — | — | — | — | — | — | S | S |
| AI Content | — | — | S | P | — | S | — | — | — | — | — | — | — | S | S |
| Study Activity | S | — | — | — | E | — | — | E | — | — | — | — | — | S | S |
| Analytics | — | P | P | P | P | P | P | P | P | P | — | P | P | S | S |
| Gamification | — | — | — | — | E | — | E | E | — | E | — | — | — | S | S |
| Notifications | S | S | — | — | — | — | — | E | — | — | — | E | — | S | S |

Administration no aparece como columna porque ningún módulo de negocio depende de él. Administration depende de las facades públicas de IAM, Profile, Curriculum, Content, AI Content, Configuration y Operations. Operations se usa mediante puertos técnicos pequeños para outbox, jobs o auditoría; no contiene reglas de negocio.

`E` y `P` describen colaboración a través de contratos de integración neutrales, no imports del módulo productor. Por eso Content puede reaccionar a `ContentCandidateAccepted` sin depender estáticamente de AI Content, y AI Content puede mantener una proyección de contenido publicado sin importar internals de Content. El grafo de imports y el grafo de llamadas síncronas deben ser acíclicos; una conversación bidireccional por hechos versionados solo se permite si no forma un bucle automático y cada transición tiene idempotencia/estado terminal.

Evaluation recibe snapshots inmutables de ejercicio, submission, rúbrica y límites desde el caso de uso llamador. No consulta repositorios de Practice o Content. Así Practice y Content pueden usar su capacidad sin crear una dependencia inversa.

### 12.3 Dependencias prohibidas

- Domain → NestJS, Prisma, Redis, SDK de IA, HTTP o filesystem.
- Frontend → Prisma, tablas, dominio backend o secretos.
- Analytics → repositorios propietarios para corregir hechos.
- Gamification → Analytics como fuente de concesión.
- Content → internals de AI Content.
- Mastery → Review para calcular conocimiento.
- Review → Gamification para priorizar.
- Curriculum → Administration.
- Cualquier módulo → infraestructura concreta de otro módulo.
- Dependencia circular, incluso si el contenedor de inyección puede resolverla.

Una necesidad de ciclo revela responsabilidad mal ubicada o contrato incorrecto; no se resuelve con referencias tardías ni service locator.

## 13. Comunicación entre módulos

### 13.1 Llamadas síncronas

Se usan cuando el caso de uso necesita una respuesta inmediata y consistente: verificar permiso, resolver publicación vigente, obtener definición de ejercicio, evaluar una submission o leer estado de dominio para formar una sesión de repaso.

La llamada entra por una facade pública pequeña. El consumidor no recibe agregados mutables ni modelos Prisma; recibe decisiones, snapshots o Value Objects contractuales.

### 13.2 Eventos internos

Se usan para efectos posteriores: actualizar analytics, conceder XP, recalcular agenda, enviar notificación, invalidar cache, generar contenido o registrar calidad. El productor no conoce consumidores.

Un evento:

- expresa un hecho en pasado;
- tiene ID, tipo, versión, timestamp UTC, agregado y correlation/causation IDs;
- contiene lo mínimo necesario, sin secretos ni payloads pesados;
- se persiste con outbox junto al hecho;
- es inmutable;
- puede entregarse más de una vez;
- conserva compatibilidad dentro de su versión.

### 13.3 Interfaces y puertos

Se usan para dependencias volátiles o inversión de control: reloj, identificadores, transacciones, runner, proveedores IA, notificaciones, object storage y consultas públicas de otro contexto. El puerto lo define el consumidor; el adaptador traduce y normaliza errores.

### 13.4 Repositorios

Un repositorio representa acceso a agregados o colecciones del módulo propietario. No es una capa universal de queries. Las consultas complejas de lectura usan read repositories o proyecciones específicas; nunca exponen operaciones genéricas de escritura.

### 13.5 Comandos internos y jobs

Un comando expresa intención y puede fallar por precondiciones. Un job representa trabajo reanudable, con estado, idempotency key, presupuesto, reintentos y dead-letter. Un evento no se reutiliza como comando encubierto.

## 14. Catálogo de eventos internos

### 14.1 Identidad y currículo

| Evento | Propósito | Consumidores principales |
|---|---|---|
| UserRegistered | Registrar creación de cuenta sin exponer credencial | Profile, Notifications, Analytics |
| UserActivated | Habilitar experiencia autenticada | Profile, Analytics |
| SessionRevoked | Invalidar actividad de sesión y auditar riesgo | IAM, Operations |
| UserAnonymized | Coordinar minimización y proyecciones | Profile, Analytics, Notifications, Operations |
| CurriculumVersionApproved | Informar que una edición puede componer publicación | Content, Administration |
| CurriculumPublished | Cambiar manifest vigente e invalidar lecturas | Content, Practice, Review, Analytics |
| KnowledgeGraphPublished | Disponibilizar grafo compatible | Content, Mastery, Review, AI Content |
| LearningPathAssigned | Registrar recomendación/inscripción | Analytics, Notifications |

### 14.2 Contenido e IA

| Evento | Propósito | Consumidores principales |
|---|---|---|
| ContentNeedDetected | Solicitar cobertura faltante autorizada | AI Content, Administration |
| ContentGenerationRequested | Registrar inicio de trabajo canónico | AI Content, Operations |
| ContentCandidateProduced | Habilitar validación sin aceptar contenido | AI Content validators, Administration |
| ContentCandidateRejected | Registrar fallo y posible reparación | AI Content, Analytics operacional |
| ContentCandidateAccepted | Ofrecer artefacto aprobado a Content | Content, Administration |
| ContentArtifactVersionCreated | Informar versión editorial disponible | Content review, Administration |
| ContentPublished | Invalidar caches y habilitar consumo | Practice, Review, Analytics, AI reuse |
| ContentRetired | Evitar nuevas asignaciones | Practice, Review, Analytics |
| ContentIncidentOpened | Cuarentenar y evaluar impacto | Content, Practice, Operations, Administration |

### 14.3 Práctica, dominio y repaso

| Evento | Propósito | Consumidores principales |
|---|---|---|
| LearningSessionStarted | Registrar inicio pedagógico | Study Activity, Analytics |
| ExercisePresented | Congelar exposición y familiaridad | Practice, Analytics |
| HintUsed | Registrar ayuda exacta | Practice, Analytics |
| ExerciseAttemptEvaluated | Comunicar resultado reproducible | Mastery, Gamification, Analytics |
| ExerciseAttemptInvalidated | Iniciar compensación explícita | Mastery, Gamification, Analytics |
| ExplanationViewed | Registrar actividad, no evidencia | Study Activity, Analytics |
| QuizFinished | Comunicar cierre y evaluaciones | Mastery, Analytics, Gamification |
| EvidenceRecorded | Confirmar hecho académico canónico | Mastery projector, Review, Analytics |
| KnowledgeUpdated | Comunicar transición de estado | Review, Analytics, Gamification |
| ConceptAtRiskDetected | Explicar necesidad de repaso | Review, Notifications |
| ReviewScheduled | Materializar vencimiento | Notifications, Analytics |
| ReviewSessionStarted | Congelar selección | Practice, Analytics |
| ReviewSessionFinished | Cerrar experiencia y métricas | Analytics, Gamification |
| LessonRecommended | Comunicar recomendación, no bloqueo | Analytics, Notifications |
| MasteryValidated | Registrar cumplimiento multidimensional | Gamification, Analytics |

### 14.4 Actividad, gamificación y operación

| Evento | Propósito | Consumidores principales |
|---|---|---|
| StudyIntervalValidated | Aportar tiempo activo real | Analytics, Gamification |
| XPGranted | Actualizar proyecciones de saldo | Gamification, Analytics |
| AchievementUnlocked | Informar logro pedagógico | Notifications, Analytics |
| StreakChanged | Actualizar presentación y avisos opt-in | Analytics, Notifications |
| StatisticsProjectionUpdated | Invalidar/read cache del dashboard | Web cache, Operations |
| NotificationScheduled | Crear entrega controlada | Notifications worker |
| NotificationDelivered | Auditar resultado de proveedor | Analytics operacional |
| JobFailedPermanently | Crear dead letter y alerta | Operations |
| PolicyActivated | Invalidar decisiones/proyecciones afectadas | Módulos propietarios, Operations |
| FeatureFlagChanged | Auditar cambio operacional | Operations, módulos afectados |

### 14.5 Evolución de eventos

Los cambios aditivos compatibles permanecen en la misma versión si consumidores toleran ausencia. Cambios de significado, identidad o obligatoriedad crean nueva versión. Productor mantiene una ventana de compatibilidad; consumidor desconocido falla de forma observable. Los eventos históricos nunca se reinterpretan silenciosamente.

## 15. Servicios transversales

### 15.1 Qué puede ser transversal

- correlación y contexto de ejecución;
- reloj e IDs;
- transaction/outbox boundary;
- logging, métricas y tracing;
- configuración validada;
- cifrado y redacción;
- idempotencia técnica;
- feature flags;
- manejo normalizado de errores técnicos.

### 15.2 Qué no puede ser transversal

No pertenecen a `core`, `common` u Operations: cálculo de dominio, selección de repaso, publicación, autorización de contenido, XP, taxonomía curricular, dificultad o evaluación. Convertir reglas de negocio en helpers compartidos destruye ownership.

## 16. Sistema de configuración

### 16.1 Tres categorías

**Configuración de despliegue.** Hostnames, puertos internos, conexiones, límites de proceso, destinos de telemetría y proveedor habilitado. Se suministra por ambiente y se valida al iniciar.

**Secretos.** Credenciales DB, claves de sesión, Gemini, correo, cifrado y backup. Se inyectan solo al servicio autorizado, nunca se versionan, imprimen ni exponen a frontend.

**Políticas de negocio.** Umbrales de dominio, repaso, XP, publicación, rate limits funcionales y feature flags gobernados. Viven versionados en PostgreSQL cuando afectan decisiones reproducibles; no son variables de entorno arbitrarias.

### 16.2 Ambientes

Local, test, preview, staging y production poseen identidad, bases, Redis, secretos y URLs separadas. Production no hereda defaults inseguros. Preview no recibe datos personales reales. Staging reproduce topología y controles de producción dentro de límites de costo.

### 16.3 Validación y acceso

- Validación completa y fail-fast al arrancar.
- Configuración tipada entregada por inyección; ningún módulo lee el entorno directamente.
- Defaults solo para local/test y siempre explícitos.
- Variables desconocidas críticas producen advertencia o fallo según política.
- Cambios dinámicos de políticas pasan por Configuration, versión y auditoría.
- Secretos se rotan por propósito y servicio; no existe una credencial universal.

### 16.4 Precedencia

La precedencia operacional es: valor seguro del entorno específico > configuración base no secreta > default permitido para desarrollo. Una política persistida no puede ser sustituida silenciosamente por una variable de entorno. Los flags de emergencia tienen propietario, expiración y auditoría.

## 17. Logging y auditoría

### 17.1 Logging operacional

Los procesos emiten logs estructurados en JSON con un schema común. Cada entrada incluye, cuando aplique:

- timestamp UTC y nivel;
- service/process y módulo;
- ambiente, versión de aplicación e imagen;
- correlation ID, trace ID, span ID y causation ID;
- actor pseudonimizado, nunca credencial;
- operación/caso de uso y resultado;
- latencia, retry count y error code estable;
- job/event/generation/attempt ID;
- versión de contrato o política relevante.

No se registran contraseñas, tokens, cookies, headers completos, respuestas de estudiantes, soluciones privadas, prompts/respuestas crudas, SQL, variables de entorno ni PII innecesaria. Las excepciones diagnósticas requieren almacén restringido, redacción y retención específica.

### 17.2 Niveles

| Nivel | Uso | Ejemplo conceptual |
|---|---|---|
| Debug | Diagnóstico temporal, deshabilitado o muestreado en producción | Decisión interna no sensible |
| Info | Cambio de estado normal y significativo | Job completado o publicación activada |
| Warn | Degradación recuperable o riesgo próximo | Reintento, cache miss anómalo, cuota cercana |
| Error | Operación fallida que requiere investigación | Job agotado, dependencia inaccesible |
| Fatal | Proceso no puede cumplir invariantes y debe detenerse | Configuración inválida o corrupción detectada |

Un fallo esperado de validación de usuario no es Error operacional. Una violación de seguridad puede ser Warn o Error según impacto y además crear señal de auditoría.

### 17.3 Correlación

El identificador de correlación nace en el borde o en el scheduler y se propaga por llamadas, outbox, jobs y Runner. `causationId` enlaza cada efecto con su comando/evento. Los workers crean spans hijos, no cadenas desconectadas. Los identificadores provenientes del cliente se validan y no se confían como autoridad.

### 17.4 Auditoría

AuditLog es distinto del log operacional. Registra quién, qué, sobre qué recurso, cuándo, motivo, resultado, antes/después seguro y correlación para:

- autenticación y cambios de privilegio;
- publicación, retiro, incidentes y overrides;
- activación de políticas/flags;
- accesos a payload restringido;
- generación IA y revisión;
- exportación, anonimización y administración de datos;
- despliegues, restauraciones y break-glass.

La auditoría es append-only, con acceso mínimo, retención protegida y alertas ante huecos. No depende de que el agregador de logs esté disponible.

## 18. Observabilidad y monitoreo

### 18.1 Modelo de señales

Se adoptan logs, métricas y trazas correlacionadas bajo convenciones OpenTelemetry. Cada señal responde una pregunta distinta: el log explica un hecho, la métrica cuantifica comportamiento y la traza muestra causalidad/latencia. Ninguna sustituye auditoría.

### 18.2 Métricas por nivel

**Plataforma:** CPU, memoria, filesystem, I/O, temperatura/estado del NAS cuando esté disponible, red, reinicios y presión de volumen.

**Contenedores:** disponibilidad, uso, throttling, OOM, restart count y health status.

**API/Web:** throughput, error rate, latencias percentiles, conexiones, render/cache y Core Web Vitals.

**PostgreSQL:** conexiones, pool wait, transacciones, locks, slow queries, vacuum, tamaño, replica lag futuro y éxito de backup.

**Redis/colas:** memoria, evictions, hit rate, jobs activos/pendientes, backlog age, retry y dead letters.

**Runner:** cola, duración, timeout, límite de memoria, rechazos, aislamiento y capacidad.

**IA:** latencia, tokens, costo, reuse, rechazo, reparación, score, backlog y cache, según `AI_ENGINE_SPEC.md`.

**Salud pedagógica:** eventos procesados, lag de Mastery/Review, reconciliaciones, falsos estados e incidentes; nunca se usan como diagnóstico individual operacional.

### 18.3 Health checks

- **Liveness:** el proceso puede continuar; no consulta todas las dependencias.
- **Readiness:** puede aceptar trabajo de su clase; considera dependencias críticas y migración compatible.
- **Startup:** concede tiempo a carga/configuración sin reinicios prematuros.
- **Deep diagnostic:** consulta autenticada para operadores; no se expone al balanceo ni revela secretos.

La caída de una dependencia no crítica produce estado degradado. Por ejemplo, Gemini indisponible afecta generación, no readiness del aprendizaje publicado.

### 18.4 Trazas

Se trazan flujos críticos de borde a persistencia y de outbox a consumidor. Se muestrea por riesgo: errores, latencias anómalas y operaciones administrativas tienen mayor prioridad. No se incorporan payloads sensibles a atributos o baggage.

### 18.5 Alertas y SLO

Cada alerta tiene síntoma, impacto, severidad, propietario, runbook y condición de cierre. Se alerta por experiencia o riesgo, no por cada excepción. Los SLO definitivos se fijan tras baseline del hardware; se hereda el objetivo inicial de API interactiva p95 inferior a 500 ms, excluyendo IA y Runner, sin convertirlo en promesa antes de medir carga real.

Indicadores críticos:

- incapacidad de autenticar o iniciar práctica;
- Evidence/Outbox lag que vuelve obsoleto el dominio;
- Review scheduler detenido;
- publicación inconsistente o incidente severo;
- backup fallido o restauración no verificada;
- volumen próximo a agotarse;
- aumento sostenido de 5xx, timeouts o dead letters;
- Runner con señal de aislamiento violado;
- gasto de IA fuera de presupuesto.

### 18.6 Reconciliación

Jobs periódicos comparan outbox, proyecciones, balances y agendas contra sus fuentes. La reconciliación corrige estados derivados mediante reconstrucción o compensación; nunca edita hechos para “hacer cuadrar” métricas.

## 19. Arquitectura de seguridad

### 19.1 Modelo de confianza

Todo input, cookie, archivo, evento externo, respuesta de IA, código de estudiante y configuración no firmada es no confiable. La confianza se obtiene por autenticación, autorización, validación de integridad y procedencia, no por ubicación en red.

Controles siguen defensa en profundidad: borde, aplicación, módulo, persistencia, contenedor, host y operación. Un reverse proxy o CORS nunca sustituye autorización del caso de uso.

### 19.2 Autenticación y sesiones

- Correo/contraseña con Argon2id y parámetros versionados.
- Sesiones opacas, aleatorias, revocables y rotadas tras autenticación o cambio de privilegio.
- Cookie `HttpOnly`, `Secure`, `SameSite` acorde al flujo, scope mínimo y expiración explícita.
- Token de sesión nunca en URL, logs, `localStorage` ni `sessionStorage`.
- Verificación y recuperación con tokens hash, cortos, expirables y de un uso.
- Respuestas resistentes a enumeración de cuentas.
- MFA obligatorio para roles administrativos antes de exposición productiva externa.
- Revocación global ante cambio de credencial o incidente según política.

### 19.3 Autorización

RBAC establece roles base; políticas por acción, recurso, estado y ownership refinan acceso. Denegación por defecto. Cada caso de uso autorizado recibe actor y alcance explícitos. La UI solo refleja permisos; no los impone.

Acciones de alto riesgo exigen step-up/reautenticación, separación de funciones o doble aprobación: publicación masiva, cambio de política académica, acceso a respuestas crudas, break-glass y restauración sobre producción.

### 19.4 CSRF, CORS y sesión web

Las mutaciones autenticadas por cookie usan token anti-CSRF ligado a sesión, validación de origen y métodos seguros. `SameSite` es defensa adicional, no única. CORS usa allowlist exacta por ambiente, sin reflejar orígenes arbitrarios ni combinar credenciales con comodines. Solicitudes no navegador siguen autenticación y autorización completas.

### 19.5 Headers y seguridad del navegador

El reverse proxy y Web aplican HTTPS integral, HSTS cuando el dominio esté preparado, CSP estricta y progresivamente endurecida, protección de MIME sniffing, política de referrer, permisos del navegador mínimos y protección de framing. Recursos ejecutables provienen de orígenes aprobados; dependencias externas se minimizan.

Contenido pedagógico y generado se renderiza como datos mediante componentes permitidos. HTML arbitrario, scripts y URLs activas no atraviesan el pipeline de contenido.

### 19.6 Validación

- Inputs se validan en el borde del caso de uso con allowlists y schemas versionados.
- Campos desconocidos se rechazan en operaciones sensibles.
- Tamaño, profundidad, frecuencia y tiempo tienen límites.
- Identificadores se resuelven con autorización contextual; evitar referencia directa insegura.
- Salidas se codifican según contexto para impedir XSS.
- Prisma parametriza persistencia, pero no reemplaza validación ni autorización.
- Archivos validan tipo real, tamaño, hash, malware cuando aplique y almacenamiento fuera de rutas ejecutables.

### 19.7 Rate limiting y abuso

El límite combina IP, identidad, sesión, acción y costo. Auth, recuperación, Runner, IA, exportaciones y administración tienen políticas específicas. Redis coordina, pero ante su caída se aplica degradación segura local o rechazo de operaciones costosas; nunca se abre acceso ilimitado por defecto.

Se distinguen abuso humano, job interno y reintento idempotente. Los límites no penalizan permanentemente errores legítimos ni mezclan rate limiting con dominio pedagógico.

### 19.8 Secretos

Secretos se suministran por mecanismo del NAS/Compose con acceso por servicio, preferentemente como archivos de secretos o gestor compatible en vez de variables ampliamente visibles. Cada secreto tiene propietario, propósito, consumidores, creación, rotación, revocación, expiración y procedimiento de emergencia. Nunca se construye dentro de una imagen ni se comparte con Web/Runner.

Backups que contengan secretos o datos personales se cifran y separan de sus claves. El procedimiento break-glass se prueba y audita.

### 19.9 Runner

El Runner se considera hostil por diseño:

- proceso y usuario sin privilegios;
- filesystem efímero y de solo lectura salvo workspace temporal;
- sin red por defecto;
- sin socket Docker, DB, Redis, secretos o montajes del host;
- límites de CPU, memoria, procesos, tiempo, salida y almacenamiento;
- imagen/runtime allowlisted y fijado;
- limpieza por ejecución;
- cola, concurrency y kill externo;
- logs sanitizados y truncados;
- actualización y pruebas de escape independientes.

Si el NAS no ofrece aislamiento suficiente para código no confiable, Runner debe ejecutarse en otro host antes de abrir la plataforma a usuarios no confiables. Esta condición no se compensa con validación de código.

### 19.10 Seguridad de IA

Se heredan Intent Guard, Context Integrity Guard, cuarentena, minimización, validadores, ausencia de tools y revisión humana de `AI_ENGINE_SPEC.md`. El módulo AI Content no tiene credenciales de usuario, no accede a Mastery individual para generación canónica y no puede publicar.

### 19.11 Seguridad de cadena de suministro

- Lockfile e imágenes base fijadas por digest/version controlada.
- SCA, SAST, secret scanning y análisis de imágenes en CI.
- SBOM y procedencia de build para releases.
- Dependencias nuevas requieren necesidad, licencia, mantenimiento y riesgo.
- Actualizaciones de seguridad siguen severidad y ventana definida.
- CI no expone secretos a contribuciones no confiables.

### 19.12 Privacidad

Minimización, purpose limitation, retención por categoría, exportación y anonimización coordinada. Analítica y logs usan IDs pseudónimos. Producción no se copia a ambientes inferiores sin proceso aprobado de anonimización. Las respuestas de estudiantes y prompts crudos tienen acceso/retención restringidos.

## 20. Estrategia de pruebas

### 20.1 Principio

Las pruebas se asignan al lugar más barato que pueda detectar el riesgo con confianza. La cobertura se evalúa por invariantes, ramas críticas y capacidad de prevenir regresiones, no por porcentaje global.

### 20.2 Unitarias

Responsables: equipo propietario del módulo.

Cubren Value Objects, políticas, agregados, clasificación, cálculo, selección, validadores y transformaciones puras. Mastery, Review, publicación, autorización, idempotencia y gamificación requieren casos extremos y pruebas de propiedad.

No mockean detalles internos indiscriminadamente. Usan fakes solo en puertos relevantes como reloj o repositorio.

### 20.3 Integración

Cubren adaptadores reales y límites:

- repositorios contra PostgreSQL compatible;
- transacciones, concurrencia y outbox;
- Redis, locks, cache y cola;
- adapters de proveedor mediante servidor controlado/fixtures;
- Runner bajo límites;
- almacenamiento y notificaciones;
- migraciones sobre snapshots representativos.

Una base en memoria no sustituye PostgreSQL para semántica transaccional.

### 20.4 Contratos

- Contrato público de cada módulo.
- Eventos productor–consumidor por versión.
- Contrato Web–backend derivado de OpenAPI heredado, sin duplicación manual.
- LLM Gateway y proveedores.
- Exercise Type entre renderer, evaluator y Runner.
- Schemas de contenido y publicación.

Los contract tests son obligatorios antes de extraer un servicio.

### 20.5 End-to-end

Recorridos mínimos:

- registro, verificación, login, revocación y recuperación;
- onboarding y catálogo;
- lección, 30 ejercicios, hints, explicación y reanudación;
- quiz sin pistas;
- actualización explicable de dominio;
- repaso vencido y recuperación;
- dashboard y filtros;
- generación IA, validación, revisión y publicación administrativa;
- incidente y rollback de contenido;
- accesibilidad por teclado y estados de error.

E2E no reemplaza unitarias y debe usar datos deterministas, aislados y limpiables.

### 20.6 Smoke tests

Después de desplegar se verifica: TLS/borde, readiness, autenticación, lectura de publicación vigente, creación de intento, proceso de outbox, worker, consulta de dominio y backup status. IA y Runner tienen smoke separados que no bloquean aprendizaje si están degradados, salvo que el release los modifique.

### 20.7 Pruebas especializadas

- Accesibilidad automática más recorridos manuales WCAG 2.2 AA.
- Rendimiento y capacidad sobre hardware equivalente al NAS.
- Seguridad: autorización matricial, CSRF, session fixation, rate limit, secret scan y aislamiento Runner.
- Resiliencia: dependencia caída, reentrega, eventos tardíos, dead letters y almacenamiento lleno.
- Backups: restauración periódica en entorno aislado y verificación funcional.
- IA: golden datasets, adversarial suites y comparación de modelos/prompts.
- Pedagogía: simulación temporal, calibración y shadow mode.

### 20.8 Responsabilidad de fallos

Quien cambia un módulo mantiene sus pruebas unitarias/integración. Quien cambia contrato actualiza contract tests y consumidores. Platform/Operations mantiene smoke, restore y resiliencia. Seguridad mantiene threat scenarios junto a cada propietario. QA facilita estrategia; no es dueño exclusivo de calidad.

## 21. Flujo de desarrollo

### 21.1 Ambientes

| Ambiente | Propósito | Datos | Promoción |
|---|---|---|---|
| Local | Desarrollo rápido y aislado | Fixtures/sintéticos | Commit/PR |
| Test CI | Verificación reproducible | Efímeros | Checks obligatorios |
| Preview | Revisión de cada cambio relevante | Sintéticos, sin PII | Aprobación de PR |
| Staging | Ensayo integrado y operativo | Representativos anonimizados | Release candidate |
| Production | Usuarios reales | Autoridad | Despliegue aprobado |

### 21.2 Estrategia de ramas

Trunk-based development con `main` protegida y ramas cortas por cambio. No se mantienen ramas ambientales permanentes ni largas divergencias. Pull request pequeño, objetivo único, requisito trazado y riesgo explícito.

Hotfix parte del release productivo, pasa verificaciones proporcionales y vuelve a `main`; no se parchea solo el NAS. Releases usan tags inmutables y changelog derivado.

### 21.3 Revisión

Cada PR declara:

- alcance y requisito/ADR;
- módulos y datos afectados;
- cambio de contrato/evento/política;
- seguridad, privacidad y migración;
- pruebas y evidencia;
- observabilidad añadida;
- impacto de despliegue/rollback;
- capturas y accesibilidad para UI.

CODEOWNERS exige propietario de módulo. Cambios de Mastery, seguridad, publicación, IA, Runner o migraciones necesitan revisión especializada.

### 21.4 Convenciones

Se heredan TypeScript estricto, nombres de código en inglés, archivos kebab-case y Conventional Commits recomendado. Eventos se nombran en pasado; casos de uso como intención; booleanos por semántica. Un nombre genérico como `manager`, `helper`, `common` o `utils` exige precisión antes de merge.

## 22. Integración y entrega continua

### 22.1 Pipeline de pull request

Orden conceptual:

1. Validar formato, lint, tipos y límites de importación.
2. Ejecutar unitarias y contract tests.
3. Ejecutar integración con dependencias efímeras.
4. Analizar secretos, dependencias, código e imágenes cuando aplique.
5. Construir todas las composition roots afectadas.
6. Ejecutar E2E/smoke relevantes.
7. Publicar preview y evidencia de revisión cuando corresponda.

Los checks obligatorios no se omiten por urgencia; un proceso de excepción tiene actor, motivo, alcance y seguimiento.

### 22.2 Pipeline de release

- construir una sola vez artefactos/imágenes inmutables;
- identificar commit, versión, digest y SBOM;
- promover el mismo artefacto por staging y producción;
- ensayar migraciones compatibles y restore precondicionado;
- obtener aprobación requerida;
- desplegar, verificar smoke y observar ventana;
- registrar release y resultado.

No se reconstruye en el NAS ni se instala dependencia en producción.

### 22.3 Migraciones

Forward-only con expand → migrate/backfill → switch → contract. La versión nueva debe convivir temporalmente con la anterior cuando se requiera rollback. Backfills son jobs reanudables, observables y limitados. No se usa down migration destructiva como estrategia principal.

## 23. Arquitectura de despliegue en NAS

### 23.1 Topología

El despliegue inicial usa Docker Compose en un solo NAS:

> Internet o red privada
> → firewall/router
> → reverse proxy con TLS
> → Web y API
>
> API
> → PostgreSQL / Redis
> → Runner mediante canal restringido
>
> Worker
> → PostgreSQL / Redis
> → Gemini / proveedor de notificaciones
>
> Todos los procesos autorizados
> → telemetría interna

### 23.2 Contenedores

- `reverse-proxy`: única entrada publicada.
- `web`: Next.js, sin secretos de backend.
- `api`: casos de uso interactivos.
- `worker`: outbox, jobs, scheduler, IA, analytics y notificaciones; puede dividirse por perfil futuro.
- `runner`: aislamiento de ejecución.
- `postgres`: autoridad durable.
- `redis`: coordinación efímera.
- `telemetry-collector`: recepción y exportación de señales.
- `metrics/logs/dashboard`: perfil operacional según capacidad del NAS.
- `backup-agent`: perfil restringido para respaldos verificados.

Herramientas administrativas no quedan siempre expuestas; se habilitan por perfil y red privada.

### 23.3 Redes

| Red lógica | Miembros | Regla |
|---|---|---|
| Edge | reverse proxy, Web/API por lado de entrada | Solo proxy publica puertos del host |
| Application | API, Worker y servicios internos necesarios | Sin acceso público directo |
| Data | API, Worker, PostgreSQL, Redis, backup autorizado | Runner y Web no pertenecen |
| Runner control | API/Worker dispatcher y Runner | Sin ruta hacia Data; egress denegado |
| Observability | collector y emisores | Acceso de escritura/lectura separado |

La segmentación Compose reduce superficie, pero el host único sigue siendo un dominio de confianza. Firewall del NAS refuerza, y el socket Docker no se monta en aplicaciones.

### 23.4 Persistencia

Volúmenes explícitos y documentados para PostgreSQL, Redis solo si la estrategia de cola lo requiere, certificados, observabilidad y backups. Los artefactos aceptados y assets grandes pueden usar almacenamiento de objetos/volumen dedicado con hash y metadata en PostgreSQL.

El código vive en imágenes inmutables; no se monta desde el host en producción. Datos temporales usan storage efímero. Cada volumen declara propietario, criticidad, backup, cifrado, crecimiento y restauración.

### 23.5 Recursos y aislamiento

Cada servicio tiene límites/reservas acordes al NAS. PostgreSQL, Runner y Worker de IA no pueden competir sin control. Se fijan concurrency y backpressure antes que permitir swap/OOM generalizado. Runner posee los límites más estrictos y puede trasladarse a otro host.

Los contenedores ejecutan usuario no-root, filesystem read-only donde sea viable, capabilities mínimas y health checks. Se evalúa Docker rootless si el NAS y sus requisitos lo soportan; no se promete sin inventario de hardware/OS.

### 23.6 Configuración Compose

Una definición base expresa topología común; overlays específicos ajustan ambiente, recursos, logging, exposición y replicas. Los secretos se conceden por servicio. Las versiones de imagen se fijan; `latest` no es release. El resultado de configuración se valida en CI antes de despliegue.

## 24. Backups y recuperación

### 24.1 Estrategia 3-2-1

Se mantienen al menos tres copias, en dos medios o dominios distintos, una fuera del NAS. RAID o snapshot del NAS no es backup. La copia off-site está cifrada, con acceso y retención independientes.

### 24.2 PostgreSQL

- Backup lógico/físico según capacidad y objetivos.
- Consistencia verificada, cifrado y checksums.
- Retención diaria/semanal/mensual definida.
- Restauración automatizada en ambiente aislado.
- Prueba funcional posterior: esquema, publicación, intentos, evidencia y sesiones.
- Registro de duración y punto recuperable.

Objetivos heredados para piloto privado: RPO de 24 horas y RTO de 4 horas. Antes de uso comercial se revisan con volumen, costo y SLA.

### 24.3 Otros datos

- Assets: backup por hash y manifest.
- Configuración no secreta: repositorio/versionado.
- Secretos: mecanismo separado, cifrado y break-glass.
- Redis: reconstruible; persistencia solo si la cola elegida lo exige y nunca sustituye fuentes.
- Telemetría: retención propia; su pérdida no impide restaurar negocio.

### 24.4 Restore drills

Una copia no se considera válida hasta restaurarla. Se ensaya al menos con periodicidad definida y después de cambios de almacenamiento/migración. El runbook mide tiempo real, dependencias, credenciales de emergencia y reconciliación. El resultado crea evidencia auditable y acciones correctivas.

## 25. Actualizaciones, rollback y continuidad

### 25.1 Despliegue

1. Verificar capacidad, backup reciente y compatibilidad.
2. Aplicar fase expand de migración.
3. Desplegar release candidate ya probado.
4. Esperar readiness y ejecutar smoke.
5. Observar errores, latencia, jobs y consistencia.
6. Completar switch/backfill según plan.
7. Mantener versión anterior durante ventana de rollback.

En un NAS con recursos suficientes se prefiere blue/green para Web/API. Si no, reemplazo secuencial con ventana breve y comunicación. Worker scheduler usa liderazgo/locks para evitar doble ejecución durante superposición.

### 25.2 Rollback

Rollback restaura imágenes/configuración anterior compatible. No intenta revertir destructivamente datos. Si la nueva versión ya escribió un formato aditivo, la anterior debe tolerarlo durante la ventana. Publicaciones de contenido regresan a un manifest compatible, sin borrar versiones.

### 25.3 Modos degradados

| Falla | Servicio conservado |
|---|---|
| Gemini caído | Aprendizaje completo con contenido publicado; autoría en cola |
| Redis caído | Lecturas DB y funciones esenciales; jobs/rate limits degradan de forma segura |
| Worker caído | Interacción básica; analytics, review recalculation y jobs acumulan outbox |
| Runner caído | Ejercicios ejecutables se pausan o usan alternativa válida; no se adivina evaluación |
| Observabilidad caída | Negocio continúa con buffer/límites; auditoría crítica persiste |
| PostgreSQL caído | Plataforma no acepta escritura ni presenta estado potencialmente falso |
| NAS caído | Servicio indisponible hasta recuperación; backup externo protege datos |

## 26. Escalabilidad y evolución

### 26.1 Más usuarios en el mismo NAS

Primero medir y optimizar: índices, N+1, pool, cache de contenido publicado, proyecciones, batch, límites y carga de assets. API/Web/Worker permanecen stateless y pueden tener más procesos si CPU/memoria lo permiten. Runner y AI workers usan colas con concurrency independiente.

### 26.2 Más usuarios en varios servidores

El reverse proxy se reemplaza o complementa con balanceo. API/Web/Workers se replican; sesiones, DB, cache y cola permanecen externas. PostgreSQL migra a host/servicio redundante con backups y failover; Redis a topología adecuada. NAS puede permanecer como almacenamiento secundario, no como único nodo.

### 26.3 Más IA

Separar perfiles de workers por generación, embeddings y validación; cuotas y backpressure por proveedor. AI Content puede extraerse cuando seguridad, gasto o throughput lo justifiquen. Need Key, Gateway, jobs y eventos ya forman el contrato de separación.

### 26.4 Más disciplinas y contenido

Discipline Packs y Content Type Packs amplían datos, evaluadores y renderers sin condicionales globales. Curriculum/Content se versionan. Assets grandes pasan a object storage/CDN. Search puede extraerse cuando catálogo y consultas lo requieran.

### 26.5 Más estadísticas

Analytics consume eventos y crea nuevas proyecciones sin tocar captura. Cuando PostgreSQL operacional no alcance, outbox/CDC alimenta un almacén columnar. El dashboard cambia su adaptador de lectura; EvidenceEvent y fuentes siguen en el sistema transaccional.

### 26.6 Más servicios y equipos

La secuencia de extracción es:

1. Confirmar límite, propietario y necesidad medida.
2. Congelar contrato público y pruebas.
3. Crear inbox/outbox e idempotencia.
4. Asignar ownership de datos exclusivo.
5. Ejecutar adaptador remoto en shadow/canary.
6. Migrar consumidores y datos con reconciliación.
7. Retirar adaptador local.

Nunca se extrae compartiendo tablas. Cada servicio nuevo paga explícitamente autenticación entre servicios, observabilidad, resiliencia, versionado y operación.

### 26.7 Señales para no escalar todavía

- El problema se resuelve con un índice o proyección.
- No existe equipo/propietario independiente.
- La disponibilidad requerida es la misma.
- El volumen no supera capacidad medida.
- El módulo comparte transacciones frecuentes con el núcleo.
- La extracción solo “se ve más profesional”.

## 27. Mantenibilidad a largo plazo

### 27.1 Presupuestos arquitectónicos

- Cero ciclos entre módulos.
- Public surfaces pequeños y revisados.
- Sin imports de infraestructura en domain/application.
- Sin escritura cruzada.
- Sin eventos sin versión/propietario.
- Sin flags permanentes sin fecha de retiro.
- Sin dependencias nuevas sin evaluación.
- Sin abstracción compartida sin dos usos legítimos o frontera volátil demostrada.

### 27.2 Pruebas arquitectónicas

CI verifica capas, módulos, imports permitidos, ausencia de dependencias de apps, tamaño del shared kernel y contracts. Estas pruebas convierten diagramas en reglas ejecutables sin depender solo de revisión humana.

### 27.3 Gestión de deuda

La deuda se registra con contexto, impacto, riesgo, propietario, condición de activación y fecha de revisión. No se usa “TODO” como sistema de planificación. Una excepción arquitectónica caduca o se convierte en ADR.

### 27.4 Evolución de contratos

Compatibilidad, deprecación y ventana de soporte se definen para eventos, módulos, contenido y frontend-backend. Los consumidores se inventarían y prueban antes de retirar una versión. Los contratos internos no se cambian por refactor accidental.

### 27.5 Ownership de equipo

Cada módulo, documento, dashboard y runbook tiene propietario primario y suplente. Ownership significa responsabilidad de evolución, calidad, operación e incidentes; no monopolio de cambios.

## 28. Documentación viva

### 28.1 Documentos obligatorios

- Especificaciones rectoras: Master, Database, Learning, AI y System Architecture.
- ADR indexados con estado y supersesión.
- Vistas C4: contexto, contenedores, componentes críticos y despliegue.
- Mapa/matriz de módulos y ownership.
- Catálogo de eventos y contratos públicos.
- Modelo de amenazas, clasificación de datos y matriz de autorización.
- Estrategia de pruebas y golden datasets.
- Runbooks: deploy, rollback, backup, restore, incidentes, dead letters, rotación y capacidad.
- Inventario de dependencias, licencias, imágenes y SBOM por release.
- SLO, dashboards, alertas y postmortems.
- Registro de migraciones y compatibilidad.
- Guía de contribución y convenciones.

### 28.2 Cambios que obligan a actualizar documentación

- Nuevo módulo, dependencia o evento.
- Cambio de ownership o límite transaccional.
- Nuevo deployable, red, volumen o secreto.
- Cambio de autenticación/autorización/retención.
- Nueva política pedagógica, de IA o publicación.
- Cambio incompatible de contrato/schema.
- Extracción a servicio o cambio de datastore.
- Nuevo SLO, alerta o procedimiento operativo.
- Incidente que revele supuesto incorrecto.
- Nueva disciplina, tipo de ejercicio o modalidad con arquitectura distinta.

La actualización forma parte del mismo PR y Definition of Done. Un diagrama sin propietario ni fecha de revisión no es fuente de verdad.

## 29. Riesgos arquitectónicos

| Riesgo | Señal | Mitigación |
|---|---|---|
| Monolito modular se degrada | Imports cruzados y repositorios compartidos | Public surfaces, tests arquitectónicos y CODEOWNERS |
| Administration se vuelve supermódulo | Dominio depende de consola | Dependencia solo entrante y facades |
| Shared kernel crece | Cambios globales frecuentes | Presupuesto y revisión de cada export |
| Eventos reemplazan diseño | Todo es eventual y difícil de rastrear | Criterios síncrono/evento y catálogo |
| Outbox se acumula | Proyecciones obsoletas | Métricas, backpressure, replay y alertas |
| PostgreSQL compartido permite bypass | Escrituras directas | Repositorios privados, reglas de importación y auditoría |
| Redis tratado como autoridad | Pérdida/corrupción tras reinicio | TTL, reconstrucción y verificación DB |
| Runner compromete NAS | Escape o acceso lateral | Red aislada, límites y host separado si es necesario |
| NAS satura recursos | OOM, I/O alto, latencia | Presupuestos, colas, capacity plan y offload |
| Backup no restaurable | RPO/RTO ficticios | Restore drills y copia off-site |
| Secretos filtrados | Logs/env/CI | Secrets por servicio, escaneo, rotación y mínimo privilegio |
| Migración impide rollback | Downtime prolongado | Expand/migrate/contract y compatibilidad |
| Microservicios prematuros | Operación supera valor | Extraction scorecard basada en métricas |
| Frontend duplica dominio | Divergencia de decisiones | Backend autoridad y contracts tipados |
| Observabilidad captura PII | Riesgo de privacidad | Redacción, allowlist de atributos y retención |

## 30. Criterios de aceptación de la arquitectura

La arquitectura será conforme cuando:

1. Los cuatro documentos rectores permanecen trazables y ninguna invariante se relaja.
2. Cada dato y decisión posee un único módulo propietario.
3. No existe dependencia circular ni escritura cruzada.
4. Domain/Application no dependen de frameworks o infraestructura.
5. API y Worker reutilizan el mismo núcleo sin importarse entre sí.
6. Administration solo orquesta public facades.
7. La matriz de dependencias se valida automáticamente.
8. Cada evento tiene propietario, versión, propósito y consumidores.
9. Outbox e idempotencia protegen efectos asíncronos.
10. Ninguna llamada externa vive dentro de una transacción DB.
11. Web no contiene reglas académicas ni credenciales accesibles a JavaScript.
12. PostgreSQL es autoridad y Redis es degradable/reconstruible.
13. Runner no alcanza Data, secretos ni socket Docker.
14. IA permanece fuera del camino crítico y sin autoridad.
15. Logs, métricas y trazas se correlacionan sin payload sensible.
16. Auditoría crítica persiste separada de logs.
17. Auth, autorización, CSRF, CORS, headers y rate limiting tienen defensa por capas.
18. Pruebas unitarias, integración, contratos, E2E, smoke, seguridad y restore cubren sus riesgos.
19. El pipeline promueve el mismo artefacto inmutable.
20. Migraciones preservan compatibilidad y rollback.
21. Compose expone únicamente reverse proxy y segmenta redes.
22. Datos durables viven fuera de capas de contenedor.
23. Backups 3-2-1 se restauran periódicamente.
24. Los modos degradados no fabrican resultados académicos.
25. La extracción futura no requiere compartir base ni reescribir contratos.
26. La documentación se actualiza en el mismo cambio.

## 31. Referencias técnicas de fundamento

- OWASP Cheat Sheet Series. [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- OWASP Cheat Sheet Series. [Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- OWASP Cheat Sheet Series. [Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).
- OWASP Cheat Sheet Series. [Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- OpenTelemetry. [Signals](https://opentelemetry.io/docs/concepts/signals/).
- Docker. [Use Compose in production](https://docs.docker.com/compose/how-tos/production/).
- Docker. [Manage secrets securely in Docker Compose](https://docs.docker.com/compose/how-tos/use-secrets/).
- Docker. [Volumes](https://docs.docker.com/engine/storage/volumes/).
- Docker. [Rootless mode](https://docs.docker.com/engine/security/rootless/).

## Architecture Decision Records (ADR)

### ADR-SA-001 — Adoptar Modular Monolith con composition roots separados

**Estado:** propuesto para aprobación.

**Contexto.** El dominio requiere transacciones fuertes, equipo inicial pequeño y operación en NAS. A la vez necesita API, jobs y Runner con perfiles distintos.

**Decisión.** Un monolito modular contiene el dominio y casos de uso. Web, API, Worker y Runner son composition roots/procesos, no microservicios de negocio. API y Worker ensamblan módulos desde `packages/server`.

**Alternativas descartadas.** Microservicios desde el inicio; monolito tradicional; un único proceso para toda carga.

**Consecuencias.** Menor complejidad operativa y transaccional; exige límites de importación, ownership y pruebas arquitectónicas. Runner conserva aislamiento independiente.

### ADR-SA-002 — Administración es adaptador entrante, no dependencia del dominio

**Estado:** propuesto para aprobación.

**Contexto.** El modelo previo lista Administration en algunas dependencias permitidas de módulos. Interpretarlo como dependencia técnica produciría un supermódulo del que dependen Curriculum, Content o Configuration.

**Decisión.** Administration compone workflows e invoca facades públicas. Los módulos nunca importan Administration. Las entidades administrativas propias se limitan a bandejas, asignaciones y coordinación; la decisión final permanece en el propietario.

**Alternativas descartadas.** Service layer administrativo central; acceso directo de la consola a repositorios/tablas.

**Consecuencias.** Se invierte una dependencia implícita sin cambiar ownership conceptual. Los casos de uso siguen accesibles por interfaces autorizadas no administrativas.

### ADR-SA-003 — Separar Evaluation como módulo interno de Practice

**Estado:** propuesto para aprobación.

**Contexto.** Practice posee intentos, pero evaluadores, rúbricas, runtimes y coordinación Runner crecerán por disciplina y riesgo.

**Decisión.** Practice es dueño de la experiencia y submission. Evaluation es dueño de producir `EvaluationResult` reproducible mediante tipos/evaluadores versionados. Permanece módulo interno del monolito y su transacción se coordina desde el caso de uso.

**Alternativas descartadas.** Mantener toda evaluación dentro de Practice; crear microservicio de evaluación inicial.

**Consecuencias.** Clarifica extensión disciplinar y seguridad. Requiere contrato fuerte y evita que Evaluation calcule Mastery.

### ADR-SA-004 — Monorepo con dominio backend compartido por composition roots

**Estado:** propuesto para aprobación.

**Contexto.** API y Worker necesitan las mismas reglas, pero importar una aplicación desde otra crea acoplamiento y duplicarlas crea divergencia.

**Decisión.** `apps` contiene solo deployables; `packages/server` contiene módulos backend; `packages/contracts` contiene contratos estables sin dominio.

**Alternativas descartadas.** Reglas dentro de `apps/api`; copiar módulos a Worker; paquetes publicados independientes desde el inicio.

**Consecuencias.** Build graph y boundaries más claros. Debe evitarse que `packages/server` se convierta en paquete monolítico sin fronteras internas.

### ADR-SA-005 — Comunicación híbrida: síncrona local para decisión, eventos para efectos

**Estado:** propuesto para aprobación.

**Contexto.** Usar solo llamadas crea acoplamiento temporal; usar solo eventos vuelve eventual aquello que necesita respuesta inmediata.

**Decisión.** Facades/puertos locales atienden precondiciones y respuestas del caso de uso. Eventos versionados con outbox atienden hechos y efectos tolerantes a eventualidad.

**Alternativas descartadas.** Event bus para todo; acceso directo entre repositorios; broker externo obligatorio desde el MVP.

**Consecuencias.** Menor latencia y complejidad, con proyecciones desacopladas. Requiere catálogo, idempotencia, lag monitoring y reglas claras.

### ADR-SA-006 — PostgreSQL compartido físicamente con ownership lógico estricto

**Estado:** propuesto para aprobación.

**Contexto.** Una base por módulo aumentaría operación/transacciones distribuidas en NAS; una base sin límites permitiría acoplamiento.

**Decisión.** PostgreSQL es una autoridad física inicial. Cada módulo controla sus repositories y escrituras. Los accesos cruzados usan facades, eventos o proyecciones.

**Alternativas descartadas.** Base por módulo desde el inicio; tablas compartidas sin propietario; event sourcing total.

**Consecuencias.** Transacciones locales y backup simple; disciplina reforzada por imports, ownership, migraciones y pruebas. Una extracción futura migra ownership completo.

### ADR-SA-007 — Outbox transaccional y entrega al menos una vez

**Estado:** propuesto para aprobación.

**Contexto.** Persistir un hecho y publicar un evento por separado puede perder efectos. Exactamente una vez distribuido no es una garantía realista.

**Decisión.** Hecho y OutboxEvent se guardan en la misma transacción. Consumers son idempotentes, con inbox/deduplication cuando corresponde y dead-letter observable.

**Alternativas descartadas.** Publicación best-effort después del commit; transacciones distribuidas; promesa de exactly-once.

**Consecuencias.** Consistencia reproducible y replay; agrega lag, almacenamiento y reconciliación operacional.

### ADR-SA-008 — Sesiones opacas en cookies frente a JWT persistente en navegador

**Estado:** aceptado por herencia de `MASTER_SPEC.md`.

**Contexto.** Se requiere revocación, rotación y respuesta simple ante compromiso.

**Decisión.** Tokens opacos almacenados hash en servidor y enviados por cookies seguras. CSRF se protege explícitamente. No se guardan credenciales en Web Storage.

**Alternativas descartadas.** JWT de larga duración en `localStorage`; sesión en URL; autorización solo cliente.

**Consecuencias.** Dependencia de estado servidor/DB-cache y controles CSRF, a cambio de revocación y menor exposición.

### ADR-SA-009 — Runner como frontera de seguridad separable

**Estado:** aceptado por herencia, ampliado.

**Contexto.** Ejecutar código no confiable dentro de API o Worker pone en riesgo datos y NAS.

**Decisión.** Runner es proceso/contenedor mínimo, sin red de datos ni secretos, con límites duros. Si el aislamiento del NAS no es suficiente, se mueve a host dedicado antes de abrir a usuarios no confiables.

**Alternativas descartadas.** Ejecución dentro de API; solo análisis estático; contenedor privilegiado con acceso al daemon.

**Consecuencias.** Mayor complejidad de coordinación y capacidad, pero reduce blast radius. Sigue requiriendo threat testing.

### ADR-SA-010 — Docker Compose en NAS como plataforma inicial, no como HA

**Estado:** aceptado por herencia.

**Contexto.** El objetivo inicial prioriza control y costo, con un único servidor.

**Decisión.** Compose administra topología, redes, secretos y volúmenes sobre NAS. Solo reverse proxy se expone. Backups 3-2-1 y restore drills compensan pérdida de host; no proporcionan alta disponibilidad.

**Alternativas descartadas.** Kubernetes inicial; servicios gestionados obligatorios; instalación manual en host.

**Consecuencias.** Operación comprensible y económica. El host sigue siendo SPOF y debe migrarse ante SLA comercial.

### ADR-SA-011 — Estrategia de despliegue inmutable y migración expand/migrate/contract

**Estado:** propuesto para aprobación.

**Contexto.** Rollback de imagen falla si el schema fue destruido o reinterpretado.

**Decisión.** El mismo artefacto se promueve; migraciones son forward-only y compatibles por fases; rollback usa imagen previa sin down migration destructiva.

**Alternativas descartadas.** Construir en producción; migración big-bang; restaurar DB como rollback habitual.

**Consecuencias.** Cambios pueden requerir varios releases y cleanup posterior, pero reducen downtime y riesgo.

### ADR-SA-012 — OpenTelemetry como convención, auditoría separada

**Estado:** propuesto para aprobación.

**Contexto.** Múltiples procesos y jobs requieren causalidad común; los logs solos no bastan. Auditoría tiene requisitos diferentes.

**Decisión.** Instrumentar logs, métricas y trazas con contexto correlacionado y collector desacoplado. AuditLog permanece persistencia protegida de negocio/seguridad.

**Alternativas descartadas.** Logs de texto por proceso; usar trazas como auditoría; acoplarse directamente a un vendor.

**Consecuencias.** Diagnóstico consistente y portabilidad; exige política de atributos, muestreo y capacidad del NAS.

### ADR-SA-013 — Trunk-based development y promoción del mismo artefacto

**Estado:** propuesto para aprobación.

**Contexto.** Ramas ambientales y reconstrucciones generan divergencia y releases irreproducibles.

**Decisión.** `main` protegida, ramas cortas, tags/releases inmutables y promoción del mismo digest desde staging a producción.

**Alternativas descartadas.** GitFlow con ramas largas; parche manual en NAS; build distinto por ambiente.

**Consecuencias.** Integración frecuente y rollback claro; requiere feature flags controlados y CI confiable.

### ADR-SA-014 — Extracción de servicios solo por evidencia

**Estado:** propuesto para aprobación.

**Contexto.** El sistema debe crecer sin reescritura, pero anticipar microservicios aumenta costo.

**Decisión.** Extraer solo por escala, seguridad, disponibilidad, ownership de equipo o ciclo de despliegue demostrado. Runner, AI Content, Analytics y Notifications son candidatos; Curriculum/Mastery no se separan prematuramente.

**Alternativas descartadas.** Microservicio por módulo; prohibir toda extracción futura.

**Consecuencias.** La arquitectura paga distribución cuando aporta valor. Contratos, ownership y outbox mantienen la opción abierta.

### ADR-SA-015 — Documentación y pruebas arquitectónicas como parte del producto

**Estado:** propuesto para aprobación.

**Contexto.** Los límites escritos se degradan si no acompañan cada cambio ni se verifican.

**Decisión.** Specs, ADR, eventos, diagramas, runbooks y matrices se actualizan en el mismo PR. CI valida dependencias y capas.

**Alternativas descartadas.** Wiki separada sin ownership; documentación al final; confiar solo en revisores.

**Consecuencias.** Mayor costo inicial por cambio, compensado por mantenibilidad, onboarding y prevención de deriva.

---

**Mandato final:** esta arquitectura debe seguir siendo un monolito por despliegue y modular por diseño. Ninguna conveniencia de framework, acceso compartido a PostgreSQL, urgencia operativa o futura distribución puede borrar ownership, autoridad pedagógica, trazabilidad o reversibilidad. Si un cambio no puede asignarse a un módulo, probarse en su frontera, observarse y revertirse, aún no está arquitectónicamente definido.

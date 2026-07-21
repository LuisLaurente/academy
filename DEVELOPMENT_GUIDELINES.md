# DEVELOPMENT_GUIDELINES — Engineering Handbook oficial

| Campo | Valor |
|---|---|
| Estado | Norma de ingeniería obligatoria |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Documentos rectores | `MASTER_SPEC.md`, `DATABASE_DESIGN.md`, `LEARNING_ENGINE_SPEC.md`, `AI_ENGINE_SPEC.md`, `SYSTEM_ARCHITECTURE.md` |
| Audiencia | Toda persona o agente que contribuya al proyecto |
| Exclusiones | Código, pseudocódigo, APIs, diseño de bases de datos e implementación |

## 1. Autoridad y alcance

Este handbook convierte la arquitectura y los estándares heredados en reglas cotidianas de desarrollo. Es obligatorio para código de producto, pruebas, scripts, configuración, documentación, infraestructura y revisiones.

La precedencia es: enmienda aprobada de `MASTER_SPEC.md` > documentos rectores en orden cronológico > este handbook > convenciones locales no documentadas. Una regla de una herramienta nunca prevalece sobre una invariante del proyecto.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** indican obligación, prohibición, recomendación fuerte y opción controlada. Toda excepción a un DEBE/NO DEBE requiere razón, alcance, propietario y fecha de revisión. Si altera arquitectura, seguridad, datos, pedagogía o autoridad de IA, requiere ADR.

### 1.1 Lectura obligatoria antes de contribuir

Antes de modificar el proyecto, el contribuidor debe:

1. Leer los cinco documentos rectores y este handbook.
2. Identificar módulo propietario, contratos y ADR relacionados.
3. Declarar alcance, invariantes y archivos afectados.
4. Detenerse si la petición contradice una especificación.
5. Mantener trazabilidad entre requisito, cambio, pruebas y documentación.

### 1.2 Inconsistencias y ADR

No se detectó una inconsistencia bloqueante entre los documentos rectores para estas normas. Los ADR ya propuestos continúan sujetos a su proceso de aprobación; este handbook no los declara aceptados por repetición. Una futura contradicción se documentará en `docs/adr` y no se resolverá mediante una convención silenciosa.

### 1.3 Matriz de trazabilidad

| Requisito | Norma principal | Secciones |
|---|---|---|
| Filosofía | Jerarquía de calidad y simplicidad | 2 |
| Nomenclatura total | Convención única por artefacto | 4–5 |
| TypeScript | Tipado estricto y modelado explícito | 6 |
| Backend | Responsabilidades por capa/adaptador | 7 |
| Frontend/React | Server-first, features y composición | 8–10 |
| CSS | Tokens, Tailwind y responsive accesible | 11 |
| Imports/dependencias modulares | Orden y límites verificables | 12 |
| Eventos | Hechos versionados, mínimos e idempotentes | 13 |
| Errores/validación | Clasificación, seguridad y autoridad backend | 14–15 |
| Testing | Riesgo, invariantes y contratos | 16 |
| Documentación | Documentos vivos en el mismo cambio | 17 |
| Git/releases | Trunk-based y artefactos inmutables | 18 |
| Performance | Medición antes de optimización | 19 |
| Seguridad | Defensa por capas y mínimo privilegio | 20 |
| Observabilidad | Señales correlacionadas y accionables | 21 |
| Librerías | Evaluación, ownership y retirada | 22 |
| Refactoring/deuda | Cambio seguro y trazable | 23 |
| Definition of Done | Checklist obligatorio | 24 |
| Resumen final | Engineering Principles | Última sección |

## 2. Filosofía de ingeniería

### 2.1 Legibilidad

El código se escribe primero para la próxima persona. Los nombres explican intención; la estructura revela flujo; las abstracciones representan conceptos reales. Se prefiere una solución explícita ligeramente más extensa a una solución ingeniosa que requiera descifrado.

Legibilidad no significa comentarios abundantes. El código expresa el qué; comentarios y documentación explican por qué, restricciones y trade-offs.

### 2.2 Mantenibilidad

Una modificación debe tener impacto predecible, propietario claro y pruebas cercanas. Se preservan boundaries, inmutabilidad histórica, contratos versionados y reversibilidad. Mantenibilidad incluye operación: una capacidad sin logs, runbook o rollback puede funcionar hoy y seguir siendo inmantenible.

### 2.3 Simplicidad

Se implementa la solución más pequeña que cumple las invariantes y deja una evolución razonable. No se agregan patrones, brokers, stores, caches, genéricos, servicios o dependencias por posibilidad futura. Simple no significa frágil: validación, seguridad, idempotencia y auditoría forman parte de la solución mínima correcta.

### 2.4 Consistencia

Una decisión repetida se resuelve de la misma manera. Formato, nombres, errores, tests, eventos y estructura se automatizan cuando sea posible. La consistencia del proyecto prevalece sobre preferencia personal, salvo que un ADR demuestre una mejora y defina migración.

### 2.5 Testabilidad

Las reglas se separan de frameworks, tiempo, red y persistencia. Dependencias no deterministas entran por puertos. Un diseño difícil de probar suele revelar demasiadas responsabilidades o una frontera incorrecta; no se compensa con mocks profundos.

### 2.6 Escalabilidad

Se diseña para ampliar capacidades mediante módulos, contratos y composición, no para anticipar volumen inexistente. Escalabilidad incluye equipo y comprensión, no solo throughput. La extracción a servicios, particionado o cache se decide con evidencia.

### 2.7 Optimización

No se optimiza por intuición. Primero se define la experiencia o presupuesto afectado, después se mide, se identifica el cuello, se cambia una variable y se vuelve a medir. Toda optimización debe conservar claridad o justificar explícitamente el costo de complejidad.

## 3. Reglas universales de código

- TypeScript estricto en todo código aplicable.
- `const` por defecto; `let` solo ante reasignación necesaria; `var` prohibido.
- No se usa `any` salvo boundary legado documentado, aislado y con plan de eliminación.
- Datos externos comienzan como `unknown` y se validan antes de uso.
- Funciones y componentes son puros salvo que su responsabilidad sea un efecto explícito.
- Se prefieren valores inmutables y estructuras `readonly` cuando el consumidor no debe mutar.
- No se silencian errores, promesas, warnings, tipos ni reglas de lint sin justificación local.
- No se usan números, strings de estado, rutas, permisos o timeouts mágicos.
- Fechas de negocio usan UTC y zonas IANA conforme al contrato; no dependen implícitamente del host.
- Dinero, porcentajes, probabilidades, duración e IDs no se representan con primitivos ambiguos dentro del dominio.
- No se mezcla refactor amplio con cambio funcional salvo necesidad demostrada.
- Un archivo exporta una superficie cohesionada; no un catálogo heterogéneo.
- No existen helpers genéricos que escondan reglas de dominio.
- Ningún módulo importa internals, repositorios o infraestructura de otro.

## 4. Convenciones generales de nomenclatura

### 4.1 Idioma y vocabulario

Código, nombres de archivo, contratos y eventos se nombran en inglés. Texto de producto y documentación para el usuario se localizan, inicialmente al español. Se usa el lenguaje ubicuo de los documentos rectores: `mastery`, `retention`, `evidence`, `review`, `publication`, no sinónimos inventados como `progressScore`.

Una misma cosa tiene un solo nombre. Abreviaturas solo si son universales en el dominio o tecnología. `id`, `url`, `api`, `dto` y `xp` son aceptables; abreviaturas locales opacas no.

### 4.2 Archivos

- Todos los archivos propios usan kebab-case.
- Extensión refleja propósito real.
- Un componente `MasteryCard` vive en `mastery-card.tsx`.
- Un hook `useReviewQueue` vive en `use-review-queue.ts`.
- Un caso de uso `RecordExerciseAttempt` vive en `record-exercise-attempt.use-case.ts`.
- Sufijos técnicos se reservan a categorías acordadas; no se acumulan.
- Archivos de convención obligatoria de Next.js, herramientas o plataforma conservan el nombre exigido.
- `index` solo define public surface deliberado de una carpeta; no crea barrels recursivos.

### 4.3 Carpetas

- kebab-case y sustantivo de capacidad: `learning-session`, `content-review`.
- Carpetas feature usan lenguaje de negocio, no tipo técnico global.
- Plural para colecciones de features (`features`, `contracts`); singular para una capacidad concreta.
- No crear carpetas de un único archivo sin boundary, colocalización futura o convención de framework.
- `common`, `shared`, `misc`, `helpers` y `utils` globales están prohibidos como destino por defecto.

### 4.4 Símbolos

| Artefacto | Convención | Regla adicional |
|---|---|---|
| Clase/Componente/Tipo | PascalCase | Sustantivo o concepto claro |
| Función/método | camelCase | Verbo + objeto/resultado |
| Variable/parámetro | camelCase | Sustantivo; incluye unidad si puede ser ambigua |
| Booleano | `is`, `has`, `can`, `should`, `was` | Describe afirmación verdadera |
| Constante real | UPPER_SNAKE_CASE | Solo módulo/global inmutable y semánticamente constante |
| Prop de callback | `on` + evento | Describe notificación hacia consumidor |
| Handler interno | `handle` + evento | Describe reacción local |
| Factory | `create`, `build` o `make` | `create` producto; `build` ensamblaje; `make` solo testing |
| Conversor | `to`, `from` o `map` + destino | Sin efectos ocultos |
| Predicate | `is`, `has`, `can` | Devuelve decisión booleana |

### 4.5 Prohibiciones

- Prefijos húngaros o de tipo (`strName`, `IRepository`).
- Nombres genéricos (`data`, `item`, `value`, `result`, `manager`) fuera de scope mínimo evidente.
- Negaciones dobles (`isNotDisabled`).
- Sufijo `Service` para cualquier clase sin semántica.
- Nombres que prometen más de lo que hacen (`validateAndSaveAndNotify`).
- Numeración temporal (`newService2`, `finalVersion`).

## 5. Nomenclatura por artefacto

### 5.1 Componentes, layouts, pages y hooks

- Componentes: PascalCase, sustantivo visual/semántico; archivo kebab-case.
- Props: `ComponentNameProps`; no `IProps` ni `Props` exportado ambiguo.
- Layout/Page: nombre exportado descriptivo aunque el archivo siga convención App Router.
- Hooks: siempre `use` + capacidad/estado; no ocultar efectos o llamadas arbitrarias bajo un hook con nombre de dato.
- Providers: `CapabilityProvider`; context: `CapabilityContext` solo si es necesario exponerlo.
- Stores: `useCapabilityStore` para acceso y `capability-store.ts` para archivo.

### 5.2 Backend

- Caso de uso: verbo imperativo + objeto, sufijo `UseCase`.
- Application service: solo coordinador cohesionado de varios casos relacionados, sufijo `ApplicationService`.
- Domain service: nombre de política/cálculo; preferir `Policy`, `Calculator`, `Scheduler`, `Selector`, `Classifier` o `Validator` antes de `Service`.
- Repository port: agregado + `Repository`, sin prefijo `I`.
- Implementación: tecnología + agregado + `Repository` o `Adapter`.
- Adapter/Gateway: proveedor/capacidad + `Adapter` o `Gateway`.
- Controller: recurso/capacidad + `Controller`.
- Guard, Pipe, Interceptor, Filter, Middleware y Decorator: capacidad + sufijo exacto.
- Exception de dominio: condición + `Error`; excepción de transporte se mantiene en interfaces.

### 5.3 DTO, contratos y tipos

- DTO de entrada/salida se nombra por intención, nunca por tabla.
- Sufijo `Dto` solo en boundary de transporte; no entra al dominio.
- Comandos/consultas internos: intención + `Command`/`Query` cuando existe bus o contrato real.
- Resultados: caso de uso + `Result` si la forma necesita nombre.
- Interface: contrato de objeto extensible o puerto; nombre semántico sin `I`.
- Type alias: unión, composición, mapping o vocabulario de valor.
- Enum: sustantivo singular; miembros en PascalCase si se autoriza enum real.

### 5.4 Eventos

- Pasado, PascalCase y hecho de dominio: `ExerciseAttemptEvaluated`, no `EvaluateExercise`.
- Archivo kebab-case con versión visible en metadata/contract, no en el nombre humano salvo coexistencia técnica necesaria.
- Payload: `EventNamePayload` dentro del contrato propietario.
- Consumer: acción/propósito + `Handler`, no productor + `Listener` genérico.

### 5.5 Tests

- Unitario: mismo nombre base + `.spec.ts`/`.spec.tsx`.
- Integración: mismo nombre base + `.integration-spec.ts`.
- Contrato: capacidad + `.contract-spec.ts`.
- End-to-end: recorrido + `.e2e-spec.ts`.
- Arquitectura: regla + `.architecture-spec.ts`.
- Fixtures y factories nombran el objeto/escenario, no `testData`.
- Descripciones de test expresan comportamiento observable y condición, no detalles de implementación.

### 5.6 Migraciones, seeds y scripts

Estas reglas nombran artefactos; no diseñan persistencia:

- Migración: timestamp generado por herramienta + acción breve en snake_case según convención de la herramienta. No se renombra tras compartirse.
- El nombre expresa cambio, no ticket ni persona.
- Seed: `seed-<scope>`; separado entre datos base obligatorios y demo/desarrollo.
- Seeds deben ser deterministas, idempotentes cuando corresponda y nunca contener PII o secretos reales.
- Script: verbo-objeto en kebab-case, por ejemplo una acción de verificación, respaldo o reconciliación.
- Scripts destructivos llevan nombre explícito, confirmación, preflight y alcance; nunca se ocultan bajo `setup`.

## 6. TypeScript

### 6.1 Configuración estricta

Todo workspace usa modo estricto y opciones que detecten accesos inseguros, retornos incompletos, imports incorrectos y casos no exhaustivos cuando estén disponibles. Una relajación se hace en el scope mínimo y con issue de retirada.

### 6.2 `const`, `readonly` e inmutabilidad

- `const` para toda binding no reasignada.
- `readonly` comunica que una propiedad, parámetro estructural o colección no debe mutarse desde ese contrato.
- Props, DTOs, eventos, Value Objects, snapshots y contenido publicado deben exponerse como readonly.
- `readonly` no convierte automáticamente un grafo profundo en inmutable; se diseña la frontera completa.
- No usar readonly de forma ornamental en estado que legítimamente muta dentro de su propietario.

### 6.3 `type` e `interface`

Usar `interface` para:

- puertos y contratos orientados a implementación;
- shapes de objeto estables que puedan extenderse intencionalmente;
- props públicas cuando la extensión/composición sea clara.

Usar `type` para:

- unions, intersections controladas, aliases de primitivos/Value Objects;
- discriminated unions;
- mapped/conditional types;
- composición cerrada y tipos derivados.

No alternar por preferencia personal dentro del mismo propósito. Declaration merging no se usa salvo integración deliberada con librería y documentación.

### 6.4 Enums y literal unions

Se prefieren literal unions o constantes `as const` conceptuales para estados serializados, porque mantienen compatibilidad clara y evitan runtime adicional. Un `enum` real se acepta cuando:

- existe necesidad de objeto runtime estable;
- una librería/contrato lo exige;
- el conjunto es cerrado y la semántica supera la alternativa;
- su serialización está definida.

Enums numéricos implícitos están prohibidos en contratos persistidos o externos. No se usa `const enum` si puede romper consumidores/builds aislados.

### 6.5 Union types y discriminated unions

Un estado con variantes mutuamente excluyentes se modela como discriminated union, no como objeto con muchos opcionales/booleanos incompatibles. El discriminante tiene nombre estable y literal. Toda selección debe ser exhaustiva; un nuevo caso debe provocar fallo de typecheck en consumidores incompletos.

No crear unions enormes que mezclen dominios. Si las variantes no comparten ciclo o propietario, pertenecen a contratos distintos.

### 6.6 Utility types

`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record` y equivalentes se usan para derivaciones locales obvias. Se evitan en contratos públicos cuando ocultan qué campos forman el contrato o acoplan un DTO a una entidad interna.

`Partial` nunca representa por sí solo un comando de actualización: los campos permitidos, ausencia, nulabilidad e invariantes deben ser explícitos. Utilities anidadas difíciles de leer se reemplazan por un tipo nombrado.

### 6.7 Generics

Un generic debe expresar una relación real entre dos o más posiciones, preservar información de tipo o permitir una abstracción usada por múltiples casos. Reglas:

- nombre descriptivo si hay más de un parámetro o scope amplio;
- constraints mínimos y significativos;
- defaults solo si la opción común es inequívoca;
- no generic de una sola implementación por anticipación;
- no cascadas de conditional types que requieran descifrado;
- no usar generic para esconder unión de dominio explícita.

### 6.8 Nullabilidad y opcionalidad

`undefined` representa ausencia/no proporcionado en contratos internos; `null` se usa solo cuando el dominio distingue “vacío explícito”. El adaptador traduce representaciones de DB/proveedor. Campos opcionales no significan automáticamente nullable.

Se prohíben non-null assertions salvo boundary donde una invariante ya fue comprobada y el motivo no puede expresarse al compilador; debe documentarse localmente. Optional chaining no debe ocultar una dependencia obligatoria ausente.

### 6.9 Assertions y `unknown`

Toda entrada externa es `unknown`. Se valida y estrecha mediante schema o type guard. Una assertion no valida. Assertions dobles y casts para “hacer compilar” están prohibidos. Los casos inevitables se aíslan en adaptadores y se prueban.

### 6.10 Funciones

- Tipar explícitamente retornos de public surfaces, casos de uso y funciones exportadas críticas.
- Inferencia es preferible para variables/locales evidentes.
- Parámetros de más de tres valores relacionados se agrupan en objeto nombrado.
- No usar booleanos posicionales; usar intención explícita.
- Evitar overloads cuando una discriminated union sea más clara.
- Una función hace una tarea; efectos se ven en nombre y frontera.
- Funciones públicas no devuelven estructuras internas mutables.

### 6.11 Promesas y concurrencia

- Toda promesa se espera, retorna o marca explícitamente como fire-and-forget mediante mecanismo controlado.
- Jobs y eventos no se lanzan informalmente desde un request.
- Operaciones independientes pueden concurrir solo si preservan límites, cancelación y errores.
- No ejecutar llamadas externas dentro de transacciones DB.
- Timeouts, retry e idempotencia pertenecen a policies/adapters, no a cada call site.

## 7. Backend

### 7.1 Controllers

Responsabilidad: traducir transporte a caso de uso y resultado a respuesta. Pueden extraer actor, validar DTO y adjuntar correlación. No contienen reglas, transacciones, queries ORM, selección de repositorio, cálculo de estado ni llamadas directas a proveedores.

Un controller se divide por capacidad coherente, no por número arbitrario de métodos. Su test verifica mapping, autorización declarada y manejo de boundary; las reglas se prueban en application/domain.

### 7.2 Use Cases

Son la unidad primaria de intención. Coordinan autorización contextual, carga de agregados, políticas, transacción, persistencia y outbox. No conocen HTTP, cookies, status codes, Prisma o UI.

Un caso de uso tiene una entrada y resultado explícitos, límite transaccional identificable y efectos observables. Si orquesta demasiadas decisiones de dominios distintos, se divide o se introduce workflow administrativo sin robar ownership.

### 7.3 Services

`Service` no es el destino de lógica sin dueño.

- Application Service agrupa coordinación de casos relacionados cuando una facade lo necesita.
- Domain Service contiene regla pura que no pertenece naturalmente a una entidad/Value Object.
- Infrastructure Service se nombra preferentemente Adapter/Gateway/Client por su rol.

Un service no accede a repositorios de otros módulos ni se convierte en singleton de estado mutable.

### 7.4 Repositories

El puerto pertenece al módulo propietario/consumidor y opera con agregados o read models explícitos. No expone ORM, builders genéricos ni métodos universales de CRUD. Implementación traduce errores técnicos y preserva concurrencia/versiones.

Queries complejas de lectura usan read repositories/projections separados. Un repository no emite eventos ni decide políticas de negocio.

### 7.5 DTOs

DTO pertenece al boundary, con campos permitidos, validación, normalización segura y documentación. No reutilizar entidad, modelo Prisma o DTO de salida como entrada. DTO no contiene lógica de negocio ni se propaga a domain.

Cambios de contrato se versionan y prueban. Campos desconocidos se rechazan en comandos sensibles.

### 7.6 Entities y Aggregates

Protegen identidad, invariantes y transiciones. Estado cambia mediante operaciones de dominio, no setters públicos. La creación inválida es imposible o falla con error de dominio. Persistencia no dicta su forma.

Aggregate Root define frontera transaccional. No cargar grafos completos por comodidad ni referenciar otros agregados como objetos mutables; usar IDs/version references.

### 7.7 Value Objects

Inmutables, comparables por valor y válidos al construirse. Representan Email, Probability, Duration, Difficulty, IDs y conceptos equivalentes. No tienen dependencia de framework/ORM. Evitar Value Objects triviales que no agregan semántica, validación o seguridad de tipo.

### 7.8 Exceptions y errores

Domain/Application usan errores semánticos propios o resultados tipados para fallos esperados. Interfaces traducen a transporte. Infrastructure envuelve errores del proveedor con categoría estable y causa segura.

No lanzar excepciones de framework desde domain/application. No usar excepciones para flujo normal masivo si un resultado discriminado es más claro.

### 7.9 Middleware

Solo concerns de transporte generales y previos al routing: correlación, límites básicos o contexto seguro. No autorización de negocio, no DB, no lógica de módulo. Debe ser orden-independiente o documentar el orden.

### 7.10 Guards

Autenticación y autorización coarse-grained de entrada. La autorización de recurso/estado se repite en el caso de uso como autoridad. Un guard no consulta tablas de múltiples módulos ni filtra silenciosamente datos.

### 7.11 Interceptors

Telemetría, mapping de envelope, timeout técnico o concerns transversales explícitos. No modifican resultado académico ni esconden side effects. Su orden y alcance se documentan y prueban.

### 7.12 Decorators

Solo metadata declarativa o ergonomía de boundary. No ejecutan lógica de negocio, queries o efectos sorprendentes. Crear uno nuevo requiere demostrar que es más claro que una función/guard explícito.

### 7.13 Pipes y validación

Pipes validan/transforman forma del transporte. El dominio vuelve a proteger invariantes. Conversión silenciosa de valores ambiguos está prohibida; normalización debe ser explícita y consistente.

### 7.14 Exception filters

Traducen categorías de error a respuesta segura, adjuntan correlation ID y registran solo lo necesario. No devuelven stack, query, ruta interna, proveedor, secreto o existencia sensible. Un error desconocido se trata como fallo interno y se investiga, no se presenta crudo.

### 7.15 Configuración

Solo composition roots leen entorno. Los módulos reciben configuración tipada y mínima. Secretos y settings no se mezclan. Una PolicyVersion de negocio no se reemplaza con una variable de entorno. Configuración inválida produce fallo de startup.

## 8. Frontend con App Router

### 8.1 Routes, layouts y pages

- `app` contiene routing y boundaries, no features completas.
- Page compone datos y widgets de una ruta; no acumula lógica interactiva.
- Layout mantiene UI compartida estable y no fuerza providers/client bundle a todo el árbol.
- Route groups representan superficie pública, autenticada, aprendizaje y administración.
- Metadata, autorización de vista y estados de ruta siguen la convención de Next.js.
- Una page no accede a persistencia ni duplica reglas del backend.

### 8.2 Features

Una feature representa una capacidad visible y cohesionada. Contiene componentes, hooks, adapters de presentación, tests y estados propios. No importa internals de otra feature; usa public surface o widget superior.

Si dos features comparten una abstracción visual estable, se promueve a `packages/ui`; si comparten modelo de presentación específico, se ubica en `entities`. No promover por una segunda coincidencia superficial.

### 8.3 Components y widgets

Componente genérico, accesible y sin negocio pertenece al Design System. Componente de negocio permanece en su feature. Widget compone varias features sin adquirir sus reglas.

Props son mínimas, serializables al cruzar server/client y orientadas a intención. Evitar pasar objetos gigantes, services o flags que cambian múltiples modos.

### 8.4 Hooks

Un hook encapsula comportamiento React reutilizable: estado, suscripción, interacción o coordinación de hooks. No se crea para envolver una sola función pura ni esconder un fetch que el Server Component puede resolver.

Hooks no cambian reglas académicas, no leen secrets y mantienen dependencias exhaustivas. Effects solo sincronizan con sistemas externos; datos derivados se calculan durante render.

### 8.5 Providers

Provider solo para estado realmente transversal que necesita Context: tema, capacidades de librería, sesión visual o telemetría cliente. Se coloca lo más abajo posible. Providers no se usan para evitar props razonables ni como service locator.

### 8.6 Stores

Estado remoto pertenece a la capa de datos; filtros compartibles a URL; estado local al componente. Store global solo para estado efímero transversal con consumidores independientes. Cada store define propietario, persistencia permitida, reset y frontera server/client.

No almacenar token, dominio canónico, permisos, solución, PII innecesaria ni copia indefinida de datos de servidor.

### 8.7 Services

Los services frontend son clientes de contrato y traductores de transporte. No contienen dominio backend. Se separan operaciones server-only de client-safe y se impide por build que secrets/clientes privilegiados entren al bundle.

### 8.8 Utilities

Solo funciones puras y pequeñas de presentación, formato o locale. Si depende de negocio, pertenece a feature/entity; si depende del navegador, el nombre y ubicación lo expresan. Un `utils.ts` grande se divide por concepto.

### 8.9 Server Components

Son el valor por defecto. Se usan para lectura, composición, localización de datos y reducir JavaScript cliente. No pasan datos sensibles a Client Components. Fetch/caching siguen política explícita; no se asume cache por defecto sin comprender semántica de versión/usuario.

### 8.10 Client Components

Solo cuando existe estado, handlers, lifecycle, browser API, Monaco, animación o librería cliente. La frontera `use client` se coloca lo más abajo posible porque incluye su subgrafo en bundle cliente. Un Client Component no se crea solo por comodidad.

### 8.11 Suspense

Se usa alrededor de unidades asíncronas que pueden cargar de forma independiente y tienen fallback estable. El boundary debe evitar layout shift y permitir que contenido útil aparezca antes. No envolver cada componente ni esconder waterfalls de datos evitables.

### 8.12 Loading UI

Loading mantiene geometría, jerarquía y contexto. Skeleton solo si representa estructura conocida; spinner para acción breve/local. Debe anunciar estado accesiblemente, no atrapar foco ni bloquear navegación innecesaria.

### 8.13 Error UI

Cada boundary ofrece mensaje humano, correlation ID cuando sea útil, acción segura de retry/navegación y preservación de borrador. No muestra stack, payload, proveedor o código interno. Errores de contenido, red, autorización y sistema tienen tratamiento distinto.

### 8.14 Accesibilidad

WCAG 2.2 AA es Definition of Done, no mejora posterior. Reglas mínimas:

- HTML semántico y landmarks antes que roles manuales.
- Navegación completa por teclado y foco visible.
- Orden de foco coherente y gestión explícita en dialogs/cambios.
- Labels, instrucciones y errores asociados.
- Contraste, zoom 200% y reflow.
- Información no depende solo de color/movimiento.
- Live regions para evaluación/cambios pertinentes, sin ruido.
- Targets táctiles adecuados.
- `prefers-reduced-motion` respetado.
- Monaco configurado y probado con accesibilidad.
- Test automático más recorrido manual del flujo afectado.

## 9. React

### 9.1 Cuándo crear un componente

Crear componente cuando existe unidad visual/semántica con responsabilidad nombrable, reutilización real, boundary de carga/error, interacción aislada o complejidad que impide leer al padre. No extraer un wrapper de pocas líneas sin concepto solo para reducir tamaño.

### 9.2 Cuándo dividir

Dividir si:

- mezcla obtención, transformación e interacción no relacionadas;
- tiene varias razones de cambio;
- props configuran modos incompatibles;
- una parte requiere Client Component y el resto no;
- una sección necesita carga/error independiente;
- tests solo son posibles mediante detalles internos;
- el nombre deja de describir todo el contenido.

### 9.3 Umbrales de revisión

No son límites mecánicos, sino disparadores:

- función: revisar cohesión al superar 40 líneas lógicas;
- hook: revisar al superar 80;
- componente: revisar al superar 150;
- cualquier archivo productivo: revisar al superar 300;
- más de 7 props o 3 booleanos: revisar el contrato del componente.

Superar el umbral requiere justificar cohesión en review; dividir artificialmente en archivos que se entienden solo juntos no mejora calidad.

### 9.4 Estado

Estado vive en el propietario más cercano. No guardar valores derivables. No sincronizar dos estados con Effect si uno puede calcularse. Reducers se usan para transiciones relacionadas/estado complejo, preferentemente como discriminated union. Estado servidor no se copia a store global sin estrategia de invalidación.

### 9.5 Custom hooks

Crear hook cuando combina hooks para una capacidad reutilizable o aísla sincronización externa. Debe tener contrato estable, nombre de intención y tests si contiene transiciones. No usar hook para saltarse reglas de React ni esconder efectos sorprendentes.

### 9.6 `memo`, memoización y callbacks

Memoización es optimización, nunca garantía funcional. Usar solo después de medir con profiler y demostrar que costo de render/cálculo y estabilidad de inputs justifican complejidad. Documentar la medición si no es obvia.

Evitar:

- `memo` en todos los componentes;
- `useMemo` para cálculos triviales;
- `useCallback` solo para “buena práctica”;
- comparadores custom sin benchmark;
- depender de memoización para corregir efectos, loops o estado mal ubicado.

Si el React Compiler se adopta, su evaluación y configuración requerirán ADR/tooling decision; no se mezclará con memo manual indiscriminado.

### 9.7 Effects

Effects sincronizan con sistemas externos. Interacciones se manejan en handlers; datos derivados durante render; carga server-first mediante capacidades de Next.js. Cada Effect define cleanup, dependencias completas y comportamiento ante remount. Un Effect que actualiza estado inmediatamente merece rediseño.

### 9.8 Pureza y keys

Render es puro y repetible. No muta props, fecha global, stores o red. Keys representan identidad estable del dominio/lista; índice solo en listas estáticas sin reordenamiento, inserción o estado local.

## 10. Design System

- shadcn/ui es base poseída por el proyecto, no dependencia visual intocable.
- Tokens semánticos gobiernan color, tipografía, espacio, radio, elevación, motion y z-index.
- Variants expresan semántica (`primary`, `destructive`, `subtle`), no colores físicos.
- Cada componente cubre default, hover, focus, active, disabled, loading, error y success cuando aplica.
- Componentes no contienen copy de producto ni reglas de feature.
- Cambios de token/componente requieren revisión visual, accesibilidad y análisis de impacto.
- No se crea componente compartido antes de demostrar semántica estable en al menos dos contextos o necesidad fundacional.

## 11. CSS y Tailwind

### 11.1 Tailwind

Tailwind es la opción por defecto para estilos locales. Las clases se ordenan automáticamente con el plugin oficial de Prettier; no se revisa orden manual. CSS propio se reserva para tokens, resets, animaciones complejas justificadas, integración de terceros o capacidades no expresables claramente.

### 11.2 Tokens y valores

- Usar tokens semánticos, no colores/espacios arbitrarios repetidos.
- Arbitrary values solo cuando un valor genuinamente único no pertenece al sistema; requiere justificación si se repite.
- No introducir hex, pixel o z-index mágicos en features.
- Espaciado sigue escala común; alineación óptica excepcional se documenta en componente.
- Tipografía usa roles (display, heading, body, label, code), no tamaños elegidos por pantalla.

### 11.3 Clases y composición

Variantes se centralizan en componente cuando representan estados soportados. Evitar concatenación dinámica de fragmentos que el compilador no detecta. Conflictos de clase se resuelven en helper aprobado y no con orden accidental.

Si una lista de clases oculta estructura, extraer componente/variant; no moverla a constante sin significado.

### 11.4 Responsive

Mobile-first. Breakpoints responden a quiebre real de layout, dentro de la escala acordada; no a dispositivos con nombres. Probar al menos móvil estrecho, tablet, laptop, desktop amplio, zoom y contenido localizado largo. No ocultar función esencial por tamaño; adaptar composición.

### 11.5 Dark mode

Tema oscuro es inicial, implementado con tokens semánticos. Ningún componente asume colores físicos que impidan tema claro futuro. Imágenes, Monaco, gráficos, estados y focus se prueban en contraste oscuro.

### 11.6 Animación

Movimiento comunica continuidad, jerarquía o feedback. Duración general heredada: 120–240 ms. No hay loops ornamentales ni animación que bloquee entrada. Preferir transform/opacity cuando corresponda; respetar reduced motion. Framer Motion se usa mediante presets del Design System.

### 11.7 CSS prohibido

- `!important` salvo integración externa aislada y comentada.
- Selectores globales de feature.
- IDs para estilo.
- Especificidad creciente para vencer errores de ownership.
- Valores copiados sin token.
- CSS que cambia semántica/visibilidad accesible sin alternativa.

## 12. Imports y límites

### 12.1 Orden automático

El formatter/linter aplica grupos:

1. Built-ins/plataforma.
2. Framework y terceros.
3. Packages del workspace.
4. Public surfaces de otros módulos permitidos.
5. Alias internos de la feature/app.
6. Imports relativos locales.
7. Assets/estilos side-effect autorizados.

Type-only imports se marcan explícitamente y se ordenan dentro de su grupo. No se insertan líneas manuales que el formatter revertirá.

### 12.2 Aliases

- Packages cruzan por su nombre de workspace.
- Alias de app representa raíz estable, no cada carpeta.
- Dentro de una feature pequeña, imports relativos son preferibles.
- No crear alias para internals de otro módulo.
- No usar rutas relativas que escalen múltiples niveles y crucen boundary; indica falta de public surface.

### 12.3 Permitido

- App → packages.
- Feature → su propio domain/application/infrastructure según dirección.
- Módulo → public surface de dependencia aprobada por matriz.
- Domain → domain propio/shared kernel puro.
- Interfaces/Infrastructure → Application/Domain propios.

### 12.4 Prohibido

- App → otra app.
- Domain/Application → NestJS, Prisma, Redis, SDK o transporte.
- Frontend → `packages/server`, Prisma o secretos.
- Feature → internals de otra feature.
- Módulo → repository/infrastructure de otro módulo.
- Import circular, dinámico para ocultar ciclo o service locator.
- Deep import a package que evita su public surface.
- Barrel global que reexporta todo.

Las reglas se verifican en CI mediante tests arquitectónicos/lint. Una excepción no se resuelve deshabilitando la regla.

## 13. Eventos internos

### 13.1 Semántica

Un evento expresa un hecho terminado y relevante fuera del agregado. No es comando, query ni señal técnica genérica. El productor define el significado; consumidores no reinterpretan.

### 13.2 Nombre y metadata

- PascalCase, pasado y lenguaje de dominio.
- ID global no secuencial.
- tipo y versión explícitos.
- timestamp UTC.
- aggregate type/id/version.
- correlation y causation IDs.
- actor/sistema pseudonimizado cuando sea necesario.

### 13.3 Payload

Mínimo, autocontenido para su propósito, serializable y sin objetos de dominio/ORM. IDs y versiones en vez de snapshots grandes. No incluye PII, secrets, respuestas, soluciones o prompts salvo evento especializado con clasificación y canal restringido.

Un consumidor que necesita datos actuales usa facade/proyección; no obliga a inflar todos los eventos.

### 13.4 Versionado

- Cambios aditivos opcionales y compatibles pueden conservar versión.
- Cambio de significado, tipo, obligatoriedad o identidad crea nueva versión.
- Productor mantiene ventana de compatibilidad y plan de deprecación.
- Eventos históricos no se reescriben.
- Contract tests cubren productor y consumidores.

### 13.5 Publicación

Evento y hecho se persisten mediante outbox en la misma transacción. Dispatcher publica al menos una vez. No se publica directamente desde entidad, repository o llamada externa. Orden se garantiza solo donde el dominio lo requiere y mediante clave/sequence explícita.

### 13.6 Consumo

Todo handler es idempotente, observa retry/lag, valida versión y registra checkpoint/dedupe. Un fallo transitorio reintenta con backoff; agotamiento termina en dead letter. Poison event no bloquea toda la cola silenciosamente. Side effects externos usan su propia idempotency key.

## 14. Errores

### 14.1 Taxonomía

| Categoría | Ejemplo conceptual | Tratamiento |
|---|---|---|
| Validation | Forma/rango inválido | Mensaje de campo seguro; no retry |
| Domain conflict | Estado/precondición no permite acción | Explicación accionable; no retry automático |
| Authorization | Actor sin permiso/ownership | Respuesta no reveladora y auditoría según riesgo |
| Not found | Recurso ausente o no visible | Semántica segura sin enumeración |
| Concurrency | Versión cambió/idempotencia | Reload/retry controlado |
| Dependency transient | Timeout/indisponibilidad | Retry/circuit breaker fuera de transacción |
| Dependency permanent | Contrato/configuración inválida | Fallo y escalación |
| Security | Injection, secreto, acceso anómalo | Rechazo, cuarentena, alerta/incidente |
| Programmer/invariant | Estado imposible | Error, alerta y fallo seguro |
| Fatal startup | Configuración/migración incompatible | Proceso no ready y salida |

### 14.2 Errores recuperables y fatales

Recuperable significa que existe siguiente acción segura: corregir input, recargar, reintentar idempotentemente o degradar una dependencia no crítica. Fatal significa que continuar puede corromper, mentir o exponer: configuración inválida, schema incompatible, secreto faltante, invariante rota o aislamiento comprometido.

No capturar un error solo para continuar. Un catch debe resolver, traducir, compensar o enriquecer contexto seguro; de lo contrario se propaga.

### 14.3 Mensajes

- Usuario: claro, no técnico, accionable y localizado.
- Contrato: código estable + mensaje seguro + correlation ID.
- Log: categoría, operación, IDs y causa redactada.
- Auditoría: actor, acción, recurso y resultado.

Nunca exponer stack, query, tabla, filesystem, variable, token, proveedor secreto, solución privada o existencia de cuenta.

### 14.4 Logging de errores

Registrar una vez en la capa que posee contexto/acción. No duplicar el mismo stack en controller, service y repository. Fallos esperados de usuario no llenan logs Error. Causa técnica se conserva con redacción y chaining; la respuesta usa categoría estable.

## 15. Validaciones

### 15.1 Capas

**Frontend:** feedback temprano, formato, required, affordance y accesibilidad. Nunca autoridad.

**Backend boundary:** schema, tipos, tamaños, allowlists, campos desconocidos, normalización y autorización.

**Domain:** invariantes, transiciones y políticas, incluso si boundary ya validó.

**Persistencia:** integridad y concurrencia como última defensa, conforme al diseño de datos futuro.

**Proveedor/adaptador:** valida respuesta externa antes de traducir al dominio.

### 15.2 Reglas

- Validar cerca de la entrada y la invariante cerca de su dueño.
- No duplicar manualmente schemas de transporte; compartir contract seguro cuando aplique.
- No compartir entidad para evitar duplicación.
- Normalización precede validación solo si es no ambigua; conservar valor original cuando auditoría lo requiera.
- Mensajes de campo no revelan reglas de seguridad explotables.
- Validación asíncrona/costosa no vive en decorator o constructor oculto.
- Nunca confiar solo en frontend, TypeScript, ORM, proveedor IA o UI deshabilitada.

## 16. Testing

### 16.1 Qué probar

- comportamiento observable, invariantes y decisiones;
- transiciones válidas e inválidas;
- autorización por rol/recurso/ownership;
- idempotencia, concurrencia, orden y compensación;
- contratos y versionado;
- límites de adaptadores y fallos externos;
- accesibilidad y estados loading/error/empty;
- caminos críticos y regresiones reales;
- recuperación, restore y degradación cuando corresponda.

### 16.2 Qué no probar

- implementación interna sin comportamiento;
- getters triviales y framework/librería ya probada;
- snapshots masivos usados como aprobación visual;
- detalles de DOM/CSS que no expresan semántica;
- métodos privados directamente;
- mocks que solo verifican que el código reproduce su propia estructura.

### 16.3 Unitarios

Rápidos, deterministas y sin red/DB/reloj real. Cubren domain/application puro. Un test tiene Arrange/Act/Assert conceptual claro, un comportamiento principal y nombre que explica escenario/resultado.

### 16.4 Integración

Usan dependencias reales compatibles: PostgreSQL, Redis, transacciones, outbox, adapter y Runner controlado. Cada suite aísla datos, es repetible y no depende del orden. Una DB en memoria no sustituye semántica PostgreSQL.

### 16.5 Contract tests

Obligatorios para public surfaces de módulos, eventos, Web-backend, Gateway IA, Exercise Types y proveedores. Una versión nueva prueba compatibilidad y rechazo de unknown/incompatible.

### 16.6 E2E

Cubren recorridos de alto valor, no combinaciones exhaustivas. Datos deterministas, ambiente representativo y selectores accesibles. Fallo produce evidencia útil sin depender de sleeps arbitrarios. E2E críticos forman smoke post-deploy reducido.

### 16.7 Cobertura

No existe objetivo global cosmético. Política:

- cada regla/invariante modificada tiene test positivo, negativo y edge relevante;
- Mastery, Evaluation, autorización, idempotencia, publicación, sesiones y XP cubren exhaustivamente ramas de decisión;
- cobertura de líneas/branches se reporta y no disminuye sin justificación;
- código nuevo sin ruta de prueba requiere rediseño o excepción aprobada;
- mutación/property testing se considera para cálculos e invariantes, no como cuota.

### 16.8 Mocks, stubs y fakes

- Mock solo en boundary externo o para verificar interacción que es comportamiento contractual.
- Fake para reloj, IDs, repositorio simple o provider determinista.
- Stub para respuesta concreta de dependencia.
- No mockear la unidad bajo prueba, Value Objects ni toda la cadena interna.
- Un mock debe respetar contrato y errores; no devolver estados imposibles salvo test explícito.

### 16.9 Fixtures y factories

Factories generan objetos válidos por defecto y permiten overrides explícitos. Fixtures representan escenarios canónicos versionados, son pequeños y legibles. Seeds no se reutilizan como fixtures de test. No usar fechas aleatorias, red o datos reales; randomness tiene seed reproducible.

### 16.10 Flakiness

Un test flaky es un defecto. Se corrige o se pone en cuarentena con propietario, issue y plazo corto; no se reintenta indefinidamente para volver verde. Reloj, async, orden y recursos se controlan explícitamente.

## 17. Documentación y comentarios

### 17.1 README

Actualizar cuando cambian propósito, requisitos, setup, comandos, estructura, configuración, troubleshooting o flujo de contribución. README guía al nuevo contribuidor; no duplica especificaciones extensas.

### 17.2 ADR

Requerido ante decisión difícil de revertir, nueva tecnología, cambio de boundary/ownership, persistencia, seguridad, contrato, despliegue, estrategia de estado, librería estructural o excepción duradera. Incluye contexto, decisión, alternativas, consecuencias, estado y supersesión.

No crear ADR para elección local reversible ni usarlo para aprobar retrospectivamente un hecho consumado.

### 17.3 Especificaciones

Actualizar cuando cambia comportamiento contractual, fórmula/política, contenido, datos, IA, arquitectura o norma. El cambio acompaña implementación y versión; no queda para “después”.

### 17.4 Diagramas y catálogos

Actualizar si cambia módulo, dependencia, evento, contenedor, red, volumen, flujo crítico o propiedad. Diagramas incluyen fecha/versión y no contradicen texto. El catálogo de eventos cambia junto a contract tests.

### 17.5 Comentarios

Comentar por qué, restricción, riesgo, decisión no obvia o workaround con issue/condición de retiro. No comentar qué hace una línea evidente ni mantener código comentado. TSDoc solo en public surfaces donde contrato/semántica no sea evidente; no repetir tipos.

### 17.6 TODO

No se aceptan TODO/FIXME vagos. Uno temporal incluye issue, propietario/condición y razón por la que no bloquea. Seguridad, datos, dominio o correctness no se posponen con TODO. El Definition of Done revisa todos los nuevos.

## 18. Git, review y releases

### 18.1 Branches

Trunk-based: `main` protegida, siempre releasable; ramas cortas con nombre tipo/capacidad/descripción. No ramas permanentes por ambiente ni desarrollo de semanas sin integración. Cambios incompletos usan feature flag gobernado, no código roto.

### 18.2 Commits

- Pequeños, coherentes y revisables.
- Conventional Commits recomendado y exigible por automatización.
- Mensaje imperativo, scope de módulo cuando aporta.
- Un commit no mezcla formatting masivo, refactor y feature sin necesidad.
- Nunca incluir secretos, builds, dumps, datos reales o archivos generados no contractuales.

### 18.3 Pull Requests

PR explica problema, decisión, requisitos/ADR, módulos, riesgo, pruebas, seguridad/privacidad, migración, observabilidad, UI/accesibilidad y rollback. Tamaño debe permitir revisión; cambios grandes se separan por capas compatibles sin merges rotos.

Draft se usa para feedback temprano, no para evadir checks. Autor realiza self-review y elimina ruido antes de solicitar revisión.

### 18.4 Code Review

Orden de revisión:

1. Compatibilidad con especificaciones e invariantes.
2. Ownership, boundaries y modelo de dominio.
3. Correctness, seguridad y datos.
4. Tests, errores y observabilidad.
5. Simplicidad, nombres y estilo.

Feedback es específico, argumentado y clasificado como bloqueante, sugerencia o pregunta. Preferencias personales no bloquean si formatter/handbook ya decide. Autor responde con cambio o razonamiento, no solo “resuelto”.

### 18.5 Aprobaciones

CODEOWNERS del módulo es obligatorio. Cambios en Mastery, IA, Content publication, Runner, Identity, seguridad, migraciones o infraestructura requieren especialista correspondiente. Nadie aprueba su propio cambio como única revisión en riesgo alto.

### 18.6 Versionado y tags

Producto y documentos siguen SemVer según compatibilidad. Tags de release son inmutables, firmados/identificados y apuntan al commit promovido. No mover ni reutilizar tag. Packages internos no necesitan versión independiente hasta existir consumidor/ciclo propio.

### 18.7 Releases

El mismo artefacto probado se promueve Preview/Staging/Production. Release notes describen impacto, migraciones, flags, riesgo y rollback. Hotfix parte del release productivo, pasa checks proporcionales y vuelve a main; nunca parche manual exclusivo del NAS.

## 19. Performance

### 19.1 Proceso obligatorio

1. Definir síntoma, usuario afectado y presupuesto/SLO.
2. Reproducir con entorno y datos representativos.
3. Medir baseline con profiler, tracing o plan de consulta.
4. Identificar cuello dominante.
5. Aplicar el cambio mínimo.
6. Comparar antes/después y verificar regresiones.
7. Documentar trade-off si agrega complejidad.

Una optimización sin medición se rechaza salvo control preventivo evidente de seguridad/costo, como límites de payload o evitar una llamada IA duplicada.

### 19.2 Lazy loading

Usar para dependencias/client components pesados que no son necesarios en render inicial: Monaco, gráficas, editores, modals complejos y herramientas administrativas. No fragmentar componentes pequeños ni crear waterfalls. El fallback debe ser accesible y estable.

Server Components reducen JavaScript cliente por diseño; no necesitan lazy loading artificial para su lógica. Se mide bundle por ruta y costo real de interacción.

### 19.3 Memoización

Aplican las reglas React de la sección 9.6. En backend, memo/caches locales solo para funciones puras costosas con inputs acotados y lifecycle entendido. Nunca usar memoización para datos por usuario sin key/retención segura.

### 19.4 Caching

Todo cache define:

- fuente de verdad;
- key y dimensiones de aislamiento;
- propietario;
- TTL;
- evento/estrategia de invalidación;
- comportamiento stale;
- datos prohibidos;
- respuesta ante caída;
- métricas hit/miss/error.

No cachear por defecto respuestas autenticadas, permisos, dominio o soluciones. Redis es efímero. Contenido publicado se keyea por versión/locale; cache nunca reemplaza PostgreSQL.

### 19.5 Consultas y persistencia

- Evitar N+1 y overfetch medidos.
- Pedir solo campos/relaciones necesarios al read model.
- Paginar colecciones no acotadas.
- Usar proyecciones/agregados para dashboards.
- Analizar planes e índices con consultas reales antes de optimizar.
- No hacer llamadas de red en transacción.
- Limitar concurrencia y pool; más paralelismo puede reducir throughput.
- No introducir query/raw shortcut que rompa ownership o integridad.

Estas normas no diseñan la base física; gobiernan cómo se evalúa rendimiento durante desarrollo.

### 19.6 Renderizado frontend

- Server Components por defecto.
- Estado lo más local posible.
- Evitar Effects encadenados y context updates globales.
- Virtualizar listas solo con volumen medido y accesibilidad preservada.
- Optimizar imágenes/fuentes y reservar dimensiones.
- Evitar hydration de componentes estáticos.
- Medir Core Web Vitals y bundle por ruta.
- Loading/error boundaries no deben provocar re-fetch loops.

### 19.7 Jobs, IA y Runner

Trabajos costosos son asíncronos, con batch, backpressure, concurrency y presupuesto. Reuse Resolver precede toda IA. Runner limita recursos por ejecución. Optimizar tiempo de job no puede omitir validadores, audit, aislamiento o idempotencia.

### 19.8 Cuándo no optimizar

- Sin problema medido o presupuesto incumplido.
- En código no crítico y poco ejecutado.
- Si agrega cache sin invalidación confiable.
- Si reduce legibilidad por mejora insignificante.
- Si una query simple ya cumple SLO.
- Si anticipa escala no planificada.
- Si compromete accesibilidad, seguridad o correctness.

## 20. Seguridad para contribuidores

### 20.1 Secrets y variables

- Ningún secreto en repositorio, imagen, fixture, screenshot, log, issue o PR.
- Plantillas de entorno contienen nombres y descripciones, nunca valores reales.
- Secretos se acceden solo desde composition root/adaptador autorizado.
- Frontend recibe únicamente configuración explícitamente pública.
- Rotar de inmediato ante sospecha de exposición; borrar del último commit no basta.
- Secret scanning local/CI no reemplaza revisión.
- No imprimir entorno completo para depurar.

### 20.2 Autenticación

No modificar sesión, cookies, hashing, recuperación o MFA sin threat review y pruebas. Tokens opacos se almacenan hash; cookies seguras; rotación/revocación preservadas. Nunca guardar credencial en Web Storage ni URL.

### 20.3 Autorización

Cada caso de uso valida actor, acción, recurso, ownership y estado. Ocultar botón no autoriza. Denegación por defecto; permisos no se infieren de UI, input o rol enviado por cliente. Cambios administrativos sensibles auditan y pueden exigir step-up/separación.

### 20.4 Validación y sanitización

Validar estructura y semántica; sanitizar/encode según contexto de salida. Sanitización no convierte input arbitrario en seguro para otro contexto. Contenido HTML/script no se admite salvo pipeline explícito y allowlist. Nombres de archivo, URLs y markdown se tratan como datos no confiables.

### 20.5 Dependencias y supply chain

- Lockfile obligatorio y revisado.
- Dependencias fijadas; updates automatizados pasan pruebas.
- SCA, SAST, image scan, SBOM y licencia según pipeline.
- Scripts de instalación/postinstall y binarios se consideran código de terceros privilegiado.
- No ejecutar snippets remotos o installers no revisados en CI/producción.
- Paquete abandonado o vulnerabilidad crítica activa plan de reemplazo/mitigación.

### 20.6 Logs y datos sensibles

Usar allowlist de campos loggeables, no blacklist improvisada. IDs pseudónimos y hashes de sesión cuando correlación sea necesaria. Respuestas de estudiantes, prompts/respuestas IA, soluciones, PII, headers/cookies y outputs completos no van a logs operativos.

### 20.7 Código no confiable y IA

Código de estudiante solo Runner aislado. Nunca ejecutar localmente durante review sin entorno seguro. Respuesta LLM entra en cuarentena y validación; no copiar automáticamente archivos, comandos o contenido ejecutable. El modelo no tiene tools, secretos ni autoridad de sistema.

### 20.8 Checklist de seguridad por cambio

- ¿Aumenta superficie pública o permiso?
- ¿Introduce input, archivo, URL o contenido externo?
- ¿Mueve datos entre trust boundaries?
- ¿Añade secreto o proveedor?
- ¿Cambia retención/logging?
- ¿Permite replay, brute force o abuso costoso?
- ¿Afecta Runner, IA o publicación?
- ¿Tiene tests negativos y observabilidad?

Una respuesta afirmativa exige controles explícitos en PR.

## 21. Observabilidad

### 21.1 Logging

Logs JSON con timestamp UTC, nivel, ambiente, service, versión, módulo, operación, resultado, latencia, correlation/trace/causation IDs e identificadores seguros. Mensajes describen hecho, no texto variable imposible de agregar.

No usar `console` directo en producto salvo adapter de logging controlado. Un error se registra una vez donde existe contexto suficiente. Debug se muestrea/deshabilita en producción.

### 21.2 Tracing

Crear spans en boundary de request, caso de uso crítico, transacción relevante, job/consumer, proveedor externo y Runner. Nombres estables y de baja cardinalidad. Atributos nunca contienen payload, email, token, query o respuesta.

Propagar contexto por outbox/jobs. No crear un span por función trivial ni usar tracing como log detallado.

### 21.3 Métricas

Toda métrica tiene nombre, unidad, descripción, tipo, labels permitidos, owner y dashboard/alerta. Labels son de cardinalidad acotada; nunca user ID, exercise ID, URL libre o error message.

Usar counters para acumulación, histograms para distribución/latencia y gauges para estado actual cuando semántica sea correcta. Medir resultado y costo de la capacidad, no solo llamadas.

### 21.4 Health checks

Liveness no depende de toda la infraestructura. Readiness refleja capacidad de aceptar trabajo. Startup protege inicialización. Deep health es autenticado y no se usa como probe. Un check no muta negocio ni genera carga significativa.

Dependencia opcional caída produce degradación explícita, no failure global. Gemini no vuelve unavailable el aprendizaje publicado.

### 21.5 Alertas

Alertas se basan en impacto/SLO o riesgo accionable, con severidad, owner, runbook y deduplicación. No alertar por cada log Error. Cambiar/crear alerta exige probar señal y resolución.

### 21.6 Auditoría

No mezclar con logs. Acciones de acceso, privilegio, publicación, políticas, IA restringida, exportación y operación crítica van a AuditLog append-only. Acceso a auditoría también se audita.

## 22. Gestión de dependencias

### 22.1 Preguntas antes de añadir

1. ¿Qué problema concreto resuelve?
2. ¿Puede resolverse claramente con plataforma o dependencia existente?
3. ¿Es capability central o conveniencia pequeña?
4. ¿Cuál es costo de bundle, runtime, memoria y operación?
5. ¿Estado de mantenimiento, frecuencia de release y bus factor?
6. ¿Licencia compatible y procedencia?
7. ¿Historial de vulnerabilidades y respuesta del mantenedor?
8. ¿Soporta stack/versiones/arquitectura NAS?
9. ¿Cómo se prueba, actualiza, reemplaza y elimina?
10. ¿Qué datos recibe y qué telemetría/envía?
11. ¿Introduce código nativo, postinstall, red o privilegios?
12. ¿Crea lock-in de formato o contrato?

### 22.2 Criterios de aceptación

Aceptar si reduce complejidad o riesgo de forma material, tiene alcance claro, calidad/mantenimiento suficientes, licencia compatible, costo razonable y adapter/boundary cuando sea volátil. La dependencia debe tener owner y motivo en PR.

Para librería estructural —estado, auth, observabilidad, cola, editor, validación, testing— se requiere ADR o decisión de tooling documentada.

### 22.3 Criterios de rechazo

- Resuelve pocas líneas estables sin riesgo.
- Duplica capacidad existente.
- Abandonada, sin licencia clara o con vulnerabilidades no atendidas.
- Trae framework/ecosistema mucho mayor al problema.
- Obliga a romper boundaries o filtrar tipos internos.
- Aumenta bundle/privilegios desproporcionadamente.
- Exige servicio externo sin necesidad aprobada.
- Solo se elige por popularidad o preferencia personal.

### 22.4 Wrapper y aislamiento

No envolver toda librería automáticamente. Crear adapter si cruza domain/application, maneja proveedor sustituible, datos sensibles, errores inestables o formato con lock-in. Para utility estable puramente local, import directo puede ser más simple.

### 22.5 Actualizaciones y retirada

Actualizaciones pequeñas y frecuentes, con changelog, compatibilidad y pruebas. Major upgrade tiene plan, riesgo y rollback. Dependencia sin uso se elimina junto con configuración/tipos. Se revisa inventario periódicamente; “instalada por si acaso” no es válida.

## 23. Refactoring y deuda técnica

### 23.1 Cuándo refactorizar

- Antes/durante cambio cuando estructura actual impide modificar con seguridad.
- Cuando aparece duplicación de conocimiento real.
- Al detectar boundary roto, ciclo o ownership difuso.
- Cuando tests/observabilidad revelan diseño no controlable.
- Después de medir hotspot que necesita estructura distinta.
- Para eliminar workaround una vez cumplida condición.
- Como cambio dedicado con beneficio y alcance claros.

### 23.2 Cuándo no refactorizar

- Por gusto mientras se arregla incidente urgente.
- Para aplicar patrón sin problema.
- En módulo no comprendido y sin characterization tests.
- Mezclado con feature grande si dificulta review/rollback.
- Para anticipar requisito no aprobado.
- Si solo mueve archivos/nombres sin mejorar comprensión.

### 23.3 Método seguro

1. Definir comportamiento/invariantes que no cambian.
2. Añadir o confirmar characterization/contract tests.
3. Separar refactor de cambio funcional cuando sea posible.
4. Hacer pasos pequeños, compilables y revisables.
5. Medir si el objetivo era performance.
6. Actualizar imports, docs y diagramas.
7. Eliminar código/flags antiguos después de migración.

### 23.4 Regla de mejora local

Dejar el área tocada ligeramente mejor si el cambio es seguro y próximo al alcance. No usar la “boy scout rule” para rediseñar módulos adyacentes sin autorización. Problemas fuera de alcance se registran con evidencia.

### 23.5 Deuda técnica

Toda deuda tiene descripción, causa, impacto, riesgo, owner, condición/fecha de revisión y estrategia. Seguridad/correctness crítico no se clasifica como deuda aceptable. Interés de deuda se observa mediante tiempos de cambio, fallos, complejidad y excepciones.

### 23.6 Código muerto y flags

Código no usado se elimina, no se comenta. Feature flags tienen owner, propósito, ambientes/cohortes, default seguro, fecha de expiración y tarea de cleanup. Una flag no crea dos arquitecturas permanentes.

## 24. Definition of Done

Una contribución no está terminada hasta cumplir todos los puntos aplicables. “No aplica” requiere razón en PR.

### 24.1 Requisito y diseño

- [ ] Requisito y documentos rectores identificados.
- [ ] Módulo propietario y dependencias confirmados.
- [ ] Invariantes pedagógicas, de IA, datos y seguridad preservadas.
- [ ] ADR creado/actualizado si la decisión es significativa.
- [ ] No existe scope creep ni decisión implícita.
- [ ] Contratos/versiones y compatibilidad definidos.

### 24.2 Calidad estática

- [ ] Compilación/build de targets afectados exitosa.
- [ ] Typecheck estricto sin errores.
- [ ] Lint y format sin warnings/overrides injustificados.
- [ ] Tests arquitectónicos de imports/boundaries pasan.
- [ ] Sin `any`, assertion, ignore o disable nuevo no justificado.
- [ ] Sin imports circulares, deep imports o internals cruzados.
- [ ] Nombres y archivos cumplen handbook.
- [ ] No hay código muerto, comentado o duplicación accidental.

### 24.3 Correctness y tests

- [ ] Unit tests cubren reglas nuevas/cambiadas.
- [ ] Casos positivo, negativo y edge relevante presentes.
- [ ] Integración real cubre adapters/transacciones afectados.
- [ ] Contract tests actualizados para contratos/eventos.
- [ ] E2E/smoke actualizado si cambia recorrido crítico.
- [ ] Tests deterministas, sin flaky conocido ni sleeps arbitrarios.
- [ ] Cobertura no disminuye sin aprobación.
- [ ] Idempotencia, retry, concurrencia y compensación probados si aplican.

### 24.4 Frontend y UX

- [ ] Server/Client boundary mínima y correcta.
- [ ] Loading, empty, error, offline/unauthorized pertinentes cubiertos.
- [ ] Responsive probado en tamaños representativos y zoom.
- [ ] Teclado, foco, lector de pantalla y contraste revisados.
- [ ] Reduced motion respetado.
- [ ] Copy localizado y sin strings duplicadas.
- [ ] No se expone solución, permiso, token o dato sensible.
- [ ] Evidencia visual incluida en PR cuando aplica.

### 24.5 Seguridad y privacidad

- [ ] Autenticación/autorización se valida en backend.
- [ ] Entradas externas validadas y salidas codificadas.
- [ ] CSRF/CORS/rate limit revisados si cambia superficie.
- [ ] No hay secretos/PII en repo, logs, fixtures o artifacts.
- [ ] Dependencias y licencias revisadas.
- [ ] Secret, SAST/SCA/image scans relevantes pasan.
- [ ] Retención/minimización/consentimiento revisados.
- [ ] Runner/IA mantienen trust boundaries.
- [ ] Threat model actualizado si cambia riesgo.

### 24.6 Datos, eventos y jobs

- [ ] Ownership de escritura preservado.
- [ ] Cambios persistentes son compatibles y reversibles por estrategia.
- [ ] Backfill/migración tiene observabilidad y rollback seguro.
- [ ] Outbox se crea con el hecho cuando aplica.
- [ ] Evento tiene versión, metadata y payload mínimo.
- [ ] Consumer es idempotente y maneja dead letter.
- [ ] Cache define key, TTL, invalidación y fuente de verdad.
- [ ] No hay llamada externa dentro de transacción.

### 24.7 Observabilidad y operación

- [ ] Logs estructurados suficientes y sin sensibilidad.
- [ ] Trazas propagan correlación por flujo afectado.
- [ ] Métricas tienen unidad, labels acotados y owner.
- [ ] Health check refleja nueva dependencia/capacidad si aplica.
- [ ] Alertas/runbooks actualizados.
- [ ] Fallos recuperables/degradados están definidos.
- [ ] Performance medido si afecta presupuesto/SLO.
- [ ] Deployment y rollback ensayables.
- [ ] Backup/restore considerado para nuevos datos/volúmenes.

### 24.8 Documentación y entrega

- [ ] README actualizado si cambia uso/setup.
- [ ] Specs, ADR, diagramas y catálogo de eventos actualizados.
- [ ] Comentarios explican solo decisiones no obvias.
- [ ] Todo TODO/FIXME nuevo tiene issue, razón y condición de retiro; idealmente ninguno.
- [ ] PR contiene alcance, riesgo, pruebas y rollback.
- [ ] Reviews/CODEOWNERS requeridos aprobados.
- [ ] CI completo verde, sin warnings ignorados.
- [ ] Release notes/flag/migración documentados si aplica.
- [ ] Artefacto es inmutable y promovible entre ambientes.

### 24.9 Cierre

- [ ] La capacidad funciona en ambiente representativo, no solo local.
- [ ] No fabrica dominio, progreso, evidencia o publicación.
- [ ] No delega decisiones del sistema a IA.
- [ ] Puede observarse, diagnosticarse y revertirse.
- [ ] El contribuidor puede explicar por qué el diseño es la solución más simple correcta.

## 25. Cumplimiento y evolución del handbook

### 25.1 Automatización

Formato, orden de imports/clases, lint, typecheck, tests, boundaries, scanning y checks documentales se automatizan. Automatizar elimina discusiones repetitivas; no sustituye juicio de arquitectura.

### 25.2 Excepciones

Una excepción incluye regla, motivo, alternativas, alcance, riesgo, compensación, owner y expiración. Se registra en PR y, si persiste o afecta arquitectura, ADR. Una excepción repetida indica que la norma o diseño debe revisarse.

### 25.3 Cambios al handbook

Se proponen por PR con motivación, impacto, plan de adopción y compatibilidad. Cambios editoriales usan patch; extensiones compatibles minor; cambios que vuelven inválido código aceptado major y plan de migración. No se cambia una regla para aprobar retroactivamente un incumplimiento sin analizar causa.

### 25.4 Onboarding y revisión periódica

Toda persona nueva revisa handbook y completa un cambio pequeño con mentoría. Al menos por release mayor o periodo acordado se revisan normas, excepciones, métricas de calidad y tooling. Las reglas obsoletas se sustituyen explícitamente, no se ignoran.

## 26. Referencias oficiales de fundamento

- TypeScript. [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/).
- TypeScript. [Narrowing and discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
- React. [memo](https://react.dev/reference/react/memo).
- React. [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).
- Next.js. [App Router](https://nextjs.org/docs/app).
- Next.js. [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- Next.js. [Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading).
- NestJS. [Documentation](https://docs.nestjs.com/).
- Tailwind CSS. [Automatic Class Sorting with Prettier](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier).
- Tailwind CSS. [Responsive Design](https://tailwindcss.com/docs/responsive-design).

## Engineering Principles

### 1. El conocimiento del proyecto está por encima de la preferencia personal

Las especificaciones, ADR y lenguaje ubicuo son el contrato. Un contribuidor no “mejora” una regla pedagógica, de IA, datos o seguridad mediante una implementación silenciosa. Primero comprende; luego cambia con trazabilidad.

### 2. Legibilidad antes que ingenio

El mejor código permite predecir intención, efectos y límites. Nombres precisos, flujo explícito y funciones cohesionadas superan abstracciones brillantes. Los comentarios explican decisiones, no traducen sintaxis.

### 3. La solución más simple debe seguir siendo correcta

KISS no elimina validación, autorización, idempotencia, auditoría ni rollback. Esos controles son parte del problema. Se evita complejidad futura hasta que una necesidad real la justifique.

### 4. Cada decisión y dato tiene dueño

Un módulo protege sus agregados, repositorios y reglas. Los demás usan facades, puertos, eventos o proyecciones. Compartir repositorio, tabla o helper de dominio sin ownership es acoplamiento, no reutilización.

### 5. Las dependencias apuntan hacia las reglas

Dominio y aplicación no conocen frameworks, ORM, cache, proveedores ni transporte. NestJS, Next.js, Prisma, Redis y Gemini son detalles reemplazables en adaptadores. Las apps ensamblan; no gobiernan.

### 6. Tipos expresan estados posibles

TypeScript estricto, `unknown` en fronteras, Value Objects y discriminated unions hacen visibles las invariantes. `any`, casts y opcionales indiscriminados esconden incertidumbre en vez de resolverla.

### 7. El backend es autoridad

Frontend mejora experiencia, nunca decide permisos, dominio, evaluación, XP, repaso o publicación. Toda entrada se valida de nuevo y toda transición de negocio se protege en su propietario.

### 8. Los eventos narran hechos, no deseos

Eventos son pasados, mínimos, versionados e idempotentes. Decisiones inmediatas usan llamadas claras; efectos posteriores usan outbox. No se promete exactamente una vez ni se esconde un comando bajo un evento.

### 9. Un error debe ser seguro y accionable

Los fallos se clasifican, traducen y observan. El usuario recibe una acción posible; operaciones reciben correlación; nadie recibe secretos o internals. Continuar tras una invariante rota es peor que fallar temprano.

### 10. Tests protegen comportamiento y riesgo

Se prueban invariantes, boundaries, errores y recorridos, no detalles privados. Código crítico exige ramas exhaustivas. Mocks se reservan a fronteras. Un test flaky es un defecto, no ruido aceptable.

### 11. Accesibilidad, seguridad y observabilidad son funcionalidad

No son fases de hardening posteriores. Cada cambio considera teclado, foco, contraste, permisos, datos, logs, métricas, trazas y operación. Una capacidad que no puede diagnosticarse o usarse de forma accesible no está terminada.

### 12. Performance se demuestra

Se mide antes y después. Lazy loading, memoización, cache, query tuning y concurrencia tienen costo. No se cambia claridad por una mejora imaginaria ni se usa cache sin invalidación y fuente de verdad.

### 13. Las dependencias son deuda con mantenimiento

Cada librería amplía superficie de actualización, seguridad, licencia y conocimiento. Se acepta si reduce más complejidad de la que introduce y existe plan para aislarla, actualizarla y retirarla.

### 14. Refactorizar preserva comportamiento

Primero se fija el contrato con tests; después se mejora en pasos pequeños. No se mezclan rediseños amplios con features urgentes. La deuda se registra con impacto y owner, no como TODO anónimo.

### 15. Main debe permanecer releasable

Ramas cortas, PR revisables, CI verde y artefactos inmutables. El mismo build avanza entre ambientes. Migraciones compatibles y rollback son requisitos del cambio, no problemas del operador.

### 16. Done significa operable durante años

Compilar no basta. Done incluye correctness, tests, seguridad, accesibilidad, observabilidad, documentación, compatibilidad y reversibilidad. Si una futura persona no puede comprender, validar y operar el cambio, todavía no está terminado.

---

**Mandato final:** escribir código en este proyecto es ejercer custodia sobre un sistema de aprendizaje, no producir líneas. Cada contribución debe hacer explícita su intención, respetar la autoridad de los módulos, preservar evidencia y versiones, proteger al usuario y dejar el sistema más fácil de comprender, probar, observar y cambiar que antes.

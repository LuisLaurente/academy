# AI_ENGINE_SPEC — Arquitectura funcional del motor de generación de contenido

| Campo | Valor |
|---|---|
| Estado | Especificación de arquitectura de IA obligatoria |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Documentos rectores | `MASTER_SPEC.md`, `DATABASE_DESIGN.md`, `LEARNING_ENGINE_SPEC.md` |
| Alcance | Ciclo de vida funcional del contenido generado por IA |
| Exclusiones | Código, pseudocódigo, APIs, SQL, Prisma e implementación |

## 1. Autoridad, propósito y límites

Este documento define cómo el sistema detecta una necesidad de contenido, construye una solicitud controlada, recupera contexto confiable, invoca un modelo, valida la respuesta, gestiona versiones, persiste trazabilidad y publica contenido aprobado. No modifica la lógica pedagógica ni el modelo de dominio establecidos por los documentos rectores.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** expresan obligación, prohibición, recomendación fuerte y opción controlada.

### 1.1 Mandato de autoridad

La IA:

- genera teoría, ejemplos, ejercicios, pistas, quizzes, resúmenes y explicaciones;
- transforma una especificación autorizada en candidatos de contenido;
- puede producir señales auxiliares de revisión que nunca son decisión final.

La IA NO:

- selecciona qué debe aprender un usuario;
- calcula dominio, retención, olvido, transferencia, XP o racha;
- decide dificultad individual, repaso o desbloqueo;
- evalúa por sí sola una respuesta del estudiante;
- altera el Knowledge Graph, currículo, políticas o permisos;
- publica contenido;
- ejecuta herramientas autónomas, navega o consulta fuentes externas durante la generación inicial sin una política explícita aprobada.

Toda decisión del sistema permanece en reglas deterministas, políticas versionadas, validadores autorizados y revisión humana cuando corresponda.

### 1.2 Propiedades que la arquitectura debe garantizar

1. Ningún usuario llama directamente a Gemini.
2. Ningún contenido no publicado aparece en una experiencia de aprendizaje.
3. Una necesidad equivalente reutiliza contenido aceptado y persistido.
4. Cada llamada externa es reproducible y auditable.
5. Una respuesta bien formada no se confunde con una respuesta correcta.
6. Una respuesta correcta no se confunde con contenido pedagógicamente publicable.
7. Ninguna falla parcial sobrescribe versiones anteriores.
8. Los proveedores son sustituibles sin cambiar Curriculum, Content o Learning Engine.
9. El contexto se minimiza, se versiona y conserva procedencia.
10. El sistema puede explicar por qué aceptó, rechazó, regeneró o publicó un artefacto.

### 1.3 Matriz de trazabilidad

| Requisito | Decisión | Secciones |
|---|---|---|
| Pipeline sin acceso directo | Orquestador asíncrono con puertas antes y después del LLM | 4–6 |
| Intención a solicitud estructurada | Content Request Builder | 8 |
| Contexto rico y seguro | Context Builder y Retrieval Layer | 9–10 |
| Prompts ensamblables | Prompt Component Registry + Assembly Manifest | 11 |
| Proveedores sustituibles | LLM Gateway y Capability Registry | 12 |
| Validación de respuesta | Structural/Contract Validator | 15 |
| Calidad pedagógica | Pedagogical Validator | 16 |
| Progresión real | Difficulty Analyzer | 17 |
| Duplicados semánticos | Duplicate Detector multimétodo | 18 |
| Consistencia integral | Consistency Checker | 19 |
| Knowledge Graph | Prerequisite Validator | 20 |
| Normalización | Dos etapas de normalización | 13, 21 |
| Score de calidad | Score por perfil más hard gates | 22 |
| Inmutabilidad | Version Manager + Publication Manifest | 24–25 |
| Generar una vez | Reuse Resolver y caché multinivel | 7, 26 |
| Auditoría | Linaje completo por solicitud, intento y artefacto | 28 |
| Reintentos correctivos | Taxonomía transporte/semántica | 27 |
| Costos | Presupuestos, reutilización, generación selectiva | 29 |
| Seguridad | Trust boundaries, minimización e injection defense | 30 |
| Observabilidad | Métricas técnicas, económicas y de calidad | 31 |
| Escalabilidad | Plugins de proveedor, disciplina, locale y tipo | 33 |
| Futuro multimodal/local | Evolución desacoplada | 38 |

## 2. ADR de IA propuestos

### ADR-AI-001 — Separar rechazo de contenido y retención de evidencia operativa

**Estado:** propuesto para aprobación.

**Contexto.** Esta fase exige “nunca almacenar contenido inválido”. `MASTER_SPEC.md` y `DATABASE_DESIGN.md` exigen conservar la respuesta cruda restringida, intentos fallidos, validaciones y auditoría.

**Decisión propuesta.** Una respuesta inválida NO se almacena como `ContentArtifactVersion`, no entra al repositorio canónico, no se cachea como contenido reutilizable y nunca se muestra al usuario. Puede conservarse temporalmente como evidencia restringida de `AIGenerationAttempt` o cuarentena, cifrada, con retención mínima y acceso operacional.

**Justificación.** Eliminar toda evidencia impediría investigar costos, fallos, ataques, regresiones y decisiones de rechazo. Considerarla contenido válido violaría seguridad y calidad. La separación satisface ambos objetivos.

**Consecuencias.** “Persistido para auditoría” y “aceptado como contenido” serán estados y almacenes lógicos distintos. La retención del payload inválido será más corta que la del artefacto aceptado.

### ADR-AI-002 — Normalización en dos etapas y validación como grafo de puertas

**Estado:** propuesto para aprobación.

**Contexto.** El pipeline sugerido ubica Normalizer después de todos los validadores. Los proveedores producen envoltorios y convenciones distintas; validarlos sin una representación común acoplaría cada validador a cada modelo.

**Decisión propuesta.** Aplicar primero **Transport Normalization**, que elimina diferencias del proveedor sin reinterpretar contenido. Después del Structural Validator, aplicar **Canonical Content Normalization**, que convierte el candidato válido al formato interno. Los validadores restantes forman un grafo con dependencias y pueden ejecutarse en paralelo cuando no se afectan.

**Justificación.** Reduce acoplamiento, evita un pipeline estrictamente serial costoso y conserva la regla de no normalizar contenido estructuralmente inválido como artefacto canónico.

**Consecuencias.** Cada normalización queda versionada. Un fallo en cualquier hard gate impide avanzar aunque otros validadores produzcan scores altos.

### ADR-AI-003 — No enviar historial individual a generación canónica

**Estado:** propuesto para aprobación.

**Contexto.** Context Builder podría incorporar errores, dominio, perfil e historial del usuario. Sin límites, esto expone datos, permite prompt injection indirecta y crea una versión distinta por persona, destruyendo reutilización.

**Decisión propuesta.** El contenido canónico se genera con currículo, knowledge graph, política pedagógica, errores frecuentes editoriales y métricas agregadas desidentificadas. Las variantes remediales usan una clase de error, banda de conocimiento y requisitos de accesibilidad, no identidad ni historial crudo. Una excepción individual requiere propósito aprobado, minimización, consentimiento aplicable y contenido no compartible.

**Justificación.** Protege privacidad, reduce costo, aumenta consistencia y cumple “generar una vez”. El Learning Engine sigue personalizando mediante selección, no generación en tiempo real.

**Consecuencias.** La personalización inicial elige artefactos aprobados por arquetipo pedagógico. No existe conversación directa estudiante–LLM en el camino crítico.

### ADR-AI-004 — Distinguir reintento de transporte de regeneración semántica

**Estado:** propuesto para aprobación.

**Contexto.** Repetir exactamente el mismo prompt tras una respuesta de contenido inválida desperdicia costo. Sin embargo, un timeout antes de recibir respuesta puede requerir retransmitir la misma solicitud idempotente.

**Decisión propuesta.** Un **transport retry** puede retransmitir la misma solicitud solo cuando no existe respuesta utilizable y el gateway puede mantener idempotencia. Una **semantic regeneration** siempre incorpora un Repair Brief derivado de fallos y crea un nuevo intento auditable.

**Justificación.** Corregir contenido requiere nueva información; resolver una falla de red no. Mezclarlos ocasionaría prompts artificialmente diferentes o generaciones duplicadas.

**Consecuencias.** Los dashboards separan fallos del proveedor de fallos de calidad. Los límites de reintento también son distintos.

## 3. Modelo operativo del contenido

### 3.1 Cinco estados que no deben confundirse

| Estado | Significado | Puede llegar al usuario |
|---|---|---|
| Raw response | Salida exacta del proveedor, restringida | No |
| Candidate | Respuesta normalizada estructuralmente | No |
| Validated candidate | Superó validadores, tiene score y linaje | No |
| Accepted artifact | Aprobado humana y sistemáticamente como versión de contenido | No por sí solo |
| Published content | Incluido en CurriculumPublication vigente | Sí |

Un Accepted artifact puede esperar composición editorial. Solo Published content es consumible por Learning Engine.

### 3.2 Identidades distintas

- **Content Need:** qué falta y por qué.
- **Generation Request:** especificación canónica de lo que debe generarse.
- **Generation Attempt:** una llamada real a un proveedor/modelo.
- **Candidate:** una salida candidata de un Attempt.
- **Artifact Version:** contenido aceptado e inmutable.
- **Publication:** conjunto compatible visible.

Esta separación evita usar “respuesta de Gemini”, “versión” y “contenido” como sinónimos.

## 4. Arquitectura funcional mejorada

### 4.1 Diagrama del flujo principal

> Señal autorizada de necesidad
> → Intent & Policy Guard
> → Content Request Builder
> → Reuse Resolver
> → Context Planner
> → Trusted Retrieval Layer
> → Context Builder + Context Integrity Guard
> → Prompt Builder + Budget Guard
> → Model Router
> → LLM Gateway
> → Raw Response Quarantine
> → Transport Normalizer
> → Structural Validator
> → Canonical Normalizer
> → Validation Orchestrator
> → Safety / Technical / Pedagogical / Difficulty / Duplicate / Consistency / Knowledge Graph / Leakage Validators
> → Quality Scorer
> → Acceptance Gate
> → Human Review
> → Version Manager
> → Persistence
> → Publication Gate
> → Cache Projection
> → Learning Engine
> → Usuario

### 4.2 Por qué se agregan módulos

**Intent & Policy Guard.** Impide que una intención no autorizada se convierta en generación y fija quién solicitó, qué puede generar y presupuesto.

**Reuse Resolver antes de contexto.** Evita gastar tokens y trabajo de retrieval si el contenido válido ya existe.

**Context Planner + Trusted Retrieval Layer.** Convierte el Context Builder en RAG controlado, con procedencia, snapshots y presupuestos; no concatena datos indiscriminadamente.

**Context Integrity Guard.** Trata texto recuperado como datos, detecta instrucciones incrustadas y excluye fuentes no confiables.

**Budget Guard.** Evita que una solicitud válida exceda cuotas o contexto máximo.

**Raw Response Quarantine.** Ninguna respuesta externa entra directamente al dominio de contenido.

**Validation Orchestrator.** Ejecuta dependencias, corta temprano hard failures y paraleliza análisis independientes.

**Safety/Technical/Leakage Validators.** Seguridad, corrección técnica y no revelación de respuestas son invariantes distintas de la calidad pedagógica.

**Acceptance Gate.** Aplica reglas deterministas sobre resultados; Quality Scorer no se autoaprueba.

**Publication Gate.** Distingue contenido válido aislado de un conjunto curricular compatible.

## 5. Propiedad de decisiones

| Decisión | Autoridad |
|---|---|
| Existe una necesidad de contenido | Curriculum, Content Administration o Learning Engine mediante evento autorizado |
| Tipo/objetivo/conceptos/dificultad requerida | Política pedagógica y currículo |
| Reutilizar o generar | Reuse Policy determinista |
| Contexto permitido | Context Policy + fuentes versionadas |
| Modelo/proveedor | Model Routing Policy |
| Límite de costo/tokens | Budget Policy |
| Validez estructural/técnica | Validadores deterministas |
| Señales semánticas auxiliares | Analizadores versionados; nunca decisión única |
| Aceptación automática | Deshabilitada inicialmente para contenido IA |
| Aprobación | Revisor humano autorizado después de hard gates |
| Publicación | Publication Policy y rol autorizado |
| Dominio/repaso/desbloqueo | Learning Engine; AI Engine no participa |

## 6. Ciclo de vida end-to-end

### 6.1 Detección de necesidad

Una necesidad puede originarse por:

- publicación curricular incompleta;
- falta de alguno de los 30 ejercicios exigidos;
- ausencia de teoría, ejemplos, pistas, quiz, resumen o explicación;
- cobertura conceptual insuficiente detectada antes de publicar;
- incidente aprobado sobre una versión existente;
- nueva versión de currículo, concepto, locale o perfil disciplinar;
- inventario insuficiente de variantes para repaso/transferencia;
- Content Quality Aggregate que justifica una nueva versión;
- solicitud editorial explícita autorizada.

No se genera porque un usuario simplemente escribe una instrucción. El sistema traduce señales autorizadas a una intención cerrada.

### 6.2 Preflight

Antes de construir contexto se valida:

- actor y rol;
- target/version curricular existente;
- tipo soportado;
- necesidad real y ausencia de contenido reutilizable;
- política pedagógica vigente;
- límites de cuota, costo y concurrencia;
- idempotencia;
- que no exista otro trabajo equivalente activo.

### 6.3 Generación y validación

El trabajo se ejecuta fuera del camino crítico del usuario. El candidato atraviesa todas las puertas. Un fallo produce rechazo, reparación controlada o revisión; jamás publicación parcial silenciosa.

### 6.4 Aceptación y publicación

La aceptación humana crea o selecciona una Artifact Version. La publicación valida el conjunto completo: por ejemplo, un subnivel requiere teoría contractual, tres ejemplos, exactamente 30 ejercicios, quiz, cobertura y graph compatibility. El contenido queda disponible solo después del manifest de publicación.

### 6.5 Consumo

Learning Engine lee contenido publicado desde PostgreSQL o su proyección de caché. Nunca invoca al proveedor para responder al estudiante. Si falta una variante durante una sesión, selecciona otra aprobada y registra una necesidad editorial asíncrona.

## 7. Reuse Resolver

### 7.1 Propósito

Resolver una necesidad sin llamar a un LLM cuando ya existe contenido válido, compatible y autorizado.

### 7.2 Dos claves complementarias

**Need Key.** Identifica la necesidad pedagógica de forma neutral al proveedor: tipo, target curricular, conceptos/versiones, locale, objetivo, dificultad, perfil disciplinar, variante/remediación, política y esquema.

**Generation Fingerprint.** Identifica un intento reproducible: Need Key, Prompt Assembly Manifest, context snapshot, proveedor, modelo, configuración, safety profile y output schema.

Need Key permite reutilizar un artefacto aceptado aunque haya cambiado el proveedor preferido. Generation Fingerprint permite auditoría y comparación exactas.

### 7.3 Resultado de resolución

- **Exact reusable:** artefacto aceptado coincide con Need Key y sigue vigente.
- **Compatible reusable:** una política aprobada declara equivalencia de versión/locale/perfil.
- **Partial reusable:** algunos componentes existen; se genera solo el fragmento faltante.
- **Stale:** existe, pero cambió una entrada semántica; se conserva y se inicia nueva versión.
- **Blocked:** existe incidente, incompatibilidad o revisión pendiente.
- **Miss:** no existe candidato aceptado; continúa pipeline.

### 7.4 Reglas de reutilización

Un cambio de proveedor, precio o disponibilidad NO invalida contenido ya aceptado. Sí pueden invalidar compatibilidad:

- nueva ConceptVersion con cambio semántico;
- nueva PolicyVersion pedagógica relevante;
- cambio de locale o terminología;
- cambio de output schema no migrable;
- incidente de exactitud/seguridad;
- cambio en prerrequisitos que vuelve incoherente el contenido;
- nueva regla contractual obligatoria.

## 8. Content Request Builder

### 8.1 Entrada mínima

Recibe una intención autorizada y referencias estables, no un prompt libre. Intenciones iniciales:

- GenerateTheory;
- GenerateExamples;
- GenerateExercises;
- GenerateHints;
- GenerateQuiz;
- GenerateSummary;
- GenerateExplanation;
- GenerateRemedialVariant;
- GenerateReviewVariant.

### 8.2 Responsabilidad

Transforma la intención en un **Content Generation Specification** independiente del proveedor. Resuelve parámetros desde currículo y políticas, no desde texto arbitrario del actor.

### 8.3 Contenido de la especificación

- intención y motivo;
- actor/origen autorizado;
- Topic/Level/Sublevel/Lesson/Concept versions;
- conceptos principales, secundarios y prerrequisitos;
- objetivo pedagógico observable;
- tipo de contenido y cantidad exacta;
- locale, registro, audiencia y disciplina;
- bandas de dificultad y progresión;
- tipos de ejercicio y distribución;
- requisitos de transferencia y error-based learning;
- contrato de pistas/explicación;
- restricciones de longitud/estructura;
- evaluadores/runtimes requeridos cuando aplique;
- arquetipo remedial desidentificado opcional;
- versiones de políticas, schemas y validators;
- presupuesto máximo y prioridad;
- criterios de aceptación.

### 8.4 Validación de la solicitud

El Builder rechaza intenciones ambiguas, targets no publicados/aprobados, cantidades incompatibles, conceptos ausentes, parámetros libres no permitidos y cualquier intento de incluir instrucciones del usuario. No elige qué enseñar; materializa una decisión previa.

### 8.5 Solicitudes por tipo

**Theory.** Exige objetivo, introducción, explicación, ejemplos básico/intermedio/avanzado, errores comunes, conceptos, conexión, resumen y tiempo.

**Exercises.** Para set completo exige 30, distribución contractual, posiciones/bandas y cobertura. Para generación parcial identifica placements faltantes sin regenerar el resto.

**Hints.** Exige ExerciseVersion, solución privada solo en contexto restringido, error patterns y tres niveles con prohibiciones de leakage.

**Quiz.** Exige banco separado, cobertura, 8–12 ítems para quiz final, ausencia de pistas y distancia de fingerprints.

**Summary/Explanation.** Exige contenido fuente versionado; no puede introducir conceptos nuevos.

## 9. Context Planner

### 9.1 Propósito

Define qué evidencia necesita el modelo, de qué fuentes, con qué prioridad y dentro de qué presupuesto. Evita el antipatrón “enviar todo el historial”.

### 9.2 Plan por intención

Cada tipo de contenido tiene un perfil de contexto:

- teoría prioriza definición, objetivo, prerequisitos, glosario y errores comunes;
- ejercicios priorizan teoría aprobada, conceptos, dificultad, tipos, ejemplos prohibidos de copiar y fingerprints existentes;
- pistas priorizan ejercicio, solución privada, errores previstos y contrato de no revelación;
- quiz prioriza cobertura, conceptos, dificultad y banco/fingerprints excluidos;
- resumen prioriza exclusivamente el contenido publicado de origen;
- remedial prioriza clase de error, concepto y microteoría, no historial personal.

### 9.3 Presupuesto de contexto

Orden de preservación cuando el contexto excede presupuesto:

1. Reglas de sistema y seguridad.
2. Output contract y hard constraints.
3. Conceptos/objetivos/prerrequisitos exactos.
4. Fuente de verdad disciplinar.
5. Contrato pedagógico aplicable.
6. Contenido relacionado necesario.
7. Inventario de duplicados/fingerprints.
8. Señales agregadas de calidad/error.
9. Ejemplos auxiliares.

No se truncan estructuras críticas a mitad. Se resume o recupera por fragmentos con procedencia.

## 10. Trusted Retrieval Layer y RAG

### 10.1 RAG curado, no búsqueda abierta

El AI Engine utiliza Retrieval-Augmented Generation sobre corpus aprobados. Las fuentes iniciales son internas y versionadas:

- CurriculumPublication y GraphPublication;
- ConceptVersion y glosario;
- teoría/contenido publicado relacionado;
- políticas pedagógicas;
- perfiles disciplinares;
- Style Guide y locale glossary;
- errores frecuentes editoriales;
- rúbricas y evaluadores;
- fingerprints y resúmenes de contenido existente;
- fuentes de conocimiento licenciadas/curadas con snapshot.

No se consulta Internet en tiempo real para generar contenido inicial. Incorporar una fuente externa requiere ingestión, licencia/procedencia, revisión, snapshot y clasificación de confianza.

### 10.2 Recuperación híbrida

La recuperación combina:

- navegación exacta por Knowledge Graph;
- filtros por identidad/version/locale/disciplina;
- búsqueda lexical para términos y definiciones;
- similitud semántica para contenido relacionado y duplicados;
- reranking por relevancia pedagógica, autoridad y frescura.

Los embeddings son señales de recuperación, no verdad. Google documenta su uso para búsqueda, clasificación y similitud semántica ([Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)); el índice DEBE registrar proveedor/modelo/dimensión y reconstruirse ante espacios incompatibles.

### 10.3 Unidades de recuperación

Los chunks respetan fronteras semánticas: definición, regla, ejemplo, error común, prerequisito o sección. No se fragmenta una condición sin su excepción ni una solución sin su problema. Cada chunk conserva fuente, versión, locale, permisos, hash y posición.

### 10.4 Context Snapshot

Cada generación congela:

- consulta y filtros;
- chunks recuperados y orden;
- scores lexical/semántico/reranking;
- versiones/hashes;
- ausencias relevantes;
- Context Policy y retriever version;
- token budget usado.

El snapshot permite reproducir por qué el modelo recibió una determinada evidencia.

### 10.5 Validación de retrieval

Antes de invocar el modelo se comprueba:

- todas las fuentes están autorizadas y vigentes;
- el concepto objetivo está presente;
- los prerrequisitos críticos están disponibles;
- no hay versiones incompatibles;
- no existen contradicciones no resueltas;
- el contexto cubre el objetivo mínimo;
- no contiene instrucciones ejecutables provenientes de datos.

Si falta evidencia esencial, se rechaza la generación; no se invita al modelo a rellenar vacíos.

## 11. Context Builder y Prompt Builder

### 11.1 Context Builder

Construye una representación compacta, jerárquica y con procedencia. Separa:

- hechos normativos;
- conocimiento disciplinar;
- currículo y grafo;
- restricciones pedagógicas;
- contenido existente a evitar;
- datos no confiables/desidentificados;
- información de auditoría que no debe enviarse.

No incluye correo, nombre, respuestas crudas, sesiones, secretos, tokens ni historial individual salvo excepción aprobada por ADR-AI-003.

### 11.2 Prompt Component Registry

Los prompts se ensamblan desde componentes versionados, cada uno con propósito único:

1. **System Authority:** rol limitado de generación y prohibiciones.
2. **Safety Contract:** límites, datos no confiables y no ejecución.
3. **Task Contract:** intención y resultado requerido.
4. **Curriculum Context:** target y objetivos.
5. **Knowledge Context:** hechos, glosario y fuentes.
6. **Pedagogical Contract:** reglas del Learning Engine aplicables.
7. **Content-Type Contract:** teoría, ejercicio, pista, quiz, etc.
8. **Difficulty Contract:** bandas, progresión y transferencia.
9. **Originality Contract:** fingerprints/resúmenes a evitar.
10. **Locale & Style:** idioma, registro, terminología.
11. **Output Contract:** schema estructurado y cantidades.
12. **Repair Brief:** solo en regeneraciones semánticas.

### 11.3 Assembly Manifest

Cada prompt ensamblado conserva IDs/versiones, orden, hashes, variables resueltas, context snapshot y token count. El texto final puede retenerse restringidamente conforme a política, pero el manifest es obligatorio para reproducibilidad.

### 11.4 Reglas de ensamblaje

- No hay edición libre en producción.
- Solo componentes Approved pueden generar contenido publicable.
- Las instrucciones tienen precedencia explícita sobre datos recuperados.
- El contenido no confiable se delimita como referencia, nunca instrucción.
- No se incluyen componentes irrelevantes “por si acaso”.
- No se inserta la solución en prompts que no la necesitan.
- Un Repair Brief solo puede corregir fallos registrados; no cambia el objetivo.

### 11.5 Prompts pequeños y especializados

Un set de 30 ejercicios PUEDE dividirse por bloques de dificultad o tipo, siempre que el Content Request conserve un plan global y el Consistency Checker valide el conjunto. Es preferible a un prompt gigante cuando mejora adherencia, reparabilidad y costo. La generación fragmentada no permite publicar partes hasta que el conjunto cumpla exactamente 30.

## 12. LLM Gateway

### 12.1 Propósito

Proporcionar una abstracción neutral entre el dominio y Gemini, OpenAI, Claude, Mistral, Llama, DeepSeek u otros modelos. El resto del sistema conoce capacidades, no SDKs ni nombres específicos.

### 12.2 Capability Registry

Por proveedor/modelo registra:

- modalidades de entrada/salida;
- structured output y subset soportado;
- tamaño de contexto y salida;
- idiomas evaluados;
- capacidades de razonamiento y generación;
- estabilidad: stable/preview/experimental/local;
- costos y unidad de facturación;
- límites, regiones y política de datos;
- latencia observada;
- fecha de deprecación;
- safety controls;
- compatibilidad con caching/batch;
- versión del adaptador.

Los datos cambian con el tiempo y se mantienen fuera del dominio. En producción se fijan versiones estables; la documentación de Gemini distingue nombres estables, preview, latest y experimental, y advierte que aliases pueden cambiar ([Gemini model version patterns](https://ai.google.dev/gemini-api/docs/models)).

### 12.3 Model Routing Policy

La ruta se decide antes de la llamada según tipo, dificultad, idioma, modalidad, calidad mínima, privacidad, presupuesto, disponibilidad y evaluación golden. El modelo no se autoelige.

Perfiles sugeridos:

- modelo económico para resúmenes o transformaciones simples validadas;
- modelo de mayor capacidad para ejercicios integradores o teoría compleja;
- embedding model independiente para retrieval/duplicados;
- modelo crítico opcional para señales semánticas de validación, preferentemente distinto del generador.

### 12.4 Contrato neutral de salida

El Gateway devuelve:

- payload crudo;
- provider/model/version resuelta;
- finish reason;
- token/usage breakdown;
- latencia y request provider ID;
- safety result del proveedor;
- configuración efectiva;
- error normalizado si falló.

No convierte el payload en ContentArtifact ni interpreta calidad.

### 12.5 Resiliencia

- timeout por tipo de operación;
- cancelación;
- circuit breaker por proveedor/modelo;
- límites de concurrencia y cuota;
- backpressure y cola;
- transport retries limitados;
- fallback solo mediante nueva ruta auditable;
- aislamiento de credenciales por proveedor/entorno.

El aprendizaje del usuario continúa con contenido persistido aunque todos los proveedores estén caídos.

## 13. Raw Response Quarantine y Transport Normalizer

### 13.1 Cuarentena

Toda salida externa entra como dato no confiable. Se registra hash, tamaño, proveedor, modelo, intento y clasificación inicial. No se renderiza, ejecuta, indexa para retrieval canónico ni mezcla con contenido aprobado.

### 13.2 Transport Normalizer

Elimina diferencias de envoltorio:

- bloques/text parts del proveedor;
- finish reasons;
- usage;
- safety metadata;
- encoding y caracteres de control;
- delimitadores accidentales;
- múltiples candidatos.

No corrige contenido, completa campos ni cambia significado. Si el payload no puede aislarse de forma segura, se rechaza.

## 14. Validation Orchestrator

### 14.1 Clases de validación

**Hard gate.** Un fallo impide aceptación: schema, cantidad, safety, prerrequisitos, solución incorrecta, leakage de pista, ejecutabilidad requerida, duplicado prohibido.

**Quality gate.** Produce dimensión y umbral: claridad, originalidad, valor pedagógico, estilo.

**Review signal.** Informa al humano sin decidir: posible ambigüedad, sesgo, dificultad incierta.

### 14.2 Dependencias

> Transport Normalization
> → Structural/Schema
> → Canonical Normalization
> → validadores independientes de Safety, Technical Correctness, Knowledge Graph, Pedagogy, Difficulty, Duplicate, Consistency y Leakage
> → Quality Scorer
> → Acceptance Gate

Structural falla primero para evitar gastar en análisis inválido. Safety puede ejecutarse cuanto antes. Duplicate y Difficulty pueden paralelizarse después de normalización. Consistency necesita resultados/cobertura del conjunto.

### 14.3 Estados de resultado

- Pass.
- PassWithWarnings.
- RepairableFailure.
- NonRepairableFailure.
- RequiresHumanJudgment.
- QuarantinedSecurityRisk.

Cada hallazgo incluye validator/version, regla, severidad, ubicación, evidencia, reparación permitida y confianza.

## 15. Response Validator

### 15.1 Alcance estructural

Comprueba de forma determinista:

- JSON sintácticamente válido cuando el contrato lo exige;
- output schema soportado y versión exacta;
- campos obligatorios y tipos;
- ausencia de campos desconocidos en estructuras sensibles;
- enum/type discriminators conocidos;
- cantidades mínimas/máximas;
- longitudes y tamaños;
- orden y posiciones;
- IDs/referencias permitidas;
- idioma/encoding;
- no truncamiento/finish reason incompatible;
- límites de nesting/payload.

Structured output reduce errores de forma, pero no garantiza verdad o calidad semántica; por eso esta puerta es necesaria incluso cuando el proveedor soporta JSON Schema ([Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)).

### 15.2 Contratos por contenido

**Theory.** Todas las secciones contractuales, exactamente tres categorías de ejemplo, errores comunes, conceptos y conexión.

**Exercise set.** Exactamente 30 placements, posiciones 1–30, distribución de tipos y bandas conforme a documentos rectores.

**Exercise.** Objetivo, concepto principal único, dificultad, tipo, enunciado, evaluador, solución privada, explicación, hints y test cases cuando aplique.

**Hints.** Tres niveles ordenados cuando el contrato lo exige; ninguna vacía.

**Quiz final.** 8–12 ítems, cobertura declarada, sin hints y sin placements del set de práctica.

**Summary.** Secciones/longitud definidas y referencias al source artifact.

### 15.3 Longitud

Los mínimos/máximos se expresan por tipo, idioma y complejidad. No se impone volumen para aparentar calidad. Un texto debajo del mínimo funcional se rechaza; uno por encima del máximo pasa a reparación por concisión si no pierde contenido.

### 15.4 Fallo

Una respuesta estructuralmente inválida queda Rejected/Repairable o Quarantined. No se convierte en contenido. El hallazgo alimenta Repair Brief; el modelo no recibe simplemente “intenta de nuevo”.

## 16. Pedagogical Validator

### 16.1 Objetivo

Comprobar alineación entre objetivo, teoría, ejemplos, ejercicios, pistas, quiz y principios de `LEARNING_ENGINE_SPEC.md`.

### 16.2 Matriz de alineación

Para cada ConceptVersion construye una matriz:

- enseñado en teoría;
- demostrado en ejemplos;
- evaluado en ejercicios;
- cubierto en quiz;
- apoyado por hints;
- explicado después de respuesta;
- dificultad/transferencia esperada;
- prerequisitos usados.

Un concepto evaluado pero no enseñado/prerrequisito se bloquea. Un concepto enseñado principal sin evidencia planificada genera falta de cobertura.

### 16.3 Reglas de teoría

- objetivo observable;
- explicación suficiente y correcta;
- sin relleno/repetición;
- ejemplos básico/intermedio/avanzado realmente distintos;
- avanzado no introduce materia futura;
- errores comunes plausibles;
- conexión con conocimiento previo real;
- resumen no introduce afirmaciones nuevas.

### 16.4 Reglas de práctica

- cada ejercicio enseña/mide una habilidad;
- no hay pregunta trivial u obvia;
- el concepto principal es realmente necesario;
- la explicación coincide con solución/evaluador;
- los hints atacan errores previstos y no revelan respuesta;
- quiz usa recuperación y transferencia, no copias;
- demandas cognitivas y distribución respetan el contrato.

### 16.5 Métodos

La decisión combina reglas deterministas, coverage mapping, rúbricas humanas y analizadores semánticos auxiliares. Un LLM critic PUEDE señalar incoherencias, pero no aprobar solo. Los hallazgos probabilísticos requieren confirmación por regla, ejecución o revisor.

## 17. Difficulty Analyzer

### 17.1 Dificultad no declarativa

No acepta la etiqueta de Gemini como prueba. Estima dificultad mediante rasgos observables:

- cantidad de conceptos y su criticidad;
- profundidad de prerequisitos;
- número de pasos de razonamiento;
- grado de soporte/material inicial;
- necesidad de seleccionar estrategia;
- distancia respecto a ejemplos;
- distancia de transferencia;
- cantidad de casos y excepciones;
- complejidad sintáctica/lectora;
- ambigüedad accidental;
- carga del evaluador/rúbrica;
- solución mínima y robusta esperada.

### 17.2 Calibración por disciplina

Cada perfil disciplinar define qué rasgos importan. Longitud no equivale a dificultad: un enunciado largo puede ser solo ruido; una pregunta breve puede requerir abstracción avanzada.

### 17.3 Progresión del set

Valida:

- posiciones 1–3 muy fáciles pero no triviales;
- 4–8 fáciles;
- 9–18 intermedias;
- 19–26 difíciles;
- 27–30 muy difíciles;
- envelope ascendente;
- ausencia de saltos bruscos sin puente;
- transferencia y composición al final;
- no introducir conceptos nuevos en las últimas posiciones.

Compara cada ejercicio con vecinos, bloque y objetivo global. Una caída breve justificada puede pasar; una regresión sostenida o una subida abrupta se repara.

### 17.4 Señales técnicas y empíricas

Antes de publicar: features, rúbrica, comparación con anchors revisados y ejecución/solución. Después de publicar: tasa de primer intento, hints, tiempo contextual, abandono, discriminación e incidentes. Los datos observados pueden proponer nueva Difficulty calibration o versión, nunca reescribir ExerciseVersion histórica.

### 17.5 Fallos típicos

- **TooEasy:** reconocimiento obvio, respuesta incluida, distractores absurdos, solución idéntica al ejemplo.
- **TooHard:** prerequisito no declarado, demasiados conceptos nuevos, ambigüedad, salto de transferencia.
- **FlatProgression:** ejercicios con misma demanda cognitiva.
- **SawtoothUnjustified:** alternancias grandes sin propósito.
- **DifficultyByNoise:** dificultad creada por texto confuso o datos irrelevantes.

## 18. Duplicate Detector

### 18.1 Capas

1. **Exact hash:** identidad textual/normalizada.
2. **Lexical similarity:** n-grams/solapamiento después de normalizar nombres y literales.
3. **Structural fingerprint:** forma del problema, pasos, AST o plantilla disciplinar.
4. **Solution fingerprint:** estrategia y resultado esperado.
5. **Semantic embedding:** significado, objetivo y contexto.
6. **Pedagogical fingerprint:** concepto, error objetivo, dificultad, tipo y transferencia.

Ninguna capa aislada es suficiente.

### 18.2 Alcance de comparación

- dentro del set de 30;
- contra versiones del mismo Sublevel;
- contra quiz y mini review;
- contra banco de repaso;
- contra ejemplos y explicaciones;
- contra otros temas cuando comparten concepto;
- por locale y entre traducciones equivalentes.

### 18.3 Teoría y ejemplos

Para teoría se compara estructura de ideas y frases, detectando parafraseo redundante. Para ejemplos se normalizan entidades, números y superficie; cambiar “Ana” por “Luis” no crea originalidad.

### 18.4 Decisión por umbrales

- duplicado exacto/estructural prohibido: hard fail;
- similitud alta: revisión o reparación;
- similitud intencional de contraste: permitida con relación explícita;
- recuperación espaciada: puede reutilizar concepto, nunca respuesta exacta reciente.

Los thresholds se calibran con conjuntos etiquetados y versión del embedding. Al cambiar embedding model se reconstruye el índice; no se comparan vectores de espacios incompatibles.

## 19. Consistency Checker

### 19.1 Consistencia vertical

Comprueba que Topic, Level, Sublevel, Concept, Lesson y contenido coincidan en identidad, versión, objetivo, dificultad, locale y vocabulario.

### 19.2 Consistencia horizontal

Comprueba entre artefactos:

- teoría ↔ ejemplos;
- teoría ↔ ejercicios;
- ejercicio ↔ solución/evaluador/test cases;
- error pattern ↔ hints;
- solución ↔ explicación;
- ejercicios ↔ quiz;
- conjunto ↔ distribución/cobertura;
- resumen ↔ contenido fuente;
- locale ↔ glosario/style guide.

### 19.3 Tipos de contradicción

- teoría de Variables y práctica de Funciones no declarada;
- ejemplo que viola una regla recién explicada;
- explicación incompatible con test case;
- hint que orienta a otra solución;
- quiz que mide un concepto secundario como principal;
- términos con significados distintos;
- dificultad o audiencia incoherente;
- solución múltiple válida cuando el evaluador acepta una sola.

### 19.4 Coherencia de conjunto

El Checker opera también sobre el set completo. Un ejercicio individual puede ser válido pero redundante, desbalancear cobertura o romper progresión. Ningún fragmento se acepta como set publicable sin validación global.

## 20. Knowledge Graph Validator

### 20.1 Propósito

Evitar prerequisitos ocultos y conceptos fuera del alcance autorizado.

### 20.2 Procedimiento conceptual

Extrae los conceptos realmente necesarios para comprender/resolver el candidato, los alinea con ConceptVersion y compara con GraphPublication. Distingue:

- conceptos objetivo;
- secundarios autorizados;
- prerequisitos ya declarados;
- conceptos futuros no permitidos;
- términos incidentales que no requieren dominio.

### 20.3 Reglas

- Herencia no se enseña antes de Clases si GraphPublication declara Prerequisite crítico.
- JOIN avanzado no se introduce antes de SELECT/prerrequisitos correspondientes.
- Un ejemplo avanzado puede combinar conocimientos previos, no conceptos futuros.
- Una referencia superficial no bloquea si no exige comprensión; se documenta.
- Una relación ausente no se inventa: se crea incidencia editorial para revisión del grafo.

### 20.4 Fallo y reparación

Ante concepto futuro:

- eliminarlo si es accidental;
- sustituir contexto manteniendo objetivo;
- dividir contenido si existe sobrecarga;
- solicitar revisión curricular si parece necesario.

El AI Engine no modifica el Knowledge Graph para hacer pasar un candidato.

## 21. Canonical Content Normalizer

### 21.1 Propósito

Convertir candidatos estructuralmente válidos a la representación interna estable, independiente de proveedor.

### 21.2 Operaciones permitidas

- ordenar campos según schema;
- normalizar whitespace, Unicode y saltos;
- resolver enums/labels controlados;
- estandarizar unidades/locale cuando no cambia significado;
- separar bloques tipados;
- canonicalizar referencias a ConceptVersion;
- calcular hashes/fingerprints;
- normalizar posiciones y metadata.

### 21.3 Operaciones prohibidas

- completar contenido faltante;
- corregir hechos;
- reescribir una pista para ocultar leakage;
- alterar respuesta/solución;
- reducir o aumentar dificultad;
- traducir libremente;
- decidir qué concepto representa.

Si hace falta una operación prohibida, se inicia reparación/regeneración y nueva validación.

## 22. Quality Scorer

### 22.1 Principio

El score ayuda a comparar y priorizar revisión. No reemplaza hard gates ni aprobación humana. Un contenido inseguro con 99/100 se rechaza.

### 22.2 Dimensiones base

| Dimensión | Peso base | Pregunta |
|---|---:|---|
| Exactitud técnica/factual | 18 | ¿Es correcto y verificable? |
| Valor pedagógico | 16 | ¿Construye o evalúa el objetivo sin relleno? |
| Alineación y cobertura | 14 | ¿Conecta objetivo, teoría, práctica y quiz? |
| Claridad y precisión | 10 | ¿Es comprensible, concreto y no ambiguo? |
| Dificultad/progresión | 10 | ¿La demanda corresponde a posición y perfil? |
| Originalidad | 8 | ¿Evita duplicados semánticos/estructurales? |
| Calidad de ejemplos | 6 | ¿Aíslan, combinan y transfieren correctamente? |
| Calidad de ejercicios | 6 | ¿Cada ítem produce evidencia útil? |
| Calidad de pistas | 5 | ¿Atacan error sin revelar? |
| Transferencia | 4 | ¿Promueve aplicación nueva? |
| Consistencia terminológica | 3 | ¿Respeta glosario/locale? |

Total base: 100.

### 22.3 Perfiles por contenido

Los pesos cambian por `QualityProfileVersion` sin eliminar dimensiones críticas. Theory aumenta claridad/ejemplos; ExerciseSet aumenta progresión/originalidad; Hints aumenta no-leakage y error alignment; Quiz aumenta cobertura/novedad.

### 22.4 Umbrales iniciales

- Hard gates: todos Pass.
- Score global: ≥ 85 para pasar a revisión humana.
- Ninguna dimensión crítica por debajo de 75.
- Exactitud, safety, schema y leakage: no son compensables.
- 75–84: RepairableFailure.
- Menos de 75: Reject o regeneración selectiva según hallazgos.

Los números son política inicial y requieren golden set/shadow evaluation antes de activación.

### 22.5 Evidencia del score

Cada dimensión conserva reglas, señales, evaluator version y explicación. Un score sin desglose no es auditable. Los LLM-as-judge pueden aportar una señal calibrada, nunca el valor final único.

## 23. Acceptance Gate y revisión humana

### 23.1 Acceptance Gate

Aplica de forma determinista:

- todos los hard gates pasan;
- thresholds alcanzados;
- no existe hallazgo de seguridad abierto;
- context/provenance completos;
- intento/candidato auditables;
- revisión humana requerida.

Resultado: Rejected, Repairable, AwaitingHumanReview o Quarantined.

### 23.2 Revisión humana inicial obligatoria

El revisor observa candidato, diff, objetivos, fuentes, resultados de validators, ejecución, score, similares y procedencia. Puede:

- aprobar;
- solicitar reparación focalizada;
- rechazar;
- marcar incidente/security concern;
- escalar a experto disciplinar.

No puede ignorar hard gates de seguridad, estructura, solución o prerequisito. Todo override permitido exige razón y auditoría.

### 23.3 Separación de funciones

Para contenido de riesgo alto o cambios masivos, autor y aprobador deben ser personas distintas. El actor que inició generación no se autoaprueba cuando la política exige separación.

## 24. Version Manager

### 24.1 Capas de versión

| Capa | Ejemplo conceptual | Función |
|---|---|---|
| Identidad estable | Theory/Exercise/Lesson | Continuidad histórica |
| Generation Attempt | Intento 1, 2, 3 | Cada llamada/reintento |
| Candidate Version | Candidate A/B | Comparación y validación |
| Artifact Version | Theory v1/v2/v3 | Contenido aceptado inmutable |
| Publication Version | CurriculumPublication | Compatibilidad visible |
| Prompt/Context/Validator versions | Manifest | Reproducibilidad |

### 24.2 Nunca sobrescribir

Editar un artefacto aceptado crea otra Artifact Version, incluso si el cambio parece pequeño. La versión anterior conserva publicaciones, intentos y auditoría. Corregir una respuesta inválida crea otro Candidate; no muta el original.

### 24.3 Tipos de cambio

- **Editorial compatible:** claridad/ortografía sin alterar significado; nueva versión patch conceptual.
- **Pedagógico:** ejemplos, dificultad, hints, cobertura; nueva versión y revalidación completa afectada.
- **Semántico/técnico:** solución, concepto, objetivo o prerequisito; nueva versión mayor conceptual y nueva publicación.
- **Schema:** migración/normalización versionada; nunca reinterpretación silenciosa.

### 24.4 Comparación

Se comparan texto, estructura, conceptos, dificultad, fingerprints, soluciones, validator results, scores, modelo/prompt/context y costo. La UI de revisión debe mostrar qué cambió y qué problema pretendía resolver.

### 24.5 Retiro

Superseded evita nuevas asignaciones; Retired retira catálogo; Quarantined bloquea por incidente. Ningún estado borra historia. Un incidente severo puede cambiar la publicación vigente a una versión previa compatible mediante proceso autorizado.

## 25. Persistence y Publication Gate

### 25.1 Fuente de verdad

PostgreSQL almacena generaciones, intentos, candidatos, validaciones, reviews, artefactos y publicaciones. Redis no satisface persistencia de contenido.

### 25.2 Escrituras permitidas por etapa

- Attempt: metadata y raw response restringida según ADR-AI-001.
- Candidate: solo después de Transport/Structural handling; inválido queda rejected/quarantine, no canonical content.
- Artifact Version: solo tras validación y aprobación.
- Publication: solo tras validación del manifest completo.

### 25.3 Publication Gate

Comprueba que todas las versiones sean:

- Accepted y no incidentadas;
- compatibles entre sí;
- del mismo currículo/graph/locale esperado;
- completas según contrato;
- revisadas;
- resolubles por cliente/evaluator;
- respaldadas por rollback.

Un Exercise válido aislado no publica un subnivel con 29 ejercicios.

## 26. Estrategia de caché

### 26.1 Capas

**Persistent semantic reuse.** PostgreSQL por Need Key; es la garantía “nunca generar de nuevo”.

**Read cache.** Redis para contenido publicado/proyecciones, con TTL, namespace y publication version.

**Work coordination.** Redis locks para evitar trabajos equivalentes; siempre double-check PostgreSQL después de adquirir lock.

**Retrieval cache.** Resultados/context snapshots por versiones de fuente y retriever.

**Embedding cache.** Por content hash + embedding model/version/dimension/task.

**Provider context cache.** Optimización opcional para prefijos extensos reutilizados. Google señala que context caching reduce costo en contextos largos repetidos, pero tiene TTL/costos propios y límites dependientes del modelo ([Gemini Context Caching](https://ai.google.dev/gemini-api/docs/generate-content/caching?hl=en)). No es fuente de verdad.

### 26.2 Reutilizar

Se reutiliza si Need Key y compatibility policy coinciden, Artifact está Accepted, no hay incidente, publicación/locale siguen compatibles y no cambió una regla semántica relevante.

### 26.3 Regenerar

Solo por:

- nueva versión semántica del target;
- incidente aprobado;
- validator/policy nueva que invalida contenido;
- cobertura/dificultad observada insuficiente;
- nuevo locale/perfil/formato;
- solicitud editorial autorizada con motivo;
- necesidad parcial que no puede componerse con artefactos existentes.

Cambiar de modelo por preferencia no es razón suficiente.

### 26.4 Invalidar

Invalidar caché no borra Artifact. Un evento de publicación/incidente elimina o versiona entradas Redis. Los cache keys incluyen publication/locale/schema. TTL protege contra entradas huérfanas; la corrección depende de invalidación por evento y verificación con PostgreSQL.

### 26.5 Negative cache

Fallos no reparables o proveedores indisponibles pueden registrarse brevemente para evitar tormentas de reintentos. Nunca bloquean indefinidamente una necesidad ni sustituyen el estado persistido del Job.

## 27. Reintentos y reparación

### 27.1 Taxonomía

| Tipo | Ejemplos | Acción |
|---|---|---|
| Transport transient | timeout, conexión, 5xx | Backoff con jitter; mismo request idempotente según ADR-AI-004 |
| Quota/rate | 429, límite diario | Reprogramar, no insistir; posible ruta autorizada |
| Provider safety refusal | bloqueo legítimo o falso positivo | Revisar contexto; no evadir controles |
| Structural | JSON/schema/cantidad | Repair Brief focalizado en formato/campos |
| Semantic | incoherencia, dificultad, duplicado | Regenerar solo fragmentos afectados con hallazgos |
| Security | injection/leakage/secreto | Cuarentena; no reintento automático |
| Nonrepairable policy | target inválido/prerequisito ausente | Bloquear y escalar a currículo |

### 27.2 Repair Brief

Incluye:

- reglas fallidas y validator versions;
- ubicaciones/IDs afectados;
- evidencia mínima del fallo;
- restricciones que permanecen invariantes;
- contenido válido que debe preservarse;
- qué debe cambiar y qué no;
- contador y presupuesto restante.

No incluye razonamiento interno del modelo ni datos adicionales innecesarios.

### 27.3 Regeneración selectiva

Si 27 de 30 ejercicios pasan, se regeneran los 3 placements fallidos, luego se revalida cada uno y el conjunto completo. Theory puede reparar una sección; hints pueden reparar un nivel. Un cambio de solución obliga a revalidar exercise, tests, explanation y hints dependientes.

### 27.4 Límites

- máximo de intentos por clase de error y Content Request;
- costo acumulado máximo;
- no alternar proveedores indefinidamente;
- fallos repetidos idénticos escalan a humano;
- security failures no se auto-reparan;
- cada intento conserva linaje.

## 28. Auditoría y procedencia

### 28.1 Registro obligatorio por generación

- Content Request/Need Key;
- actor que originó y rol;
- motivo y target/version;
- fecha/hora UTC;
- proveedor, modelo y versión resuelta;
- PromptTemplate/Assembly Manifest y hash del prompt;
- Context Snapshot, fuentes y hashes;
- configuración efectiva;
- tokens de entrada, salida, thinking/tool/cache cuando aplique;
- costo estimado y moneda;
- queue time, provider latency, total time;
- raw response hash y ubicación restringida;
- finish/safety result;
- errors y transport retries;
- semantic retries y Repair Briefs;
- candidates y validator results;
- quality scores;
- decisiones humanas/overrides;
- Artifact/Publication result;
- correlation/trace IDs.

La documentación oficial de Gemini ofrece conteo previo y desglose de uso en respuestas; esos datos deben mapearse al contrato neutral del Gateway ([Gemini token counting](https://ai.google.dev/gemini-api/docs/tokens)).

### 28.2 Coste estimado frente a facturado

Se registra estimación al planificar, uso reportado por proveedor y coste reconciliado si existe factura/export posterior. Nunca se mezclan como si fueran el mismo dato.

### 28.3 Acceso y retención

Prompts/respuestas crudas tienen acceso más restringido que scores/metadata. Secrets se redactan antes de persistir. Retenciones se definen por categoría. Los logs operativos no duplican payloads sensibles.

## 29. Gestión de costos y tokens

### 29.1 Orden de optimización

1. No generar: exact/compatible reuse.
2. Generar solo lo faltante.
3. Recuperar contexto mínimo y relevante.
4. Elegir modelo suficiente, no máximo por defecto.
5. Establecer límite de entrada/salida antes de invocar.
6. Usar structured output para reducir reparaciones de forma.
7. Reutilizar contextos/prefijos cuando el proveedor lo soporte y sea rentable.
8. Batch para trabajos editoriales no urgentes cuando convenga.
9. Reparar fragmentos, no sets completos.
10. Medir costo por Artifact aceptado, no solo por llamada.

### 29.2 Compresión de contexto

- recuperar chunks por objetivo;
- usar IDs y glosarios compactos;
- resumir contenido existente con artefactos versionados, no resúmenes ad hoc;
- representar Knowledge Graph como vecindario relevante, no grafo completo;
- enviar fingerprints/resúmenes a evitar en vez de textos íntegros cuando sea suficiente;
- eliminar duplicación entre componentes.

La documentación de Gemini recomienda evitar tokens innecesarios y reconoce que contextos más largos aumentan latencia; context caching puede ayudar cuando el prefijo es repetido ([Gemini Long Context](https://ai.google.dev/gemini-api/docs/long-context)).

### 29.3 Presupuestos

Se definen por intención, disciplina, locale, prioridad y ambiente:

- tokens máximos de input/output;
- coste máximo por attempt/request/artifact;
- intentos máximos;
- concurrencia;
- cuota diaria/mensual;
- reserva para reparaciones;
- umbral de escalación humana.

La generación se rechaza o difiere antes de exceder presupuesto; nunca trunca silenciosamente un contrato pedagógico.

### 29.4 Batch

Generaciones masivas de currículo, embeddings y revalidaciones pueden agruparse cuando no hay requisito interactivo. El soporte de batch es una capacidad del Gateway, no una dependencia del dominio; Google documenta batch para generación/embeddings de alto throughput ([Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api)).

## 30. Seguridad del motor de IA

### 30.1 Trust boundaries

Se consideran no confiables:

- texto de usuario;
- corpus externo;
- documentos importados;
- respuestas de modelos;
- metadata no firmada;
- contenido generado previamente no publicado;
- outputs multimodales/OCR/transcripción;
- mensajes de error del proveedor.

Solo políticas, componentes Approved, snapshots internos y contenido Published poseen confianza definida; aun así se validan versiones e integridad.

### 30.2 Prompt injection directa

El usuario no envía prompts al AI Engine. Solo elige acciones permitidas que se traducen a intents cerrados. Campos libres se tratan como datos, se limitan, normalizan y nunca se insertan en System Authority.

### 30.3 Prompt injection indirecta

Retrieved text puede contener instrucciones maliciosas. Context Integrity Guard:

- usa allowlist de fuentes y permisos;
- separa instrucciones de evidencia;
- detecta patrones de instruction override/exfiltration;
- excluye scripts, hidden text y metadata sospechosa;
- registra procedencia de cada chunk;
- no permite que retrieved content cambie herramientas, schema o policy;
- bloquea solicitudes de secretos/sistema.

OWASP advierte que RAG y fine-tuning no eliminan prompt injection y recomienda restringir comportamiento y validar formatos ([OWASP LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)).

### 30.4 Capacidades del modelo

En generación de contenido:

- tools/function calling deshabilitados salvo ADR específico;
- sin acceso directo a red, base de datos, filesystem o secretos;
- sin ejecución de código por el LLM;
- outputs ejecutables pasan al Runner aislado solo a través de validación autorizada;
- credenciales permanecen en Gateway;
- proveedores reciben mínimo contexto.

### 30.5 Exfiltración y secretos

Secret scanner opera antes y después del proveedor. Prompts no contienen env vars, tokens, correo ni identificadores innecesarios. Logs redactan payload. Un hallazgo de secreto cuarentena el resultado y activa incidente.

### 30.6 Safety y contenido dañino

Se valida daño, sesgo, lenguaje, instrucciones peligrosas, datos personales, copyright/plagio razonable y suitability por audiencia. Filtros del proveedor son defensa adicional, no única.

### 30.7 Supply chain y modelos locales

Adaptadores, modelos, weights y contenedores se fijan por versión/hash, analizan y autorizan. Un modelo local no se considera más confiable solo por ejecutarse en el NAS.

### 30.8 Gobierno de riesgo

La validación, evaluación, trazabilidad e incident management se alinean conceptualmente con las funciones Govern, Map, Measure y Manage del NIST AI RMF y su perfil de IA generativa ([NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)).

## 31. Observabilidad

### 31.1 Latencia y throughput

- queue wait;
- context retrieval time;
- prompt build time;
- provider time to first/complete response;
- validator time por módulo;
- human review lead time;
- end-to-end time to Accepted/Published;
- jobs/attempts/candidates/artifacts por periodo;
- concurrency y backlog age.

### 31.2 Calidad

- pass/reject/repair/quarantine rate;
- failure rate por validator/regla;
- average/percentiles de score y dimensión;
- human approval/rejection/override rate;
- post-publication incident rate;
- duplicate similarity distribution;
- difficulty progression violations;
- technical execution failure;
- hint leakage rate;
- graph prerequisite violation;
- quality drift por modelo/prompt/locale/disciplina.

### 31.3 Costos

- input/output/cached/thinking/tool tokens por proveedor/modelo/intención;
- costo por Attempt;
- costo por Accepted Artifact;
- costo por Published Artifact;
- retry amplification ratio;
- wasted cost de candidatos rechazados;
- savings por reuse, partial generation, provider cache y batch;
- budget utilization y forecast.

### 31.4 Caché y retrieval

- exact/compatible/partial hit rate;
- Redis hit/miss/stale rate;
- duplicate active job prevented;
- provider context cache utilization;
- retrieval precision/coverage en golden set;
- missing prerequisite context rate;
- stale/unauthorized chunk rate;
- embedding index version/coverage.

### 31.5 Resiliencia y seguridad

- provider errors/429/timeouts/circuit state;
- fallback rate;
- dead letters;
- prompt injection detections;
- secret/PII detections;
- quarantine count/age;
- audit gaps;
- unauthorized intent attempts.

### 31.6 Alertas

Alertar por desviación respecto a baseline/SLO, no por ruido aislado. Casos críticos:

- contenido publicado con incidente severo;
- safety/leakage hard gate omitido;
- costo por Artifact aumenta significativamente;
- reject/retry rate se desvía tras modelo/prompt nuevo;
- cache hit cae inesperadamente;
- provider deprecado/próximo a retiro;
- backlog supera ventana editorial;
- discrepancia entre auditoría y facturación.

Los umbrales numéricos finales se fijan tras baseline del NAS y pilotos; inventarlos ahora sería una garantía falsa.

## 32. Evaluación continua y golden datasets

### 32.1 Golden set

Por tipo, disciplina, locale y dificultad contiene:

- solicitudes válidas;
- respuestas ideales revisadas;
- fallos estructurales;
- incoherencias pedagógicas;
- prerequisitos ocultos;
- duplicados/paráfrasis;
- progresiones buenas/malas;
- hints con y sin leakage;
- ataques de prompt injection;
- contenidos ambiguos o con múltiples soluciones.

### 32.2 Evaluar cambios

Todo cambio de modelo, PromptTemplate, retriever, embedding, validator, normalizer o QualityProfile ejecuta el golden set. Se comparan calidad, falsos passes/rejects, costo, latencia y estabilidad. Preview/experimental opera primero en shadow/canary sin publicar automáticamente.

### 32.3 LLM-as-judge

Puede detectar señales semánticas a escala, preferiblemente con rúbrica, salida estructurada y modelo distinto. Debe calibrarse contra humanos, medir acuerdo y no decidir hard gates solo. Sus propias versiones/costos se auditan.

### 32.4 Feedback post-publicación

Content Quality Aggregate, incidentes y métricas pedagógicas pueden proponer regeneración. No se envían respuestas individuales al proveedor. Una mala tasa de éxito no prueba por sí sola que el contenido sea malo: se analiza dificultad, discriminación, claridad y currículo.

## 33. Escalabilidad y extensibilidad

### 33.1 Múltiples modelos

Provider Adapter + Capability Registry + Routing Policy aíslan diferencias. Agregar proveedor no cambia Content Request, validadores ni artefactos. Fallback crea linaje nuevo y revalida por completo.

### 33.2 Múltiples idiomas

Locale forma parte de Need Key, contexto, glosario, prompts, validators y publicación. Traducir crea Artifact Version específica; no se considera copia inválida, pero conserva equivalencia. Validación incluye terminología, ejemplos culturales, longitud y evaluación por locale.

### 33.3 Múltiples disciplinas

Un Discipline Pack contiene fuentes curadas, ontología, tipos, dificultad, validators técnicos, rúbricas y style rules. No cambia el pipeline. Programación usa Runner; historia usa evidencia/fuentes; matemáticas usa equivalencia simbólica; idiomas usa validadores lingüísticos.

### 33.4 Nuevos tipos de contenido

Un Content Type Pack declara intent, output schema, componentes de prompt, context profile, validators, QualityProfile, versioning y publication rules. Un tipo desconocido falla de forma segura.

### 33.5 Nuevos formatos

Texto, imagen, audio, video, simulación o documento comparten identidad, linaje y gates. Cada modalidad añade validators específicos de accesibilidad, sincronización, seguridad y factualidad; no bifurca la arquitectura.

### 33.6 Escala operativa

- workers stateless por etapa;
- colas por prioridad/costo/proveedor;
- backpressure;
- idempotencia;
- locks distribuidos;
- batch para offline;
- particionado/archivo solo por métricas;
- extracción futura de AI Gateway/validation sin cambiar contratos.

El monolito modular sigue siendo la decisión inicial. Separar servicios solo se justifica por volumen, aislamiento de seguridad, equipo o disponibilidad medidos.

## 34. Fallos, recuperación y continuidad

| Falla | Comportamiento |
|---|---|
| Gemini no disponible | Trabajo se reprograma; usuarios leen contenido persistido |
| Redis no disponible | No se pierde contenido; se reduce cache/colas según estrategia segura; PostgreSQL verifica reuse |
| Validator caído | Candidato no avanza; se reintenta etapa idempotente |
| Modelo devuelve vacío/truncado | Structural failure y reparación/attempt nuevo |
| Human review pendiente | Artefacto no publica |
| Publicación parcial | Transaction/manifest impide current inconsistente |
| Embedding index corrupto | Duplicate/Retrieval gate se bloquea o usa modo exacto seguro; no se omite silenciosamente |
| Costo excedido | Job se difiere/escalona; no se trunca contrato |
| Incidente post-publicación | Quarantine/rollback a manifest compatible y trazabilidad |
| Cambio de modelo/deprecación | Route update + golden/canary; contenido aceptado permanece |

## 35. Riesgos específicos y mitigaciones

| Riesgo | Consecuencia | Mitigación |
|---|---|---|
| Usuario→LLM directo | Bypass de reglas/costo | Intents cerrados + Policy Guard |
| Context dumping | Coste, latencia, contradicciones | Context Planner y budget |
| RAG con fuente maliciosa | Injection/exfiltración | Corpus curado, provenance, Integrity Guard |
| JSON válido pero falso | Publicación errónea | Validadores semánticos/técnicos/humanos |
| Modelo se autoevalúa | Sesgo correlacionado | Reglas, runner, critic auxiliar y humano |
| Score compensa error crítico | Contenido inseguro | Hard gates no compensables |
| Prompt gigante | Baja reparabilidad/costo | Component registry + generación parcial |
| Reintento idéntico semántico | Repite fallo | Repair Brief focalizado |
| Regenerar todo | Coste y deriva | Dependency-aware selective repair |
| Embeddings como verdad | Falsos duplicados/retrieval | Señal múltiple + revisión/umbrales |
| Personalización con PII | Privacidad y cache explosion | Arquetipos desidentificados |
| Cache obsoleta | Contenido incoherente | Version keys + invalidación por evento |
| Alias de modelo cambia | Deriva silenciosa | Versiones estables fijadas |
| Publicar candidato aislado | Currículo inconsistente | Publication Gate/manifest |
| Raw response accesible | Fuga/ataque | Quarantine, cifrado, RBAC, retención |
| Autoalojado sin controles | Riesgo supply chain/operativo | Mismos adapters/gates + verificación de weights |

## 36. Criterios de aceptación del AI Engine

El diseño se considera implementado correctamente solo si:

1. No existe ruta estudiante–LLM.
2. Reuse Resolver se ejecuta antes de cualquier llamada.
3. Content Request no acepta prompts libres.
4. Todo contexto posee fuente, versión y permiso.
5. Datos individuales no entran a generación canónica.
6. Cada prompt tiene Assembly Manifest reproducible.
7. LLM Gateway oculta diferencias de proveedores.
8. Model/version efectiva queda registrada.
9. Raw response entra en cuarentena.
10. Schema/quantity/format se validan determinísticamente.
11. Exactamente 30 ejercicios se verifica como set.
12. Teoría, ejemplos, ejercicios, pistas y quiz son coherentes.
13. Difficulty Analyzer no confía en la etiqueta del modelo.
14. Duplicate Detector usa señales textuales, estructurales, solución y semánticas.
15. Knowledge Graph Validator bloquea prerequisitos ocultos.
16. Hints con leakage se rechazan.
17. Quality score no puede superar un hard fail.
18. Toda IA requiere revisión humana inicial.
19. Artifact y Publication son versiones distintas e inmutables.
20. Contenido inválido nunca entra al repositorio canónico/cache de consumo.
21. Cada semantic retry incorpora Repair Brief.
22. Costos/tokens/latencias/reintentos quedan auditados.
23. Cache invalidation no borra historia.
24. Usuarios pueden aprender durante caída total de proveedores.
25. Agregar modelo, idioma, disciplina o formato no cambia el núcleo.

## 37. Referencias técnicas de fundamento

- Google AI for Developers. [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output).
- Google AI for Developers. [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings).
- Google AI for Developers. [Gemini Context Caching](https://ai.google.dev/gemini-api/docs/generate-content/caching?hl=en).
- Google AI for Developers. [Gemini token counting](https://ai.google.dev/gemini-api/docs/tokens).
- Google AI for Developers. [Gemini model version patterns](https://ai.google.dev/gemini-api/docs/models).
- Google AI for Developers. [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api).
- OWASP GenAI Security Project. [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
- NIST. [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework).
- NIST. [Artificial Intelligence Risk Management Framework: Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf).

## 38. Riesgos y evolución futura

### 38.1 Evolución de Gemini y modelos cloud

Los modelos cambiarán en capacidad, contexto, precio, safety y deprecaciones. Capability Registry y Routing Policy absorben esos cambios. Una nueva versión debe pasar golden set, shadow/canary, comparación de coste/calidad y revisión de privacidad. Nunca se cambia un alias en producción sin registrar la versión resuelta.

### 38.2 Portabilidad hacia OpenAI, Claude, Mistral, Llama y DeepSeek

Cada proveedor implementa el contrato neutral. Diferencias de structured output, safety, token accounting y caching se normalizan en Gateway. Los validators y Artifact schemas permanecen iguales. Si una capacidad no existe, la ruta se declara incompatible; no se degrada silenciosamente.

### 38.3 Modelos multimodales

Imágenes, diagramas, audio y video amplían tanto generación como ataque. La arquitectura añadirá:

- modality-specific Content Type Packs;
- OCR/transcript como datos no confiables;
- provenance de assets;
- accessibility validators: alt text, captions, transcript, contraste/legibilidad;
- cross-modal consistency: narración, imagen, solución y concepto;
- duplicate detection multimodal;
- filtros contra prompt injection invisible/cross-modal;
- costos y límites por modalidad;
- revisión humana especializada.

Los embeddings multimodales pueden mejorar retrieval y duplicados, pero cada espacio se versiona y no reemplaza reglas semánticas. OWASP identifica riesgos particulares de injection multimodal; por ello los mismos trust boundaries se amplían, no se relajan.

### 38.4 Generación local y LLMs autoalojados

Un proveedor LocalLLM se integra mediante el mismo Gateway. Debe registrar:

- modelo/weights hash, cuantización y licencia;
- tokenizer/context/output limits;
- hardware, throughput y consumo energético;
- container/runtime version;
- aislamiento y acceso a red;
- safety profile;
- golden benchmarks por disciplina/locale;
- costo operacional total;
- política de actualización y rollback.

El autoalojamiento mejora control de datos y puede reducir costo marginal, pero traslada seguridad, capacidad, parches, evaluación y disponibilidad al equipo. En un NAS, memoria, arquitectura CPU/GPU, temperatura, concurrencia y latencia pueden convertirlo en una opción para batch, no necesariamente para alto throughput.

### 38.5 Model routing por calidad/costo

En el futuro se puede usar cascada: modelo pequeño produce candidato, validators lo aceptan o escalan a uno más capaz. La ruta debe ser determinista, auditable y evaluada; el modelo pequeño no decide escalar. El costo se mide por Artifact publicado, incluyendo escalaciones.

### 38.6 Distillation y fine-tuning

Podrían especializar formato, estilo o disciplina cuando exista dataset autorizado. No sustituyen RAG para hechos versionados ni validators. Los datos de entrenamiento requieren licencias, privacidad, provenance, evaluación de memorization y rollback. Fine-tuning no concede autoridad pedagógica.

### 38.7 Grounding externo controlado

Una futura ingestión de fuentes externas puede ampliar disciplinas cambiantes. Debe operar fuera de generación: adquirir, verificar licencia, clasificar autoridad, snapshot, detectar cambios y revisar. El modelo nunca cita una URL viva como fuente de verdad sin ese proceso.

### 38.8 Auto-publicación limitada

Solo podría considerarse después de suficientes métricas por tipo/discipline/locale, tasa de incidentes cercana a cero, validators calibrados y ADR de riesgo. Empezaría con contenido de bajo riesgo y canary. Teoría técnica, evaluaciones, soluciones y hints seguirían requiriendo controles mayores.

### 38.9 Validators aprendidos

Modelos especializados pueden clasificar dificultad, leakage o calidad. Se ejecutarán en shadow, con métricas de falsos passes/rejects y explicación. No reemplazarán hard constraints ni ejecución técnica.

### 38.10 Provenance verificable y contenido firmado

El manifest podría firmarse criptográficamente y adoptar estándares de provenance para assets multimodales. Esto facilitaría comprobar que el contenido servido es exactamente el aprobado, incluso en caches/CDN o exportaciones.

### 38.11 Evaluación adversarial continua

Se ampliarán red-team suites con jailbreaks, indirect injection, Unicode/hidden text, poisoning del corpus, data exfiltration, multimodal attacks, tool abuse y denial of wallet. Los hallazgos actualizan policies/validators sin depender solo de prompts defensivos.

### 38.12 Riesgo de homogeneización pedagógica

Múltiples modelos pueden converger en explicaciones similares y reducir diversidad. Quality Scorer futuro debería medir diversidad de representación y estrategia sin sacrificar consistencia. La curaduría humana seguirá definiendo qué variedad aporta aprendizaje.

### 38.13 Riesgo de dependencia de proveedor

Aunque Gateway desacopla llamadas, context caches, embeddings y safety semantics pueden crear lock-in. La mitigación es mantener artefactos, schemas y fuentes en formatos propios, registrar embeddings por versión, probar un proveedor alternativo periódicamente y no depender de features exclusivas para invariantes.

### 38.14 Principio permanente

Ninguna mejora futura —agentes, reasoning avanzado, multimodalidad, fine-tuning o modelos locales— puede conceder a la IA autoridad sobre dominio, retención, olvido, repaso, desbloqueo o publicación. La frontera entre generación probabilística y decisión del sistema es una invariante arquitectónica permanente.

---

**Mandato final:** el AI Engine produce candidatos, no verdad ni decisiones. Su calidad depende de contexto confiable, contratos pequeños y versionados, validación independiente, trazabilidad completa y publicación explícita. Si una respuesta no puede reproducirse, auditarse, validarse y revertirse, no puede convertirse en contenido de aprendizaje.

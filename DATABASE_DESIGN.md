# DATABASE_DESIGN — Modelo conceptual del Learning Operating System

| Campo | Valor |
|---|---|
| Estado | Diseño conceptual obligatorio |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Documento padre | `MASTER_SPEC.md` 1.0.0 |
| Alcance | Dominio, relaciones, invariantes, persistencia conceptual e índices |
| Exclusiones | Prisma, SQL, migraciones y código de implementación |

## 1. Autoridad y trazabilidad

Este documento desarrolla el modelo conceptual exigido por `MASTER_SPEC.md`. No reemplaza ni modifica sus decisiones. Ante cualquier diferencia interpretativa prevalece `MASTER_SPEC.md`; una modificación incompatible exige una enmienda formal y un ADR.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** conservan el significado contractual definido en el documento padre. Los nombres de entidades se expresan en inglés porque esa es la convención del código y los contratos; las descripciones del producto permanecen en español.

Toda fase posterior que diseñe esquemas físicos, Prisma, migraciones, repositorios, API, jobs o analítica DEBE leer primero `MASTER_SPEC.md`, luego este documento completo y después los demás artefactos previos en orden cronológico.

### 1.1 Matriz de trazabilidad

| Requisito fuente | Decisión de este documento | Secciones |
|---|---|---|
| Dominio real por concepto | `UserConceptState` como proyección canónica y `EvidenceEvent` inmutable | 11, 16 |
| Tema → Nivel → Subnivel → Lección | Jerarquía editorial versionada | 5, 8 |
| Mayor granularidad Concepto → Lección | Asociación semántica muchos-a-muchos `LessonConcept`; vista ordenada sin falsa propiedad | 3.2, 8.4, 10 |
| Exactamente 30 ejercicios | `SublevelExercisePlacement` versionado y validación atómica al publicar | 9, 12 |
| Contenido IA persistente y no sobrescrito | Generaciones, artefactos y versiones append-only con clave canónica | 14 |
| Intentos completos | `ExerciseAttempt`, `AttemptSubmission`, `HintUsage`, `ExecutionResult` | 13 |
| Repetición individual | Estado, historial y agenda separados; parámetros versionados | 17 |
| Dashboard eficiente | Eventos fuente más proyecciones diarias y snapshots | 18 |
| XP, racha y logros solamente | Ledgers y estados específicos; exclusiones explícitas | 19 |
| Monolito modular y Clean Architecture | Propiedad de datos por contexto y referencias por identidad | 4, 6 |
| Eventos reconstruibles | `EvidenceEvent`, `XpLedgerEntry` y `OutboxEvent` append-only | 11, 19, 21 |

## 2. Filosofía del modelo

### 2.1 El conocimiento es el centro, no el consumo

El modelo separa cinco hechos que suelen confundirse:

1. **Contenido:** aquello que el sistema enseña.
2. **Actividad:** lo que el usuario hizo y durante cuánto tiempo estuvo activo.
3. **Evidencia:** una observación evaluable obtenida de una respuesta.
4. **Dominio:** una estimación probabilística derivada de evidencia.
5. **Retención:** una predicción temporal de recuperación futura.

Leer teoría, abrir una lección o mantener una pestaña activa genera actividad, pero NO genera dominio. Completar 30 ejercicios tampoco equivale automáticamente a dominar. Este desacoplamiento es una invariante estructural.

### 2.2 Hechos inmutables y proyecciones reconstruibles

Intentos, evidencia, entradas de XP, auditorías, publicaciones y generaciones de IA se conservan como hechos históricos. Los estados actuales —dominio, agenda de repaso, agregados diarios, racha— son proyecciones optimizadas que pueden reconstruirse con su versión algorítmica.

Esta estrategia aporta auditabilidad, explicabilidad, recalibración y analítica sin convertir todo el sistema en event sourcing. PostgreSQL continúa siendo la fuente de verdad transaccional.

### 2.3 Identidad estable, contenido versionado

Una entidad conceptual estable responde “qué es”: un Topic, Concept, Exercise o Lesson. Su versión responde “cómo estaba definido/publicado en ese momento”. Las relaciones de intentos y publicaciones apuntan siempre a versiones concretas, nunca solamente al objeto mutable.

### 2.4 Normalización operacional y desnormalización deliberada

El núcleo transaccional se normaliza para preservar integridad y evitar contradicciones. El dashboard y las listas de trabajo utilizan proyecciones desnormalizadas. Toda duplicación debe indicar fuente, mecanismo de actualización, tolerancia de retraso y método de reconstrucción.

### 2.5 No usar una tabla polimórfica universal

No se recomienda un diseño genérico basado exclusivamente en `entityType + entityId`. Debilita claves foráneas, cardinalidades y comprensión. Se permiten referencias tipadas únicamente en eventos, auditoría, artefactos extensibles o proyecciones cuyos consumidores toleran validación de aplicación. Las relaciones de negocio principales son explícitas.

### 2.6 Identificadores, tiempo y eliminación

- Identificadores públicos no secuenciales y estables.
- Instantes almacenados en UTC; zona IANA del usuario en preferencias.
- Secuencias editoriales usan posiciones enteras positivas únicas dentro de su padre/versionado.
- Contenido publicado y hechos de aprendizaje no se eliminan físicamente durante su retención obligatoria.
- El borrado de cuenta se implementa por anonimización o eliminación coordinada según categoría y política, preservando únicamente aquello legal u operacionalmente necesario.
- Soft delete solo se usa cuando existe un caso de recuperación o referencia histórica; no como sustituto automático del borrado.

## 3. Decisiones estructurales fundamentales

### 3.1 Dos estructuras complementarias

El dominio contiene simultáneamente:

**Jerarquía editorial:** Topic → TopicVersion → Level → Sublevel → Lesson/Content → Exercise set/Quiz.

**Grafo semántico:** Concept → ConceptVersion → relaciones entre conceptos, enlaces con lecciones, ejercicios, preguntas y evidencia.

La jerarquía responde dónde y en qué orden se enseña. El grafo responde qué conocimiento representa, de qué depende y cómo diagnosticar una debilidad.

### 3.2 Resolución de “Subnivel → Concepto → Lección”

La vista pedagógica puede presentar Topic → Level → Sublevel → Concept → Lesson, pero Concept no será propietario exclusivo de Lesson. Una lección puede enseñar varios conceptos y un concepto puede reforzarse en varias lecciones. Se modela mediante `SublevelConcept` y `LessonConcept` con rol, peso y orden.

Esta decisión es superior a una clave directa de Lesson hacia un único Concept porque:

- evita duplicar una lección integradora;
- permite medir conceptos principales y secundarios;
- conserva la lección principal por subnivel exigida por `MASTER_SPEC.md`;
- permite que el mismo concepto se recupere en diferentes contextos;
- mantiene el grafo independiente de la presentación editorial.

### 3.3 Fuente canónica de dominio y proyecciones por alcance

La fuente canónica de conocimiento es `UserConceptState`, derivada de `EvidenceEvent`. Para satisfacer consultas y visualización por Topic, Level, Sublevel y Lesson se mantiene `UserScopeMasterySnapshot`. Para Exercise se mantiene `UserExerciseState`.

El “dominio por ejercicio” significa probabilidad de resolver esa versión o una equivalente, familiaridad, desempeño y fuerza de evidencia; no se interpreta como conocimiento transferible. El dominio de Topic/Level/Sublevel/Lesson se deriva de conceptos mediante política versionada. Nunca se actualiza manualmente ni por porcentaje de contenido visto.

### 3.4 Contenido base y contenido generado

El contenido puede ser humano, generado por IA o híbrido. Su procedencia no cambia su contrato pedagógico. `ContentArtifactVersion` ofrece trazabilidad común, mientras las entidades tipadas conservan integridad y semántica. IA propone; revisión y reglas del backend validan y publican.

## 4. Bounded contexts y propiedad de datos

| Módulo | Responsabilidad | Agregados propietarios | Dependencias permitidas |
|---|---|---|---|
| Identity & Access | Cuenta, credenciales, sesiones, roles, consentimiento | User, Session, Role | Configuration, Administration |
| Curriculum | Taxonomía, conceptos, knowledge graph, rutas | Topic, CurriculumPublication, ConceptGraph, LearningPath | Administration |
| Content | Lecciones, teoría, ejemplos, ejercicios, quizzes, publicación | Lesson, Exercise, Quiz, ContentArtifact | Curriculum, AI Gateway |
| Practice | Sesiones e intentos evaluables | LearningSession, ExerciseAttempt, QuizAttempt | Content, Curriculum |
| Mastery | Evidencia y estados de conocimiento | EvidenceStream, UserConceptMastery | Practice, Curriculum, Configuration |
| Review | Agenda y sesiones de repetición | ReviewPlan, ReviewSession | Mastery, Content |
| AI Gateway | Proveedores, plantillas, generaciones y validaciones | PromptTemplate, AIGeneration | Content, Administration |
| Analytics | Actividad y proyecciones de dashboard | StudyActivity, AnalyticsProjection | eventos de todos los módulos |
| Gamification | XP, racha y logros | XpLedger, Streak, Achievement | Practice, Mastery, Analytics |
| Notifications | Preferencias y entregas | Notification, NotificationPreference | Identity, Review |
| Configuration | Políticas y feature flags versionados | PolicyVersion, FeatureFlag | Administration |
| Administration & Operations | Revisión, incidencias, auditoría, jobs, outbox | ContentReview, AuditLog, JobRecord, Outbox | referencias a todos |

Un módulo no modifica tablas de otro módulo de manera directa. La coordinación ocurre mediante casos de uso, transacciones explícitas cuando comparten proceso local o eventos internos con outbox. Esta regla prepara una futura extracción sin introducir microservicios hoy.

## 5. Mapa de agregados

### 5.1 Identity & Access

**User** es raíz de identidad y preferencias de cuenta. Protege estado de cuenta, correo normalizado, perfil mínimo, onboarding y referencias a consentimiento. Credenciales y sesiones poseen ciclos de vida de seguridad propios y no se cargan junto al perfil habitual.

**Session** es raíz operacional revocable. Mantiene solo hash del token opaco, dispositivo resumido, expiración, rotación y revocación.

**Role** es catálogo administrativo; `UserRole` asigna rol con alcance y vigencia. No se embebe una lista mutable de permisos en User.

### 5.2 Curriculum

**Topic** conserva identidad estable. `TopicVersion` encierra la definición editorial versionada y sus Level/Sublevel para una edición. Publicar congela la versión.

**Concept** conserva identidad semántica estable. `ConceptVersion` define significado, criterios y dificultad en un momento. El grafo publicado se congela dentro de `CurriculumPublication`.

**CurriculumPublication** es raíz de consistencia de una entrega. Garantiza que versiones de tema, contenido, placements, quiz y grafo sean compatibles y publicables como un conjunto.

**LearningPath** define una ruta recomendada sobre versiones publicadas. No sustituye al currículo ni bloquea navegación.

### 5.3 Content

**Lesson** posee versiones editoriales con bloques ordenados, ejemplos, resumen, conexión previa, mini revisión y estimaciones. Publicada, su versión es inmutable.

**Exercise** posee `ExerciseVersion`, pistas, casos de prueba, explicación, solución privada, rúbrica y relaciones conceptuales. La identidad estable permite comparar versiones sin mezclar intentos.

**Quiz** posee versión y placements de ítems. Garantiza cobertura de conceptos, separación de banco y ausencia de pistas.

**ContentArtifact** representa procedencia y revisión transversal, no reemplaza las entidades tipadas.

### 5.4 Practice

**LearningSession** agrupa una experiencia activa, sus ítems asignados y mediciones de tiempo. Puede ser práctica de subnivel, diagnóstico, remedial o libre.

**ExerciseAttempt** es raíz por presentación de una versión concreta de ejercicio. Contiene una o más entregas, uso de pistas, ejecuciones y resultado final. Se cierra de forma irreversible.

**QuizAttempt** congela el quiz y sus ítems asignados. No admite pistas y calcula resultado únicamente con evaluaciones deterministas o rúbricas autorizadas.

### 5.5 Mastery

**EvidenceStream** se materializa como eventos append-only por usuario; cada evento enlaza origen y conceptos afectados.

**UserConceptMastery** contiene el estado actual `UserConceptState`, historial de cambios/snapshots y versión de política. Solo el motor de dominio puede modificarlo.

### 5.6 Review

**ReviewPlan** mantiene una agenda por usuario-concepto y su prioridad. Es derivada, pero persistida para consultas eficientes.

**ReviewSession** congela los ítems seleccionados y motivos. Los resultados crean intentos/evidencia ordinaria; Review no calcula dominio por sí mismo.

### 5.7 AI Gateway

**PromptTemplate** posee versiones inmutables.

**AIGeneration** registra una solicitud lógica, sus ejecuciones/reintentos, salida cruda restringida, artefactos candidatos, validaciones, coste y decisión editorial. Una clave canónica aceptada impide generaciones equivalentes repetidas.

### 5.8 Analytics y Gamification

**StudyActivity** registra intervalos activos validados.

**AnalyticsProjection** contiene agregados reconstruibles por usuario, día y alcance.

**XpLedger** es append-only y deduplicado por evento fuente.

**Streak** conserva estado actual y días calificados reconstruibles.

**Achievement** separa definición versionada de concesión al usuario.

## 6. Catálogo completo de entidades por módulo

### 6.1 Usuarios e identidad

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| User | Identidad interna, estado, correo normalizado, locale, zona horaria, onboarding | PendingVerification → Active → Suspended/DeletionRequested → Anonymized; correo único activo |
| UserProfile | Nombre visible opcional, preferencias pedagógicas, experiencia declarada | Mutable, minimizado; no guarda dominio |
| Credential | Tipo, identificador, hash Argon2id, versión de parámetros, cambio requerido | Nunca guarda contraseña; rotación auditable |
| EmailVerificationToken | Hash, expiración, uso y propósito | Un solo uso; expiración corta |
| PasswordResetToken | Hash, expiración, uso y sesión invalidada | Un solo uso; no revela existencia de usuario |
| Session | Hash de token, familia de rotación, expiración, última actividad, revocación | Opaca, revocable y rotada después de eventos sensibles |
| Role | Student, ContentEditor, Reviewer, Administrator, Operator | Catálogo controlado; no borrado si está referenciado |
| UserRole | Usuario, rol, alcance, concedente, vigencia | Único por usuario/rol/alcance activo |
| Consent | Tipo, versión de texto, decisión, fecha, procedencia | Historial append-only; la última decisión efectiva se proyecta |
| UserPreference | Idioma, zona IANA, accesibilidad, carga diaria, notificaciones | Validada; cambios temporales no alteran historial |
| OnboardingProfile | Objetivo, experiencia, disponibilidad, diagnóstico aceptado | No determina permisos ni dominio por sí solo |

### 6.2 Currículo y knowledge graph

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| Topic | Identidad estable, slug global, estado de catálogo | No contiene texto mutable publicado |
| TopicVersion | Nombre, descripción, resultados, audiencia, locale, número de versión | Draft → Review → Published → Retired; publicada inmutable |
| Level | Identidad estable dentro de Topic | Orden pedagógico estable por edición |
| LevelVersion | Título, resultado, dificultad, posición, TopicVersion | Congelada con publicación |
| Sublevel | Identidad estable de unidad atómica | Puede tener varias versiones editoriales |
| SublevelVersion | Objetivo, dificultad, tiempos, posición, reglas de cobertura | Exactamente una lección principal y 30 placements al publicar |
| Concept | Identidad semántica estable, clave canónica | No depende del nombre visible ni del tema |
| ConceptVersion | Definición, criterios, errores frecuentes, dificultad base, locale | Inmutable al publicar; una redefinición semántica incompatible crea otro Concept |
| ConceptAlias | Sinónimo, abreviatura o término localizado | Ayuda a búsqueda; no crea equivalencia automática |
| SublevelConcept | Asociación, rol principal/secundario/prerrequisito, peso, orden, cobertura | Al menos un concepto principal por subnivel |
| ConceptRelation | Arista dirigida, tipo, fuerza, criticidad, evidencia/justificación, vigencia | Versionada, sin auto-relaciones, validada contra ciclos según tipo |
| GraphPublication | Conjunto consistente de nodos/aristas y versión | Inmutable; asociado a CurriculumPublication |
| LearningPath | Ruta estable, audiencia y objetivo | Draft/Published/Retired |
| LearningPathVersion | Secuencia/recomendaciones y política de entrada | Publicada inmutable |
| LearningPathStep | Apunta a Topic/Level/Sublevel/Concept publicado, orden y opcionalidad | Una posición por versión de ruta |
| UserLearningPath | Inscripción/recomendación, fecha, estado y paso sugerido | No otorga dominio; se actualiza por reglas backend |
| CurriculumPublication | Manifest de versiones compatibles, locale, estado y fechas | Publicación atómica y revertible por nueva publicación, no por mutación |

### 6.3 Lecciones y contenido teórico

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| Lesson | Identidad estable y tipo principal/remedial/review | No contiene el cuerpo publicado |
| LessonVersion | Objetivo, resumen, conexión previa, tiempos estimados, locale, procedencia | Draft → Review → Approved → Published → Superseded/Retired |
| LessonBlock | Bloque ordenado: teoría, clave, conexión, resumen u otro renderer registrado | Esquema tipado y posición única por versión |
| TheoryBlock | Contenido pedagógico concreto y nivel de profundidad | No repite sin propósito; asociado a conceptos |
| Example | Básico/intermedio/avanzado, explicación y artefacto ejecutable opcional | Cada lección principal requiere los tres niveles |
| LessonConcept | ConceptVersion, rol, peso, orden y resultado esperado | Muchos-a-muchos; pesos positivos normalizables |
| MiniReview | Evaluación diagnóstica de 2 a 5 ítems | No aumenta dominio por lectura; respuestas sí pueden crear evidencia de baja ponderación |
| MiniReviewItem | Enunciado, tipo, conceptos, evaluador y explicación | No revela solución durante intento activo |
| ContentAsset | Metadatos de archivo, hash, media type, tamaño, accesibilidad, almacenamiento | Inmutable por hash; reemplazo crea asset nuevo |
| ContentArtifact | Identidad transversal de artefacto y tipo | Enlaza contenido humano/IA con revisión sin perder entidad tipada |
| ContentArtifactVersion | Payload normalizado, hash, procedencia, autor, versión de esquema | Append-only; solo versiones aprobadas pueden publicarse |

### 6.4 Ejercicios y evaluaciones

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| Exercise | Identidad estable, familia semántica y estado | Versiones preservan historial |
| ExerciseVersion | Enunciado, tipo, dificultad, objetivo, material inicial, configuración de evaluador, solución privada, explicación, locale, fecha y procedencia | Inmutable tras publicación; solución nunca llega anticipadamente al cliente |
| ExerciseTypeDefinition | Clave de tipo, capacidades, renderer, evaluador, esquema de respuesta y versión | Registro extensible; deshabilitar no invalida historia |
| ExerciseConcept | ConceptVersion, rol principal/secundario/prerrequisito, peso de evidencia | Exactamente un principal; suma/política validada |
| ExerciseHint | Nivel progresivo, objetivo conceptual, contenido, orden | Orden único; no revela respuesta; versionado con ExerciseVersion |
| ExerciseTestCase | Entrada, resultado esperado, visibilidad, peso, límites | Casos ocultos nunca se exponen; al menos uno evaluable cuando aplica |
| EvaluationRubric | Criterios, pesos, versión y modo determinista/asistido | Texto libre usa rúbrica versionada; IA futura no es autoridad única |
| CommonErrorPattern | Clasificación conceptual/sintáctica/atención/estrategia y feedback | Puede mapear a ConceptRelation para diagnóstico |
| ExerciseFingerprint | Hash estructural, semántico y de solución, modelo/versión de cálculo | Único según política de publicación; similitudes quedan auditadas |
| SublevelExercisePlacement | SublevelVersion, ExerciseVersion, posición 1–30, bloque de dificultad, obligatoriedad | Exactamente 30 posiciones únicas al publicar |
| Quiz | Identidad estable ligada a Sublevel | Banco separado de ejercicios ordinarios |
| QuizVersion | Política, duración orientativa, umbral informativo, cobertura | Sin pistas; publicación inmutable |
| QuizItem | Placement de ejercicio/pregunta nueva, posición, peso y conceptos | No copia ejercicios de práctica según fingerprint |
| QuizCoverage | ConceptVersion y peso esperado | Todos los conceptos principales cubiertos |

### 6.5 Aprendizaje, práctica e historial

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| LearningSession | Usuario, tipo, contexto curricular, inicio/fin, estado, cliente y política | Planned/Active/Paused/Completed/Abandoned/Expired |
| SessionItem | Ítem asignado, razón, orden, versión de contenido, estado | Congela selección para reproducibilidad |
| ExerciseAttempt | Usuario, ExerciseVersion, SessionItem, ordinal, inicio/fin, estado, resultado y policyVersion | Open → Evaluated/Abandoned/Invalidated; cierre irreversible |
| AttemptSubmission | Cada envío dentro del intento, respuesta, timestamp, duración activa, idempotency key | Append-only; ordinal único por intento |
| ExecutionResult | Runner, lenguaje/runtime, salida truncada, error, límites, casos y duración | Datos sensibles filtrados; inmutable |
| EvaluationResult | Corrección, score, error class, criterios, evaluador/versiones | Una decisión efectiva por submission; reevaluaciones se versionan |
| HintUsage | Hint exacta, orden, momento, tiempo previo y contexto | Append-only; permite medir dependencia |
| ExplanationView | Explicación versionada, primera/última vista y duración activa razonable | Actividad, no evidencia de dominio |
| DraftAnswer | Borrador sincronizado, versión cliente y expiración | Mutable/efímero; no es intento hasta envío |
| QuizAttempt | Usuario, QuizVersion, ítems congelados, inicio/fin y resultado | Sin pistas; cierre irreversible |
| QuizItemAttempt | Respuesta y evaluación por ítem | Apunta a versión exacta |
| DiagnosticAttempt | Diagnóstico inicial o puente | Evidencia diferenciada por contexto |
| StudySession | Ventana analítica que agrupa actividad activa entre umbrales de inactividad | Derivada; no equivale a LearningSession pedagógica |

### 6.6 Dominio

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| EvidenceEvent | Hecho evaluable: usuario, origen, contexto, novedad, resultado, dificultad, pistas, conceptos y policyVersion | Append-only, idempotente y nunca reescrito |
| EvidenceConceptImpact | Distribución del evento por ConceptVersion, rol y peso | Al menos un impacto; suma normalizada según política |
| UserConceptState | Dominio, confianza, estabilidad, dificultad individual, retención prevista, próxima revisión, contadores y algoritmo | Único por usuario/Concept estable/política efectiva |
| MasteryStateTransition | Antes/después, causa, evento, cálculo y fecha | Append-only; explica cada cambio significativo |
| MasterySnapshot | Estado de un conjunto en fecha de corte | Inmutable, reconstruible, usado para tendencias |
| UserScopeMasterySnapshot | Topic/Level/Sublevel/Lesson, dominio agregado, cobertura, confianza, política y fecha | Derivado; nunca entrada del algoritmo conceptual |
| UserExerciseState | Familiaridad, probabilidad de éxito, intentos, mejor dificultad, última versión y recencia | No se agrega como sustituto de dominio conceptual |
| AlgorithmVersion | Identidad, parámetros, umbrales, estado draft/shadow/active/retired | Solo una activa por propósito/cohorte; nunca cambia retrospectivamente |
| ShadowCalculation | Resultado alternativo para un mismo evento/estado | No afecta UX hasta promoción formal |

### 6.7 Repasos

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| ReviewSchedule | Usuario-concepto, dueAt, prioridad, estabilidad, dificultad, intervalo, motivo y policyVersion | Uno efectivo por usuario/concepto; recalculado por evidencia |
| ReviewScheduleHistory | Estado anterior/nuevo, evento disparador y explicación | Append-only |
| ReviewPlan | Cola materializada, horizonte, carga objetivo y fecha de cálculo | Recalculable; no altera dominio |
| ReviewPlanItem | Concepto, razón, prioridad, rango de dificultad, tipos permitidos | Puede posponerse con límites de política |
| ReviewSession | Usuario, plan, inicio/fin, estado y política | Selección congelada al iniciar |
| ReviewItem | Concepto objetivo, ExerciseVersion, razón, orden y resultado | Ejercicio nuevo/variante validada; no muta catálogo |
| ReviewDeferral | Motivo, fecha solicitada, nueva fecha y límites | No marca dominio ni borra vencimiento histórico |
| LapseRecord | Evento de fallo tras dominio previo, severidad y recuperación posterior | Derivado de evidencia, útil para calibración |

### 6.8 Inteligencia artificial

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| AIProvider | Proveedor lógico, capacidades y estado | Gemini inicial; no almacena secreto |
| AIModel | Identificador del proveedor, capacidades, contexto, disponibilidad y fechas | Configurable; no se codifica en dominio |
| PromptTemplate | Identidad estable, propósito y tipo de contenido | Contenedor de versiones |
| PromptTemplateVersion | Plantilla, variables permitidas, esquema esperado, locale, autor y hash | Draft → Approved → Retired; inmutable tras uso aprobado |
| AIGeneration | Solicitud lógica, content key, target, propósito, actor, estado y generación aceptada | Una aceptación efectiva por clave canónica/contexto |
| AIGenerationAttempt | Proveedor/modelo, parámetros, request hash, respuesta cruda restringida, latencia, uso, coste, error y retry number | Append-only; cada llamada real queda registrada |
| AIGeneratedCandidate | Artefacto normalizado propuesto y su hash | Candidate → Quarantined/Validated/Rejected/Accepted |
| AIValidationRun | Validador/versiones, resultado, severidad, hallazgos y métricas | Append-only; revalidar crea nueva ejecución |
| HumanReview | Revisor, decisión, comentarios, checklist y fecha | Aprobación inicial obligatoria para publicación IA |
| GenerationComparison | Candidatos comparados, criterios y decisión | Audita regeneración o cambio de modelo |
| AIUsageAggregate | Uso/coste por día, proveedor, modelo y propósito | Proyección reconstruible para cuotas y dashboard operativo |

### 6.9 Estadísticas y actividad

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| ActivityEvent | Interacción relevante, usuario, tipo, instante, duración candidata y contexto | Append-only; no toda actividad es estudio válido |
| ActiveStudyInterval | Intervalo validado sin inactividad, fuente y duración | Derivado; intervalos no se solapan por usuario |
| UserDailyAggregate | Tiempo, sesiones, intentos, aciertos, errores, pistas, XP y revisiones por fecha local | Recalculable; clave usuario/fecha/zona/policyVersion |
| UserScopeDailyAggregate | Métricas diarias por Topic/Level/Sublevel/Concept | Solo para alcances consultados; evita explosión innecesaria |
| AccuracyAggregate | Primer intento y todos los intentos separados, por tipo/dificultad | No mezcla definiciones |
| DurationDistribution | Conteo, suma, bins o estructura de percentiles/mediana | Permite mediana/p95 sin escanear intentos |
| WeakConceptProjection | Razones, retención, lapsos, confianza y rank | Derivada de Mastery, no etiqueta personal permanente |
| StrongConceptProjection | Dominio, confianza, estabilidad y evidencia reciente | Recalculada con política vigente |
| DashboardSnapshot | Respuesta materializada por periodo común y versión | Opcional; TTL lógico e invalidación por eventos |
| ContentQualityAggregate | Dificultad observada, discriminación, abandono, incidencias, hints | Anonimizada y con mínimos de cohorte |

### 6.10 Gamificación

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| XpLedgerEntry | Delta, razón, fuente, policyVersion y deduplication key | Append-only; nunca se edita saldo directamente |
| UserXpBalance | Saldo proyectado y última entrada procesada | Reconstruible desde ledger |
| StreakPolicy | Actividad mínima, zona, tolerancia y versión | Versionada; no retroactiva sin decisión explícita |
| QualifiedStudyDay | Día local, actividad válida, policyVersion y estado | Reconstruible desde intervalos/evidencia |
| StreakState | Actual, máxima, último día calificado y política | Proyección; no usa culpa ni gasto |
| AchievementDefinition | Clave, criterio pedagógico, versión, visibilidad e icono | No monetario, sin ranking |
| UserAchievement | Usuario, definición/version, fecha, evento fuente | Único por regla repetible/no repetible |

No existen entidades para monedas, tienda, ranking, loot boxes, marketplace, inventario ni economía virtual.

### 6.11 Configuración, notificaciones y administración

| Entidad | Responsabilidad y datos conceptuales | Ciclo de vida / reglas |
|---|---|---|
| PolicyDefinition | Tipo: mastery, review, XP, streak, analytics, publication | Identidad estable |
| PolicyVersion | Parámetros validados, vigencia, estado y checksum | Draft/Shadow/Active/Retired; inmutable activa |
| FeatureFlag | Clave, alcance, regla, vigencia y propietario | No contiene secretos; cambios auditados |
| SystemSetting | Configuración no secreta tipada y alcance | Versionada cuando afecta resultados |
| NotificationPreference | Canal, categoría, opt-in, quiet hours y locale | Respeta consentimiento |
| Notification | Plantilla/version, destinatario, motivo, estado y fecha programada | No decide repasos; comunica decisiones backend |
| NotificationDelivery | Canal, intento, proveedor, resultado y error seguro | Append-only por intento |
| ContentReview | Artefacto/version, checklist, asignación, decisión | Separación de autor y revisor cuando riesgo lo exige |
| ContentIncident | Contenido/version, severidad, impacto, reporte y resolución | Puede retirar publicación sin borrar historial |
| AuditLog | Actor, acción, recurso, antes/después seguro, IP resumida, correlation ID | Append-only, acceso restringido |
| OutboxEvent | Tipo, versión, payload mínimo, agregado, estado y reintentos | Creado en misma transacción que el hecho |
| JobRecord | Tipo, idempotency key, estado, ejecución, error, nextAttempt | Historial operacional; payload sensible minimizado |
| DeadLetter | Evento/job fallido, diagnóstico y resolución | No se descarta silenciosamente |

## 7. Value Objects

Los Value Objects carecen de identidad propia, se comparan por valor, son inmutables y validan invariantes al construirse conceptualmente.

| Value Object | Semántica e invariantes |
|---|---|
| EmailAddress | Normalización definida, formato válido, conserva presentación separada si se necesita |
| Locale | Código soportado; participa en identidad de contenido |
| TimeZoneId | Identificador IANA válido; nunca offset fijo para rachas |
| Percentage | Valor cerrado entre 0 y 100 |
| Probability | Valor entre 0 y 1; no se confunde con Percentage |
| Confidence | Probabilidad con semántica de certeza estimada |
| Difficulty | Escala calibrada, versión y origen base/observada/individual |
| Stability | Duración positiva en días con límites de política |
| RetentionEstimate | Probabilidad, `asOf`, algoritmo y horizonte |
| MasteryVector | Dominio, confianza, estabilidad, dificultad, cobertura y recencia |
| MasteryStatus | New, Developing, Competent, Mastered, AtRisk, ReviewRequired; derivado, no libre |
| Duration | Milisegundos/segundos no negativos y fuente active/wall/runner |
| DateRange | Inicio inclusivo, fin exclusivo, inicio anterior al fin |
| LocalStudyDate | Fecha local más zona y policyVersion |
| VersionNumber | Secuencia monotónica dentro de identidad estable |
| ContentHash | Algoritmo, versión y digest de contenido normalizado |
| CanonicalContentKey | Hash de entradas semánticas versionadas; excluye metadatos irrelevantes |
| SemanticFingerprint | Firma estructural, semántica o solución y calculador/version |
| Position | Entero positivo único dentro del contenedor |
| Weight | Valor positivo, normalizado según conjunto |
| PedagogicalObjective | Verbo observable, habilidad, condición y criterio de éxito |
| ConceptRole | Primary, Secondary, Prerequisite, Remedial |
| RelationType | Prerequisite, BuildsOn, PartOf, Related, OftenConfusedWith, Applies, Equivalent |
| ErrorClassification | Conceptual, Syntax, Attention, Strategy, Runtime, Environment, Unknown |
| AnswerPayload | Unión discriminada por ExerciseType; validada contra versión de esquema |
| EvaluationScore | Resultado, score normalizado, criterios y carácter determinista |
| HintProgression | Nivel, objetivo conceptual y máximo permitido |
| IdempotencyKey | Alcance, actor y expiración lógica; única en el comando correspondiente |
| Money | Moneda, unidades menores y precisión; solo para coste de IA, nunca gamificación |
| TokenUsage | Unidades de entrada/salida/cache según proveedor |
| ResourceLimits | CPU, memoria, tiempo, salida y red permitida para runner |
| StudyLoad | Minutos/ítems objetivo y límites diarios |
| ReviewReason | Overdue, AtRisk, Lapse, WeakPrerequisite, Consolidation, ManualResume |
| AuditActor | Usuario, sistema o job con identificador y contexto |
| PublicationState | Draft, InReview, Approved, Published, Superseded, Retired, Quarantined |

Los porcentajes, probabilidades y duraciones NO se almacenan como strings de presentación. La precisión y redondeo de UI se separan del valor científico interno.

## 8. Relaciones y cardinalidades del currículo

### 8.1 Jerarquía editorial

| Relación | Cardinalidad | Regla |
|---|---|---|
| Topic a TopicVersion | 1:N | Una identidad posee historial de versiones |
| TopicVersion a LevelVersion | 1:N | Una publicación exige al menos un nivel |
| Level a LevelVersion | 1:N | Identidad estable y definición por edición |
| LevelVersion a SublevelVersion | 1:N | Posición única dentro del nivel |
| Sublevel a SublevelVersion | 1:N | Historial estable |
| SublevelVersion a LessonVersion | 1:N | Exactamente una `Primary`; puede haber remediales |
| SublevelVersion a SublevelConcept | 1:N | Al menos un concepto principal |
| LessonVersion a LessonBlock | 1:N | Orden total y bloques obligatorios |
| LessonVersion a LessonConcept | 1:N | Cada lección principal cubre uno o más conceptos |
| LessonVersion a Example | 1:N | Al menos básico, intermedio y avanzado |
| SublevelVersion a SublevelExercisePlacement | 1:30 al publicar | Posiciones 1–30 exactas |
| SublevelVersion a QuizVersion | 1:1 efectivo al publicar | Puede existir historial de versiones |

### 8.2 Grafo conceptual

| Relación | Cardinalidad | Regla |
|---|---|---|
| Concept a ConceptVersion | 1:N | Una versión publicada no se altera |
| ConceptVersion a ConceptRelation saliente | 1:N | Arista dirigida y versionada |
| ConceptVersion a ConceptRelation entrante | 1:N | Índice inverso para diagnóstico |
| ConceptVersion a ExerciseConcept | 1:N | Un concepto puede aparecer en muchos ejercicios |
| ExerciseVersion a ExerciseConcept | 1:N | Exactamente un principal; secundarios opcionales |
| ConceptVersion a LessonConcept | N:M vía asociación | Evita falsa propiedad Concept→Lesson |
| GraphPublication a ConceptRelation | 1:N | Congela el conjunto compatible |

### 8.3 Publicación

`CurriculumPublication` referencia exactamente las versiones efectivas de Topic, Graph, niveles, subniveles, lecciones, set de ejercicios y quiz. Una publicación no copia innecesariamente el contenido; crea un manifest inmutable. Solo una publicación puede ser “current” por Topic y locale, pero las anteriores siguen resolviendo intentos históricos.

### 8.4 Relaciones de usuarios, práctica y dominio

| Relación | Cardinalidad | Regla |
|---|---|---|
| User a Credential | 1:N | Una cuenta puede incorporar métodos futuros; al menos una credencial o proveedor válido para autenticarse |
| User a Session | 1:N | Varias sesiones revocables; el token nunca se conserva en claro |
| User a UserRole | 1:N | Una asignación por rol/alcance/vigencia efectiva |
| User a UserPreference | 1:1 efectiva | El historial de cambios puede auditarse aparte |
| User a UserLearningPath | 1:N | Varias rutas; como máximo una activa por propósito/Topic según política |
| User a LearningSession | 1:N | Historial completo de sesiones pedagógicas |
| LearningSession a SessionItem | 1:N | Orden único y contenido congelado |
| SessionItem a ExerciseAttempt | 1:N | Permite reintentos como presentaciones diferenciadas |
| ExerciseAttempt a AttemptSubmission | 1:N | Al menos una para estado Evaluated |
| ExerciseAttempt a HintUsage | 1:N | Cero en quizzes; orden temporal preservado |
| AttemptSubmission a EvaluationResult | 1:N | Una evaluación efectiva; reevaluaciones históricas adicionales |
| AttemptSubmission a ExecutionResult | 1:N | Cero o varias ejecuciones antes/de la evaluación según tipo |
| ExerciseAttempt a ExplanationView | 1:N | Puede verse varias veces; solo actividad |
| QuizAttempt a QuizItemAttempt | 1:N | Uno por ítem asignado al cerrar |
| EvaluationResult a EvidenceEvent | 1:0..1 canónico | Evaluaciones inválidas o no pedagógicas no generan evidencia |
| EvidenceEvent a EvidenceConceptImpact | 1:N | Distribuye evidencia entre conceptos explícitos |
| User a UserConceptState | 1:N | Uno por Concept estable bajo política efectiva |
| Concept a UserConceptState | 1:N | Un estado por usuario, no uno global |
| EvidenceEvent a MasteryStateTransition | 1:N | Una transición por concepto afectado, o ninguna si no cambia el estado materialmente |
| User a UserScopeMasterySnapshot | 1:N | Múltiples alcances, fechas y versiones de política |
| User a UserExerciseState | 1:N | Familiaridad por Exercise estable |

### 8.5 Relaciones de repaso, IA, estadísticas y gamificación

| Relación | Cardinalidad | Regla |
|---|---|---|
| UserConceptState a ReviewSchedule | 1:1 efectiva | Puede no existir mientras no haya evidencia/agenda aplicable |
| ReviewSchedule a ReviewScheduleHistory | 1:N | Toda reprogramación relevante deja historia |
| User a ReviewPlan | 1:N | Uno current por horizonte/política |
| ReviewPlan a ReviewPlanItem | 1:N | Conceptos priorizados; aún no necesariamente ejercicios |
| ReviewPlan a ReviewSession | 1:N | Una sesión puede consumir parcialmente el plan |
| ReviewSession a ReviewItem | 1:N | Selección congelada y ordenada |
| ReviewItem a ExerciseAttempt | 1:0..1 | Un ítem abandonado puede no producir intento evaluado |
| PromptTemplate a PromptTemplateVersion | 1:N | Una versión exacta por generación real |
| AIGeneration a AIGenerationAttempt | 1:N | Al menos una llamada si sale de Requested; fallos incluidos |
| AIGenerationAttempt a AIGeneratedCandidate | 1:0..N | Un proveedor puede devolver ninguno o varios candidatos normalizados |
| AIGeneratedCandidate a AIValidationRun | 1:N | Múltiples validadores y revalidaciones |
| AIGeneratedCandidate a HumanReview | 1:N | Decisiones preservadas; una aceptación efectiva controlada |
| AIGeneratedCandidate a ContentArtifactVersion | 1:0..1 por aceptación | Un candidato rechazado no se transforma en artefacto publicable |
| ContentArtifact a ContentArtifactVersion | 1:N | Procedencia transversal versionada |
| User a ActivityEvent | 1:N | Hechos de interacción minimizados |
| User a ActiveStudyInterval | 1:N | Intervalos validados no solapados |
| User a UserDailyAggregate | 1:N | Uno por fecha local/política |
| User a XpLedgerEntry | 1:N | Ledger append-only |
| User a UserXpBalance | 1:1 | Proyección reconstruible |
| User a QualifiedStudyDay | 1:N | Uno por fecha local/política efectiva |
| User a StreakState | 1:1 por política activa | Proyección actual |
| AchievementDefinition a UserAchievement | 1:N | La concesión referencia versión exacta |
| User a UserAchievement | 1:N | Sin comparaciones ni ranking |
| Hecho transaccional a OutboxEvent | 1:N | Creado dentro de la misma transacción cuando debe proyectarse |

## 9. Contrato conceptual de ejercicios

### 9.1 Identidad y versión

`Exercise` identifica la familia pedagógica. `ExerciseVersion` congela todo lo necesario para reproducir lo que vio y respondió el usuario: enunciado, material inicial, tipo y versión de esquema, dificultad declarada, objetivo, conceptos, evaluador, solución privada, explicación, pistas, casos de prueba, runtime/lenguaje, límites, fingerprints, procedencia y fecha.

Un cambio de puntuación editorial menor que no cambia interpretación puede generar versión patch; cualquier cambio que pueda alterar respuesta, evaluación, pistas, conceptos o dificultad genera nueva versión completa. Los intentos nunca se repuntan silenciosamente contra una versión nueva.

### 9.2 Exactamente 30 por subnivel

La invariante pertenece a la transición de `CurriculumPublication`, no solo a la interfaz. Antes de publicar se valida:

- 30 placements activos exactos;
- posiciones continuas 1 a 30 y únicas;
- cada placement apunta a ExerciseVersion aprobada y compatible;
- distribución de tipos dentro de los rangos de `MASTER_SPEC.md`;
- progresión por bloques de dificultad;
- ningún fingerprint duplicado o similitud no justificada;
- cobertura de todos los conceptos principales;
- solución, explicación y evaluador presentes;
- pistas progresivas para los tipos que las requieren;
- casos de prueba suficientes para ejercicios ejecutables.

La edición de un set publicado crea una nueva publicación; nunca agrega el ejercicio 31 a una versión vigente.

### 9.3 Soluciones y seguridad

La solución privada y casos ocultos pertenecen al servidor. Se puede almacenar su contenido cifrado a nivel de aplicación si el análisis de amenazas lo justifica; como mínimo se restringe acceso por rol y no se serializa en contratos de estudiante. La explicación publicable se relaciona con la versión, pero el backend decide cuándo revelarla.

### 9.4 Nuevos tipos

`ExerciseTypeDefinition` desacopla la taxonomía de los renderers y evaluadores. Su contrato define capacidades: admite código, ejecución, opciones, respuesta estructurada, pistas, casos ocultos, rúbrica y media. Un tipo nuevo no modifica datos históricos y debe declarar compatibilidad de cliente.

## 10. Knowledge Graph

### 10.1 Propósito

El grafo interno representa dependencia, composición, transferencia y confusión entre conceptos. No se expone como mapa técnico crudo al estudiante. Alimenta diagnóstico, selección remedial, orden recomendado, cobertura y explicación de recomendaciones.

### 10.2 Nodo

Cada `ConceptVersion` actúa como nodo con:

- identidad conceptual estable;
- definición operacional;
- criterios de evidencia;
- dificultad base;
- errores frecuentes;
- nivel de granularidad;
- dominio/lenguaje de aplicación;
- vigencia y locale;
- embedding o firma semántica opcional como dato derivado, nunca identidad.

Un concepto debe ser suficientemente pequeño para evaluarse con múltiples evidencias, pero suficientemente significativo para transferirse entre ejercicios. “Python” es Topic; “declarar una variable” puede ser Concept; un literal específico no lo es.

### 10.3 Aristas

| Tipo | Dirección / semántica | Reglas |
|---|---|---|
| Prerequisite | A → B: A debe conocerse antes de B | DAG dentro de una GraphPublication; criticidad y fuerza obligatorias |
| BuildsOn | A → B: B amplía A sin bloqueo duro | Puede coexistir con rutas alternativas |
| PartOf | A → B: A compone B | No representa orden temporal |
| Applies | A → B: B aplica A en contexto | Útil para transferencia |
| OftenConfusedWith | A ↔ B semánticamente simétrica | Se materializa/valida como par simétrico |
| Related | Asociación débil | No participa por defecto en propagación diagnóstica |
| Equivalent | Equivalencia versionada entre dominios/locales | Requiere revisión; no fusiona historiales automáticamente |

Solo `Prerequisite` exige ausencia de ciclos. `PartOf` no puede crear auto-inclusión transitiva. Las relaciones tienen justificación humana o evidencia, peso, criticidad y versión.

### 10.4 Diagnóstico de causa raíz

Cuando el usuario falla Condicionales, el backend:

1. Registra evidencia negativa únicamente sobre conceptos mapeados al ejercicio, ponderada por rol.
2. Obtiene prerrequisitos entrantes críticos dentro de profundidad limitada.
3. Consulta retención, confianza, lapsos y evidencia reciente de Operadores, Tipos u otros nodos.
4. Combina el patrón de error con `CommonErrorPattern` y los casos fallidos.
5. Genera hipótesis ordenadas, no certezas: “posible debilidad en Operadores”.
6. Selecciona un ejercicio diagnóstico que discrimine el prerrequisito de la habilidad objetivo.
7. Solo actualiza el dominio del prerrequisito cuando existe nueva evidencia evaluable; una inferencia del grafo no reduce por sí sola el score.

Esta última regla evita castigar en cascada conceptos no evaluados.

### 10.5 Consultas críticas

- prerrequisitos inmediatos y transitivos hasta profundidad acotada;
- conceptos desbloqueables si se fortalece un nodo;
- cobertura conceptual de una publicación;
- camino entre error observado y posible prerrequisito;
- ejercicios diagnósticos disponibles por concepto/dificultad/tipo;
- detección de ciclos antes de publicar;
- impacto de retirar o versionar un concepto.

PostgreSQL puede resolver el MVP mediante relaciones normalizadas y consultas recursivas controladas. No se introduce una base de grafos inicialmente. Se reconsidera si profundidad, frecuencia y latencia reales superan los SLO tras optimización y proyecciones de cierre transitivo selectivas.

## 11. Modelo de dominio del aprendizaje

### 11.1 Fuente de verdad

`EvidenceEvent` es la única entrada que puede cambiar dominio. Un evento procede de una evaluación reproducible e incluye:

- usuario y momento;
- intento/submission/quiz/review de origen;
- versión exacta del contenido y evaluador;
- conceptos e impactos;
- corrección y score;
- dificultad declarada e individual;
- tipo de ejercicio;
- cantidad y niveles de pistas;
- número de entrega;
- novedad/familiaridad;
- contexto practice, quiz, diagnostic o review;
- duración activa como contexto no punitivo;
- clasificación de error;
- versión de política/algoritmo;
- idempotency key.

### 11.2 Estado conceptual

`UserConceptState` mantiene:

- masteryProbability y porcentaje de presentación;
- confidence;
- memoryStabilityDays;
- individualDifficulty;
- retentionProbability y `asOf`;
- última evidencia válida y última recuperación independiente;
- siguiente revisión;
- exposiciones, intentos, aciertos, errores, pistas y lapsos;
- recuperaciones independientes y sin pistas;
- cobertura por dificultad y tipo;
- estado previo de dominio;
- última secuencia de evento aplicada;
- AlgorithmVersion.

Debe existir una única proyección vigente por usuario y Concept estable para la política activa. Los resultados históricos conservan la ConceptVersion evaluada; una regla de equivalencia aprobada decide cómo aportar a la identidad estable.

### 11.3 Dominio por alcance

| Alcance | Fuente | Persistencia recomendada | Interpretación |
|---|---|---|---|
| Concept | EvidenceEvent | UserConceptState | Fuente canónica de conocimiento |
| Lesson | Concept states + LessonConcept | UserScopeMasterySnapshot | Dominio de objetivos enseñados por esa versión |
| Sublevel | Concept states + SublevelConcept | UserScopeMasterySnapshot | Media armónica ponderada con prerrequisitos críticos |
| Level | Sublevels/concepts de publicación | UserScopeMasterySnapshot | Agregado con cobertura y confianza |
| Topic | Conceptos de TopicVersion | UserScopeMasterySnapshot | Panorama, no reemplaza detalle |
| Exercise | Intentos propios y equivalentes | UserExerciseState | Familiaridad/probabilidad de resolver; no transferencia global |

Cada snapshot incluye publicación, fecha de corte, algoritmo, cobertura y confianza. Un Topic puede mostrar 90% solamente si no oculta conceptos críticos bajo el umbral. La cobertura evita que pocos conceptos perfectos produzcan un agregado engañoso.

### 11.4 Ciclo de actualización

1. Practice persiste evaluación e intento.
2. En la misma transacción crea EvidenceEvent y OutboxEvent, o garantiza idempotencia equivalente.
3. Mastery aplica el evento en orden por usuario/concepto.
4. Persiste transición explicable y estado nuevo.
5. Review recalcula agenda.
6. Analytics y Gamification actualizan proyecciones fuera del camino crítico.

Eventos duplicados no cambian estado. Eventos tardíos se procesan por secuencia lógica o disparan reconstrucción localizada. Nunca se actualiza un porcentaje con incrementos ad hoc desde un controller.

### 11.5 Versionado algorítmico

`AlgorithmVersion` contiene parámetros de trazado bayesiano, curva de retención, umbrales, pesos por tipo/dificultad/pistas, cobertura mínima y reglas de independencia. Pasa Draft → Shadow → Active → Retired.

Una versión nueva reproduce eventos en sombra, compara calibración y, al promoverse, reconstruye proyecciones de forma controlada. Los snapshots históricos indican con qué versión fueron calculados. No se reinterpretan silenciosamente cifras antiguas en gráficas; la interfaz puede mostrar serie recalculada o histórica, pero declara la política.

## 12. Restricciones e invariantes globales

### 12.1 Currículo y contenido

- Slug único por identidad y ámbito/locale definido.
- VersionNumber única y creciente por entidad estable.
- Una versión Published es inmutable.
- Una sola publicación current por Topic/locale; cambiarla es una transición atómica.
- Level y Sublevel tienen posiciones únicas en su padre/version.
- Cada Sublevel publicado tiene una lección principal, al menos un concepto principal, exactamente 30 ejercicios y un quiz compatible.
- Cada lección principal contiene objetivo, teoría, ejemplo básico/intermedio/avanzado, resumen, conceptos, conexión y tiempos.
- Cada ejercicio tiene exactamente un concepto principal, objetivo, dificultad, tipo registrado, explicación y evaluación válida.
- La solución no puede formar parte del payload público durante intentos activos.
- Quiz no admite hints y no reutiliza fingerprints de los 30 ejercicios.

### 12.2 Grafo

- Source y target son distintos.
- No hay duplicado de tipo/dirección dentro de una GraphPublication.
- `Prerequisite` es acíclica y no cruza versiones incompatibles.
- Relaciones simétricas se validan como par lógico.
- No se publican conceptos huérfanos que sean referenciados por contenido sin definición publicada.

### 12.3 Intentos y evidencia

- Un intento pertenece a un usuario y versión exacta.
- La idempotency key es única por usuario/comando/alcance.
- Ordinal de submission único dentro del intento.
- Un intento cerrado no acepta submissions ni hints.
- Un QuizAttempt no acepta HintUsage.
- Cada evaluación efectiva produce como máximo un EvidenceEvent canónico.
- ExplanationView y ActivityEvent nunca se transforman solos en evidencia.
- La duración activa no puede ser negativa y se limita ante relojes/clientes anómalos.

### 12.4 Dominio y repaso

- Dominio permanece entre 0 y 100; probabilidad/confianza entre 0 y 1.
- Stability e intervalos son positivos y limitados por PolicyVersion.
- Solo Mastery actualiza UserConceptState.
- El usuario no puede marcar manualmente dominio.
- ReviewSchedule efectiva es única por usuario/concepto.
- Todo cambio de dominio y agenda es explicable por evento y algoritmo.

### 12.5 IA

- Una clave canónica aceptada evita una nueva llamada equivalente.
- Cada llamada externa crea AIGenerationAttempt, aun si falla.
- Nunca se sobrescribe respuesta, candidato, validación ni review.
- Solo un candidato aceptado puede vincularse como versión de contenido publicable.
- La aprobación humana es obligatoria en el alcance inicial.
- Gemini no escribe UserConceptState, EvidenceEvent evaluado, ReviewSchedule, XP ni permisos.

### 12.6 Analítica y gamificación

- XP es ledger; saldo es proyección.
- Una fuente concede XP una sola vez según policy/deduplication key.
- Racha usa LocalStudyDate y TimeZoneId, no UTC crudo.
- Primer intento y todos los intentos nunca se mezclan en un mismo numerador sin etiqueta.
- Tiempo de pestaña abierta no cuenta como estudio.
- No existen monedas, ranking, tienda, marketplace ni loot boxes.

## 13. Historial detallado de intentos

### 13.1 Qué debe conservarse

Por cada ejercicio presentado se conserva la versión exacta, contexto, orden en la sesión, razón de selección y política. Por cada submission: respuesta tipada, tiempo activo desde la anterior, resultado, score, casos visibles/ocultos agregados, error, runtime, cantidad de pistas acumuladas y fecha. Por cada hint: versión, nivel, momento y objetivo conceptual. Por cada explicación: versión y evento de visualización.

El campo “intentos” se desambigua:

- Attempt: una presentación del ejercicio.
- Submission: cada respuesta dentro de esa presentación.
- Exposure: cualquier vez que se mostró contenido evaluable.
- IndependentRetrieval: intento separado lo suficiente o con variante nueva según política.

### 13.2 Respuestas y privacidad

Las respuestas pueden contener código o texto personal accidental. Se define retención, acceso y exportación. Outputs del runner se truncan y sanitizan. No se registran variables de entorno, secretos ni filesystem del runner. Para analítica agregada se evita replicar el payload de respuesta.

### 13.3 Corrección posterior de un ejercicio

Si se detecta un error de contenido, `ContentIncident` marca versiones afectadas. Los intentos permanecen. Una reevaluación genera `EvaluationResult` nuevo y, si corresponde, un EvidenceEvent compensatorio explícito; nunca se edita el evento original. Mastery se reconstruye para usuarios afectados y la auditoría conserva motivo.

## 14. Modelo de IA y versionado de contenido

### 14.1 Separación entre solicitud lógica y llamada real

`AIGeneration` representa “generar teoría para estos conceptos y esta versión”. `AIGenerationAttempt` representa cada llamada concreta a Gemini u otro proveedor. Esto permite reintentos, comparación de modelos y auditoría de costes sin confundirlos con versiones publicadas.

### 14.2 CanonicalContentKey

Incluye obligatoriamente tipo de contenido, target curricular versionado, locale, objetivo pedagógico, conceptos/versiones, dificultad, PromptTemplateVersion, esquema de salida y parámetros semánticamente relevantes. El identificador de request, fecha, reintento o correlation ID no participa porque produciría duplicados artificiales.

Dos solicitudes equivalentes encuentran primero un candidato aceptado persistido en PostgreSQL y no llaman al proveedor. Redis solo coordina el lock y puede cachear lectura; no es fuente de verdad.

### 14.3 Cadena de procedencia

La trazabilidad completa es:

AIGeneration → AIGenerationAttempt → AIGeneratedCandidate → AIValidationRun → HumanReview → ContentArtifactVersion → entidad tipada versionada → CurriculumPublication → Attempt.

Así se puede responder quién pidió el contenido, qué modelo y plantilla lo produjo, cuánto costó, qué respuesta originó la versión, qué validadores pasaron, quién aprobó, dónde se publicó y qué usuarios la vieron.

### 14.4 Regeneración y comparación

Regenerar crea otro attempt/candidato dentro de la solicitud lógica o una nueva solicitud si cambió la clave semántica. `GenerationComparison` conserva criterios: exactitud, cobertura, duplicidad, dificultad, seguridad, estilo, ejecución y coste. Aceptar un nuevo candidato no elimina el anterior ni cambia una publicación vigente; se crea ContentArtifactVersion y nueva publicación.

### 14.5 Validación

Los resultados se modelan por validadores versionados: schema, contract pedagógico, duplicidad, seguridad, exactitud, runner, cobertura y estilo. Un resultado tiene severidad Blocker/Error/Warning/Info. Los blockers impiden aprobación. Un override requiere rol, justificación y auditoría; las invariantes de seguridad y estructura no son anulables.

### 14.6 Retención y acceso

Prompts y respuestas crudas tienen clasificación restringida y retención específica. Los artefactos normalizados aceptados se conservan mientras exista contenido o historial. Coste y uso se mantienen agregados aunque se elimine payload crudo conforme a política. Secretos del proveedor nunca viven en estas entidades.

## 15. Estrategia general de versionado

### 15.1 Tipos de versión

- **Identidad estable:** Topic, Level, Sublevel, Concept, Lesson, Exercise, Quiz, PromptTemplate.
- **Versión de definición:** contenido o semántica de cada identidad.
- **Publicación:** manifest compatible de múltiples versiones.
- **Política:** algoritmo de dominio, repaso, XP, racha o agregación.
- **Esquema:** formato de AnswerPayload, eventos y artefactos.
- **Procedencia:** modelo, plantilla, validadores y revisión.

No se usa una única versión global para resolver todos los problemas.

### 15.2 Inmutabilidad y supersesión

Published, EvidenceEvent, AttemptSubmission, XpLedgerEntry y AuditLog son inmutables. Corregir significa crear sucesor, evento compensatorio o transición. `Superseded` evita nuevas asignaciones pero permite resolver historial. `Retired` retira del catálogo sin borrar dependencias.

### 15.3 Compatibilidad

Una publicación referencia versiones compatibles. Si cambia la definición de un Concept sin cambiar su significado esencial, mantiene Concept estable y crea ConceptVersion; si cambia el constructo medido, crea un Concept nuevo y relación `Replaces` administrativa o equivalencia explícita. La transferencia de dominio requiere política aprobada, nunca copia automática.

### 15.4 Concurrencia

Las raíces mutables usan control optimista mediante revisión/version de fila conceptual. Publicar, aceptar candidato, cerrar intento y activar política deben detectar modificaciones concurrentes. Locks Redis nunca sustituyen restricciones transaccionales PostgreSQL.

## 16. Modelo matemático persistible de dominio

Este documento no fija fórmulas numéricas definitivas —corresponde al ADR/PolicyVersion—, pero sí sus insumos y salidas obligatorias.

### 16.1 Insumos mínimos

Corrección, score, tipo, dificultad, pistas, ordinal, contexto, novedad, intervalo desde recuperación previa, error, rol conceptual, independencia y ConceptVersion.

### 16.2 Salidas mínimas

Probabilidad de dominio, confianza, estabilidad, dificultad individual, retención a fecha de cálculo, fecha siguiente, estado de presentación, contribución explicable y límites aplicados.

### 16.3 Evidencia diversa

Se conservan contadores o proyecciones por tipo de ejercicio, banda de dificultad, contexto y ayuda. Así se puede demostrar el contrato de “dominado”: 90+, confianza 0.75+, tres recuperaciones independientes, cobertura de dificultad y una evidencia sin pistas. Un único contador total sería insuficiente.

### 16.4 Agregación

Lesson/Sublevel/Level/Topic usan media armónica ponderada u otra política compatible versionada, cobertura, confianza y cap por prerrequisito crítico. Se persisten componentes del cálculo para explicabilidad. Los snapshots agregados son caché materializada; si divergen de estados conceptuales, se reconstruyen.

## 17. Modelo de repetición espaciada

### 17.1 Separación de responsabilidades

- Mastery estima estado de memoria.
- ReviewSchedule persiste cuándo y por qué revisar.
- ReviewPlan prioriza bajo capacidad diaria.
- ReviewSession congela la experiencia.
- Practice evalúa respuestas.

Review no altera scores directamente; consume estado y produce nuevos intentos/evidencia.

### 17.2 Estado suficiente

Por usuario-concepto se conserva dominio, confianza, estabilidad, dificultad, retención `asOf`, último éxito, último fallo, último repaso independiente, intervalo previo, intervalo recomendado, dueAt, número de lapsos, frecuencia, postponements, prioridad y versiones de algoritmo/política.

El historial de agenda permite analizar si el usuario repasó temprano, a tiempo o tarde, y medir calibración de olvido.

### 17.3 Priorización

El rank se deriva de vencimiento, retención bajo umbral, lapso, criticidad en knowledge graph, debilidad de prerrequisito, confianza, carga diaria y disponibilidad de ejercicios adecuados. No depende de XP ni racha.

### 17.4 Selección de ítems

El ReviewPlan no fija necesariamente el ejercicio hasta iniciar la sesión. Al inicio se elige una ExerciseVersion publicada que:

- cubra el concepto objetivo;
- no haya sido memorizada por exposición reciente;
- tenga dificultad cercana al estado individual;
- varíe tipo/contexto;
- respete prerrequisitos;
- sea compatible con cliente/runner;
- no exceda repeticiones de concepto por sesión.

La selección y su razón quedan congeladas en ReviewItem.

### 17.5 Posposición y zonas horarias

Posponer crea `ReviewDeferral`, conserva dueAt original en historial y aplica límites. Las fechas operativas son UTC; la presentación y carga diaria respetan TimeZoneId. Cambiar zona no reescribe el historial de estudio.

## 18. Modelo de estadísticas y dashboard

### 18.1 Patrón de lectura

Las pantallas no deben agregar millones de intentos en cada request. Se usa:

1. Eventos/fuentes normalizadas e inmutables.
2. Proyectores idempotentes mediante outbox.
3. Agregados diarios por usuario y alcances de alta demanda.
4. Snapshots actuales de dominio, debilidades y racha.
5. Reconciliación periódica contra fuente.

La consistencia del dashboard puede ser eventual por segundos/minutos; el resultado del ejercicio y dominio inmediato requieren consistencia más fuerte.

### 18.2 Métricas y fuentes

| Métrica | Fuente canónica | Proyección |
|---|---|---|
| Horas estudiadas | ActiveStudyInterval | UserDailyAggregate |
| Tiempo total | Intervalos diarios | Acumulado de usuario |
| Racha | QualifiedStudyDay + StreakPolicy | StreakState |
| XP | XpLedgerEntry | UserXpBalance/diario |
| Temas/subniveles activos | LearningSession/evidencia + publicación | UserScopeDailyAggregate |
| Dominio | UserConceptState | UserScopeMasterySnapshot |
| Aciertos/errores | EvaluationResult/EvidenceEvent | AccuracyAggregate separado |
| Tiempo promedio | Duraciones activas válidas | DurationDistribution con mediana/percentiles |
| Conceptos débiles | Mastery + lapsos + graph | WeakConceptProjection |
| Conceptos dominados | Mastery bajo política actual | StrongConceptProjection |
| Historial | Snapshots y diarios | Serie temporal paginada |

### 18.3 Estrategias contra consultas costosas

- Agregado diario como granularidad base; semanal/mensual se suma desde días.
- Snapshot por alcance solo para combinaciones consultadas, no producto cartesiano completo.
- Percentiles mediante estructura agregable o extensión aprobada; evitar ordenar todo el historial por request.
- Índices parciales para repasos vencidos, jobs pendientes y publicaciones activas.
- Particionar EvidenceEvent, ActivityEvent y AuditLog por tiempo solo al alcanzar umbrales medidos.
- Archivar payload pesado del runner/IA según retención manteniendo metadatos.
- Réplica de lectura para analítica cuando el NAS/infraestructura evolucione.

### 18.4 Reprocesamiento

Cada proyección guarda último evento/offset lógico y versión del proyector. Una reconstrucción crea nueva versión/sombra, valida conteos y cambia puntero activo atómicamente. No se borra la proyección vigente antes de comprobar la nueva.

## 19. Gamificación

### 19.1 XP

XP reconoce actividad pedagógica significativa, no tiempo pasivo. Toda concesión tiene evento fuente, policyVersion y deduplication key. Correcciones usan entrada compensatoria, nunca edición. Se limita repetición del mismo ejercicio y no se concede por abrir teoría.

### 19.2 Racha

`QualifiedStudyDay` se deriva de actividad mínima versionada, usando fecha local. `StreakState` es reconstruible. La tolerancia no es un objeto comprable y no existen “protectores” monetarios.

### 19.3 Logros

AchievementDefinition expresa un criterio pedagógico evaluable y versionado. La concesión referencia evidencia o agregado. Los logros no alteran dominio, agenda ni permisos.

## 20. Índices recomendados

Los índices siguientes son conceptuales. Su forma física debe confirmarse con consultas, cardinalidad, `EXPLAIN` y volumen real antes del schema final.

### 20.1 Identidad

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| User | correo normalizado único para cuentas no anonimizadas | Login y no duplicidad |
| Session | hash de token único; usuario + estado + expiración | Autenticación y revocación masiva |
| UserRole | usuario + rol + alcance activo único | Autorización |
| Tokens | hash único; expiración para limpieza | Validación de un solo uso |

### 20.2 Currículo y contenido

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| Topic | slug/ámbito único | Resolución pública |
| Versiones | identidad estable + versionNumber único | Historial y concurrencia |
| LevelVersion | TopicVersion + position único | Navegación ordenada |
| SublevelVersion | LevelVersion + position único | Navegación ordenada |
| LessonVersion | SublevelVersion + role; parcial para Primary publicada | Lección principal |
| SublevelConcept | SublevelVersion + ConceptVersion único; role | Cobertura |
| LessonConcept | LessonVersion + ConceptVersion único; ConceptVersion inverso | Render y diagnóstico |
| ConceptRelation | GraphPublication + source + type + target único | Integridad del grafo |
| ConceptRelation | target + type + graph | Prerrequisitos entrantes |
| Publication | Topic + locale con unicidad parcial current | Catálogo actual |
| Placement | SublevelVersion + position único; ExerciseVersion inverso | 30 ejercicios y auditoría |
| ExerciseConcept | ExerciseVersion + ConceptVersion único; ConceptVersion + role + difficulty | Selector |
| Fingerprint | algorithmVersion + digest; índice de similitud separado si se usa vector | Duplicidad |
| TestCase/Hint/Block | parentVersion + position único | Orden |

### 20.3 Práctica y dominio

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| LearningSession | usuario + estado + startedAt descendente | Reanudar/historial |
| ExerciseAttempt | usuario + ExerciseVersion + startedAt | Historial/familiaridad |
| AttemptSubmission | attempt + ordinal único; idempotency key única por usuario/alcance | Reintentos seguros |
| HintUsage | attempt + usedAt; hint inverso | Historial |
| EvidenceEvent | usuario + sequence único; sourceType/sourceId único | Replay e idempotencia |
| EvidenceConceptImpact | concept + event; event + concept único | Replay por concepto |
| UserConceptState | usuario + concept único | Lectura crítica |
| UserConceptState | usuario + status/retention/nextReview | Dashboard/selección |
| Transition | usuario + concept + occurredAt | Explicabilidad |
| ScopeSnapshot | usuario + scopeType + scopeId + asOf/version | Dashboard; polimorfismo controlado |
| UserExerciseState | usuario + exercise único | Evitar repetición |

### 20.4 Repaso

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| ReviewSchedule | usuario + concept único | Agenda efectiva |
| ReviewSchedule | usuario + dueAt + priority, parcial en pendientes | Cola diaria |
| ReviewPlan | usuario + status + calculatedAt | Plan actual |
| ReviewItem | session + position único; concept inverso | Ejecución/historial |
| LapseRecord | usuario + concept + occurredAt | Debilidades y calibración |

### 20.5 IA y operación

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| PromptTemplateVersion | template + version único; hash | Reproducibilidad |
| AIGeneration | canonicalContentKey + target/context con unicidad para accepted efectivo | Generar una vez |
| AIGeneration | status + createdAt | Cola administrativa |
| GenerationAttempt | generation + retryNumber único; provider/model + createdAt | Auditoría/coste |
| Candidate | generation + contentHash; status | Comparación/revisión |
| ValidationRun | candidate + validator + version + runNumber | Revalidación |
| OutboxEvent | status + availableAt + sequence | Worker |
| OutboxEvent | aggregateType + aggregateId + sequence único | Orden/idempotencia |
| JobRecord | type + idempotencyKey único; status + nextAttemptAt | Jobs |
| AuditLog | resourceType + resourceId + occurredAt; actor + occurredAt | Investigación |

### 20.6 Analítica y gamificación

| Entidad | Índice/clave recomendada | Consulta o invariante |
|---|---|---|
| ActivityEvent | usuario + occurredAt; tipo + fecha | Reconstrucción |
| ActiveStudyInterval | usuario + localDate + startedAt | Horas y solapamientos |
| UserDailyAggregate | usuario + localDate + policyVersion único | Dashboard por rango |
| ScopeDailyAggregate | usuario + scope + localDate único | Gráficas específicas |
| Weak/StrongProjection | usuario + rank/status | Tarjetas |
| XpLedgerEntry | usuario + occurredAt; source único por policy | Balance/dedupe |
| QualifiedStudyDay | usuario + localDate + policy único | Racha |
| UserAchievement | usuario + definitionVersion + awardKey único | No duplicidad |

### 20.7 Política de índices

- Todas las claves foráneas de alta cardinalidad deben evaluarse para índice.
- No indexar cada atributo “por si acaso”: penaliza escritura y almacenamiento del NAS.
- Índices compuestos siguen filtros de igualdad, rango y orden reales.
- JSON, texto completo o vectores requieren índices especializados solo con consultas definidas.
- Índices parciales son preferibles para estados activos minoritarios.
- La duplicación de índices equivalentes se audita periódicamente.

## 21. Consistencia, transacciones y concurrencia

### 21.1 Límites transaccionales

Transacciones fuertes obligatorias:

- cierre de intento + evaluación efectiva + EvidenceEvent + OutboxEvent;
- publicación + manifest + cambio de current;
- aceptación de candidato IA + vínculo de artefacto;
- concesión de XP + outbox cuando sea síncrona;
- revocación/rotación de sesión;
- activación de PolicyVersion.

No se realizan llamadas a Gemini, runner, notificaciones o cualquier red externa dentro de una transacción PostgreSQL.

### 21.2 Outbox e idempotencia

OutboxEvent se crea junto al hecho. Consumidores registran procesamiento por event ID/versión y son idempotentes. “Exactly once” no se promete a nivel distribuido; se consigue efecto único mediante deduplicación y transacciones locales.

### 21.3 Orden

Mastery necesita orden lógico por usuario/concepto. EvidenceEvent posee secuencia por usuario o mecanismo equivalente. Si llega un evento anterior al último aplicado, se bloquea aplicación incremental y se reconstruye el concepto desde un checkpoint seguro.

### 21.4 Borrado y referencias

No se usa cascade delete sobre contenido publicado, intentos, evidencia, ledger o auditoría. Los borrados de borradores no referenciados pueden ser físicos. La anonimización de User rompe identificadores personales pero preserva relaciones pedagógicas pseudónimas cuando la política lo permite.

## 22. Ciclos de vida principales

### 22.1 Currículo y contenido

Draft → InReview → Approved → Published → Superseded/Retired. Quarantined puede interrumpir el flujo por incidencia. Published no regresa a Draft; se crea versión nueva.

### 22.2 Generación IA

Requested → Running → CandidateProduced → Validating → AwaitingHumanReview → Accepted/Rejected/Failed. Un Accepted puede producir contenido draft; no equivale a Published.

### 22.3 Sesión e intento

LearningSession: Planned/Active/Paused → Completed/Abandoned/Expired. ExerciseAttempt: Open → Evaluated/Abandoned/Invalidated. Invalidated conserva historia y genera compensación si había evidencia.

### 22.4 Dominio y repaso

MasteryStatus es derivado: New → Developing → Competent → Mastered, con transiciones posteriores a AtRisk/ReviewRequired o recuperación. No es una máquina monotónica. ReviewSchedule: Scheduled → Due → Selected → Reviewed/Postponed/CancelledBySupersession.

### 22.5 Usuario

PendingVerification → Active → Suspended o DeletionRequested → Anonymized. La suspensión revoca sesiones pero no destruye evidencia. Reactivación y cancelación de borrado dependen de política y plazo.

## 23. Retención, particionado y archivado

### 23.1 Categorías

- Identidad y consentimiento: según vida de cuenta y obligaciones.
- Intentos/evidencia: larga duración para dominio e historial, con exportación y anonimización.
- Payload de código/output: retención menor configurable por privacidad/coste.
- Respuesta cruda de IA: restringida y con retención definida; artefacto aceptado persiste.
- Auditoría de seguridad: retención protegida por política.
- Proyecciones: reconstruibles y eliminables tras invalidación.

### 23.2 Particionado futuro

Candidatos: EvidenceEvent, ActivityEvent, AttemptSubmission, AuditLog, Outbox archivado y AI usage. El particionado por rango temporal se adopta solo cuando métricas de tamaño, vacuum, backup o latencia lo exijan. UserConceptState, ReviewSchedule y publicaciones activas permanecen sin particionar inicialmente por ser hot sets.

### 23.3 Archivado

Se puede mover payload pesado a almacenamiento de objetos compatible con el NAS, conservando en PostgreSQL hash, ubicación, cifrado, tamaño, media type y estado. Una referencia archivada nunca debe romper reproducibilidad ni auditoría autorizada.

## 24. Futuras extensiones

### 24.1 Nuevos lenguajes o materias

Topic/Concept no contienen supuestos de programación. Runtimes, sintaxis y evaluadores pertenecen a ExerciseTypeDefinition y configuración del runner. ConceptAlias/Equivalent permiten relaciones entre lenguajes sin fusionar dominio automáticamente.

### 24.2 Nuevos proveedores y modelos IA

Agregar AIProvider/AIModel y adaptador no cambia Content ni AIGeneration. La procedencia preserva proveedor/modelo. Una capacidad nueva se registra, evalúa con golden dataset y activa por Policy/FeatureFlag.

### 24.3 Videos

Se agregará un LessonBlock tipado y ContentAsset con transcripción, capítulos, subtítulos y accesibilidad. Ver video continúa siendo actividad, no dominio. Mini evaluaciones producen evidencia.

### 24.4 Laboratorios

`Lab` y `LabVersion` serán agregados de Content; `LabAttempt` en Practice; pasos y artefactos apuntan a conceptos. Usan Runner con ResourceLimits ampliados. No se embeben como Exercise gigante si requieren estado prolongado.

### 24.5 Proyectos

`Project`, `ProjectVersion`, milestones, rubric y `ProjectSubmission` modelan trabajo extenso. La evidencia se distribuye por criterios/conceptos y requiere revisión determinista o humana; una nota global no sustituye detalle conceptual.

### 24.6 Certificaciones

Fuera del alcance inicial. En el futuro: CertificationDefinition/Version, AssessmentForm, proctoring policy, CredentialAward y revocación. Se mantendrá separado de Achievement. Su incorporación requiere requisitos legales, identidad y seguridad adicionales.

### 24.7 Organizaciones SaaS

Fuera del alcance inicial. Si aparece multitenancy, se introducirá Organization, Membership y ownership explícito en contenido privado. No se agrega `tenantId` especulativo a todas las entidades hoy. La migración debe decidir qué datos son globales, organizacionales o personales y aplicar aislamiento probado.

### 24.8 Almacén analítico o base de grafos

Outbox/CDC permite proyectar a un sistema columnar cuando PostgreSQL operacional no sea suficiente. Una base de grafos solo se justifica con evidencia de consultas profundas/frecuentes que no cumplan SLO. Ninguna reemplaza la autoridad transaccional sin ADR.

## 25. Riesgos arquitectónicos

| Riesgo | Consecuencia | Mitigación del modelo |
|---|---|---|
| Confundir jerarquía con grafo | Duplicación y diagnóstico pobre | Estructuras separadas y asociaciones explícitas |
| Una tabla genérica de progreso | Invariantes débiles y semántica falsa | Concept state canónico + snapshots tipados |
| Explosión de snapshots por alcance | Almacenamiento y writes excesivos | Materializar solo consultas reales, reconstruir |
| Grafo cíclico o inconsistente | Rutas y diagnósticos inválidos | GraphPublication, validación de ciclos y criticidad |
| Modificar contenido publicado | Intentos irreproducibles | Identidad + versión + publication manifest |
| Duplicar llamadas de IA | Coste y contenido divergente | CanonicalContentKey en PostgreSQL + lock Redis |
| Guardar solo resultado final | Imposible explicar dominio | Submissions, hints, evaluations y evidence append-only |
| Dominio propagado por inferencia | Penalización injusta | Grafo genera hipótesis; solo evidencia cambia score |
| Agregados inconsistentes | Dashboard no confiable | Proyectores idempotentes, offsets y reconciliación |
| Particionado prematuro | Complejidad operativa NAS | Umbrales medidos antes de adoptar |
| JSON excesivo | Sin integridad ni índices claros | Entidades tipadas; JSON solo para payload extensible versionado |
| PII en código/prompts/logs | Riesgo de privacidad | Minimización, retención, acceso y sanitización |
| Políticas mutables | Resultados imposibles de reproducir | PolicyVersion inmutable y shadow mode |
| Borrado cascada | Pérdida de auditoría | Restricciones y anonimización coordinada |
| Índices excesivos | Penalización de escritura/storage | Diseño dirigido por consultas y auditoría |

## 26. Recomendaciones arquitectónicas

### 26.1 Adoptar manifest de publicación

`CurriculumPublication` debe ser el punto de consistencia que reúne currículo, grafo y contenido. Es superior a consultar “la última versión” de cada tabla porque evita mostrar una combinación nunca revisada.

### 26.2 Mantener concepto como unidad canónica

Aunque el producto muestre dominio por todos los niveles, solo Concept debe ser la fuente académica. Exercise aporta evidencia; Lesson/Sublevel/Level/Topic agregan. Esta distinción protege la filosofía de dominio real.

### 26.3 Persistir decisiones, no solo resultados

Guardar AlgorithmVersion, PolicyVersion, razón de repaso, pesos conceptuales y transiciones permite explicar el sistema. Sin ello, un porcentaje sería técnicamente irreproducible.

### 26.4 Empezar relacional

PostgreSQL es suficiente para el knowledge graph inicial y ofrece transacciones con el currículo. Añadir una base de grafos desde el comienzo sería una segunda fuente de consistencia sin evidencia de necesidad.

### 26.5 Separar respuesta cruda de artefacto aceptado

Una salida de Gemini no es contenido. Solo un candidato validado y revisado se convierte en ContentArtifactVersion, y solo una publicación lo hace visible. Esto reduce acoplamiento y riesgo pedagógico.

### 26.6 Definir ADR antes del schema físico

Antes de Prisma deben aprobarse al menos:

- estrategia exacta de identificadores públicos;
- fórmula y parámetros v1 de dominio/retención;
- semántica de Concept estable frente a ConceptVersion;
- payloads que usarán columnas tipadas frente a JSON versionado;
- mecanismo de cifrado/retención para soluciones, respuestas e IA cruda;
- estrategia de secuencia/replay de EvidenceEvent;
- límites iniciales de particionado y archivado;
- política de publicación y separación de funciones.

## 27. Criterios de aceptación del diseño físico futuro

El futuro schema Prisma será conforme solo si:

1. Preserva identidades estables y versiones inmutables.
2. Representa jerarquía editorial y knowledge graph sin confundirlos.
3. Garantiza publicación atómica y exactamente 30 ejercicios.
4. Permite reproducir cada intento contra ExerciseVersion exacta.
5. Conserva submissions, hints, evaluaciones, explicaciones vistas y duración.
6. EvidenceEvent, XP y auditoría son append-only e idempotentes.
7. UserConceptState contiene todo el vector exigido y versión algorítmica.
8. Los agregados de Topic/Level/Sublevel/Lesson son derivados y explicables.
9. El estado por Exercise se distingue de dominio conceptual.
10. Review conserva estado, historial, razón, intervalos y versiones.
11. Toda generación IA es persistente, comparable, auditable y deduplicable.
12. Las estadísticas se resuelven mediante proyecciones sin escanear todo el historial.
13. Las claves foráneas e invariantes críticas no dependen únicamente de disciplina de aplicación.
14. Las extensiones no exigen alterar hechos históricos.
15. No aparecen modelos de monedas, tiendas, rankings, loot boxes ni marketplace.

## 28. Matriz de decisiones pendientes legítimas

Estas decisiones no son omisiones; necesitan evidencia o ADR antes del diseño físico final:

| Decisión | Momento | Evidencia necesaria |
|---|---|---|
| UUID variante u otro ID no secuencial | Antes de Prisma | Soporte PostgreSQL/Prisma, orden de índices y exposición |
| Precisión numérica de probabilidades | Antes del schema | Fórmula v1 y tolerancia de reproducibilidad |
| Cifrado de respuestas/soluciones | Threat modeling | Sensibilidad, búsqueda y operación de claves |
| JSON tipado para payloads de ejercicio | Diseño de contratos | Tipos iniciales y frecuencia de consulta |
| Estrategia de embeddings | Piloto de deduplicación | Calidad, coste, privacidad y modelo |
| Particionado | Tras medición | Tamaño, tasa de escritura, vacuum y backups |
| Cierre transitivo del grafo | Tras pruebas de consulta | Profundidad y p95 observados |
| Retención exacta por categoría | Antes de producción | Política legal y de producto |
| Proyección síncrona de dominio | Fase de motor | Latencia, consistencia UX y throughput |

## 29. Glosario especializado

- **Aggregate Root:** entidad que protege invariantes y límite transaccional de un conjunto.
- **CanonicalContentKey:** identidad determinista de una solicitud semánticamente equivalente de contenido.
- **Concept estable:** identidad duradera del conocimiento, separada de su redacción/versionado.
- **Coverage:** proporción y diversidad de conceptos/evidencia representados en un agregado.
- **CurriculumPublication:** manifest inmutable de versiones compatibles visibles juntas.
- **EvidenceEvent:** hecho evaluable único que puede modificar dominio.
- **Familiaridad:** desempeño sobre un ejercicio/familia concreta; no equivale a transferencia conceptual.
- **GraphPublication:** versión coherente del knowledge graph.
- **Independent retrieval:** recuperación suficientemente separada o novedosa para aportar evidencia no redundante.
- **Projection:** estado derivado y optimizado que puede reconstruirse desde fuentes canónicas.
- **Scope mastery:** agregado derivado para Lesson, Sublevel, Level o Topic.
- **Superseded:** versión histórica válida que ya no recibe nuevas asignaciones.

---

**Mandato final:** el schema físico no debe diseñarse como una lista de tablas aisladas. Debe expresar estos límites de agregado, separar hechos de proyecciones, preservar versiones y convertir las invariantes pedagógicas en integridad verificable. Ningún porcentaje de progreso, optimización de consulta o comodidad de ORM puede sustituir la evidencia conceptual ni contradecir `MASTER_SPEC.md`.

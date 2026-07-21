# MASTER_SPEC — Plataforma de dominio del conocimiento impulsada por IA

| Campo | Valor |
|---|---|
| Estado | Especificación fundacional aprobable |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Propietario | Arquitectura de Software |
| Clasificación | Fuente única de verdad (Single Source of Truth) |
| Tecnologías obligatorias | Next.js, NestJS, TypeScript, PostgreSQL, Prisma, Redis, Gemini, Docker |

## 1. Autoridad, alcance y gobierno del documento

Este documento define el contrato funcional, pedagógico, arquitectónico y operativo del producto. Toda decisión de diseño, implementación, prueba, despliegue o evolución deberá ser compatible con esta especificación.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA**, **PUEDE** y **NO APLICA** expresan, respectivamente, obligación, prohibición, recomendación fuerte, opción controlada y exclusión explícita.

### 1.1 Regla de herencia entre fases

Cada fase futura DEBE comenzar leyendo, en este orden:

1. `MASTER_SPEC.md` completo.
2. Los prompts y artefactos contractuales de todas las fases anteriores, en orden cronológico.
3. El prompt de la fase actual.

Los artefactos anteriores son especificaciones obligatorias, no sugerencias. Un prompt posterior puede ampliar o precisar una decisión, pero no contradecirla silenciosamente. Ante una contradicción se debe detener el trabajo afectado, registrar el conflicto, proponer opciones y obtener una decisión explícita. La precedencia será: enmienda formal aprobada del `MASTER_SPEC` > `MASTER_SPEC` vigente > decisiones aprobadas de fases anteriores > prompt de la fase actual > supuestos de implementación.

Cada fase DEBE producir una matriz de trazabilidad que relacione requisitos con entregables y verificaciones. No se considerará cerrada si deja decisiones implícitas que comprometan una fase posterior.

### 1.2 Control de cambios

- Los cambios arquitectónicos significativos requieren un Architecture Decision Record (ADR).
- Los cambios al contrato pedagógico, fórmula de dominio, seguridad, privacidad o persistencia requieren revisión conjunta de producto y arquitectura.
- El versionado de este documento sigue SemVer: corrección editorial, versión patch; extensión compatible, minor; cambio incompatible, major.
- Los datos y contenidos almacenados deben indicar la versión de su esquema, política pedagógica y plantilla de generación.
- Ninguna implementación puede sustituir una regla explícita por una “mejora” no aprobada.

### 1.3 Alcance

Incluye la experiencia de aprendizaje individual, autoría asistida por IA, ejecución y evaluación de ejercicios, cálculo de dominio, repasos inteligentes, analítica personal, gamificación ligera, administración del catálogo y operación en un NAS.

Quedan fuera del primer alcance: marketplace, ranking social, monedas, tienda, loot boxes, clases en vivo, red social, certificados oficiales, pagos, organizaciones educativas, colaboración en tiempo real y aplicaciones móviles nativas. La arquitectura no debe impedir incorporarlos como módulos futuros, pero no anticipará complejidad sin demanda.

## 2. Visión y principios de producto

### 2.1 Visión

Construir un sistema de aprendizaje activo que transforme exposición en conocimiento recuperable y aplicable. El usuario no “termina” temas: acumula evidencia verificable de que puede recordar, explicar, detectar y aplicar cada concepto, y conserva ese dominio mediante repasos adaptativos.

**Promesa central:** “El usuario nunca termina un tema. El usuario domina un tema.”

### 2.2 Objetivos

- Medir dominio real a nivel de concepto, no consumo de contenido.
- Convertir la teoría en práctica deliberada lo antes posible.
- Adaptar la práctica con reglas deterministas, auditables y explicables.
- Dar retroalimentación inmediata sin convertir el error en una penalización.
- Reducir el olvido con repasos oportunos y específicos.
- Generar contenido escalable mediante IA bajo validación, versionado y persistencia.
- Ofrecer una interfaz sobria, rápida, accesible y centrada en una sola tarea.

### 2.3 No objetivos y métricas de protección

El producto no optimizará tiempo en pantalla, clics, rachas compulsivas ni volumen de contenido consumido. Las métricas de éxito no deben incentivar ejercicios de relleno ni repaso innecesario.

### 2.4 Indicadores de éxito

- Retención por concepto a 7, 30 y 90 días.
- Ganancia de dominio posterior a práctica y estabilidad tras repaso.
- Tasa de transferencia: resolución de ejercicios nuevos, no memorizados.
- Distribución de intentos y pistas antes de resolver.
- Precisión de la estimación: concordancia entre dominio previsto y evaluación posterior.
- Tiempo hasta dominio, tasa de abandono por subnivel y recuperación después de errores.
- Calidad de contenido: incidencias, duplicados, ambigüedades y revisiones humanas.

## 3. Modelo pedagógico

### 3.1 Principios obligatorios

#### Active Recall

El aprendizaje debe exigir recuperar conocimiento sin tener la respuesta visible. La teoría se segmentará y será seguida por mini revisiones, predicciones, explicaciones y escritura de código. Releer no genera evidencia de dominio. Ver teoría puede registrarse como actividad, pero nunca aumenta directamente el dominio.

#### Spaced Repetition

Cada concepto mantendrá un estado de retención individual. El sistema estimará el decaimiento desde la última evidencia válida y programará el siguiente repaso antes o después del umbral objetivo según estabilidad, dificultad, historial de errores y frecuencia. Los intervalos no serán globales ni fijos.

#### Deliberate Practice

Los ejercicios deben atacar una habilidad concreta, encontrarse cerca del límite actual del usuario, ofrecer retroalimentación específica y permitir nuevos intentos. El selector priorizará debilidades conceptuales y variará contexto y representación para evitar memorización superficial.

#### Learning by Doing

La práctica, especialmente escribir y ejecutar código, será el núcleo. La explicación introduce el modelo mental mínimo necesario; el usuario demuestra comprensión manipulando, prediciendo, corrigiendo o construyendo soluciones.

#### Mastery Learning

El avance de navegación puede ser flexible, pero el estado “dominado” exige evidencia suficiente, diversa y reciente. Un subnivel no se domina por completar 30 ejercicios ni por aprobar una sola prueba. Los prerrequisitos débiles generan recomendaciones y repasos puente.

### 3.2 Reglas pedagógicas invariables

- Cada ejercicio debe mapearse a un concepto principal y, opcionalmente, conceptos secundarios.
- La dificultad debe ser explícita y calibrable.
- La solución exacta no se mostrará durante intentos activos fallidos.
- Toda respuesta recibe explicación, incluso si es correcta.
- La retroalimentación distingue error conceptual, sintáctico, de atención y de estrategia.
- El contenido nuevo no debe depender de conocimiento no declarado como prerrequisito.
- Los ejemplos y ejercicios deben ser técnicamente correctos, ejecutables cuando aplique y libres de ambigüedad razonable.
- La accesibilidad y la claridad tienen prioridad sobre adornos o gamificación.

## 4. Taxonomía y estructura del aprendizaje

### 4.1 Jerarquía canónica

**Tema → Nivel → Subnivel → Lección → Teoría → Conceptos clave → Conexión previa → Mini revisión → 30 ejercicios → Explicación por ejercicio → Quiz final → Dominio → Repaso inteligente**

### 4.2 Definiciones

**Tema.** Área coherente de conocimiento, por ejemplo “Python”. Define resultados globales, audiencia, prerrequisitos, versión y mapa conceptual. Un tema puede evolucionar mediante versiones publicadas; una publicación ya usada no se muta destructivamente.

**Nivel.** Tramo de complejidad pedagógica —fundamentos, intermedio, avanzado u otro nombre de dominio— con resultados medibles y prerrequisitos. Ordena el recorrido, no representa dominio por sí mismo.

**Subnivel.** Unidad atómica de aprendizaje y dominio. Agrupa un objetivo, una lección, un conjunto acotado de conceptos, exactamente 30 ejercicios y un quiz final. Tiene una duración objetivo y un nivel de dificultad.

**Lección.** Experiencia editorial que reúne la teoría, ejemplos, resumen, conexión, mini revisión y acceso a práctica. En la versión inicial existe una lección principal por subnivel; el modelo permite futuras variantes sin cambiar la jerarquía.

**Teoría.** Explicación mínima suficiente para construir el modelo mental. No es un artículo genérico ni un volcado de documentación.

**Concepto clave.** Unidad medible de conocimiento. Posee identificador estable, definición, prerrequisitos, errores frecuentes, dificultad base y criterios de evidencia.

**Conexión con el subnivel anterior.** Recuperación breve que hace explícita la continuidad: qué conocimiento previo se reutiliza, qué cambia y por qué importa. En el primer subnivel se reemplaza por conexión con prerrequisitos de entrada.

**Mini revisión.** Entre 2 y 5 preguntas cortas de recuperación previa. Diagnostica preparación; no bloquea de forma punitiva y puede recomendar un repaso puente.

**30 ejercicios.** Secuencia obligatoria, única por versión del subnivel y progresiva. Completarla produce evidencia, pero no garantiza dominio.

**Explicación de cada ejercicio.** Describe el concepto, el razonamiento correcto, por qué funciona y, si aplica, por qué fallan alternativas comunes. Se revela tras respuesta correcta o cuando termina el flujo de intentos conforme a la política pedagógica; durante un fallo activo solo se muestran pistas.

**Quiz final.** Evaluación sumativa breve con elementos nuevos equivalentes, no copias de los ejercicios. Mide recuperación y transferencia sin pistas. Debe cubrir todos los conceptos principales.

**Dominio.** Estimación continua por concepto entre 0 y 100, acompañada de confianza, estabilidad y fecha de próxima revisión.

**Repaso inteligente.** Sesión corta compuesta dinámicamente por conceptos vencidos, débiles o en riesgo. Utiliza ejercicios nuevos o variantes validadas y no altera el catálogo publicado.

### 4.3 Contrato obligatorio de cada subnivel

En este orden:

1. Objetivo observable y medible.
2. Teoría clara, concreta, profesional, progresiva, sin relleno ni repetición.
3. Ejemplo básico que aísla el concepto.
4. Ejemplo intermedio que combina conceptos ya introducidos.
5. Ejemplo avanzado que demuestra aplicación o transferencia sin añadir prerrequisitos ocultos.
6. Resumen accionable.
7. Conceptos clave enlazados al mapa conceptual.
8. Conexión con el subnivel anterior.
9. Tiempo estimado separado en teoría, práctica y evaluación.
10. Botón “Comenzar ejercicios”, con alternativa accesible equivalente.

El tiempo estimado es orientativo, se calcula a partir de contenido y mediana observada, y nunca se usa para penalizar.

## 5. Diseño de ejercicios y evaluación

### 5.1 Composición de los 30 ejercicios

Cada subnivel publicado DEBE contener exactamente 30 ejercicios, con identificadores y huellas semánticas únicas. Distribución objetivo:

| Tipo | Cantidad objetivo | Rango permitido |
|---|---:|---:|
| Escribir código | 14 | 12–17 |
| Predecir salida | 7 | 5–8 |
| Detectar/corregir errores | 5 | 4–7 |
| Completar código | 3 | 2–5 |
| Opción múltiple | 1 | 0–2 |

La suma siempre debe ser 30 y la prioridad indicada se conserva. Una excepción de distribución requiere justificación editorial; jamás puede aumentar opción múltiple por facilidad de generación.

### 5.2 Progresión

- Ejercicios 1–5: aislamiento y comprensión básica.
- 6–12: aplicación directa con variaciones.
- 13–20: combinación de conceptos y errores frecuentes.
- 21–26: problemas menos guiados y transferencia cercana.
- 27–30: integración y transferencia, sin introducir materia nueva.

La dificultad no depende solo de la posición: se registra en una escala calibrada y se ajusta con datos agregados anonimizados. Dentro de cada bloque no puede existir una caída injustificada de complejidad.

### 5.3 Unicidad y calidad

No se consideran únicos dos ejercicios que solo cambian nombres, literales o el orden de opciones conservando la misma estructura mental. Se aplicarán controles de similitud estructural, semántica y de solución. Cada ejercicio tendrá objetivo, concepto principal, dificultad, enunciado, material inicial, evaluador, solución privada, casos de prueba, explicación, errores previstos, pistas progresivas y procedencia/versiones.

Antes de publicar, el contenido pasa por validación de esquema, análisis de duplicidad, validación técnica, ejecución aislada cuando corresponda, revisión de cobertura y control editorial. Contenido inválido queda en cuarentena y no llega al usuario.

### 5.4 Evaluación

- Los ejercicios deterministas se evalúan con reglas y pruebas del backend, no mediante juicio de Gemini.
- La escritura de código se evalúa por resultados observables, casos visibles y ocultos, restricciones y, solo si aporta valor pedagógico, análisis estructural.
- Las respuestas de texto libre que no admitan evaluación determinista usarán rúbricas versionadas. Si se incorpora evaluación probabilística futura, su resultado será recomendación y requerirá salvaguardas, nunca autoridad única.
- El tiempo aporta contexto estadístico, pero una respuesta lenta y correcta sigue siendo correcta.
- El quiz no permite pistas y utiliza un conjunto separado. Un fallo alimenta dominio y repaso, no borra aprendizaje previo.

### 5.5 Retroalimentación y pistas

Tras una respuesta correcta, se muestra inmediatamente una explicación concisa y la relación con el concepto. Tras una incorrecta:

1. Se clasifica el error sin revelar la respuesta.
2. Pista 1 orienta al concepto o regla relevante.
3. Pista 2 señala la parte del razonamiento o código que debe revisarse.
4. Pista 3 propone una pregunta guía, analogía o caso más simple.
5. Si persiste el fallo, se ofrece pausar, revisar microteoría y resolver un ejercicio remedial distinto.

Ninguna pista contiene la solución exacta, código directamente copiable que la resuelva ni descarte todas las alternativas hasta dejar una respuesta obvia. Usar pistas reduce el peso de la evidencia positiva de ese intento, nunca el XP ya ganado ni el acceso al aprendizaje.

## 6. Modelo de dominio y olvido

### 6.1 Estado por concepto y usuario

Cada relación usuario–concepto mantiene como mínimo:

- dominio estimado de 0 a 100;
- confianza de la estimación de 0 a 1;
- estabilidad de memoria en días;
- dificultad individual estimada;
- fecha de última evidencia y próxima revisión;
- exposiciones, intentos independientes, aciertos, errores y pistas;
- desempeño por tipo de ejercicio y dificultad;
- lapsos: fallos después de una evidencia previa de dominio;
- versión del algoritmo que produjo el estado.

La interfaz muestra el porcentaje de dominio, pero las decisiones utilizan el vector completo. Un 90% con baja confianza no equivale a 90% con evidencia diversa.

### 6.2 Evidencia

Una observación se pondera por corrección, independencia, dificultad, tipo de ejercicio, cantidad de pistas, número de intentos, novedad, recencia y contexto de quiz o repaso. Escribir código y transferir a un problema nuevo producen más evidencia que reconocer una opción. Repetir inmediatamente una respuesta produce evidencia marginal decreciente.

La teoría vista, el tiempo conectado, el scroll y el número de ejercicios abiertos no aumentan dominio.

### 6.3 Cálculo y umbrales

La primera versión utilizará un modelo determinista inspirado en trazado bayesiano del conocimiento para probabilidad de dominio, combinado con una curva de retención por concepto. Se elige frente a un promedio simple porque distingue evidencia, incertidumbre y olvido, y frente a un modelo ML opaco porque el sistema inicial necesita auditabilidad y pocos datos.

La retención esperada decae como función del tiempo transcurrido y la estabilidad individual; la estabilidad aumenta con recuperaciones exitosas espaciadas y disminuye con lapsos, alta dificultad y dependencia excesiva de pistas. Los coeficientes se configuran y versionan, no se dispersan en código.

Estados de presentación:

- **Nuevo:** evidencia insuficiente.
- **En desarrollo:** dominio menor de 70 o confianza insuficiente.
- **Competente:** dominio entre 70 y 89 con cobertura mínima.
- **Dominado:** dominio de 90 o más, confianza mínima de 0.75, evidencia reciente, al menos tres recuperaciones independientes, cobertura de dificultad y al menos una evidencia sin pistas.
- **En riesgo:** fue dominado, pero la retención prevista cae bajo 85.
- **Requiere repaso:** retención prevista bajo 75 o lapso reciente.

Los umbrales son parámetros pedagógicos versionados. El agregado de un subnivel es la media armónica ponderada de sus conceptos para impedir que fortalezas oculten una debilidad crítica. Un prerrequisito crítico por debajo del umbral limita el estado agregado aunque no bloquea la navegación.

### 6.4 Programación de repasos

Un planificador del backend recalcula vencimientos ante cada evidencia y mediante tareas programadas. Prioriza: conceptos vencidos, lapsos recientes, prerrequisitos débiles, conceptos próximos a caer, y después consolidación. La sesión mezcla recuperación, tipos de ejercicio y dificultad, limita repeticiones de un mismo concepto y respeta carga diaria configurable.

El usuario puede posponer, pero no marcar manualmente como dominado. Si no hay conexión, los eventos se registran localmente de forma limitada y se reconcilian; las evaluaciones que requieren ejecución segura permanecen en línea en la primera versión.

### 6.5 Explicabilidad y evolución

El sistema debe poder explicar “por qué aparece este repaso” y “qué evidencia cambió este dominio”. Toda actualización conserva evento origen y versión algorítmica. Futuras fórmulas se ejecutarán primero en modo sombra contra eventos históricos antes de migrar estados. Nunca se reescribe el historial de evidencia.

## 7. Experiencia de usuario

### 7.1 Principios visuales

La interfaz combina la precisión de Linear, la velocidad de Raycast, la calma editorial de Notion y la familiaridad técnica de VS Code, sin copiarlos. Será oscura por defecto, minimalista, profesional, con jerarquía tipográfica clara, amplio espacio, densidad controlada y un color de acento funcional.

No se usarán fondos recargados, animaciones ornamentales permanentes, ruido visual, múltiples llamadas primarias ni gamificación dominante. El contenido y el editor son protagonistas.

### 7.2 Arquitectura de información

Navegación principal:

- **Inicio:** siguiente mejor acción y panorama personal.
- **Aprender:** catálogo, ruta y mapa de tema.
- **Repasar:** cola inteligente y calendario de retención.
- **Progreso:** dominio, actividad y análisis de errores.
- **Perfil/Ajustes:** cuenta, preferencias, accesibilidad, privacidad y sesiones.

Administración se separa por rol y ruta; no invade la navegación del estudiante.

### 7.3 Pantallas obligatorias

**Landing pública.** Propuesta de valor, metodología, demostración breve, seguridad básica y acceso. Sin promesas falsas de resultados.

**Autenticación.** Registro, inicio, verificación, recuperación y restablecimiento de contraseña. Estados de error específicos y no reveladores.

**Onboarding.** Objetivo, experiencia previa, disponibilidad y diagnóstico opcional. El diagnóstico personaliza la recomendación, no bloquea contenido.

**Dashboard.** Muestra próxima acción, repasos vencidos, racha, XP, horas estudiadas, tiempo total, temas y subniveles activos, dominio global y por tema, aciertos, errores, tiempo promedio, conceptos débiles y dominados. Permite filtrar por periodo y distingue actividad de dominio.

**Catálogo/tema.** Describe resultados y prerrequisitos; presenta niveles, subniveles y mapa de dominio con estados accesibles por texto y color.

**Lección.** Renderiza el contrato completo del subnivel con tabla de contenidos discreta, ejemplos legibles y acción única para comenzar.

**Sesión de ejercicios.** Enunciado, contexto, progreso 1/30, Monaco Editor cuando corresponda, ejecutar/verificar, consola segura, pistas y explicación. Debe preservar borradores y admitir teclado.

**Quiz final.** Preparación, evaluación sin pistas, revisión por conceptos y resultado explicable.

**Repaso inteligente.** Motivo de selección, duración estimada, ejercicios y resumen del cambio de retención.

**Detalle de concepto.** Dominio, confianza en lenguaje comprensible, evidencia reciente, errores frecuentes, próxima revisión y acciones recomendadas.

**Progreso/analítica.** Tendencias de tiempo, precisión, dominio, lapsos y distribución; ninguna gráfica dependerá exclusivamente de color.

**Administración.** Estados de generación, validación, revisión, publicación, versiones, incidencias de contenido y auditoría.

**Estados transversales.** Carga con skeleton estable, vacío útil, error recuperable, sin conexión, mantenimiento, no autorizado y no encontrado.

### 7.4 Interacción, animación y navegación

- Navegación rápida con persistencia de contexto y rutas compartibles donde no expongan datos privados.
- Framer Motion solo para continuidad espacial, feedback y transiciones de estado; duración general de 120–240 ms.
- `prefers-reduced-motion` elimina movimiento no esencial.
- Ninguna animación bloquea entrada, evaluación o lectura.
- Cambios de ruta y guardado se anuncian de forma accesible.
- En móvil, el editor y las acciones se adaptan sin ocultar funciones esenciales; para programación extensa se recomienda escritorio sin prohibir móvil.
- Los borradores se guardan automáticamente y el usuario ve estado de sincronización.

### 7.5 Accesibilidad

Objetivo WCAG 2.2 AA: navegación completa por teclado, foco visible, estructura semántica, contraste, zoom al 200%, objetivos táctiles adecuados, mensajes asociados a campos, regiones vivas para resultados y alternativas a información visual. Monaco debe configurarse con soporte de lector de pantalla y accesos documentados. Se probará con herramientas automáticas y recorridos manuales.

### 7.6 Gamificación ligera

- **XP:** reconoce práctica significativa y consistencia; no sustituye dominio. Se limita el farming por repetición.
- **Racha:** cuenta días con una actividad mínima de aprendizaje o repaso; usa zona horaria del usuario, tolerancia explícita y no emplea mensajes de culpa.
- **Dominio:** indicador académico principal.
- **Logros:** hitos pedagógicos claros, como recuperar un concepto después de 30 días.

Se prohíben monedas, tienda, rankings, loot boxes y marketplace.

## 8. Arquitectura del sistema

### 8.1 Estilo arquitectónico

Se adoptará un **monolito modular** con frontend separado, trabajadores asíncronos y límites internos estrictos. Es superior a microservicios en la etapa inicial porque reduce coste operativo, transacciones distribuidas y complejidad de despliegue en NAS, mientras conserva módulos extraíbles mediante contratos y eventos.

Clean Architecture se aplica de manera pragmática dentro de cada módulo: dominio y casos de uso no dependen de frameworks; adaptadores encapsulan Prisma, Redis, Gemini, correo y ejecución de código. Feature First organiza el código. DDD se usa en dominios con lenguaje y reglas ricas —aprendizaje, dominio, contenido—, no en CRUD trivial.

### 8.2 Contextos funcionales

- **Identity & Access:** usuarios, credenciales, roles, sesiones y consentimiento.
- **Curriculum:** temas, niveles, subniveles, conceptos, prerrequisitos y versiones.
- **Content:** teoría, ejemplos, ejercicios, quizzes, plantillas, generación y publicación.
- **Practice:** sesiones, intentos, pistas, evaluación y explicaciones.
- **Mastery:** eventos de evidencia, estado por concepto, olvido y agregados.
- **Review:** planificación, cola, selección y resultados de repaso.
- **Analytics:** eventos, métricas derivadas y dashboard.
- **Gamification:** XP, rachas y logros bajo reglas aisladas.
- **Administration:** flujos editoriales, auditoría, operaciones e incidencias.
- **AI Gateway:** proveedores, prompts, cuotas, validación y observabilidad.
- **Notifications:** recordatorios opt-in y preferencias; inicialmente puede ser interno.

Cada contexto es dueño lógico de sus datos. El acceso cruzado se realiza por casos de uso públicos o eventos internos, no importando repositorios ajenos.

### 8.3 Componentes desplegables

- **Web:** Next.js App Router, renderizado servidor cuando mejora carga/SEO y componentes cliente solo para interacción.
- **API:** NestJS, API HTTP versionada y documentación OpenAPI.
- **Worker:** aplicación NestJS o proceso del mismo workspace para generación, validación, analítica y planificación asíncrona.
- **PostgreSQL:** fuente de verdad transaccional.
- **Redis:** caché efímera, rate limiting, locks distribuidos y colas; no es fuente de verdad.
- **Runner aislado:** componente dedicado para ejecutar código no confiable. Debe aislar procesos, red, CPU, memoria, tiempo y sistema de archivos. No compartirá privilegios con API ni base de datos.
- **Reverse proxy/TLS:** terminación HTTPS, encabezados y enrutamiento en el NAS.

### 8.4 Flujo principal

El frontend solicita una sesión; la API autentica, consulta catálogo publicado y estado de dominio; Practice selecciona el siguiente ejercicio mediante reglas; el evaluador determinista registra un intento; Mastery consume la evidencia dentro de una transacción o mediante outbox; Review recalcula vencimiento; Analytics proyecta métricas; la respuesta presenta feedback y explicación autorizada.

Las tareas pesadas se envían a una cola respaldada por Redis. Un patrón Transactional Outbox garantiza que un cambio persistido y su evento no se separen. Los consumidores son idempotentes.

### 8.5 Contrato API

- API REST bajo `/api/v1`; se elige por claridad, cacheabilidad, tooling y simplicidad operativa.
- Recursos y comandos de dominio explícitos; no se expone Prisma ni la estructura física.
- DTO de entrada y salida versionados y validados.
- Errores con código estable, mensaje seguro, detalles de campos y correlation ID.
- Paginación por cursor para secuencias grandes; offset solo en administración acotada.
- Idempotency keys para envíos de intentos, generación y comandos reintentables.
- OpenAPI es contrato generado y validado en CI.
- WebSocket o Server-Sent Events se incorporará únicamente para progreso de trabajos largos; no es requisito para ejercicios normales.

## 9. Datos y persistencia

### 9.1 PostgreSQL como fuente de verdad

Prisma administra acceso tipado y migraciones revisadas. Las migraciones son forward-only en entornos compartidos, con estrategia de expansión/migración/contracción para cambios incompatibles. Los datos pedagógicos publicados son versionados e inmutables; una corrección genera nueva revisión y conserva trazabilidad de intentos anteriores.

### 9.2 Modelo conceptual mínimo

**Identidad:** User, Credential, Session, Role, UserRole, Consent, UserPreference.

**Currículo:** Topic, TopicVersion, Level, Sublevel, Lesson, Concept, ConceptPrerequisite, SublevelConcept.

**Contenido:** TheoryBlock, Example, Exercise, ExerciseVersion, ExerciseConcept, Hint, Explanation, TestCase, Quiz, QuizItem, ContentGeneration, PromptTemplate, Publication.

**Aprendizaje:** LearningSession, ExerciseAttempt, AttemptAnswer, HintUsage, QuizAttempt, EvidenceEvent.

**Dominio:** UserConceptState, MasterySnapshot, ReviewSchedule, ReviewSession, ReviewItem.

**Métricas:** StudyActivity, DailyAggregate, AchievementDefinition, UserAchievement, XpLedger, StreakState.

**Operación:** OutboxEvent, AuditLog, ContentIncident, JobRecord, FeatureFlag.

Todos usan identificadores no secuenciales expuestos públicamente, marcas UTC, estado/versiones explícitas y borrado lógico solo cuando sea necesario. El XpLedger y EvidenceEvent son append-only. Los datos derivados pueden reconstruirse.

### 9.3 Integridad e índices

Restricciones de base de datos garantizan exactamente 30 posiciones únicas por publicación mediante validación transaccional de publicación, relaciones válidas, idempotencia de intentos y unicidad de versiones. Se indexarán claves foráneas, estados/fechas de cola, usuario-concepto, vencimientos de repaso y cursores. Los índices se justifican con consultas reales y se auditan con planes de ejecución.

### 9.4 Redis

Usos permitidos: caché de lecturas públicas/publicadas, sesiones si el modelo de autenticación lo requiere, rate limits, locks de generación, colas y resultados temporales. Toda entrada tiene TTL, namespace y versión. La invalidación ocurre por publicación/eventos. Un fallo de Redis puede degradar rendimiento o trabajos, pero no corromper dominio ni contenido.

Redis no satisface la regla de persistencia de contenido generado: todo contenido aceptado se almacena en PostgreSQL.

## 10. Integración con IA

### 10.1 Límites de autoridad

Gemini mediante Google AI Studio API solo puede proponer teoría, ejemplos, ejercicios, pistas, quizzes, resúmenes y explicaciones. No decide dominio, corrección final, secuencia pedagógica, permisos, XP, rachas, publicación, rate limits ni selección de repaso. Toda lógica de sistema pertenece al backend.

### 10.2 AI Gateway

El backend define una interfaz neutral de proveedor y un adaptador Gemini. El contrato incluye tipo de contenido, entrada normalizada, salida estructurada, modelo, parámetros, versión de plantilla, correlation ID, uso y estado. Esto permite agregar modelos sin alterar los casos de uso.

Los nombres de modelos no se codifican en dominio; se configuran por capacidad y entorno. Cambiar modelo requiere evaluación de calidad y coste.

### 10.3 Pipeline de generación

1. El administrador solicita contenido para una versión curricular.
2. El backend valida prerrequisitos y construye una entrada canónica.
3. Calcula una clave de contenido a partir de tipo, versión curricular, idioma, objetivo, conceptos, plantilla y configuración semánticamente relevante.
4. Consulta PostgreSQL. Si existe una generación aceptada, la devuelve y **no llama a Gemini**.
5. Usa lock Redis para evitar generación simultánea; vuelve a comprobar PostgreSQL después del lock.
6. Ejecuta el proveedor con timeout y reintentos limitados solo ante fallos transitorios.
7. Valida salida estructural, pedagógica, seguridad, duplicidad y consistencia técnica.
8. Ejecuta ejemplos/casos de código en runner aislado cuando aplique.
9. Persiste respuesta original restringida, contenido normalizado, metadatos, coste, hashes y resultados de validación.
10. Deja el contenido en borrador/revisión; publicación requiere reglas automáticas superadas y, en el alcance inicial, aprobación humana.

Una respuesta fallida no se presenta al estudiante. Los reintentos deliberados producen una nueva generación auditable, no sobrescriben la anterior.

### 10.4 Política de “generar una vez”

La identidad de contenido debe impedir llamadas duplicadas aun entre despliegues. Una lectura de contenido ya generado siempre proviene de PostgreSQL; Redis puede acelerar, nunca reemplazar. La regeneración solo se permite si cambia una entrada versionada relevante, existe una incidencia aprobada o un administrador inicia una nueva versión. Debe quedar motivo y actor.

### 10.5 Seguridad, privacidad y calidad de IA

- Nunca se envían secretos, credenciales, correo ni datos personales innecesarios al proveedor.
- Las entradas de usuario se delimitan y tratan como datos no confiables para reducir prompt injection.
- Las plantillas son versionadas, revisadas y no editables por estudiantes.
- Se aplican límites de cuota, coste, concurrencia y circuit breaker.
- Se registran latencia, errores, tokens/unidades y coste sin exponer razonamiento interno ni datos sensibles.
- El contenido pasa filtros de seguridad, sesgo, lenguaje, copyright razonable y exactitud técnica.
- Los prompts y respuestas crudas tienen acceso restringido y retención definida.

## 11. Frontend

### 11.1 Decisiones

Next.js con App Router y TypeScript estricto. Server Components serán el valor por defecto para datos y composición; Client Components se limitan a interactividad, Monaco, animaciones y estado local. Las mutaciones críticas consumen la API NestJS; no se duplican reglas de negocio en Server Actions.

TailwindCSS proporciona tokens y utilidades; shadcn/ui sirve como base accesible bajo propiedad del proyecto, no como catálogo visual sin criterio. Framer Motion centraliza presets. Monaco se carga de forma diferida solo donde se necesita.

### 11.2 Estado y datos

- El estado remoto se obtiene mediante una capa de cliente tipada generada o validada desde OpenAPI.
- El estado de URL representa filtros y navegación compartible.
- El estado local de componentes no se eleva innecesariamente.
- Un store global solo se admite para estado verdaderamente transversal y efímero.
- Formularios tienen validación cliente para UX y validación servidor como autoridad.
- No se almacenan tokens sensibles en `localStorage`.

### 11.3 Sistema de diseño

Tokens semánticos definen color, tipografía, espacio, radio, elevación, movimiento y capas. Componentes deben cubrir estados default, hover, focus, active, disabled, loading, error y success. El tema oscuro es inicial; la estructura admite tema claro futuro. Se documentará en un catálogo de componentes durante la fase de UI.

## 12. Backend

NestJS organiza módulos por capacidad, no por tipo técnico global. Controllers adaptan HTTP; application services orquestan casos de uso; dominio contiene políticas; repositories son puertos; Prisma y proveedores son adaptadores.

Las transacciones se definen en el límite del caso de uso. No se realizan llamadas de red dentro de transacciones de base de datos. Los comandos que cambian dominio validan autorización y precondiciones en servidor. Jobs poseen idempotencia, backoff con jitter, límite de intentos y dead-letter handling.

La configuración se valida al arrancar. Ningún módulo lee variables de entorno arbitrariamente: recibe configuración tipada. Fechas se almacenan en UTC y se presentan en zona del usuario.

## 13. Estructura del repositorio

Se recomienda monorepo por compartir tipos contractuales, configuración, componentes y disciplina de versiones sin publicar paquetes prematuramente:

- `apps/web`: Next.js.
- `apps/api`: API NestJS.
- `apps/worker`: procesos asíncronos NestJS.
- `apps/runner`: ejecución aislada con superficie mínima.
- `packages/ui`: sistema de diseño y componentes compartidos.
- `packages/contracts`: esquemas y tipos de API/eventos sin lógica de dominio.
- `packages/config`: configuraciones de lint, TypeScript y tooling.
- `packages/testing`: fixtures y utilidades no productivas.
- `infra`: Docker, Compose, proxy, observabilidad y scripts operativos.
- `docs`: ADR, diagramas, runbooks, modelo pedagógico y trazabilidad.

Dentro de cada aplicación, la estructura es feature-first: `feature/domain`, `feature/application`, `feature/infrastructure` y `feature/presentation` cuando la complejidad lo justifica. No se crearán capas vacías ni abstracciones de una sola implementación sin razón de prueba, sustitución o aislamiento.

## 14. Estándares de ingeniería

### 14.1 Principios

- **SOLID:** dependencias hacia abstracciones en límites relevantes; responsabilidades cohesionadas.
- **DRY:** evita duplicación de conocimiento, no fuerza reutilización accidental.
- **KISS:** prefiere la solución más simple que preserve contratos y evolución.
- **Composición:** componentes y políticas pequeñas combinables antes que herencia profunda.
- **Inmutabilidad:** preferida para value objects, eventos y contenido publicado.
- **Fail fast:** configuración y invariantes se validan cerca del origen.

### 14.2 TypeScript y nombres

TypeScript estricto; se prohíbe `any` no justificado, assertions inseguras y errores ignorados. Nombres en inglés para código y contratos; texto de producto localizado, inicialmente en español. Clases y tipos en PascalCase, funciones/variables en camelCase, constantes verdaderas en UPPER_SNAKE_CASE, archivos en kebab-case y tablas/campos según convención Prisma acordada. Booleanos comienzan con `is`, `has`, `can` o `should`; eventos usan pasado; comandos, imperativo.

No se emplean abreviaturas ambiguas, nombres genéricos como `utils` para lógica de dominio ni comentarios que repiten el código. Los comentarios explican intención, restricciones o trade-offs.

### 14.3 Calidad y revisión

- Formato y lint automáticos, imports ordenados y compilación estricta.
- Commits pequeños y coherentes; Conventional Commits es recomendado para automatización.
- Pull requests incluyen alcance, requisito trazado, riesgos, evidencia de pruebas, migraciones, seguridad y capturas en cambios visuales.
- Ningún merge con pruebas, análisis estático o migraciones fallidas.
- Dependencias se fijan mediante lockfile, se revisan y actualizan de forma controlada.
- La deuda técnica se registra con impacto y condición de resolución, no en comentarios vagos.

### 14.4 Pruebas

- Unitarias para políticas de dominio, dominio, selección y transformaciones.
- Integración para Prisma/PostgreSQL, Redis, colas, adaptadores y transacciones.
- Contract tests para API, eventos y AI Gateway.
- End-to-end para registro, lección, ejercicios, quiz, repaso y dashboard.
- Pruebas de propiedad para invariantes como límites de dominio y composición de 30 ejercicios.
- Accesibilidad automática y manual.
- Rendimiento para rutas críticas y colas.
- Seguridad: dependencias, secretos, SAST, imágenes y pruebas de autorización.
- Golden datasets para evaluar calidad de contenido y cambios de modelo/prompt.

Objetivo inicial: alta cobertura en dominio crítico, no un porcentaje global cosmético. Mastery, evaluación, autorización, idempotencia y publicación requieren cobertura exhaustiva de ramas e invariantes.

## 15. Seguridad y privacidad

### 15.1 Autenticación

Autenticación propia del backend mediante correo y contraseña, con contraseña hasheada usando Argon2id y parámetros versionados. Sesiones opacas en cookies `HttpOnly`, `Secure`, `SameSite` adecuadas, rotación tras autenticación y revocación servidor. Se prefiere frente a JWT de larga vida porque facilita revocación y reduce exposición en navegador. OAuth y passkeys son extensiones futuras mediante proveedores desacoplados.

Verificación de correo, recuperación con token de un solo uso, expiración corta, invalidación tras uso y respuesta que no permite enumerar cuentas. MFA es obligatorio para administradores cuando el producto salga de entorno privado y opcional para usuarios.

### 15.2 Autorización

RBAC inicial con roles Student, ContentEditor, Reviewer, Administrator y Operator, complementado con políticas por recurso/acción. Denegación por defecto. La interfaz nunca es la barrera de seguridad; cada caso de uso valida permiso y propiedad. Acciones administrativas sensibles generan auditoría inmutable.

### 15.3 Protección de API

- Validación y normalización de toda entrada; rechazo de campos desconocidos en comandos sensibles.
- Rate limiting por IP, identidad y acción, con políticas más fuertes en auth, Gemini y runner.
- Protección CSRF para autenticación por cookie, CORS con allowlist y encabezados de seguridad.
- Consultas parametrizadas mediante Prisma; escape contextual ante XSS y CSP estricta.
- Límites de tamaño, timeouts, cancelación, idempotencia y prevención de replay.
- Mensajes de error no filtran stack, SQL, rutas, secretos ni existencia de cuenta.
- El runner no tiene red por defecto, trabaja como usuario sin privilegios, con filesystem efímero y límites duros.

### 15.4 Secretos y entorno

Variables de entorno solo para configuración externa. Archivos reales no se versionan; se mantiene plantilla sin secretos. Secretos se suministran mediante mecanismo seguro del NAS/Docker, con permisos mínimos, rotación y separación por entorno. La aplicación valida presencia, formato e incompatibilidades al inicio y nunca registra valores sensibles.

Entornos mínimos: local, test, staging y production, con bases, claves, dominios y credenciales aislados. Datos de producción no se copian a desarrollo sin anonimización aprobada.

### 15.5 Privacidad y continuidad

Minimización de datos, consentimiento explícito para comunicaciones, exportación y eliminación conforme a política aplicable. Se define retención por categoría. Logs y analítica usan identificadores pseudónimos cuando sea posible.

Backups PostgreSQL cifrados, automáticos y probados mediante restauraciones. Objetivos iniciales: RPO 24 horas y RTO 4 horas para despliegue privado; antes de ofrecer SLA comercial deben revisarse. El NAS no es por sí solo alta disponibilidad: se requiere copia externa/off-site siguiendo 3-2-1.

## 16. Observabilidad y operación

- Logs JSON estructurados con correlation ID, actor pseudónimo, módulo, resultado y latencia.
- Métricas de solicitudes, errores, latencia, conexiones, cache hit, jobs, dead letters, generación IA, runner, coste y salud pedagógica.
- Trazas distribuidas mediante OpenTelemetry entre web/API/worker/runner donde aporte diagnóstico.
- Health checks separados de liveness y readiness; dependencias críticas reportadas sin secretos.
- Alertas accionables con runbook, severidad y propietario.
- Auditoría separada de logs operativos y con retención protegida.

Los objetivos iniciales para rutas interactivas, medidos en producción y excluyendo ejecución/generación asíncrona, serán p95 inferior a 500 ms para API y Core Web Vitals “good” en páginas principales bajo red representativa. Se fijarán SLO definitivos tras obtener línea base. Gemini nunca estará en el camino crítico del estudiante para contenido publicado.

## 17. Infraestructura y despliegue en NAS

Docker produce imágenes multi-stage, mínimas, no-root, con versiones fijadas y health checks. Docker Compose define web, API, worker, runner, PostgreSQL, Redis y reverse proxy; los perfiles separan herramientas operativas. Datos viven en volúmenes explícitos y respaldados, no dentro de contenedores.

El NAS debe soportar la arquitectura de CPU de las imágenes, memoria suficiente, almacenamiento confiable, TLS, DNS, firewall y actualizaciones. Solo reverse proxy expone puertos públicos; PostgreSQL, Redis y runner permanecen en red interna. La administración del NAS y la aplicación usa mínimo privilegio.

Despliegues:

1. CI construye, prueba, analiza y firma/identifica imágenes inmutables.
2. Staging ejecuta migraciones y smoke tests.
3. Producción realiza backup/verificación, migración compatible y actualización controlada.
4. Se verifica salud y flujos críticos.
5. Rollback usa imagen anterior; cambios de esquema deben ser compatibles. No se depende de “down migrations” destructivas.

Para cero o bajo downtime en un único NAS se empleará despliegue blue/green o reemplazo secuencial según recursos. Esta configuración no ofrece tolerancia ante pérdida física del NAS; para crecimiento comercial se migrarán servicios stateful a infraestructura redundante o gestionada.

## 18. Escalabilidad y extensibilidad

### 18.1 Más usuarios

Web, API y workers son stateless y escalables horizontalmente; sesiones, locks y colas se externalizan. PostgreSQL incorpora pool de conexiones, índices, réplicas de lectura para analítica y particionado de eventos cuando el volumen lo justifique. Métricas históricas se proyectan en agregados para no recalcular desde intentos en cada dashboard.

### 18.2 Más temas y contenido

La taxonomía y tipos son datos versionados, no condicionales codificados. El pipeline genera y valida por lotes, la publicación es independiente y el frontend renderiza bloques tipados. Catálogo, búsqueda y permisos no dependen de un tema específico.

### 18.3 Más modelos IA

AI Gateway selecciona proveedor por capacidad y política configurada. Adaptadores adicionales implementan el mismo contrato. Evaluaciones golden, feature flags, shadow traffic no sensible y registro de procedencia permiten comparar sin reescribir Content.

### 18.4 Más tipos de ejercicios

Un registro de tipos vincula renderer frontend, esquema de respuesta, evaluador backend, capacidades del runner y ponderación pedagógica. Agregar un tipo implica añadir un paquete vertical y versionar contratos, no modificar un switch central disperso. Tipos desconocidos fallan de forma segura.

### 18.5 Más estadísticas

EvidenceEvent y eventos de actividad son hechos inmutables. Proyecciones asíncronas crean nuevas métricas sin alterar la captura. A gran escala, Analytics puede extraerse a un almacén columnar mediante outbox/CDC, manteniendo PostgreSQL operacional como autoridad.

### 18.6 Ruta de extracción a servicios

Solo se extraerá un módulo si existen límites de escalado, disponibilidad, equipo o seguridad demostrables. Candidatos naturales: runner, generación IA, analítica y notificaciones. Los contratos y eventos actuales preparan esa separación. No se distribuirá Curriculum/Mastery prematuramente porque requieren coherencia transaccional fuerte.

## 19. Rendimiento y presupuestos

- El dashboard usa agregados y evita consultas N+1.
- Catálogo y contenido publicado admiten caché con invalidación por versión.
- Monaco, gráficas y Framer Motion se cargan por demanda; se controlan presupuestos de JavaScript.
- Las imágenes y fuentes se optimizan y sirven localmente/CDN según despliegue.
- La evaluación rápida responde sin esperar analítica, logros ni recalcular agregados no críticos.
- Gemini y validación intensiva siempre se ejecutan fuera del request interactivo.
- Se establecen límites de concurrencia para proteger PostgreSQL, Redis, runner y API externa.

Los presupuestos numéricos finales de bundle, concurrencia y capacidad se fijarán con prototipo medido y perfil del NAS; inventar cifras antes de conocer hardware sería una falsa garantía.

## 20. Analítica del dashboard

Definiciones canónicas:

- **Horas estudiadas:** suma de actividad activa validada en el periodo, con corte por inactividad; no tiempo de pestaña abierta.
- **Tiempo total:** acumulado histórico de actividad activa.
- **Racha:** días consecutivos según zona horaria y regla mínima versionada.
- **XP:** suma del ledger, separada por fuente.
- **Temas/Subniveles:** activos, con evidencia, competentes y dominados; “vistos” se presenta aparte.
- **Dominio:** agregado ponderado acompañado de cobertura y confianza.
- **Errores/Aciertos:** primeros intentos y todos los intentos se ofrecen como métricas distintas.
- **Tiempo promedio:** mediana y percentiles son preferibles a media cuando existen valores extremos.
- **Conceptos débiles:** baja retención prevista, lapsos o errores recurrentes con evidencia suficiente.
- **Conceptos dominados:** cumplen el contrato de dominio actual, no una versión histórica sin recalcular.

Cada tarjeta informa periodo, definición accesible y estado sin datos. La analítica educativa evita comparaciones sociales y no infiere capacidad personal a partir de velocidad.

## 21. Localización, tiempo y compatibilidad

La primera interfaz será español, con toda cadena externalizada para i18n. El contenido declara idioma y locale; las claves de caché los incluyen. Fechas persisten en UTC y la racha usa zona IANA del usuario. Números, fechas y duración se localizan.

Se soportarán las dos últimas versiones estables de navegadores evergreen. La experiencia base debe funcionar sin animaciones; JavaScript es necesario para el editor y evaluación interactiva. Se definirá política de degradación ante navegador incompatible.

## 22. Roadmap técnico por fases

Cada fase hereda obligatoriamente este documento y todos los artefactos previos, produce trazabilidad y tiene criterios de salida.

### Fase 0 — Fundación y decisiones verificables

**Objetivo:** convertir esta especificación en backlog y contratos ejecutables.

Entregables: ADR iniciales, mapa de contextos, modelo de amenazas, modelo de datos lógico, contrato OpenAPI preliminar, tokens de diseño, definición matemática versionada de dominio, inventario del hardware NAS, SLO preliminares y estrategia de pruebas.

**Justificación:** las reglas pedagógicas, seguridad y capacidad física condicionan todo lo posterior.

### Fase 1 — Plataforma base e identidad

Monorepo, calidad automatizada, contenedores, configuración, PostgreSQL/Prisma, Redis, observabilidad base, CI, autenticación, sesiones, autorización y esqueleto accesible de navegación.

**Salida:** un usuario puede registrarse, autenticarse, cerrar/revocar sesiones y acceder según rol; despliegue reproducible en entorno no productivo.

### Fase 2 — Currículo y autoría sin IA

Taxonomía versionada, conceptos/prerrequisitos, flujo draft-review-publish, administración mínima y renderizado de lección con contenido fixture revisado.

**Justificación:** valida el modelo editorial antes de introducir variabilidad de IA.

### Fase 3 — Motor de práctica determinista

Tipos prioritarios de ejercicios, Monaco, runner aislado, sesiones, intentos idempotentes, casos de prueba, pistas y explicaciones. Se construye un subnivel canónico de exactamente 30 ejercicios.

**Salida:** recorrido completo y seguro de práctica con retroalimentación conforme a contrato.

### Fase 4 — Dominio, quiz y repetición espaciada

EvidenceEvent, algoritmo versionado, estados por concepto, quiz sin pistas, scheduler, sesiones de repaso, explicabilidad y pruebas de simulación temporal.

**Justificación:** necesita evidencia confiable producida por Practice.

### Fase 5 — Generación IA controlada

AI Gateway, adaptador Gemini, plantillas, deduplicación persistente, locks, validadores, golden dataset, cuotas, coste, revisión y publicación.

**Salida:** generar una vez, validar, aprobar, persistir y reutilizar sin llamadas duplicadas.

### Fase 6 — Dashboard, gamificación y UX completa

Proyecciones analíticas, todas las métricas definidas, XP ledger, racha, logros, progreso detallado, onboarding, estados vacíos/error y refinamiento responsive/motion/accesibilidad.

**Justificación:** las visualizaciones se construyen sobre eventos reales, evitando métricas ficticias.

### Fase 7 — Hardening y operación NAS

Pruebas E2E, carga, seguridad, accesibilidad manual, backups/restauración, migraciones, blue/green según capacidad, alertas, runbooks, privacidad y recuperación ante desastre.

**Salida:** checklist de producción aprobado, restauración ensayada y riesgos residuales aceptados explícitamente.

### Fase 8 — Piloto y calibración

Piloto limitado, análisis de errores de contenido, calibración de dificultad/dominio, validación de retención, optimización de consultas y revisión de SLO. Los cambios algorítmicos corren en sombra antes de activarse.

**Salida:** evidencia de que la estimación de dominio predice desempeño y que el sistema es operable.

### Fase 9 — Escala controlada

Más temas, proveedores IA opcionales, nuevos tipos de ejercicio, réplicas/proyecciones analíticas y extracción de servicios solo según métricas. Cada extensión conserva compatibilidad o sigue migración versionada.

## 23. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación obligatoria |
|---|---|---|
| Contenido IA incorrecto | Enseñanza errónea | Validación estructural/técnica, runner, revisión, versionado e incidencias |
| Ejercicios duplicados | Memorización y falsa evidencia | Huella semántica/estructural, revisión y métricas de similitud |
| Dominio mal calibrado | Recomendaciones falsas | Modelo explicable, confianza, simulación, shadow mode y calibración con datos |
| Runner comprometido | Acceso a infraestructura | Aislamiento estricto, sin red, límites, usuario no-root y auditorías |
| Caída o cuota de Gemini | Autoría detenida | Contenido persistido, cola, circuit breaker; aprendizaje no depende del proveedor |
| NAS como punto único | Indisponibilidad/pérdida | Backups 3-2-1, restauración probada y futura redundancia |
| Gamificación desplaza aprendizaje | Conducta superficial | XP limitado, dominio principal, sin economía ni ranking |
| Analítica costosa | Degradación de API | Eventos append-only, proyecciones y agregados |
| Crecimiento prematuro a microservicios | Complejidad operativa | Monolito modular y extracción basada en evidencia |
| Prompt injection/datos sensibles | Fuga o contenido malicioso | Delimitación, minimización, validación y sin autoridad de sistema |

## 24. Decisiones alternativas y justificación

### Monolito modular frente a microservicios

Se adopta monolito modular. Microservicios aportarían escalado independiente, pero en un NAS y equipo inicial multiplican despliegues, observabilidad y fallos distribuidos. Los límites y eventos preservan una ruta posterior sin pagar hoy ese coste.

### REST frente a GraphQL

REST versionado es preferible por flujos claros, OpenAPI, cacheabilidad y menor superficie de autorización/operación. GraphQL se reconsiderará si clientes diversos requieren composición dinámica demostrable; no por moda.

### Sesiones opacas frente a JWT persistente

Las sesiones opacas facilitan revocación, rotación y respuesta ante robo. JWT de corta vida puede usarse entre servicios futuros, no como credencial duradera en navegador.

### Modelo explicable frente a ML desde el inicio

El modelo bayesiano/retención parametrizado es auditable y funciona con pocos datos. Un modelo ML futuro solo será superior si demuestra mejor calibración en datos reales, mantiene explicabilidad operativa y supera evaluación en sombra.

### Revisión humana frente a publicación automática de IA

La revisión humana inicial es obligatoria porque la exactitud pedagógica prima sobre velocidad. La auto-publicación podrá habilitarse por categoría solo tras métricas de calidad, validadores maduros y límite de riesgo aprobado.

### NAS frente a servicios gestionados

El NAS satisface control y coste inicial, pero no ofrece alta disponibilidad inherente. Es válido para MVP/piloto. Para SLA comercial, bases y colas gestionadas o un clúster redundante serán técnicamente superiores por backups, failover y operación.

## 25. Criterios globales de aceptación

El producto cumple esta especificación cuando:

1. Ninguna pantalla confunde finalización con dominio.
2. Cada subnivel publicado contiene todos los bloques teóricos requeridos y exactamente 30 ejercicios únicos y progresivos.
3. Cada respuesta correcta muestra explicación y cada fallo ofrece pistas sin revelar solución durante intentos activos.
4. El dominio existe por concepto, es explicable, versionado y decae individualmente.
5. Los repasos aparecen automáticamente por retención y evidencia.
6. Gemini solo genera contenido, nunca gobierna lógica ni evaluación determinista.
7. Contenido aceptado se persiste y no provoca una nueva llamada equivalente.
8. Autorización, runner y administración resisten los escenarios definidos en el modelo de amenazas.
9. Dashboard distingue actividad, precisión, dominio y confianza con definiciones reales.
10. La interfaz cumple el recorrido esencial con teclado, lector de pantalla y movimiento reducido.
11. El despliegue en NAS es reproducible, observable, respaldado y restaurable.
12. La arquitectura admite nuevos temas, modelos, ejercicios y métricas mediante extensiones delimitadas.
13. Toda fase demuestra trazabilidad con este documento y decisiones anteriores.

## 26. Definition of Done transversal

Una capacidad no está terminada solo porque funciona localmente. Debe incluir requisito trazado, diseño aprobado, implementación tipada, validación y autorización servidor, pruebas proporcionales al riesgo, accesibilidad, estados de error/carga/vacío, observabilidad, documentación contractual, migración segura, revisión de privacidad/seguridad, rendimiento medido y plan de rollback. Si una dimensión no aplica, se registra explícitamente el motivo.

## 27. Glosario

- **Dominio:** probabilidad estimada y respaldada por evidencia de recordar y aplicar un concepto.
- **Retención:** probabilidad prevista de recuperación correcta en un momento determinado.
- **Estabilidad:** resistencia estimada de un recuerdo al paso del tiempo.
- **Evidencia:** resultado observable de una actividad evaluable que puede modificar dominio.
- **Lapso:** fallo de recuperación tras evidencia previa suficiente.
- **Contenido publicado:** versión inmutable aprobada y visible a estudiantes.
- **Generación equivalente:** solicitud con la misma identidad canónica y versiones relevantes.
- **Repaso puente:** práctica breve de prerrequisitos antes de continuar.
- **Runner:** entorno aislado para ejecutar código no confiable.
- **ADR:** registro de una decisión arquitectónica, contexto, alternativas y consecuencias.

---

**Mandato final:** cualquier fase, persona o agente que trabaje en el proyecto debe leer este documento completo antes de actuar, declarar las secciones que implementa, preservar las invariantes y detenerse ante contradicciones no resueltas. La velocidad de entrega nunca justifica fabricar progreso, delegar decisiones de sistema a la IA ni comprometer seguridad, trazabilidad o calidad pedagógica.

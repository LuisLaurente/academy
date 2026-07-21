# LEARNING_ENGINE_SPEC — Especificación del motor pedagógico adaptativo

| Campo | Valor |
|---|---|
| Estado | Especificación pedagógica obligatoria |
| Versión | 1.0.0 |
| Fecha | 2026-07-21 |
| Documentos rectores | `MASTER_SPEC.md` 1.0.0 y `DATABASE_DESIGN.md` 1.0.0 |
| Alcance | Comportamiento del motor de aprendizaje |
| Exclusiones | Código, pseudocódigo, SQL, APIs y diseño físico de persistencia |

## 1. Autoridad, alcance y lenguaje normativo

Este documento define cómo debe comportarse el motor pedagógico del Learning Operating System. Desarrolla y hace operativas las reglas de `MASTER_SPEC.md` y usa el modelo conceptual de `DATABASE_DESIGN.md` sin reemplazarlos. La precedencia contractual continúa siendo: enmienda aprobada de `MASTER_SPEC.md` > `MASTER_SPEC.md` > `DATABASE_DESIGN.md` > este documento.

Las palabras **DEBE**, **NO DEBE**, **DEBERÍA** y **PUEDE** expresan obligación, prohibición, recomendación fuerte y opción controlada. Toda fórmula, umbral y ponderación aquí definida DEBE quedar identificada mediante `AlgorithmVersion` o `PolicyVersion`, ejecutarse inicialmente en modo sombra y calibrarse antes de afectar a usuarios reales.

Este documento no prescribe clases, servicios, tablas, endpoints ni secuencias técnicas. Describe decisiones pedagógicas observables, insumos, resultados, invariantes y criterios de calidad.

### 1.1 Matriz de trazabilidad

| Requisito | Decisión vinculante | Secciones |
|---|---|---|
| Medir conocimiento, no progreso | Separación entre actividad, evidencia, dominio y retención | 3, 12 |
| Principios científicos | Trece principios con conducta concreta | 4 |
| Flujo completo | Ciclo desde tema hasta desbloqueo y repaso | 5 |
| Teoría sin relleno | Contrato editorial y prueba de necesidad | 6 |
| Exactamente 30 ejercicios | Distribución, dificultad, progresión y unicidad | 7–8 |
| Dominio multidimensional | Vector de dominio y criterios de interacción | 12–14 |
| Confianza inferida | Confianza del estimador, certeza de respuesta y calibración separadas | 15 |
| Olvido individual | Curva de retención y estabilidad adaptativa | 16 |
| Transferencia | Evidencia embebida, niveles y límites contra propagación falsa | 17 |
| Detección de memorización | Señales múltiples y pruebas de novedad | 18 |
| Taxonomía de errores | Clasificación, evidencia y respuesta pedagógica | 19 |
| Pistas progresivas | Tres niveles más remediación, sin solución | 20 |
| Quizzes | Cinco modalidades y condiciones de aparición | 21 |
| Desbloqueo por dominio | Puerta pedagógica multidimensional y acceso flexible | 22 |
| Repaso inteligente | Elegibilidad, prioridad, mezcla, recuperación y cierre | 23 |
| Knowledge Graph | Diagnóstico por hipótesis verificadas | 24 |
| IA sin autoridad | Generación solamente; decisión determinista del motor | 27 |
| Multidisciplina | Taxonomía cognitiva neutral con perfiles disciplinares | 29 |
| Mejoras/contradicciones | Tres ADR propuestos | 2 |

## 2. ADR pedagógicos propuestos

Estos ADR no modifican silenciosamente los documentos rectores. Formalizan precisiones necesarias que deberán aprobarse antes de implementar la política v1.

### ADR-LE-001 — El estado “Dominado” requiere una puerta multidimensional

**Estado:** propuesto.

**Contexto.** `MASTER_SPEC.md` exige dominio de 90 o más, confianza mínima de 0.75, evidencia reciente, tres recuperaciones independientes, cobertura de dificultad y al menos una evidencia sin pistas. El nuevo requisito exige además medir retención, transferencia, consistencia y calidad.

**Decisión propuesta.** Mantener esos requisitos como mínimos obligatorios y añadir umbrales explícitos de retención, transferencia, consistencia, independencia y cobertura. El porcentaje visible seguirá existiendo, pero no podrá por sí solo conceder “Dominado”.

**Justificación.** Una media alta puede ocultar memorización, dependencia de ayuda o incapacidad para transferir. Una puerta vectorial es más fiel a la promesa de conocimiento duradero.

**Consecuencias.** El estado será más exigente y explicable. Algunos usuarios tardarán más en obtenerlo, por lo que la experiencia debe mostrar qué dimensión falta y ofrecer práctica concreta, nunca un mensaje opaco.

### ADR-LE-002 — Desbloqueo pedagógico no equivale a restricción absoluta de acceso

**Estado:** propuesto.

**Contexto.** Esta fase exige desbloquear por dominio. `MASTER_SPEC.md` indica que la navegación puede ser flexible y que un prerrequisito débil recomienda repaso sin bloquear de forma punitiva.

**Decisión propuesta.** Distinguir tres estados: Visible, Recomendado y Dominio validado. El motor solo marca el siguiente contenido como Recomendado cuando cumple la puerta pedagógica. El usuario puede explorar contenido Visible con una advertencia de brechas y un repaso puente; no puede otorgarse a sí mismo dominio ni saltarse evaluaciones de evidencia.

**Justificación.** Preserva autonomía, evita bloqueos frustrantes y mantiene la integridad académica de la recomendación.

**Consecuencias.** La interfaz debe distinguir “puedes explorar” de “estás preparado”. Las analíticas separarán acceso, finalización y dominio.

### ADR-LE-003 — Taxonomía cognitiva neutral para disciplinas no programáticas

**Estado:** propuesto.

**Contexto.** `MASTER_SPEC.md` prioriza escribir código, pero la plataforma debe escalar a matemáticas, idiomas, física, química e historia.

**Decisión propuesta.** Tratar “Escribir código” como especialización de una categoría universal llamada **Producción constructiva**. Para programación se conserva exactamente la prioridad y distribución definida; en otras disciplinas el equivalente será resolver, demostrar, redactar, traducir, construir un modelo o producir una explicación verificable.

**Justificación.** La acción cognitiva relevante es generar una respuesta sin reconocimiento pasivo. El nombre específico no debe acoplar el motor a una materia.

**Consecuencias.** Cada disciplina tendrá un perfil validado de tipos, sin alterar evidencia, dominio, repaso ni knowledge graph.

## 3. Tesis del motor

### 3.1 Lo que el sistema afirma saber

El sistema nunca afirma “el usuario sabe” por una sola respuesta. Afirma que, dadas evidencias diversas y recientes, existe una probabilidad estimada de que pueda recuperar y aplicar un concepto bajo determinadas condiciones.

El conocimiento se modela como un estado latente. Las respuestas son observaciones imperfectas: un acierto puede ser adivinanza o memoria del ejercicio; un error puede ser distracción, sintaxis o un prerrequisito débil. Por ello el motor separa:

- conocimiento conceptual;
- retención a través del tiempo;
- capacidad de transferencia;
- confianza del estimador;
- consistencia entre ocasiones;
- independencia de pistas;
- calidad de la resolución;
- cobertura y diversidad de evidencia;
- fluidez contextual;
- calibración metacognitiva.

### 3.2 Lo que nunca cuenta como conocimiento

No aumenta dominio por sí mismo:

- abrir o terminar una lección;
- leer, hacer scroll o ver un video;
- permanecer conectado;
- completar el ejercicio 30;
- obtener XP o mantener una racha;
- repetir inmediatamente una respuesta ya conocida;
- declarar subjetivamente “ya lo entendí”.

Estas acciones pueden generar actividad, habilitar experiencia o informar metacognición, pero solo una respuesta evaluable crea `EvidenceEvent`.

### 3.3 Diagrama conceptual del ciclo

> Contenido mínimo → recuperación activa → respuesta observable → clasificación del error → retroalimentación/pista → nueva recuperación → evidencia versionada → actualización del vector de dominio → predicción de retención → repaso/desbloqueo → transferencia en contexto nuevo

El ciclo no termina en “completado”. Continúa mientras el conocimiento pueda decaer, fortalecerse o transferirse.

## 4. Fundamentos científicos y su implementación

### 4.1 Active Recall

**Principio.** Recuperar sin tener la respuesta visible requiere reconstruir conocimiento.

**Implementación.** Cada segmento teórico desemboca rápidamente en una pregunta, predicción, explicación, construcción o corrección. Las claves no aparecen en la misma vista cuando se solicita recuperación. Releer no incrementa dominio. La teoría se ofrece nuevamente después de un fallo persistente como microintervención, seguida de otro ejercicio, nunca como sustituto de la recuperación.

### 4.2 Retrieval Practice

**Principio.** Recuperar es también una actividad de aprendizaje, no solo medición. La investigación clásica muestra ventajas de pruebas de recuperación para retención a largo plazo frente a estudio repetido ([Roediger y Karpicke, 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)).

**Implementación.** Mini revisiones, ejercicios, quizzes y repasos usan ítems de recuperación. El motor distingue recuperaciones independientes de repeticiones inmediatas. Una recuperación correcta después de un intervalo aporta más estabilidad que una repetición masiva.

### 4.3 Spaced Repetition

**Principio.** Distribuir práctica en el tiempo suele superar la práctica concentrada; evidencia aplicada reciente encuentra un efecto favorable moderado para práctica distribuida ([Mawson y Kang, 2025](https://pubmed.ncbi.nlm.nih.gov/40564553/)).

**Implementación.** Cada concepto tiene estabilidad y retención individual. La siguiente revisión se fija cuando la retención prevista se acerca al umbral objetivo, no mediante intervalos iguales para todos. Éxito, lapso, dificultad, ayuda, transferencia y retraso real alteran la estabilidad.

### 4.4 Mastery Learning

**Principio.** El usuario avanza con evidencia suficiente y oportunidades correctivas; meta-análisis de programas de mastery learning reportan efectos positivos sobre desempeño ([Kulik et al., 1990](https://eric.ed.gov/?id=EJ415887)).

**Implementación.** “Dominado” requiere la puerta multidimensional. Las brechas activan práctica remedial y repaso puente. El contenido sigue visible para exploración, pero la recomendación de avance no confunde acceso con preparación.

### 4.5 Deliberate Practice

**Principio.** La práctica debe centrarse en una habilidad específica, cerca del límite actual, con feedback informativo y posibilidad de corrección.

**Implementación.** Cada ejercicio declara concepto principal, dificultad y error esperado. El selector busca la zona óptima, no máxima dificultad. Los errores recurrentes generan ejercicios discriminativos y no una repetición idéntica.

### 4.6 Interleaving

**Principio.** Mezclar problemas que requieren estrategias distintas obliga a seleccionar el método adecuado, en lugar de repetir mecánicamente un procedimiento. Guías del Institute of Education Sciences recomiendan espaciar, intercalar ejemplos y problemas, y usar quizzes de recuperación ([IES Practice Guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)); estudios aplicados de matemáticas han evaluado práctica intercalada frente a bloqueada ([IES, Interleaved Mathematics Practice](https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice)).

**Implementación.** Los primeros ejercicios de un concepto son parcialmente bloqueados para formar el esquema; desde la mitad del subnivel se mezclan conceptos confundibles, prerrequisitos y estrategias. Los repasos evitan más de dos ítems consecutivos con el mismo concepto principal, salvo remediación breve justificada.

### 4.7 Desirable Difficulties

**Principio.** Una dificultad productiva puede reducir rendimiento inmediato mientras mejora retención o transferencia. No toda dificultad es deseable.

**Implementación.** Se usan espaciamiento, recuperación, variación, producción e interleaving cuando el usuario posee prerrequisitos y apoyo suficiente. Una dificultad deja de ser deseable si genera fallos no diagnósticos, sobrecarga persistente, abandono o dependencia creciente de pistas. El motor ajusta soporte antes de reducir el objetivo conceptual.

### 4.8 Transfer Learning

**Principio.** Saber implica aplicar una representación en contextos distintos y reconocer cuándo es relevante.

**Implementación.** Cada concepto se evalúa en contextos de superficie, representación y composición distintos. Un concepto usado correctamente como prerrequisito dentro de otro puede recibir evidencia de transferencia solo si su uso es necesario, verificable, novedoso e independiente.

### 4.9 Metacognition

**Principio.** El usuario necesita calibrar qué sabe y qué no. La calibración relaciona juicio y desempeño; mejores apoyos metacognitivos pueden mejorar precisión de esos juicios ([Michalsky y Bakrish, 2024](https://pubmed.ncbi.nlm.nih.gov/39559205/)), pero el autojuicio por sí solo puede ser impreciso ([Townsend y Heit, 2011](https://pubmed.ncbi.nlm.nih.gov/21264622/)).

**Implementación.** El motor infiere certeza conductual y solicita predicciones de desempeño de manera ocasional, especialmente antes de quizzes. Luego muestra calibración entre predicción y resultado. La autoevaluación nunca actualiza dominio por sí sola ni determina desbloqueo.

### 4.10 Chunking

**Principio.** La información compleja se comprende mediante unidades coherentes conectadas a esquemas previos.

**Implementación.** Concept es la unidad medible; la lección agrupa pocos conceptos relacionados; la teoría los presenta en bloques breves; los ejercicios comienzan aislando y luego componen chunks. Si un ejercicio exige demasiados elementos nuevos, se divide o se reclasifica como integración avanzada.

### 4.11 Scaffolding

**Principio.** El apoyo temporal permite realizar una tarea aún no independiente y debe retirarse progresivamente.

**Implementación.** Ejemplos trabajados, restricciones, pistas y ejercicios remediales forman una escalera. La evidencia positiva se pondera según ayuda. Cuando aparecen éxitos, el motor retira prompts, reduce estructura y exige producción autónoma. El soporte no se mantiene por comodidad si ya no es necesario.

### 4.12 Error-based Learning

**Principio.** El error puede impulsar aprendizaje cuando existe seguridad psicológica, interpretación y feedback informativo. El beneficio depende del tipo de error y del feedback posterior ([Narciss y Alemdag, 2025](https://pubmed.ncbi.nlm.nih.gov/39317664/); [Mera, Rodríguez y Marin-Garcia, 2022](https://pubmed.ncbi.nlm.nih.gov/34820785/)).

**Implementación.** Los errores no se castigan con pérdida de acceso. Se clasifican, se explica la brecha y se propone una acción. El feedback se dirige a la tarea, estrategia o concepto; nunca etiqueta capacidad personal. Los errores de infraestructura no afectan dominio.

### 4.13 Generative Learning

**Principio.** Producir explicaciones, representaciones, ejemplos o soluciones obliga a organizar e integrar conocimiento.

**Implementación.** Se prioriza construir sobre reconocer: escribir código, resolver, explicar comportamiento, crear ejemplos, comparar y relacionar conceptos. Las preguntas profundas y la integración entre representaciones están alineadas con recomendaciones del IES ([Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/20072004.pdf)).

## 5. Flujo pedagógico completo

### 5.1 Diagrama de estados de aprendizaje

> Tema → Nivel → Subnivel → Conceptos objetivo → Lección → Teoría mínima → Conceptos clave → Conexión previa → Mini revisión → 30 ejercicios → Feedback y remediación → Quiz final → Vector de dominio → Repaso → Desbloqueo recomendado → Aplicación y transferencia

Este diagrama es una secuencia de experiencia, no una relación de propiedad de datos. Conforme a `DATABASE_DESIGN.md`, la jerarquía editorial y el grafo conceptual permanecen separados y se unen mediante asociaciones versionadas.

### 5.2 Tema

Define un campo de conocimiento, resultados globales, audiencia, lenguaje y mapa conceptual. El motor usa su publicación vigente para explicar metas y calcular agregados; no concede dominio a nivel de tema sin estados conceptuales suficientes.

### 5.3 Nivel

Ordena complejidad y resultados. El motor lo utiliza como marco de dificultad y cobertura. Un nivel “terminado” solo significa actividad curricular concluida; “dominado” es un agregado de conceptos con confianza y cobertura.

### 5.4 Subnivel

Es la unidad pedagógica atómica publicada: objetivo, lección principal, conceptos, exactamente 30 ejercicios y quiz final. El motor presenta una estimación de esfuerzo, realiza mini diagnóstico y adapta soporte dentro del contenido publicado sin sustituir los 30 ejercicios.

### 5.5 Conceptos

Son las unidades canónicas de conocimiento. Antes de la lección, el motor identifica principales, secundarios y prerrequisitos. Después de cada evidencia actualiza únicamente los conceptos explícitamente evaluados.

### 5.6 Lección y teoría

Construyen el modelo mental mínimo. No producen dominio por lectura. Pueden personalizar orden de bloques o recomendar microteoría según brechas, pero no omitir prerrequisitos críticos ni cambiar contenido publicado.

### 5.7 Conceptos clave y conexión previa

Se muestran como una lista accionable de lo que el usuario deberá poder hacer. La conexión recupera conocimiento anterior mediante una pregunta o contraste; no repite teoría completa.

### 5.8 Mini revisión

Contiene 2 a 5 ítems de recuperación de prerrequisitos. Si el desempeño es suficiente, comienza la práctica. Si revela una posible brecha, se ofrece un repaso puente. No bloquea punitivamente y su evidencia tiene menor peso por ser diagnóstica.

### 5.9 Treinta ejercicios

Construyen desde aislamiento hasta integración y transferencia. La lista publicada no cambia por usuario; el apoyo, el momento de las pistas y ejercicios remediales externos sí pueden adaptarse. Los remediales no cuentan como uno de los 30 ni sustituyen posiciones.

### 5.10 Retroalimentación

Toda respuesta correcta recibe explicación. Un fallo recibe clasificación y pista, no solución. La explicación completa aparece después de resolver correctamente o cerrar el flujo de intentos según política.

### 5.11 Quiz, dominio y repaso

El quiz usa ítems nuevos, sin pistas, y aporta evidencia de recuperación/transferencia. El motor recalcula el vector, explica fortalezas y brechas, programa retención y determina si el siguiente subnivel es recomendado.

### 5.12 Desbloqueo

El desbloqueo pedagógico se basa en prerrequisitos y dominio multidimensional. La finalización solo satisface cobertura de experiencia, nunca el criterio de dominio.

## 6. Contrato de teoría

### 6.1 Estructura obligatoria

Toda lección principal DEBE contener, en orden pedagógico:

1. **Objetivo:** conducta observable que podrá demostrar el usuario.
2. **Introducción:** problema, utilidad y límites del concepto en pocas frases.
3. **Explicación:** modelo mental, reglas y condiciones de uso.
4. **Ejemplo básico:** aísla una idea sin ruido accidental.
5. **Ejemplo intermedio:** combina la idea con conocimiento ya dominado.
6. **Ejemplo avanzado:** exige aplicación o transferencia cercana sin introducir materia oculta.
7. **Errores comunes:** confusiones reales, causas y señales para reconocerlas.
8. **Conceptos clave:** lista de unidades que se evaluarán.
9. **Relación con conocimientos anteriores:** qué se recupera, qué cambia y qué depende de ello.
10. **Resumen:** decisiones, reglas y preguntas de autoexplicación; no repetición literal.
11. **Tiempo estimado:** teoría, práctica y evaluación por separado.
12. **Comenzar ejercicios:** acción primaria accesible.

### 6.2 Prueba de necesidad

Cada párrafo debe cumplir al menos una función: construir modelo mental, definir límite, conectar, contrastar, ejemplificar, prevenir error o preparar una acción. Si puede eliminarse sin perder ninguna de esas funciones, es relleno y debe eliminarse.

### 6.3 Densidad y progresión

- Una sección introduce pocos conceptos nuevos relacionados.
- Los términos se definen antes de usarse o se marcan como prerrequisito.
- Los ejemplos no contienen complejidad irrelevante.
- El avanzado combina; no sorprende con contenido futuro.
- No se explica dos veces lo mismo con redacción distinta salvo recuperación espaciada deliberada.
- La longitud depende de complejidad, no de una cuota de palabras.

### 6.4 Adaptación permitida

El motor puede recomendar una versión remedial, expandir un error común o contraer contenido ya dominado. No puede eliminar el objetivo, conceptos clave, conexión, ejemplos obligatorios ni resumen. Ver una versión breve no cambia dominio.

## 7. Arquitectura de los 30 ejercicios

### 7.1 Invariantes

- Exactamente 30 por SublevelVersion publicada.
- Cada ejercicio enseña o mide un objetivo pedagógico explícito.
- Ninguno es de relleno, trivial por reconocimiento obvio ni duplicado semántico.
- La solución requiere conocimiento declarado.
- Dificultad, tipo, concepto, contexto y ayuda son identificables.
- La progresión aumenta la demanda de recuperación, selección, composición y transferencia.

### 7.2 Distribución de dificultad

| Banda | Posiciones objetivo | Cantidad | Propósito |
|---|---:|---:|---|
| Muy fácil | 1–3 | 3 (10%) | Aislar la regla con recuperación real; nunca respuesta obvia |
| Fácil | 4–8 | 5 (16.7%) | Aplicación directa con una variación |
| Intermedia | 9–18 | 10 (33.3%) | Selección de estrategia, combinación y errores frecuentes |
| Difícil | 19–26 | 8 (26.7%) | Menos guía, interleaving y transferencia cercana |
| Muy difícil | 27–30 | 4 (13.3%) | Integración y transferencia nueva sin materia no enseñada |

La dificultad forma una envolvente ascendente, no una escalera artificial perfecta. Puede existir una breve bajada justificada para introducir otro tipo de ejercicio o recuperar un prerrequisito, pero dentro de cada bloque no habrá regresión sostenida ni relleno.

### 7.3 Cinco fuentes de dificultad

1. **Complejidad intrínseca:** cantidad de elementos que interactúan.
2. **Distancia de transferencia:** similitud con ejemplos vistos.
3. **Grado de soporte:** material inicial, opciones y pistas disponibles.
4. **Selección de estrategia:** si el método viene indicado o debe inferirse.
5. **Composición:** número y criticidad de conceptos necesarios.

La dificultad declarada se calibra con desempeño agregado, pero nunca se redefine para un usuario individual. El motor conserva una dificultad individual estimada aparte.

### 7.4 Progresión por fases

| Fase | Posiciones | Conducta buscada |
|---|---:|---|
| Formación | 1–5 | Recuperar y aplicar el concepto aislado |
| Variación | 6–12 | Reconocerlo bajo cambios de superficie |
| Discriminación | 13–20 | Elegir entre conceptos/estrategias confundibles |
| Transferencia cercana | 21–26 | Integrarlo sin guía en problemas nuevos |
| Integración | 27–30 | Aplicarlo junto con otros conceptos y explicar decisiones |

## 8. Tipos de ejercicios y proporción ideal

### 8.1 Distribución primaria obligatoria para programación

Se conserva la distribución objetivo de `MASTER_SPEC.md`:

| Tipo primario | Cantidad | Porcentaje | Justificación |
|---|---:|---:|---|
| Escribir código / producción constructiva | 14 | 46.7% | Máxima evidencia de generación, selección y ejecución independiente |
| Predecir salida | 7 | 23.3% | Revela el modelo mental antes de probar por ensayo y error |
| Encontrar/corregir errores | 5 | 16.7% | Entrena discriminación, diagnóstico y aprendizaje basado en errores |
| Completar código | 3 | 10% | Scaffolding útil, pero aporta menos independencia |
| Opción múltiple | 1 | 3.3% | Reconocimiento mínimo, reservado para discriminaciones justificadas |

Total: 30 ejercicios.

### 8.2 Explicar comportamiento y relacionar conceptos

Son **demandas cognitivas secundarias**, no categorías excluyentes que alteren el total de 30:

- Al menos 6 de 30 ejercicios (20%) deben pedir explicación breve, justificación o predicción razonada.
- Al menos 4 de 30 (13.3%) deben exigir relacionar, contrastar o seleccionar entre conceptos.
- Pueden solaparse entre sí y con escribir, predecir, corregir o completar.
- La explicación se evalúa con rúbrica; no se usa Gemini como juez final.

Esta doble clasificación preserva la distribución contractual y mide razonamiento sin reducir práctica productiva.

### 8.3 Equivalencia multidisciplinar

| Acción cognitiva | Programación | Matemáticas/Física/Química | Idiomas | Historia |
|---|---|---|---|---|
| Producción constructiva | Escribir código | Resolver/demostrar/modelar | Producir texto/habla | Construir argumento causal |
| Predicción | Salida del programa | Resultado/tendencia | Forma o significado en contexto | Consecuencia probable |
| Detección de error | Bug | Paso/unidad/supuesto erróneo | Error gramatical/semántico | Anacronismo/fuente inválida |
| Completar | Código parcial | Derivación/modelo parcial | Oración/texto parcial | Línea causal/fuente parcial |
| Explicar | Comportamiento | Principio y razonamiento | Elección lingüística | Interpretación con evidencia |
| Relacionar | Conceptos/librerías | Representaciones/leyes | Registros/estructuras | Causas, periodos y perspectivas |

## 9. Zona de aprendizaje óptima

### 9.1 Objetivo de desafío

El motor selecciona tareas con probabilidad prevista de éxito independiente dentro de rangos:

- Formación inicial: 75–90%.
- Práctica deliberada: 65–80%.
- Transferencia: 55–75%, con soporte disponible después del primer intento.
- Repaso: 70–90%, según vencimiento y criticidad.

Estos rangos buscan esfuerzo con posibilidad razonable de recuperación. No son porcentajes de dominio.

### 9.2 Señales de tarea demasiado fácil

- cuatro o más recuperaciones independientes correctas al primer intento;
- latencia baja estable, no anómalamente baja;
- explicación correcta;
- ausencia de pistas;
- éxito en variantes nuevas;
- baja discriminación del ítem en cohortes.

Respuesta: aumentar distancia de transferencia, retirar scaffolding, mezclar conceptos o avanzar de banda. No insertar trabajo redundante.

### 9.3 Señales de tarea demasiado difícil

- dos fallos consecutivos con el mismo patrón;
- aumento de errores no informativos;
- uso completo de pistas sin progreso;
- tiempos excesivos respecto a la propia línea base;
- abandono/reinicio repetido;
- prerrequisito crítico con baja retención.

Respuesta: clasificar causa, ofrecer pista apropiada, reducir complejidad extrínseca, presentar microteoría o ejercicio remedial. No bajar arbitrariamente el concepto evaluado ni revelar la solución.

### 9.4 Fatiga y carga

La fatiga se trata como hipótesis temporal, no rasgo. Pausas, latencia creciente, errores de distracción y abandono pueden sugerirla. El motor ofrece detener o acortar la sesión; no rebaja dominio por tiempo lento ni etiqueta incapacidad.

## 10. Evidencia: calidad, independencia y peso

### 10.1 Unidad de evidencia

Una evidencia válida proviene de una respuesta evaluable contra una versión concreta, con conceptos explícitos. Contiene resultado, dificultad, contexto, ayuda, novedad, tiempo, error y versión de política.

### 10.2 Fuerza base por actividad

| Actividad | Fuerza relativa inicial |
|---|---:|
| Producción constructiva nueva | 1.00 |
| Transferencia integrada verificable | 0.90 |
| Explicación abierta con rúbrica | 0.80 |
| Detectar y corregir error | 0.80 |
| Predecir resultado con justificación | 0.75 |
| Predecir sin justificación | 0.60 |
| Completar con estructura parcial | 0.50 |
| Opción múltiple | 0.30 |
| Mini revisión diagnóstica | Multiplicador de contexto 0.60 |

Son parámetros iniciales sujetos a shadow mode. No convierten automáticamente un acierto en el mismo aumento; modulan la actualización bayesiana.

### 10.3 Multiplicadores de evidencia

- Primer intento sin pistas: 1.00.
- Pista 1: máximo 0.80 de evidencia positiva.
- Pista 2: máximo 0.60.
- Pista 3: máximo 0.40.
- Después de microteoría o solución explicada: máximo 0.20 hasta una recuperación independiente posterior.
- Ejercicio familiar reciente: entre 0.10 y 0.50 según riesgo de memorización.
- Variante nueva: 1.00; transferencia lejana verificable puede llegar a 1.15 sin exceder límites de política.
- Repetición inmediata: rendimiento decreciente; no cuenta como recuperación independiente.

La evidencia negativa no se atenúa para “proteger” un score, pero sí se clasifica: error de infraestructura tiene peso cero; distracción aislada tiene bajo peso; error conceptual reproducido tiene peso alto.

### 10.4 Independencia

Una recuperación es independiente si cumple al menos una de estas condiciones bajo política versionada:

- ocurre después de un intervalo mínimo suficiente para el concepto;
- usa una variante con fingerprint distante;
- cambia representación o contexto;
- exige uso espontáneo dentro de otro concepto;
- ocurre en quiz sin pistas ni material visible.

Múltiples submissions dentro del mismo Attempt constituyen una sola oportunidad de recuperación a efectos del requisito de tres recuperaciones.

## 11. Modelo científico de actualización

### 11.1 Probabilidad de conocimiento conceptual

La dimensión **K** representa la probabilidad de que el conocimiento requerido esté disponible antes de considerar el olvido futuro. La política v1 se inspira en Bayesian Knowledge Tracing, como exige `MASTER_SPEC.md`.

Para cada evidencia se parte de una probabilidad previa. La probabilidad observada de acierto reconoce dos fenómenos:

- **Guess:** posibilidad de responder bien sin dominar, mayor en reconocimiento y menor en producción.
- **Slip:** posibilidad de fallar a pesar de dominar, mayor en tareas largas o propensas a errores de ejecución.

La actualización posterior usa Bayes según respuesta correcta o incorrecta. Después se aplica una probabilidad de aprendizaje asociada a la oportunidad, modulada por feedback, dificultad deseable y calidad de resolución. El desplazamiento desde el prior hacia el posterior se limita mediante la fuerza de evidencia de la sección 10.

La política inicial utiliza parámetros diferentes por tipo y dificultad; no existe un guess/slip universal. Los parámetros se calibran con datos piloto y se rechazan si producen mala calibración por disciplina o grupo.

### 11.2 No confundir actualización con recompensa

K puede subir poco después de un acierto familiar, bajar después de un error conceptual o mantenerse casi igual ante un error de sintaxis aislado. El cambio no es XP y no se presenta como premio/castigo.

### 11.3 Límites de cambio

Ningún único acierto lleva de New a Mastered. Ningún error aislado borra dominio consolidado. La magnitud máxima por evento se parametriza y disminuye con baja confianza en la clasificación. Un lapso auténtico modifica retención/estabilidad con mayor fuerza que K de adquisición.

## 12. Vector multidimensional de dominio

### 12.1 Dimensiones canónicas

| Símbolo | Dimensión | Qué responde | Fuente principal |
|---|---|---|---|
| K | Conocimiento conceptual | ¿Puede aplicar la regla ahora? | Actualización bayesiana |
| R | Retención | ¿Podrá recuperarla en el horizonte objetivo? | Curva temporal y estabilidad |
| T | Transferencia | ¿La aplica en problemas/contextos nuevos? | Evidencias transferenciales |
| C | Confianza del estimador | ¿Cuánta evidencia respalda la estimación? | Cantidad, diversidad, recencia y concordancia |
| S | Consistencia | ¿Se sostiene entre ocasiones y formatos? | Variabilidad de recuperaciones independientes |
| I | Independencia | ¿Resuelve sin ayuda creciente? | Pistas, scaffolding y reintentos |
| Q | Calidad | ¿La solución es correcta, robusta y explicada? | Rúbrica/casos/estrategia |
| V | Cobertura | ¿La evidencia cubre dificultad, tipo y facetas? | Matriz de evidencia |
| F | Fluidez contextual | ¿Responde eficientemente sin sacrificar calidad? | Tiempo normalizado personal/tarea |
| M | Calibración metacognitiva | ¿Su juicio sobre lo que sabe coincide con desempeño? | Predicción/confianza declarada vs resultado |

**Dependencia de pistas** es la lectura complementaria de I: se informa como frecuencia, nivel máximo y trayectoria de ayuda, no como una etiqueta binaria. **Tiempo de respuesta** es la observación bruta y contextual que alimenta F junto con complejidad, tipo de tarea y línea base personal; no constituye por sí solo una dimensión de conocimiento ni una penalización.

### 12.2 Índice de preparación para dominio

La UI puede mostrar un índice sintético para orientación, pero el estado se decide con el vector. El índice inicial es una media armónica ponderada de K, R, T, S, I, Q y V, porque una dimensión baja no debe ocultarse con otras altas.

Pesos iniciales:

- K: 25%.
- R: 20%.
- T: 15%.
- S: 10%.
- I: 10%.
- Q: 10%.
- V: 10%.

C funciona como condición de validez, no como conocimiento. F y M se muestran y adaptan intervenciones, pero no reducen por sí solas el dominio: una persona lenta o metacognitivamente insegura puede saber. Los pesos se versionan y calibran; nunca se cambian retrospectivamente sin reconstrucción explícita.

### 12.3 Interacciones importantes

- K alto + R baja: conocimiento adquirido pero en riesgo; repaso prioritario.
- K alto + T baja: posible aprendizaje rígido o memorización; variar contextos.
- K alto + C baja: evidencia insuficiente; solicitar recuperación independiente.
- K alto + I baja: desempeño asistido; retirar scaffolding gradualmente.
- K alto + S baja: resultados inestables; investigar tipo de tarea/error.
- K alto + Q baja: soluciones frágiles; trabajar estrategia y explicación.
- T alta con K moderado: revisar mapeo/dificultad; puede indicar transferencia real que aún necesita más evidencia.
- F baja con calidad alta: entrenar fluidez solo si la disciplina lo requiere; no penalizar dominio.

## 13. Estados pedagógicos

| Estado | Significado | Conducta del motor |
|---|---|---|
| New | Evidencia insuficiente | Introducción, ejemplos y práctica de formación |
| Developing | K menor de 70 o cobertura/confianza insuficiente | Scaffolding y práctica focalizada |
| Competent | K 70–89 con cobertura mínima | Menos apoyo, interleaving y transferencia |
| Mastery candidate | K ≥ 90 pero falta alguna dimensión/criterio | Prueba específica de la dimensión faltante |
| Mastered | Cumple puerta completa | Espaciar, mantener y permitir recomendación de avance |
| At risk | Fue dominado y R prevista < 85 | Repaso próximo antes de lapso |
| Review required | R prevista < 75 o lapso reciente | Repaso prioritario y diagnóstico si falla |
| Recovered | Superó un lapso con recuperación independiente | Nueva estabilidad prudente y seguimiento |

Mastery candidate es una precisión nueva de presentación; no reemplaza los estados persistibles definidos previamente y puede derivarse sin cambiar el modelo conceptual.

## 14. Criterios exactos de dominio

Un concepto se marca **Mastered** solo si simultáneamente:

1. K ≥ 0.90.
2. C ≥ 0.75.
3. R en el horizonte de dominio aplicable ≥ 0.85.
4. T ≥ 0.70 cuando el concepto admite transferencia; si aún no hay oportunidad válida, permanece Mastery candidate.
5. S ≥ 0.75 en recuperaciones independientes recientes.
6. I ≥ 0.75 y al menos una evidencia válida sin pistas.
7. Q ≥ 0.75 en la rúbrica aplicable.
8. V ≥ 0.80 y cubre al menos dos tipos de ejercicio y dos bandas de dificultad, salvo concepto cuya naturaleza documente una excepción.
9. Existen al menos tres recuperaciones independientes.
10. Existe una evidencia reciente dentro del horizonte definido por estabilidad.
11. No hay prerrequisito crítico en Review required sin diagnóstico resuelto.

Estos criterios amplían, no rebajan, `MASTER_SPEC.md`. La promoción exige aprobación del ADR-LE-001.

### 14.1 Dominio por Lesson, Sublevel, Level y Topic

Se usa media armónica ponderada de los conceptos, con cobertura y confianza. Un concepto principal crítico bajo el umbral limita el agregado. El estado agregado Mastered requiere que todos los conceptos críticos estén Mastered y que los restantes alcancen al menos Competent con cobertura. No se obtiene por promedio aritmético ni finalización.

### 14.2 Dominio por Exercise

Se denomina “familiaridad/probabilidad de resolución” para no confundirlo con conocimiento transferible. Un ejercicio muy familiar puede alcanzar alta probabilidad mientras T del concepto permanece baja. Esa divergencia activa variaciones y limita el peso de nuevas respuestas a la misma familia.

## 15. Modelo de confianza

### 15.1 Tres conceptos distintos

**Confianza del estimador (C).** Cuánta evidencia tiene el sistema para creer en K/R/T.

**Certeza conductual de respuesta.** Qué tan independiente y estable parece una respuesta concreta.

**Confianza declarada.** Juicio metacognitivo opcional del usuario.

Nunca se mezclan en un solo valor.

### 15.2 Confianza del estimador

C aumenta con:

- número efectivo de recuperaciones independientes;
- diversidad de tipos, dificultad, contextos y tiempo;
- recencia suficiente;
- concordancia entre resultados;
- cobertura de conceptos/facetas;
- evaluadores confiables.

C disminuye o crece lentamente con:

- pocas observaciones;
- repetición inmediata;
- evidencia contradictoria;
- contenido familiar;
- evaluaciones de baja discriminación;
- clasificación incierta del error;
- cambios de versión conceptual sin equivalencia aprobada.

La cantidad efectiva usa rendimientos decrecientes: diez repeticiones similares no equivalen a diez evidencias independientes.

### 15.3 Certeza conductual inferida

Se estima por patrón conjunto, nunca por una señal aislada:

- acierto al primer intento;
- ausencia o nivel de pistas;
- correcciones pequeñas o reconstrucción completa;
- estabilidad entre ejercicios equivalentes;
- tiempo dentro del rango personal/tarea;
- explicación coherente;
- ausencia de ensayo aleatorio;
- estrategia consistente con el resultado.

Un tiempo corto anómalo puede significar fluidez, adivinanza o memorización; un tiempo largo puede significar reflexión, distracción o dificultad. Solo adquiere significado junto con otras señales.

### 15.4 Calibración metacognitiva

En momentos de bajo coste se pide una predicción de desempeño o confianza de respuesta. Se compara con la precisión posterior usando error de calibración y Brier score u otra medida versionada. El feedback dice “tu estimación fue más alta/baja que tu desempeño reciente” y propone una acción. Nunca avergüenza ni altera K directamente.

## 16. Retención y olvido

### 16.1 Modelo temporal

La retención prevista para un concepto en el tiempo t desde la última recuperación válida se modela inicialmente mediante una curva exponencial flexible:

**R(t) = exp(−(t / Stability)^Shape)**

`Stability` es individual por usuario-concepto. `Shape` pertenece a AlgorithmVersion y puede variar por familia disciplinar si la evidencia lo justifica. Con Shape igual a 1 se obtiene una base interpretable; ninguna persona comparte obligatoriamente la misma curva.

K representa adquisición; R representa disponibilidad temporal. El conocimiento visible al momento puede interpretarse como K condicionado por R, pero ambos se conservan para explicar si el problema es aprendizaje inicial u olvido.

### 16.2 Actualización de estabilidad

Una recuperación correcta incrementa Stability. La ganancia es mayor cuando:

- ocurre cerca o después del punto de esfuerzo deseable sin estar totalmente olvidado;
- es independiente y sin pistas;
- usa contexto nuevo;
- demuestra transferencia;
- tiene buena calidad;
- sigue a intervalos crecientes exitosos.

La ganancia es menor cuando:

- ocurre demasiado pronto;
- repite el mismo ejercicio;
- necesita scaffolding;
- la dificultad es muy baja;
- el acierto parece adivinanza.

Un error auténtico después de dominio es un lapso: reduce Stability y R de forma significativa, pero no borra K. Un error de sintaxis o infraestructura no se trata automáticamente como olvido conceptual.

### 16.3 Factores iniciales de estabilidad

La política v1 normaliza una ganancia base y aplica factores:

- Momento del repaso: temprano 0.4–0.7; ventana óptima 1.0; tardío correcto 1.1–1.3.
- Independencia: sin pista 1.0; pista 1 hasta 0.8; pista 2 hasta 0.6; pista 3 hasta 0.4.
- Transferencia: directa 1.0; cercana 1.1; lejana verificable 1.2.
- Calidad: multiplica entre 0.6 y 1.1.
- Familiaridad alta: limita entre 0.2 y 0.6.

Los rangos definen conducta y límites, no valores secretos. El valor exacto se versiona y se calibra en sombra.

### 16.4 Umbrales temporales

- R ≥ 0.90: estable para el horizonte inmediato.
- 0.85 ≤ R < 0.90: saludable, vigilar según criticidad.
- 0.75 ≤ R < 0.85: At risk; programar antes de caer.
- R < 0.75: Review required.

El siguiente repaso se agenda para que R estimada alcance el umbral objetivo: 0.85 para conceptos críticos o dominados recientemente; 0.80 para consolidación ordinaria; nunca se espera deliberadamente por debajo de 0.75 salvo posposición del usuario o falta de disponibilidad.

### 16.5 Detección de olvido y recuperación

Olvido probable requiere una caída temporal prevista o un lapso en recuperación independiente. Un fallo inmediatamente después de aprender sugiere adquisición incompleta, no olvido. Recuperación significa resolver una variante válida después de un lapso, preferentemente sin pista, y mantener éxito en una comprobación posterior. La nueva Stability crece de forma prudente; no vuelve automáticamente a su máximo anterior.

## 17. Transferencia

### 17.1 Niveles

| Nivel | Descripción | Ejemplo conceptual | Peso máximo inicial |
|---|---|---|---:|
| T0 Repetición | Misma estructura/superficie | Mismo patrón con literales cambiados | 0.20 |
| T1 Variación superficial | Misma estrategia, contexto distinto | Variables con otros nombres/datos | 0.45 |
| T2 Transferencia cercana | Concepto en problema nuevo del mismo dominio | Variables dentro de una función nueva | 0.65 |
| T3 Transferencia composicional | Concepto como prerrequisito de otro | Variables usadas correctamente en POO | 0.80 |
| T4 Transferencia lejana | Representación o dominio sustancialmente distinto | Estado mutable aplicado en diseño de API | 1.00 |

El peso máximo modula evidencia; no es directamente el score T.

### 17.2 Condiciones para acreditar transferencia embebida

Un concepto A recibe evidencia positiva al usarse dentro de B solo si:

1. A está mapeado como prerrequisito, Applies o componente relevante en el knowledge graph.
2. El ejercicio exige realmente A; no es incidental.
3. El evaluador puede aislar una conducta observable de A.
4. La solución es nueva o suficientemente distante de exposiciones previas.
5. La conducta se realiza correctamente y sin ayuda que la revele.
6. El éxito de B no puede explicarse ignorando A.

La evidencia principal recae en B. A recibe impacto secundario limitado según nivel. Ninguna inferencia verbal de “probablemente usó A” basta.

### 17.3 Estimación de T

T se estima con una distribución beta ponderada sobre oportunidades transferenciales: éxitos y fallos acumulan masa según distancia, calidad e independencia. Se exige un mínimo de oportunidades antes de considerar T confiable. Las oportunidades repetidas en el mismo contexto tienen rendimiento decreciente.

### 17.4 Transferencia negativa

Si el usuario aplica una regla conocida en un contexto donde no corresponde, se registra un error de transferencia/selección. Puede disminuir T y S del concepto aplicado, pero solo afecta K si el error demuestra comprensión conceptual incorrecta. Se ofrece un ejercicio de contraste.

### 17.5 Ejemplo Variables → Funciones → POO → APIs

- Usar una variable local correctamente en una función nueva aporta evidencia principal a Funciones y secundaria T2 a Variables.
- Elegir estado de instancia apropiado en POO aporta evidencia T3 a Variables/alcance si esa decisión está evaluada.
- Gestionar estado en una API aporta T3/T4 solo si el ejercicio cambia contexto y el evaluador verifica el uso.
- Copiar una plantilla conocida no aporta transferencia aunque el resultado funcione.

## 18. Detección y prevención de memorización

### 18.1 Memorización válida frente a memorización del ítem

Automatizar hechos o procedimientos básicos puede ser útil. El riesgo pedagógico es memorizar una respuesta o patrón superficial sin comprender cuándo y por qué usarlo.

### 18.2 Señales de riesgo

El motor calcula un **riesgo de familiaridad**, no acusa al usuario. Requiere combinación de señales:

- éxito repetido en el mismo Exercise/fingerprint y caída marcada en variantes;
- latencia anómalamente baja solo en ítems vistos;
- respuesta exacta conocida con explicación incoherente;
- incapacidad para predecir pequeños cambios;
- correcciones por ensayo hasta coincidir con tests visibles;
- rendimiento alto bloqueado y bajo al intercalar;
- dependencia de palabras clave o posición de opciones;
- discrepancia entre familiaridad de Exercise y T del Concept.

Velocidad sola, estilo de respuesta o una inconsistencia aislada nunca bastan.

### 18.3 Respuestas del motor

- reducir peso de evidencia de la familia familiar;
- seleccionar variante estructural, no solo nuevos literales;
- cambiar representación: producir, explicar, detectar o contrastar;
- retirar opciones y scaffolding;
- introducir intervalo antes de revaluar;
- exigir predicción previa a ejecución;
- usar contexto de transferencia cercana;
- intercalar con un concepto confundible;
- solicitar explicación de una decisión crítica.

No se castiga XP ya ganado ni se muestra una etiqueta de “memorizador”.

### 18.4 Criterio de descarte de sospecha

El riesgo disminuye después de dos o más éxitos independientes en variantes distantes, con explicación/calidad adecuada y al menos uno sin pistas. Esas evidencias pueden restaurar peso normal; no reescriben eventos anteriores.

## 19. Taxonomía de errores

### 19.1 Categorías

| Error | Definición | Señales | Respuesta pedagógica | Impacto inicial |
|---|---|---|---|---|
| Conceptual | Modelo mental o regla incorrecta | Misma idea errónea en contextos | Contraste, contraejemplo, microteoría | Alto sobre concepto observado |
| Sintáctico/notacional | Forma inválida con idea aparentemente correcta | Parser/notación, solución cercana | Señalar zona/regla, no resolver | Bajo–medio según repetición |
| Lógico | Procedimiento válido formalmente pero razonamiento produce resultado incorrecto | Casos específicos fallan | Trazar decisiones y caso límite | Medio–alto |
| Interpretación | Comprendió mal consigna, datos o condición | Resuelve otro problema | Reformular requisito y pedir paráfrasis | Bajo para concepto; alto para habilidad de interpretación si recurrente |
| Distracción | Omisión aislada incoherente con historial | Error no repetido, autocorrección rápida | Feedback breve y reintento | Bajo |
| Prerrequisito insuficiente | La tarea objetivo falla por una base débil confirmada | Diagnóstico separado falla | Repaso puente del nodo previo | Impacto solo tras evidencia diagnóstica |
| Estrategia | Conoce elementos pero elige método ineficiente/inadecuado | Explicación revela selección pobre | Comparar estrategias y criterios | Medio en selección/transferencia |
| Procedimental | Omite o desordena pasos de un proceso conocido | Patrón secuencial | Checklist decreciente y práctica | Medio |
| Representación | No traduce entre texto, símbolo, gráfico, código o modelo | Éxito en una forma, fallo en otra | Ejercicio de traducción | Alto en transferencia, variable en K |
| Transferencia negativa | Aplica una regla donde no corresponde | Sobregeneralización | Casos contrastantes | Alto en T/S |
| Metacognitivo | Alta seguridad en error o baja seguridad persistente en acierto | Mala calibración repetida | Predicción, reflexión y feedback de calibración | Afecta M, no K directamente |
| Calidad/robustez | Resultado correcto con solución frágil o no generalizable | Falla en casos límite | Mostrar criterio fallido, pedir mejora | Q y quizá K |
| Runtime/entorno | Infraestructura, timeout o dependencia externa | Falla técnica reproducible | Reintentar/recuperar sesión | Cero en dominio |
| Indeterminado | Evidencia insuficiente para clasificar | Señales contradictorias | Pregunta diagnóstica | Peso negativo limitado |

### 19.2 Clasificación jerárquica

Se distingue primero error evaluable de error técnico. Después se determina si es local a la respuesta o persistente, y si afecta concepto objetivo, prerrequisito, estrategia o representación. Una clasificación puede tener categoría principal y secundarias con confianza. El motor no sobrerreacciona cuando esa confianza es baja.

### 19.3 Confirmación de error de prerrequisito

Fallar A no reduce B automáticamente. El knowledge graph genera candidatos B; el motor presenta un ítem discriminativo de B. Solo el resultado de ese ítem genera evidencia para B. Este principio es invariable.

## 20. Sistema de pistas y feedback

### 20.1 Tres niveles de pistas

| Nivel | Propósito | Puede mostrar | No puede mostrar |
|---|---|---|---|
| Pista 1 — Orientación | Activar el concepto correcto | Regla, pregunta guía general, concepto a revisar | Parte exacta que debe cambiar o respuesta |
| Pista 2 — Localización | Reducir el espacio del problema | Región, condición incumplida, caso simple, contraste | Texto/código copiable que resuelva |
| Pista 3 — Andamiaje conceptual | Reconstruir razonamiento | Subproblema, analogía, pasos de reflexión incompletos | Resultado final, opción única por descarte o solución exacta |

Después de Pista 3 y un nuevo fallo se ofrece microteoría y un ejercicio remedial distinto. La solución del ejercicio original solo se muestra cuando el intento se cierra conforme a política, nunca mientras aún se espera una respuesta activa.

### 20.2 Selección de pista

La pista se elige por error observado y concepto, no simplemente por número de fallo. Si la clasificación cambia, la pista puede cambiar de objetivo. Una pista ya revelada no se “desrevela”; su uso limita evidencia positiva del Attempt.

### 20.3 Feedback correcto

Siempre contiene:

- confirmación específica, no solo “correcto”;
- concepto aplicado;
- razonamiento esencial;
- por qué funciona;
- error común relevante si aporta valor;
- conexión con el siguiente nivel de dificultad.

### 20.4 Feedback incorrecto

Durante intento activo contiene resultado observable, categoría probable y siguiente acción. No presenta la solución. Cuando termina el flujo, la explicación completa contrasta respuesta y principio, sin culpabilizar.

La evidencia indica que el impacto del feedback depende fuertemente de su contenido, no de la mera presencia de feedback ([Wisniewski, Zierer y Hattie, 2020](https://pubmed.ncbi.nlm.nih.gov/32038429/)). Por eso se prioriza información accionable sobre elogio genérico.

## 21. Sistema de quizzes

### 21.1 Mini revisión previa

- 2–5 ítems.
- Evalúa prerrequisitos y conexión con el subnivel anterior.
- Aparece antes de teoría/práctica, con opción de repaso puente.
- Baja ponderación; su propósito principal es diagnóstico.
- No bloquea acceso.

### 21.2 Quiz final de subnivel

- 8–12 ítems según número de conceptos, con al menos dos oportunidades por concepto principal cuando sea viable.
- Ítems nuevos, fingerprints separados de los 30.
- Sin pistas ni teoría visible.
- Incluye producción, discriminación y al menos una transferencia cercana.
- No utiliza tiempo como criterio de corrección.
- No marca dominio por aprobar; crea evidencia para el vector.

### 21.3 Quiz de repaso

- 4–8 ítems sobre conceptos vencidos o en riesgo.
- Aparece al iniciar/cerrar una ReviewSession relevante.
- Mezcla tipos y contextos; evita ítems familiares.
- Puede sustituirse por ejercicios de recuperación equivalentes si la disciplina lo exige.

### 21.4 Quiz acumulativo

- 10–20 ítems.
- Aparece al cerrar un Level, cada 3–5 subniveles o tras un intervalo significativo, según carga.
- Intercala conceptos recientes y antiguos.
- Prioriza selección de estrategia y transferencia composicional.
- Identifica brechas que los quizzes locales no detectan.

### 21.5 Quiz sorpresa

Se implementa como **comprobación no anunciada de recuperación**, de bajo riesgo:

- 1–3 ítems dentro de una sesión ordinaria, como máximo con frecuencia limitada.
- Nunca afecta acceso, racha ni XP negativamente.
- Solo aparece si el usuario no muestra fatiga y el concepto tiene retención incierta.
- Se explica después por qué apareció.
- No utiliza tácticas de ansiedad, cuenta regresiva ni lenguaje punitivo.

Su propósito es medir recuperación sin preparación inmediata, no sorprender emocionalmente.

### 21.6 Reglas comunes

- Toda modalidad declara contexto para ponderación.
- Un quiz no reutiliza exactamente respuestas conocidas.
- La cobertura precede al score total.
- La revisión de resultados se organiza por concepto/error, no solo por número.
- Fallar genera plan de recuperación, no reinicio completo automático.

## 22. Desbloqueo y avance

### 22.1 Estados de disponibilidad

| Estado | Significado |
|---|---|
| Hidden | Contenido no publicado o no autorizado; no se usa como castigo pedagógico |
| Visible | Puede explorarse aunque existan brechas |
| Recommended | El motor considera que los prerrequisitos están listos |
| Mastery validated | El contenido previo cumple su puerta multidimensional |
| Bridge recommended | Puede continuar, pero se recomienda repaso de prerrequisito |

### 22.2 Criterio de recomendación del siguiente subnivel

El siguiente subnivel se marca Recommended si:

1. Todos sus prerrequisitos críticos tienen K ≥ 0.80 y R ≥ 0.75.
2. Los conceptos principales del subnivel actual están Mastered o, para rutas declaradamente flexibles, no hay ninguno debajo de Competent y el agregado armónico es ≥ 0.90.
3. El quiz final aportó cobertura válida; completarlo por sí solo no basta.
4. No existe un lapso crítico sin diagnóstico.
5. La carga cognitiva prevista no excede el rango del usuario.

Para declarar el subnivel anterior Mastery validated, todos sus conceptos críticos deben estar Mastered y los no críticos al menos Competent, con cobertura total ≥ 0.80.

### 22.3 Exploración con brechas

Si el usuario entra sin cumplir requisitos, el motor:

- informa qué prerrequisito está en riesgo;
- ofrece repaso puente corto;
- conserva acceso si el contenido es Visible;
- no reduce artificialmente dificultad ni otorga dominio;
- observa transferencia para confirmar o refutar la brecha.

## 23. Motor de repaso

### 23.1 Elegibilidad

Un concepto entra a la cola si cumple alguna condición:

- dueAt alcanzado;
- R prevista < 0.85 para crítico o dominado reciente;
- R < 0.75;
- lapso reciente;
- prerrequisito débil bloquea recomendación;
- T/S/I insuficiente en Mastery candidate;
- alta incertidumbre C con evidencia antigua;
- recuperación de consolidación programada.

### 23.2 Prioridad

La prioridad combina, en orden de importancia:

1. Riesgo de olvido y cuánto está vencido.
2. Lapso reciente.
3. Criticidad en knowledge graph y dependientes próximos.
4. Debilidad de prerrequisito.
5. Confianza baja/contradicción de evidencia.
6. Oportunidad de transferencia.
7. Carga diaria y fatiga.

XP y racha no participan.

### 23.3 Composición de sesión

- Duración objetivo inicial: 5–15 minutos o carga configurada.
- 60–70% conceptos vencidos/Review required.
- 20–30% At risk/consolidación.
- 10–20% transferencia/interleaving de conceptos fuertes relacionados.
- No más de dos ítems consecutivos del mismo concepto salvo remediación.
- Alternar demandas cognitivas y dificultad.
- Evitar la misma familia de ejercicio en ventanas recientes.

Los porcentajes son rangos; una sesión con pocos conceptos puede desviarse con razón registrada.

### 23.4 Evitar sobrepráctica

El motor limita recuperaciones del mismo concepto por sesión, aplica rendimiento decreciente y cierra cuando obtiene evidencia suficiente. Un éxito temprano no obliga a completar ejercicios redundantes. Un fallo no desencadena una cadena interminable: después de remediación se agenda una recuperación posterior.

### 23.5 Detección de olvido durante repaso

Un fallo se considera lapso cuando la oportunidad es independiente, el concepto estaba previamente dominado y el error es conceptual/representacional. Si se sospecha prerrequisito o distracción se discrimina antes. Un lapso reduce estabilidad y cambia prioridad.

### 23.6 Detección de recuperación

Recovered requiere:

- resolver una variante después del lapso;
- sin solución revelada; idealmente sin pistas;
- explicación/calidad suficiente;
- segunda evidencia independiente posterior para restaurar alta estabilidad.

## 24. Uso pedagógico del Knowledge Graph

### 24.1 Funciones

- validar prerrequisitos de contenido;
- generar conexión con el subnivel anterior;
- diagnosticar causas raíz;
- seleccionar ejercicios puente;
- medir transferencia composicional;
- intercalar conceptos confundibles;
- priorizar nodos críticos;
- explicar por qué se recomienda un repaso.

### 24.2 Diagnóstico A/B

Si falla A, el motor no concluye que falla B. Sigue esta lógica de evidencia:

> Fallo observado en A → clasificar patrón → consultar prerrequisitos críticos de A → comparar estados B/C → formular hipótesis → presentar ítem discriminativo → actualizar solo el concepto evaluado → seleccionar intervención

Ejemplo: un error en Condicionales sugiere Operadores si el patrón usa comparación incorrecta y Operadores tiene retención baja. Un ítem breve de Operadores confirma o rechaza la hipótesis. Sin ese ítem, no se reduce Operadores.

### 24.3 Profundidad y propagación

El diagnóstico automático se limita inicialmente a dos saltos de prerequisite/BuildsOn. Profundidades mayores aumentan hipótesis espurias. La criticidad de arista modula prioridad, no evidencia. Related no participa en causa raíz; OftenConfusedWith genera contrastes; Applies identifica oportunidades de transferencia.

### 24.4 Explicabilidad

El usuario recibe lenguaje simple: “Este ejercicio usa Operadores, cuya retención está baja; te proponemos una comprobación breve”. No se expone el grafo crudo ni una causalidad no confirmada.

## 25. Metacognición y autorregulación

### 25.1 Momentos de reflexión

- Antes de un quiz: predecir resultado por conceptos, ocasionalmente.
- Después de responder: indicar seguridad solo en muestras, no en cada ítem.
- Después de feedback: identificar la regla que cambió su razonamiento.
- Al cerrar sesión: elegir una brecha principal y siguiente acción.

### 25.2 Evitar carga metacognitiva excesiva

Preguntar continuamente interrumpe práctica y produce respuestas mecánicas. La tasa inicial no excede una intervención breve cada 5–10 ejercicios, salvo estudio específico de calibración. El motor adapta frecuencia a utilidad observada.

### 25.3 Feedback de calibración

- Sobreconfianza: mostrar discrepancia y recomendar verificación/explicación.
- Infraconfianza: mostrar consistencia de aciertos y proponer reto independiente.
- Buena calibración: confirmar que su juicio predice desempeño.

No se atribuyen rasgos (“eres inseguro”); se habla de datos del periodo y concepto.

## 26. Experiencia emocional y cognitiva

### 26.1 Sensación buscada

Estudiar debe sentirse exigente pero justo, continuo, comprensible y recuperable. El usuario debe saber qué intenta aprender, por qué falló, qué hacer después y por qué el sistema recomienda una acción.

### 26.2 Reglas contra frustración

- Nunca más de dos fallos equivalentes sin cambiar ayuda o diagnóstico.
- No revelar solución durante intento activo.
- No obligar a repetir los 30 por un fallo de quiz.
- Permitir pausa y reanudación sin penalización.
- Distinguir error técnico de error de aprendizaje.
- Mostrar progreso de evidencia sin llamarlo dominio prematuramente.
- Celebrar recuperación y estrategia, no velocidad innata.

### 26.3 Reglas contra aburrimiento

- Retirar scaffolding cuando deja de ser necesario.
- Saltar repetición redundante dentro de repasos, no dentro del set contractual de 30.
- Variar contexto y tipo.
- Introducir transferencia/interleaving con prerrequisitos listos.
- No usar opción múltiple para llenar cupo.

### 26.4 Carga cognitiva

Se estima mediante errores, pistas, latencia personal, abandonos, cambio de estrategia y complejidad del ítem. Es una señal contextual con confianza, no diagnóstico psicológico. Se distingue carga intrínseca necesaria de carga extrínseca causada por enunciado/interfaz. Solo la segunda debe eliminarse sistemáticamente.

## 27. Separación entre IA y motor pedagógico

### 27.1 IA puede generar

- teoría y versiones remediales;
- ejemplos;
- ejercicios y variantes;
- pistas candidatas;
- quizzes candidatos;
- resúmenes;
- explicaciones.

### 27.2 IA no puede decidir

- corrección determinista;
- clasificación final de error;
- dominio, retención o transferencia;
- peso de evidencia;
- selección de repaso;
- desbloqueo;
- XP, racha o logros;
- dificultad individual;
- publicación;
- causalidad del knowledge graph.

### 27.3 Uso de contenido generado

Todo candidato se valida, versiona, compara y revisa según los documentos padres. El motor solo consume contenido publicado. Una pista generada debe cumplir el contrato de no revelar solución. Una explicación generada nunca reinterpreta el resultado evaluado por el backend.

### 27.4 Adaptación sin generación en tiempo real

La adaptación primaria selecciona entre contenido ya generado y persistido. Gemini no está en el camino crítico. Si falta una variante, se agenda generación editorial fuera de la sesión; el usuario recibe otra actividad válida.

## 28. Métricas del motor

### 28.1 Métricas por concepto y usuario

| Métrica | Definición | Uso | Protección contra mal uso |
|---|---|---|---|
| K | Probabilidad de conocimiento actual | Dominio | No mostrar como certeza absoluta |
| R | Retención prevista a fecha/horizonte | Repaso | Siempre incluir `asOf` |
| T | Éxito transferencial ponderado | Detectar rigidez | Requiere oportunidades mínimas |
| C | Confianza del estimador | Saber cuánto creer el score | No confundir con autoconfianza |
| S | Consistencia entre recuperaciones | Estabilidad de desempeño | No penalizar una anomalía |
| I | Independencia de pistas | Retirada de scaffolding | Ayuda no es fracaso |
| Q | Calidad/robustez | Práctica deliberada | Rúbrica disciplinar |
| V | Cobertura de evidencia | Puerta de dominio | No premiar volumen redundante |
| F | Fluidez contextual | Automatización apropiada | No penaliza lentitud correcta |
| M | Calibración metacognitiva | Autorregulación | Autojuicio no cambia K |
| Lapse rate | Lapsos por intervalo/estabilidad | Calibrar olvido | Contextualizar por dificultad |
| Hint trajectory | Nivel/frecuencia a través del tiempo | Medir independencia | No castigar pedir ayuda |
| Learning slope | Cambio de K por oportunidades efectivas | Detectar necesidad de intervención | No etiquetar capacidad fija |

### 28.2 Métricas de sesión

- tiempo activo y distribución, no pestaña abierta;
- oportunidades de recuperación;
- tasa de primer intento y total separadas;
- distribución de errores;
- pistas por nivel;
- cambio de K/R/T/C;
- carga estimada;
- porcentaje de ítems en zona óptima;
- diversidad/interleaving;
- abandonos y recuperaciones;
- calidad de feedback entregado.

### 28.3 Métricas longitudinales

- retención a 7, 30 y 90 días;
- calibración entre predicción y desempeño;
- tiempo hasta dominio y hasta recuperación;
- duración del dominio antes de At risk;
- transferencia cercana/lejana;
- reducción de dependencia de pistas;
- curva de aprendizaje por oportunidades efectivas;
- tasa de falsos Mastered: fallos posteriores inesperados;
- tasa de falsos bloqueos: usuarios que transfieren pese a gate bajo;
- estabilidad de parámetros por disciplina/cohorte;
- equidad de error/calibración entre grupos, con privacidad.

### 28.4 Gamificación como métrica secundaria

XP y racha describen actividad consistente. No se incorporan al vector, retención, dificultad ni desbloqueo. Un usuario puede tener alta racha y bajo dominio o viceversa; la interfaz debe permitir entender esa diferencia.

## 29. Escalabilidad entre disciplinas

### 29.1 Núcleo universal

Permanecen iguales para cualquier disciplina:

- Concept y knowledge graph;
- EvidenceEvent;
- K/R/T/C/S/I/Q/V/F/M;
- recuperación, espaciamiento y transferencia;
- taxonomía de errores de alto nivel;
- pistas progresivas;
- puerta de dominio;
- agenda de repaso;
- explicabilidad y versionado.

### 29.2 Perfil disciplinar

Cada disciplina declara:

- tipos de respuesta y evaluadores válidos;
- definición de calidad;
- guess/slip por tipo;
- facetas de transferencia;
- escalas de dificultad;
- errores específicos;
- prerequisitos y relaciones;
- horizontes de retención;
- cuándo la velocidad importa;
- equivalentes de producción constructiva.

El perfil no puede rebajar invariantes universales ni delegar decisiones a IA.

### 29.3 Matemáticas

Evidencia: solución, derivación, demostración, estimación y representación. Q evalúa exactitud, validez de pasos, unidades y generalidad. Transferencia incluye cambiar representación o aplicar un principio en problema no rutinario.

### 29.4 Historia

Evidencia: recuperación de hechos, cronología, análisis de fuentes, causalidad y argumento con evidencia. Guess debe ser mayor en reconocimiento que en ensayo. Q valora precisión, soporte y consideración de perspectivas; no reduce todo a una respuesta única cuando hay rúbrica.

### 29.5 Física y química

Evidencia: predicción, modelo, unidades, procedimiento, interpretación y laboratorio. Errores de representación/unidad se distinguen de concepto. Transferencia exige seleccionar leyes en situaciones nuevas.

### 29.6 Idiomas

Evidencia: comprensión, producción, pronunciación, gramática, vocabulario y pragmática. Retención puede diferir por subhabilidad. Transferencia ocurre cuando una estructura se usa espontáneamente en contexto comunicativo nuevo.

### 29.7 Programación

Evidencia: ejecución, casos ocultos, razonamiento, robustez, depuración y diseño. La prioridad de escribir código permanece. Copiar una solución o pasar tests visibles sin generalización aumenta familiaridad, no T.

## 30. Calibración, validación y gobierno científico

### 30.1 Antes de activar una política

- simulación con historiales sintéticos y casos extremos;
- golden dataset pedagógico revisado;
- shadow mode con comparación contra política vigente;
- análisis de calibración: score previsto vs desempeño posterior;
- sensibilidad a pistas, tiempo, tipo y dificultad;
- revisión de falsos positivos de memorización/prerrequisito;
- revisión de equidad y accesibilidad;
- aprobación pedagógica y de arquitectura.

### 30.2 Criterios de calidad del modelo

- Calibración: un grupo estimado en 80% debe aproximarse a 80% en oportunidad equivalente.
- Discriminación: distinguir estados fuertes y débiles sin sobrerreaccionar.
- Estabilidad: pequeñas variaciones no producen saltos arbitrarios.
- Adaptabilidad: responde a lapsos y transferencia real.
- Explicabilidad: cada cambio tiene causa comprensible.
- Auditabilidad: datos y política permiten reproducirlo.
- Parsimonia: no añadir métricas que no mejoren decisión.

### 30.3 Cambios de política

Una nueva versión nunca reescribe evidencia. Recalcula proyecciones en sombra, compara y activa de manera explícita. Las métricas históricas declaran versión o se reconstruyen como una serie coherente. Si la mejora requiere cambiar un criterio contractual, se aprueba ADR y enmienda correspondiente.

## 31. Riesgos pedagógicos y mitigaciones

| Riesgo | Consecuencia | Mitigación |
|---|---|---|
| Score único oculta debilidades | Falso dominio | Vector y puerta multidimensional |
| Sobreajuste a ejercicio | Memorización | Fingerprints, variantes, transferencia y familiaridad |
| Propagar errores por grafo | Penalización falsa | Hipótesis + diagnóstico antes de evidencia |
| Penalizar lentitud | Sesgo y ansiedad | Tiempo contextual, nunca corrección |
| Pistas demasiado reveladoras | Evidencia inflada | Tres niveles contractuales y límites de peso |
| Interleaving demasiado temprano | Sobrecarga | Formación parcialmente bloqueada antes de mezclar |
| Repaso excesivo | Fatiga y abandono | Rendimiento decreciente y cierre por evidencia suficiente |
| Repaso demasiado tarde | Lapsos evitables | Agenda por R y criticidad |
| Feedback genérico | Sin corrección conceptual | Feedback dirigido a tarea/estrategia/concepto |
| Metacognición intrusiva | Interrupción | Muestreo ocasional y utilidad medida |
| IA toma decisiones | Opacidad e inconsistencia | IA genera; motor versionado decide |
| Umbrales universales rígidos | Mala calibración disciplinar | Núcleo común + perfiles calibrados |
| “Quiz sorpresa” genera ansiedad | Evitación | Bajo riesgo, breve, explicado y no punitivo |
| Puerta dura bloquea curiosidad | Frustración | Visible vs Recommended según ADR-LE-002 |

## 32. Criterios de aceptación del motor

El motor pedagógico es conforme cuando:

1. Solo evidencia evaluable modifica dominio.
2. Puede explicar por qué cambió cada dimensión.
3. Mantiene exactamente 30 ejercicios publicados y su progresión.
4. Toda respuesta correcta recibe explicación.
5. Todo fallo activo recibe pista sin solución directa.
6. Distingue adquisición incompleta de olvido.
7. Detecta transferencia solo con conducta verificable.
8. No reduce prerrequisitos por inferencia del grafo sin diagnóstico.
9. Limita evidencia familiar y prueba variantes ante riesgo de memorización.
10. Usa K, R, T, C, S, I, Q y V para Mastered.
11. No usa velocidad como castigo.
12. Agenda repaso por retención, estabilidad, lapso y criticidad.
13. Evita sobrepráctica y mezcla conceptos con intención.
14. Mantiene acceso flexible separado de recomendación.
15. IA no decide dominio, error, repaso ni desbloqueo.
16. Funciona mediante perfiles para disciplinas distintas.
17. XP y racha no afectan decisiones académicas.
18. Cada política es versionada, auditable y validada en sombra.

## 33. Referencias científicas de fundamento

- Roediger, H. L. y Karpicke, J. D. (2006). [Test-enhanced learning: Taking memory tests improves long-term retention](https://pubmed.ncbi.nlm.nih.gov/16507066/).
- Mawson, R. D. y Kang, S. H. K. (2025). [The Distributed Practice Effect on Classroom Learning: A Meta-Analytic Review](https://pubmed.ncbi.nlm.nih.gov/40564553/).
- Institute of Education Sciences. [Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/PracticeGuide/1).
- Kulik, C.-L. C. et al. (1990). [Effectiveness of Mastery Learning Programs: A Meta-Analysis](https://eric.ed.gov/?id=EJ415887).
- Wisniewski, B., Zierer, K. y Hattie, J. (2020). [The Power of Feedback Revisited](https://pubmed.ncbi.nlm.nih.gov/32038429/).
- Narciss, S. y Alemdag, E. (2025). [Learning from errors and failure in educational contexts](https://pubmed.ncbi.nlm.nih.gov/39317664/).
- Mera, Y., Rodríguez, G. y Marin-Garcia, E. (2022). [Unraveling the benefits of experiencing errors during learning](https://pubmed.ncbi.nlm.nih.gov/34820785/).
- Michalsky, T. y Bakrish, H. (2024). [Contribution of metacognitive questions to accuracy of judgment of learning](https://pubmed.ncbi.nlm.nih.gov/39559205/).
- Townsend, C. L. y Heit, E. (2011). [Judgments of learning and improvement](https://pubmed.ncbi.nlm.nih.gov/21264622/).

## 34. Posibles mejoras futuras

Estas propuestas no pertenecen a la versión inicial y no deben implementarse sin evidencia, evaluación ética y ADR. Son compatibles con la arquitectura de eventos, políticas versionadas y perfiles disciplinares.

### 34.1 Modelos de respuesta al ítem jerárquicos

Incorporar Item Response Theory o modelos bayesianos jerárquicos para calibrar conjuntamente dificultad, discriminación y habilidad, manteniendo el vector explicable. Serían útiles cuando exista volumen suficiente por ítem y disciplina.

### 34.2 Trazado de conocimiento dinámico

Comparar BKT con Deep Knowledge Tracing u otros modelos secuenciales en shadow mode. Solo se promoverían si mejoran calibración y transferencia sin perder explicabilidad, equidad ni operación razonable.

### 34.3 Pruebas adaptativas con información máxima

Seleccionar preguntas diagnósticas por ganancia esperada de información, reduciendo longitud sin perder confianza. No sustituiría los 30 ejercicios contractuales; operaría en diagnósticos y repasos.

### 34.4 Modelado causal de prerrequisitos

Usar experimentos y datos longitudinales para distinguir correlación de causalidad en el knowledge graph. Las aristas podrían adquirir confianza empírica sin permitir que una inferencia cambie dominio por sí sola.

### 34.5 Generación automática de contrastes mínimos

Crear pares de problemas que difieran en una sola condición conceptual para diagnosticar errores de selección. Todo contenido seguiría pasando validación, persistencia y revisión.

### 34.6 Adaptación a estados de fatiga con privacidad

Investigar señales conductuales mínimas y no biométricas para ajustar duración y pausa. No se usarían cámara, emoción inferida invasiva ni datos sensibles sin necesidad, consentimiento y revisión ética.

### 34.7 Tutor socrático controlado

Un modo conversacional podría formular preguntas dentro de un árbol pedagógico aprobado. El motor conservaría autoridad; la IA no decidiría dominio ni inventaría reglas durante la sesión.

### 34.8 Práctica colaborativa

Incorporar explicación entre pares y resolución conjunta con evidencia individual separada. Requeriría controles para que colaboración no se confunda con dominio personal.

### 34.9 Certificación basada en estabilidad

Una certificación futura podría exigir desempeño transferencial y retención después de un intervalo, no una prueba única. Permanecería separada de logros y gamificación.

### 34.10 Personalización de representaciones

Detectar qué representaciones ayudan a reparar un error —gráfica, verbal, simbólica, concreta— sin etiquetar al usuario con “estilos de aprendizaje” fijos. La personalización se basaría en rendimiento observable y reversible.

### 34.11 Optimización multiobjetivo

Investigar políticas que equilibren retención, transferencia, esfuerzo, carga y tiempo disponible en vez de maximizar un único score. Toda política tendría límites pedagógicos y evaluación en sombra.

### 34.12 Privacidad diferencial para analítica educativa

Agregar mecanismos de privacidad diferencial en estadísticas agregadas y calibración de contenido a gran escala, preservando utilidad sin exponer trayectorias individuales.

---

**Mandato final:** el motor debe preferir evidencia nueva, diversa, independiente y espaciada sobre actividad, repetición o velocidad. Una recomendación pedagógica solo es válida si puede explicar qué sabe el usuario, qué podría olvidar, dónde transfiere, qué incertidumbre existe y cuál es la siguiente experiencia mínima que mejora conocimiento duradero.

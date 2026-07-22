# ADR-EX-001 — Definiciones de ejercicios como bounded context independiente

- Estado: Aceptado
- Fecha: 2026-07-21
- Contexto: Exercises Domain

## Contexto

`SYSTEM_ARCHITECTURE.md` agrupó inicialmente teoría, ejemplos, ejercicios y quizzes bajo el ownership de Content. Los sprints posteriores separaron dos responsabilidades que evolucionan por razones distintas: Content modela cómo se presenta una Lesson, mientras Exercises modela cómo se demuestra el aprendizaje mediante una colección publicable con reglas estructurales propias.

Mantener `ExerciseSet`, `Exercise`, pistas, soluciones, casos de prueba y políticas de composición dentro de Content obligaría a que cambios en evaluación y modalidades de práctica afectasen al agregado editorial de teoría. También debilitaría la frontera ya establecida: Content solo referencia `LessonId` y no contiene Curriculum.

## Decisión

Las definiciones publicables de ejercicios pertenecen al bounded context Exercises. Su agregado `ExerciseSet` referencia únicamente `LessonId` y es responsable de:

- construcción de un borrador de hasta 30 posiciones consecutivas;
- unicidad de ejercicios, pistas y solución;
- progresión no decreciente de dificultad;
- límite de opción múltiple y predominio de Coding;
- validación atómica de exactamente 30 ejercicios completos al publicar.

Content y Exercises no se importan entre sí. Ambos se vinculan semánticamente mediante `LessonId`, cuya identidad pertenece a Curriculum. Una futura publicación curricular podrá comprobar compatibilidad mediante puertos de aplicación o snapshots, nunca entregando agregados mutables entre contextos.

Practice será dueño de sesiones, intentos y consumo de pistas. Evaluation será dueño de interpretar respuestas y ejecutar reglas o código aislado. Exercises no adquiere esas responsabilidades.

AI Pipeline continuará generando candidatos sin autoridad de publicación. Su futura integración entregará comandos estructurados a la capa de aplicación de Exercises a través de un adaptador; el dominio no dependerá de AI Pipeline ni de un proveedor LLM.

## Consecuencias

- Las invariantes de composición de 30 ejercicios quedan cohesionadas en un único agregado.
- Content permanece estable y no necesita incorporar comportamiento de práctica o evaluación.
- Practice, Evaluation y AI Pipeline podrán consumir contratos públicos sin acoplarse a internals.
- La matriz de ownership de `SYSTEM_ARCHITECTURE.md` deberá reflejar esta extracción en su próxima revisión documental.
- La unicidad de un `ExerciseSet` por `LessonId` deberá reforzarse también en persistencia cuando exista un adaptador real.

## Alternativas descartadas

### Mantener ejercicios dentro de LessonContent

Mezclaría contenido expositivo con artefactos evaluables, ampliaría el agregado y aumentaría su frecuencia de cambio. También obligaría a modificar un módulo declarado estable.

### Crear Exercises como submódulo interno de Content

Reduciría visibilidad del límite, mantendría ownership ambiguo y facilitaría imports directos entre agregados.

### Mover definiciones a Practice

Confundiría el contenido canónico publicable con la actividad individual. Practice debe registrar selección, intentos y feedback, no editar la fuente de los ejercicios.

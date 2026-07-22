# ADR-CU-001 — Topic como agregado de autoría curricular en borrador

- Estado: Aceptado
- Fecha: 2026-07-21
- Contexto: Curriculum, Sprint 3.1

## Contexto

Las especificaciones distinguen la jerarquía editorial, el concepto semántico estable y los artefactos pedagógicos versionados. `DATABASE_DESIGN.md` reserva a Content la teoría y el contenido publicado, y exige que una publicación futura congele versiones compatibles. El alcance del Sprint 3.1 solicita, a su vez, una jerarquía navegable `Topic → Level → Sublevel → Lesson → Concept` y comandos incrementales para construirla.

Los comandos incrementales producen necesariamente estados intermedios donde un Level todavía no tiene Sublevels, un Sublevel todavía no tiene Lessons o una Lesson todavía no tiene Concepts. Rechazar esos estados impediría ejecutar los propios comandos definidos para el sprint.

## Decisión

`Topic` será el Aggregate Root de una estructura de autoría curricular en estado `draft`. Durante el borrador puede estar incompleta; antes de adquirir un estado activo debe superar una validación estructural que exige:

- al menos un Level;
- al menos un Sublevel por Level;
- al menos una Lesson por Sublevel;
- al menos un Concept por Lesson;
- órdenes positivos, únicos y contiguos dentro de cada padre.

`Lesson` representa únicamente el shell curricular: identidad, título, orden y conceptos que cubre. No contiene teoría, ejemplos, ejercicios, quizzes ni contenido generado. Esos artefactos seguirán perteneciendo a Content.

`Concept` conserva un `ConceptId` estable y no contiene contenido pedagógico mutable. Esta identidad será la unión futura con Knowledge Graph, versiones conceptuales y asociaciones N:M, sin introducirlas prematuramente en este sprint.

Las mutaciones atraviesan exclusivamente `Topic`. Las entidades descendientes son inmutables y devuelven nuevas versiones estructurales al agregar hijos, evitando que una referencia externa pueda eludir las invariantes del Aggregate Root.

## Consecuencias

- Los casos de uso incrementales son posibles sin declarar completa una estructura incompleta.
- La integridad exigida para activación queda explícita y comprobable desde ahora.
- Curriculum no adquiere teoría ni responsabilidades de Content.
- Los identificadores quedan preparados para Knowledge Graph y persistencia futura.
- TopicVersion, ConceptVersion y CurriculumPublication siguen diferidos hasta el sprint de versionado/publicación; deberán envolver o referenciar esta estructura sin mutar publicaciones históricas.

## Alternativas descartadas

### Exigir un hijo inicial en cada comando

Haría que `AddLevel` tuviera que crear simultáneamente Sublevel, Lesson y Concept. Mezclaría cuatro intenciones, complicaría errores y volvería redundantes los demás casos de uso.

### Permitir estructuras incompletas en cualquier estado

Debilitaría las cardinalidades pedagógicas y permitiría activar un currículo inválido.

### Mover teoría y contenido completo dentro de Lesson

Contradiría el ownership definido para Content y acoplaría Curriculum con IA, ejercicios y publicación.

### Implementar todo el modelo de versiones ahora

Excedería el alcance, introduciría reglas de publicación todavía no solicitadas y aumentaría el coste sin una necesidad funcional del Sprint 3.1.

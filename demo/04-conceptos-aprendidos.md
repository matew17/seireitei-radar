# Conceptos y plan de demo — Charla SDD con IA

Dos partes: el glosario en tabla de todo lo cubierto, y el plan de las tres
features (hoy / video / en vivo) con sus prompts listos para correr.

---

## Parte 1 — Tabla de conceptos

| Concepto                                   | Qué es                                                          | Dónde aparece en la herramienta                   |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| **Context engineering**                    | Decidir qué entra al contexto, cuándo y en qué forma            | El paraguas de todo el ejercicio                  |
| **Progressive disclosure**                 | Carga en niveles: metadata → cuerpo → referencias               | Agentes cortos + constitution + spec bajo demanda |
| **Resident vs deferred tokens**            | Lo que está siempre en contexto vs lo que se carga bajo demanda | `CLAUDE.md` (residente) vs `spec.md` (diferido)   |
| **Context rot**                            | Degradación por contexto lleno de ruido                         | El problema que resuelve progressive disclosure   |
| **Context bloat**                          | Instrucciones que crecen sin que nadie verifique si aportan     | El punto de partida del ejercicio                 |
| **Single source of truth**                 | Una regla se define en un solo lugar                            | `constitution.md`                                 |
| **Ownership boundaries**                   | Qué capa es dueña de qué tipo de regla                          | Orquestación / agente / comando / CLAUDE.md       |
| **Determinism boundary**                   | Verificable → código. Requiere criterio → prompt                | Hooks vs agentes                                  |
| **Degrees of freedom**                     | Libertad del agente, calibrada a propósito                      | Modos `assisted` / `semi` / `auto`                |
| **Validator loop**                         | Generar → validar → corregir → repetir                          | `quality-gate.sh` con exit 2                      |
| **Eval-driven development**                | Construir las evals antes que las instrucciones                 | Telemetría + baseline comparativo                 |
| **Ablation testing**                       | Quitar una sección y medir si la calidad baja                   | Cómo decidir qué instrucción sobra                |
| **Golden output**                          | El resultado de referencia contra el que comparas               | Sin él, "quedó mejor" es opinión                  |
| **Deterministic gates vs judgment agents** | Lo barato y mecánico primero; el criterio después               | Gates → reviewer, en ese orden                    |
| **Spec-driven development**                | El spec es la fuente de verdad; el código es output             | Todo el flujo                                     |
| **Spec Kit**                               | CLI de GitHub que instala la estructura SDD en el repo          | `specify init`                                    |
| **Constitution**                           | Principios no negociables que todo comando consulta             | `.specify/memory/constitution.md`                 |
| **Clarify**                                | Detectar ambigüedad y preguntar en vez de asumir                | BR-04 plantada                                    |
| **Traceability**                           | Cadena regla → spec → task → test → commit → PR                 | IDs `BR-xx`                                       |
| **Blast radius limiting**                  | Techo a cuánto puede afectar un fallo                           | `maxFilesPerTask`, `maxReviewRetries`             |
| **Escalation path**                        | Qué pasa cuando el flujo se atasca                              | `.sdd/blocked.md`                                 |
| **Defense in depth**                       | La misma regla en capas independientes                          | Hook local + branch protection remota             |
| **Human gate**                             | Punto donde el criterio humano es obligatorio                   | Aprobación de spec + merge                        |
| **Hook**                                   | Comando shell en un punto fijo del ciclo de vida                | `.claude/hooks/`                                  |
| **PreToolUse deny**                        | Bloqueo que sobrevive a `bypassPermissions`                     | `git-guard.sh`                                    |
| **Exit code 2**                            | Señal de bloqueo; stderr vuelve al modelo como razón            | Todos los gates                                   |
| **Permission rules**                       | `allow` / `deny` / `ask` en settings.json                       | Las `deny` también sobreviven a bypass            |
| **Slash command**                          | Markdown en `.claude/commands/`, invocado con `/nombre`         | `/sdd-new`, `/sdd-implement`                      |
| **SlashCommand tool**                      | Permite a Claude encadenar comandos programáticamente           | `/sdd-new` orquestando Spec Kit                   |
| **Subagente**                              | Loop aislado con su propio contexto y permisos                  | implementer / test-writer / reviewer              |
| **Independencia spec↔código**              | Quien escribe tests no lee la implementación                    | `test-writer.md`                                  |
| **Conventional Commits**                   | `tipo(scope): descripción`, parseable por máquina               | Commits del flujo                                 |
| **Commit atómico**                         | Un commit por unidad lógica de cambio                           | Uno por task                                      |

---

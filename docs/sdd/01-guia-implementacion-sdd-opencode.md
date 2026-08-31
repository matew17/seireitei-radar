# Guía de implementación — Herramienta SDD con opencode

18 pasos. Cada uno tiene: **qué**, **por qué**, **contenido completo**,
**verificación**, y **la práctica que demuestra** (útil para la charla).

Hazlos en orden. Cada paso se verifica solo, sin depender del siguiente.

> **Convención:** los archivos que consume opencode (agentes, comandos,
> constitution) van en **inglés** — menos tokens y es donde el modelo está
> mejor calibrado. La documentación para humanos va en español.

> **Placeholders:** esta guía es agnóstica del proyecto. Donde veas
> `<PROYECTO>`, `<DOMINIO>`, `<ENTIDAD>` o reglas `BR-xx` de ejemplo,
> reemplázalos por las decisiones de tu demo. El stack base sí es fijo:
> **NestJS + TypeScript + Prisma + PostgreSQL**.

---

## Mapa de equivalencias Claude Code → opencode

| Concepto Claude Code            | Equivalente opencode                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `CLAUDE.md`                     | `AGENTS.md` (opencode también lee `CLAUDE.md` como fallback)      |
| `.claude/settings.json`         | `opencode.json` (`$schema: https://opencode.ai/config.json`)      |
| `permissions` (allow/ask/deny)  | `permission` en `opencode.json` — con globs por comando bash      |
| Hooks (`PreToolUse`, etc.)      | Plugins TS en `.opencode/plugins/` (`tool.execute.before/after`)  |
| `.claude/agents/*.md`           | `.opencode/agents/*.md` (`mode: subagent`, `permission:`)         |
| `.claude/commands/*.md`         | `.opencode/commands/*.md` (template + `$ARGUMENTS`)               |
| SlashCommand tool (encadenar)   | No existe → "Read `.opencode/commands/x.md` and follow it"        |
| `Stop` hook (telemetría)        | Plugin con hook `event` escuchando `session.idle`                 |
| `SubagentStop` hook             | No hay evento nativo → el gate corre como paso del comando        |
| Spec Kit `--integration claude` | `specify init . --ai opencode`                                    |

**Diferencias honestas para la charla:**

1. **Los permisos nativos de opencode son más fuertes que los hooks de Claude
   para patrones estáticos.** `permission.bash` con `"git push *": "deny"` es
   config declarativa, no un script. Para chequeos *dinámicos* (¿en qué rama
   estoy? ¿hay migración nueva?) necesitas un plugin.
2. **Los hooks son TypeScript, no bash+JSON.** Un plugin lanza `throw new
   Error(...)` para bloquear — el error le llega al agente como razón.
3. **Multi-proveedor real.** `opencode auth login` conecta OpenCode Zen,
   OpenRouter, GitHub Copilot, ChatGPT Plus, Anthropic API o modelos locales.
   Además puedes asignar **un modelo distinto por agente** (uno barato para
   test-writer, uno potente para implementer). Esto resuelve directamente el
   problema del límite de suscripción.

---

## Índice

| #   | Paso                             | Práctica demostrada                     |
| --- | -------------------------------- | --------------------------------------- |
| 0   | Prerrequisitos y estructura      | —                                       |
| 1   | `AGENTS.md`                      | Ownership boundaries                    |
| 2   | Instalar Spec Kit                | Spec-driven development                 |
| 3   | Constitution                     | Single source of truth                  |
| 4   | Reglas de negocio con ID         | Traceability                            |
| 5   | `.sdd/config.json`               | Degrees of freedom                      |
| 6   | Permisos nativos + `git-guard`   | Determinism boundary · Defense in depth |
| 7   | Plugin `fast-check` + gate       | Validator loop                          |
| 8   | Plugin `prisma-guard`            | Deterministic gates                     |
| 9   | Plugin `telemetry`               | Eval-driven development                 |
| 10  | Agente `implementer`             | Blast radius limiting                   |
| 11  | Agente `test-writer`             | Independencia spec↔código               |
| 12  | Agente `reviewer`                | Judgment agents                         |
| 13  | Comando `/sdd-new`               | Orquestación de comandos                |
| 14  | Comando `/sdd-implement`         | Loop con escalada                       |
| 15  | Comando `/sdd-ship`              | Traceability end-to-end                 |
| 16  | Comando `/sdd-status`            | Observabilidad                          |
| 17  | Template de PR                   | Traceability                            |
| 18  | Branch protection                | Defense in depth                        |

---

## Paso 0 — Prerrequisitos y estructura

**Qué.** Preparar el terreno.

**Contenido.**

```bash
# Instala opencode
curl -fsSL https://opencode.ai/install | bash
opencode --version

# SI aca dice que opencode no se reconoce, trata de incluirlo en tu PATH
```bash
echo 'export PATH="/Users/<your-username>/.opencode/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

# Autentica al menos un proveedor (elige el tuyo)

opencode auth login

# Verifica

node -v        # 20+
gh auth status # autenticado
git branch --show-current

# Crea la estructura

mkdir -p .opencode/{agents,commands,plugins}
mkdir -p .sdd/runs
mkdir -p docs scripts .github

# jq es requisito de los scripts auxiliares

jq --version || echo "instala jq"

```

Fija el modelo por defecto en `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514"
}
```

> El formato es `proveedor/modelo`. Ajusta al proveedor que autenticaste.
> Puedes sobreescribir el modelo por agente (pasos 10-12) y por comando.

Agrega a `.gitignore`:

```
.sdd/runs/
.sdd/blocked.md
```

**Verificación.** `ls -la .opencode` muestra las tres carpetas. `opencode`
abre el TUI y responde un "hola" — prueba de que el proveedor funciona.

---

## Paso 1 — `AGENTS.md`

**Qué.** El contexto raíz que se carga en toda sesión.

**Por qué.** Es la capa más cara del sistema: está residente siempre. Va corto
y solo con lo que aplica a todo el repo. Nada específico de un agente o comando.

> opencode también lee `CLAUDE.md` como fallback, pero `AGENTS.md` es el
> estándar canónico — y lo entienden otras herramientas (Cursor, Copilot,
> Amp), así que tu charla queda herramienta-agnóstica desde el paso 1.

**Contenido** — `AGENTS.md` en la raíz:

```markdown
# <PROYECTO>

NestJS + Prisma + PostgreSQL. <DESCRIPCIÓN DEL DOMINIO EN UNA LÍNEA>.

## Commands

- `npm run build` · `npm run lint` · `npm test` · `npm run test:e2e`
- `npx prisma migrate dev --name <name>` · `npx prisma generate`

## Layout

- `src/<domain>/` — one NestJS module per bounded context
- `prisma/schema.prisma` — schema. Migrations in `prisma/migrations/`
- `specs/` — feature specs (Spec Kit)
- `docs/business-rules.md` — business rules, IDs BR-xx
- `.specify/memory/constitution.md` — non-negotiable principles

## Non-negotiables

Read `.specify/memory/constitution.md` before writing code.
Never push to main. Never use `--no-verify`.
```

**Verificación.** Menos de 30 líneas. Si crece, algo pertenece a otra capa.

**Práctica.** *Ownership boundaries* — reglas globales aquí, procedimiento en
comandos, criterio en agentes.

---

## Paso 2 — Instalar Spec Kit

**Qué.** Bootstrap de la estructura SDD dentro del repo.

**Por qué.** Es un instalador, no una dependencia. Escribe archivos en tu
proyecto y después no lo necesitas. Spec Kit es agnóstico del agente —
soporta opencode como integración oficial.

**Contenido.**

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --integration opencode
```

> Si tu versión no lista `opencode`, corre `specify init --help` para ver las
> integraciones disponibles y actualiza: `uvx --from
> git+https://github.com/github/spec-kit.git specify --version`.

Deja:

- `.specify/` — templates, scripts, `memory/constitution.md`
- `.opencode/commands/speckit.*.md` — los slash commands

```bash
git add .specify .opencode
git commit -m "chore: bootstrap spec kit"
```

**Verificación.** Abre opencode, escribe `/` y confirma que aparecen
`speckit.specify`, `speckit.plan`, `speckit.tasks`, `speckit.analyze`,
`speckit.clarify`, `speckit.implement`.

**Práctica.** *Spec-driven development.*

---

## Paso 3 — Constitution

**Qué.** Los principios no negociables del proyecto.

**Por qué.** Es el artefacto de mayor apalancamiento del sistema. Todo comando
de Spec Kit lo consulta, y tus agentes también. Una regla escrita aquí una vez
se aplica en todo el pipeline — eso es lo que hace que el output sea estable
sin repetir instrucciones en cada prompt.

**Contenido** — reemplaza `.specify/memory/constitution.md`. Esta versión es
agnóstica del dominio: los principios de arquitectura, datos, testing y git
aplican a cualquier backend NestJS; solo ajusta lo que tu demo necesite:

```markdown
# <PROYECTO> — Constitution

Non-negotiable. Any violation blocks the work.

## I. Architecture

- One NestJS module per bounded context.
- Controllers: input validation and HTTP mapping only. No business logic.
- Services: business rules. Repositories: Prisma access.
- All input validated with DTO + class-validator.
- No `any` in public signatures.

## II. Data

- Every `schema.prisma` change requires a versioned migration in the same commit.
- Never edit an applied migration. Never `prisma db push` outside local dev.
- Business invariants expressible as a Postgres constraint MUST live in the
  database, not only in the service. Concurrency-sensitive rules (overlap,
  uniqueness, capacity) always fall in this category.

## III. Testing

- Every rule BR-xx has at least one test naming its ID.
- Rules involving concurrency or exclusivity are tested against a real
  Postgres instance, never a mocked Prisma client.
- Coverage is not the metric. Rule-to-test traceability is.
- A test that passes when its rule is broken is a defect.

## IV. Errors

- Domain exceptions mapped to HTTP in a global filter.
- Never expose Prisma error messages to clients.

## V. Git

- Conventional Commits. One commit per task.
- Branch `feat/<spec-id>-<slug>`.
- Direct push to main is forbidden. `--no-verify` is forbidden.
- Merge is always human.

## VI. Scope

- An agent implements the current task and nothing else.
- Out-of-scope improvements are reported, never applied.
```

**Verificación.** Cada principio es verificable — un revisor puede decidir
sí/no. Si alguno no lo es, reescríbelo o bórralo.

**Práctica.** *Single source of truth.*

---

## Paso 4 — Reglas de negocio con ID

**Qué.** El catálogo de reglas de tu dominio, cada una con ID estable.

**Por qué.** El ID es lo que permite la trazabilidad: viaja del spec al task,
al nombre del test, al commit y al PR. Sin ID, "¿está implementada la regla X?"
se responde leyendo código. Con ID, con un `grep`.

**Contenido** — `docs/business-rules.md`. Plantilla con ejemplos de los tres
tipos de regla que toda demo SDD debería tener — reemplázalos por los de tu
dominio, pero **conserva un ejemplo de cada tipo**:

```markdown
# Business Rules — <PROYECTO>

Stable IDs. Never renumber. Deprecate instead.

| ID    | Rule                                                            | Enforced at                      |
| ----- | --------------------------------------------------------------- | -------------------------------- |
| BR-01 | <invariante de concurrencia — ej: no double-booking, no oversell> | DB constraint + integration test |
| BR-02 | <regla de formato/rango — ej: duración, límites de entrada>       | DTO + unit test                  |
| BR-03 | <regla de estado — ej: cancelación, transición inválida>          | Service + unit test              |

## Open questions

- BR-03: <deja UNA regla deliberadamente ambigua para la demo>
```

> **Deja una regla abierta a propósito.** En la demo, `/speckit.clarify` la va
> a detectar y preguntar. Es la mejor prueba de que el error se atrapa en
> markdown y no en producción.

**Consejo de diseño para la demo:** elige un dominio con al menos un
invariante de concurrencia real (cupo, unicidad, traslape). Es lo que justifica
el principio II de la constitution y permite mostrar el prisma-guard + un test
de integración contra Postgres real — la cadena de trazabilidad más completa.

**Verificación.** Cada regla declara *dónde* se hace cumplir. Si alguna dice
"en el service" pero involucra concurrencia, está mal clasificada — revísala
contra el principio II de la constitution.

**Práctica.** *Traceability.*

---

## Paso 5 — Configuración

**Qué.** Los niveles de autonomía y los límites.

**Por qué.** "Auto mode" no es un booleano. Los dos gates humanos son fijos en
todos los modos; lo demás se calibra.

**Contenido** — `.sdd/config.json`:

```json
{
  "mode": "semi",
  "modes": {
    "assisted": "Confirms before each task. For live demos.",
    "semi": "Autonomous until PR. Stops at spec gate and at PR.",
    "auto": "Autonomous from tasks.md to PR. Never merges."
  },
  "limits": {
    "maxFilesPerTask": 10,
    "maxReviewRetries": 3,
    "maxTasksPerRun": 10,
    "stopOnFirstFailure": true
  },
  "gates": {
    "specApproval": "always_human",
    "merge": "always_human"
  },
  "branchPrefix": "feat/"
}
```

**Verificación.** `jq . .sdd/config.json` parsea sin error.

**Práctica.** *Degrees of freedom* — libertad calibrada explícitamente, no
implícita.

> **Nota opencode:** además de esto, opencode tiene `--auto` (auto-aprueba lo
> que no esté denegado explícitamente). No lo uses para la demo — tus gates
> humanos viven en este config y en los comandos, no en un flag global.

---

## Paso 6 — Permisos nativos + plugin `git-guard`

**Qué.** El bloqueo duro de operaciones peligrosas de git, en dos capas.

**Por qué.** En opencode la primera capa es **declarativa**: la sección
`permission` de `opencode.json` deniega patrones de comando sin escribir una
línea de código, y no hay flag del agente que la salte. La segunda capa es un
**plugin** para los chequeos dinámicos que un glob no puede expresar (¿estoy
parado en main? ¿hay una migración nueva?).

**Capa 1 — permisos nativos** en `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "allow",
      "git push * main*": "deny",
      "git push * master*": "deny",
      "git push * --force*": "deny",
      "* --no-verify *": "deny",
      "git reset --hard *": "deny",
      "gh pr merge *": "deny"
    }
  }
}
```

> Los patrones son globs sobre el comando parseado, y **la última regla que
> coincide gana** — por eso el `*` permisivo va primero y los `deny` al final.

**Capa 2 — plugin para chequeos dinámicos** — `.opencode/plugins/git-guard.ts`:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const BLOCKED = [
  { re: /\bDROP\s+TABLE/i, why: "Destructive database operation blocked." },
  { re: /\bTRUNCATE\b/i, why: "Destructive database operation blocked." },
  { re: /prisma\s+migrate\s+reset/, why: "Destructive database operation blocked." },
]

export const GitGuard: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const cmd: string = output.args.command ?? ""

      for (const { re, why } of BLOCKED) {
        if (re.test(cmd)) throw new Error(why)
      }

      // Push estando parado en main — chequeo dinámico, imposible con un glob
      if (/\bgit\s+push\b/.test(cmd)) {
        const branch =
          (await $`git rev-parse --abbrev-ref HEAD`.text()).trim()
        if (branch === "main" || branch === "master") {
          throw new Error(
            `Current branch is ${branch}. Create a feature branch before pushing.`
          )
        }
      }
    },
  }
}
```

> **Nota de diseño:** en opencode, bloquear = `throw new Error("razón")`. La
> razón le llega al agente como resultado de la herramienta — igual que el
> `permissionDecisionReason` de Claude, pero con un modelo mental más simple:
> un plugin solo puede **restringir**, nunca ampliar. Nadie se lo salta.

**Verificación** — pruébalo sin gastar un token:

```bash
# La capa nativa: abre opencode y pídele `git push origin main` → deny
# instantáneo, sin ejecutar nada.

# La capa dinámica: párate en main y pídele `git push` (sin argumentos).
# El plugin debe bloquearlo con el nombre de la rama en el mensaje.
```

**Práctica.** *Determinism boundary* — esto no puede ser una instrucción en un
prompt porque un prompt se puede ignorar; un permiso nativo o un plugin, no.
Y en opencode tienes el bonus pedagógico: la mitad de la regla es una línea de
JSON.

---

## Paso 7 — Plugin `fast-check` + script `quality-gate`

**Qué.** Lint automático en cada edición, y la suite completa entre tareas.

**Por qué.** Dos niveles de velocidad. El chequeo rápido corre en cada edición;
el caro corre cuando un subagente termina. Si corres la suite completa en cada
`edit`, el flujo se vuelve inusable.

**Contenido** — `.opencode/plugins/fast-check.ts`:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const FastCheck: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return
      const file: string = output.args.filePath ?? ""
      if (!file.endsWith(".ts")) return
      await $`npx eslint --fix ${file}`.quiet().nothrow()
    },
  }
}
```

**Gate completo** — `scripts/quality-gate.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail

FAILED=""

npx tsc --noEmit 2>&1 | tail -20 > /tmp/tsc.log || FAILED="$FAILED typecheck"
npm run lint --silent > /tmp/lint.log 2>&1      || FAILED="$FAILED lint"
npm test --silent > /tmp/test.log 2>&1          || FAILED="$FAILED tests"
npm run build --silent > /tmp/build.log 2>&1    || FAILED="$FAILED build"

if [[ -n "$FAILED" ]]; then
  {
    echo "QUALITY GATE FAILED:$FAILED"
    echo "This is an automated gate, not a user denial. Fix the errors and retry."
    echo "--- output ---"
    for f in tsc lint test build; do
      [[ -s /tmp/$f.log ]] && { echo "[$f]"; tail -15 /tmp/$f.log; }
    done
  } >&2
  exit 2
fi
echo "QUALITY GATE PASSED"
exit 0
```

```bash
chmod +x scripts/quality-gate.sh
```

> **Diferencia honesta con Claude Code:** Claude tenía el hook `SubagentStop`
> que disparaba el gate automáticamente al terminar cada subagente. opencode
> no tiene ese evento, así que el gate se convierte en un **paso explícito del
> comando** `/sdd-implement` (paso 14): el orquestador corre
> `scripts/quality-gate.sh` después de cada subagente y, si falla, devuelve el
> output al implementer. Funcionalmente es el mismo validator loop; la
> mecánica se mueve del hook al comando — un buen ejemplo para la charla de
> cómo el mismo principio se implementa con primitivas distintas.

**Verificación.** Rompe el build a propósito (mete un `const x: number = "a"`)
y corre `scripts/quality-gate.sh; echo $?` → debe dar `2` y explicar qué
falló.

> El mensaje dice explícitamente "automated gate, not a user denial". Sin eso,
> el modelo a veces interpreta el bloqueo como una negativa del usuario y se
> detiene en vez de corregir.

**Práctica.** *Validator loop* — generar → validar → corregir → repetir.

---

## Paso 8 — Plugin `prisma-guard`

**Qué.** Impedir cambios de schema sin migración.

**Por qué.** Es el error silencioso más común: el agente edita
`schema.prisma`, el código compila, los tests con mock pasan, y descubres en
deploy que la base no tiene la columna.

**Contenido** — `.opencode/plugins/prisma-guard.ts`:

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const PrismaGuard: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return
      const file: string = output.args.filePath ?? ""
      if (!file.endsWith("schema.prisma")) return

      const schemaDiff =
        await $`git diff --quiet -- prisma/schema.prisma`.nothrow()
      if (schemaDiff.exitCode === 0) return

      const status = await $`git status --porcelain prisma/migrations`.text()
      const newMigrations = status
        .split("\n")
        .filter((l) => l.startsWith("??")).length

      if (newMigrations === 0) {
        throw new Error(
          "schema.prisma changed without a migration.\n" +
            "Run: npx prisma migrate dev --name <descriptive_name>\n" +
            "Constitution II: schema changes require a versioned migration " +
            "in the same commit."
        )
      }
    },
  }
}
```

> `throw` dentro de `tool.execute.after` reporta la operación como fallida —
> el agente ve el error y corrige antes de seguir. Es el equivalente del
> `exit 2` + stderr del hook de Claude.

**Verificación.** Edita `schema.prisma` sin migrar y pídele al agente cualquier
cambio adicional. El plugin debe bloquear con el mensaje de la constitution.

---

## Paso 9 — Plugin `telemetry`

**Qué.** Registro de eventos por sesión y por feature.

**Por qué.** Para la charla necesitas números, no anécdotas. Y para ti, es la
única forma de saber si el flujo vale lo que cuesta.

**Contenido** — `.opencode/plugins/telemetry.ts`:

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { appendFileSync, mkdirSync, readFileSync } from "node:fs"

export const Telemetry: Plugin = async ({ directory }) => {
  return {
    event: async ({ event }) => {
      // session.idle ≈ el hook Stop de Claude Code
      if (event.type !== "session.idle") return

      let spec = "none"
      try {
        spec = readFileSync(`${directory}/.sdd/current-spec`, "utf-8").trim()
      } catch {}

      const runsDir = `${directory}/.sdd/runs`
      mkdirSync(runsDir, { recursive: true })

      const day = new Date().toISOString().slice(0, 10)
      appendFileSync(
        `${runsDir}/${day}.jsonl`,
        JSON.stringify({
          ts: new Date().toISOString(),
          spec,
          event: event.type,
        }) + "\n"
      )
    },
  }
}
```

> opencode además expone `opencode stats` y el evento `message.updated` con
> uso de tokens por mensaje — si quieres costo por feature más fino, escucha
> `message.updated` y agrega `event.properties.info.tokens`. Para la demo,
> `session.idle` basta.

**Verificación.** Después de una sesión, `.sdd/runs/<fecha>.jsonl` tiene
líneas.

**Práctica.** *Eval-driven development* — no puedes mejorar lo que no mides.

---

## Paso 10 — Agente `implementer`

**Qué.** El subagente que escribe código de producción.

**Por qué.** Va en su propio contexto para que el ruido de la implementación no
contamine al reviewer. Y va **corto** — el detalle vive en la constitution y
el spec, que ya están en contexto.

**Contenido** — `.opencode/agents/implementer.md`:

```markdown
---
description: Implements exactly one task from tasks.md. Use after a task is selected and before tests are written.
mode: subagent
permission:
  edit: allow
  bash:
    "*": allow
    "git push *": deny
    "gh pr *": deny
---

Implement exactly one task.

## Inputs

- The task ID given to you
- `specs/<spec-id>/spec.md` and `tasks.md`
- `.specify/memory/constitution.md`
- `docs/business-rules.md`

## Rules

- Implement the given task and nothing else. Report out-of-scope issues; never fix them.
- Follow the constitution. Concurrency invariants go in the database, not the service.
- Schema change means a migration in the same change.
- Do not write tests. Do not edit `spec.md` or `tasks.md`.
- If the task needs more than 10 files, stop and report it as badly scoped.

## Done when

The task is implemented and `npm run build` passes.

## Output

- Files changed
- Rules BR-xx addressed
- Anything out of scope you found and did not touch
```

> En opencode el control de herramientas es por `permission` (el campo `tools`
> está deprecado). Puedes además asignar `model:` por agente — un modelo más
> barato para `test-writer`, el potente para `implementer`.

**Verificación.** El archivo cabe en una pantalla. Si necesitas más, algo
pertenece a la constitution.

**Práctica.** *Blast radius limiting* + *progressive disclosure*.

---

## Paso 11 — Agente `test-writer`

**Qué.** El subagente que escribe tests.

**Por qué — y esto es lo más importante del diseño.** Escribe tests leyendo
**el spec, no el código**. Si lee la implementación, los tests confirman lo
que el código hace en vez de lo que el spec pide, y pierdes toda capacidad de
detectar que el implementer entendió mal. Vale una diapositiva entera.

**Contenido** — `.opencode/agents/test-writer.md`:

```markdown
---
description: Writes tests from the spec, without reading the implementation. Use after implementer finishes a task.
mode: subagent
permission:
  edit:
    "*": deny
    "**/*.spec.ts": allow
    "**/*.test.ts": allow
    "test/**": allow
---

Write tests for the given task from the specification.

## Critical rule

Do NOT read the implementation files for the task under test. Derive every
test from `spec.md` and `docs/business-rules.md` only. If a test fails, that
is a finding — report it, do not adjust the test to match the code.

## Naming

Every test naming a rule starts with its ID:
`it('BR-01: rejects an overlapping booking on the same resource')`

## Coverage

- One test minimum per BR-xx in scope, including the failure path.
- Rules involving overlap, concurrency or capacity: integration test against
  a real Postgres. A mocked Prisma client cannot detect a race condition.
- Every test must fail if its rule is removed. A test that passes either way
  is a defect, not coverage.

## Forbidden

- Editing production code (the permission layer enforces this too)
- Empty or trivial assertions
- Weakening an assertion to make a test pass

## Output

- Tests written, mapped to BR-xx
- Any test that fails, with the discrepancy against the spec
```

> **Bonus opencode:** la restricción "solo toca archivos de test" aquí no es
> solo una instrucción — el bloque `permission.edit` con globs la hace
> cumplir de forma determinista. Otra regla que migra de prompt a config.

**Verificación.** Rompe una regla en el código a propósito. El test
correspondiente debe fallar. Si pasa, el test no sirve.

---

## Paso 12 — Agente `reviewer`

**Qué.** La revisión de criterio, después de los gates deterministas.

**Por qué.** Los plugins y scripts ya verificaron lo verificable. El reviewer
solo mira lo que requiere juicio: si el diff hace lo que el spec pide, y nada
más. Corre después para no gastar tokens revisando código que no compila.

**Contenido** — `.opencode/agents/reviewer.md`:

```markdown
---
description: Reviews a diff against the spec and constitution. Use only after lint, typecheck, tests and build pass.
mode: subagent
permission:
  edit: deny
  bash:
    "*": deny
    "git diff *": allow
    "git log *": allow
    "git status *": allow
    "grep *": allow
---

Review the current diff. Read-only: never edit files.

## Check in this order

1. Does the diff implement the task and nothing beyond it?
2. Does every BR-xx in scope have a test naming its ID?
3. Would each test fail if its rule were removed? Flag empty or trivial assertions.
4. Any constitution violation? Quote the principle.
5. Business logic in a controller?
6. Concurrency invariant enforced only in the service instead of the database?

## Do not review

Formatting, naming style, or anything the linter already covers.

## Output

Verdict on the first line: `APPROVED` or `CHANGES_REQUESTED`

For each finding:

- `file:line`
- What is wrong
- Which rule or principle it violates
- What must change

No praise. No suggestions outside the task scope.
```

> Read-only **por construcción**: `edit: deny` + bash restringido a comandos
> de lectura. Si el modelo intenta editar, el permiso lo bloquea antes de
> ejecutar.

**Verificación.** Mete una violación obvia (lógica de negocio en un
controller) y confirma que la detecta citando el principio I.

**Práctica.** *Judgment agents vs deterministic gates.*

---

## Paso 13 — Comando `/sdd-new` (orquesta Spec Kit)

**Qué.** Un prompt en lenguaje natural dispara toda la fase de análisis.

**Por qué.** En Claude Code esto funcionaba con el SlashCommand tool, que
permitía invocar comandos programáticamente. opencode no tiene ese tool, así
que la orquestación usa el patrón **"read and follow"**: el comando lee el
archivo markdown del comando de Spec Kit y sigue sus instrucciones. Mismo
resultado, una indirección más.

**Contenido** — `.opencode/commands/sdd-new.md`:

```markdown
---
description: Run the full Spec Kit analysis phase for a new feature, from one sentence to an approved task list.
---

Run the analysis phase for: $ARGUMENTS

Execute these steps in order. Stop immediately if any step reports a blocking
problem — do not continue to the next.

1. Read `.specify/memory/constitution.md` and `docs/business-rules.md`.

2. Read `.opencode/commands/speckit.specify.md` and follow its instructions,
   passing the feature description enriched with the BR-xx rules that apply.
   Name every applicable rule ID explicitly.

3. Read `.opencode/commands/speckit.clarify.md` and follow its instructions.
   Surface its questions to the user and STOP. Do not answer them yourself.
   Ambiguity resolved by guessing is the failure mode this whole workflow
   exists to prevent. Resume only after the user answers.

4. Read `.opencode/commands/speckit.plan.md` and follow its instructions,
   with: NestJS, Prisma, PostgreSQL, module structure per the constitution.
   Any concurrency invariant must be planned as a database constraint.

5. Read `.opencode/commands/speckit.tasks.md` and follow its instructions.

6. Read `.opencode/commands/speckit.analyze.md` and follow its instructions.
   If it reports gaps or inconsistencies, report them and STOP.

7. Write the spec id to `.sdd/current-spec`.

8. Print a summary:
   - spec path
   - task count
   - BR-xx rules covered, and any rule in scope with no task
   - open questions

Then STOP. Spec approval is always human. Do not implement anything.
```

> Los comandos de opencode también soportan `$1`, `$2`... para argumentos
> posicionales, `` !`comando` `` para inyectar output de shell en el prompt, y
> `@archivo` para adjuntar archivos. Úsalos si tu orquestación los necesita.

**Uso.**

```
/sdd-new <descripción de la feature en lenguaje natural>
```

**Verificación.** Corre el comando. Debe detenerse en el paso 3 con las
preguntas de la regla ambigua que dejaste abierta en el paso 4, y no continuar
hasta que respondas.

**Práctica.** *Orquestación* + gate humano explícito.

---

## Paso 14 — Comando `/sdd-implement`

**Qué.** El loop de implementación task por task.

**Por qué.** Aquí vive la secuencia de agentes y la escalada. Sin límite de
reintentos tienes un loop que quema tokens hasta que lo notas.

**Contenido** — `.opencode/commands/sdd-implement.md`:

```markdown
---
description: Implement approved tasks one at a time with implementer, test-writer, quality gates and reviewer.
---

Implement tasks from the approved spec. Target: $ARGUMENTS (empty = next pending).

## Preconditions — verify before anything

- `.sdd/current-spec` exists
- `specs/<id>/tasks.md` exists
- Current branch is NOT main. If it is, create `feat/<spec-id>-<slug>` first.
- Read `.sdd/config.json` for limits

If any fails, stop and report.

## Per task

1. Delegate to the `implementer` subagent with the task id.
2. Delegate to the `test-writer` subagent with the same task id.
3. Run `bash scripts/quality-gate.sh`. If it fails, hand the errors back to
   `implementer` and retry. This is a gate, not a denial — keep working.
4. Delegate to the `reviewer` subagent.
   - `APPROVED` → continue
   - `CHANGES_REQUESTED` → back to step 1 with the findings
5. On the third `CHANGES_REQUESTED` for the same task: write `.sdd/blocked.md`
   with task id, attempt count, every finding, and the last diff. Then STOP.
6. Commit:

   <type>(<scope>): <what changed>

   Task: <task-id> · Spec: <spec-id>
   Rules: BR-xx, BR-yy
   Tests: <test file>

7. Mark the task done in `tasks.md`.

## Limits
- Stop after `maxTasksPerRun` tasks.
- In `assisted` mode, confirm with the user before each task.
- Never push. Never open a PR. That is `/sdd-ship`.

## Final output
Tasks completed, tasks remaining, anything blocked.
```

> **Invocar subagentes:** el orquestador los delega por nombre vía el Task
> tool — opencode los resuelve por su `description`. En el TUI también puedes
> invocarlos manualmente con `@implementer`, útil para depurar en vivo.

**Verificación.** Corre con una sola task. Debe hacer un commit atómico con el
BR-xx en el mensaje, y no hacer push.

**Práctica.** *Escalation path* — un flujo semi-autónomo sin ruta de
recuperación no es semi-autónomo, es un flujo que te deja tirado.

---

## Paso 15 — Comando `/sdd-ship`

**Qué.** Push y creación del PR.

**Contenido** — `.opencode/commands/sdd-ship.md`:

```markdown
---
description: Push the feature branch and open a PR with full spec-to-test traceability.
---

Ship the current feature.

## Preconditions

- Not on main
- Working tree clean
- All tasks in `tasks.md` done, or the user explicitly asked for a partial PR
- `bash scripts/quality-gate.sh` exits 0

## Steps

1. `git push -u origin <current-branch>`
2. Build the PR body into `.sdd/pr-body.md` using `.github/PULL_REQUEST_TEMPLATE.md`.
   Fill the traceability table by grepping test files for BR-xx IDs. Every
   `file:line` must be real — verify each one. Never invent a reference.
3. `gh pr create --base main --title "<type>(<scope>): <summary>" --body-file .sdd/pr-body.md`
4. Print the PR URL.

## Never

Merge. Push to main. Use `--force` or `--no-verify`.
```

**Verificación.** El PR se crea, la tabla de trazabilidad apunta a líneas
reales, y no hay merge — los permisos del paso 6 lo garantizan aunque el modelo
lo intente.

---

## Paso 16 — Comando `/sdd-status`

**Qué.** Dónde va el flujo.

**Contenido** — `.opencode/commands/sdd-status.md`:

```markdown
---
description: Show current spec, task progress, blockers and run cost.
---

Report, in this order and nothing else:

1. Active spec (`.sdd/current-spec`) and current branch
2. Task progress: done / total, and the next pending task
3. `.sdd/blocked.md` if it exists — task, attempts, last finding
4. BR-xx rules with no test referencing them (grep the test files)
5. Last run summary from `.sdd/runs/`

Plain output. No suggestions unless something is blocked.
```

**Verificación.** Barato de construir, y en vivo te evita hacer scroll.

---

## Paso 17 — Template de PR

**Contenido** — `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Spec

`specs/<spec-id>/spec.md`

## Business rules

| ID    | Rule | Test                |
| ----- | ---- | ------------------- |
| BR-xx |      | `file.spec.ts:line` |

## Gates

- [ ] lint - [ ] typecheck - [ ] tests - [ ] build
- [ ] reviewer: APPROVED

## Out of scope

<what the spec explicitly excluded>

## Cost

Tokens: · USD: · Duration:
```

---

## Paso 18 — Branch protection

**Qué.** La misma regla, en el servidor.

**Por qué.** *Defense in depth.* Los permisos y plugins protegen del agente
pero son locales y se pueden borrar. La branch protection no.

**Contenido.**

```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "enforce_admins=true" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false"
```

O por UI: Settings → Branches → Add rule sobre `main` → Require a pull request.

**Verificación.** Intenta un push directo a main desde tu terminal, fuera de
opencode. GitHub debe rechazarlo.

---

## Orden de verificación final

Cuando termines los 18 pasos, prueba el flujo completo con una feature real:

```
/sdd-new <tu primera feature>
   → responde las preguntas de clarify
   → revisa y aprueba el spec
/sdd-implement
/sdd-status
/sdd-ship
```

**Regla de verificación general:** para cada capa, rómpela a propósito. Si no
puedes hacerla fallar y ver cómo lo atrapa, no la controlas todavía.

| Capa            | Cómo romperla                      | Qué debe pasar                        |
| --------------- | ---------------------------------- | ------------------------------------- |
| permisos nativos| `git push origin main`             | Deny instantáneo, sin ejecutar        |
| git-guard       | `git push` parado en main          | Error del plugin con la rama          |
| quality-gate    | `const x: number = "a"`            | Exit 2, el agente corrige             |
| prisma-guard    | Editar schema sin migrar           | Error citando la constitution         |
| test-writer     | Borrar una regla del service       | El test BR-xx falla                   |
| reviewer        | Lógica de negocio en un controller | CHANGES_REQUESTED citando principio I |
| escalada        | Forzar 3 rechazos                  | `.sdd/blocked.md` y detención         |

---

## Apéndice A — Lo que NO tiene equivalente directo (y cómo se resuelve)

| Claude Code                    | Estado en opencode              | Solución                                                  |
| ------------------------------ | ------------------------------- | --------------------------------------------------------- |
| `PreToolUse` hook (bash/JSON)  | Plugin `tool.execute.before`    | Esta guía, paso 6 — `throw` para denegar                  |
| `PostToolUse` hook             | Plugin `tool.execute.after`     | Esta guía, pasos 7 y 8                                    |
| `SubagentStop` hook            | Sin evento nativo               | Gate como paso del comando `/sdd-implement` (paso 14)     |
| `Stop` hook                    | Evento `session.idle`           | Esta guía, paso 9                                         |
| SlashCommand tool (encadenar)  | No existe                       | Patrón "Read `.opencode/commands/x.md` and follow it"     |
| `settings.json` + `hooks` key  | `opencode.json` + plugins TS    | Config declarativa para permisos; código para lo dinámico |
| `allowed-tools` en frontmatter | `permission` en frontmatter     | Más granular: globs por comando, no solo lista de tools   |

## Apéndice B — Modelos y costo: resolver el límite de suscripción

La razón original de la migración. En opencode:

1. **Multi-proveedor.** `opencode auth login` soporta decenas de proveedores:
   OpenCode Zen, OpenRouter, Anthropic API directa, GitHub Copilot, ChatGPT
   Plus, Google, y servidores locales (Ollama/LM Studio). Si un proveedor se
   agota, cambias de modelo con `/models` sin tocar nada del setup.
2. **Modelo por agente.** El frontmatter `model:` permite poner un modelo
   económico en `test-writer` y `reviewer` (volumen alto, juicio mecánico) y
   reservar el modelo potente para `implementer` y la orquestación.
3. **`opencode stats`** te da uso de tokens y costo por sesión/día — con el
   plugin de telemetría del paso 9 tienes costo por feature, que es el número
   que tu audiencia va a preguntar.

Todo lo demás del sistema — constitution, reglas con ID, gates, agentes,
comandos, trazabilidad — es **agnóstico del proveedor**. Ese es exactamente el
mensaje de la charla: el pipeline SDD es un activo que sobrevive al agente y
al modelo de turno.

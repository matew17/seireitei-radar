# Glosario — IA en el flujo de desarrollo

Términos organizados por tema. Cada uno con definición corta y dónde aparece
en la herramienta de Distrito Cracks.

---

## 1. Ingeniería de contexto

### Context engineering

La disciplina de decidir **qué información entra al contexto del modelo, cuándo
y en qué forma**. Es el paraguas de todo lo demás. Se distingue del prompt
engineering en que no se trata de redactar mejor, sino de estructurar dónde
vive cada cosa.

### Progressive disclosure

Cargar información en niveles, del más barato al más caro:

1. **Metadata** — nombre y descripción. Siempre en contexto, pocos tokens.
2. **Cuerpo** — se carga cuando el modelo decide que aplica.
3. **Referencias** — archivos que solo se leen bajo una condición explícita.

Un documento grande al lado de un SKILL.md no cuesta nada hasta que se abre.

> _En la herramienta:_ la constitution está en nivel 1 (siempre), los agentes
> en nivel 2 (al delegar), el spec completo en nivel 3 (bajo demanda).

### Resident vs deferred tokens

**Residentes:** ocupan contexto en todo momento (CLAUDE.md, frontmatter de
skills). **Diferidos:** solo cuando se necesitan. La optimización real no es
acortar el texto, es mover contenido de residente a diferido.

### Context rot

La degradación de la calidad de respuesta a medida que el contexto se llena de
información irrelevante. El modelo no olvida, pero le cuesta más distinguir lo
importante. Es el problema que progressive disclosure resuelve.

### Context bloat

El síntoma: instrucciones que crecen sin que nadie verifique si aportan.
Típicamente por acumulación — cada bug arreglado agrega un párrafo defensivo
que nunca se quita.

---

## 2. Estructura y propiedad

### Single source of truth

Una regla se define en **un** lugar. Si aparece en el orquestador y también en
un agente, tienes dos versiones que van a divergir. La duplicación no solo
gasta tokens: produce contradicciones.

### Ownership boundaries

La asignación explícita de qué capa es dueña de qué tipo de regla:

| Capa            | Es dueña de                                                    |
| --------------- | -------------------------------------------------------------- |
| Orquestación    | Qué corre, en qué orden, con qué input, cuándo parar           |
| Agente          | Rol, herramientas, criterio de terminación, formato de handoff |
| Skill / comando | El procedimiento de una tarea                                  |
| CLAUDE.md       | Convenciones que aplican a todo el repo                        |

### Determinism boundary

La línea que separa lo que debe ser **código** de lo que debe ser **prompt**.
Si el resultado es verificable mecánicamente, es código: un script, un
validador, una plantilla. Si requiere criterio, es prompt.

Corolario contraintuitivo: **más instrucciones en prosa aumentan la varianza**,
no la reducen. Para output consistente, quitas prosa y agregas validadores.

> _En la herramienta:_ lint, build y tests son hooks. La revisión de si el
> código cumple el spec es un agente.

### Degrees of freedom

Cuánta libertad le dejas al agente, calibrada a propósito. Cero libertad
(script) para lo determinista, libertad amplia para lo que requiere juicio.
El error común es dejar libertad media en todo.

---

## 3. Calidad y medición

### Validator loop

El patrón generar → validar → corregir → repetir. En vez de describir en prosa
cómo debe verse el output, escribes un validador que falla con un mensaje
accionable y dejas que el modelo itere hasta que pase.

### Eval-driven development

Construir las evaluaciones **antes** que las instrucciones. Estableces un
baseline, escribes instrucciones mínimas, mides, e iteras. Es al revés de lo
habitual, que es escribir todo y después tratar de recortar.

### Ablation testing

Quitar una sección de las instrucciones, correr las mismas tareas, comparar. Si
la calidad no baja, la sección era decorativa. Es la única forma empírica de
responder "¿cuánto valor aporta esta instrucción?".

### Golden output

El resultado de referencia contra el que comparas. Sin golden outputs, "quedó
mejor" es una opinión.

### Deterministic gates vs judgment agents

**Gates deterministas:** verificables mecánicamente (compila, pasa tests,
cumple el linter). Van en hooks. **Agentes de criterio:** requieren juicio
(¿el código hace lo que el spec pide?). Van en subagentes.

Orden importante: los gates primero. No gastas tokens revisando código que no
compila.

---

## 4. Spec-Driven Development

### Spec-Driven Development (SDD)

La metodología donde **el spec es la fuente de verdad y el código es el
output** que sirve al spec, no al revés. Invierte la relación tradicional
donde la documentación se escribe después y queda desactualizada.

### Spec Kit

El CLI open source de GitHub (`specify`) que instala la estructura SDD en un
repo y agrega slash commands al agente. Bootstrapper, no dependencia: escribe
archivos en el proyecto y después no se necesita.

### Constitution

Documento de principios no negociables del proyecto, que todos los comandos
posteriores consultan. Es el artefacto de mayor apalancamiento: una regla
escrita aquí se aplica en todo el pipeline sin repetirse en cada prompt.

### Ciclo Specify → Plan → Tasks → Implement

Las cuatro fases de Spec Kit. Cada una produce un markdown que la siguiente
lee, así el agente siempre tiene contexto estructurado.

### Clarify

La fase que detecta ambigüedades en el spec y pregunta en vez de asumir.
Es donde el error se atrapa en markdown en vez de en producción.

### Traceability

La cadena que conecta una regla de negocio con su implementación:

```
BR-01 → spec.md → task T-012 → test 'BR-01: ...' → commit → PR
```

El ID estable es lo que la hace posible. Sin ID, "¿está implementada la regla
de cancelación?" se responde leyendo código; con ID, con un `grep`.

---

## 5. Seguridad y control

### Blast radius limiting

Poner techo a cuánto puede afectar una operación fallida: máximo de archivos
por task, máximo de reintentos, máximo de tasks por corrida.

### Defense in depth

La misma regla aplicada en capas independientes. El hook de git protege del
agente pero es local y se puede borrar; la branch protection de GitHub no.
Ninguna capa se confía de la otra.

### Escalation path

Qué pasa cuando el flujo se atasca. Un flujo semi-autónomo sin ruta de
recuperación definida no es semi-autónomo: es un flujo que te deja tirado.

### Human gate

Un punto del flujo donde el criterio humano es obligatorio en cualquier modo de
autonomía. En esta herramienta hay dos: aprobación del spec y merge.

---

## 6. Mecánica de Claude Code

### Hook

Comando shell que Claude Code ejecuta automáticamente en un punto fijo de su
ciclo de vida. Da control determinista: la acción **siempre** ocurre, en vez de
depender de que el modelo decida hacerla.

### PreToolUse

El evento que corre antes de una llamada a herramienta. Es el único que puede
detener la llamada. Propiedad clave: **un `deny` de PreToolUse bloquea incluso
en modo bypassPermissions o con `--dangerously-skip-permissions`.** Los hooks
solo restringen permisos, nunca los amplían.

### PostToolUse / SubagentStop / Stop

Después de una herramienta / cuando un subagente termina / cuando termina el
turno. Los tres son buenos lugares para validación y telemetría, en orden
creciente de qué tan caro puede ser lo que corras ahí.

### Exit code 2

La señal de bloqueo. En `PreToolUse` detiene la herramienta y devuelve stderr
al modelo como razón. Importante: el mensaje debe decir explícitamente que es
un gate automático y no una negativa del usuario, o el modelo a veces se
detiene en vez de corregir.

### Slash command

Archivo markdown en `.claude/commands/` que se invoca con `/nombre`. El nombre
del archivo es el nombre del comando. Explícito: lo escribes tú, cada vez.

### SlashCommand tool

La herramienta que permite a Claude invocar slash commands programáticamente y
encadenarlos. Requisito: el comando invocado debe tener `description` en su
frontmatter. Es lo que hace viable orquestar Spec Kit desde un comando propio.

### Subagente

Un loop de agente aislado, con su propia ventana de contexto y sus propios
permisos. Se usa cuando una tarea necesita contexto propio, no solo un prompt
propio.

### Skill

Capacidad que el modelo carga por su cuenta según la relevancia de la tarea.
No la invocas directamente.

### Cuándo usar cada uno

| Si quieres...                                     | Usa           |
| ------------------------------------------------- | ------------- |
| Escribir el mismo prompt largo más de dos veces   | Slash command |
| Que algo pase automáticamente, sin escribir nada  | Hook          |
| Que el modelo alcance una capacidad por su cuenta | Skill         |
| Aislar una tarea en su propio contexto            | Subagente     |

---

## 7. Convenciones de Git

### Conventional Commits

Formato estructurado de mensaje: `tipo(scope): descripción`. Hace el historial
parseable por máquina y permite derivar changelogs y versiones.

### Commit atómico

Un commit por unidad lógica de cambio. En esta herramienta: un commit por task
de `tasks.md`. Si el reviewer rechaza, revertir es trivial.

### Smart commit

Mensaje generado desde el contexto del cambio, no escrito a mano — incluye la
task, el spec, las reglas BR-xx y los tests. Es lo que hace que el historial
sea trazable sin esfuerzo manual.

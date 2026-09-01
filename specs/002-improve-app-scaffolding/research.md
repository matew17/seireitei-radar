# Research: Improve Application Scaffolding

## Decision: Organize each bounded context by responsibility

Use root-level `controllers/`, `dto/`, `services/`, and `repositories/` folders inside a bounded context, and retain only `<context>.module.ts` at the context root.

**Rationale**: The structure maps directly to the constitution's required controller, service, and repository boundaries. It solves the reported root-level crowding while allowing developers to find code by responsibility consistently across contexts.

**Alternatives considered**:

- Keep a flat context root: rejected because it does not address the discovery problem.
- Group files by operation: rejected because the current architecture distinguishes responsibilities first, and an operation can span controller, service, repository, and DTO files.

## Decision: Co-locate tests with the source responsibility

Move each existing `*.spec.ts` file with the source file or DTO it verifies.

**Rationale**: Jest already discovers `*.spec.ts` beneath `src/`; co-location makes the test relationship visible and requires no test configuration change.

**Alternatives considered**:

- Central test folders: rejected because they separate tests from their responsibility without an existing project convention requiring it.

## Decision: Put mandatory future-code guidance in AGENTS.md

Add the structure, placement, test, and shared-code rules to `AGENTS.md`.

**Rationale**: `AGENTS.md` is mandatory project context for implementation agents and is concise enough to provide a single authoritative convention.

**Alternatives considered**:

- A separate developer guide: rejected because it is less likely to be loaded automatically by future implementation agents.
- Generation templates only: rejected because contributors also need an authoritative convention.

## Decision: Preserve the existing public contract and data model

Treat this as a file relocation with import updates only.

**Rationale**: The specification requires behavior preservation. No endpoint, persistence schema, migration, or business rule needs to change.

**Alternatives considered**:

- Combine restructuring with API changes: rejected as out of scope and incompatible with behavior-preservation acceptance criteria.

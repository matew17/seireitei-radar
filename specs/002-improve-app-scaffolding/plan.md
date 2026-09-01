# Implementation Plan: Improve Application Scaffolding

**Branch**: `002-improve-app-scaffolding` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-improve-app-scaffolding/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Reorganize the existing Squad bounded context into responsibility folders without changing behavior, and record the required layout in `AGENTS.md` so future implementations follow it. Move controllers and their DTOs, services, and repositories with their unit tests into the approved locations; retain the context module at its root and update its imports.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7 (ES2023 target)

**Primary Dependencies**: NestJS 11, Prisma Client 6, class-validator

**Storage**: PostgreSQL via Prisma; no data model or migration changes

**Testing**: Jest 30 unit tests; existing e2e Jest suite remains available for behavior validation

**Target Platform**: Node.js server

**Project Type**: NestJS web service

**Performance Goals**: Preserve existing request behavior; no performance change is introduced

**Constraints**: One NestJS module per bounded context; controllers contain only validation and HTTP mapping, services contain business behavior, repositories contain Prisma access; no externally observable API change

**Scale/Scope**: Migrate the existing Squad bounded context and add repository-wide instructions for future bounded contexts; do not reorganize unrelated contexts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| One module per bounded context | Pass | `squads.module.ts` remains the Squad composition root. |
| Responsibility boundaries | Pass | The target folders map controllers, services, repositories, and DTOs to their constitutional responsibilities. |
| DTO input validation | Pass | DTOs move with their controller responsibility; validation behavior is unchanged. |
| Data and migration discipline | Pass | No Prisma schema or data behavior changes are planned; no migration is required. |
| Database enforcement of concurrency invariants | N/A | This feature introduces no business or concurrency invariant. |
| Rule-to-test traceability | N/A | No BR-xx rules apply to this structural feature. Existing BR tests move with their responsibilities without changing coverage. |
| Domain exception handling | Pass | Existing global error filter and domain exceptions are not changed. |
| Scope control | Pass | Changes are limited to Squad file placement, imports, tests, and future-code instructions. |
| Git workflow | Pass | Implementation tasks will be committed individually on `feat/002-improve-app-scaffolding`. |

## Project Structure

### Documentation (this feature)

```text
specs/002-improve-app-scaffolding/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── common/                         # Cross-cutting code not owned by a bounded context
├── prisma/                         # Prisma infrastructure module
├── squads/                         # Squad bounded context
│   ├── controllers/
│   │   └── squads.controller.ts
│   ├── dto/                         # Request DTOs and their tests
│   ├── repositories/
│   │   └── squads.repository.ts
│   ├── services/
│   │   └── squads.service.ts
│   └── squads.module.ts             # Bounded-context composition root
├── app.module.ts
└── main.ts
```

**Structure Decision**: Use root-level responsibility folders in every bounded context: `controllers/` for HTTP mapping, `dto/` for request DTOs, `services/` for business behavior, and `repositories/` for Prisma access. Co-locate each `*.spec.ts` file with the source file or DTO it verifies. Keep only the `<context>.module.ts` composition root at a bounded context's root. Place code shared across contexts in `src/common/`, not in a context folder. Add these placement rules to `AGENTS.md` for future implementation agents.

## Complexity Tracking

No constitution violations require justification.

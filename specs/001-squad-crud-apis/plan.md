# Implementation Plan: Squad CRUD APIs

**Branch**: `001-squad-crud-apis` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-squad-crud-apis/spec.md`

## Summary

Create Squad CRUD APIs for operations staff using a dedicated NestJS Squad bounded-context module. The implementation will expose create, list, get, partial update, and remove-as-unavailable behavior backed by Prisma and PostgreSQL, with DTO validation, service-enforced domain rules, repository-only Prisma access, global-safe error mapping, and database constraints for BR-02 and BR-03.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js runtime used by NestJS 11

**Primary Dependencies**: NestJS 11, Prisma 6, class-validator/class-transformer for DTO validation if not already installed

**Storage**: PostgreSQL via Prisma schema at `prisma/schema.prisma`

**Testing**: Jest unit tests under `src/**/*.spec.ts`; e2e/integration tests through `npm run test:e2e` with a real PostgreSQL database for BR-02/BR-03 constraint verification

**Target Platform**: Server-side web service

**Project Type**: NestJS API service

**Performance Goals**: Standard operational CRUD interactions should complete within normal request/response expectations for a small roster; no high-volume batch behavior is in scope

**Constraints**: One NestJS module per bounded context; controllers only map HTTP and validation; services enforce business rules; repositories own Prisma access; no public `any`; business invariants expressible as PostgreSQL constraints must live in the database

**Scale/Scope**: Single Squad bounded context with five CRUD-style operations and no changes to threat alert creation behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture**: PASS. Plan uses one `squads` module with controller, service, repository, and DTOs. Controller responsibilities are limited to HTTP mapping and validation; service owns domain behavior; repository owns Prisma access.
- **Data**: PASS. BR-02 is already represented by the existing unique constraint on `Squad.number`; BR-03 will be planned as a PostgreSQL check constraint in a versioned migration. No schema change will be made without a migration task.
- **Testing**: PASS. Tasks will include BR-ID-named tests for BR-01 relevance, BR-02 uniqueness, and BR-03 threat capability validation. BR-02 and BR-03 DB constraint behavior will be tested against real PostgreSQL.
- **Errors**: PASS. Tasks will include domain exceptions and global-safe HTTP mapping so Prisma errors are not exposed.
- **Git**: PASS. No commit or push is performed in this analysis phase.
- **Scope**: PASS. Plan is limited to Squad CRUD APIs and supporting validation/constraints.

## Project Structure

### Documentation (this feature)

```text
specs/001-squad-crud-apis/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── squads.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── errors/
│   │   └── domain-error.ts
│   └── filters/
│       └── domain-exception.filter.ts
└── squads/
    ├── dto/
    │   ├── create-squad.dto.ts
    │   └── update-squad.dto.ts
    ├── squads.controller.ts
    ├── squads.module.ts
    ├── squads.repository.ts
    ├── squads.service.ts
    └── squads.service.spec.ts

test/
└── squads.e2e-spec.ts

prisma/
├── schema.prisma
└── migrations/
```

**Structure Decision**: Use a single NestJS API project with a `src/squads` bounded-context module, shared Prisma infrastructure under `src/prisma`, and shared error mapping under `src/common`.

## Complexity Tracking

No constitution violations require justification.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/squads.openapi.yaml](./contracts/squads.openapi.yaml), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Architecture**: PASS. Design artifacts preserve controller/service/repository separation and module boundaries.
- **Data**: PASS. BR-03 is specified as a PostgreSQL check constraint; BR-02 uses the existing unique index. No concurrency-sensitive rule is left service-only.
- **Testing**: PASS. Design requires BR-ID traceability in tests and real PostgreSQL for constraint tests.
- **Errors**: PASS. Contracts describe client-safe errors and tasks will include a global domain exception filter.
- **Git**: PASS. No Git operation is part of generated artifacts.
- **Scope**: PASS. Artifacts are limited to Squad CRUD APIs and supporting constraints.

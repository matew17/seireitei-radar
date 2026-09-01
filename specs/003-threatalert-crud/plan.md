# Implementation Plan: ThreatAlert CRUD

**Branch**: `003-threatalert-crud` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-threatalert-crud/spec.md`

## Summary

Deliver ThreatAlert create, list, get, partial correction, and remove-as-resolved operations in a dedicated NestJS bounded context. Persist alerts through Prisma and PostgreSQL; validate all request inputs through DTOs; enforce BR-04 with DTO validation and a PostgreSQL check constraint; and execute the BR-01 eligible-squad lookup during alert creation without assigning a squad.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7, Node.js runtime used by NestJS 11

**Primary Dependencies**: NestJS 11, Prisma 6, class-validator/class-transformer, Jest, Supertest

**Storage**: PostgreSQL via Prisma schema at `prisma/schema.prisma`

**Testing**: Jest unit tests under `src/**/*.spec.ts`; e2e and contract tests under `test/`; real PostgreSQL for BR-04 database constraint verification

**Target Platform**: Server-side web service

**Project Type**: NestJS API service

**Performance Goals**: Standard operational CRUD interactions; one eligible-squad lookup per alert creation; no batch or high-volume behavior is in scope

**Constraints**: One NestJS module per bounded context; controllers only map HTTP and validate DTOs; services own business behavior; repositories own Prisma access; no public `any`; Prisma failures are never exposed; database-expressible invariants live in PostgreSQL

**Scale/Scope**: One ThreatAlert bounded context with five CRUD-style operations. Creation performs eligibility lookup only; squad assignment and status changes outside remove-as-resolved are excluded.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture**: PASS. A single `threat-alerts` module will contain DTOs, controller, service, and repository. The controller maps HTTP and DTO validation only; the service performs BR-01 and error translation; the repository owns Prisma access.
- **Data**: PASS. BR-04 is expressible as a PostgreSQL check constraint and will be added with a versioned migration in the same implementation task. BR-01 is a creation-time eligibility query, not a persistence invariant, so no concurrency-sensitive invariant is introduced.
- **Testing**: PASS. BR-01 and BR-04 will each have tests naming their IDs. BR-04 database-constraint behavior will run against real PostgreSQL.
- **Errors**: PASS. Existing domain-error/filter infrastructure will map validation and not-found outcomes without Prisma messages.
- **Git**: PASS. This analysis creates planning artifacts only. Implementation tasks require conventional commits on `feat/003-threatalert-crud`.
- **Scope**: PASS. No squad assignment, status update endpoint, or changes to unrelated contexts are planned.

## Project Structure

### Documentation (this feature)

```text
specs/003-threatalert-crud/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
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
├── app.module.ts
├── common/
│   ├── errors/
│   └── filters/
├── prisma/
└── threat-alerts/
    ├── controllers/
    ├── dto/
    ├── repositories/
    ├── services/
    └── threat-alerts.module.ts

test/
├── threat-alerts.contract.e2e-spec.ts
└── threat-alerts.e2e-spec.ts

prisma/
├── schema.prisma
└── migrations/
```

**Structure Decision**: Use the existing single NestJS API with a dedicated `src/threat-alerts` bounded-context module, shared Prisma infrastructure, and shared domain-error filtering. Co-locate unit tests with the ThreatAlert code and place HTTP contract and real-PostgreSQL integration tests under `test/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations require justification.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/threat-alerts.openapi.yaml](./contracts/threat-alerts.openapi.yaml), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Architecture**: PASS. The module design preserves controller, service, and repository separation.
- **Data**: PASS. BR-04 has a PostgreSQL check constraint and versioned migration. BR-01 remains a query behavior, with no concurrent write invariant left service-only.
- **Testing**: PASS. Each applicable BR ID has named test coverage; BR-04 constraint coverage uses real PostgreSQL.
- **Errors**: PASS. Contract errors use the existing safe domain-error envelope.
- **Git**: PASS. No commit or push is included in planning artifacts.
- **Scope**: PASS. The artifacts exclude squad assignment and unapproved lifecycle changes.

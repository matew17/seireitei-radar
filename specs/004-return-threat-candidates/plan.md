# Implementation Plan: Return Threat Candidates

**Branch**: `004-return-threat-candidates` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-return-threat-candidates/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Return `candidateSquads` containing the complete existing squad representation with a created threat and with an updated threat whenever the update submits a valid threat level. Reuse the existing BR-01 eligibility query in the ThreatAlert repository; model the enriched create and conditional-update results in the service and controller contracts, and prove the HTTP behavior with focused unit, e2e, and contract tests.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7, Node.js runtime used by NestJS 11

**Primary Dependencies**: NestJS 11, Prisma 6, class-validator/class-transformer, Jest, Supertest

**Storage**: PostgreSQL via Prisma schema at `prisma/schema.prisma`

**Testing**: Jest unit tests under `src/**/*.spec.ts`; e2e and HTTP contract tests under `test/`; real PostgreSQL for e2e verification

**Target Platform**: Server-side web service

**Project Type**: NestJS API service

**Performance Goals**: Standard operational threat-management interactions; exactly one eligibility lookup for each valid creation and each update that submits threatLevel; no lookup for location-only updates

**Constraints**: One NestJS module per bounded context; controllers map HTTP and validate DTOs only; services own response composition; repositories own Prisma access; no public `any`; Prisma failures are never exposed; no schema or migration change without a persistence invariant

**Scale/Scope**: Extend only create and update responses in the existing ThreatAlert bounded context. List, get, removal, squad assignment, status changes, and candidate-eligibility criteria are out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture**: PASS. The existing `threat-alerts` bounded-context module retains DTO validation and HTTP mapping in its controller, response composition in its service, and eligibility lookup plus persistence access in its repository.
- **Data**: PASS. This feature does not change persisted entities or introduce a concurrency-sensitive invariant. BR-01 is evaluated from current squad data at action time, so no new database constraint or migration is required. BR-04 remains enforced by the existing DTO validation and PostgreSQL check constraint.
- **Testing**: PASS. Focused tests will name BR-01 and BR-04 where they exercise candidate eligibility and valid/invalid threat levels. Existing real-PostgreSQL BR-04 constraint tests remain applicable.
- **Errors**: PASS. Existing domain-error mapping remains responsible for validation and not-found errors; Prisma messages remain hidden.
- **Git**: PASS. Planning creates no implementation commit. The implementation task will produce one Conventional Commit on `feat/004-return-threat-candidates`.
- **Scope**: PASS. The plan changes only threat creation and updates that submit a threat level; it does not alter data persistence, squad assignment, or unrelated endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/004-return-threat-candidates/
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
├── common/
├── prisma/
├── squads/
└── threat-alerts/
    ├── controllers/threat-alerts.controller.ts
    ├── repositories/threat-alerts.repository.ts
    └── services/
        ├── threat-alerts.service.ts
        └── threat-alerts.service.spec.ts

tests/
├── threat-alerts.contract.e2e-spec.ts
└── threat-alerts.e2e-spec.ts
```

**Structure Decision**: Use the existing `threat-alerts` NestJS bounded-context module. Update its repository-returned result consumption, service response types, and controller return contracts together; exercise HTTP behavior through the existing ThreatAlert e2e and contract suites.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations require justification.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/threat-alerts.openapi.yaml](./contracts/threat-alerts.openapi.yaml), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Architecture**: PASS. The response type is composed in the ThreatAlert service, with the controller limited to its HTTP return mapping and the repository limited to Prisma access.
- **Data**: PASS. No persisted field, relationship, or database constraint changes are needed. Candidate results are transient query results, and the feature adds no concurrency invariant.
- **Testing**: PASS. BR-01 candidate selection and BR-04 input validation are covered by named focused tests; existing real-PostgreSQL constraint coverage still verifies BR-04.
- **Errors**: PASS. The contract preserves the shared safe validation and not-found outcomes.
- **Git**: PASS. No commit or push is included in planning artifacts.
- **Scope**: PASS. The design adds `candidateSquads` only to creation and level-submitting update responses.

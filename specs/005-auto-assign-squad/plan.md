# Implementation Plan: Auto-Assign Squad

**Branch**: `005-auto-assign-squad` | **Date**: 2026-09-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-auto-assign-squad/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Add a bodyless endpoint that assigns the lowest-numbered eligible squad to a pending, unassigned threat alert. The threat-alert service owns BR-01 and BR-05 through BR-07, the repository owns the transactional Prisma access, and PostgreSQL constraints enforce assignment-state and assignment-time eligibility invariants.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.7

**Primary Dependencies**: NestJS 11, Prisma 6, class-validator

**Storage**: PostgreSQL via Prisma 6

**Testing**: Jest unit tests; Jest/Supertest e2e and integration tests against PostgreSQL

**Target Platform**: Node.js server

**Project Type**: NestJS web service

**Performance Goals**: Complete an assignment request in one request-response interaction; no separate eligibility lookup is required by callers.

**Constraints**: Controllers contain only HTTP mapping and DTO validation; no Prisma errors are exposed; BR-05 assignment-time eligibility is enforced by PostgreSQL; no squad availability change follows assignment.

**Scale/Scope**: One existing threat-alert bounded context, one new bodyless assignment action, one PostgreSQL migration, and focused unit, integration, e2e, and contract coverage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture**: Pass. Keep the endpoint in `ThreatAlertsController`, rule orchestration in `ThreatAlertsService`, and Prisma operations in `ThreatAlertsRepository`; validate route input with a DTO.
- **Data**: Pass with migration. Add a versioned PostgreSQL constraint trigger for cross-row assignment eligibility and lifecycle validation. Do not edit applied migrations.
- **Testing**: Pass. Add one BR-named test for every applicable rule. Run BR-05 database enforcement tests against real PostgreSQL rather than mocked Prisma.
- **Errors**: Pass. Translate no-eligible-squad and invalid-lifecycle outcomes to existing domain errors; preserve global-filter HTTP mapping and never return Prisma messages.
- **Git and Scope**: Pass. Plan implementation as a single cohesive task and one Conventional Commit on `feat/005-auto-assign-squad`.

## Project Structure

### Documentation (this feature)

```text
specs/005-auto-assign-squad/
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
prisma/
└── migrations/<timestamp>_add_threat_alert_assignment_constraint_trigger/migration.sql

src/
├── common/errors/domain-error.ts
└── threat-alerts/
    ├── controllers/threat-alerts.controller.ts
    ├── dto/assign-threat-alert.dto.ts
    ├── repositories/threat-alerts.repository.ts
    ├── repositories/threat-alerts.repository.spec.ts
    ├── services/threat-alerts.service.ts
    └── services/threat-alerts.service.spec.ts

test/
├── threat-alerts.e2e-spec.ts
└── threat-alerts.contract.e2e-spec.ts
```

**Structure Decision**: Extend the existing `threat-alerts` NestJS bounded-context module. The new endpoint requires no separate module or shared abstraction.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

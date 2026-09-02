# Tasks: Auto-Assign Squad

**Input**: Design documents from `/specs/005-auto-assign-squad/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/assign-threat-alert.md`, `quickstart.md`

**Tests**: Required by the constitution for every BR-xx rule. BR-05 database enforcement is tested against real PostgreSQL.

**Organization**: The two user stories share one endpoint, transaction, response contract, and test files. They are deliberately consolidated into one vertically complete implementation task rather than split by layer or response branch.

## Phase 1: Automatic Assignment

**Goal**: Operations staff can request automatic assignment and receive either the assigned alert or a safe, explicit no-assignment outcome.

**Independent Test**: Create a pending alert and eligible squads, call `POST /threat-alerts/{id}/assign`, and verify the lowest-numbered eligible squad is assigned without changing its availability. Repeat with no eligible squad, an already assigned alert, a resolved alert, and a missing alert.

- [ ] T001 [US1] Deliver and validate automatic squad assignment end-to-end in `prisma/migrations/<timestamp>_add_threat_alert_assignment_constraint_trigger/migration.sql`, `src/threat-alerts/dto/assign-threat-alert.dto.ts`, `src/threat-alerts/repositories/threat-alerts.repository.ts`, `src/threat-alerts/services/threat-alerts.service.ts`, `src/threat-alerts/controllers/threat-alerts.controller.ts`, `src/common/errors/domain-error.ts`, `src/threat-alerts/repositories/threat-alerts.repository.spec.ts`, `src/threat-alerts/services/threat-alerts.service.spec.ts`, `test/threat-alerts.e2e-spec.ts`, and `test/threat-alerts.contract.e2e-spec.ts`: add PostgreSQL constraint-trigger enforcement, choose the lowest-numbered eligible squad, assign only pending unassigned alerts, preserve squad availability, map safe conflict/not-found outcomes, cover the success and result stories, and run `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`, plus `quickstart.md` scenarios. Covers BR-01, BR-03, BR-04, BR-05, BR-06, and BR-07. Commit: `feat(threat-alerts): auto-assign eligible squad`.

**Checkpoint**: User Story 1 and User Story 2 are jointly complete because both are outcomes of the same assignment request.

---

## Dependencies & Execution Order

- **T001**: No prerequisite implementation work. It contains the migration, all endpoint layers, focused tests, and final validation.

## Parallel Opportunities

No safe implementation parallelism is planned. The migration, repository transaction, service behavior, HTTP contract, and focused tests all change the same assignment slice and must remain coherent.

## Implementation Strategy

1. Complete T001 as one vertical, independently testable feature increment.
2. Validate the endpoint's success, no-eligible, not-found, and invalid-lifecycle outcomes before its single Conventional Commit.

## Consolidation Pass

- DTO, repository, service, controller, migration, and focused tests remain in T001 because splitting them would create file-level tracking without independently deliverable value.
- No standalone setup task is needed because existing NestJS, Prisma, global error handling, and test infrastructure are reused.
- Final checks remain in T001 because a validation-only task could not produce the constitution-required non-empty Conventional Commit.

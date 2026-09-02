---

description: "Implementation tasks for ThreatAlert CRUD"
---

# Tasks: ThreatAlert CRUD

**Input**: Design documents from `/specs/003-threatalert-crud/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/threat-alerts.openapi.yaml`, `quickstart.md`

**Tests**: Each implementation task includes focused tests. BR-04 constraint verification runs against real PostgreSQL as required by the constitution.

**Organization**: Tasks are vertically complete user-story increments. Each task is one focused agent session and one Conventional Commit.

## Phase 1: User Story 1 - Report a Threat (Priority: P1) MVP

**Goal**: Operations staff can create a pending, unassigned ThreatAlert and the system evaluates eligible squads.

**Independent Test**: Create alerts with valid and invalid threat levels against the HTTP interface and real PostgreSQL; verify persisted defaults, the BR-01 eligibility query, and BR-04 rejection without a stored invalid row.

- [x] T001 [US1] Deliver the ThreatAlert creation vertical slice: add the BR-04 `ThreatAlert.threatLevel` PostgreSQL CHECK constraint and versioned migration in `prisma/schema.prisma` and `prisma/migrations/`; register `src/threat-alerts/threat-alerts.module.ts` in `src/app.module.ts`; add creation DTO, repository eligibility query, service, controller, and focused unit/e2e tests under `src/threat-alerts/` and `test/threat-alerts.e2e-spec.ts` that name BR-01 and BR-04, including a real-PostgreSQL BR-04 constraint test. Outcome: valid creates are pending and unassigned, execute the BR-01 query, and reject invalid levels. Covers BR-01, BR-04. Commit: `feat(threat-alerts): create alerts and evaluate eligibility`.

**Checkpoint**: A valid alert can be reported and eligibility is evaluated without assigning a squad.

---

## Phase 2: User Story 2 - View Threat Alerts (Priority: P2)

**Goal**: Operations staff can list every alert, including resolved records, and retrieve an alert by identity.

**Independent Test**: Seed pending and resolved alerts, then verify the list response contains both and lookup returns a known alert or a safe not-found result.

- [x] T002 [US2] Extend the existing ThreatAlert repository, service, controller, and focused unit/e2e or contract tests in `src/threat-alerts/repositories/threat-alerts.repository.ts`, `src/threat-alerts/services/threat-alerts.service.ts`, `src/threat-alerts/controllers/threat-alerts.controller.ts`, `src/threat-alerts/**/*.spec.ts`, `test/threat-alerts.e2e-spec.ts`, and `test/threat-alerts.contract.e2e-spec.ts` for list and get operations. Outcome: all alerts, including resolved alerts, are retrievable and absent identities map to the shared safe not-found response. BR coverage: none newly introduced. Commit: `feat(threat-alerts): retrieve alert records`.

**Checkpoint**: Alert visibility works independently of creation-time eligibility behavior.

---

## Phase 3: User Story 3 - Maintain Threat Alerts (Priority: P3)

**Goal**: Operations staff can correct severity/location only and remove an alert by resolving it.

**Independent Test**: Partially correct a known alert, reject an invalid updated threat level, remove another alert, and verify it is resolved and still listed; verify update/removal not-found outcomes.

- [ ] T003 [US3] Extend the ThreatAlert update DTO, repository, service, controller, and focused unit/e2e or contract tests in `src/threat-alerts/dto/update-threat-alert.dto.ts`, `src/threat-alerts/repositories/threat-alerts.repository.ts`, `src/threat-alerts/services/threat-alerts.service.ts`, `src/threat-alerts/controllers/threat-alerts.controller.ts`, `src/threat-alerts/**/*.spec.ts`, `test/threat-alerts.e2e-spec.ts`, and `test/threat-alerts.contract.e2e-spec.ts`. Outcome: non-empty partial updates affect only threat level and coordinates, BR-04 remains enforced on update, and removal sets `RESOLVED` without hiding or deleting the record. Covers BR-04. Commit: `feat(threat-alerts): maintain and resolve alerts`.

**Checkpoint**: All approved CRUD behavior works without exposing assignment or general status mutations.

---

## Phase 4: Final Validation

**Purpose**: Validate the complete feature against its plan, contract, and constitution.

- [ ] T004 Run the consolidated quickstart validation in `specs/003-threatalert-crud/quickstart.md`: `npm test`, `npm run test:e2e`, `npm run lint`, and `npm run build`; remedy only ThreatAlert CRUD failures in the relevant `src/threat-alerts/`, `test/threat-alerts*.ts`, and `prisma/` files. Outcome: the planned contract and BR-01/BR-04 traceability pass end-to-end. Covers BR-01, BR-04. Commit: `test(threat-alerts): verify CRUD workflow`.

## Consolidation Pass

- T001 keeps the migration, module registration, creation endpoint, BR query, and rule tests together because they jointly deliver the MVP behavior and share the same implementation slice.
- T002 and T003 remain separate because they are independently demonstrable view and maintenance behaviors; combining them would obscure distinct user outcomes.
- Validation is one final task because its commands verify the same completed feature and require no separate environment.

## Dependencies & Execution Order

- T001 is the MVP and blocks T002 and T003 because it establishes the ThreatAlert module and persisted entity behavior.
- T002 and T003 can begin after T001, but both edit the same repository, service, controller, e2e fixture, and contract test files. Execute them sequentially to avoid conflicts.
- T004 depends on T001 through T003.

## Parallel Opportunities

No implementation tasks are safely parallel: the bounded-context files and e2e fixtures are shared. Independent test processes may run in parallel only after the implementation tasks complete.

## Implementation Strategy

1. Deliver and validate T001 as the usable reporting MVP.
2. Add T002 for operational visibility.
3. Add T003 for approved correction and resolution semantics.
4. Complete T004 as the single cross-cutting verification and remediation pass.

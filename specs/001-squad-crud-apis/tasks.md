# Tasks: Squad CRUD APIs

**Input**: Design documents from `/specs/001-squad-crud-apis/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by constitution for BR-01, BR-02, and BR-03 traceability; BR-02 and BR-03 database constraints require real PostgreSQL integration/e2e coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared NestJS infrastructure required by all Squad stories.

- [x] T001 Install DTO validation dependencies `class-validator` and `class-transformer` in `package.json` and `package-lock.json`
- [x] T002 Enable global validation pipe and domain exception filter registration in `src/main.ts`
- [x] T003 [P] Create Prisma module and service in `src/prisma/prisma.module.ts` and `src/prisma/prisma.service.ts`
- [ ] T004 [P] Create domain error primitives in `src/common/errors/domain-error.ts`
- [ ] T005 [P] Create global domain exception filter in `src/common/filters/domain-exception.filter.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish Squad module boundaries, persistence constraints, and test infrastructure before user-story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create Squad module skeleton in `src/squads/squads.module.ts`, `src/squads/squads.controller.ts`, `src/squads/squads.service.ts`, and `src/squads/squads.repository.ts`
- [ ] T007 Register `SquadsModule` and `PrismaModule` in `src/app.module.ts`
- [ ] T008 Add a versioned Prisma migration under `prisma/migrations/` that creates PostgreSQL check constraint `Squad_maxThreatLevel_check` enforcing BR-03 values 1, 2, and 3
- [ ] T009 [P] Create e2e test helpers for clearing and seeding squads in `test/squads-test-utils.ts`
- [ ] T010 [P] Add BR-03 real PostgreSQL constraint test in `test/squads.e2e-spec.ts` that names `BR-03` and proves invalid `maxThreatLevel` is rejected by the database
- [ ] T011 [P] Add BR-02 real PostgreSQL uniqueness test in `test/squads.e2e-spec.ts` that names `BR-02` and proves duplicate `number` is rejected by the database

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Register a Squad (Priority: P1) MVP

**Goal**: Operations staff can create valid squads and receive safe failures for duplicate numbers or invalid threat capability.

**Independent Test**: Submit valid and invalid create requests; verify created data, default availability, BR-02 conflict, and BR-03 validation behavior.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add create squad API e2e tests for success and default availability in `test/squads.e2e-spec.ts`
- [ ] T013 [P] [US1] Add create squad e2e tests naming `BR-02` and `BR-03` for duplicate number and invalid max threat level in `test/squads.e2e-spec.ts`
- [ ] T014 [P] [US1] Add service unit tests for create behavior and client-safe duplicate handling in `src/squads/squads.service.spec.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create create DTO with class-validator rules in `src/squads/dto/create-squad.dto.ts`
- [ ] T016 [US1] Implement Squad create persistence methods in `src/squads/squads.repository.ts`
- [ ] T017 [US1] Implement Squad create business flow and Prisma-error translation in `src/squads/squads.service.ts`
- [ ] T018 [US1] Implement `POST /squads` endpoint mapping in `src/squads/squads.controller.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - View Squads (Priority: P2)

**Goal**: Operations staff can retrieve all squads, including unavailable squads, and retrieve one squad by identity.

**Independent Test**: Seed squads with mixed availability; verify roster includes all squads and lookup returns found or not-found outcomes.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add list squads e2e test covering unavailable squads in `test/squads.e2e-spec.ts`
- [ ] T020 [P] [US2] Add get squad e2e tests for found and not-found outcomes in `test/squads.e2e-spec.ts`
- [ ] T021 [P] [US2] Add service unit tests for roster and lookup behavior in `src/squads/squads.service.spec.ts`

### Implementation for User Story 2

- [ ] T022 [US2] Implement Squad list and find-by-id repository methods in `src/squads/squads.repository.ts`
- [ ] T023 [US2] Implement Squad list and get service methods with not-found domain errors in `src/squads/squads.service.ts`
- [ ] T024 [US2] Implement `GET /squads` and `GET /squads/:id` endpoint mappings in `src/squads/squads.controller.ts`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Maintain Squad Details (Priority: P3)

**Goal**: Operations staff can partially update squads and remove squads by marking them unavailable.

**Independent Test**: Update a subset of fields and verify omitted values are preserved; remove a squad and verify it remains in the roster with `isAvailable: false`.

### Tests for User Story 3

- [ ] T025 [P] [US3] Add partial update e2e tests for preserved omitted fields in `test/squads.e2e-spec.ts`
- [ ] T026 [P] [US3] Add update e2e tests naming `BR-02` and `BR-03` for duplicate number and invalid max threat level in `test/squads.e2e-spec.ts`
- [ ] T027 [P] [US3] Add remove e2e test verifying removal marks `isAvailable` false and roster still includes the squad in `test/squads.e2e-spec.ts`
- [ ] T028 [P] [US3] Add service unit tests for partial update, not-found update, remove-as-unavailable, and not-found remove in `src/squads/squads.service.spec.ts`

### Implementation for User Story 3

- [ ] T029 [P] [US3] Create partial update DTO with class-validator rules in `src/squads/dto/update-squad.dto.ts`
- [ ] T030 [US3] Implement Squad update and mark-unavailable repository methods in `src/squads/squads.repository.ts`
- [ ] T031 [US3] Implement Squad partial update and remove service methods with BR-02/BR-03 safe error translation in `src/squads/squads.service.ts`
- [ ] T032 [US3] Implement `PATCH /squads/:id` and `DELETE /squads/:id` endpoint mappings in `src/squads/squads.controller.ts`

**Checkpoint**: All user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate contract alignment, rule traceability, and project quality gates.

- [ ] T033 [P] Verify implemented responses match `specs/001-squad-crud-apis/contracts/squads.openapi.yaml`
- [ ] T034 [P] Add or update README/API usage notes for Squad CRUD in `README.md`
- [ ] T035 Ensure tests name every applicable rule ID `BR-01`, `BR-02`, and `BR-03` in `test/squads.e2e-spec.ts` or `src/squads/squads.service.spec.ts`
- [ ] T036 Run `npm run lint` and fix any reported issues in touched files
- [ ] T037 Run `npm test` and fix any reported issues in touched files
- [ ] T038 Run `npm run test:e2e` against real PostgreSQL and fix any reported issues in touched files
- [ ] T039 Run `npm run build` and fix any reported issues in touched files
- [ ] T040 Validate `specs/001-squad-crud-apis/quickstart.md` end-to-end and update only if observed behavior differs from the approved spec

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion; MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and can use created/seeded squad data.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from create/read paths from US1/US2.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1**: Can start after Phase 2; no dependency on US2 or US3.
- **US2**: Can start after Phase 2; independent when using seeded data.
- **US3**: Can start after Phase 2; independent when using seeded data, but full API demo benefits from US1 and US2.

### Within Each User Story

- Tests must be written and observed failing before implementation.
- DTOs before controller mappings that consume them.
- Repository persistence methods before service flows that depend on them.
- Services before endpoint behavior is considered complete.

### Parallel Opportunities

- T003, T004, and T005 can run in parallel after T001/T002 are understood.
- T009, T010, and T011 can run in parallel after T008 is defined.
- Test tasks within each user story marked `[P]` can run in parallel.
- US2 and US3 can be developed in parallel after Phase 2 if seeded data is used and file edits are coordinated.

---

## Parallel Example: User Story 1

```bash
Task: "Add create squad API e2e tests for success and default availability in test/squads.e2e-spec.ts"
Task: "Add create squad e2e tests naming BR-02 and BR-03 for duplicate number and invalid max threat level in test/squads.e2e-spec.ts"
Task: "Add service unit tests for create behavior and client-safe duplicate handling in src/squads/squads.service.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation, including database constraints and BR constraint tests.
3. Complete Phase 3 create squad behavior.
4. Stop and validate create squad independently with unit and e2e tests.

### Incremental Delivery

1. Add create behavior first so squads can enter the system.
2. Add read behavior so staff can inspect squads.
3. Add update and remove-as-unavailable behavior so staff can maintain squad records.
4. Run polish quality gates and quickstart validation before seeking implementation approval.

### Rule Coverage Notes

- **BR-01**: Covered by tasks preserving `isAvailable` and `maxThreatLevel` and by T035 traceability; no threat creation task is in scope.
- **BR-02**: Covered by T011, T013, T026, and database unique constraint behavior.
- **BR-03**: Covered by T008, T010, T013, T026, DTO validation, and database check constraint behavior.

# Tasks: Improve Application Scaffolding

**Input**: Design documents from `/specs/002-improve-app-scaffolding/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: Existing Squad unit tests move with the source files they verify. No new behavior is introduced.

**Organization**: Tasks are grouped by user story so the Squad migration and future-code guidance can each be delivered and verified independently.

## Phase 1: Setup

**Purpose**: No project initialization is required; this feature uses the existing NestJS, Prisma, and Jest setup.

---

## Phase 2: Foundational

**Purpose**: No shared infrastructure, schema, migration, or external contract changes are required.

**Checkpoint**: Existing behavior and test configuration remain the foundation for the file relocation.

---

## Phase 3: User Story 1 - Navigate a Bounded Context (Priority: P1) MVP

**Goal**: Reorganize the Squad bounded context by responsibility without changing its externally observable behavior.

**Independent Test**: Inspect the context to locate each responsibility in its designated folder, then run the existing Squad tests to confirm behavior is preserved.

- [x] T001 [P] [US1] Move `src/squads/squads.controller.ts` and `src/squads/squads.controller.spec.ts` to `src/squads/controllers/`, updating imports from the existing `src/squads/dto/` folder and the co-located test.
- [x] T002 [P] [US1] Move `src/squads/squads.service.ts` and `src/squads/squads.service.spec.ts` to `src/squads/services/`, updating repository imports and the co-located test.
- [x] T003 [P] [US1] Move `src/squads/squads.repository.ts` and `src/squads/squads.repository.spec.ts` to `src/squads/repositories/`, updating Prisma imports and the co-located test.
- [x] T004 [US1] Update `src/squads/squads.module.ts` and any affected imports under `src/` to resolve the relocated controller, service, and repository paths.

**Checkpoint**: The Squad context uses the approved responsibility folders, retains only `squads.module.ts` at its root, and its existing behavior remains testable.

---

## Phase 4: User Story 2 - Add a Future Bounded Context (Priority: P2)

**Goal**: Make the approved layout mandatory and unambiguous for future implementations.

**Independent Test**: Read the project instructions and classify representative controller, DTO, service, repository, test, module, and shared-code additions without relying on undocumented conventions.

- [x] T005 [US2] Add the bounded-context folder, co-located test, context-root module, and `src/common/` shared-code conventions to `AGENTS.md`.

**Checkpoint**: `AGENTS.md` is the single authoritative source for future bounded-context file placement.

---

## Phase 5: Validation and Polish

**Purpose**: Verify behavior preservation and the documented convention across all feature work.

- [x] T006 Run the validation scenarios in `specs/002-improve-app-scaffolding/quickstart.md`: `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` when PostgreSQL is available.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 and Phase 2 have no implementation tasks.
- T001 through T003 can run in parallel.
- T004 depends on T001 through T003 because it imports the relocated files.
- T005 can run independently after the structure decision and may run in parallel with Phase 3.
- T006 depends on T004 and T005.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story; it is the MVP.
- **User Story 2 (P2)**: No code dependency on User Story 1, but its documented examples must match the approved target layout.

### Parallel Opportunities

- T001, T002, and T003 modify separate responsibility folders and can run in parallel.
- T005 modifies `AGENTS.md` and can run in parallel with T001 through T004.

## Implementation Strategy

### MVP First

1. Complete T001 through T004 to deliver the reorganized Squad bounded context.
2. Run the applicable validation from T006 to prove behavior preservation.

### Incremental Delivery

1. Deliver the Squad relocation as the concrete example of the convention.
2. Deliver the `AGENTS.md` instructions for future bounded contexts.
3. Run the complete validation guide after both increments.

## Notes

- No BR-xx rule applies to this feature, so no rule-specific test task is required.
- No Prisma schema, migration, or concurrency constraint change is planned.
- Create one Conventional Commit per task on `feat/002-improve-app-scaffolding`; do not push to main.

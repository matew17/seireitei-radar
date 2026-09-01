# Feature Specification: Improve Application Scaffolding

**Feature Branch**: `002-improve-app-scaffolding`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Improve the scaffolding of the app and future generated code by adopting a better folder convention for the currently root-level files in squads, and include instructions for future implementations. Applicable rules: none."

## Clarifications

### Session 2026-09-01

- Q: Which bounded-context folder convention should future implementations use? -> A: Responsibility folders: `controllers`, `services`, `repositories`, `dto`; module file remains at context root.
- Q: Where should the required folder convention be recorded so future implementations reliably follow it? -> A: Add the convention to `AGENTS.md`.
- Q: Should DTOs be a root-level `dto/` folder or live within `controllers/dto/`? -> A: Root-level `<context>/dto/`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate a Bounded Context (Priority: P1)

A developer can locate each responsibility in the existing Squad bounded context through a consistent folder layout, making the codebase easier to understand and maintain.

**Why this priority**: The existing context demonstrates and validates the convention that future work will follow.

**Independent Test**: Can be fully tested by inspecting the Squad bounded context and locating its interface, application, persistence, and composition responsibilities using the documented convention.

**Acceptance Scenarios**:

1. **Given** the Squad bounded context, **When** a developer needs to find a responsibility, **Then** the responsibility is located in the folder designated for that responsibility by the convention.
2. **Given** the reorganized Squad bounded context, **When** its existing operations are exercised, **Then** they retain their current externally observable behavior.

---

### User Story 2 - Add a Future Bounded Context (Priority: P2)

A developer implementing a future bounded context can follow written project instructions to place new code consistently from the start.

**Why this priority**: A one-time reorganization has limited value unless later implementations preserve the convention.

**Independent Test**: Can be fully tested by using the project instructions to classify representative new interface, application, persistence, and composition code without relying on undocumented team knowledge.

**Acceptance Scenarios**:

1. **Given** a developer begins a new bounded context, **When** they consult the project instructions, **Then** they can determine the required context-level folders and the placement of each responsibility.
2. **Given** a developer adds a new file to an existing bounded context, **When** they consult the project instructions, **Then** they can determine the correct location without placing it at the context root unless the convention explicitly designates it there.

---

### Edge Cases

- A bounded context containing only one responsibility still follows the established layout without adding empty folders.
- Files that combine multiple responsibilities are split or assigned according to their primary responsibility so their location remains predictable.
- Tests remain co-located or otherwise consistently discoverable with the responsibility they verify.
- Existing imports and externally visible behavior remain valid after files move.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST use responsibility folders named `controllers`, `services`, `repositories`, and `dto` within each bounded context; the bounded-context module file remains at the context root.
- **FR-002**: The Squad bounded context MUST be reorganized to conform to the defined convention.
- **FR-003**: The reorganized Squad bounded context MUST preserve its current externally observable behavior.
- **FR-004**: The project MUST provide implementation instructions in `AGENTS.md` that state where future bounded-context code and its tests belong.
- **FR-005**: The implementation instructions MUST align with the project architecture principles, including thin interfaces, application-level business behavior, and persistence access boundaries.
- **FR-006**: The convention MUST avoid requiring empty folders when a bounded context has no code for a responsibility.
- **FR-007**: The convention MUST state how cross-cutting or shared code is handled so it is not incorrectly placed inside an unrelated bounded context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can locate each of the four defined responsibility types in the Squad bounded context in one folder lookup.
- **SC-002**: 100% of reorganized Squad operations retain their existing observable behavior.
- **SC-003**: A developer can classify and place representative interface, application, persistence, composition, test, and shared-code additions using only the project instructions.
- **SC-004**: The project has one documented convention with no conflicting placement guidance for bounded-context code.

## Assumptions

- The scope is limited to the existing Squad bounded context as the migration example and to guidance for future bounded contexts; unrelated contexts are not reorganized in this feature.
- Existing externally observable API and domain behavior must remain unchanged.
- The project architecture principles remain the source of truth for responsibility boundaries.
- The requested convention applies to production code and tests created for future bounded contexts.

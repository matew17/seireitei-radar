# Feature Specification: Auto-Assign Squad

**Feature Branch**: `005-auto-assign-squad`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Add an API to automatically assign a squad to a threat alert based on availability and threat level. Applicable rules: BR-01, BR-03, BR-04, BR-05, BR-06, BR-07."

## Clarifications

### Session 2026-09-02

- Q: What should happen to a squad's availability after it is automatically assigned to an alert? -> A: Keep the squad available after assignment.
- Q: When several squads are eligible, which squad should automatic assignment choose? -> A: Choose the lowest squad number.
- Q: What outcome should the API provide when no eligible squad exists? -> A: Return no-squad-available; leave alert pending.
- Q: Which alert states may receive an automatic squad assignment? -> A: Pending and unassigned alerts only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatically Assign a Squad (Priority: P1)

Operations staff can request automatic assignment for a reported threat so the alert is assigned to a squad that is currently available and capable of responding.

**Why this priority**: Rapidly assigning an appropriate response squad is the core operational value of the feature.

**Independent Test**: Can be fully tested by requesting assignment for a pending alert with eligible and ineligible squads, then verifying the alert is assigned only to a squad that is available and has sufficient threat capability.

**Acceptance Scenarios**:

1. **Given** a pending, unassigned alert and one eligible squad, **When** operations staff requests automatic assignment, **Then** the alert is assigned to that squad. Covers BR-01, BR-03, BR-04, and BR-05.
2. **Given** a pending, unassigned alert and several eligible squads, **When** operations staff requests automatic assignment, **Then** the system assigns the eligible squad with the lowest squad number. Covers BR-01, BR-03, BR-04, BR-05, and BR-06.
3. **Given** a pending, unassigned alert and squads that are unavailable or cannot handle its threat level, **When** operations staff requests automatic assignment, **Then** no ineligible squad is assigned, the alert remains pending and unassigned, and the result reports that no squad is available. Covers BR-01, BR-03, BR-04, and BR-05.
4. **Given** an alert that is already assigned or resolved, **When** operations staff requests automatic assignment, **Then** the system does not change its assignment. Covers BR-07.

---

### User Story 2 - Receive an Assignment Result (Priority: P2)

Operations staff receive the resulting alert and assignment outcome so they can immediately coordinate the selected squad or handle an alert that cannot yet be staffed.

**Why this priority**: Staff need an explicit outcome to act safely after requesting assignment.

**Independent Test**: Can be fully tested by requesting assignment for an alert with eligible squads and for one without eligible squads, then verifying the documented outcome for each request.

**Acceptance Scenarios**:

1. **Given** an eligible squad is assigned, **When** operations staff requests automatic assignment, **Then** the result identifies the alert and its assigned squad.
2. **Given** no eligible squad exists, **When** operations staff requests automatic assignment, **Then** the system reports that no squad is available and leaves the alert pending and unassigned. Covers BR-01 and BR-05.
3. **Given** an alert identity does not exist, **When** operations staff requests automatic assignment, **Then** the system reports that the alert was not found.

---

### Edge Cases

- An unavailable squad is never automatically assigned, even if it can handle the alert's threat level. Covers BR-01 and BR-05.
- A squad whose maximum capability is lower than the alert's threat level is never automatically assigned. Covers BR-01, BR-03, and BR-05.
- A valid assignment must retain the alert's valid threat level. Covers BR-04.
- Automatic assignment does not change the selected squad's availability, so it may remain eligible for later assignment requests. Covers BR-05.
- An already assigned or resolved alert cannot receive an automatic assignment. Covers BR-07.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow operations staff to request automatic squad assignment for a threat alert by its identity.
- **FR-002**: The system MUST assign only a squad that is available and whose maximum threat capability is at least the alert's threat level at the time of assignment. Covers BR-01, BR-03, BR-04, and BR-05.
- **FR-003**: The system MUST record the selected squad on the alert and identify the alert as assigned after a successful assignment.
- **FR-004**: When multiple squads are eligible, the system MUST select the squad with the lowest squad number. Covers BR-01, BR-05, and BR-06.
- **FR-005**: When no squad is eligible, the system MUST report that no squad is available and leave the alert pending and unassigned. Covers BR-01 and BR-05.
- **FR-006**: The system MUST evaluate the selected squad's availability at the time of each assignment request without changing that availability after assignment. Covers BR-05.
- **FR-007**: The system MUST report a not-found outcome when automatic assignment is requested for an alert identity that does not exist.
- **FR-008**: The system MUST allow automatic assignment only for a pending, unassigned alert and MUST leave assigned or resolved alerts unchanged. Covers BR-07.

### Key Entities *(include if feature involves data)*

- **Threat Alert**: A reported threat with a valid threat level, operational status, and optional assigned squad.
- **Squad**: A response unit whose availability and maximum threat capability determine automatic-assignment eligibility.
- **Automatic Assignment**: The outcome that associates one eligible squad with a threat alert and records the alert's assigned state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful automatic assignments select a squad eligible under BR-01 and BR-05.
- **SC-002**: 100% of automatic-assignment attempts leave alerts without a valid assignment when no eligible squad exists, with the specified outcome clearly communicated to operations staff.
- **SC-003**: 100% of successful automatic assignments leave the selected squad's recorded availability unchanged. Covers BR-05.
- **SC-004**: Operations staff can identify the assigned squad or the no-assignment outcome from every automatic-assignment request.

## Assumptions

- Operations staff are the intended consumers of the automatic-assignment interface.
- Authentication and authorization are outside this feature's scope.
- Assignment is requested after a threat alert has been reported; alert creation does not automatically trigger assignment.
- Existing valid squad capabilities and alert threat levels continue to be governed by BR-03 and BR-04.
- Automatic assignment applies only to pending, unassigned alerts.

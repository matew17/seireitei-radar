# Feature Specification: Return Threat Candidates

**Feature Branch**: `004-return-threat-candidates`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "I want to return the squads candidates to be associated to a threat. Right now, the POST does check the squads repo, but do not return that as part of the response. We should also return it if the level is updated when updating a threat. Applicable rules: BR-01, BR-04."

## Clarifications

### Session 2026-09-01

- Q: What details should each returned candidate squad include? -> A: Full existing squad representation.
- Q: Should the system return candidates whenever an update request includes a valid severity, even if that severity equals the threat's current severity? -> A: Return candidates whenever severity is submitted.
- Q: What should the response field containing eligible squads be named? -> A: candidateSquads.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive Candidates for a New Threat (Priority: P1)

Operations staff receive the squads that can respond when they report a threat, so they can make an informed assignment decision without a separate eligibility lookup.

**Why this priority**: A candidate lookup already occurs during threat reporting; returning its result makes the core operational outcome available to the caller.

**Independent Test**: Can be fully tested by reporting a valid threat with eligible and ineligible squads, then verifying the response includes exactly every eligible squad.

**Acceptance Scenarios**:

1. **Given** available squads capable of the reported threat level and squads that are unavailable or insufficiently capable, **When** operations staff reports a valid threat, **Then** the response includes the saved threat and a `candidateSquads` collection containing exactly the eligible squads using the established full squad representation. Covers BR-01 and BR-04.
2. **Given** no available squad can handle the reported threat level, **When** operations staff reports a valid threat, **Then** the response includes the saved threat and an empty `candidateSquads` collection. Covers BR-01 and BR-04.

---

### User Story 2 - Refresh Candidates After Severity Change (Priority: P2)

Operations staff receive the squads currently capable of responding when they submit a threat severity, so they can reassess assignment options using that severity.

**Why this priority**: Changing severity can change squad eligibility and must provide current operational information.

**Independent Test**: Can be fully tested by updating a known threat with a severity and verifying the response includes exactly the squads eligible for its saved severity.

**Acceptance Scenarios**:

1. **Given** a threat exists and available squads have varying maximum capabilities, **When** operations staff submits a valid threat severity, **Then** the response includes the updated threat and a `candidateSquads` collection containing exactly the squads eligible for its saved severity using the established full squad representation, including when the submitted severity equals the existing severity. Covers BR-01 and BR-04.
2. **Given** a threat update changes only location, **When** operations staff submits the update, **Then** the response behavior follows the existing threat-update response contract and does not perform a new candidate lookup.
3. **Given** a severity outside levels 1, 2, and 3, **When** operations staff creates or updates a threat, **Then** the request is rejected and no candidate result is returned. Covers BR-04.

---

### Edge Cases

- Candidate results exclude unavailable squads and squads whose maximum capability is below the applicable threat severity. Covers BR-01.
- A valid creation or update that submits severity can return an empty `candidateSquads` collection.
- Updating a threat without submitting severity does not require recalculating candidates.
- An invalid severity leaves the threat unchanged and returns no candidate result. Covers BR-04.
- A missing threat identity on update continues to produce the established not-found outcome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When operations staff creates a valid threat, the system MUST return the saved threat with a `candidateSquads` collection containing all squads eligible for its threat severity. Covers BR-01 and BR-04.
- **FR-002**: Each returned `candidateSquads` entry MUST use the established full squad representation, be available, and have a maximum threat capability at least equal to the applicable threat severity. Covers BR-01.
- **FR-003**: When operations staff updates a threat and submits a valid severity, the system MUST return the updated threat with a `candidateSquads` collection containing all squads eligible for its saved severity, including when the submitted severity equals the existing severity. Covers BR-01 and BR-04.
- **FR-004**: When an update does not submit a threat severity, the system MUST preserve the established update response behavior and MUST NOT return a `candidateSquads` collection or recalculate candidates.
- **FR-005**: When no squad is eligible, the system MUST return an empty `candidateSquads` collection rather than omit the candidate result for a creation or update that submits severity. Covers BR-01.
- **FR-006**: The system MUST reject a threat creation or severity update outside levels 1, 2, and 3 without returning candidates or persisting an invalid severity. Covers BR-04.

### Key Entities *(include if feature involves data)*

- **Threat Alert**: A reported threat whose severity determines candidate squad eligibility.
- **Candidate Squad**: A squad returned with a threat creation or update that submits severity because it is available and capable of handling that threat's severity under BR-01.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid threat-creation responses include exactly the squads eligible under BR-01.
- **SC-002**: 100% of valid update responses that submit severity include exactly the squads eligible for the saved severity under BR-01.
- **SC-003**: 100% of valid creations and updates that submit severity with no eligible squads return an empty `candidateSquads` collection.
- **SC-004**: 100% of create and update requests with severity outside levels 1, 2, and 3 are rejected without saving an invalid severity or returning candidates. Covers BR-04.

## Assumptions

- Operations staff consume threat creation and update results.
- Candidate eligibility uses the existing BR-01 conditions and does not assign a squad or alter squad availability.
- Candidate squads use the existing full squad representation.
- Candidate squads are exposed in a response field named `candidateSquads`.
- Candidate results reflect the squads available at the time the threat action is processed.
- The existing threat-alert creation and update response fields remain unchanged aside from adding candidates where required.
- Authentication, authorization, squad assignment, and changes to candidate eligibility criteria are outside this feature's scope.

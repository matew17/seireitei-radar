# Feature Specification: ThreatAlert CRUD

**Feature Branch**: `003-threatalert-crud`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Plan the ThreatAlert creation CRUD only. Applicable rules: BR-01, BR-04."

## Clarifications

### Session 2026-09-01

- Q: Which ThreatAlert fields may operations staff update after creation? -> A: Severity and location only.
- Q: When operations staff remove a ThreatAlert, should the system permanently delete it or mark it resolved? -> A: Mark it resolved and include it in lists.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Report a Threat (Priority: P1)

Operations staff can report a threat with its severity and location so response operations can identify capable, available squads.

**Why this priority**: Recording a valid threat and identifying its eligible responders is the core operational value of the feature.

**Independent Test**: Can be fully tested by reporting a valid threat and verifying that it is stored with a generated identity, pending status, and the eligible squads required by BR-01 are identified.

**Acceptance Scenarios**:

1. **Given** a threat severity of 1, 2, or 3 and a location, **When** operations staff reports a threat, **Then** the system stores a pending, unassigned threat with a generated identity. Covers BR-04.
2. **Given** available squads whose maximum threat capability is at least the reported severity and other squads that are unavailable or insufficiently capable, **When** operations staff reports a threat, **Then** the system identifies every eligible squad and excludes every ineligible squad. Covers BR-01.
3. **Given** a threat severity outside levels 1, 2, and 3, **When** operations staff reports the threat, **Then** the system rejects it without storing an alert. Covers BR-04.

---

### User Story 2 - View Threat Alerts (Priority: P2)

Operations staff can view all reported threats or a specific threat so they can monitor the current threat record and its reported location.

**Why this priority**: Operations cannot act on reported threats without reliable visibility into them.

**Independent Test**: Can be fully tested by creating alert records, retrieving the complete alert list, and retrieving one alert by its identity.

**Acceptance Scenarios**:

1. **Given** multiple threat alerts exist, **When** operations staff requests the alert list, **Then** the system returns every alert with its stored identity, severity, location, status, squad reference when present, and creation time.
2. **Given** a threat alert exists, **When** operations staff requests it by identity, **Then** the system returns its stored details.
3. **Given** no threat alert exists for a requested identity, **When** operations staff requests it, **Then** the system reports that the alert was not found.

---

### User Story 3 - Maintain Threat Alerts (Priority: P3)

Operations staff can correct or retire threat alert records so operational information remains accurate.

**Why this priority**: Reported details can require correction, while the intended handling of completed or removed alerts must preserve an accurate operational record.

**Independent Test**: Can be fully tested by updating a known alert according to the approved mutable fields, then performing the approved removal action and verifying its resulting visibility and status.

**Acceptance Scenarios**:

1. **Given** a pending, unassigned threat alert exists, **When** operations staff corrects its severity or location, **Then** the system stores and returns the corrected alert while preserving omitted details; updates cannot assign a squad or change its status.
2. **Given** a threat alert exists, **When** operations staff removes it, **Then** the system marks it resolved and continues to include it in alert lists.
3. **Given** no threat alert exists for a requested update or removal identity, **When** operations staff attempts the action, **Then** the system reports that the alert was not found.

---

### Edge Cases

- A new threat alert starts pending and has no squad assigned.
- Requests missing severity or either location coordinate are rejected without creating or changing an alert.
- A severity outside levels 1, 2, and 3 is rejected without storing or changing an alert. Covers BR-04.
- The creation eligibility lookup includes only squads that are available and can handle the reported severity. Covers BR-01.
- Alert identities and creation times are system-generated.
- Assignment of an eligible squad during alert creation is out of scope; BR-01 requires identifying eligible squads only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow operations staff to create a threat alert with a threat severity and location.
- **FR-002**: System MUST assign a unique identity and creation time to each new alert, start it pending, and leave it unassigned.
- **FR-003**: System MUST enforce that a threat alert severity is only level 1, 2, or 3. Covers BR-04.
- **FR-004**: When creating a threat alert, the system MUST identify all squads that are available and whose maximum threat capability is at least the alert severity. Covers BR-01.
- **FR-005**: System MUST allow operations staff to retrieve all threat alerts and a threat alert by identity.
- **FR-006**: System MUST allow operations staff to update any subset of a threat alert's severity and location while preserving omitted values; updates MUST NOT change status or squad assignment.
- **FR-007**: System MUST allow operations staff to remove a threat alert by identity by marking it resolved; resolved alerts MUST remain in alert list results.
- **FR-008**: System MUST report a not-found outcome when retrieving, updating, or removing an alert identity that does not exist.
- **FR-009**: System MUST reject create and update requests that omit required fields or provide invalid values.
- **FR-010**: System MUST not expose internal persistence error details to clients when validation or not-found failures occur.

### Key Entities *(include if feature involves data)*

- **Threat Alert**: A reported threat with a system-generated identity, severity, geographic location, operational status, optional assigned squad, and creation time.
- **Squad**: A response unit whose availability and maximum threat capability determine its eligibility when a threat is created under BR-01.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operations staff can report a valid threat in one request and immediately retrieve the saved alert by its identity.
- **SC-002**: 100% of valid alert creations identify exactly the squads eligible under BR-01.
- **SC-003**: 100% of create and update attempts with severity outside levels 1, 2, and 3 are rejected without creating or changing an alert. Covers BR-04.
- **SC-004**: Operations staff can retrieve every stored alert and any existing alert by identity.
- **SC-005**: 100% of not-found retrieve, update, and removal attempts return a clear not-found outcome without exposing internal persistence details.

## Assumptions

- Operations staff are the intended consumers of the threat alert management interface.
- Authentication and authorization are outside this feature's scope.
- Alert identity and creation time are system-generated and immutable.
- Alert creation does not assign a squad or change squad availability; it only performs the BR-01 eligibility lookup.
- Threat alert updates are limited to severity and location; status changes and squad assignment are outside this feature's scope.
- Removing a threat alert marks it resolved and retains it in alert list results.

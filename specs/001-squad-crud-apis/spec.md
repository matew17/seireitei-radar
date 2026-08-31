# Feature Specification: Squad CRUD APIs

**Feature Branch**: `001-squad-crud-apis`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Create the CRUD APIs for a Squad based on prisma/schema.prisma. Applicable rules: BR-01, BR-02, BR-03."

## Clarifications

### Session 2026-08-31

- Q: When removing a squad, should the system permanently delete the squad record or only mark it unavailable? -> A: Mark squads unavailable.
- Q: Should the squad roster include squads that have been removed by being marked unavailable? -> A: Include all squads.
- Q: When updating a squad, should callers be allowed to send only the fields they want to change? -> A: Allow partial updates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register a Squad (Priority: P1)

Operations staff can register a squad with its squad number, captain name, availability, maximum threat capability, and current coordinates so the squad can be considered for threat response workflows.

**Why this priority**: Squad records must exist before they can be listed, maintained, or used by alert assignment behavior governed by BR-01.

**Independent Test**: Can be fully tested by submitting valid squad details and verifying the saved squad is returned with a generated identity and the same operational values.

**Acceptance Scenarios**:

1. **Given** valid squad details with a new squad number, **When** operations staff registers the squad, **Then** the system stores the squad and returns the created squad record.
2. **Given** squad details with a squad number already used by another squad, **When** operations staff registers the squad, **Then** the system rejects the request without creating a duplicate squad. Covers BR-02.
3. **Given** squad details with a maximum threat capability outside levels 1, 2, and 3, **When** operations staff registers the squad, **Then** the system rejects the request without creating the squad. Covers BR-03.

---

### User Story 2 - View Squads (Priority: P2)

Operations staff can retrieve squad records, either as a complete roster or by a specific squad identity, so they can inspect current squad capacity and location.

**Why this priority**: Visibility into registered squads is necessary for operational oversight and for validating that squads eligible under BR-01 have accurate data.

**Independent Test**: Can be fully tested by creating squad records, retrieving the roster, and retrieving one known squad by identity.

**Acceptance Scenarios**:

1. **Given** multiple squads exist including unavailable squads, **When** operations staff requests the squad roster, **Then** the system returns all squads with their stored operational fields.
2. **Given** a squad exists, **When** operations staff requests that squad by identity, **Then** the system returns that squad record.
3. **Given** no squad exists for a requested identity, **When** operations staff requests that squad, **Then** the system reports that the squad was not found.

---

### User Story 3 - Maintain Squad Details (Priority: P3)

Operations staff can update or remove squad records so the roster reflects current captain assignment, availability, threat capability, and position.

**Why this priority**: Squad data changes over time, and stale records can cause incorrect eligibility decisions for BR-01.

**Independent Test**: Can be fully tested by updating a known squad, verifying the changed values, removing the squad, and verifying it remains retrievable and listed with `isAvailable: false`.

**Acceptance Scenarios**:

1. **Given** a squad exists, **When** operations staff updates one or more mutable details with valid values, **Then** the system stores and returns the updated squad record while preserving omitted fields.
2. **Given** an update would reuse another squad's number, **When** operations staff updates the squad, **Then** the system rejects the change and preserves unique squad numbers. Covers BR-02.
3. **Given** an update sets maximum threat capability outside levels 1, 2, and 3, **When** operations staff updates the squad, **Then** the system rejects the change and preserves the prior valid value. Covers BR-03.
4. **Given** a squad exists, **When** operations staff removes it, **Then** the system marks the squad unavailable so it no longer qualifies as available for future threat assignment eligibility.
5. **Given** no squad exists for a requested update or removal identity, **When** operations staff attempts the action, **Then** the system reports that the squad was not found.

---

### Edge Cases

- A squad created without explicitly setting availability is available by default.
- Requests missing required squad fields are rejected without creating or changing a squad.
- Captain name cannot be blank.
- Squad coordinates must be provided as numeric latitude and longitude values.
- Squad maximum threat capability and availability determine eligibility for threat assignment queries under BR-01.
- Removing a squad is represented by marking it unavailable rather than permanently deleting its record.
- Squad roster results include all squads, including squads marked unavailable through removal.
- Squad updates may include only the fields being changed; omitted fields are preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow operations staff to create a squad with squad number, captain name, availability, maximum threat capability, current latitude, and current longitude.
- **FR-002**: System MUST assign a unique identity to each created squad.
- **FR-003**: System MUST default a newly created squad to available when availability is omitted.
- **FR-004**: System MUST enforce that squad numbers are unique across all squads. Covers BR-02.
- **FR-005**: System MUST enforce that maximum threat capability is only level 1, 2, or 3. Covers BR-03.
- **FR-006**: System MUST allow operations staff to retrieve a roster of all squads, including squads marked unavailable through removal.
- **FR-007**: System MUST allow operations staff to retrieve a squad by identity.
- **FR-008**: System MUST allow operations staff to update any subset of mutable squad details: squad number, captain name, availability, maximum threat capability, current latitude, and current longitude.
- **FR-009**: System MUST allow operations staff to remove a squad by identity by marking the squad unavailable rather than permanently deleting the record.
- **FR-010**: System MUST report a not-found outcome when retrieving, updating, or removing a squad identity that does not exist.
- **FR-011**: System MUST reject create and update requests that omit required fields or provide invalid values.
- **FR-012**: System MUST preserve squad availability and maximum threat capability fields so threat creation can query squads eligible under BR-01.
- **FR-013**: System MUST not expose internal persistence error details to clients when validation, uniqueness, or not-found failures occur.

### Key Entities *(include if feature involves data)*

- **Squad**: A response unit with a unique identity, unique squad number, captain name, availability status, maximum threat capability level, current latitude, and current longitude.
- **Threat Alert**: An existing alert record that may reference a squad; squad availability and maximum threat capability are used by threat creation eligibility behavior covered by BR-01.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operations staff can create a valid squad record in one request and immediately retrieve it from the roster.
- **SC-002**: 100% of duplicate squad number create and update attempts are rejected without changing existing squad records. Covers BR-02.
- **SC-003**: 100% of create and update attempts with maximum threat capability outside levels 1, 2, or 3 are rejected without changing existing squad records. Covers BR-03.
- **SC-004**: Operations staff can retrieve, update, and remove an existing squad using its identity, with removal visible as the squad no longer being available while remaining present in roster results.
- **SC-005**: 100% of not-found retrieve, update, and remove attempts return a clear not-found outcome without exposing internal persistence details.

## Assumptions

- Operations staff are the intended consumers of the squad management interface.
- Authentication and authorization behavior is outside the scope of this feature unless clarified otherwise.
- Squad identity is system-generated and used for lookup, update, and removal.
- Removing a squad is intended to preserve the squad record while making it unavailable for future operations.
- This feature does not change threat alert creation or assignment behavior beyond preserving the squad fields used by BR-01.

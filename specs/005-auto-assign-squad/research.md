# Research: Auto-Assign Squad

## Assignment Endpoint

**Decision**: Use `POST /threat-alerts/{id}/assign` with no request body.

**Rationale**: Assignment changes the alert's operational state and is not a partial update of its reported details. A named action avoids expanding the existing PATCH contract, which explicitly permits only threat level and coordinates.

**Alternatives considered**:

- Add `squadId` to the update endpoint: rejected because assignment is automatic and existing update rules prohibit assignment changes.
- Assign during alert creation: rejected because the feature scope requires an explicit automatic-assignment request.

## Selection And Outcomes

**Decision**: Query eligible squads ordered by ascending unique squad number; assign the first. Return the assigned alert on success. Use the existing `ConflictError` for no eligible squad and for an alert that is not pending and unassigned; use `NotFoundError` for a missing alert.

**Rationale**: The clarified BR-06 defines a deterministic selection rule. The existing global domain-error filter maps conflicts safely to HTTP 409 and not-found to HTTP 404.

**Alternatives considered**:

- Nearest squad: rejected because no distance policy was approved.
- Successful no-op when no squad qualifies: rejected by the clarification requiring an explicit no-squad-available result.

## Database Enforcement

**Decision**: Add a versioned PostgreSQL migration containing a PostgreSQL constraint trigger that validates automatic assignment transitions.

**Rationale**: BR-05 requires eligibility at assignment time, and BR-07 limits assignment to pending, unassigned alerts. A cross-row squad availability/capability condition cannot be expressed by a simple check constraint, so a database constraint trigger must lock and validate the referenced squad while enforcing the transition from `PENDING` with no squad to `ASSIGNED` with a squad. This meets the constitution's database-enforcement requirement for concurrency-sensitive invariants. The trigger does not modify `Squad.isAvailable`, honoring the clarification that assigned squads remain available.

**Alternatives considered**:

- Service-only validation: rejected because concurrent updates could bypass the invariant and the constitution requires database enforcement.
- Marking the squad unavailable: rejected by the explicit clarification.
- A foreign key alone: rejected because it cannot validate availability, capability, or alert lifecycle.

## Validation And Tests

**Decision**: Validate the route parameter with a class-validator DTO, test service decision branches with mocked repositories, and test all BR-01 and BR-03 through BR-07 persistence and HTTP behavior with PostgreSQL-backed e2e/contract tests.

**Rationale**: This follows the project constitution: input validation occurs in DTOs, service tests name rule IDs, and concurrency/exclusivity-related persistence behavior is verified against real PostgreSQL.

**Alternatives considered**:

- Controller-only validation: rejected by the DTO requirement.
- Mock-only rule tests: rejected for database-enforced BR-05 behavior.
